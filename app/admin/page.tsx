"use client";
import React, { useState } from "react";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const verifyUser = async () => {
    if (!email) {
      setError("Vui lòng nhập email");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmail("");
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyAllUsers = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/verify-all", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Đã xử lý ${data.totalProcessed} tài khoản. Thành công: ${data.successCount}`);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Admin - Xác thực tài khoản
        </h1>

        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Xác thực tài khoản cụ thể */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Xác thực tài khoản cụ thể</h2>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Nhập email cần xác thực"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={verifyUser}
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {loading ? "Đang xử lý..." : "Xác thực tài khoản"}
              </button>
            </div>
          </div>

          {/* Xác thực tất cả tài khoản */}
          <div className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Xác thực tất cả tài khoản</h2>
            <p className="text-gray-600 mb-4">
              Xác thực tất cả tài khoản chưa được xác thực trong hệ thống.
            </p>
            <button
              onClick={verifyAllUsers}
              disabled={loading}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              {loading ? "Đang xử lý..." : "Xác thực tất cả tài khoản"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-blue-500 hover:underline">
            ← Quay lại trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
