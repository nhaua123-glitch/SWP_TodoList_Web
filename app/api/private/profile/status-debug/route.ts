import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            return (await cookieStore).get(name)?.value
          },
          async set(name: string, value: string, options: CookieOptions) {
            (await cookieStore).set({ name, value, ...options })
          },
          async remove(name: string, options: CookieOptions) {
            (await cookieStore).set({ name, value: '', ...options })
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: "Not authenticated",
        userError: userError?.message 
      }, { status: 401 });
    }

    // Get user_status record
    const { data: statusData, error: statusError } = await supabase
      .from('user_status')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (statusError && statusError.code !== 'PGRST116') {
      return NextResponse.json({ 
        error: "Failed to fetch user_status",
        statusError: statusError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email
      },
      user_status: statusData || null,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("Debug status error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST để test set offline
export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            return (await cookieStore).get(name)?.value
          },
          async set(name: string, value: string, options: CookieOptions) {
            (await cookieStore).set({ name, value, ...options })
          },
          async remove(name: string, options: CookieOptions) {
            (await cookieStore).set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { error: upsertError } = await supabase
      .from('user_status')
      .upsert(
        { user_id: user.id, status: 'offline', last_seen: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      return NextResponse.json({ 
        error: "Failed to update user_status",
        details: upsertError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "User status set to offline",
      user_id: user.id
    });

  } catch (err) {
    console.error("Debug POST error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
