"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Supabase đăng nhập → tự tạo cookie sb-access-token / sb-refresh-token
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      if (!data.session) throw new Error("Login failed: session missing");

      // Supabase đã tạo cookie → middleware / page khác có thể nhận session
      console.log("Login success:", data.user);
      router.replace("/calendar"); // redirect sau khi login
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.loginForm}>
          <form className={styles.formBox} onSubmit={handleSubmit}>
            <h2>Login</h2>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <div style={{ display: "flex", alignItems: "center", margin: "16px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#eee" }} />
              <span style={{ margin: "0 12px", color: "#aaa", fontSize: 14 }}>or</span>
              <div style={{ flex: 1, height: 1, background: "#eee" }} />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className={styles.googleBtn}
              disabled={loading}
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                style={{ width: 20, height: 20, marginRight: 8 }}
              />
              Sign in with Google
            </button>

            <p className={styles.signupText} style={{ marginTop: 10 }}>
              Don’t have an account?{" "}
              <Link href="/signup" className={styles.signupLink}>
                Sign up
              </Link>
            </p>

            {error && <p className={styles.error}>{error}</p>}
          </form>
        </div>

        <div className={styles.rightPanel}>
          <p>A gentle way to manage your day.</p>
          <img
            src="https://cdn.shopify.com/s/files/1/0882/3478/files/to-do-list-6.jpg?v=1535084693"
            alt="to-do illustration"
            className={styles.illustration}
          />
        </div>
      </div>
    </div>
  );
}
