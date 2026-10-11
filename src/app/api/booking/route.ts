import { getRepo } from "@/lib/booking/server";
import { createBooking, toPublic } from "@/lib/booking/service";
import { cabinetNotification, patientConfirmation } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { prepareTeleconsultation } from "@/lib/teleconsultation/service";
import { getVideoProvider } from "@/lib/video";
import { clientIp, json, readJson, safe, sameOrigin, verifyTurnstile } from "@/lib/http";
import { tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MIN_FILL_MS = 4000;

/** POST /api/booking — enregistre une réservation (vérification serveur complète) */
export async function POST(request: Request) {
  return safe(async () => {
    if (!sameOrigin(request)) return json({ message: "Requête refusée." }, 403);
    const ip = clientIp(request);
    if (await tooManyAttempts("book", ip, 5, 15 * 60_000)) {
      return json({ message: "Trop de réservations depuis votre connexion. Réessayez plus tard ou appelez le cabinet." }, 429);
    }
    const body = await readJson(request);
    if (!body) return json({ message: "Requête invalide." }, 400);

    // Anti-robots : champ piège rempli ou formulaire envoyé trop vite
    const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
    if ((typeof body.website === "string" && body.website !== "") || !startedAt || Date.now() - startedAt < MIN_FILL_MS) {
      return json({ message: "La réservation n'a pas pu être vérifiée. Réessayez ou appelez le cabinet." }, 400);
    }
    if (!(await verifyTurnstile(body.turnstileToken, ip))) {
      return json({ message: "La vérification anti-robot a échoué. Réessayez." }, 400);
    }

    const repo = await getRepo();
    const result = await createBooking(repo, { serviceId: body.serviceId, startAt: body.startAt, ...body });
    if (!result.ok) {
      const status = result.code === "slot_unavailable" ? 409 : 422;
      return json({ code: result.code, message: result.message, errors: result.errors }, status);
    }

    const { appointment, token } = result;
    // Téléconsultation : fiche + salle vidéo privée (un échec du fournisseur ne bloque pas la réservation)
    await prepareTeleconsultation(repo, getVideoProvider(), appointment);
    const mail = await sendEmail(patientConfirmation(appointment, token));
    const notice = cabinetNotification(appointment, "new");
    if (notice) await sendEmail(notice);

    return json(
      { appointment: toPublic(appointment), token, emailSent: mail.sent || !!mail.simulated },
      201,
    );
  });
}
