import Image from "next/image";
import { SITE, isSet } from "@/data/site";
import { images } from "@/data/images";
import { ButtonLink } from "@/components/ui/Button";
import { BookingButton } from "@/components/ui/BookingButton";
import { Icon } from "@/components/ui/Icon";
import { delay } from "@/lib/motion";

/**
 * Bannière d'accueil : photo sur toute la largeur, fondue vers la gauche,
 * texte posé par-dessus. Sur téléphone, la photo passe au-dessus du texte.
 * Photo : images.hero (src/data/images.ts).
 */
export function Hero() {
  const photo = images.hero;
  const cityLine = isSet(SITE.CITY) ? `Cabinet de kinésithérapie à ${SITE.CITY}.` : "Cabinet de kinésithérapie.";

  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-paper">
      {photo.src && (
        <div className="relative h-60 xs:h-72 sm:h-96 lg:absolute lg:inset-y-0 lg:right-0 lg:-z-10 lg:h-auto lg:w-[74%]">
          <Image quality={90}
            src={photo.src}
            alt={photo.alt}
            fill
            priority
            sizes="(min-width: 1024px) 74vw, 100vw"
            className="object-cover"
            style={{ objectPosition: photo.position }}
          />
          {/* Fondu vers le texte : à gauche sur ordinateur, en bas sur téléphone */}
          <div
            aria-hidden="true"
            className="absolute inset-0 hidden bg-gradient-to-r from-paper via-paper/75 via-[30%] to-transparent to-[62%] lg:block"
          />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-paper to-transparent lg:hidden" />
        </div>
      )}

      <div className="container-page relative pb-section-sm pt-2 sm:pt-4 lg:flex lg:min-h-[31rem] lg:items-center lg:py-16 xl:min-h-[33rem]">
        <div className="max-w-[35rem] lg:max-w-[36rem] xl:max-w-[38rem]">
          <p className="enter flex items-center gap-4 text-micro font-semibold uppercase tracking-[0.14em] text-sage-deep">
            Kinésithérapie • Rééducation • Accompagnement
            <span aria-hidden="true" className="hidden h-px w-12 bg-sage-deep/40 sm:block" />
          </p>
          <h1 id="hero-title" className="enter mt-6 text-display lg:text-[clamp(2.5rem,3.5vw,3.5rem)] lg:whitespace-nowrap" style={delay(60)}>
            <span className="text-petrol">Retrouvez votre mobilité</span>{" "}<br className="hidden lg:block" />
            <span className="text-sage-deep">et avancez sereinement.</span>
          </h1>
          <p className="enter mt-6 max-w-[30rem] text-lead text-ink/75" style={delay(120)}>
            {cityLine} Chaque prise en charge commence par un temps d&apos;écoute, pour construire avec vous un
            accompagnement adapté à votre situation.
          </p>
          <div className="enter mt-9 flex flex-col gap-3 xs:flex-row" style={delay(180)}>
            <BookingButton size="lg" withIcon />
            <ButtonLink href="/cabinet" variant="secondary" size="lg">
              Découvrir le cabinet
              <Icon name="chevronRight" size={18} />
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
