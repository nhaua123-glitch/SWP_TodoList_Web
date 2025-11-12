// File: app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Bạn có thể dùng 'next' để điều hướng sau khi login thành công
  // Ví dụ: /login?next=/dashboard
  const next = searchParams.get('next') ?? '/calendar'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) { // <-- Thêm async
            return (await cookieStore).get(name)?.value // <-- Thêm await
          },
          async set(name: string, value: string, options: CookieOptions) { // <-- Thêm async
            (await cookieStore).set({ name, value, ...options }) // <-- Thêm await
          },
          async remove(name: string, options: CookieOptions) { // <-- Thêm async
            (await cookieStore).set({ name, value: '', ...options }) // <-- Thêm await
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Chuyển hướng về trang chủ, hoặc trang /list, /dashboard của bạn
      // Dùng ${origin}${next} sẽ tự động điều hướng
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Nếu thất bại, chuyển hướng về trang lỗi (bạn có thể tạo trang này)
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}