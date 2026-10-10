import { images } from "@/data/images";
import { ButtonLink } from "@/components/ui/Button";
import { ImageFrame } from "@/components/ui/ImageFrame";

const points = [
  { title: "Écouter", text: "Comprendre ce qui vous amène, vos gênes au quotidien et vos attentes." },
  { title: "Expliquer", text: "Vous dire ce qui est fait en séance, et pourquoi." },
  { title: "Adapter", text: "Faire évoluer les soins au rythme de vos progrès." },
];

export function CabinetIntro() {
  return (
    <section aria-labelledby="intro-title" className="py-section">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <ImageFrame
          image={images.intro}
          aspect="aspect-[5/4]"
          sizes="(min-width: 1024px) 560px, 100vw"
          className="order-last lg:order-first"
        />
        <div>
          <h2 id="intro-title" className="text-h2">
            Un accompagnement adapté à chaque patient
          </h2>
          <p className="mt-6 text-lead text-muted">
            Chaque personne arrive avec une histoire, une gêne et des objectifs qui lui sont propres. La prise en
            charge part de là : de ce que vous vivez, et de ce que vous souhaitez retrouver.
          </p>
          <dl className="mt-10 grid gap-6 sm:grid-cols-3 sm:gap-5 lg:grid-cols-1 xl:grid-cols-3">
            {points.map((p) => (
              <div key={p.title} className="border-t-2 border-sage pt-4">
                <dt className="font-semibold">{p.title}</dt>
                <dd className="mt-1.5 text-small text-muted">{p.text}</dd>
              </div>
            ))}
          </dl>
          <ButtonLink href="/cabinet" variant="secondary" className="mt-10">
            Découvrir le cabinet
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
