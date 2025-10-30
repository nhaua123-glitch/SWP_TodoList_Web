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
  const bypassRoutes = ["/calendar", "/friends"]; // ✅ Bỏ /friends khỏi check
  if (bypassRoutes.some(r => pathname.startsWith(r))) {
    return res;
  }

  // Kiểm tra Supabase session
  let hasValidSession = !!session;
  if (!hasValidSession) {
    const accessToken = req.cookies.get('sb-access-token')?.value;
    hasValidSession = !!accessToken;
  }

  console.log(`[Middleware] Path: ${pathname}, Supabase Session: ${!!session}, Cookie Token: ${!!req.cookies.get('sb-access-token')?.value}, HasValidSession: ${hasValidSession}`);

  // 🧱 Bảo vệ API private
  if (pathname.startsWith("/api/private")) {
    if (!hasValidSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return res;
  }

  // 🧭 Bảo vệ các trang khác
  const protectedRoutes = ["/list", "/dashboard"];
  if (!hasValidSession && protectedRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Nếu đã login mà vào /login hoặc /signup → redirect
  if (hasValidSession && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/calendar", req.url));
  }

  return res;
}

// ⚙️ Config middleware
export const config = {
  matcher: [
    "/((?!api/public|_next/static|_next/image|favicon.ico).*)",
  ],
};
