import { adminRoute } from "@/lib/admin-route";
import { getRepo } from "@/lib/booking/server";
import { adminAddClosure } from "@/lib/booking/service";
import { json, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/admin/closures — congés et fermetures */
export async function GET(request: Request) {
  return adminRoute(request, async () => json({ closures: await (await getRepo()).listClosures() }));
}

/** POST /api/admin/closures — { startDate, endDate, reason } */
export async function POST(request: Request) {
  return adminRoute(request, async () => {
    const r = await adminAddClosure(await getRepo(), (await readJson(request)) ?? {});
    return r.ok ? json({ closure: r.closure }, 201) : json({ message: r.message }, 422);
  });
}
