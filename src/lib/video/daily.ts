/**
 * Adaptateur Daily (https://www.daily.co) — API REST, sans dépendance côté serveur.
 * Documentation : https://docs.daily.co/reference/rest-api
 *
 * Variables d'environnement :
 *   DAILY_API_KEY   clé API secrète (tableau de bord Daily > Developers)
 *   DAILY_API_URL   facultatif, par défaut https://api.daily.co/v1
 *   DAILY_GEO       facultatif, région des serveurs vidéo (ex. eu-central-1 pour l'Europe)
 *
 * Choix de sécurité :
 * - salles « private » : impossible d'entrer sans jeton, même en connaissant l'adresse ;
 * - 2 participants maximum, expiration automatique et expulsion à l'expiration ;
 * - jetons nominatifs par rôle (praticien = propriétaire de la salle), à durée limitée ;
 * - aucun nom de patient ni information médicale envoyé à Daily (nom affiché : « Patient ») ;
 * - aucun enregistrement : la propriété d'enregistrement n'est jamais activée.
 */
import { VideoProviderError, type VideoProvider, type VideoRoom } from "./provider";

const seconds = (d: Date) => Math.floor(d.getTime() / 1000);

export class DailyProvider implements VideoProvider {
  readonly id = "daily";

  constructor(
    private apiKey: string,
    private baseUrl = "https://api.daily.co/v1",
    private fetchImpl: typeof fetch = fetch,
    private geo?: string,
  ) {}

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, "")}${path}`, {
      method,
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    if ((method === "DELETE" || method === "GET") && res.status === 404) return null as T;
    if (!res.ok) {
      // Le détail de l'erreur reste dans les journaux serveur, sans donnée patient
      const detail = (await res.text()).slice(0, 200);
      throw new VideoProviderError(`Daily ${method} ${path.split("/")[1]} : HTTP ${res.status} ${detail}`);
    }
    return (await res.json()) as T;
  }

  async createRoom({ name, expiresAt }: { name: string; expiresAt: Date }): Promise<VideoRoom> {
    const room = await this.call<{ name: string; url: string }>("POST", "/rooms", {
      name,
      privacy: "private",
      properties: {
        exp: seconds(expiresAt),
        eject_at_room_exp: true,
        max_participants: 2,
        enable_chat: false,
        enable_knocking: false,
        enable_prejoin_ui: false,
        enable_screenshare: false,
        lang: "fr",
        ...(this.geo ? { geo: this.geo } : {}),
      },
    });
    return { name: room.name, url: room.url };
  }

  async createToken({ roomName, isOwner, userName, expiresAt }: { roomName: string; isOwner: boolean; userName: string; expiresAt: Date }) {
    const r = await this.call<{ token: string }>("POST", "/meeting-tokens", {
      properties: {
        room_name: roomName,
        is_owner: isOwner,
        user_name: userName,
        exp: seconds(expiresAt),
        eject_at_token_exp: true,
      },
    });
    return r.token;
  }

  async roomExists(name: string) {
    return (await this.call<unknown>("GET", `/rooms/${encodeURIComponent(name)}`)) !== null;
  }

  async deleteRoom(name: string) {
    await this.call("DELETE", `/rooms/${encodeURIComponent(name)}`);
  }
}
