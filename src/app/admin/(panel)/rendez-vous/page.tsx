import { requireAdmin } from "@/lib/admin-guard";
import { bookingConfig } from "@/lib/booking/config";
import { AppointmentList } from "@/components/admin/AppointmentList";

export const metadata = { title: "Rendez-vous" };

export default async function AdminAppointmentsPage() {
  await requireAdmin();
  return <AppointmentList services={bookingConfig.services} />;
}
