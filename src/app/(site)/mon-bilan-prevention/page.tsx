import { pageMetadata, cityLabel } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/data/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { BookingCTA } from "@/components/sections/BookingCTA";
import { BookingButton } from "@/components/ui/BookingButton";
import { ButtonLink } from "@/components/ui/Button";
import { delay } from "@/lib/motion";
import { Icon } from "@/components/ui/Icon";

/*
 * Contenu issu des pages officielles de l'Assurance Maladie (ameli.fr), consultées le 2 octobre 2026 :
 *  - https://www.ameli.fr/assure/sante/mon-bilan-prevention
 *  - https://www.ameli.fr/masseur-kinesitherapeute/sante-et-prevention/bilan-prevention-ages-cles
 * À relire si le dispositif évolue.
 */

export const metadata = pageMetadata({
  title: "Mon bilan prévention",
  description: `« Mon bilan prévention » chez votre kinésithérapeute à ${cityLabel} : un temps d'échange dédié à votre santé, pris en charge à 100 % par l'Assurance Maladie pour les 18-25, 45-50, 60-65 et 70-75 ans.`,
  path: "/mon-bilan-prevention",
});

const AMELI_URL = "https://www.ameli.fr/assure/sante/mon-bilan-prevention";

const HIGHLIGHTS = [
  { icon: "search", title: "Un point complet", text: "Votre santé, votre activité physique et vos habitudes de vie passées en revue." },
  { icon: "shield", title: "Prévention", text: "Repérer les risques et agir avant qu'ils ne deviennent des problèmes." },
  { icon: "person", title: "Conseils personnalisés", text: "Un plan d'action adapté à vos objectifs et à votre mode de vie." },
  { icon: "chart", title: "Dans la durée", text: "Des actions concrètes à mettre en place au quotidien, à votre rythme." },
] as const;

const AGES = ["18 – 25 ans", "45 – 50 ans", "60 – 65 ans", "70 – 75 ans"];

const FACTS = [
  { icon: "shield", title: "Pris en charge à 100 %", text: "Par l'Assurance Maladie. Vous n'avez aucun frais à avancer." },
  { icon: "clock", title: "30 à 45 minutes", text: "Un temps d'échange consacré uniquement à la prévention." },
  { icon: "calendar", title: "Un bilan par tranche d'âge", text: "Un seul bilan peut être réalisé dans chacune des tranches d'âge." },
] as const;

const STEPS = [
  {
    title: "Avant : le questionnaire",
    text: "Un questionnaire vous aide à repérer les sujets à aborder. Il est disponible dans Mon espace santé ou en téléchargement sur ameli.fr. Il est facultatif : si vous ne pouvez pas le remplir, il peut être complété pendant le rendez-vous.",
  },
  {
    title: "Pendant : l'échange",
    text: "Nous faisons le point ensemble sur votre santé et vos habitudes de vie, puis nous choisissons 1 ou 2 sujets prioritaires.",
  },
  {
    title: "Après : votre plan personnalisé",
    text: "Vous repartez avec un plan personnalisé de prévention : vos objectifs, les freins éventuels, des actions concrètes et les ressources utiles.",
  },
];

const TOPICS = [
  "Vos antécédents et votre état de santé",
  "Vos habitudes de vie (activité physique, alimentation, sommeil…)",
  "La prévention des maladies chroniques",
  "Les dépistages",
  "Les vaccinations",
  "Votre bien-être mental et social",
];

export default function MonBilanPreventionPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: SITE.SITE_URL },
            { "@type": "ListItem", position: 2, name: "Mon bilan prévention", item: `${SITE.SITE_URL}/mon-bilan-prevention` },
          ],
        }}
      />

      {/* Bannière : photo pleine largeur fondue vers la gauche, texte posé dessus */}
      <section aria-labelledby="bilan-title" className="relative isolate overflow-hidden bg-paper">
        <div className="relative h-64 xs:h-72 sm:h-96 lg:absolute lg:inset-y-0 lg:right-0 lg:-z-10 lg:h-auto lg:w-[66%]">
          <Image
            src="/images/bilan-prevention.jpg"
            alt="Kinésithérapeute posant les mains sur le dos et l'épaule d'un patient, devant des affiches de prévention"
            fill
            priority
            sizes="(min-width: 1024px) 66vw, 100vw"
            className="object-cover"
            style={{ objectPosition: "88% 30%" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 hidden bg-gradient-to-r from-paper via-paper/60 via-[18%] to-transparent to-[45%] lg:block"
          />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-paper to-transparent lg:hidden" />
        </div>

        <div className="container-page relative pb-14 pt-2 sm:pt-4 lg:flex lg:min-h-[34rem] lg:items-center lg:py-16">
          <div className="max-w-[34rem] lg:max-w-[30rem] xl:max-w-[32rem]">
            <nav aria-label="Fil d'Ariane" className="hidden lg:block">
              <ol className="flex items-center gap-1.5 text-micro text-muted">
                <li className="flex items-center gap-1.5">
                  <Link href="/" className="transition-colors hover:text-petrol">
                    Accueil
                  </Link>
                  <Icon name="chevronRight" size={14} className="text-muted/60" />
                </li>
                <li>
                  <span aria-current="page" className="text-ink">
                    Mon bilan prévention
                  </span>
                </li>
              </ol>
            </nav>
            <p className="enter inline-flex items-center gap-3 rounded-full bg-petrol-soft py-1.5 pl-1.5 pr-5 text-micro font-semibold uppercase tracking-[0.16em] text-petrol lg:mt-8">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70">
                <Icon name="shield" size={18} />
              </span>
              Prévention &amp; bien-être
            </p>
            <h1 id="bilan-title" className="enter mt-6 text-display text-ink" style={delay(60)}>
              Mon bilan prévention&nbsp;!
            </h1>
            <span aria-hidden="true" className="enter mt-6 block h-1 w-16 rounded-full bg-sage" style={delay(100)} />
            <p className="enter mt-6 text-lead text-ink/80" style={delay(140)}>
              Un temps d&apos;échange pour faire le point sur votre santé et vos habitudes de vie, prévenir les
              problèmes avant qu&apos;ils n&apos;arrivent et repartir avec un plan d&apos;action personnalisé, que vous
              soyez sportif, actif ou sédentaire. Pris en charge à 100&nbsp;% par l&apos;Assurance Maladie.
            </p>
            <div className="enter mt-9" style={delay(200)}>
              <ButtonLink href="/rendez-vous?service=bilan-prevention" size="lg" className="rounded-full px-8">
                Prendre rendez-vous
                <Icon name="chevronRight" size={18} />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Quatre points clés */}
      <section aria-label="Les points clés du bilan" className="border-y border-line bg-surface">
        <ul className="container-page grid gap-x-8 gap-y-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:py-14">
          {HIGHLIGHTS.map((h, i) => (
            <li key={h.title} className={i > 0 ? "lg:border-l lg:border-line lg:px-8" : "lg:pr-8"}>
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-petrol-soft text-petrol">
                <Icon name={h.icon} size={28} />
              </span>
              <h2 className="mt-5 text-[1.1875rem] font-semibold text-petrol">{h.title}</h2>
              <p className="mt-2 text-small text-muted">{h.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Pour qui + chiffres clés + affiche */}
      <section aria-labelledby="pour-qui" className="py-section-sm">
        <div className="container-page grid gap-10 lg:grid-cols-12 lg:gap-14">
          <figure className="order-2 mx-auto w-full max-w-[22rem] lg:order-1 lg:col-span-4 lg:max-w-none lg:self-start">
            <Image
              src="/images/affiche-campagne-bilan-prevention.jpg"
              alt="Affiche de la campagne nationale « Mon Bilan Prévention — J'ai rendez-vous avec ma santé ! » : quatre personnes de différents âges devant des portes colorées, avec les tranches d'âge concernées. Renseignez-vous sur monbilanprevention.sante.gouv.fr."
              width={1102}
              height={1427}
              sizes="(min-width: 1024px) 30vw, 22rem"
              className="h-auto w-full rounded-card border border-line shadow-lift"
            />
          </figure>

          <div className="order-1 lg:order-2 lg:col-span-8">
            <h2 id="pour-qui" className="text-h2">
              Pour qui ?
            </h2>
            <p className="mt-4 text-lead text-muted">
              Depuis le 1er octobre 2026, les masseurs-kinésithérapeutes peuvent réaliser « Mon bilan prévention ». Il
              s&apos;adresse à toutes les personnes dans l&apos;une de ces tranches d&apos;âge :
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {AGES.map((a) => (
                <li
                  key={a}
                  className="rounded-card bg-petrol-soft px-4 py-5 text-center text-[1.25rem] font-semibold tabular-nums tracking-[-0.01em] text-petrol"
                >
                  {a}
                </li>
              ))}
            </ul>

            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {FACTS.map((f) => (
                <li key={f.title} className="rounded-card border border-line bg-surface p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-control bg-sage-soft text-sage-deep">
                    <Icon name={f.icon} size={22} />
                  </span>
                  <h3 className="mt-4 text-[1.0625rem] font-semibold">{f.title}</h3>
                  <p className="mt-1 text-small text-muted">{f.text}</p>
                </li>
              ))}
            </ul>

            <BookingButton service="bilan-prevention" size="lg" withIcon className="mt-8 w-full sm:w-auto" />
          </div>
        </div>
      </section>

      {/* Déroulement */}
      <section aria-labelledby="deroulement-bilan" className="bg-surface py-section-sm">
        <div className="container-page">
          <h2 id="deroulement-bilan" className="text-h2">
            Comment se déroule le bilan ?
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col rounded-card border border-line bg-paper p-7">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-petrol text-small font-semibold text-white"
                >
                  {i + 1}
                </span>
                <h3 className="mt-5 text-h3">{s.title}</h3>
                <p className="mt-3 text-small text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Sujets + à apporter */}
      <section aria-labelledby="sujets" className="py-section-sm">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 id="sujets" className="text-h2">
              Les sujets abordés
            </h2>
            <ul className="mt-6 space-y-3">
              {TOPICS.map((t) => (
                <li key={t} className="flex gap-3 text-ink/90">
                  <Icon name="check" size={20} className="mt-0.5 shrink-0 text-sage-deep" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-small text-muted">
              À partir de 60 ans, le bilan peut aussi porter sur le maintien de l&apos;autonomie (programme ICOPE).
            </p>
          </div>

          <div className="space-y-4 self-start">
            <div className="rounded-card bg-sage-soft p-6">
              <h2 className="text-[1.125rem] font-semibold">À apporter</h2>
              <ul className="mt-3 space-y-2 text-small text-ink/90">
                <li className="flex gap-2">
                  <Icon name="check" size={18} className="mt-0.5 shrink-0 text-sage-deep" />
                  Votre carte Vitale
                </li>
                <li className="flex gap-2">
                  <Icon name="check" size={18} className="mt-0.5 shrink-0 text-sage-deep" />
                  Votre carnet de vaccination
                </li>
                <li className="flex gap-2">
                  <Icon name="check" size={18} className="mt-0.5 shrink-0 text-sage-deep" />
                  Le questionnaire, si vous l&apos;avez rempli
                </li>
              </ul>
            </div>
            <div className="flex gap-3 rounded-card border border-line bg-surface p-6 text-small text-ink/90">
              <Icon name="info" size={20} className="mt-0.5 shrink-0 text-petrol" />
              <p>
                Le questionnaire et toutes les informations officielles sont sur le site de l&apos;Assurance Maladie :{" "}
                <a href={AMELI_URL} target="_blank" rel="noopener noreferrer" className="link">
                  ameli.fr — Mon bilan prévention
                  <span className="sr-only"> (nouvel onglet)</span>
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <BookingCTA
        title="Réserver mon bilan prévention"
        text="Choisissez « Mon bilan prévention » lors de la réservation en ligne, ou appelez le cabinet pour toute question."
        service="bilan-prevention"
      />
    </>
  );
}
