import { requireAdmin } from "@/lib/admin-guard";
import { ClosureManager } from "@/components/admin/ClosureManager";

export const metadata = { title: "Congés" };

export default async function CongesPage() {
  await requireAdmin();
  return <ClosureManager />;
}
