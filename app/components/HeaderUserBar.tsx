"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";

export default function HeaderUserBar() {
  const [session, setSession] = useState<Session | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [open, setOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const user = session?.user;
      if (user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("avatar_url, username, bio")
          .eq("id", user.id)
          .maybeSingle();
        if (prof?.avatar_url) setAvatarUrl(prof.avatar_url);
        if (prof?.username) setUsername(prof.username);
        if (typeof prof?.bio === "string") setBio(prof.bio);
      }
    };
    load();
  }, []);

  if (!session) return null;

  return (
    <>
      <div
        className="helloPill"
        onClick={() => setOpen((s) => !s)}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: 999,
          border: '1px solid #e3c9ef',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(248,245,251,0.9))',
          boxShadow: '0 8px 20px rgba(0,0,0,0.10)',
          backdropFilter: 'blur(6px) saturate(1.1)'
        }}
        title="My Profile"
      >
        <span style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden>👋</span>
          <span className="blink-greet">Hello{username ? `, ${username}` : ''}</span>
        </span>
        <img
          src={avatarUrl || 'https://placehold.co/64x64?text=🙂'}
          alt="me"
          width={40}
          height={40}
          style={{ borderRadius: '50%', border: '2px solid #e3c9ef', objectFit: 'cover', transition: 'transform 0.2s ease' }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/64x64?text=%F0%9F%99%82'; }}
          onMouseOver={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'; }}
          onMouseOut={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
        />
      </div>
      {open && (
        <div
          style={{ position: 'fixed', top: 80, right: 16, zIndex: 1001, minWidth: 280, borderRadius: 12, border: '1px solid #e3c9ef', background: 'rgba(255,255,255,0.95)', boxShadow: '0 12px 28px rgba(0,0,0,0.14)', backdropFilter: 'blur(8px) saturate(1.2)', padding: 14 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/profile" title="Open profile to edit" onClick={() => setOpen(false)}>
              <img
                src={avatarUrl || 'https://placehold.co/56x56?text=🙂'}
                alt="me"
                width={56}
                height={56}
                style={{ borderRadius: '50%', border: '2px solid #e3c9ef', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.2s ease' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/56x56?text=%F0%9F%99%82'; }}
                onMouseOver={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)'; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
              />
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <strong style={{ fontSize: 16 }}>{username || session?.user?.user_metadata?.full_name || 'User'}</strong>
              <span style={{ fontSize: 13, color: '#666' }}>{session?.user?.email || session?.user?.user_metadata?.email}</span>
            </div>
          </div>
          {bio && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#444', whiteSpace: 'pre-wrap' }}>
              {bio}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Link href="/profile/view" style={{ flex: 1 }} onClick={() => setOpen(false)}>
              <div style={{ width: '100%', textAlign: 'center', padding: '9px 12px', borderRadius: 8, border: '1px solid #e3c9ef', background: '#f8f5fb', cursor: 'pointer', fontWeight: 600 }}>
                View Profile
              </div>
            </Link>
            <Link href="/login" style={{ flex: 1 }} onClick={async (e) => {
              e.preventDefault();
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}>
              <div style={{ width: '100%', textAlign: 'center', padding: '9px 12px', borderRadius: 8, border: '1px solid #e3c9ef', background: '#ffecef', color: '#d7263d', cursor: 'pointer', fontWeight: 700 }}>
                Logout
              </div>
            </Link>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes pastelGlow {
          0% {
            box-shadow: 0 8px 20px rgba(238, 174, 202, 0.20);
            border-color: #e3c9ef;
          }
          50% {
            box-shadow: 0 8px 22px rgba(148, 187, 233, 0.25);
            border-color: #cfe0fb;
          }
          100% {
            box-shadow: 0 8px 20px rgba(184, 241, 235, 0.22);
            border-color: #b8f1eb;
          }
        }

        @keyframes blink {
          0%, 100% { text-shadow: 0 0 0 rgba(255,255,255,0.0); transform: translateY(0); }
          50% { text-shadow: 0 0 10px rgba(255,255,255,0.55); transform: translateY(-1px); }
        }

        @keyframes textPastel {
          0%   { color: #3d2f66; }
          25%  { color: #2f6da5; }
          50%  { color: #2c8a7c; }
          75%  { color: #c45aa3; }
          100% { color: #3d2f66; }
        }

        .helloPill {
          animation: pastelGlow 6s ease-in-out infinite alternate;
        }

        .blink-greet {
          animation: blink 3.2s ease-in-out infinite, textPastel 8s linear infinite;
          font-weight: 700;
          text-shadow: 0 1px 0 rgba(255,255,255,0.35);
        }
      `}</style>
    </>
  );
}
