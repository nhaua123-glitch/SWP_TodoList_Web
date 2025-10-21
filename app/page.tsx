"use client";
import Link from "next/link";

export default function WelcomePage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      padding: "20px",
      background: "linear-gradient(-45deg, #a8edea, #fed6e3, #fef9d7, #c1e1c1)",
      backgroundSize: "400% 400%",
      animation: "pastelBackgroundShift 20s ease infinite",
      fontFamily: "'Quicksand', sans-serif",
      overflow: "hidden"
    }}>
      <h1 style={{
        fontFamily: "'Great Vibes', cursive",
        fontSize: "80px",
        color: "#7a8c99",
        textShadow: "0 0 15px rgba(255, 200, 220, 0.6)",
        marginBottom: 25,
        animation: "fadeSlide 1.5s ease forwards"
      }}>
        Welcome to TodoList App
      </h1>

      <p style={{
        fontSize: "24px",
        color: "#5c6b73",
        marginBottom: "40px",
        animation: "fadeSlide 1.8s ease forwards",
        opacity: 0
      }}>
        Breeze through your day, one task at a time!
      </p>

      <Link href="/signup" style={{
        padding: "20px 50px",
        backgroundColor: "#fed6e3",
        color: "#7a8c99",
        fontWeight: 700,
        fontSize: 22,
        borderRadius: 15,
        boxShadow: "0 6px 20px rgba(254, 214, 227, 0.6)",
        textDecoration: "none",
        transition: "all 0.3s ease",
        animation: "pulse 2s infinite"
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-4px) scale(1.05)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0) scale(1)")}
      >
        Get Started
      </Link>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Quicksand:wght@400;600;700&display=swap');

        @keyframes pastelBackgroundShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes fadeSlide {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 6px 20px rgba(254, 214, 227, 0.6); }
          50% { box-shadow: 0 10px 30px rgba(254, 214, 227, 0.9); }
        }
      `}</style>
    </div>
  );
}
