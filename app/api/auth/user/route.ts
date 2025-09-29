import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return NextResponse.json(
        { error: 'Không tìm thấy phiên đăng nhập' },
        { status: 401 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();

    return NextResponse.json(
      { user },
      { status: 200 }
    );
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi lấy thông tin người dùng' },
      { status: 500 }
    );
  }
}