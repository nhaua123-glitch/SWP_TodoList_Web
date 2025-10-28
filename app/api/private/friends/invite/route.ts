import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/utils/auth";

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiver_id } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase
    .from("friends")
    .insert({ sender_id: user.id, receiver_id, status: "pending" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Friend invite sent!" });
}
