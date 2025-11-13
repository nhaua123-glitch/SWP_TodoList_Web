// File: middleware.ts (ở thư mục gốc)
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // ... (Phần code tạo client của bạn giữ nguyên) ...
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

  // ⭐️ SỬA ĐỔI 1: Dùng getUser() thay vì getSession() (an toàn hơn)
  const { data: { session } } = await supabase.auth.getUser()

  // Xử lý logic bảo vệ trang
  const { pathname } = request.nextUrl
  const hasValidSession = !!session;

  // 🧱 Bảo vệ API private
  if (pathname.startsWith("/api/private")) {
    if (!hasValidSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return response;
  }

  // 🧭 Bảo vệ các trang UI
  const protectedRoutes = ["/list", "/dashboard", "/calendar", "/friends"];
  
  // ⭐️ SỬA ĐỔI 2: THÊM trang chủ "/" VÀO ĐÂY
  const publicRoutes = ["/login", "/signup", "/"]; // Thêm "/" vào đây

  if (!hasValidSession && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ⭐️ SỬA ĐỔI 3: DÙNG "includes(pathname)" (so sánh chính xác)
  if (hasValidSession && publicRoutes.includes(pathname)) {
    // Nếu đã đăng nhập và cố vào login/signup/trang chủ -> đá về trang chính
    return NextResponse.redirect(new URL("/calendar", request.url));
  }

  // Cho phép tất cả các trường hợp còn lại
  return response
}

// ⚙️ Config middleware (Giữ nguyên)
export const config = {
  matcher: [
    "/((?!api/public|_next/static|_next/image|favicon.ico).*)",
  ],
};