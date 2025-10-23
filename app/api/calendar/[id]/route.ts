// DÁN TOÀN BỘ CODE NÀY VÀO FILE app/api/calendar/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Lấy sự kiện lịch theo ID (HÀM ĐÃ SỬA)
export async function GET(
  request: NextRequest,
  context: { params: { id: string } } // <-- CÚ PHÁP ĐÚNG
) {
  try {
    const id = context.params.id; // <-- LẤY ID TỪ CONTEXT
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Cập nhật sự kiện lịch (HÀM CỦA BẠN)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { title, description, start_date, end_date } = body;

    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        title,
        description,
        start_date,
        end_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Xóa sự kiện lịch (HÀM CỦA BẠN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}