import { TODO } from "@/data/site";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata = pageMetadata({
  title: "Cookies",
  description: "Utilisation des cookies et traceurs sur le site du cabinet de kinésithérapie.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <LegalPage title="Cookies" path="/cookies" updated={TODO}>
      <h2>Ce que fait ce site</h2>
      <p>
        Dans sa version actuelle, ce site ne dépose aucun cookie publicitaire ni de mesure d&apos;audience, et
        n&apos;utilise aucun outil de suivi. C&apos;est pourquoi aucun bandeau de consentement ne s&apos;affiche.
      </p>

      <h2>Contenus de services tiers</h2>
      <ul>
        <li>
          <strong>Carte OpenStreetMap</strong> : chargée uniquement si vous cliquez sur « Afficher la carte ».
        </li>
        <li>
          <strong>Réservation en ligne</strong> : la prise de rendez-vous se fait directement sur ce site, sans cookie.
          Seul l&apos;espace réservé au cabinet utilise un cookie de connexion, strictement nécessaire.
        </li>
      </ul>

      <h2>Si des outils sont ajoutés</h2>
      <p>
        En cas d&apos;ajout d&apos;un outil de mesure d&apos;audience ou de tout autre traceur non strictement
        nécessaire, cette page devra être mise à jour et un recueil du consentement mis en place, conformément aux
        recommandations de la CNIL.
      </p>

      <h2>Paramétrer votre navigateur</h2>
      <p>
        Vous pouvez à tout moment supprimer les cookies ou bloquer leur dépôt depuis les réglages de votre
        navigateur.
      </p>
    </LegalPage>
  );
}
