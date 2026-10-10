import type { Teleconsultation } from "./types";

/** Ligne SQL (snake_case) → Teleconsultation */
export function toTeleconsultation(r: Record<string, unknown>): Teleconsultation {
  const str = (v: unknown) => (v === null || v === undefined ? null : String(v));
  return {
    appointmentId: String(r.appointment_id),
    provider: String(r.provider),
    roomName: str(r.room_name),
    roomUrl: str(r.room_url),
    priceCents: r.price_cents === null || r.price_cents === undefined ? null : Number(r.price_cents),
    patientJoinedAt: str(r.patient_joined_at),
    practitionerJoinedAt: str(r.practitioner_joined_at),
    issueReport: str(r.issue_report),
    issueAt: str(r.issue_at),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}
