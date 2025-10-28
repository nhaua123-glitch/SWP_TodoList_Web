// File: middleware.ts (ở thư mục gốc)

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function middleware(req: NextRequest) {
  // Tạm thời disable middleware để test
  console.log(`[Middleware] TEMPORARILY DISABLED - Allowing access to ${req.nextUrl.pathname}`);
  return NextResponse.next();
  
  // Code cũ (đã comment):
  /*
  // Tạo response và client Supabase cho middleware
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Lấy thông tin session từ Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Lấy đường dẫn (pathname) người dùng đang muốn vào
  const { pathname } = req.nextUrl;

  // Kiểm tra session từ cookie nếu Supabase session không có
  let hasValidSession = !!session;
  
  if (!hasValidSession) {
    // Kiểm tra cookie access token
    const accessToken = req.cookies.get('sb-access-token')?.value;
    hasValidSession = !!accessToken;
  }

  // Debug logs
  console.log(`[Middleware] Path: ${pathname}, Supabase Session: ${!!session}, Cookie Token: ${!!req.cookies.get('sb-access-token')?.value}, HasValidSession: ${hasValidSession}`);

  // *** LOGIC BẢO VỆ ***

  // 1. Nếu người dùng CHƯA đăng nhập VÀ đang cố vào trang cần bảo vệ...
  if (!hasValidSession && (pathname === '/calendar' || pathname === '/list' || pathname === '/dashboard' || pathname === '/friends')) {
    console.log(`[Middleware] Redirecting to /login from ${pathname}`);
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 2. Nếu người dùng ĐÃ đăng nhập MÀ LẠI vào trang /login hoặc /signup...
  if (hasValidSession && (pathname === '/login' || pathname === '/signup')) {
    console.log(`[Middleware] Redirecting to /calendar from ${pathname}`);
    return NextResponse.redirect(new URL('/calendar', req.url));
  }

  // 3. Nếu mọi thứ ổn thì cho phép request tiếp tục
  console.log(`[Middleware] Allowing access to ${pathname}`);
  return res;
  */
}

// Config: Áp dụng middleware này cho TẤT CẢ các trang,
// TRỪ các file API, file hệ thống (static, image, favicon).
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};