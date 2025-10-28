import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Khởi tạo Supabase và Resend
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ API gửi lời mời kết bạn
export async function POST(req: Request) {
  try {
    const { fromUserId, fromUsername, toEmail } = await req.json();

    if (!fromUserId || !fromUsername || !toEmail) {
      return NextResponse.json({ error: "Thiếu thông tin gửi lời mời" }, { status: 400 });
    }

    // 1️⃣ Kiểm tra xem người nhận có tồn tại trong profiles chưa
    const { data: targetProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", toEmail)
      .single();

    if (checkError || !targetProfile) {
      return NextResponse.json({ error: "Không tìm thấy người nhận" }, { status: 404 });
    }

    // 2️⃣ Tạo lời mời kết bạn trong DB
    const { data: friendRecord, error: insertError } = await supabase
      .from("friends")
      .insert([
        {
          user_id: fromUserId,
          friend_id: targetProfile.id,
          status: "pending",
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert friend error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const inviteId = friendRecord.id;

    // 3️⃣ Tạo URL accept/reject
    const acceptUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/private/friend/accept?id=${inviteId}`;
    const rejectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/private/friend/reject?id=${inviteId}`;

    // 4️⃣ Gửi email qua Resend
    const { error: mailError } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: toEmail,
      subject: "📨 Bạn có lời mời kết bạn mới!",
      html: `
        <h2>Xin chào!</h2>
        <p><b>${fromUsername}</b> đã gửi lời mời kết bạn cho bạn trên hệ thống TodoList.</p>
        <p>Bạn muốn chấp nhận lời mời này chứ?</p>
        <a href="${acceptUrl}" style="background:#16a34a;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;margin-right:8px;">✅ Accept</a>
        <a href="${rejectUrl}" style="background:#dc2626;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;">❌ Reject</a>
        <br/><br/>
        <p>Thân mến,<br/>TodoList App</p>
      `,
    });

    if (mailError) {
      console.error("Send email error:", mailError);
      return NextResponse.json({ error: mailError.message }, { status: 500 });
    }

    // ✅ Trả kết quả thành công
    return NextResponse.json({
      success: true,
      message: "Lời mời đã được gửi thành công!",
      inviteId,
    });
  } catch (err) {
    console.error("Friend send error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
