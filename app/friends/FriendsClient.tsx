"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./friends.css";

interface Props {
  user: any;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FriendsClient({ user }: Props) {
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingReceived, setPendingReceived] = useState<any[]>([]);
  const [pendingSent, setPendingSent] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");

  useEffect(() => {
    if (user?.id) fetchFriends();
  }, [user]);

  // ✅ Lấy toàn bộ bạn bè & lời mời
  const fetchFriends = async () => {
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (error) {
      console.error("Supabase fetch error:", JSON.stringify(error, null, 2));
      return;
    }

    if (!data) return;

    setFriends(data.filter((f) => f.status === "accepted"));
    setPendingReceived(
      data.filter((f) => f.status === "pending" && f.receiver_id === user.id)
    );
    setPendingSent(
      data.filter((f) => f.status === "pending" && f.sender_id === user.id)
    );
  };

  // ✅ Gửi lời mời kết bạn
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMsg("");

    if (!inviteEmail) return setInviteMsg("⚠️ Vui lòng nhập email bạn bè.");
    if (inviteEmail === user.email)
      return setInviteMsg("⚠️ Không thể gửi cho chính mình.");

    const { data: receiverProfile, error: findError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", inviteEmail)
      .maybeSingle();

    if (findError) {
      console.error("Find user error:", findError);
      return setInviteMsg("❌ Lỗi khi tìm người dùng.");
    }

    if (!receiverProfile)
      return setInviteMsg("❌ Không tìm thấy người dùng này.");

    const { data: existing } = await supabase
      .from("friends")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverProfile.id}),and(sender_id.eq.${receiverProfile.id},receiver_id.eq.${user.id})`
      )
      .maybeSingle();

    if (existing)
      return setInviteMsg("⚠️ Lời mời đã tồn tại hoặc đã là bạn bè.");

    const { error: insertError } = await supabase.from("friends").insert([
      {
        sender_id: user.id,
        receiver_id: receiverProfile.id,
        sender_email: user.email,
        receiver_email: inviteEmail,
        status: "pending",
      },
    ]);

    if (insertError) {
      console.error("Insert error:", insertError);
      return setInviteMsg("❌ Lỗi khi gửi lời mời.");
    }

    setInviteMsg("✅ Đã gửi lời mời!");
    setInviteEmail("");
    fetchFriends();
  };

  // ✅ Chấp nhận / Từ chối lời mời
  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("friends").update({ status }).eq("id", id);
    if (error) console.error("Update error:", error);
    fetchFriends();
  };

  // ✅ Xóa bạn
  const deleteFriend = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa?")) return;
    const { error } = await supabase.from("friends").delete().eq("id", id);
    if (error) console.error("Delete error:", error);
    fetchFriends();
  };

  return (
    <div className="friends-container">
      <h2>👥 Bạn bè của tôi</h2>

      {/* Form gửi lời mời */}
      <form onSubmit={handleInvite}>
        <input
          type="email"
          placeholder="Nhập email bạn bè"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />
        <button type="submit">Gửi</button>
      </form>
      {inviteMsg && <p>{inviteMsg}</p>}

      {/* Lời mời đến */}
      <h3>📥 Lời mời đang chờ</h3>
      {pendingReceived.length === 0 ? (
        <p>Không có lời mời nào.</p>
      ) : (
        pendingReceived.map((p) => (
          <div key={p.id} className="friend-item">
            <span>{p.sender_email}</span>
            <div>
              <button className="accept" onClick={() => updateStatus(p.id, "accepted")}>✅</button>
<button className="reject" onClick={() => updateStatus(p.id, "rejected")}>❌</button>

            </div>
          </div>
        ))
      )}

      {/* Lời mời đã gửi */}
      <h3>⏳ Lời mời đã gửi</h3>
      {pendingSent.length === 0 ? (
        <p>Không có lời mời đã gửi.</p>
      ) : (
        pendingSent.map((p) => (
          <div key={p.id} className="friend-item">
            <span>{p.receiver_email}</span>
            <div>
              <button onClick={() => deleteFriend(p.id)}>🕓 Hủy</button>
            </div>
          </div>
        ))
      )}

      {/* Danh sách bạn bè */}
      <h3>✅ Danh sách bạn bè</h3>
      {friends.length === 0 ? (
        <p>Bạn chưa có bạn bè nào.</p>
      ) : (
        friends.map((f) => {
          const friendEmail =
            f.sender_id === user.id ? f.receiver_email : f.sender_email;
          return (
            <div key={f.id} className="friend-item">
              <span>{friendEmail}</span>
              <div>
                <button onClick={() => deleteFriend(f.id)}>🗑</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
