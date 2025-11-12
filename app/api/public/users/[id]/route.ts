import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  if (!userId) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, bio, avatar_url, mode")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Kiểm tra auth để cho chủ sở hữu xem private
  if (data.mode === "private") {
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
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Profile is private" }, { status: 403 });
    }
  }

  return NextResponse.json(data);
}
