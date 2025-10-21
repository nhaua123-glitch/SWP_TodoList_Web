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
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // ✅ Lấy user khi browser load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(savedUser);
    }
  }, []);

  // ✅ Chờ có user mới fetch
  useEffect(() => {
    if (user?.id) fetchFriends();
  }, [user]);

  // ✅ Gửi lời mời kết bạn
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMsg("");

    if (!inviteEmail) {
      setInviteMsg("⚠️ Vui lòng nhập email bạn bè.");
      return;
    }

    if (!user?.id || !user?.email) {
      setInviteMsg("⚠️ Vui lòng đăng nhập để gửi lời mời.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("friends")
        .insert([
          {
            user_id: user.id,
            friend_email: inviteEmail,
            status: "pending", // dùng string
          },
        ])
        .select()
        .single();

      if (error || !data) {
        setInviteMsg("❌ Gửi lời mời thất bại: " + error?.message);
        return;
      }

      const res = await fetch("/api/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: inviteEmail,
          fromUser: user.email,
          inviteId: data.id,
        }),
      });

      const result = await res.json();
      if (result.error) {
        setInviteMsg("⚠️ Lưu lời mời thành công, nhưng gửi email thất bại.");
      } else {
        setInviteMsg("✅ Đã gửi email lời mời kết bạn!");
      }

      setInviteEmail("");
      fetchFriends();
    } catch (err: any) {
      console.error(err);
      setInviteMsg("❌ Lỗi hệ thống: " + err.message);
    }
  };

  // ✅ Lấy danh sách bạn bè
  const fetchFriends = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("friends")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      // Lọc theo string status
      setFriends(data.filter((f) => f.status === "accepted"));
      setPending(data.filter((f) => f.status === "pending"));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cập nhật trạng thái Accept / Reject
  const handleUpdateStatus = async (friendId: string | number, newStatus: "accepted" | "rejected") => {
    if (!friendId) {
      alert("⚠️ ID bạn bè không hợp lệ!");
      return;
    }

    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: newStatus }) // dùng string
        .eq("id", friendId);

      if (error) throw error;

      alert(newStatus === "accepted" ? "✅ Đã chấp nhận lời mời!" : "❌ Đã từ chối lời mời!");
      fetchFriends();
    } catch (err: any) {
      console.error("⚠️ Lỗi khi cập nhật trạng thái:", err);
      alert("⚠️ Lỗi khi cập nhật trạng thái: " + err.message);
    }
  };

  // ✅ Xóa bạn bè
  const handleDeleteFriend = async (friendId: string | number) => {
    if (!confirm("Bạn có chắc muốn xóa bạn này?")) return;

    try {
      const { error } = await supabase.from("friends").delete().eq("id", friendId);
      if (error) throw error;
      alert("🗑 Đã xóa bạn thành công!");
      fetchFriends();
    } catch (err: any) {
      console.error("❌ Lỗi khi xóa bạn:", err);
      alert("Xóa thất bại: " + err.message);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        ⏳ Đang tải thông tin người dùng...
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>👥 Quản lý bạn bè</h2>

      {/* GỬI LỜI MỜI */}
      <div className={styles.friendInviteWidget} style={{ maxWidth: 400, margin: "0 auto 40px", padding: 20, borderRadius: 12, background: "#f9fafb", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>✉️ Gửi lời mời kết bạn</h3>
        <form onSubmit={handleInvite} style={{ display: "flex", gap: 8 }}>
          <input type="email" placeholder="Nhập email bạn bè..." value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ccc" }} required />
          <button type="submit" style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}>Gửi</button>
        </form>
        {inviteMsg && <div style={{ marginTop: 10, color: inviteMsg.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{inviteMsg}</div>}
      </div>

      {/* LỜI MỜI CHỜ */}
      <div style={{ maxWidth: 500, margin: "0 auto 30px" }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>⏳ Lời mời đang chờ</h3>
        {pending.length === 0 ? <p style={{ color: "#6b7280" }}>Không có lời mời nào đang chờ.</p> : pending.map((p) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "10px 16px", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", marginBottom: 8 }}>
            <span>{p.friend_email}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleUpdateStatus(p.id, "accepted")} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>✅ Chấp nhận</button>
              <button onClick={() => handleUpdateStatus(p.id, "rejected")} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>❌ Từ chối</button>
            </div>
          </div>
        ))}
      </div>

      {/* DANH SÁCH BẠN BÈ */}
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>✅ Bạn bè của tôi</h3>
        {friends.length === 0 ? <p style={{ color: "#6b7280" }}>Bạn chưa có bạn bè nào.</p> : friends.map((f) => (
          <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f1f5f9", padding: "10px 16px", borderRadius: 8, marginBottom: 8 }}>
            <span>{f.friend_email}</span>
            <button onClick={() => handleDeleteFriend(f.id)} style={{ background: "#e11d48", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>🗑 Xóa</button>
          </div>
        ))}
      </div>

      {/* QUAY LẠI */}
      <Link href="/calendar">
        <button style={{ marginTop: 40, background: "#475569", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer" }}>⬅️ Quay lại Lịch</button>
      </Link>
    </div>
  );
}
