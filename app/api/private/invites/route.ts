import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = cookies()
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
  get(name: string) {
    return cookieStore.get(name)?.value
  },
  set(name: string, value: string, options: CookieOptions) { // <-- Đã sửa
    cookieStore.set({ name, value, ...options })
  },
  remove(name: string, options: CookieOptions) { // <-- Đã sửa
    cookieStore.set({ name, value: '', ...options })
  },
},
  }
)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Lấy cả 2 loại lời mời
  const [received, sent] = await Promise.all([
    supabase
      .from('friends')
      .select('id, sender_id, receiver_id, status, created_at')
      .eq('receiver_id', user.id)
      .eq('status', 'pending'),
    supabase
      .from('friends')
      .select('id, sender_id, receiver_id, status, created_at')
      .eq('sender_id', user.id)
      .eq('status', 'pending'),
  ]);

  if (received.error || sent.error)
    return NextResponse.json({
      error: received.error?.message || sent.error?.message,
    }, { status: 500 });

  return NextResponse.json({
    invitesReceived: received.data || [],
    invitesSent: sent.data || [],
  });
}
