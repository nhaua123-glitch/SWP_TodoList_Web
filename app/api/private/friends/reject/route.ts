import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Khởi tạo Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    // Lấy invite ID từ URL query
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse(
        `<h2 style="font-family:sans-serif;text-align:center;padding-top:80px;color:red">
          ⚠️ Thiếu mã lời mời (invite ID không hợp lệ)
        </h2>`,
        { headers: { "Content-Type": "text/html" }, status: 400 }
      );
    }

    // Cập nhật trạng thái "rejected"
    const { error } = await supabase
      .from("friends")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) {
      console.error("Reject error:", error);
      return new NextResponse(
        `<h2 style="font-family:sans-serif;text-align:center;padding-top:80px;color:red">
          ❌ Lỗi khi cập nhật trạng thái lời mời!
        </h2>`,
        { headers: { "Content-Type": "text/html" }, status: 500 }
      );
    }

    // ✅ Giao diện hiển thị sau khi từ chối
    return new NextResponse(
      `
      <html>
        <head><title>Friend Invite Rejected</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 80px;">
          <h2>❌ Bạn đã từ chối lời mời kết bạn.</h2>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/friends"
             style="display:inline-block;margin-top:20px;padding:10px 20px;
             background:#475569;color:white;border-radius:6px;text-decoration:none">
             Quay lại trang chủ
          </a>
        </body>
      </html>
      `,
      { headers: { "Content-Type": "text/html" } }
    );

  } catch (err) {
    console.error("Reject route error:", err);
    return new NextResponse(
      `<h2 style="font-family:sans-serif;text-align:center;padding-top:80px;color:red">
        ⚠️ Lỗi server không xác định!
      </h2>`,
      { headers: { "Content-Type": "text/html" }, status: 500 }
    );
  }
}
