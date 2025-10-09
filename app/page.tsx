"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Kiểm tra mật khẩu xác nhận
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đăng ký thất bại");
      }

      // Hiển thị thông báo thành công và hướng dẫn xác thực email
      setError("");
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
      });

      // Thông báo thành công
      alert("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");

      // Chuyển hướng đến trang đăng nhập
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gradient-to-r from-pink-50 to-purple-100">
      {/* Form bên trái */}
      <div className="flex items-center justify-center p-10">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
            Create Account
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-400 text-white py-2 rounded-lg hover:bg-pink-500 transition disabled:bg-pink-300 disabled:cursor-not-allowed"
            >
              {loading ? "Đang xử lý..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-4 text-center text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-pink-500 hover:underline">
              Sign In
            </a>
          </p>
        </div>
      </div>

      {/* Ảnh bên phải */}
      <div className="hidden md:flex items-center justify-center p-10">
        <div className="text-center">
          <img
            src="https://lacemade.com/cdn/shop/files/d9e30c313qf2b6335a2df429d023bedd_900x.jpg?v=1748089885"
            alt="Fashion"
            className="rounded-2xl shadow-lg mb-6"
          />
          <p className="text-lg text-gray-600 italic font-script">
            "Style is a way to say who you are without speaking"
          </p>
        </div>
      </div>
    </div>
  );
}