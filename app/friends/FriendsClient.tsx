"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./FriendsClient.module.css";


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
  const [statusMap, setStatusMap] = useState<Record<string, any>>({});

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

      // Fetch status for all friends
      const { data: statusData, error: statusError } = await supabase
        .from("user_status")
        .select("user_id, status, last_seen")
        .in("user_id", ids);

      if (!statusError && statusData) {
        const statusMapTemp: Record<string, any> = {};
        for (const s of statusData) {
          statusMapTemp[s.user_id] = s;
        }
        setStatusMap(statusMapTemp);
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

  const inviteMessageTone = inviteMsg.startsWith("✅")
    ? styles.inviteMessageSuccess
    : inviteMsg.startsWith("❌")
    ? styles.inviteMessageError
    : inviteMsg
    ? styles.inviteMessageInfo
    : "";

  const formatEmail = (id: string, fallbackEmail?: string | null) => {
    return profilesMap[id]?.email || fallbackEmail || id;
  };

  const getStatusInfo = (userId: string) => {
    const status = statusMap[userId];
    if (!status) return { text: "offline", icon: "⚫", color: "gray" };
    
    if (status.status === "online") {
      return { text: "online", icon: "🟢", color: "green" };
    } else {
      const lastSeen = new Date(status.last_seen);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / 60000);
      
      let timeText = "offline";
      if (diffMinutes < 5) timeText = "just now";
      else if (diffMinutes < 60) timeText = `${diffMinutes}m ago`;
      else if (diffMinutes < 1440) timeText = `${Math.floor(diffMinutes / 60)}h ago`;
      else timeText = `${Math.floor(diffMinutes / 1440)}d ago`;
      
      return { text: timeText, icon: "⚫", color: "gray" };
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.kicker}>Connections</span>
          <h1>Friends & invites</h1>
          <p className={styles.subtitle}>
            {friends.length ? `${friends.length} friends` : "No friends yet"}
            {` · ${pendingReceived.length} incoming · ${pendingSent.length} sent`}
          </p>
        </div>
        <Link href="/calendar" className={styles.backButton}>
          ← Back to Calendar
        </Link>
      </header>

      <section className={styles.inviteCard}>
        <div className={styles.inviteContent}>
          <div className={styles.inviteText}>
            <span className={styles.badge}>Invite</span>
            <h2>Grow your circle</h2>
            <p>
              Send an invitation by email to collaborate, share tasks, and stay in sync.
            </p>
          </div>
          <form onSubmit={handleInvite} className={styles.inviteForm}>
            <input
              type="email"
              placeholder="Enter your friend&apos;s email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className={styles.inviteInput}
            />
            <button type="submit" className={styles.inviteButton}>
              Send invite
            </button>
          </form>
        </div>
        {inviteMsg && (
          <p className={`${styles.inviteMessage} ${inviteMessageTone}`}>{inviteMsg}</p>
        )}
      </section>

      <section className={styles.columns}>
        <div className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <h3>Incoming invites</h3>
              <span className={styles.panelMeta}>{pendingReceived.length} awaiting action</span>
            </div>
            <span className={styles.panelIcon} aria-hidden>
              📪
            </span>
          </header>
          {pendingReceived.length ? (
            <ul className={styles.list}>
              {pendingReceived.map((p) => (
                <li key={p.id} className={styles.listItem}>
                  <div className={styles.cardMeta}>
                    <span className={`${styles.avatar} ${styles.avatarPending}`} aria-hidden>
                      📪
                    </span>
                    <div className={styles.cardText}>
                      <span className={styles.cardTitle}>{formatEmail(p.sender_id, p.sender_email)}</span>
                      <span className={styles.cardSubtitle}>Waiting for your response</span>
                    </div>
                  </div>
                  <div className={styles.actionGroup}>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.acceptButton}`}
                      onClick={() => updateStatus(p.id, "accepted")}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.rejectButton}`}
                      onClick={() => updateStatus(p.id, "rejected")}
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>No incoming invites right now.</div>
          )}
        </div>

        <div className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <h3>Sent invites</h3>
              <span className={styles.panelMeta}>{pendingSent.length} awaiting reply</span>
            </div>
            <span className={styles.panelIcon} aria-hidden>
              📤
            </span>
          </header>
          {pendingSent.length ? (
            <ul className={styles.list}>
              {pendingSent.map((p) => (
                <li key={p.id} className={styles.listItem}>
                  <div className={styles.cardMeta}>
                    <span className={`${styles.avatar} ${styles.avatarSent}`} aria-hidden>
                      ⏳
                    </span>
                    <div className={styles.cardText}>
                      <span className={styles.cardTitle}>{formatEmail(p.receiver_id, p.receiver_email)}</span>
                      <span className={styles.cardSubtitle}>Invitation sent</span>
                    </div>
                  </div>
                  <div className={styles.actionGroup}>
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => deleteFriend(p.id)}
                    >
                      Cancel invite
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>You haven&apos;t sent any invites yet.</div>
          )}
        </div>

        <div className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <h3>Friends</h3>
              <span className={styles.panelMeta}>{friends.length ? `${friends.length} connected` : "No friends yet"}</span>
            </div>
            <span className={styles.panelIcon} aria-hidden>
              🤝
            </span>
          </header>
          {friends.length ? (
            <ul className={styles.list}>
              {friends.map((f) => {
                const friendId = f.sender_id === user.id ? f.receiver_id : f.sender_id;
                const statusInfo = getStatusInfo(friendId);
                return (
                  <li key={f.id} className={styles.listItem}>
                    <div className={styles.cardMeta}>
                      <span className={`${styles.avatar} ${styles.avatarAccepted}`} aria-hidden>
                        🤝
                      </span>
                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>{formatEmail(friendId, f.receiver_email || f.sender_email)}</span>
                        <span className={styles.cardSubtitle}>{statusInfo.icon} {statusInfo.text}</span>
                      </div>
                    </div>
                    <div className={styles.actionGroup}>
                      <button
                        type="button"
                        className={`${styles.actionButton} ${styles.dangerButton}`}
                        onClick={() => deleteFriend(f.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.empty}>Start inviting friends to see them here.</div>
          )}
        </div>
      </section>
    </div>
  );
}
 