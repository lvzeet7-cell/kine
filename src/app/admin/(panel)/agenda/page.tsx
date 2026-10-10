import { bookingConfig } from "@/lib/booking/config";
import { AdminCalendar } from "@/components/admin/AdminCalendar";

export const metadata = { title: "Agenda" };

export default function AgendaPage() {
  return <AdminCalendar services={bookingConfig.services} />;
}
