import { adminRoute } from "@/lib/admin-route";
import { getRepo } from "@/lib/booking/server";
import { adminUpdate, toAdmin } from "@/lib/booking/service";
import { randomToken, sha256 } from "@/lib/booking/tokens";
import { patientCancelled, patientRescheduled } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { revokeRoom } from "@/lib/teleconsultation/service";
import { getVideoProvider } from "@/lib/video";
import { json, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/appointments/[id] — modifier, déplacer, changer le statut */
export async function PATCH(request: Request, { params }: Ctx) {
  return adminRoute(request, async () => {
    const { id } = await params;
    const body = await readJson(request);
    if (!body) return json({ message: "Requête invalide." }, 400);
    const repo = await getRepo();
    const r = await adminUpdate(repo, id, body);
    if (!r.ok) {
      const status = r.code === "not_found" ? 404 : r.code === "conflict" ? 409 : 422;
      return json({ code: r.code, message: r.message, errors: r.errors }, status);
    }

    const appointment = r.appointment;
    // Téléconsultation : salle supprimée si le rendez-vous est annulé, terminé ou déplacé
    if (r.moved || (appointment.status !== r.previous.status && !["PENDING", "CONFIRMED"].includes(appointment.status))) {
      await revokeRoom(repo, getVideoProvider(), id);
    }
    let emailSent = false;
    if (body.notifyPatient === true) {
      if (appointment.status === "CANCELLED" && r.previous.status !== "CANCELLED") {
        emailSent = (await sendEmail(patientCancelled(appointment))).sent;
      } else if (r.moved) {
        // Nouveau lien de gestion : seul le patient connaît l'ancien jeton
        const token = randomToken();
        await repo.setManagementTokenHash(id, await sha256(token));
        emailSent = (await sendEmail(patientRescheduled(appointment, token))).sent;
      }
    }
    return json({ appointment: toAdmin(appointment), emailSent });
  });
}

/** DELETE /api/admin/appointments/[id] — suppression définitive (droit à l'effacement) */
export async function DELETE(request: Request, { params }: Ctx) {
  return adminRoute(request, async () => {
    const { id } = await params;
    const repo = await getRepo();
    await revokeRoom(repo, getVideoProvider(), id);
    const ok = await repo.deleteAppointment(id);
    return ok ? json({ ok: true }) : json({ message: "Rendez-vous introuvable." }, 404);
  });
}
