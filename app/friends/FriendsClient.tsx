"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

  // Heartbeat ngay trên trang Friends để cập nhật trạng thái online cho chính user hiện tại
  useEffect(() => {
    if (!user?.id) return;

    const updateStatus = async () => {
      try {
        await supabase
          .from("user_status")
          .upsert({
            user_id: user.id,
            status: "online",
            last_seen: new Date().toISOString(),
          });
      } catch (err) {
        console.error("[FriendsClient] Lỗi heartbeat user_status:", err);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000);

    return () => clearInterval(interval);
  }, [user, supabase]);

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

      const { data: statusData, error: statusError } = await supabase
        .from("user_status")
        .select("user_id, status, last_seen")
        .in("user_id", ids);

      console.log("[FriendsClient] friend IDs:", ids);
      console.log("[FriendsClient] statusData from user_status:", statusData, statusError);

      if (!profilesError && profilesData) {
        const map: Record<string, any> = {};

        const statusMap: Record<string, { status: string; last_seen: string | null }> = {};
        for (const s of statusData) {
          statusMap[s.user_id] = { status: s.status, last_seen: s.last_seen } as any;
        }

        for (const p of profilesData) {
          const statusEntry = statusMap[p.id];
          let onlineStatus = "offline";

          if (statusEntry?.last_seen) {
            const lastSeenTime = new Date(statusEntry.last_seen).getTime();
            const now = Date.now();
            const diffMs = now - lastSeenTime;
            const thresholdMs = 5 * 60 * 1000; // 5 phút gần nhất thì coi là online (dễ thấy hơn khi test)
            console.log("[FriendsClient] lastSeen diffMs for", p.id, "=", diffMs);
            if (diffMs <= thresholdMs) {
              onlineStatus = "online";
            }
          } else if (statusEntry?.status === "online") {
            onlineStatus = "online";
          }

          map[p.id] = {
            ...p,
            onlineStatus,
          };
        }

        console.log("[FriendsClient] profilesMap computed:", map);
        setProfilesMap(map);
      }
    }
  };

  // ✅ Gửi lời mời kết bạn
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMsg("");

    const trimmedEmail = inviteEmail.trim();

    if (!trimmedEmail)
      return setInviteMsg("⚠️ Vui lòng nhập email bạn bè.");
    if (trimmedEmail.toLowerCase() === (user.email || "").toLowerCase())
      return setInviteMsg("⚠️ Không thể gửi cho chính mình.");

    try {
      setInviteMsg("⏳ Đang gửi lời mời...");

      const res = await fetch("/api/private/friends/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: trimmedEmail }),
      });

      const payload = await res
        .json()
        .catch(() => ({ error: "Không đọc được phản hồi từ server." }));

      if (!res.ok || payload?.error) {
        console.error("Invite send error:", payload?.error);
        setInviteMsg(`❌ ${payload?.error || "Gửi lời mời thất bại."}`);
        return;
      }

      setInviteMsg("✅ Lời mời đã được gửi thành công!");
      setInviteEmail("");
      fetchFriends();
    } catch (err) {
      console.error("Invite send exception:", err);
      setInviteMsg("❌ Có lỗi khi gửi lời mời. Vui lòng thử lại.");
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

  return (
    <div className="friends-scope"> 
      <div className="friends-container">
        <div style={{ marginBottom: 12 }}>
          <Link href="/calendar">
            <button type="button" className="backBtn" title="Back to Calendar">
              ← Back to Calendar
            </button>
          </Link>
        </div>
        <h2>🌸 Bạn bè của tôi</h2>

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
              <div className="friend-info">
                <span className="friend-icon pending">💌</span>
                <span className="friend-email">{profilesMap[p.sender_id]?.email || p.sender_email || p.sender_id}</span>
              </div>
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
              <div className="friend-info">
                <span className="friend-icon sent">📤</span>
                <span className="friend-email">{profilesMap[p.receiver_id]?.email || p.receiver_email || p.receiver_id}</span>
              </div>
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
            const friendProfile = profilesMap[friendId];
            const statusLabel = friendProfile?.onlineStatus === "online" ? "Online" : "Offline";
            return (
              <div key={f.id} className="friend-item">
                <div className="friend-info">
                  <span className="friend-icon accepted">🌟</span>
                  <span className="friend-email">{friendProfile?.email || f.receiver_email || f.sender_email || friendId}</span>
                  
                  <span
                    className={`friend-status ${friendProfile?.onlineStatus === "online" ? "online" : "offline"}`}
                  >
                    <span className="friend-status-dot" />
                    {statusLabel}
                  </span>
                </div>
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