/**
 * Types minimaux de l'objet d'appel `@daily-co/daily-js` utilisés par la salle vidéo.
 * (On ne type que ce dont on se sert, pour garder le composant indépendant de la version exacte.)
 */
export type DailyTrackState = {
  state: "blocked" | "off" | "sendable" | "loading" | "interrupted" | "playable";
  persistentTrack?: MediaStreamTrack | null;
};

export type DailyParticipant = {
  session_id: string;
  user_name?: string;
  local: boolean;
  owner?: boolean;
  tracks: { audio: DailyTrackState; video: DailyTrackState };
};

export type DailyEventName =
  | "joined-meeting"
  | "left-meeting"
  | "participant-joined"
  | "participant-updated"
  | "participant-left"
  | "track-started"
  | "track-stopped"
  | "network-quality-change"
  | "network-connection"
  | "camera-error"
  | "ejected"
  | "error";

export type DailyEvent = {
  action?: string;
  participant?: DailyParticipant;
  threshold?: "good" | "low" | "very-low";
  event?: "interrupted" | "connected";
  errorMsg?: string;
  error?: { type?: string; msg?: string };
};

export interface DailyCall {
  join(opts: { url: string; token: string; startVideoOff?: boolean; startAudioOff?: boolean }): Promise<unknown>;
  leave(): Promise<unknown>;
  destroy(): Promise<unknown>;
  participants(): Record<string, DailyParticipant>;
  setLocalAudio(on: boolean): unknown;
  setLocalVideo(on: boolean): unknown;
  localAudio(): boolean;
  localVideo(): boolean;
  on(ev: DailyEventName, cb: (e?: DailyEvent) => void): unknown;
  off(ev: DailyEventName, cb: (e?: DailyEvent) => void): unknown;
}

export type DailyFactory = { createCallObject(opts?: Record<string, unknown>): DailyCall };
