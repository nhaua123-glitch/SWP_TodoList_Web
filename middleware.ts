// File: middleware.ts (ở thư mục gốc)
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = 'nodejs';

export async function middleware(req: NextRequest) {
  // Tạo response và client Supabase cho middleware
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Lấy thông tin session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Kiểm tra session từ cookie nếu Supabase session không có
  let hasValidSession = !!session;
  if (!hasValidSession) {
    const accessToken = req.cookies.get('sb-access-token')?.value;
    hasValidSession = !!accessToken;
  }

  // Debug logs (có thể remove khi deploy)
  console.log(`[Middleware] Path: ${pathname}, Supabase Session: ${!!session}, Cookie Token: ${!!req.cookies.get('sb-access-token')?.value}, HasValidSession: ${hasValidSession}`);

  // 🧱 1. BẢO VỆ API PRIVATE
  if (pathname.startsWith("/api/private")) {
    if (!hasValidSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return res;
  }

  // 🧭 2. BẢO VỆ TRANG GIAO DIỆN
  const protectedRoutes = ["/calendar", "/list", "/dashboard", "/friends"];
  if (!hasValidSession && protectedRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (hasValidSession && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/calendar", req.url));
  }

  // ✅ Nếu không vi phạm gì → cho phép truy cập
  return res;
}

// ⚙️ Config để middleware áp dụng đúng phạm vi
export const config = {
  matcher: [
    "/((?!api/public|_next/static|_next/image|favicon.ico).*)",
  ],
};

