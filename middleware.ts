import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  // Tạo Supabase client với cookie
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  // Lấy cookie từ request
  // Supabase lưu cookie với định dạng sb-<project-ref>-auth-token
  const authCookie = request.cookies.get(Object.keys(request.cookies).find(key => key.startsWith('sb-') && key.endsWith('-auth-token')) || 'sb-auth-token')?.value;

  console.log('Middleware - Path:', request.nextUrl.pathname);
  console.log('Middleware - Auth cookie exists:', !!authCookie);

  // Nếu không có cookie, chuyển hướng đến trang đăng nhập
  if (!authCookie && request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('Middleware - Redirecting to login (no auth cookie)');
    const redirectUrl = new URL('/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Nếu đã đăng nhập và đang truy cập trang đăng nhập hoặc đăng ký, chuyển hướng đến dashboard
  if (authCookie && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/')) {
    console.log('Middleware - Checking session for redirect to dashboard');
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('Middleware - Redirecting to dashboard (user logged in)');
      const redirectUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

// Chỉ áp dụng middleware cho các route cần bảo vệ
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/'],
};