// File: middleware.ts (ở thư mục gốc)

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Tạo response và client Supabase cho middleware
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Lấy thông tin session (quan trọng nhất)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Lấy đường dẫn (pathname) người dùng đang muốn vào
  const { pathname } = req.nextUrl;

  // *** LOGIC BẢO VỆ ***

  // 1. Nếu người dùng CHƯA đăng nhập VÀ đang cố vào trang cần bảo vệ...
  // (Đổi '/calendar', '/list' thành các trang của bạn)
  if (!session && (pathname === '/calendar' || pathname === '/list' || pathname === '/dashboard' || pathname === '/friends')) {
    // ...thì ném họ về trang /login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 2. Nếu người dùng ĐÃ đăng nhập MÀ LẠI vào trang /login hoặc /signup...
  if (session && (pathname === '/login' || pathname === '/signup')) {
    // ...thì ném họ về trang chính (ví dụ: /calendar)
    // (Hãy đổi '/calendar' thành trang chính của bạn)
    return NextResponse.redirect(new URL('/calendar', req.url));
  }

  // 3. Nếu mọi thứ ổn (đã đăng nhập và vào trang private, hoặc chưa đăng nhập và vào trang public)
  // thì cho phép request tiếp tục
  return res;
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