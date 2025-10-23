import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop(); // lấy id từ đường dẫn

  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT
export async function PUT(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop(); // lấy id từ URL

  try {
    const body = await request.json();
    const { title, description, start_date, end_date } = body;

    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        title,
        description,
        start_date,
        end_date,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data?.length)
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    return NextResponse.json(data[0]);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop(); // lấy id từ URL

  try {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } 
}
   