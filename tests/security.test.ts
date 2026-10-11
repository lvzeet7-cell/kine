/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests de sécurité (sans réseau externe) :
 * - session admin : signature, expiration, falsification, invalidation au changement de mot de passe ;
 * - limitation des tentatives persistante (mémoire, SQLite, Turso simulé) ;
 * - contrôle d'origine (CSRF), adresse IP, comparaison à durée constante ;
 * - routes : connexion admin limitée, formulaire de contact protégé, tâche planifiée protégée.
 * Lancer : npm run test:security   (Node 22.5+)
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "secu-test-"));
process.env.DATABASE_PATH = path.join(tmp, "cabinet.db");
process.env.ADMIN_PASSWORD = "mot-de-passe-de-test-tres-long";
process.env.SESSION_SECRET = "secret-de-session-de-test-0123456789abcdef";
process.env.CRON_SECRET = "cron-secret-de-test-0123456789";
delete process.env.TURSO_DATABASE_URL;
delete process.env.VERCEL;

async function main() {
  const { createSession, verifySession, checkPassword, sessionCookie } = await import("@/lib/auth");
  const { sameOrigin, clientIp, safeEqual } = await import("@/lib/http");
  const { tooManyAttempts } = await import("@/lib/rate-limit");
  const { MemoryRepository } = await import("@/lib/booking/memory-repository");
  const { SqliteRepository } = await import("@/lib/booking/sqlite-repository");
  const { LibsqlRepository } = await import("@/lib/booking/libsql-repository");
  const { TursoHttpExecutor } = await import("@/lib/booking/libsql");
  const { startMock } = await import("./hrana_mock");

  let passed = 0;
  async function t(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      passed++;
    } catch (e) {
      console.log("ÉCHEC", name, e);
      process.exitCode = 1;
    }
  }

  /* ---------- Session admin ---------- */
  await t("session valide acceptée", async () => {
    assert.equal(await verifySession(await createSession()), true);
  });
  await t("session falsifiée refusée", async () => {
    const s = await createSession();
    const [payload] = s.split(".");
    const forged = Buffer.from(JSON.stringify({ exp: Date.now() + 10 * 365 * 86400_000 })).toString("base64url");
    assert.equal(await verifySession(`${forged}.${s.split(".")[1]}`), false);
    assert.equal(await verifySession(`${payload}.AAAA`), false);
    assert.equal(await verifySession("n'importe quoi"), false);
    assert.equal(await verifySession(""), false);
  });
  await t("session expirée refusée", async () => {
    const realNow = Date.now;
    const s = await createSession();
    Date.now = () => realNow() + 9 * 3_600_000;
    try {
      assert.equal(await verifySession(s), false);
    } finally {
      Date.now = realNow;
    }
  });
  await t("changer le mot de passe déconnecte les sessions ouvertes", async () => {
    const s = await createSession();
    const old = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = "un-autre-mot-de-passe-long";
    try {
      assert.equal(await verifySession(s), false);
    } finally {
      process.env.ADMIN_PASSWORD = old;
    }
    assert.equal(await verifySession(s), true);
  });
  await t("mot de passe : bon accepté, mauvais refusé, type invalide refusé", async () => {
    assert.equal(await checkPassword("mot-de-passe-de-test-tres-long"), true);
    assert.equal(await checkPassword("mot-de-passe-de-test-tres-lon"), false);
    assert.equal(await checkPassword({ toString: () => "x" }), false);
    assert.equal(await checkPassword(undefined), false);
  });
  await t("mot de passe trop court : espace admin désactivé", async () => {
    const old = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = "court";
    try {
      assert.equal(await checkPassword("court"), false);
      assert.equal(await verifySession(await createSession()), false);
    } finally {
      process.env.ADMIN_PASSWORD = old;
    }
  });
  await t("cookie de session : HttpOnly, SameSite=Strict, durée 8 h", () => {
    const c = sessionCookie("abc");
    assert.match(c, /HttpOnly/);
    assert.match(c, /SameSite=Strict/);
    assert.match(c, /Max-Age=28800/);
  });

  /* ---------- CSRF, IP, comparaison ---------- */
  const req = (h: Record<string, string>) => new Request("https://site.fr/api/x", { method: "POST", headers: h });
  await t("contrôle d'origine (CSRF)", () => {
    assert.equal(sameOrigin(req({ origin: "https://site.fr", host: "site.fr" })), true);
    assert.equal(sameOrigin(req({ origin: "https://pirate.example", host: "site.fr" })), false);
    assert.equal(sameOrigin(req({ origin: "null", host: "site.fr" })), false);
    assert.equal(sameOrigin(req({ "sec-fetch-site": "cross-site", host: "site.fr" })), false);
  });
  await t("adresse IP : en-têtes de la plateforme prioritaires sur x-forwarded-for", () => {
    assert.equal(clientIp(req({ "x-forwarded-for": "6.6.6.6", "x-real-ip": "1.2.3.4" })), "1.2.3.4");
    assert.equal(clientIp(req({ "x-forwarded-for": "6.6.6.6", "x-vercel-forwarded-for": "5.6.7.8" })), "5.6.7.8");
    assert.equal(clientIp(req({ "x-forwarded-for": "9.9.9.9, 6.6.6.6" })), "9.9.9.9");
  });
  await t("comparaison à durée constante", () => {
    assert.equal(safeEqual("abc", "abc"), true);
    assert.equal(safeEqual("abc", "abd"), false);
    assert.equal(safeEqual("abc", "abcd"), false);
  });

  /* ---------- Limitation persistante ---------- */
  async function limiterSuite(label: string, repo: any) {
    await t(`${label} : comptage par fenêtre et par clé`, async () => {
      const now = 1_000_000_000;
      for (let i = 1; i <= 3; i++) assert.equal(await repo.recordHit("k1", now + i, now - 60_000), i);
      assert.equal(await repo.recordHit("k2", now + 4, now - 60_000), 1, "clés indépendantes");
      // hors fenêtre : les anciens passages ne comptent plus
      assert.equal(await repo.recordHit("k1", now + 120_000, now + 60_000), 1);
      assert.ok((await repo.purgeHits(now + 100_000)) >= 1);
    });
  }
  await limiterSuite("mémoire", new MemoryRepository());
  await limiterSuite("SQLite", new SqliteRepository(path.join(tmp, "limit.db")));
  const tf = path.join(tmp, "turso.db");
  const hm = await startMock(tf, 4912);
  const ex = new TursoHttpExecutor("libsql://127.0.0.1:4912", "test-token", ((u: string, i: any) => fetch(u.replace("https://", "http://"), i)) as any);
  await limiterSuite("Turso", await LibsqlRepository.open(ex));
  hm.close();

  await t("limitation partagée : le 9e essai est bloqué, une autre IP ne l'est pas", async () => {
    for (let i = 0; i < 8; i++) assert.equal(await tooManyAttempts("test-login", "10.0.0.1", 8, 60_000), false);
    assert.equal(await tooManyAttempts("test-login", "10.0.0.1", 8, 60_000), true);
    assert.equal(await tooManyAttempts("test-login", "10.0.0.2", 8, 60_000), false);
  });
  await t("aucune IP ni e-mail en clair dans la base", async () => {
    await tooManyAttempts("test-mail", "Patient.Secret@exemple.fr", 3, 60_000);
    const raw = fs.readFileSync(process.env.DATABASE_PATH!).toString("latin1");
    const wal = fs.existsSync(process.env.DATABASE_PATH + "-wal") ? fs.readFileSync(process.env.DATABASE_PATH + "-wal").toString("latin1") : "";
    assert.ok(!raw.includes("10.0.0.1") && !wal.includes("10.0.0.1"));
    assert.ok(!raw.toLowerCase().includes("patient.secret") && !wal.toLowerCase().includes("patient.secret"));
  });

  /* ---------- Routes ---------- */
  const login = await import("@/app/api/admin/login/route");
  const loginReq = (password: string, ip: string, origin = "https://site.fr") =>
    new Request("https://site.fr/api/admin/login", {
      method: "POST",
      headers: { origin, host: "site.fr", "x-real-ip": ip, "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
  await t("connexion admin : bon mot de passe → cookie de session", async () => {
    const r = await login.POST(loginReq("mot-de-passe-de-test-tres-long", "20.0.0.1"));
    assert.equal(r.status, 200);
    assert.match(r.headers.get("set-cookie") ?? "", /cabinet_admin=.+HttpOnly/);
  });
  await t("connexion admin : requête d'un autre site refusée", async () => {
    const r = await login.POST(loginReq("mot-de-passe-de-test-tres-long", "20.0.0.2", "https://pirate.example"));
    assert.equal(r.status, 403);
  });
  await t("connexion admin : force brute bloquée après 8 essais (même avec le bon mot de passe ensuite)", async () => {
    for (let i = 0; i < 8; i++) assert.equal((await login.POST(loginReq("mauvais-" + i, "20.0.0.3"))).status, 401);
    assert.equal((await login.POST(loginReq("mot-de-passe-de-test-tres-long", "20.0.0.3"))).status, 429);
  });

  const contact = await import("@/app/api/contact/route");
  await t("contact : requête d'un autre site refusée", async () => {
    const r = await contact.POST(
      new Request("https://site.fr/api/contact", { method: "POST", headers: { origin: "https://pirate.example", host: "site.fr" }, body: "{}" }),
    );
    assert.equal(r.status, 403);
  });
  await t("contact : corps trop gros ou invalide refusé", async () => {
    const r = await contact.POST(
      new Request("https://site.fr/api/contact", { method: "POST", headers: { origin: "https://site.fr", host: "site.fr", "x-real-ip": "30.0.0.1" }, body: "x".repeat(30_000) }),
    );
    assert.equal(r.status, 400);
  });

  const cron = await import("@/app/api/cron/route");
  await t("tâche planifiée : secret obligatoire", async () => {
    assert.equal((await cron.GET(new Request("https://site.fr/api/cron"))).status, 401);
    assert.equal((await cron.GET(new Request("https://site.fr/api/cron", { headers: { authorization: "Bearer faux" } }))).status, 401);
    assert.equal((await cron.GET(new Request("https://site.fr/api/cron", { headers: { authorization: `Bearer ${process.env.CRON_SECRET}` } }))).status, 200);
  });

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`${passed} tests de sécurité réussis`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
