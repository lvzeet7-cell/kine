import { SITE, TODO, fullAddress, hasEmail } from "@/data/site";
import { pageMetadata } from "@/lib/seo";
import { bookingConfig } from "@/lib/booking/config";
import { LegalPage } from "@/components/layout/LegalPage";
import { Value } from "@/components/ui/Value";

export const metadata = pageMetadata({
  title: "Politique de confidentialité",
  description: "Comment le cabinet de kinésithérapie traite les données personnelles transmises via le site internet.",
  path: "/confidentialite",
});

const contact = hasEmail()
  ? `par e-mail à ${SITE.EMAIL}`
  : `par téléphone au ${SITE.PHONE} ou par courrier : ${fullAddress()}`;

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" path="/confidentialite" updated={TODO}>
      <p>
        Cette page explique quelles données personnelles sont collectées sur ce site, pourquoi, et quels sont vos
        droits, conformément au Règlement général sur la protection des données (RGPD) et à la loi Informatique et
        Libertés.
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        <Value>{SITE.PRACTITIONER_NAME}</Value>, <Value>{SITE.CABINET_NAME}</Value> — {contact}
      </p>

      <h2>Données collectées via le formulaire de contact</h2>
      <p>
        Lorsque vous utilisez le formulaire de contact, les informations suivantes sont transmises au cabinet : prénom,
        nom, adresse e-mail, téléphone (facultatif), motif et contenu du message.
      </p>
      <p>
        Le formulaire n&apos;est pas destiné à recevoir des informations médicales. Merci de ne pas y indiquer de
        diagnostic, de traitement ou de résultat d&apos;examen.
      </p>

      <h3>Finalité et base légale</h3>
      <p>
        Ces données servent uniquement à répondre à votre demande. Le traitement repose sur votre consentement,
        exprimé en cochant la case prévue à cet effet.
      </p>

      <h3>Destinataires</h3>
      <p>
        Les messages sont destinés au seul cabinet. Ils sont transmis à la messagerie Gmail du cabinet (Google).
      </p>

      <h3>Durée de conservation</h3>
      <p>
        <Value>{TODO}</Value>
      </p>

      <h2>Prise de rendez-vous en ligne</h2>
      <p>
        Lorsque vous réservez un rendez-vous sur ce site, les informations suivantes sont enregistrées par le cabinet :
        type de rendez-vous, date et heure, prénom, nom, téléphone, adresse e-mail, message facultatif, ainsi que la date
        de votre consentement. Aucune information médicale n&apos;est demandée.
      </p>
      <h3>Finalité et base légale</h3>
      <p>
        Ces données servent uniquement à organiser votre rendez-vous (confirmation, rappel, modification ou annulation).
        Le traitement repose sur votre consentement et sur les mesures nécessaires à la prise de rendez-vous que vous
        demandez.
      </p>
      <h3>Durée de conservation</h3>
      <p>
        Les rendez-vous sont automatiquement supprimés {bookingConfig.dataRetentionDays} jours après leur date. Vous
        pouvez demander leur suppression à tout moment en contactant le cabinet.
      </p>
      <h3>Hébergement et e-mails</h3>
      <p>
        Le site est hébergé par Vercel Inc. Les rendez-vous sont enregistrés dans une base de données hébergée
        par Turso, dans un centre de données situé en Europe. Les e-mails de confirmation et de rappel sont
        envoyés depuis la messagerie Gmail du cabinet (Google).
      </p>
      <p>
        Un lien personnel, envoyé par e-mail, vous permet de consulter, déplacer ou annuler votre rendez-vous. Ne le
        partagez pas.
      </p>

      <h2>Téléconsultation</h2>
      <p>
        Si vous réservez une téléconsultation, la séance a lieu par vidéo grâce au service Daily (Daily.co, Inc.,
        États-Unis), qui agit pour le compte du cabinet. Le flux audio et vidéo est chiffré pendant la
        transmission et n&apos;est pas enregistré. La salle est privée : on n&apos;y entre qu&apos;avec un accès
        personnel et temporaire, délivré par le site à vous et à votre kinésithérapeute. Aucun nom, aucune adresse
        e-mail ni aucune information médicale n&apos;est transmis à Daily : vous y apparaissez sous le nom « Patient ».
        Des données techniques de connexion (dont l&apos;adresse IP) sont toutefois traitées par ce service pour
        établir l&apos;appel.
      </p>
      <p>
        Le site conserve, avec votre rendez-vous, l&apos;heure de connexion à la salle et, le cas échéant, le
        problème technique que vous avez signalé. Ces informations sont supprimées en même temps que le rendez-vous.
      </p>

      <h2>Carte interactive</h2>
      <p>
        La carte OpenStreetMap n&apos;est chargée que si vous cliquez sur « Afficher la carte ». Des données techniques
        (dont votre adresse IP) sont alors transmises à OpenStreetMap pour afficher la carte.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation et
        d&apos;opposition au traitement de vos données, ainsi que du droit de retirer votre consentement à tout
        moment. Pour les exercer, contactez le cabinet : {contact}.
      </p>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL
        (www.cnil.fr).
      </p>

      <h2>Sécurité</h2>
      <p>
        Le site est servi en HTTPS. Les données transmises via le formulaire ne sont pas stockées sur le site
        lui-même : elles sont envoyées directement au cabinet par e-mail.
      </p>
    </LegalPage>
  );
}
