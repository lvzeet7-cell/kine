import { adminRoute } from "@/lib/admin-route";
import { getRepo } from "@/lib/booking/server";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return adminRoute(request, async () => {
    const { id } = await params;
    return (await (await getRepo()).deleteUnavailability(id)) ? json({ ok: true }) : json({ message: "Introuvable." }, 404);
  });
}
