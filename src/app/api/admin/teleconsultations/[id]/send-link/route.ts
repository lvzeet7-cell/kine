import { adminRoute } from "@/lib/admin-route";
import { getRepo } from "@/lib/booking/server";
import { randomToken, sha256 } from "@/lib/booking/tokens";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { patientConfirmation } from "@/lib/email/templates";
import { json } from "@/lib/http";
import { isTeleAppointment } from "@/lib/teleconsultation/service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/teleconsultations/[id]/send-link
 * Crée un nouveau lien personnel (l'ancien cesse de fonctionner) et l'envoie au patient par e-mail.
 * Utile pour un rendez-vous créé depuis l'espace admin, ou si le patient a perdu son e-mail.
 */
export async function POST(request: Request, { params }: Ctx) {
  return adminRoute(request, async () => {
    const { id } = await params;
    const repo = await getRepo();
    const a = await repo.getAppointment(id);
    if (!a) return json({ message: "Rendez-vous introuvable." }, 404);
    if (!isTeleAppointment(a)) return json({ message: "Ce rendez-vous n'est pas une téléconsultation." }, 422);
    if (a.status === "CANCELLED") return json({ message: "Ce rendez-vous est annulé." }, 409);
    if (!emailConfigured()) {
      return json({ message: "L'envoi d'e-mails n'est pas configuré (voir le README) : aucun lien n'a été envoyé." }, 503);
    }
    const token = randomToken();
    await repo.setManagementTokenHash(a.id, await sha256(token));
    const r = await sendEmail(patientConfirmation(a, token));
    if (!r.sent) return json({ message: "L'e-mail n'a pas pu être envoyé. Réessayez dans un instant." }, 502);
    return json({ ok: true, message: `Lien envoyé à ${a.email}.` });
  });
}
