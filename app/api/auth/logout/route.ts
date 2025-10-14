import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Lấy session từ request headers hoặc body
    const body = await request.json().catch(() => ({}));
    const { session } = body;

    // Nếu có session, sử dụng nó để logout
    if (session) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        // Vẫn trả về success vì có thể session đã hết hạn
      }
    } else {
      // Logout global (tất cả sessions)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
    }

    return NextResponse.json({ 
      message: 'Logged out successfully',
      success: true 
    });
  } catch (error) {
    console.error('Logout API Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET method để test API
export async function GET() {
  return NextResponse.json({
    message: 'Logout API is working!',
    method: 'GET',
    note: 'Use POST method to logout'
  });
}