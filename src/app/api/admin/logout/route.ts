import { sessionCookie } from "@/lib/auth";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** POST /api/admin/logout */
export async function POST() {
  return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", 0) });
}
