// app/profile/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./profile.module.css";
import Link from "next/link";


export default function MyProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [mode, setMode] = useState<"public" | "private">("private");
  const [meId, setMeId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchMe = async () => {
      const res = await fetch("/api/auth/me"); // optionally implement /api/auth/me returning current user id
      const me = await res.json();
      if (!me?.id) return;
      setMeId(me.id);
      const r = await fetch(`/api/public/users/${me.id}`);
      const d = await r.json();
      setProfile(d);
      setUsername(d.username || "");
      setBio(d.bio || "");
      setMode((d.mode as "public" | "private") || "private");
    };
    fetchMe();
  }, []);

  const save = async () => {
    setMsg("Đang lưu...");
    const res = await fetch("/api/private/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, bio, mode }),
    });
    const json = await res.json();
    if (res.ok) setMsg("Lưu thành công");
    else setMsg("Lỗi: " + (json.error || "unknown"));
  };

  // Removed file upload; use preset avatars below

  // Predefined avatars (public assets) and quick setter without Storage
  const presetAvatars: string[] = [
    "/avatars/animal-kitty.svg",
    "/avatars/animal-dog.svg",
    "/avatars/animal-fox-cute.svg",
    "/avatars/animal-panda-cute.svg",
    "/avatars/animal-rabbit.svg",
    "/avatars/animal-bear-cute.svg",
    "/avatars/animal-lion-cute.svg",
    "/avatars/animal-penguin.svg",
    "/avatars/animal-koala.svg",
  ];

  const choosePreset = async (url: string) => {
    try {
      setMsg("Đang cập nhật avatar...");
      const res = await fetch("/api/private/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Cập nhật avatar thất bại");
      setProfile((p: any) => ({ ...(p || {}), avatar_url: url }));
      setMsg("Đã đổi avatar");
    } catch (err: any) {
      setMsg("Lỗi: " + (err?.message || "Không thể đổi avatar"));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          <span className={styles.titleOverlay}>My Profile</span>
          <img
            src={profile?.avatar_url || "/default-avatar.png"}
            alt="avatar"
            className={styles.avatar}
          />
        </div>
      </div>

      <div className={styles.form}>

        <label className={styles.label}>Username</label>
        <input
          className={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label className={styles.label}>Bio</label>
        <textarea
          className={styles.textarea}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <label className={styles.label}>Chế độ hiển thị</label>
        <select
          className={styles.input}
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        <label className={styles.label}>Avatar</label>

        <div className={styles.avatarGrid}>
          {presetAvatars.map((u) => (
            <button
              key={u}
              type="button"
              className={`${styles.avatarOption} ${profile?.avatar_url === u ? styles.avatarSelected : ""}`}
              onClick={() => choosePreset(u)}
              title="Chọn avatar"
            >
              <img src={u} alt="preset avatar" width={68} height={68} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.button} onClick={save}>Save</button>
          <span className={styles.message}>{msg}</span>
        </div>
      </div>
      <Link href="/calendar"><button className={styles.fab}>← Calendar</button></Link>
    </div>
  );
}
