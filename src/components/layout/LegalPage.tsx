import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";
import { Icon } from "@/components/ui/Icon";

/** Mise en page des pages légales */
export function LegalPage({
  title,
  path,
  updated,
  children,
}: {
  title: string;
  path: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader title={title} crumbs={[{ label: title, href: path }]}>
        <p className="mt-4 text-small text-muted">Dernière mise à jour : {updated}</p>
      </PageHeader>
      <section className="py-section-sm">
        <div className="container-page">
          <div className="mb-12 flex max-w-prose gap-3 rounded-card border border-sage/60 bg-sage-soft p-4 text-small text-ink/90">
            <Icon name="info" size={20} className="mt-0.5 shrink-0 text-sage-deep" />
            <p>
              Modèle à compléter. Les éléments marqués « [À RENSEIGNER] » doivent être remplis, et l&apos;ensemble du
              texte relu par un professionnel du droit avant la mise en ligne.
            </p>
          </div>
          <div className="prose-kine">{children}</div>
        </div>
      </section>
    </>
  );
}
