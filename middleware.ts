// File: middleware.ts (ở thư mục gốc)
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // 🧱 1. BẢO VỆ API PRIVATE
  if (pathname.startsWith("/api/private")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return res;
  }

  // 🧭 2. BẢO VỆ TRANG GIAO DIỆN
  // Nếu chưa đăng nhập mà vào trang cần bảo vệ → về /login
  const protectedRoutes = ["/calendar", "/list", "/dashboard", "/friends"];
  if (!session && protectedRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Nếu đã đăng nhập mà vào /login hoặc /signup → chuyển hướng về /calendar
  if (session && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/calendar", req.url));
  }

  // ✅ Nếu không vi phạm gì → cho phép truy cập
  return res;
}

// ⚙️ Config để middleware áp dụng đúng phạm vi
export const config = {
  matcher: [
    /*
     * Áp dụng cho:
     * - Tất cả các trang giao diện
     * - Tất cả API private (/api/private/**)
     * Ngoại trừ:
     * - /api/public/**
     * - static, image, favicon
     */
    "/((?!api/public|_next/static|_next/image|favicon.ico).*)",
  ],
};
