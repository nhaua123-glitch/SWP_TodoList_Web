// File: middleware.ts (ở thư mục gốc)
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Code tạo client (Giữ nguyên)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // ⭐️ SỬA ĐỔI 1: Dùng getUser() (an toàn hơn)
  const { data: { session } } = await supabase.auth.getUser()

  // Xử lý logic
  const { pathname } = request.nextUrl
  const hasValidSession = !!session;

  // Bảo vệ API
  if (pathname.startsWith("/api/private")) {
    if (!hasValidSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return response;
  }

  // ⭐️ SỬA ĐỔI 2: ĐỊNH NGHĨA ROUTE CHÍNH XÁC
  const protectedRoutes = ["/list", "/dashboard", "/calendar", "/friends"];
  const publicRoutes = ["/login", "/signup", "/"]; // Thêm "/" vào đây

  // Chuyển hướng nếu chưa đăng nhập
  if (!hasValidSession && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ⭐️ SỬA ĐỔI 3: DÙNG "includes(pathname)" (so sánh chính xác)
  if (hasValidSession && publicRoutes.includes(pathname)) {
    // Nếu đã đăng nhập và vào trang public -> đá về trang chính
    return NextResponse.redirect(new URL("/calendar", request.url));
  }

  // Cho phép đi tiếp
  return response
}

// Config middleware (Giữ nguyên)
export const config = {
  matcher: [
    "/((?!api/public|_next/static|_next/image|favicon.ico).*)",
  ],
};