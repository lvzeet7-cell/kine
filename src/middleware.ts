import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

/**
 * Protection de l'espace admin au plus tôt, pour TOUTES les requêtes vers /admin
 * (pages, navigation interne, données de rendu) — en plus des contrôles dans les pages et les API.
 * La page de connexion reste accessible.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/connexion" || pathname.startsWith("/admin/connexion/")) return NextResponse.next();
  if (await verifySession(request.cookies.get(SESSION_COOKIE)?.value)) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  const url = request.nextUrl.clone();
  url.pathname = "/admin/connexion";
  url.search = `?suite=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
