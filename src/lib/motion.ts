import type { CSSProperties } from "react";

/** Décalage d'animation d'entrée (voir .enter dans globals.css) */
export function delay(ms: number): CSSProperties {
  return { "--delay": `${ms}ms` } as CSSProperties;
}
