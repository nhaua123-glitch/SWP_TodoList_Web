// File: middleware.ts (ở thư mục gốc)
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Bắt buộc phải tạo client trong middleware theo cách này
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // A. Thêm cookie vào request
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // B. Thêm cookie vào response (để trình duyệt lưu lại)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // A. Xóa cookie khỏi request
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // B. Xóa cookie khỏi response
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // ⚡ Bypass test routes
  const bypassRoutes = ["/friends"]; // ✅ Bỏ /friends khỏi check
  if (bypassRoutes.some(r => pathname.startsWith(r))) {
    return res;
  }

  // Xử lý logic bảo vệ trang
  const { pathname } = request.nextUrl
  const hasValidSession = !!session;

  // 🧱 Bảo vệ API private
  if (pathname.startsWith("/api/private")) {
    if (!hasValidSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Nếu session hợp lệ, cho phép đi tiếp
    return response;
  }

  // 🧭 Bảo vệ các trang khác
  const protectedRoutes = ["/calendar", "/list", "/dashboard"];
  if (!hasValidSession && protectedRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // <--- SỬA ĐỔI 2: DÙNG ".includes(pathname)" ĐỂ KIỂM TRA CHÍNH XÁC
  if (hasValidSession && publicRoutes.some(route => pathname.startsWith(route))) {
    // Nếu đã đăng nhập và cố vào login/signup/trang chủ -> đá về trang chính
    return NextResponse.redirect(new URL("/calendar", request.url));
  }

  // Cho phép tất cả các trường hợp còn lại
  return response
}

// ⚙️ Config middleware
export const config = {
  matcher: [
    /*
     * Khớp với tất cả các đường dẫn ngoại trừ:
     * - api/public (API công khai)
     * - _next/static (file tĩnh)
     * - _next/image (file hình ảnh)
     * - favicon.ico (icon)
     */
    "/((?!api/public|_next/static|_next/image|favicon.ico).*)",
  ],
};