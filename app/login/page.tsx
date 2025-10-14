"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu!");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsVerification) {
          setNeedsVerification(true);
          setVerificationEmail(email);
        }
        throw new Error(data.error || "Đăng nhập thất bại");
      }

      if (data.user && data.session) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("session", JSON.stringify(data.session));
        console.log("Login successful, user saved:", data.user);
      }

      console.log("Redirecting to /calendar");
      router.push("/calendar");
    } catch (err: any) {
      setError(err.message);
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
      if (!response.ok) throw new Error(data.error || "Gửi email thất bại");

      setError("");
      alert("Email xác thực đã được gửi lại! Vui lòng kiểm tra hộp thư.");
    } catch (err: any) {
      setError(err.message);
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
      return response.ok && data.email_confirmed;
    } catch (err) {
      console.error("Check verification error:", err);
      return false;
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
    if (error) setError(error.message);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Form login */}
        <div className={styles.loginForm}>
          <form className={styles.formBox} onSubmit={handleSubmit}>
            <h2>Login</h2>

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              required
              disabled={loading}
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              required
              disabled={loading}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Login"}
            </button>

            {/* Đường kẻ và chữ "hoặc" */}
            <div style={{ display: "flex", alignItems: "center", margin: "16px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#eee" }} />
              <span style={{ margin: "0 12px", color: "#aaa", fontSize: 14 }}>hoặc</span>
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
              Đăng nhập với Google
            </button>

            {needsVerification && (
              <div style={{
                marginTop: 10,
                padding: 10,
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: 5
              }}>
                <p style={{ color: '#856404', margin: 0, marginBottom: 10 }}>
                  Email chưa được xác thực. Vui lòng kiểm tra email và click vào link xác thực.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: 3,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Gửi lại email xác thực
                  </button>
                  <button
                    type="button"
                    onClick={() => checkEmailVerification(verificationEmail)}
                    disabled={loading}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: 3,
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Kiểm tra lại
                  </button>
                </div>
              </div>
            )}

            <p className={styles.signupText} style={{ marginTop: 10 }}>
              Chưa có tài khoản?{" "}
              <Link href="/signup" className={styles.signupLink}>
                Đăng ký
              </Link>
            </p>

            {error && <p className={styles.error}>{error}</p>}
          </form>
        </div>

        {/* Panel bên phải */}
        <div className={styles.rightPanel}>
          <img
            src="https://lacemade.com/cdn/shop/files/logo_55354c7e-2cf6-4a7c-bcf3-f83d1c8ac0d2_230x.png?v=1747985772"
            alt="logo"
            style={{ maxWidth: "220px", marginBottom: "20px" }}
          />
          <p>
            Spend a sweet summer with LaceMade and more exciting things are waiting for you to discover.
          </p>
          <img
            src="https://lacemade.com/cdn/shop/files/2_e003ffac-8ca6-454a-9f48-e5435c086ad6_1800x.jpg?v=1747726087"
            alt="Shopping illustration"
            style={{ marginTop: "30px" }}
          />
        </div>
      </div>
    </div>
  );
}
