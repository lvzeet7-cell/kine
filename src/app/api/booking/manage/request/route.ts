import { getRepo } from "@/lib/booking/server";
import { reissueManageLinks } from "@/lib/booking/service";
import { EMAIL_RE } from "@/lib/booking/validation";
import { patientManageLinks } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/send";
import { clientIp, json, readJson, safe, sameOrigin } from "@/lib/http";
import { tooManyAttempts } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MIN_FILL_MS = 2000;
/** Réponse identique que l'adresse corresponde ou non à un rendez-vous (aucune information divulguée) */
const DONE = {
  ok: true,
  message:
    "Si un rendez-vous à venir correspond à cette adresse, vous allez recevoir un e-mail avec le lien pour le modifier ou l'annuler. Pensez à vérifier vos courriers indésirables.",
};

/** POST /api/booking/manage/request — renvoie par e-mail le lien de gestion des rendez-vous à venir */
export async function POST(request: Request) {
  return safe(async () => {
    if (!sameOrigin(request)) return json({ message: "Requête refusée." }, 403);
    const ip = clientIp(request);
    if (await tooManyAttempts("manage-link-ip", ip, 5, 15 * 60_000)) {
      return json({ message: "Trop de demandes depuis votre connexion. Réessayez plus tard ou appelez le cabinet." }, 429);
    }
    const body = await readJson(request);
    if (!body) return json({ message: "Requête invalide." }, 400);

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > 120 || !EMAIL_RE.test(email)) {
      return json({ errors: { email: "Vérifiez l'adresse e-mail, par exemple : prenom.nom@exemple.fr" } }, 422);
    }

    // Robots : on répond comme d'habitude, sans rien faire
    const startedAt = typeof body.startedAt === "number" ? body.startedAt : 0;
    if ((typeof body.website === "string" && body.website !== "") || !startedAt || Date.now() - startedAt < MIN_FILL_MS) {
      return json(DONE);
    }
    // Au plus 3 envois par heure vers une même adresse
    if (await tooManyAttempts("manage-link-to", email, 3, 60 * 60_000)) return json(DONE);

    const items = await reissueManageLinks(await getRepo(), email);
    if (items.length > 0) await sendEmail(patientManageLinks(items));
    return json(DONE);
  });
}
