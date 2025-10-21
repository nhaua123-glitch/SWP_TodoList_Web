import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const inviteId = searchParams.get("invite");
  const action = searchParams.get("action");

  if (!inviteId || !action) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  let status = "";
  if (action === "accept") status = "accepted";
  else if (action === "reject") status = "rejected";
  else return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const { error } = await supabase
    .from("friends")
    .update({ status })
    .eq("id", inviteId);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Database update failed" }, { status: 500 });
  }

  return new NextResponse(`
    <html>
      <body style="font-family:Arial; text-align:center; padding:50px;">
        <h2>${status === "accepted" ? "🎉 Lời mời đã được chấp nhận!" : "❌ Lời mời đã bị từ chối."}</h2>
        <a href="/friends" style="color:#2563eb;text-decoration:none;font-weight:600;">Quay lại ứng dụng</a>
      </body>
    </html>
  `, { headers: { "Content-Type": "text/html" } });
}
