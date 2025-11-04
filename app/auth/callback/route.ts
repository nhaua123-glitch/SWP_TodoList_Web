// File: app/auth/callback/route.ts

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Bắt buộc phải có dòng này
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // Tạo một supabase client cho server-side
    const supabase = createRouteHandlerClient({ cookies });
    
    // Đổi code lấy session và QUAN TRỌNG: LƯU SESSION VÀO COOKIE
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Chuyển hướng người dùng về trang calendar
  // Bạn có thể đổi '/calendar' thành bất cứ trang nào bạn muốn
  return NextResponse.redirect(`${requestUrl.origin}/calendar`);
}