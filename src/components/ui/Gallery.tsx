import Image from "next/image";
import type { SiteImage } from "@/data/images";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

function Tile({ image, sizes }: { image: SiteImage; sizes: string }) {
  if (image.src) {
    return (
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        className="object-cover"
        style={image.position ? { objectPosition: image.position } : undefined}
      />
    );
  }
  return (
    <span
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-muted"
      style={{ backgroundImage: "repeating-linear-gradient(135deg, rgb(var(--line) / 0.55) 0 1px, transparent 1px 14px)" }}
    >
      <Icon name="image" size={20} className="text-sage-deep" />
      <span className="rounded-full bg-surface/90 px-3 py-1 text-micro font-medium">{image.slot}</span>
    </span>
  );
}

/**
 * Galerie photo responsive (photos non cliquables).
 * La première photo est mise en avant ; la grille s'adapte au nombre de photos :
 * 1 + multiple de 3 → photo principale sur toute la largeur, puis rangées de 3 ;
 * sinon → photo principale sur 2 colonnes × 2 rangées.
 */
export function Gallery({ items }: { items: SiteImage[] }) {
  const featuredWide = (items.length - 1) % 3 === 0;
  // Dernière photo seule sur sa rangée mobile (2 colonnes) : pleine largeur
  const isLastAlone = (i: number) => i === items.length - 1 && (items.length - 1) % 2 === 1;

  const tileClass = (i: number) => {
    if (i === 0) return featuredWide ? "col-span-2 lg:col-span-3" : "col-span-2 lg:col-span-2 lg:row-span-2";
    return isLastAlone(i) ? "col-span-2 lg:col-span-1" : "";
  };
  const aspectClass = (i: number) => {
    if (i === 0) return featuredWide ? "aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]" : "aspect-[4/3] lg:aspect-auto lg:h-full";
    if (isLastAlone(i)) return featuredWide ? "aspect-[16/10] lg:aspect-[4/5]" : "aspect-[16/10] lg:aspect-[4/3]";
    return featuredWide ? "aspect-[4/5]" : "aspect-[4/3]";
  };

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {items.map((image, i) => (
        <li key={i} className={tileClass(i)}>
          <figure className={cn("relative block w-full overflow-hidden rounded-card bg-mist", aspectClass(i))}>
            <Tile image={image} sizes={i === 0 ? "(min-width: 1024px) 1200px, 100vw" : "(min-width: 1024px) 33vw, 50vw"} />
          </figure>
        </li>
      ))}
    </ul>
  );
}
