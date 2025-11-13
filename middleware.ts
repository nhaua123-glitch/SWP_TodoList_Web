// File: middleware.ts (ở thư mục gốc)
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = 'nodejs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // ⚡ Bypass test routes
  const bypassRoutes = ["/friends"]; // ✅ Bỏ /friends khỏi check
  if (bypassRoutes.some(r => pathname.startsWith(r))) {
    return res;
  }

  // Kiểm tra Supabase session (dựa hoàn toàn vào Auth Helpers)
  const hasValidSession = !!session;

  // 🧱 Bảo vệ API private
  if (pathname.startsWith("/api/private")) {
    if (!hasValidSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return res;
  }

  // 🧭 Bảo vệ các trang khác
  const protectedRoutes = ["/calendar", "/list", "/dashboard"];
  if (!hasValidSession && protectedRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Cho phép truy cập /login và /signup ngay cả khi đã có session

  return res;
}

// ⚙️ Config middleware
export const config = {
  matcher: [
    "/((?!api/public|_next/static|_next/image|favicon.ico).*)",
  ],
};