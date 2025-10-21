"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./signup.module.css";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Đăng ký thất bại");

      setFormData({ username: "", email: "", password: "", confirmPassword: "" });
      alert("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/login" },
    });
    if (error) setError(error.message);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Form bên trái */}
        <div className={styles.loginForm}>
          <form className={styles.formBox} onSubmit={handleSubmit}>
            <h2>Create Account</h2>
            <input
              name="username"
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : "Sign Up"}
            </button>

            <button type="button" onClick={handleGoogleLogin} className={styles.googleBtn}>
              Sign up with Google
            </button>

            {error && <p className={styles.error}>{error}</p>}

            <p className={styles.signupText}>
              Have a account?{" "}
              <a href="/login" className={styles.signupLink}>
                Login
              </a>
            </p>
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
            A cozy corner for your dreams and duties.
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
