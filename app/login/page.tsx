"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu!");
      return;
    }

    try {
      setLoading(true);
      // ✅ Giả lập login tạm
      if (email === "test@gmail.com" && password === "123456") {
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify({ email }));
        }
        router.push("/calendar");
      } else {
        throw new Error("Sai email hoặc mật khẩu!");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // 🔹 Hiện tại chỉ thông báo, chưa kết nối API
    alert("Chức năng đăng nhập bằng Google đang được phát triển!");
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

            <div className={styles.divider}>
              <div className={styles.line}></div>
              <span>or</span>
              <div className={styles.line}></div>
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
              />
              Login with Google
            </button>

            {error && <p className={styles.error}>{error}</p>}

            <p className={styles.signupText} style={{ marginTop: 10 }}>
              Chưa có tài khoản?{" "}
              <Link href="/signup" className={styles.signupLink}>
                Đăng ký
              </Link>
            </p>
          </form>
        </div>

        {/* Panel bên phải */}
        <div className={styles.rightPanel}>
          <img
            src="https://lacemade.com/cdn/shop/files/logo_55354c7e-2cf6-4a7c-bcf3-f83d1c8ac0d2_230x.png?v=1747985772"
            alt="logo"
          />
          <p>A gentle way to manage your day.</p>
          <img
            src="https://lacemade.com/cdn/shop/files/2_e003ffac-8ca6-454a-9f48-e5435c086ad6_1800x.jpg?v=1747726087"
            alt="Shopping illustration"
          />
        </div>
      </div>
    </div>
  );
}
