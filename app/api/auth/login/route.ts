import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email và mật khẩu là bắt buộc.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    // Delay nhỏ để giảm brute-force
    await new Promise((r) => setTimeout(r, 400))

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Email hoặc mật khẩu không đúng.', error: error.message },
        { status: 400 }
      )
    }

    if (data.user && !data.user.email_confirmed_at) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email chưa được xác thực. Kiểm tra hộp thư để xác nhận.',
          needsVerification: true,
        },
        { status: 400 }
      )
    }

    // ✅ Dùng await cookies() để tránh cảnh báo
    const cookieStore = await cookies()
    cookieStore.set({
      name: 'sb-access-token',
      value: data.session.access_token,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
    })

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: data.user,
    })
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Login API Error:`, error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

