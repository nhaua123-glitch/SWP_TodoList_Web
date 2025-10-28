import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// GET - Lấy tasks (có thể filter theo user_id)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    // Sử dụng supabaseAdmin để bypass RLS
    const client = supabaseAdmin || supabase
    let query = client.from('tasks').select('*')
    
    // Nếu có user_id, filter theo user đó
    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      // Nếu không có user_id, chỉ lấy tasks có user_id = null (test data)
      query = query.is('user_id', null)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Fetched ${data?.length || 0} tasks for user_id: ${userId || 'null'}`)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST - Tạo task mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, start_time, end_time, color, type, user_id } = body

    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Title, start_time, and end_time are required' },
        { status: 400 }
      )
    }

    const task = {
      user_id: user_id || null,
      title,
      description: description || '',
      start_time,
      end_time,
      color: color || '#3174ad',
      type: type || 'work',
      completed: false,
    }

    // Sử dụng supabaseAdmin để bypass RLS
    const client = supabaseAdmin || supabase
    const { data, error } = await client
      .from('tasks')
      .insert([task])
      .select()

    if (error) {
      console.error('Error creating task:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data[0] })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
