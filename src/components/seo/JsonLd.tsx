/** Données structurées Schema.org (JSON-LD) */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Échappement de "<" pour éviter toute fermeture prématurée de la balise
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
