import Link from "next/link";
import { SITE, TODO, fullAddress, hasEmail } from "@/data/site";
import { practitioner } from "@/data/practitioner";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/layout/LegalPage";
import { Value } from "@/components/ui/Value";

export const metadata = pageMetadata({
  title: "Mentions légales",
  description: "Mentions légales du site du cabinet de kinésithérapie : éditeur, hébergeur, propriété intellectuelle.",
  path: "/mentions-legales",
});

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" path="/mentions-legales" updated={TODO}>
      <h2>Éditeur du site</h2>
      <ul>
        <li>
          Cabinet : <Value>{SITE.CABINET_NAME}</Value>
        </li>
        <li>
          Masseur-kinésithérapeute : <Value>{SITE.PRACTITIONER_NAME}</Value>
        </li>
        <li>
          Adresse : <Value>{fullAddress()}</Value>
        </li>
        <li>
          Téléphone : <Value>{SITE.PHONE}</Value>
        </li>
        {hasEmail() && <li>E-mail : {SITE.EMAIL}</li>}
        <li>
          Numéro RPPS : <Value>{practitioner.rpps}</Value>
        </li>
        <li>
          Inscription au tableau du Conseil départemental de l&apos;Ordre des masseurs-kinésithérapeutes :{" "}
          <Value>{TODO}</Value>
        </li>
        <li>
          Numéro SIRET : <Value>{TODO}</Value>
        </li>
        <li>
          Directeur de la publication : <Value>{TODO}</Value>
        </li>
      </ul>

      <h2>Règles professionnelles</h2>
      <p>
        La profession de masseur-kinésithérapeute est réglementée par le Code de la santé publique et soumise au code
        de déontologie des masseurs-kinésithérapeutes. Ces textes sont consultables sur le site de l&apos;Ordre des
        masseurs-kinésithérapeutes et sur Légifrance.
      </p>

      <h2>Hébergement</h2>
      <ul>
        <li>Hébergeur : Vercel Inc.</li>
        <li>Adresse : 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis</li>
        <li>
          Contact :{" "}
          <a href="https://vercel.com/contact" target="_blank" rel="noopener noreferrer">
            vercel.com/contact
          </a>
        </li>
      </ul>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, photographies et éléments graphiques de ce site sont la propriété du cabinet ou utilisés avec
        l&apos;autorisation de leurs auteurs. Toute reproduction sans autorisation préalable est interdite.
      </p>
      <p>
        Crédits photographiques : <Value>{TODO}</Value>
      </p>

      <h2>Informations médicales</h2>
      <p>
        Les contenus de ce site sont fournis à titre d&apos;information générale. Ils ne remplacent pas une
        consultation, un diagnostic ou un avis médical. En cas d&apos;urgence, composez le 15 ou le 112.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalPage>
  );
}
