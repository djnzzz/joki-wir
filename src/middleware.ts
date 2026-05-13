import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES } from "@/config/routes";

// Definisi route per akses
const ROUTE_CONFIG = {
  // Hanya bisa diakses saat BELUM login
  guestOnly: ["/login", "/register", "/forgot-password"],

  // Butuh login (role apapun)
  authRequired: [
    "/dashboard",
    "/orders",
    "/checkout",
    "/wishlist",
    "/notifications",
    "/chat",
    "/account",
  ],

  // Hanya ADMIN
  adminOnly: ["/admin"],

  // Hanya JOKI
  jokiOnly: ["/joki"],
} as const;

// Helper: cek prefix route
function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

// Middleware utama
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  // 1. Route guest-only: redirect ke dashboard jika sudah login
  if (matchesPrefix(pathname, ROUTE_CONFIG.guestOnly)) {
    if (isLoggedIn) {
      const redirectTo =
        role === "ADMIN"
          ? ROUTES.admin.dashboard
          : role === "JOKI"
            ? ROUTES.joki.dashboard
            : ROUTES.dashboard;
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }
    return NextResponse.next();
  }

  // 2. Route admin: harus login + role ADMIN
  if (matchesPrefix(pathname, ROUTE_CONFIG.adminOnly)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url),
      );
    }
    if (role !== "ADMIN") {
      // Login tapi bukan admin → kirim ke halaman masing-masing
      return NextResponse.redirect(new URL(ROUTES.dashboard, req.url));
    }
    return NextResponse.next();
  }

  // 3. Route joki: harus login + role JOKI
  if (matchesPrefix(pathname, ROUTE_CONFIG.jokiOnly)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url),
      );
    }
    if (role !== "JOKI") {
      return NextResponse.redirect(new URL(ROUTES.dashboard, req.url));
    }
    return NextResponse.next();
  }

  // 4. Route auth-required: harus login
  if (matchesPrefix(pathname, ROUTE_CONFIG.authRequired)) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url),
      );
    }
    return NextResponse.next();
  }

  // 5. API routes proteksi
  if (pathname.startsWith("/api/admin")) {
    if (!isLoggedIn || role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }
  }

  if (pathname.startsWith("/api/joki")) {
    if (!isLoggedIn || role !== "JOKI") {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }
  }

  if (pathname.startsWith("/api/user") || pathname.startsWith("/api/orders")) {
    if (!isLoggedIn) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
  }

  return NextResponse.next();
});

// Matcher: middleware hanya aktif di path ini
// Exclude static files, _next, favicon — tidak perlu dicek auth
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|icons/).*)"],
};
