"use client";

import { useState, useEffect } from "react";
import "./friends.css";


interface Props {
  user: any;
  supabase: any;
}

export default function FriendsClient({ user, supabase }: Props) {
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingReceived, setPendingReceived] = useState<any[]>([]);
  const [pendingSent, setPendingSent] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (user?.id) {
      fetchFriends();
    }
  }, [user, supabase]); // Thêm supabase vào dependency array cho an toàn

  // ✅ Lấy toàn bộ bạn bè & lời mời
  const fetchFriends = async () => {
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .or(
        `sender_id.eq.${user.id},receiver_id.eq.${user.id},sender_email.eq.${user.email},receiver_email.eq.${user.email}`
      );

    if (error) {
      console.error("Supabase fetch error:", JSON.stringify(error, null, 2));
      return;
    }

    if (!data) return;

    setFriends(data.filter((f: { status: string; }) => f.status === "accepted"));
    setPendingReceived(
      data.filter((f: { status: string; receiver_id: any; }) => f.status === "pending" && f.receiver_id === user.id)
    );
    setPendingSent(
      data.filter((f: { status: string; sender_id: any; }) => f.status === "pending" && f.sender_id === user.id)
    );

    const ids = Array.from(
      new Set(
        data
          .flatMap((f) => [f.sender_id, f.receiver_id])
          .filter((id) => id && id !== user.id)
      )
    );

    if (ids.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, username")
        .in("id", ids);

      if (!profilesError && profilesData) {
        const map: Record<string, any> = {};
        for (const p of profilesData) {
          map[p.id] = p;
        }
        setProfilesMap(map);
      }
    }
  };

  // ✅ Gửi lời mời kết bạn
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMsg("");

    if (!inviteEmail)
      return setInviteMsg("⚠️ Vui lòng nhập email bạn bè.");
    if (inviteEmail === user.email)
      return setInviteMsg("⚠️ Không thể gửi cho chính mình.");

    const { data: receiverProfile, error: findError } = await supabase
      .from("profiles")
      .select("id, email")
      .ilike("email", inviteEmail.trim())
      .maybeSingle();

    if (findError) {
      console.error("Find user error:", findError);
      return setInviteMsg("❌ Lỗi khi tìm người dùng.");
    }
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

  // 💡 5. LỖI CÚ PHÁP LÀ Ở ĐÂY:
  // Lệnh "return" phải nằm BÊN TRONG hàm "FriendsClient"
  return (
    <div className="friends-scope"> 
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
              <span>{profilesMap[p.sender_id]?.email || p.sender_email || p.sender_id}</span>
              <div>
                <button
                  className="accept"
                  onClick={() => updateStatus(p.id, "accepted")}
                >
                  ✅
                </button>
                <button
                  className="reject"
                  onClick={() => updateStatus(p.id, "rejected")}
                >
                  ❌
                </button>
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
              <span>{profilesMap[p.receiver_id]?.email || p.receiver_email || p.receiver_id}</span>
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
            const friendId = f.sender_id === user.id ? f.receiver_id : f.sender_id;
            return (
              <div key={f.id} className="friend-item">
                <span>{profilesMap[friendId]?.email || f.receiver_email || f.sender_email || friendId}</span>
                <div>
                  <button onClick={() => deleteFriend(f.id)}>🗑</button>
                </div>
              </div>
            );
          })
        )}
      </div>
      </div>
  );
} 