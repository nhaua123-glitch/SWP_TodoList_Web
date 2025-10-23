"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";
import { supabase } from "@/lib/supabase";

interface AuthResponse {
  user?: any;
  session?: any;
  needsVerification?: boolean;
  error?: string;
}

export default function LoginPage() {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [needsVerification, setNeedsVerification] = useState<boolean>(false);
  const [verificationEmail, setVerificationEmail] = useState<string>("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!email || !password) {
      setError("Please fill in both email and password!");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok) {
        if (data.needsVerification) {
          setNeedsVerification(true);
          setVerificationEmail(email);
        }
        throw new Error(data.error || "Login failed");
      }

      if (data.user && data.session) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("session", JSON.stringify(data.session));
        console.log("Login successful:", data.user);
      }

      router.push("/calendar");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send email");

      setError("");
      alert("A new verification email has been sent! Please check your inbox.");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkEmailVerification = async (email: string) => {
    try {
      const response = await fetch("/api/auth/check-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok && data.email_confirmed) {
        setNeedsVerification(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Check verification error:", err);
      return false;
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
        {/* Login form */}
        <div className={styles.loginForm}>
          <form className={styles.formBox} onSubmit={handleSubmit}>
            <h2>Login</h2>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" required disabled={loading} />
            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" required disabled={loading} />
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Divider */}
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

            {needsVerification && (
              <div
                style={{
                  marginTop: 10,
                  padding: 10,
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffeaa7",
                  borderRadius: 5,
                }}
              >
                <p
                  style={{
                    color: "#856404",
                    margin: 0,
                    marginBottom: 10,
                  }}
                >
                  Your email hasn’t been verified yet. Please check your inbox
                  and click the verification link.
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading}
                    style={{
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: 3,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    Resend verification email
                  </button>
                  <button
                    type="button"
                    onClick={() => checkEmailVerification(verificationEmail)}
                    disabled={loading}
                    style={{
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: 3,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    Check again
                  </button>
                </div>
              </div>
            )}

            <p className={styles.signupText} style={{ marginTop: 10 }}>
              Don’t have an account?{" "}
              <Link href="/signup" className={styles.signupLink}>
                Sign up
              </Link>
            </p>
            {error && <p className={styles.error}>{error}</p>}
          </form>
        </div>

        {/* Right panel */}
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
