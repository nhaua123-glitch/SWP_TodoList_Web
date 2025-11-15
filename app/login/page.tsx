"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";
import { createBrowserClient } from '@supabase/ssr'

// Supabase client (giữ nguyên)
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
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      if (!data.session) throw new Error("Login failed: session missing");

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
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder=""
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder=""
            />
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Dấu gạch "or" - Đã chuyển style vào CSS module */}
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>or</span>
              <div className={styles.dividerLine} />
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
                width={20} // Dùng thuộc tính width/height thay vì style inline
                height={20}
              />
              Sign in with Google
            </button>

            <p className={styles.signupText}>
              Don’t have an account?{" "}
              <Link href="/signup" className={styles.signupLink}>
                Sign up
              </Link>
            </p>

            {error && <p className={styles.error}>{error}</p>}
          </form>
        </div>

        {/* Cột bên phải "Nghệ" */}
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