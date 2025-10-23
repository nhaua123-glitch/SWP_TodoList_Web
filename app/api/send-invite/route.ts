import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, fromUser, inviteId } = await req.json();

    if (!to || !fromUser || !inviteId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }
    
    const acceptUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/invitefriends/accept?id=${inviteId}`;
    const rejectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/invitefriends/reject?id=${inviteId}`;



    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to,
      subject: "📨 Bạn có lời mời kết bạn mới!",
      html: `
        <h2>Chào bạn,</h2>
        <p><b>${fromUser}</b> đã gửi lời mời kết bạn cho bạn trên hệ thống TodoList!</p>
        <p>Bạn muốn chấp nhận lời mời này chứ?</p>
        <a href="${acceptUrl}" style="background:#16a34a;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;margin-right:8px;">✅ Accept</a>
        <a href="${rejectUrl}" style="background:#dc2626;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;">❌ Reject</a>
        <br/><br/>
        <p>Thân mến,<br/>TodoList App</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
