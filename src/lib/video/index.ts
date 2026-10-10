import { DailyProvider } from "./daily";
import type { VideoProvider } from "./provider";

/** Fournisseur configuré, ou null si aucune clé n'est renseignée (la téléconsultation est alors désactivée) */
export function getVideoProvider(): VideoProvider | null {
  const key = process.env.DAILY_API_KEY;
  if (key && key.trim()) return new DailyProvider(key.trim(), process.env.DAILY_API_URL || undefined, fetch, process.env.DAILY_GEO || undefined);
  return null;
}

export const videoConfigured = () => getVideoProvider() !== null;

export type { VideoProvider } from "./provider";
