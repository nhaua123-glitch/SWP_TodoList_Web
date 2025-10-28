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
      console.log(`[Login API] Supabase error:`, { message: error.message, code: error.status });
      
      // Kiểm tra nếu lỗi là do email chưa confirm
      if (error.message.includes('email_not_confirmed') || 
          error.message.includes('Email not confirmed') ||
          error.message.includes('confirm') ||
          error.status === 400) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email chưa được xác thực. Kiểm tra hộp thư để xác nhận.',
            needsVerification: true,
            error: error.message,
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { success: false, message: 'Email hoặc mật khẩu không đúng.', error: error.message },
        { status: 400 }
      )
    }

    // Kiểm tra thêm một lần nữa cho chắc chắn
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
    })

    console.log(`[Login API] Cookie set for user: ${data.user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: data.user,
      session: data.session,
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

