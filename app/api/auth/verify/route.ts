import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email là bắt buộc' },
        { status: 400 }
      );
    }

    // Tìm user bằng email
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      return NextResponse.json(
        { error: 'Không thể tìm user: ' + fetchError.message },
        { status: 400 }
      );
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy user với email này' },
        { status: 404 }
      );
    }

    // Xác thực user
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (error) {
      console.error('Manual verification error:', error);
      return NextResponse.json(
        { error: 'Không thể xác thực tài khoản: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Tài khoản đã được xác thực thành công', user: data.user },
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi xác thực thủ công:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xác thực tài khoản' },
      { status: 500 }
    );
  }
}
