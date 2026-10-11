/**
 * Vérifications de bout en bout sur le site compilé (next build && next start), lancées par la CI :
 * en-têtes de sécurité, protection de l'espace admin, absence de violation de la CSP.
 * Usage : BASE=http://localhost:3000 node tests/smoke.e2e.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const results = [];
const ok = (cond, msg) => results.push(`${cond ? "OK   " : "ÉCHEC"} ${msg}`);

// 1. En-têtes de sécurité
const home = await fetch(BASE + "/", { redirect: "manual" });
const csp = home.headers.get("content-security-policy") ?? "";
ok(home.status === 200, `accueil : HTTP ${home.status}`);
ok(csp.includes("frame-ancestors 'none'") && csp.includes("object-src 'none'"), "CSP présente");
ok(!csp.includes("unsafe-eval"), "CSP sans 'unsafe-eval' en production");
ok(home.headers.get("x-frame-options") === "DENY", "X-Frame-Options: DENY");
ok((home.headers.get("strict-transport-security") ?? "").includes("max-age="), "HSTS");
ok(home.headers.get("x-content-type-options") === "nosniff", "nosniff");
ok((home.headers.get("permissions-policy") ?? "").includes("camera=(self)"), "caméra limitée au site");
ok(!home.headers.get("x-powered-by"), "pas d'en-tête X-Powered-By");

// 2. Espace admin protégé (y compris les requêtes de données internes de Next.js)
for (const [label, headers] of [
  ["page", {}],
  ["données RSC", { RSC: "1", "Next-Router-State-Tree": encodeURIComponent(JSON.stringify(["", { children: ["admin", {}] }])) }],
]) {
  for (const p of ["/admin", "/admin/rendez-vous", "/admin/teleconsultations/inexistant", "/admin/parametres"]) {
    const r = await fetch(BASE + p, { redirect: "manual", headers });
    ok(r.status >= 300 && r.status < 400 && (r.headers.get("location") ?? "").includes("/admin/connexion"), `${p} (${label}) sans session → connexion (${r.status})`);
  }
}
const fakeCookie = await fetch(BASE + "/admin", { redirect: "manual", headers: { cookie: "cabinet_admin=eyJleHAiOjk5OTk5OTk5OTk5OTl9.faux" } });
ok(fakeCookie.status >= 300 && fakeCookie.status < 400, "cookie de session falsifié refusé");
for (const api of ["/api/admin/dashboard", "/api/admin/appointments", "/api/admin/teleconsultations"]) {
  const r = await fetch(BASE + api);
  ok(r.status === 401, `${api} sans session → 401 (${r.status})`);
}
const cron = await fetch(BASE + "/api/cron");
ok(cron.status === 401, `tâche planifiée sans secret → 401 (${cron.status})`);
const csrf = await fetch(BASE + "/api/admin/login", { method: "POST", headers: { origin: "https://pirate.example", "content-type": "application/json" }, body: JSON.stringify({ password: "x" }) });
ok(csrf.status === 403, `connexion depuis un autre site → 403 (${csrf.status})`);

// 3. Navigateur : pages sans violation de CSP, connexion admin fonctionnelle
const browser = await chromium.launch();
const page = await browser.newPage();
const violations = [];
page.on("console", (m) => {
  const t = m.text();
  if (/Content Security Policy|Refused to/i.test(t)) violations.push(`${page.url()} : ${t.slice(0, 200)}`);
});
page.on("pageerror", (e) => violations.push(`${page.url()} : ${e.message}`));
for (const p of ["/", "/rendez-vous", "/contact", "/teleconsultation", "/soins", "/cabinet", "/mon-bilan-prevention", "/admin/connexion"]) {
  const r = await page.goto(BASE + p, { waitUntil: "networkidle" });
  ok(r?.status() === 200, `${p} : HTTP ${r?.status()}`);
}
// carte affichée à la demande (iframe OpenStreetMap autorisée par la CSP)
await page.goto(BASE + "/contact", { waitUntil: "networkidle" });
const mapBtn = page.getByRole("button", { name: "Afficher la carte" });
if (await mapBtn.count()) {
  await mapBtn.first().click();
  await page.waitForTimeout(1500);
}
ok(violations.length === 0, `aucune violation de CSP ni erreur JavaScript${violations.length ? " : " + violations.slice(0, 3).join(" | ") : ""}`);

await page.goto(BASE + "/admin/connexion", { waitUntil: "networkidle" });
await page.fill("#admin-password", process.env.ADMIN_PASSWORD);
await page.getByRole("button", { name: "Se connecter" }).click();
await page.waitForURL(BASE + "/admin", { timeout: 15000 });
ok(await page.getByText("Tableau de bord").count() > 0, "connexion admin puis tableau de bord");
const tele = await page.goto(BASE + "/admin/teleconsultations", { waitUntil: "networkidle" });
ok(tele?.status() === 200, "page admin Téléconsultations accessible une fois connecté");
await browser.close();

console.log(results.join("\n"));
if (results.some((r) => r.startsWith("ÉCHEC"))) process.exit(1);
