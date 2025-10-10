import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Lấy tất cả sự kiện lịch
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Tạo sự kiện lịch mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, start_date, end_date, user_id } = body;

    if (!title || !start_date || !user_id) {
      return NextResponse.json(
        { error: 'Title, start date, and user ID are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('calendar_events')
      .insert([
        {
          title,
          description,
          start_date,
          end_date,
          user_id
        }
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}