import { bookingConfig } from "@/lib/booking/config";
import { AppointmentList } from "@/components/admin/AppointmentList";

export const metadata = { title: "Rendez-vous" };

export default function AdminAppointmentsPage() {
  return <AppointmentList services={bookingConfig.services} />;
}
