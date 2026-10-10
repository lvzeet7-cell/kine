import { getService } from "@/lib/booking/config";
import type { Appointment } from "@/lib/booking/types";

/** true si le rendez-vous est une téléconsultation */
export const isTeleAppointment = (a: Pick<Appointment, "serviceId">) =>
  a.serviceId === "teleconsultation" || getService(a.serviceId)?.mode === "video";
