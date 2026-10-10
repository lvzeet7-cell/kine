/**
 * Fournisseur de visioconférence — interface commune.
 * Toutes ces opérations s'exécutent côté serveur uniquement (clé API secrète).
 */
export type VideoRoom = { name: string; url: string };

export interface VideoProvider {
  /** Identifiant enregistré en base, ex. "daily" */
  readonly id: string;
  /** Crée une salle PRIVÉE (accès uniquement avec un jeton) qui expire à `expiresAt` */
  createRoom(opts: { name: string; expiresAt: Date }): Promise<VideoRoom>;
  /** Jeton d'accès temporaire, propre à une salle et à un rôle */
  createToken(opts: { roomName: string; isOwner: boolean; userName: string; expiresAt: Date }): Promise<string>;
  /** La salle existe-t-elle encore chez le fournisseur ? */
  roomExists(name: string): Promise<boolean>;
  /** Supprime la salle (sans erreur si elle n'existe plus) */
  deleteRoom(name: string): Promise<void>;
}

export class VideoProviderError extends Error {}
