"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import styles from "../calendar/calendar.module.css";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function FriendsPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingReceived, setPendingReceived] = useState<any[]>([]);
  const [pendingSent, setPendingSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // ✅ Lấy user từ localStorage
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (savedUser?.id) setUser(savedUser);
  }, []);

  // ✅ Lấy danh sách bạn bè khi có user
  useEffect(() => {
    if (user?.id) fetchFriends();
  }, [user]);

  // ✅ Gửi lời mời kết bạn
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMsg("");

    if (!inviteEmail) return setInviteMsg("⚠️ Vui lòng nhập email bạn bè.");
    if (inviteEmail === user.email)
      return setInviteMsg("⚠️ Không thể tự gửi lời mời cho chính mình.");

    try {
      // 🔹 1. Tìm receiver_id qua bảng profiles
      const { data: receiverProfile, error: findErr } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", inviteEmail)
        .single();

      if (findErr || !receiverProfile)
        return setInviteMsg("❌ Không tìm thấy người dùng có email này.");

      const receiver_id = receiverProfile.id;

      // 🔹 2. Kiểm tra xem đã có lời mời chưa
      const { data: existing } = await supabase
        .from("friends")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${user.id})`
        )
        .maybeSingle();

      if (existing)
        return setInviteMsg("⚠️ Lời mời đã tồn tại hoặc hai người đã là bạn.");

      // 🔹 3. Gửi lời mời vào bảng friends
      const { data: inserted, error } = await supabase
        .from("friends")
        .insert([
          {
            sender_id: user.id,
            receiver_id,
            sender_email: user.email,
            receiver_email: inviteEmail,
            status: "pending",
          },
        ])
        .select()
        .single(); // 👈 để lấy inviteId cho bước gửi email

      if (error) throw error;

      // 🔹 4. Sau khi insert thành công → gọi API gửi email qua Resend
      try {
        const res = await fetch("/api/send-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: inviteEmail,
            fromUser: user.email,
            inviteId: inserted.id, // 👈 dùng ID bạn vừa tạo
          }),
        });

        const result = await res.json();
        if (res.ok && result.success) {
          setInviteMsg("✅ Đã gửi lời mời kết bạn và email thông báo!");
        } else {
          console.error("Email gửi lỗi:", result.error);
          setInviteMsg("⚠️ Đã gửi lời mời, nhưng lỗi khi gửi email.");
        }
      } catch (mailErr) {
        console.error("Lỗi gửi email:", mailErr);
        setInviteMsg("⚠️ Đã gửi lời mời, nhưng lỗi khi gửi email.");
      }

      // 🔹 5. Làm mới giao diện
      setInviteEmail("");
      fetchFriends();
    } catch (err: any) {
      console.error(err);
      setInviteMsg("❌ Lỗi khi gửi lời mời: " + err.message);
    }
  };


  // ✅ Lấy danh sách bạn bè & lời mời
  const fetchFriends = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("friends")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (error) throw error;

      // Phân loại
      const accepted = data.filter((f) => f.status === "accepted");
      const received = data.filter(
        (f) => f.status === "pending" && f.receiver_id === user.id
      );
      const sent = data.filter(
        (f) => f.status === "pending" && f.sender_id === user.id
      );

      setFriends(accepted);
      setPendingReceived(received);
      setPendingSent(sent);
    } catch (err) {
      console.error("fetchFriends error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cập nhật trạng thái lời mời
  const handleUpdateStatus = async (friendId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: newStatus, updated_at: new Date() })
        .eq("id", friendId);

      if (error) throw error;

      alert(
        newStatus === "accepted"
          ? "✅ Đã chấp nhận lời mời!"
          : "❌ Đã từ chối lời mời!"
      );
      fetchFriends();
    } catch (err: any) {
      alert("⚠️ Lỗi khi cập nhật: " + err.message);
    }
  };

  // ✅ Hủy lời mời (chỉ người gửi được hủy)
  const handleCancelInvite = async (friendId: string) => {
    if (!confirm("Bạn có chắc muốn hủy lời mời này?")) return;

    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendId);

      if (error) throw error;
      alert("🗑 Đã hủy lời mời!");
      fetchFriends();
    } catch (err: any) {
      alert("❌ Lỗi khi hủy lời mời: " + err.message);
    }
  };

  // ✅ Xóa bạn bè
  const handleDeleteFriend = async (friendId: string) => {
    if (!confirm("Bạn có chắc muốn xóa bạn này?")) return;

    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendId);

      if (error) throw error;
      alert("🗑 Đã xóa bạn thành công!");
      fetchFriends();
    } catch (err: any) {
      alert("❌ Xóa thất bại: " + err.message);
    }
  };

  if (!user)
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        ⏳ Đang tải thông tin người dùng...
      </div>
    );

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>
        👥 Quản lý bạn bè
      </h2>

      {/* GỬI LỜI MỜI */}
      <div
        className={styles.friendInviteWidget}
        style={{
          maxWidth: 400,
          margin: "0 auto 40px",
          padding: 20,
          borderRadius: 12,
          background: "#f9fafb",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
          ✉️ Gửi lời mời kết bạn
        </h3>
        <form onSubmit={handleInvite} style={{ display: "flex", gap: 8 }}>
          <input
            type="email"
            placeholder="Nhập email bạn bè..."
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 6,
              border: "1px solid #ccc",
            }}
            required
          />
          <button
            type="submit"
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 16px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Gửi
          </button>
        </form>
        {inviteMsg && (
          <div
            style={{
              marginTop: 10,
              color: inviteMsg.startsWith("✅") ? "#16a34a" : "#dc2626",
            }}
          >
            {inviteMsg}
          </div>
        )}
      </div>

      {/* LỜI MỜI NHẬN */}
      <div style={{ maxWidth: 500, margin: "0 auto 30px" }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
          📥 Lời mời đang chờ bạn chấp nhận
        </h3>
        {pendingReceived.length === 0 ? (
          <p style={{ color: "#6b7280" }}>Không có lời mời nào.</p>
        ) : (
          pendingReceived.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#fff",
                padding: "10px 16px",
                borderRadius: 8,
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                marginBottom: 8,
              }}
            >
              <span>{p.sender_email}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleUpdateStatus(p.id, "accepted")}
                  style={{
                    background: "#22c55e",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  ✅ Chấp nhận
                </button>
                <button
                  onClick={() => handleUpdateStatus(p.id, "rejected")}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  ❌ Từ chối
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* LỜI MỜI BẠN ĐÃ GỬI */}
      <div style={{ maxWidth: 500, margin: "0 auto 30px" }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
          ⏳ Lời mời bạn đã gửi
        </h3>
        {pendingSent.length === 0 ? (
          <p style={{ color: "#6b7280" }}>Không có lời mời nào bạn đã gửi.</p>
        ) : (
          pendingSent.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#fff",
                padding: "10px 16px",
                borderRadius: 8,
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                marginBottom: 8,
              }}
            >
              <span>{p.receiver_email}</span>
              <button
                onClick={() => handleCancelInvite(p.id)}
                style={{
                  background: "#f59e0b",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                🕓 Hủy lời mời
              </button>
            </div>
          ))
        )}
      </div>

      {/* DANH SÁCH BẠN BÈ */}
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
          ✅ Bạn bè của tôi
        </h3>
        {friends.length === 0 ? (
          <p style={{ color: "#6b7280" }}>Bạn chưa có bạn bè nào.</p>
        ) : (
          friends.map((f) => {
            const friendEmail =
              f.sender_id === user.id
                ? f.receiver_email
                : f.sender_email;
            return (
              <div
                key={f.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f1f5f9",
                  padding: "10px 16px",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <span>{friendEmail}</span>
                <button
                  onClick={() => handleDeleteFriend(f.id)}
                  style={{
                    background: "#e11d48",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  🗑 Xóa
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* QUAY LẠI */}
      <Link href="/calendar">
        <button
          style={{
            marginTop: 40,
            background: "#475569",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          ⬅️ Quay lại Lịch
        </button>
      </Link>
    </div>
  );
}
