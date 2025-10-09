import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Các routes cần bảo vệ (yêu cầu đăng nhập)
const protectedRoutes = ['/calendar', '/list'];

// Các routes công khai (không cần đăng nhập)
const publicRoutes = ['/login', '/', '/auth/callback'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Tạm thời disable middleware để debug
  // TODO: Implement proper cookie-based auth
  console.log('Middleware running for:', pathname);
  
  return NextResponse.next();
}

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
