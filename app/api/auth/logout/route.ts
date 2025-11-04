// app/api/auth/logout/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// 💡 Đảm bảo Next.js không cache route này
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. Lấy hàm 'cookies' từ Next.js
  const cookieStore = cookies();

  // 2. Tạo một Supabase client ĐẶC BIỆT
  // client này có thể đọc và ghi cookies
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // 3. Gọi signOut()
  // Hàm này sẽ tự động tìm session từ cookie và xóa nó
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