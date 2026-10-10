import type { Metadata } from "next";
import Link from "next/link";
import { SITE, hasPhone } from "@/data/site";
import { bookingConfig } from "@/lib/booking/config";
import { getRepo } from "@/lib/booking/server";
import { findByToken, toPublic } from "@/lib/booking/service";
import { addDays, localDate } from "@/lib/booking/time";
import { ManageAppointment } from "@/components/booking/ManageAppointment";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { isTeleAppointment } from "@/lib/teleconsultation/kind";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon rendez-vous",
  robots: { index: false, follow: false },
  // Le lien contient un jeton personnel : il ne doit pas être transmis aux autres sites
  referrer: "no-referrer",
};

export default async function GestionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const appointment = await findByToken(await getRepo(), token);
  const today = localDate(new Date(), bookingConfig.timezone);

  return (
    <section className="py-section-sm">
      <div className="container-page max-w-3xl">
        <h1 className="text-h1">Mon rendez-vous</h1>
        {appointment ? (
          <>
            <p className="mt-4 text-lead text-muted">
              Consultez votre rendez-vous, changez l&apos;horaire ou annulez-le jusqu&apos;à{" "}
              {bookingConfig.cancellationDeadlineHours} heures avant.
            </p>
            <p className="mt-2 text-small text-muted">{bookingConfig.cancellationPolicy}</p>
            {isTeleAppointment(appointment) && appointment.status !== "CANCELLED" && (
              <div className="mt-8 flex flex-col gap-4 rounded-panel bg-petrol-soft p-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-3 text-ink">
                  <Icon name="video" size={22} className="mt-0.5 shrink-0 text-petrol" />
                  <span>
                    <strong className="font-semibold">Téléconsultation</strong> — la salle ouvre 15 minutes avant l&apos;horaire.
                  </span>
                </p>
                <Link href={`/teleconsultation/${token}`} className={buttonClasses("primary", "md", "shrink-0")}>
                  Accéder à la téléconsultation
                </Link>
              </div>
            )}
            <div className="mt-10">
              <ManageAppointment
                token={token}
                initial={toPublic(appointment)}
                today={today}
                lastDate={addDays(today, bookingConfig.maximumAdvanceDays)}
                phone={hasPhone() ? SITE.PHONE : null}
                deadlineHours={bookingConfig.cancellationDeadlineHours}
              />
            </div>
          </>
        ) : (
          <div className="mt-8 rounded-panel border border-line bg-surface p-8">
            <p className="text-ink">Ce lien ne correspond à aucun rendez-vous. Il est peut-être incomplet ou a expiré.</p>
            <p className="mt-2 text-small text-muted">
              Vérifiez le lien reçu par e-mail{hasPhone() ? `, ou appelez le cabinet au ${SITE.PHONE}` : ""}.
            </p>
            <Link href="/rendez-vous" className={`${buttonClasses("primary", "md")} mt-6`}>
              Prendre rendez-vous
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
