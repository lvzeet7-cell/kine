import { bookingConfig, reminderHoursBefore } from "@/lib/booking/config";
import { emailConfigured } from "@/lib/email/send";
import { AdminPageHeader } from "@/components/admin/shared";
import { PurgeButton } from "@/components/admin/PurgeButton";

export const metadata = { title: "Paramètres" };
export const dynamic = "force-dynamic";

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="grid gap-1 px-5 py-3.5 sm:grid-cols-[16rem_1fr]">
      <dt className="text-small text-muted">{label}</dt>
      <dd className="text-small font-medium">
        {ok !== undefined && <span aria-hidden="true" className={`mr-2 inline-block h-2 w-2 rounded-full ${ok ? "bg-success" : "bg-warning"}`} />}
        {value}
      </dd>
    </div>
  );
}

export default function ParametresPage() {
  const c = bookingConfig;
  const provider = process.env.EMAIL_PROVIDER ?? "";
  return (
    <div>
      <AdminPageHeader
        title="Paramètres"
        description="Règles de réservation et état des services. Pour les modifier : src/lib/booking/config.ts et le fichier .env.local."
      />

      <section aria-labelledby="p-rules" className="mt-8">
        <h2 id="p-rules" className="font-semibold">Règles de réservation</h2>
        <dl className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
          <Row label="Fuseau horaire" value={c.timezone} />
          <Row label="Délai minimum avant un rendez-vous" value={`${c.minimumNoticeMinutes / 60} h`} />
          <Row label="Réservation jusqu'à" value={`${c.maximumAdvanceDays} jours à l'avance`} />
          <Row label="Annulation en ligne possible jusqu'à" value={`${c.cancellationDeadlineHours} h avant`} />
          <Row label="Pas entre les créneaux" value={c.slotIntervalMinutes ? `${c.slotIntervalMinutes} min` : "Durée du rendez-vous"} />
          <Row label="Confirmation automatique" value={c.autoConfirm ? "Oui" : "Non (statut « En attente »)"} />
        </dl>
      </section>

      <section aria-labelledby="p-services" className="mt-8">
        <h2 id="p-services" className="font-semibold">Types de rendez-vous</h2>
        <div className="mt-3 overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[32rem] text-left text-small">
            <thead className="border-b border-line bg-paper text-micro font-semibold text-muted">
              <tr>
                <th scope="col" className="px-5 py-3">Nom</th>
                <th scope="col" className="px-3 py-3">Identifiant (lien direct)</th>
                <th scope="col" className="px-3 py-3">Durée</th>
                <th scope="col" className="px-5 py-3">En ligne</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {c.services.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-3 py-3"><code className="text-micro">/rendez-vous?service={s.id}</code></td>
                  <td className="px-3 py-3 tabular-nums">{s.duration} min</td>
                  <td className="px-5 py-3">{s.enabled ? "Oui" : "Non"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="p-services-status" className="mt-8">
        <h2 id="p-services-status" className="font-semibold">E-mails et rappels</h2>
        <dl className="mt-3 divide-y divide-line rounded-card border border-line bg-surface">
          <Row label="Envoi d'e-mails" value={emailConfigured() ? `Configuré (${provider === "gmail" ? `Gmail — ${process.env.GMAIL_USER}` : provider})` : "Non configuré — aucun e-mail n'est envoyé"} ok={emailConfigured()} />
          <Row label="Notifications au cabinet" value={process.env.ADMIN_EMAIL ? "Activées" : "ADMIN_EMAIL non défini"} ok={!!process.env.ADMIN_EMAIL} />
          <Row label="Rappels automatiques" value={c.reminders.enabled ? `${reminderHoursBefore()} h avant le rendez-vous` : "Désactivés"} ok={c.reminders.enabled} />
          <Row label="Tâche planifiée (rappels, purge)" value={process.env.CRON_SECRET ? "CRON_SECRET défini" : "CRON_SECRET non défini"} ok={!!process.env.CRON_SECRET} />
        </dl>
      </section>

      <section aria-labelledby="p-rgpd" className="mt-8">
        <h2 id="p-rgpd" className="font-semibold">Données personnelles</h2>
        <div className="mt-3 rounded-card border border-line bg-surface p-5">
          <p className="text-small text-muted">
            Les rendez-vous terminés depuis plus de {c.dataRetentionDays} jours sont supprimés automatiquement par la tâche
            planifiée. Vous pouvez aussi lancer la suppression maintenant, ou effacer un rendez-vous précis depuis sa fiche.
          </p>
          <div className="mt-4">
            <PurgeButton days={c.dataRetentionDays} />
          </div>
        </div>
      </section>
    </div>
  );
}
