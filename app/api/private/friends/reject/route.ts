import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      const missing = [!url ? "NEXT_PUBLIC_SUPABASE_URL" : null, !serviceKey ? "SUPABASE_SERVICE_ROLE_KEY" : null]
        .filter(Boolean)
        .join(", ");
      return new NextResponse(
        `<h2 style="font-family:sans-serif;text-align:center;padding-top:80px;color:red">Server is missing Supabase configuration: ${missing}</h2>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey);

    // Cập nhật trạng thái "rejected"
    const { error, data } = await supabase
      .from("friends")
      .update({ status: "rejected" })
      .eq("id", id)
      .select("id");

    if (!error && (!data || data.length === 0)) {
      return new NextResponse(
        `<h2 style="font-family:sans-serif;text-align:center;padding-top:80px;color:red">Invite not found</h2>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 404 }
      );
    }

    if (error) {
      console.error("Reject error:", error);
      return new NextResponse(
        `<h2 style="font-family:sans-serif;text-align:center;padding-top:80px;color:red">
          ❌ Lỗi khi cập nhật trạng thái lời mời!
        </h2>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 500 }
      );
    }

    // ✅ Giao diện hiển thị sau khi từ chối
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Friend Invite Rejected</title>
        </head>
        <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; text-align: center; padding-top: 80px; background:#f9fafb;">
          <h2 style="color:#b91c1c;">❌ Bạn đã từ chối lời mời kết bạn.</h2>
          <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SITE_URL + '/friends' : '/'}"
             style="display:inline-block;margin-top:20px;padding:10px 20px; background:#475569;color:white;border-radius:6px;text-decoration:none">
             Quay lại trang chủ
          </a>
        </body>
      </html>
      `,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
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
