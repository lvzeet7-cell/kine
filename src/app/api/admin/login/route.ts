import { adminConfigured, checkPassword, createSession, sessionCookie } from "@/lib/auth";
import { clientIp, json, rateLimited, readJson, safe, sameOrigin } from "@/lib/http";

export const dynamic = "force-dynamic";

/** POST /api/admin/login — { password } */
export async function POST(request: Request) {
  return safe(async () => {
    if (!sameOrigin(request)) return json({ message: "Requête refusée." }, 403);
    if (!adminConfigured()) {
      return json({ message: "L'espace admin n'est pas encore configuré (voir README : ADMIN_PASSWORD, SESSION_SECRET)." }, 503);
    }
    if (rateLimited(`login:${clientIp(request)}`, 8, 15 * 60_000)) {
      return json({ message: "Trop de tentatives. Réessayez dans 15 minutes." }, 429);
    }
    const body = await readJson(request);
    if (!(await checkPassword(body?.password))) {
      await new Promise((r) => setTimeout(r, 400));
      return json({ message: "Mot de passe incorrect." }, 401);
    }
    return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(await createSession()) });
  });
}
