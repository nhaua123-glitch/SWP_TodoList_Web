import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  if (!userId) return NextResponse.json({ error: "Missing user ID" }, { status: 400 });

  // Dùng auth client để RLS cho phép chủ sở hữu xem profile của chính mình
  const supabaseAuth = createRouteHandlerClient({ cookies });

  const { data: authUserData } = await supabaseAuth.auth.getUser();
  const requester = authUserData?.user || null;

  const { data, error } = await supabaseAuth
    .from("profiles")
    .select("id, username, bio, avatar_url, mode")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Kiểm tra auth để cho chủ sở hữu xem private
  if (data.mode === "private") {
    if (!requester || requester.id !== userId) {
      return NextResponse.json({ error: "Profile is private" }, { status: 403 });
    }
  }

  return NextResponse.json(data);
}
