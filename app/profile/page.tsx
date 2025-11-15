// app/profile/page.tsx
"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import styles from "./profile.module.css";
import Link from "next/link";

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isYesterday = (d1: Date, d2: Date) => {
  const yesterday = new Date(d2);
  yesterday.setDate(d2.getDate() - 1);
  return isSameDay(d1, yesterday);
};

export default function MyProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [mode, setMode] = useState("private");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [meId, setMeId] = useState<string | null>(null);
  const [imgOk, setImgOk] = useState(true);
  const [streak, setStreak] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const normalizeAvatarUrl = (url: string) => {
    if (!url) return "";
    let u = url.trim();
    // Google Drive: /file/d/<id>/view or open?id=<id>
    const driveFile = u.match(/drive\.google\.com\/file\/d\/([^/]+)\//);
    const driveOpen = u.match(/[?&]id=([^&]+)/);
    const isDrive = u.includes("drive.google.com");
    if (isDrive) {
      const id = (driveFile && driveFile[1]) || (driveOpen && driveOpen[1]);
      if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
    }
    // Dropbox: ?dl=0 -> ?raw=1
    if (u.includes("dropbox.com")) {
      if (u.includes("dl=0")) u = u.replace("dl=0", "raw=1");
      else if (!u.includes("dl=") && !u.includes("raw=")) u += (u.includes("?") ? "&" : "?") + "raw=1";
      return u;
    }
    return u;
  };

  // Preset SVG avatar generator (emoji on colored circle)
  const makeEmojiSvgDataUrl = (emoji: string, bg = "#e4b5e8") => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>
      <defs><style>@font-face{font-family: system-ui;}</style></defs>
      <circle cx='60' cy='60' r='58' fill='${bg}'/>
      <text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-size='64'>${emoji}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const presetEmojis = [
    "🐱","🐶","🐼","🐰","🦊","🦁","🐮","🐷","🐯","🐨","🐻","🐻‍❄️",
    "🐸","🐹","🐭","🐔","🐤","🐧","🦉","🦅","🐙","🐢"
  ];
  const presetColors = ["#e4b5e8","#94bbe9","#b8f1eb","#f2dcf4","#c7e1ff","#fde2f3","#d1fadf","#ffe8b5"]; 

  // --- BẮT ĐẦU: Thay thế code từ đây ---

  // Hàm logic chính: Lấy profile VÀ tính/cập nhật streak
  const fetchProfileAndStreak = async (userId: string) => {
    const { data: prof, error: profError } = await supabase
      .from("profiles")
      .select("id, username, bio, mode, avatar_url, current_streak, last_login") // <-- Sửa select
      .eq("id", userId)
      .maybeSingle();

    if (profError) {
      console.error("Lỗi khi lấy profile (streak):", profError);
      return;
    }

    if (prof) {
      // 1. Set dữ liệu profile (như cũ)
      setProfile(prof);
      setUsername(prof.username || "");
      setBio(prof.bio || "");
      setMode((prof.mode as "public" | "private") || "private");
      setAvatarUrl(prof.avatar_url || "");

      // 2. Logic tính toán Streak (y hệt trang calendar)
      const today = new Date();
      let newStreak = 0;
      let updatePayload: any = {};

      const lastLogin = prof.last_login ? new Date(prof.last_login) : null;
      const currentStreak = prof.current_streak || 0;

      if (!lastLogin) {
        newStreak = 1;
        updatePayload = { current_streak: 1, last_login: today.toISOString() };
      } else if (isSameDay(lastLogin, today)) {
        newStreak = currentStreak;
      } else if (isYesterday(lastLogin, today)) {
        newStreak = currentStreak + 1;
        updatePayload = { current_streak: newStreak, last_login: today.toISOString() };
      } else {
        newStreak = 1;
        updatePayload = { current_streak: 1, last_login: today.toISOString() };
      }

      // 3. Cập nhật state (để hiển thị)
      setStreak(newStreak); 

      // 4. Cập nhật CSDL (nếu cần)
      if (Object.keys(updatePayload).length > 0) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", userId);
        if (updateError) console.error("Lỗi cập nhật streak:", updateError);
      }
    }
  };

  // useEffect đầu tiên: Lấy thông tin khi tải trang
  useEffect(() => {
    const fetchMe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      setMeId(user.id);
      await fetchProfileAndStreak(user.id); // <-- Gọi hàm logic mới
    };
    fetchMe();
  }, []);

  // useEffect thứ hai: Đồng bộ khi auth thay đổi
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const id = session?.user?.id ?? null;
      setMeId(id as any);
      if (id) {
        await fetchProfileAndStreak(id); // <-- Gọi hàm logic mới
      } else {
        // Clear nếu logout
        setProfile(null);
        setUsername("");
        setBio("");
        setMode("private");
        setAvatarUrl("");
        setStreak(0);
      }
    });
    return () => { subscription?.unsubscribe(); };
  }, []);

  // --- KẾT THÚC: Thay thế code đến đây ---

  const save = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const id = user?.id || meId;
    if (!id) { setMsg("Not logged in"); return; }
    setMsg("Saving...");
    const { error } = await supabase
      .from("profiles")
      .upsert({ id, username, bio, mode, avatar_url: avatarUrl });
    if (!error) setMsg("Saved successfully");
    else setMsg("Error: " + error.message);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Profile</h1>
        <div className={styles.avatarWrap}>
          <img
            src={avatarUrl || profile?.avatar_url || "https://placehold.co/120x120?text=Avatar"}
            alt="avatar"
            className={styles.avatar}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onLoad={() => setImgOk(true)}
            onError={(e) => { setImgOk(false); (e.currentTarget as HTMLImageElement).src = "https://placehold.co/120x120?text=Avatar"; }}
          />
        </div>
      </div>

      <div className={styles.form}>
        {streak > 0 && (
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: 'rgba(255, 165, 0, 0.1)', // Màu cam nhạt
            border: '1px solid rgba(255, 165, 0, 0.3)',
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '1.1em',
            color: '#e67e00', // Màu cam
            fontWeight: 500
          }}>
            🔥 Streak: <strong>{streak} days</strong>
          </div>
        )}
        <label className={styles.label}>Choose animal avatar (SVG)</label>
        <div className={styles.avatarGrid}>
          {presetEmojis.map((emo, idx) => {
            const dataUrl = makeEmojiSvgDataUrl(emo, presetColors[idx % presetColors.length]);
            const selected = avatarUrl === dataUrl;
            return (
              <button
                type="button"
                key={emo + idx}
                className={`${styles.avatarOption} ${selected ? styles.avatarSelected : ''}`}
                onClick={() => setAvatarUrl(dataUrl)}
                title={`Set avatar: ${emo}`}
              >
                <img src={dataUrl} alt={emo} style={{ width: 40, height: 40, borderRadius: '50%' }} />
              </button>
            );
          })}
        </div>

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

        <label className={styles.label}>Display mode</label>
        <select
          className={styles.input}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        <div className={styles.actions}>
          <button className={styles.button} onClick={save}>Save</button>
          <span className={styles.message}>{msg}</span>
        </div>
      </div>

      <Link href="/calendar"><button className={styles.fab}>← Back to Calendar</button></Link>
    </div>
  );
}
