"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    setTimeout(() => router.push("/login"), 1200);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-white to-pink-200">
      <div className="flex flex-col md:flex-row w-11/12 max-w-5xl rounded-2xl shadow-2xl overflow-hidden bg-white/50 backdrop-blur-md">
        {/* Form bên trái */}
        <div className="flex-1 flex items-center justify-center bg-white/70 p-8">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-4"
          >
            <h2 className="text-3xl font-bold text-center text-pink-600">
              Đăng ký tài khoản
            </h2>
            <p className="text-center text-gray-500 text-sm mb-4">
              Tạo tài khoản mới để quản lý công việc dễ dàng hơn ✨
            </p>

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1 text-gray-600">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-600">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-600">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium mb-1 text-gray-600">
                Confirm password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>

            <button
              type="submit"
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-lg transition"
            >
              Create account
            </button>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            {success && <p className="text-green-600 text-sm text-center">{success}</p>}

            <p className="text-center text-sm mt-3">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-pink-500 hover:underline font-medium">
                Đăng nhập
              </Link>
            </p>
          </form>
        </div>

        {/* Panel bên phải */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-pink-200 via-pink-100 to-white">
          <img
            src="https://lacemade.com/cdn/shop/files/2_e003ffac-8ca6-454a-9f48-e5435c086ad6_1800x.jpg?v=1747726087"
            alt="logo"
            className="max-w-[500px] mb-6"
          />
          <p className="text-2xl font-serif text-pink-700">
            Welcome to ToDoList 🌸 
          </p>
        </div>
      </div>
    </div>
  );
}
