import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    // Kiểm tra dữ liệu đầu vào
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    // Đăng ký người dùng mới với Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        // Bỏ emailRedirectTo vì không cần xác thực email
      },
    });

    if (error) {
      console.error('Supabase register error:', error);
      
      // Xử lý lỗi email signups disabled
      if (error.message.includes('Email signups are disabled')) {
        return NextResponse.json(
          { error: 'Đăng ký bằng email đã bị tắt. Vui lòng liên hệ quản trị viên.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.', 
        user: data.user 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đăng ký' },
      { status: 500 }
    );
  }
}