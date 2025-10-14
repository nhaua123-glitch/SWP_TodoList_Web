"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [status, setStatus] = useState("Đang xác thực...");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Xử lý URL parameters từ email confirmation
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setError("Lỗi xác thực: " + error.message);
          setStatus("Xác thực thất bại");
          return;
        }

        if (data.session && data.session.user) {
          // Kiểm tra email đã được confirm chưa
          if (data.session.user.email_confirmed_at) {
            // Lưu session vào localStorage
            localStorage.setItem("user", JSON.stringify(data.session.user));
            localStorage.setItem("session", JSON.stringify(data.session));
            
            setStatus("Xác thực thành công!");
            setTimeout(() => {
              router.push("/calendar");
            }, 2000);
          } else {
            setError("Email chưa được xác thực hoàn toàn");
            setStatus("Xác thực thất bại");
          }
        } else {
          setError("Không tìm thấy session hoặc user");
          setStatus("Xác thực thất bại");
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError("Lỗi không xác định");
        setStatus("Xác thực thất bại");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      backgroundColor: "#f8f9fa"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "10px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
        maxWidth: "400px",
        width: "90%"
      }}>
        <h2 style={{ color: error ? "#dc3545" : "#28a745", marginBottom: "1rem" }}>
          {status}
        </h2>
        {error && (
          <p style={{ color: "#dc3545", marginBottom: "1rem" }}>
            {error}
          </p>
        )}
        {!error && status === "Xác thực thành công!" && (
          <p style={{ color: "#28a745" }}>
            Đang chuyển hướng đến trang chính...
          </p>
        )}
        {error && (
          <button 
            onClick={() => router.push("/login")}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Quay lại đăng nhập
          </button>
        )}
      </div>
    </div>
  );
}
