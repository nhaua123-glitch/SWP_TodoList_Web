import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Khởi tạo Supabase public (only for OAuth tokens table if needed). DB writes will use auth client below.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Gửi email bằng Gmail API (OAuth2)
async function sendGmailOAuth(toEmail: string, subject: string, html: string) {
  // Lấy token đã lưu (provider = 'google')
  const { data: tokensRow, error: tokenErr } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token, expiry_date")
    .eq("provider", "google")
    .single();

  if (tokenErr || !tokensRow?.refresh_token) {
    throw new Error("Missing Gmail OAuth token. Please initialize OAuth.");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.OAUTH_REDIRECT_URI!
  );

  oauth2Client.setCredentials({
    access_token: tokensRow.access_token || undefined,
    refresh_token: tokensRow.refresh_token,
    expiry_date: tokensRow.expiry_date || undefined,
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const from = process.env.EMAIL_FROM!; // tài khoản đã cấp quyền
  const msg = [
    `From: TodoList App <${from}>`,
    `To: ${toEmail}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
  ].join("\r\n");

  const raw = Buffer.from(msg)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });
}

// ✅ API gửi lời mời kết bạn
export async function POST(req: Request) {
  try {
    const { toEmail } = await req.json();
    if (!toEmail) {
      return NextResponse.json({ error: "Thiếu email người nhận" }, { status: 400 });
    }

    // Lấy user hiện tại từ session cookies
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore as any });
    const {
      data: { user },
      error: authErr,
    } = await supabaseAuth.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fromUserId = user.id;
    const fromUsername = user.email || "User";

    // Kiểm tra người nhận đã có tài khoản chưa
    const { data: targetProfile } = await supabaseAuth
      .from("profiles")
      .select("id, email")
      .eq("email", toEmail)
      .maybeSingle();

    // Tạo bản ghi lời mời
    let friendRecord: { id: string } | null = null;
    if (targetProfile?.id) {
      // Người nhận đã có tài khoản: lưu theo id và email
      const { data, error: insertError } = await supabaseAuth
        .from("friends")
        .insert([
          {
            sender_id: fromUserId,
            receiver_id: targetProfile.id,
            sender_email: user.email,
            receiver_email: toEmail,
            status: "pending",
          },
        ])
        .select("id")
        .single();
      if (insertError) {
        console.error("Insert friend error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      friendRecord = data as any;
    } else {
      // Người nhận chưa có tài khoản: lưu theo email
      const { data, error: insertError } = await supabaseAuth
        .from("friends")
        .insert([
          {
            sender_id: fromUserId,
            sender_email: user.email,
            receiver_email: toEmail,
            status: "pending",
          },
        ])
        .select("id")
        .single();
      if (insertError) {
        console.error("Insert friend (email) error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      friendRecord = data as any;
    }
    const inviteId = friendRecord!.id;

    // 3️⃣ Tạo URL accept/reject
    const acceptUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/private/friends/accept?id=${inviteId}`;
    const rejectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/private/friends/reject?id=${inviteId}`;

    // 4️⃣ Gửi email qua Gmail OAuth2
    try {
      await sendGmailOAuth(
        toEmail,
        "You have a new friend invitation",
        `
        <h2>Hello!</h2>
        <p><b>${fromUsername}</b> has sent you a friend invitation on the TodoList app.</p>
        <p>Would you like to accept this invitation?</p>
        <a href="${acceptUrl}" style="background:#16a34a;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;margin-right:8px;">Accept</a>
        <a href="${rejectUrl}" style="background:#dc2626;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;">Reject</a>
        <br/><br/>
        <p>Best regards,<br/>TodoList App</p>
        `
      );
    } catch (mailErr: any) {
      console.error("Send email error:", mailErr);
      return NextResponse.json({ error: mailErr?.message || "Send mail failed" }, { status: 500 });
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
