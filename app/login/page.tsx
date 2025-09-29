"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
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
    
    try {
      setLoading(true);
      console.log("Đang gửi request login...");
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "Đăng nhập thất bại");
      }
      
      // Kiểm tra session và user data
      if (data.session && data.user) {
        console.log("Login thành công, đang redirect...");
        // Thêm delay nhỏ để đảm bảo session được lưu
        setTimeout(() => {
          router.push("/dashboard");
        }, 100);
      } else {
        throw new Error("Không nhận được thông tin session");
      }
    } catch (err: any) {
      console.error("Login error:", err);
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
            Đăng Nhập
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit}>
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
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-400 text-white py-2 rounded-lg hover:bg-pink-500 transition disabled:bg-pink-300 disabled:cursor-not-allowed"
            >
              {loading ? "Đang xử lý..." : "Đăng Nhập"}
            </button>
          </form>

          <p className="mt-4 text-center text-gray-600">
            Chưa có tài khoản?{" "}
            <a href="/" className="text-pink-500 hover:underline">
              Đăng Ký
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