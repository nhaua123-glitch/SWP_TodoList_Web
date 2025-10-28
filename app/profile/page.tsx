// app/profile/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";


export default function MyProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchMe = async () => {
      const res = await fetch("/api/auth/me"); // optionally implement /api/auth/me returning current user id
      const me = await res.json();
      if (!me?.id) return;
      const r = await fetch(`/api/public/users/${me.id}`);
      const d = await r.json();
      setProfile(d);
      setUsername(d.username || "");
      setBio(d.bio || "");
    };
    fetchMe();
  }, []);

  const save = async () => {
    setMsg("Đang lưu...");
    const res = await fetch("/api/private/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, bio }),
    });
    const json = await res.json();
    if (res.ok) setMsg("Lưu thành công");
    else setMsg("Lỗi: " + (json.error || "unknown"));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>My Profile</h2>
      <label>Username</label>
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      <label>Bio</label>
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
      <div style={{ marginTop: 12 }}>
        <button onClick={save}>Save</button>
        <span style={{ marginLeft: 12 }}>{msg}</span>
      </div>
    </div>
  );
}
