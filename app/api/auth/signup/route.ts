import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET method để test API
export async function GET() {
  return NextResponse.json({
    message: 'Signup API is working!',
    method: 'GET',
    note: 'Use POST method to register a new user'
  });
}

export async function POST(request: NextRequest) {
  try {
    // Kiểm tra environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password, username } = body;

    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Email, password and username are required' },
        { status: 400 }
      );
    }

    // Đăng ký người dùng mới với Supabase Auth (tự động gửi email xác thực)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Tạo profile người dùng trong bảng profiles (sử dụng admin client)
    if (authData.user && supabaseAdmin) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            username: username || email.split('@')[0],
            email
          },
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Không return error vì user đã được tạo thành công
        // Chỉ log error để debug
      }
    } else if (authData.user && !supabaseAdmin) {
      console.warn('SupabaseAdmin not available. Profile will be created via database trigger.');
    }

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup API Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}