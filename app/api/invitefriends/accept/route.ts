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
    .update({ status: "accepted" })
    .eq("id", id);

  if (error) {
    console.error("Accept error:", error);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }

  // Hiển thị trang xác nhận đơn giản
  return new NextResponse(`
    <html>
      <head><title>Friend Invite Accepted</title></head>
      <body style="font-family: sans-serif; text-align: center; padding-top: 80px;">
        <h2>✅ Bạn đã chấp nhận lời mời kết bạn thành công!</h2>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/friends"
           style="display:inline-block;margin-top:20px;padding:10px 20px;
           background:#2563eb;color:white;border-radius:6px;text-decoration:none">
           Quay lại ứng dụng
        </a>
      </body>
    </html>
  `, { headers: { "Content-Type": "text/html" } });
}
