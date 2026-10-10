import type { ReactNode } from "react";
import { SITE, directionsUrl, fullAddress, hasEmail, hasPhone, telHref } from "@/data/site";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Value } from "@/components/ui/Value";

function Row({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 py-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-petrol-soft text-petrol">
        <Icon name={icon} size={19} />
      </span>
      <div className="min-w-0">
        <dt className="text-micro font-medium text-muted">{label}</dt>
        <dd className="mt-1 break-words font-medium text-ink">{children}</dd>
      </div>
    </div>
  );
}

/** Coordonnées du cabinet (adresse, téléphone, e-mail) */
export function ContactDetails() {
  const directions = directionsUrl();
  return (
    <dl className="divide-y divide-line">
      <Row icon="pin" label="Adresse">
        <address className="not-italic">
          <Value>{fullAddress()}</Value>
        </address>
        {directions && (
          <a href={directions} target="_blank" rel="noopener noreferrer" className="link mt-1 inline-block text-small">
            Obtenir l&apos;itinéraire<span className="sr-only"> (nouvel onglet)</span>
          </a>
        )}
      </Row>
      <Row icon="phone" label="Téléphone">
        {hasPhone() ? (
          <a href={telHref(SITE.PHONE)} className="hover:text-petrol">
            {SITE.PHONE}
          </a>
        ) : (
          <Value>{SITE.PHONE}</Value>
        )}
      </Row>
      {hasEmail() && (
        <Row icon="mail" label="E-mail">
          <a href={`mailto:${SITE.EMAIL}`} className="hover:text-petrol">
            {SITE.EMAIL}
          </a>
        </Row>
      )}
    </dl>
  );
}

/** Informations d'accès : accessibilité, stationnement, transports */
export function AccessInfo() {
  const rows: { icon: IconName; label: string; value: string }[] = [
    { icon: "access", label: "Accessibilité", value: SITE.ACCESS.accessibility },
    { icon: "car", label: "Stationnement", value: SITE.ACCESS.parking },
    { icon: "bus", label: "Transports", value: SITE.ACCESS.transport },
  ];
  return (
    <dl className="divide-y divide-line">
      {rows.map((r) => (
        <Row key={r.label} icon={r.icon} label={r.label}>
          <span className="font-normal text-ink/90">
            <Value>{r.value}</Value>
          </span>
        </Row>
      ))}
    </dl>
  );
}
