import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    // Đăng nhập với Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase login error:', error);
      
      // Xử lý đặc biệt cho lỗi email confirmation
      if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
        // Thử xác thực tự động tài khoản
        try {
          const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
            data?.user?.id || '',
            { email_confirm: true }
          );
          
          if (!updateError) {
            // Xác thực thành công, thử đăng nhập lại
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            
            if (!retryError) {
              // Tạo response với session cookie cho auto-verification
              const response = NextResponse.json(
                { message: 'Đăng nhập thành công', session: retryData.session, user: retryData.user },
                { status: 200 }
              );

              // Set cookie cho session nếu có
              if (retryData.session?.access_token) {
                response.cookies.set('sb-auth-token', JSON.stringify({
                  access_token: retryData.session.access_token,
                  refresh_token: retryData.session.refresh_token,
                  expires_at: retryData.session.expires_at
                }), {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  maxAge: 60 * 60 * 24 * 7 // 7 days
                });
              }

              return response;
            }
          }
        } catch (autoVerifyError) {
          console.error('Auto verification failed:', autoVerifyError);
        }
        
        return NextResponse.json(
          { error: 'Tài khoản chưa được xác thực. Vui lòng thử lại sau vài giây.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Tạo response với session cookie
    const response = NextResponse.json(
      { message: 'Đăng nhập thành công', session: data.session, user: data.user },
      { status: 200 }
    );

    // Set cookie cho session nếu có
    if (data.session?.access_token) {
      response.cookies.set('sb-auth-token', JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }

    return response;
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đăng nhập' },
      { status: 500 }
    );
  }
}