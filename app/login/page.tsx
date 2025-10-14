"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";  // dùng router để chuyển trang
import Link from "next/link";
import styles from "./login.module.css";

export default function LoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "").trim();

    // Lấy danh sách user từ localStorage
    const raw =
      typeof window !== "undefined" ? localStorage.getItem("users") : null;
    const users: Array<{ username: string; password: string }> = raw
      ? JSON.parse(raw)
      : [];

    // Kiểm tra login
    const matched = users.find(
      (u) => u.username === username && u.password === password
    );

    // Cho phép tài khoản demo admin/123
    if (!matched && (username !== "admin" || password !== "123")) {
      setError("Sai username hoặc mật khẩu!");
    } else {
      setError("");
      router.push("/calendar"); // chuyển sang trang calendar
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Form login */}
        <div className={styles.loginForm}>
          <form className={styles.formBox} onSubmit={handleSubmit}>
            <h2>Login</h2>
            <label htmlFor="username">Username</label>
            <input id="username" type="text" name="username" required />
            <label htmlFor="password">Password</label>
            <input id="password" type="password" name="password" required />
            <button type="submit">Login</button>
            <p style={{ marginTop: 10 }}>
              Chưa có tài khoản? <Link href="/signup">Đăng kí</Link>
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
            Spend a sweet summer with LaceMade and more exciting things are
            waiting for you to discover.
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
