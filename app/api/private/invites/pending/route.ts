import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('friends')
    .select('id, sender_id, receiver_id, status, created_at')
    .eq('receiver_id', user.id)
    .eq('status', 'pending');

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ invitesReceived: data });
}
