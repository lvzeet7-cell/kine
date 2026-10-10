import { bookingConfig } from "@/lib/booking/config";
import { TeleconsultationsAdmin } from "@/components/admin/TeleconsultationsAdmin";

export const metadata = { title: "Téléconsultations" };

export default function AdminTeleconsultationsPage() {
  return <TeleconsultationsAdmin services={bookingConfig.services} />;
}
