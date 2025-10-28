"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Kiểu dữ liệu cho profile
interface Profile {
  id: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
}

// Kiểu dữ liệu cho bảng user_status trong Supabase
interface UserStatusPayload {
  user_id: string;
  status: "online" | "offline";
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  const userId = params.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  // --- 1️⃣ Fetch profile người dùng ---
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/public/users/${userId}`);
        if (!res.ok) throw new Error("Không thể tải profile.");
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Lỗi tải profile:", err);
      }
    }
    fetchProfile();
  }, [userId]);

  // --- 2️⃣ Kiểm tra trạng thái online ban đầu + subscribe realtime ---
  useEffect(() => {
    // Gọi API kiểm tra trạng thái hiện tại
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/public/users/status`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.online && Array.isArray(json.online)) {
          setIsOnline(json.online.some((u: any) => u.user_id === userId));
        }
      } catch (err) {
        console.error("Lỗi tải trạng thái:", err);
      }
    };
    checkStatus();

    // Đăng ký realtime Supabase
    const channel = supabase
      .channel("public:user_status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_status" },
        (payload) => {
          const newData = payload.new as UserStatusPayload | null;
          const oldData = payload.old as UserStatusPayload | null;

          // Khi user cập nhật trạng thái mới
          if (newData?.user_id === userId) {
            setIsOnline(newData.status === "online");
          }

          // Khi user bị xóa khỏi bảng user_status
          if (oldData?.user_id === userId && !newData) {
            setIsOnline(false);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  // --- 3️⃣ Giao diện hiển thị ---
  if (!profile) return <div>Đang tải profile...</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <img
          src={profile.avatar_url || "/default-avatar.png"}
          width={96}
          height={96}
          alt="avatar"
          style={{ borderRadius: "50%" }}
        />
        <div>
          <h2>{profile.username || "Unnamed"}</h2>
          <div style={{ color: isOnline ? "green" : "gray" }}>
            {isOnline ? "🟢 Online" : "⚪ Offline"}
          </div>
        </div>
      </div>

      <section style={{ marginTop: 16 }}>
        <h3>Bio</h3>
        <p>{profile.bio || "Không có mô tả."}</p>
      </section>
    </div>
  );
}
