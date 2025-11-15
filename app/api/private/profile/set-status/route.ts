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
          async get(name: string) { // <-- Thêm async
            return (await cookieStore).get(name)?.value // <-- Thêm await
          },
          async set(name: string, value: string, options: CookieOptions) { // <-- Thêm async
            (await cookieStore).set({ name, value, ...options }) // <-- Thêm await
          },
          async remove(name: string, options: CookieOptions) { // <-- Thêm async
            (await cookieStore).set({ name, value: '', ...options }) // <-- Thêm await
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

    const now = new Date().toISOString();
    
    // Thử update trước
    const { data: updateData, error: updateError } = await supabase
      .from("user_status")
      .update({ status, last_seen: now })
      .eq("user_id", user.id);

    // Nếu không có record cũ, insert mới
    if (updateData && updateData.length === 0) {
      const { error: insertError } = await supabase
        .from("user_status")
        .insert({ user_id: user.id, status, last_seen: now });
      
      if (insertError) {
        console.error("Insert error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    } else if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
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
