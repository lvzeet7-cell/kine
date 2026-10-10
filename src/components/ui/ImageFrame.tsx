import Image from "next/image";
import type { SiteImage } from "@/data/images";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

type Props = {
  image: SiteImage;
  /** Classe de ratio, ex. "aspect-[4/5]" */
  aspect?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Cadre photo. Affiche la photo si `src` est renseigné,
 * sinon un emplacement neutre qui indique quelle photo placer ici.
 */
export function ImageFrame({ image, aspect = "aspect-[4/5]", className, sizes = "(min-width: 1024px) 50vw, 100vw", priority }: Props) {
  return (
    <div className={cn("relative overflow-hidden rounded-media bg-mist", aspect, className)}>
      {image.src ? (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          style={image.position ? { objectPosition: image.position } : undefined}
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-muted"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgb(var(--line) / 0.55) 0 1px, transparent 1px 14px)",
          }}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface/90 text-sage-deep shadow-soft">
            <Icon name="image" size={20} />
          </span>
          <span className="max-w-[16rem] rounded-full bg-surface/90 px-3 py-1 text-micro font-medium text-muted">
            {image.slot}
          </span>
        </div>
      )}
    </div>
  );
}
