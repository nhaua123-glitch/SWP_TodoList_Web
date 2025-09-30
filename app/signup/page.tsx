"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StoredUser = {
  username: string;
  password: string;
  email?: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm") || "");
    const email = String(formData.get("email") || "").trim();

    if (!username || !password || !confirm) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc.");
      setSuccess("");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      setSuccess("");
      return;
    }

    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      setSuccess("");
      return;
    }

    const raw = typeof window !== "undefined" ? localStorage.getItem("users") : null;
    const users: StoredUser[] = raw ? JSON.parse(raw) : [];

    const existed = users.some(u => u.username.toLowerCase() === username.toLowerCase());
    if (existed) {
      setError("Tên người dùng đã tồn tại.");
      setSuccess("");
      return;
    }

    const newUser: StoredUser = { username, password, email: email || undefined };
    const nextUsers = [...users, newUser];
    localStorage.setItem("users", JSON.stringify(nextUsers));

    setError("");
    setSuccess("Đăng ký thành công! Đang chuyển đến trang đăng nhập...");
    setTimeout(() => router.push("/login"), 900);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <form onSubmit={handleSubmit} style={{ width: 360, display: "flex", flexDirection: "column", gap: 12 }}>
        <h2>Sign up</h2>
        <label htmlFor="username">Username</label>
        <input id="username" name="username" type="text" />

        <label htmlFor="email">Email (tuỳ chọn)</label>
        <input id="email" name="email" type="email" />

        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" />

        <label htmlFor="confirm">Confirm password</label>
        <input id="confirm" name="confirm" type="password" />

        <button type="submit">Create account</button>
        {error ? (
          <p style={{ color: "#d00", marginTop: 4 }}>{error}</p>
        ) : success ? (
          <p style={{ color: "#0a0", marginTop: 4 }}>{success}</p>
        ) : null}
      </form>
    </div>
  );
}


