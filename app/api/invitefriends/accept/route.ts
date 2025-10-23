import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Tạo client Supabase public (ANON)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing invite ID" }, { status: 400 });
    }

    // Cập nhật trạng thái "accepted" cho lời mời có id tương ứng
    const { error } = await supabase
      .from("friends")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Accept error:", error);
      return NextResponse.json(
        { error: "Failed to accept invite" },
        { status: 500 }
      );
    }

    // Trả về HTML thông báo xác nhận
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>✅ Lời mời đã được chấp nhận</title>
        </head>
        <body style="font-family: system-ui, sans-serif; text-align: center; padding-top: 80px; background:#f9fafb;">
          <h2 style="color:#16a34a;">✅ Bạn đã chấp nhận lời mời kết bạn thành công!</h2>
          <p style="color:#374151;">Cảm ơn bạn đã sử dụng TodoList App.</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/friends"
             style="display:inline-block;margin-top:20px;padding:10px 20px;
             background:#2563eb;color:white;border-radius:6px;text-decoration:none;">
             ⬅️ Quay lại ứng dụng
          </a>
        </body>
      </html>
      `,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
