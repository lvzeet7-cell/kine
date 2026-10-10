/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests de la téléconsultation (règles métier, accès, salles, réglages) sur les 3 stockages :
 * mémoire, SQLite et Turso (serveur Turso et API Daily simulés, aucun appel réseau externe).
 * Lancer : npm run test:tele   (Node 22.5+)
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MemoryRepository } from "@/lib/booking/memory-repository";
import { SqliteRepository } from "@/lib/booking/sqlite-repository";
import { LibsqlRepository } from "@/lib/booking/libsql-repository";
import { TursoHttpExecutor } from "@/lib/booking/libsql";
import type { BookingRepository } from "@/lib/booking/repository";
import * as svc from "@/lib/booking/service";
import { DailyProvider } from "@/lib/video/daily";
import * as tele from "@/lib/teleconsultation/service";
import { getTeleSettings, saveTeleSettings, formatPrice } from "@/lib/teleconsultation/settings";
import { patientConfirmation, patientReminder } from "@/lib/email/templates";
import { startDailyMock, decodeToken } from "./daily_mock";
import { startMock } from "./hrana_mock";

async function main() {
let passed = 0;
async function t(name: string, fn: () => Promise<void> | void) {
  try { await fn(); passed++; } catch (e) { console.log("FAIL", name, e); process.exitCode = 1; }
}
const seed = [2,3,4,5].map((d) => ({ dayOfWeek: d, startTime: "08:30", endTime: "19:30", enabled: true }));
const patient = { firstName: "Marie", lastName: "Test", phone: "0612345678", email: "marie@exemple.fr", message: "", consent: true, website: "" };
const now = new Date("2026-10-01T08:00:00Z");
const SLOT = "2026-10-13T08:00:00.000Z"; // mardi 10:00 Paris
const at = (iso: string, minutes: number) => new Date(Date.parse(iso) + minutes * 60_000);

const daily = await startDailyMock(4901);
const provider = new DailyProvider("test-daily-key", "http://127.0.0.1:4901");
const badProvider = new DailyProvider("wrong-key", "http://127.0.0.1:4901");

async function suite(label: string, repo: BookingRepository) {
  await repo.replaceAvailability(seed);
  process.env.DAILY_API_KEY = "";
  await t(label + " tele hidden when provider not configured", async () => {
    assert.equal(await svc.resolveService(repo, "teleconsultation"), undefined);
    assert.ok(!(await svc.bookableServices(repo)).some((s) => s.id === "teleconsultation"));
    const r = await svc.createBooking(repo, { serviceId: "teleconsultation", startAt: SLOT, ...patient }, now);
    assert.equal(r.ok, false);
  });
  process.env.DAILY_API_KEY = "test-daily-key";
  await t(label + " settings defaults + validation", async () => {
    const s = await getTeleSettings(repo);
    assert.deepEqual(s, { enabled: true, duration: 30, priceCents: null });
    const bad = await saveTeleSettings(repo, { enabled: true, duration: 33, price: "abc" });
    assert.equal(bad.ok, false);
    const ok = await saveTeleSettings(repo, { enabled: true, duration: 45, price: "32,50" });
    assert.ok(ok.ok);
    assert.deepEqual(await getTeleSettings(repo), { enabled: true, duration: 45, priceCents: 3250 });
    assert.equal(formatPrice(3250)?.replace(/\s/g, " "), "32,50 €");
  });
  await t(label + " disabled in settings -> not bookable", async () => {
    await saveTeleSettings(repo, { enabled: false, duration: 45, price: "" });
    assert.equal(await svc.resolveService(repo, "teleconsultation"), undefined);
    await saveTeleSettings(repo, { enabled: true, duration: 30, price: "30" });
    const s = await svc.resolveService(repo, "teleconsultation");
    assert.equal(s?.duration, 30);
  });

  let token = "", id = "";
  await t(label + " 1. patient books a tele slot; room created private with no patient data", async () => {
    const r = await svc.createBooking(repo, { serviceId: "teleconsultation", startAt: SLOT, ...patient }, now);
    assert.ok(r.ok, JSON.stringify(r)); if (!r.ok) return;
    token = r.token; id = r.appointment.id;
    assert.equal(r.appointment.duration, 30);
    const tc = await tele.prepareTeleconsultation(repo, provider, r.appointment);
    assert.ok(tc?.roomName?.startsWith("lp-") && tc.roomUrl);
    assert.equal(tc?.priceCents, 3000);
    const call = daily.calls.filter((c) => c.path === "/rooms").at(-1)!;
    assert.equal(call.body.privacy, "private");
    assert.equal(call.body.properties.max_participants, 2);
    assert.ok(!("enable_recording" in call.body.properties), "no recording");
    assert.ok(!JSON.stringify(call.body).includes("Marie") && !JSON.stringify(call.body).includes(id), "no patient data / id in room");
  });
  await t(label + " 2. same slot cannot be double-booked (tele vs cabinet, tele vs tele)", async () => {
    const a = await svc.createBooking(repo, { serviceId: "seance", startAt: SLOT, ...patient, email: "b@b.fr" }, now);
    assert.equal(a.ok, false);
    const b = await svc.createBooking(repo, { serviceId: "teleconsultation", startAt: SLOT, ...patient, email: "c@c.fr" }, now);
    assert.equal(b.ok, false);
  });
  await t(label + " 3. confirmation email contains join link, no medical message", async () => {
    const a = (await repo.getAppointment(id))!;
    const m = patientConfirmation({ ...a, message: "douleur genou secret" }, token);
    assert.ok(m.html.includes(`/teleconsultation/${token}`));
    assert.ok(m.subject.includes("confirm"));
    assert.ok(!m.html.includes("douleur genou secret") && !m.text.includes("douleur genou secret"));
    assert.ok(m.html.includes("En ligne, par vidéo"));
    const rem = patientReminder(a);
    assert.ok(rem.subject.startsWith("Rappel") && rem.html.includes("téléconsultation"));
  });
  await t(label + " states: too early / open / expired", async () => {
    const a = (await repo.getAppointment(id))!;
    assert.equal(tele.patientState(a, at(SLOT, -60)), "upcoming");
    assert.equal(tele.patientState(a, at(SLOT, -10)), "open");
    assert.equal(tele.patientState(a, at(SLOT, 30 + 29)), "open");
    assert.equal(tele.patientState(a, at(SLOT, 30 + 31)), "expired");
    const early = await tele.joinAsPatient(repo, provider, a, at(SLOT, -60));
    assert.equal(early.ok, false); if (!early.ok) { assert.equal(early.code, "too_early"); assert.ok(early.opensAt); }
  });
  await t(label + " patient join -> non-owner token for this room, name 'Patient', expires after end", async () => {
    const a = (await repo.getAppointment(id))!;
    const r = await tele.joinAsPatient(repo, provider, a, at(SLOT, -5));
    assert.ok(r.ok, JSON.stringify(r)); if (!r.ok) return;
    const p = decodeToken(r.token);
    const tc = (await repo.getTeleconsultation(id))!;
    assert.equal(p.room_name, tc.roomName); assert.equal(p.is_owner, false); assert.equal(p.user_name, "Patient");
    assert.equal(p.exp, Math.floor((Date.parse(a.endAt) + 30 * 60_000) / 1000));
    assert.ok(tc.patientJoinedAt);
    assert.ok((await repo.listNotifications()).some((n) => n.type === "TELE_JOINED"));
  });
  await t(label + " 6. practitioner join -> owner token", async () => {
    const a = (await repo.getAppointment(id))!;
    const r = await tele.joinAsPractitioner(repo, provider, a, "Leopold PIRARD", at(SLOT, -30));
    assert.ok(r.ok); if (!r.ok) return;
    const p = decodeToken(r.token); assert.equal(p.is_owner, true); assert.equal(p.user_name, "Leopold PIRARD");
  });
  await t(label + " 4. another patient's link gives another room only; random token rejected", async () => {
    const r2 = await svc.createBooking(repo, { serviceId: "teleconsultation", startAt: "2026-10-13T09:00:00.000Z", ...patient, email: "autre@ex.fr" }, now);
    assert.ok(r2.ok); if (!r2.ok) return;
    await tele.prepareTeleconsultation(repo, provider, r2.appointment);
    const t1 = (await repo.getTeleconsultation(id))!, t2 = (await repo.getTeleconsultation(r2.appointment.id))!;
    assert.notEqual(t1.roomName, t2.roomName);
    assert.equal(await svc.findByToken(repo, "x".repeat(43)), null);
    assert.equal(await svc.findByToken(repo, id), null, "appointment id is not a token");
  });
  await t(label + " room deleted on the provider side -> a new private room is created at join", async () => {
    const a = (await repo.getAppointment(id))!;
    const before = (await repo.getTeleconsultation(id))!;
    daily.rooms.delete(before.roomName as string);
    const r = await tele.joinAsPatient(repo, provider, a, at(SLOT, -5));
    assert.ok(r.ok, JSON.stringify(r)); if (!r.ok) return;
    const after = (await repo.getTeleconsultation(id))!;
    assert.notEqual(after.roomName, before.roomName);
    assert.equal(decodeToken(r.token).room_name, after.roomName);
    assert.ok(daily.rooms.has(after.roomName as string));
  });
  await t(label + " 8. expired link refused", async () => {
    const a = (await repo.getAppointment(id))!;
    const r = await tele.joinAsPatient(repo, provider, a, at(SLOT, 120));
    assert.equal(r.ok, false); if (!r.ok) assert.equal(r.code, "expired");
  });
  await t(label + " provider failure -> explicit error, no fake success", async () => {
    const r3 = await svc.createBooking(repo, { serviceId: "teleconsultation", startAt: "2026-10-14T08:00:00.000Z", ...patient, email: "z@z.fr" }, now);
    assert.ok(r3.ok); if (!r3.ok) return;
    const tc = await tele.prepareTeleconsultation(repo, badProvider, r3.appointment);
    assert.equal(tc?.roomName, null, "booking kept, room deferred");
    const j = await tele.joinAsPatient(repo, badProvider, r3.appointment, at("2026-10-14T08:00:00.000Z", -5));
    assert.equal(j.ok, false); if (!j.ok) assert.equal(j.code, "provider_error");
    const j2 = await tele.joinAsPatient(repo, null, r3.appointment, at("2026-10-14T08:00:00.000Z", -5));
    assert.equal(j2.ok, false); if (!j2.ok) assert.equal(j2.code, "not_configured");
    const j3 = await tele.joinAsPatient(repo, provider, r3.appointment, at("2026-10-14T08:00:00.000Z", -5));
    assert.ok(j3.ok, "room created lazily at join");
  });
  await t(label + " issue report stored + notification, sanitized and capped", async () => {
    const a = (await repo.getAppointment(id))!;
    const r = await tele.reportIssue(repo, a, "Pas de son\u0007 " + "x".repeat(800));
    assert.ok(r.ok);
    const tc = (await repo.getTeleconsultation(id))!;
    assert.ok(tc.issueReport!.length <= 500 && !tc.issueReport!.includes("\u0007"));
    assert.equal((await tele.reportIssue(repo, a, " ")).ok, false);
  });
  await t(label + " 7. cancellation -> room deleted, join refused", async () => {
    const r = await svc.cancelByToken(repo, token, now);
    assert.ok(r.ok);
    const before = (await repo.getTeleconsultation(id))!.roomName!;
    await tele.revokeRoom(repo, provider, id);
    assert.ok(!daily.rooms.has(before));
    assert.equal((await repo.getTeleconsultation(id))!.roomName, null);
    const j = await tele.joinAsPatient(repo, provider, (await repo.getAppointment(id))!, at(SLOT, -5));
    assert.equal(j.ok, false); if (!j.ok) assert.equal(j.code, "cancelled");
  });
  await t(label + " delete + purge remove tele rows", async () => {
    const all = await repo.listAppointments({ serviceId: "teleconsultation" });
    const victim = all[0];
    await repo.deleteAppointment(victim.id);
    assert.equal(await repo.getTeleconsultation(victim.id), null);
    await repo.purgeBefore("2030-01-01T00:00:00Z");
    assert.equal((await repo.listTeleconsultations(all.map((a) => a.id))).length, 0);
  });
}

await suite("memory", new MemoryRepository());
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tele-test-"));
const f = path.join(tmp, "tele.db");
for (const x of [f, f + "-wal", f + "-shm"]) fs.rmSync(x, { force: true });
await suite("sqlite", new SqliteRepository(f));
const tf = path.join(tmp, "tele_turso.db");
for (const x of [tf, tf + "-wal", tf + "-shm"]) fs.rmSync(x, { force: true });
const hm = await startMock(tf, 4902);
const ex = new TursoHttpExecutor("libsql://127.0.0.1:4902", "test-token", ((u: string, i: any) => fetch(u.replace("https://", "http://"), i)) as any);
await suite("turso", await LibsqlRepository.open(ex));
hm.close(); daily.server.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${passed} tests téléconsultation réussis`);

}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
