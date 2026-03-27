import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PREVIEW_COOKIE = "preview-access";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Preview gate ──────────────────────────────────────────────────────────
  // Only runs on Vercel preview deployments, never on production or local dev.
  if (process.env.VERCEL_ENV === "preview") {
    const isGatePath =
      pathname === "/preview-gate" || pathname.startsWith("/api/preview-gate");

    if (!isGatePath) {
      const hasAccess = request.cookies.get(PREVIEW_COOKIE)?.value === "1";
      if (!hasAccess) {
        const url = request.nextUrl.clone();
        const dest = encodeURIComponent(pathname);
        url.pathname = "/preview-gate";
        url.search = `?next=${dest}`;
        return NextResponse.redirect(url);
      }
    }
  }

  // ── Admin guard ───────────────────────────────────────────────────────────
  if (pathname === "/admin/login" || pathname === "/api/admin/auth") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get("admin-token")?.value;
    const secret = process.env.ADMIN_SECRET;

    if (!secret || !token || token !== secret) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|data/).*)",
  ],
};
