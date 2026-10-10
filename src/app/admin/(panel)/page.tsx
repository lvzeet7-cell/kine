import { bookingConfig } from "@/lib/booking/config";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata = { title: "Tableau de bord" };

export default function AdminHomePage() {
  return <AdminDashboard services={bookingConfig.services} />;
}
