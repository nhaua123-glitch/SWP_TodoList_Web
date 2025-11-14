// app/profile/view/page.tsx
"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import styles from "./profileview.module.css";

export default function ProfileViewPage() {
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  const [mode, setMode] = useState<string>("private");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");
      const { data: p } = await supabase
        .from("profiles")
        .select("username, bio, mode, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (p) {
        setUsername(p.username || "");
        setBio(p.bio || "");
        setMode((p.mode as string) || "private");
        setAvatarUrl(p.avatar_url || "");
      }
    };
    loadProfile();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.helloSpacer} aria-hidden="true" />
      <div className={styles.header}>
        <Link href="/profile" title="Edit profile" className={styles.avatarLink}>
          <img
            src={avatarUrl || "https://placehold.co/120x120?text=Avatar"}
            alt="avatar"
            className={styles.avatar}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://placehold.co/120x120?text=Avatar"; }}
          />
        </Link>
        <div className={styles.titleWrap}>
          <h1 className={styles.title}>My Profile</h1>
          <div className={styles.subtitle}>{email}</div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.field}>
            <div className={styles.label}>Username</div>
            <div className={styles.value}>{username || "(Not set)"}</div>
          </div>
          <div className={styles.field}>
            <div className={styles.label}>Bio</div>
            <div className={styles.value}>{bio || "(Empty)"}</div>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.field}>
            <div className={styles.label}>Display mode</div>
            <div className={styles.modeBadge}>{mode}</div>
          </div>
        </div>
      </div>

      <div className={styles.actionShell}>
        <div className={styles.actions}>
          <Link href="/calendar"><button className={styles.btnPrimary}>← Back to Calendar</button></Link>
          <Link href="/profile"><button className={styles.btnPrimary}>Edit Profile</button></Link>
        </div>
      </div>
    </div>
  );
}
