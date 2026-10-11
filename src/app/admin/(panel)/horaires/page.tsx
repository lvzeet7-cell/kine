import { requireAdmin } from "@/lib/admin-guard";
import { OpeningHoursEditor } from "@/components/admin/OpeningHoursEditor";

export const metadata = { title: "Horaires" };

export default async function HorairesPage() {
  await requireAdmin();
  return <OpeningHoursEditor />;
}
