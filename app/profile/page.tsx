// app/profile/page.tsx
"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import styles from "./profile.module.css";
import Link from "next/link";

export default function MyProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [mode, setMode] = useState("private");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [meId, setMeId] = useState<string | null>(null);
  const [imgOk, setImgOk] = useState(true);

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

  useEffect(() => {
    const fetchMe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      setMeId(user.id);
      const { data: d } = await supabase
        .from("profiles")
        .select("id, username, bio, mode, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (d) {
        setProfile(d);
        setUsername(d.username || "");
        setBio(d.bio || "");
        setMode((d.mode as "public" | "private") || "private");
        setAvatarUrl(d.avatar_url || "");
      }
    };
    fetchMe();
  }, []);

  // Keep session in sync and reload profile when auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const id = session?.user?.id ?? null;
      setMeId(id as any);
      if (id) {
        const { data: d } = await supabase
          .from("profiles")
          .select("id, username, bio, mode, avatar_url")
          .eq("id", id)
          .maybeSingle();
        if (d) {
          setProfile(d);
          setUsername(d.username || "");
          setBio(d.bio || "");
          setMode((d.mode as "public" | "private") || "private");
          setAvatarUrl(d.avatar_url || "");
        }
      }
    });
    return () => { subscription?.unsubscribe(); };
  }, []);

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
