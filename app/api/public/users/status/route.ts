import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 🔹 Lấy danh sách user đang online
export async function GET() {
  const { data, error } = await supabase
  .from("user_status")
  .select("user_id, status, last_seen")
  .eq("status", "online")
  .order("last_seen", { ascending: false });

if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}

return NextResponse.json({ online: data || [] });
}
