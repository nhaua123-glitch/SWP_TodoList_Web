// app/api/auth/logout/route.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// 💡 Đảm bảo Next.js không cache route này
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. Lấy hàm 'cookies' từ Next.js
  const cookieStore = cookies();

  // 2. Tạo một Supabase client ĐẶC BIỆT
  // client này có thể đọc và ghi cookies
  const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      async get(name: string) {
        return (await cookieStore).get(name)?.value
      },
      async set(name: string, value: string, options) {
        (await cookieStore).set({ name, value, ...options })
      },
      async remove(name: string, options) {
        (await cookieStore).set({ name, value: '', ...options })
      },
    },
  }
)

  // 3. Trước khi signOut, cập nhật trạng thái user thành 'offline' (cập nhật last_seen)
  try {
    const { data, error: userError } = await supabase.auth.getUser();
    if (!userError && data?.user?.id) {
      const userId = data.user.id;
      const now = new Date().toISOString();
      
      // Cố gắng update trước
      const { data: updateData, error: updateError } = await supabase
        .from('user_status')
        .update({ status: 'offline', last_seen: now })
        .eq('user_id', userId);
      
      // Nếu update không tìm thấy record (không có record cũ), insert một record mới
      if (updateData && updateData.length === 0) {
        await supabase
          .from('user_status')
          .insert({ user_id: userId, status: 'offline', last_seen: now });
      }
      
      console.log('User status updated to offline:', userId);
    } else {
      console.warn('Could not get user for logout:', userError);
    }
  } catch (err) {
    console.error('Error setting user status offline before logout:', err);
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Logout API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }

  // 4. Trả về thành công
  // Trình duyệt sẽ nhận được cookie "session-cleared"
  return NextResponse.json({ 
    message: 'Logged out successfully',
    success: true 
  });
}

// Giữ lại GET để test
export async function GET() {
  return NextResponse.json({
    message: 'Logout API is working!',
    note: 'Use POST method to logout'
  });
}