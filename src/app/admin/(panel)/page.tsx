import { requireAdmin } from "@/lib/admin-guard";
import { bookingConfig } from "@/lib/booking/config";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata = { title: "Tableau de bord" };

export default async function AdminHomePage() {
  await requireAdmin();
  return <AdminDashboard services={bookingConfig.services} />;
}
