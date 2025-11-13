import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// GET - Lấy tasks (có thể filter theo user_id)
export async function GET(request: NextRequest) {
  try {

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

    // Lấy user từ cookie session
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (user) {
      query = query.eq('user_id', user.id)
    } else {
      query = query.is('user_id', null)
    }
    const { data, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Fetched ${data?.length || 0} tasks for user_id: ${user?.id || 'null'}`)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST - Tạo task mới
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { title, description, start_time, end_time, color, type } = body

    if (!title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Title, start_time, and end_time are required' },
        { status: 400 }
      )
    }

    const task = {
      user_id: user ? user.id : null,
      title,
      description: description || '',
      start_time,
      end_time,
      color: color || '#3174ad',
      type: type || 'work',
      completed: false,
    }

    const { data, error } = await supabase
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
