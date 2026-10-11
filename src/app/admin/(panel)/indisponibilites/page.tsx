import { requireAdmin } from "@/lib/admin-guard";
import { UnavailabilityManager } from "@/components/admin/ClosureManager";

export const metadata = { title: "Indisponibilités" };

export default async function IndisponibilitesPage() {
  await requireAdmin();
  return <UnavailabilityManager />;
}
