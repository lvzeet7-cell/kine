"use client";

import { useState } from "react";
import { SITE, directionsUrl, fullAddress, isAddressSet } from "@/data/site";
import { ButtonLink, Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/**
 * Carte OpenStreetMap.
 * Chargée uniquement après un clic (aucun contenu tiers ni cookie avant accord,
 * et aucun impact sur la vitesse de chargement de la page).
 */
export function Map({ className }: { className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const lat = SITE.LATITUDE;
  const lng = SITE.LONGITUDE;
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  const directions = directionsUrl();

  let src = "";
  if (hasCoords) {
    const d = 0.006;
    const bbox = [lng - d, lat - d / 2, lng + d, lat + d / 2].map((n) => n.toFixed(5)).join("%2C");
    src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  }

  return (
    <div className={className}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-panel border border-line bg-mist sm:aspect-[16/10]">
        {hasCoords && loaded ? (
          <iframe
            src={src}
            title={`Carte : emplacement du cabinet${isAddressSet() ? `, ${fullAddress()}` : ""}`}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
            style={{
              backgroundImage:
                "linear-gradient(rgb(var(--line) / 0.7) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--line) / 0.7) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-petrol text-white shadow-lift">
              <Icon name="pin" size={22} />
            </span>
            <p className="max-w-xs rounded-card bg-surface/95 px-4 py-2 text-small font-medium text-ink">
              {isAddressSet() ? fullAddress() : `Adresse : ${fullAddress()}`}
            </p>
            {hasCoords ? (
              <Button variant="secondary" size="sm" onClick={() => setLoaded(true)}>
                Afficher la carte
              </Button>
            ) : (
              <p className="text-micro text-muted">Carte affichée dès que les coordonnées GPS sont renseignées.</p>
            )}
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-micro text-muted">
          {hasCoords ? (
            <>
              Carte © contributeurs{" "}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                OpenStreetMap
              </a>
              , chargée à la demande.
            </>
          ) : (
            " "
          )}
        </p>
        {directions && (
          <ButtonLink href={directions} variant="ghost" size="sm">
            <Icon name="pin" size={16} />
            Itinéraire
            <span className="sr-only"> (nouvel onglet)</span>
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
