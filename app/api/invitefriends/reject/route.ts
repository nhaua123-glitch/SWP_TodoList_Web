import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing invite ID" }, { status: 400 });
  }

  const { error } = await supabase
    .from("friends")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    console.error("Reject error:", error);
    return NextResponse.json({ error: "Failed to reject invite" }, { status: 500 });
  }

  return new NextResponse(`
    <html>
      <head><title>Friend Invite Rejected</title></head>
      <body style="font-family: sans-serif; text-align: center; padding-top: 80px;">
        <h2>❌ Bạn đã từ chối lời mời kết bạn.</h2>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/friends"
           style="display:inline-block;margin-top:20px;padding:10px 20px;
           background:#475569;color:white;border-radius:6px;text-decoration:none">
           Quay lại ứng dụng
        </a>
      </body>
    </html>
  `, { headers: { "Content-Type": "text/html" } });
}
