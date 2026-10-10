import { getRepo } from "@/lib/booking/server";
import { cancelByToken, findByToken, rescheduleByToken, toPublic } from "@/lib/booking/service";
import { cabinetNotification, patientCancelled, patientRescheduled } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { revokeRoom } from "@/lib/teleconsultation/service";
import { getVideoProvider } from "@/lib/video";
import { clientIp, json, rateLimited, readJson, safe, sameOrigin } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

/** GET /api/booking/manage/[token] — rendez-vous du patient (sans données internes) */
export async function GET(request: Request, { params }: Ctx) {
  return safe(async () => {
    if (rateLimited(`manage:${clientIp(request)}`, 60, 60_000)) return json({ message: "Trop de requêtes." }, 429);
    const { token } = await params;
    const a = await findByToken(await getRepo(), token);
    if (!a) return json({ message: "Ce rendez-vous est introuvable." }, 404);
    return json({ appointment: toPublic(a) });
  });
}

/** POST /api/booking/manage/[token] — { action: "cancel" } ou { action: "reschedule", startAt } */
export async function POST(request: Request, { params }: Ctx) {
  return safe(async () => {
    if (!sameOrigin(request)) return json({ message: "Requête refusée." }, 403);
    if (rateLimited(`manage-w:${clientIp(request)}`, 10, 15 * 60_000)) {
      return json({ message: "Trop de tentatives. Réessayez plus tard ou appelez le cabinet." }, 429);
    }
    const { token } = await params;
    const body = await readJson(request);
    const repo = await getRepo();

    if (body?.action === "cancel") {
      const r = await cancelByToken(repo, token);
      if (!r.ok) return json({ code: r.code, message: r.message }, r.code === "not_found" ? 404 : 409);
      await revokeRoom(repo, getVideoProvider(), r.appointment.id);
      await sendEmail(patientCancelled(r.appointment));
      const notice = cabinetNotification(r.appointment, "cancelled");
      if (notice) await sendEmail(notice);
      return json({ appointment: toPublic(r.appointment) });
    }

    if (body?.action === "reschedule") {
      const r = await rescheduleByToken(repo, token, body.startAt);
      if (!r.ok) return json({ code: r.code, message: r.message }, r.code === "not_found" ? 404 : 409);
      // Nouvel horaire : l'ancienne salle est supprimée, une nouvelle sera créée à la connexion
      await revokeRoom(repo, getVideoProvider(), r.appointment.id);
      await sendEmail(patientRescheduled(r.appointment, token));
      const notice = cabinetNotification(r.appointment, "moved", r.previousStartAt);
      if (notice) await sendEmail(notice);
      return json({ appointment: toPublic(r.appointment) });
    }

    return json({ message: "Action inconnue." }, 400);
  });
}
