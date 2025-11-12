import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
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
    const body = await req.json();
    const { status } = body;

    if (!["online", "offline"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error: upsertError } = await supabase
      .from("user_status")
      .upsert(
        { user_id: user.id, status, last_seen: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Supabase error:", upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    const { data: statusData, error: selectError } = await supabase
      .from("user_status")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (selectError || !statusData) {
      return NextResponse.json({ error: selectError?.message || "Failed to fetch status" }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: statusData });
  } catch (err) {
    console.error("Set status error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
