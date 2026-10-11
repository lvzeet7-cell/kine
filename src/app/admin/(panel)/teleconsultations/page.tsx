import { requireAdmin } from "@/lib/admin-guard";
import { bookingConfig } from "@/lib/booking/config";
import { TeleconsultationsAdmin } from "@/components/admin/TeleconsultationsAdmin";

export const metadata = { title: "Téléconsultations" };

export default async function AdminTeleconsultationsPage() {
  await requireAdmin();
  return <TeleconsultationsAdmin services={bookingConfig.services} />;
}
