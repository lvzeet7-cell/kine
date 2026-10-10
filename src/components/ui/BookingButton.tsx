import { ButtonLink } from "./Button";
import { Icon } from "./Icon";
import { SITE, hasPhone, telHref } from "@/data/site";

type Props = {
  variant?: "primary" | "secondary" | "light" | "outlineLight";
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
  withIcon?: boolean;
  /** Présélectionne un type de rendez-vous (id défini dans src/lib/booking/config.ts) */
  service?: string;
};

/** Bouton « Prendre rendez-vous » → module de réservation /rendez-vous */
export function BookingButton({
  variant = "primary",
  size = "md",
  className,
  label = "Prendre rendez-vous",
  withIcon = false,
  service,
}: Props) {
  const href = service ? `/rendez-vous?service=${encodeURIComponent(service)}` : "/rendez-vous";
  return (
    <ButtonLink href={href} variant={variant} size={size} className={className}>
      {withIcon && <Icon name="calendar" size={18} />}
      {label}
    </ButtonLink>
  );
}

/** Bouton d'appel — n'apparaît que si le téléphone est renseigné */
export function CallButton({
  variant = "secondary",
  size = "md",
  className,
  label,
}: Omit<Props, "withIcon" | "service">) {
  if (!hasPhone()) return null;
  return (
    <ButtonLink href={telHref(SITE.PHONE)} variant={variant} size={size} className={className}>
      <Icon name="phone" size={18} />
      {label ?? SITE.PHONE}
    </ButtonLink>
  );
}
