import { requireAdmin } from "@/lib/admin-guard";
import { bookingConfig } from "@/lib/booking/config";
import { AdminCalendar } from "@/components/admin/AdminCalendar";

export const metadata = { title: "Agenda" };

export default async function AgendaPage() {
  await requireAdmin();
  return <AdminCalendar services={bookingConfig.services} />;
}
