"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  user_metadata: {
    username: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra người dùng đã đăng nhập chưa
    const checkUser = async () => {
      try {
        const response = await fetch("/api/auth/user");

        if (!response.ok) {
          throw new Error("Không tìm thấy phiên đăng nhập");
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        // Nếu không có phiên đăng nhập, chuyển hướng về trang đăng nhập
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login");
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-pink-50 to-purple-100">
        <div className="text-2xl text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-50 to-purple-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-700">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-pink-400 text-white px-4 py-2 rounded-lg hover:bg-pink-500 transition"
            >
              Đăng xuất
            </button>
          </div>

          <div className="bg-pink-50 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Thông tin người dùng</h2>
            {user && (
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Username:</span> {user.user_metadata?.username || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {user.email}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Add todolist</h3>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">remove todolist</h3>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md hover:shadow-lg transition">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">goal todolist in month</h3>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}