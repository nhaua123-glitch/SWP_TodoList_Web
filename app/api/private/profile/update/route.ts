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
    const { username, bio, mode } = body;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Validate input
    if (username && (typeof username !== "string" || username.length > 50)) {
      return NextResponse.json({ error: "Username quá dài hoặc không hợp lệ" }, { status: 400 });
    }
    if (bio && (typeof bio !== "string" || bio.length > 200)) {
      return NextResponse.json({ error: "Bio quá dài hoặc không hợp lệ" }, { status: 400 });
    }
    if (mode && !["public", "private"].includes(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const updates = {
      ...(username && { username }),
      ...(bio && { bio }),
      ...(mode && { mode }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
