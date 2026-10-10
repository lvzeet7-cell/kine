import { bookingConfig } from "@/lib/booking/config";
import { getRepo } from "@/lib/booking/server";
import { dueReminders, purgeExpired } from "@/lib/booking/service";
import { patientReminder } from "@/lib/email/templates";
import { emailConfigured, sendEmail } from "@/lib/email/send";
import { json, safe } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Tâche planifiée : rappels + purge RGPD.
 * À appeler toutes les heures avec l'en-tête  Authorization: Bearer <CRON_SECRET>
 * (cron du serveur, Vercel Cron, GitHub Actions, cron-job.org…).
 */
async function run(request: Request) {
  return safe(async () => {
    const secret = process.env.CRON_SECRET;
    if (!secret || secret.length < 16) return json({ message: "CRON_SECRET non configuré." }, 503);
    if (request.headers.get("authorization") !== `Bearer ${secret}`) return json({ message: "Non autorisé." }, 401);

    const repo = await getRepo();
    let reminders = 0;
    if (bookingConfig.reminders.enabled && emailConfigured()) {
      for (const a of await dueReminders(repo)) {
        const r = await sendEmail(patientReminder(a));
        if (r.sent) {
          await repo.updateIfFree(a.id, { reminderSentAt: new Date().toISOString() }, false);
          reminders++;
        }
      }
    }
    const purged = await purgeExpired(repo);
    return json({ reminders, purged });
  });
}

export const GET = run;
export const POST = run;
