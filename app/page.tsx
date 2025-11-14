"use client";
import Link from "next/link";

export default function WelcomePage() {
  return (
    <div className="page">
      {/* Các yếu tố trang trí "kính" trôi nổi theo style Dashboard */}
      <div className="floatingElement circleLarge"></div>
      <div className="floatingElement circleMedium accent"></div>
      <div className="floatingElement square"></div>
      <div className="floatingElement triangle accent"></div>
      <div className="floatingElement hexagon"></div> {/* Thêm một hình nữa */}

      <main className="hero">
        {/* Hiệu ứng ánh sáng lấp lánh */}
        <div className="heroShimmer"></div>

        <h1 className="heroHeading">Welcome to TodoList App</h1>

        <p className="heroText">
          Breeze through your day, one task at a time!
        </p>

        {/* Nút chính "Get Started" (Style .logoutButton từ Dashboard) */}
        <Link href="/signup" className="ctaButton">
          Get Started
        </Link>

        {/* Nút phụ "Login" (Style .navButton từ Dashboard) */}
        <Link href="/login" className="secondaryButton">
          I already have an account
        </Link>
      </main>

      {/* Bắt đầu khối CSS.
        Toàn bộ style được lấy cảm hứng từ dashboard.module.css
      */}
      <style jsx>{`
        /* 1. NỀN (Lấy gradient từ .hero của Dashboard, tăng cường) */
        @keyframes gradientFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .page {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 24px;
          /* Tinh chỉnh gradient để có màu sắc tươi sáng và chuyển động mượt mà hơn */
          background: linear-gradient(
            160deg,
            color-mix(in srgb, var(--accent, #8ab8ff) 80%, #ffffff 20%),
            color-mix(in srgb, var(--accent, #8ab8ff) 30%, #1d1b27 70%),
            color-mix(in srgb, #ffffff 60%, var(--accent, #8ab8ff) 40%)
          );
          background-size: 500% 500%; /* Tăng kích thước để chuyển động mượt hơn */
          animation: gradientFlow 25s ease infinite; /* Animation chuyển động chậm */
          overflow: hidden;
        }

        /* 2. KHỐI PANEL (HERO) - "KÍNH MỜ NÂNG CAO" VÀ MÀU KHUNG "ĐẸP HƠN" */
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .hero {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 32px; /* Tăng khoảng cách nội dung */
          padding: 70px 50px; /* Padding lớn hơn */
          border-radius: 36px; /* Bo tròn mạnh mẽ hơn */

          /* MÀU KHUNG "ĐẸP HƠN": Gradient tinh tế */
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.85), /* Trắng hơn */
            color-mix(
              in srgb,
              var(--accent, #8ab8ff) 10%,
              rgba(255, 255, 255, 0.75)
            ) /* Accent nhẹ */
          );
          border: 1px solid rgba(255, 255, 255, 0.7); /* Viền rõ hơn */
          box-shadow: 0 30px 70px rgba(23, 15, 45, 0.25); /* Đổ bóng sâu hơn */
          backdrop-filter: blur(35px) saturate(180%); /* Blur mạnh hơn */

          overflow: hidden;
          width: 90%;
          max-width: 750px; /* Khung to hơn nữa */

          animation: fadeInScale 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s
            forwards; /* Animation mượt mà hơn */
          opacity: 0;
          transform: scale(0.9);
        }

        /* Hiệu ứng "Lấp Lánh" (Shimmer Effect) */
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .heroShimmer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3) 50%,
            transparent
          );
          transform: translateX(-100%);
          animation: shimmer 2.5s infinite forwards 3s; /* Bắt đầu sau 3s */
          pointer-events: none;
          opacity: 0.8;
          z-index: 1; /* Nằm trên nền hero, dưới nội dung */
        }

        /* 3. Typography (Chữ) - Tinh chỉnh */
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(25px); /* Cao hơn một chút */
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .heroHeading {
          position: relative;
          z-index: 2; /* Đảm bảo chữ nằm trên shimmer */
          margin: 0;
          font-size: 48px; /* Lớn hơn */
          font-weight: 900; /* Cực đậm */
          line-height: 1.15;
          color: var(--text-dark, #1f1a34);
          letter-spacing: -1.5px; /* Hẹp hơn để trông sắc nét */
          text-shadow: 0 5px 15px rgba(0, 0, 0, 0.08); /* Đổ bóng chữ sâu hơn */
          animation: fadeSlideUp 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s
            forwards;
          opacity: 0;
        }

       .heroText {
          position: relative;
          z-index: 2;
          margin: 0;
          font-size: 50px; /* Tăng 1px */
          color: var(--text-dark, #1f1a34); /* <-- THAY ĐỔI: Dùng màu text đậm */
          font-weight: 500; /* <-- THÊM MỚI: Tăng độ đậm */
          font-style: italic; /* <-- THÊM MỚI: In nghiêng */
          max-width: 600px;
          animation: fadeSlideUp 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 0.7s
            forwards;
          opacity: 0;
        }

        /* 4. NÚT CHÍNH (CTA Button) - Nâng cấp */
        .ctaButton {
          position: relative;
          z-index: 2;
          padding: 16px 40px; /* To hơn */
          border-radius: 14px; /* Bo tròn vừa phải */
          border: 1px solid rgba(255, 255, 255, 0.7); /* Viền sáng hơn */
          background: rgba(20, 18, 36, 0.85); /* Đậm hơn */
          color: #ffffff;
          font-weight: 700; /* Đậm hơn */
          font-size: 17px;
          box-shadow: 0 16px 35px rgba(10, 7, 25, 0.25); /* Đổ bóng sâu hơn */
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          text-decoration: none;
          margin-top: 30px; /* Khoảng cách lớn hơn */
          animation: fadeSlideUp 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 0.9s
            forwards;
          opacity: 0;
        }

        .ctaButton:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 22px 45px rgba(10, 7, 25, 0.4);
          filter: brightness(1.15);
          background: rgba(20, 18, 36, 0.95);
        }

        /* 5. NÚT PHỤ (Secondary Button) - Nâng cấp */
        .secondaryButton {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px; /* Tăng khoảng cách icon */
          padding: 12px 30px; /* To hơn */
          border-radius: 999px;
          border: 1px solid
            color-mix(in srgb, var(--accent, #8ab8ff) 50%, rgba(255, 255, 255, 0.4)); /* Viền accent rõ hơn */
          background: color-mix(
            in srgb,
            var(--accent, #8ab8ff) 25%,
            rgba(255, 255, 255, 0.9)
          ); /* Nền accent nhẹ */
          color: #1a152d; /* Màu text đậm hơn */
          font-weight: 600;
          font-size: 16px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          text-decoration: none;
          animation: fadeSlideUp 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 1.1s
            forwards;
          opacity: 0;
        }

        .secondaryButton:hover {
          transform: translateY(-3px);
          background: color-mix(
            in srgb,
            var(--accent, #8ab8ff) 40%,
            rgba(255, 255, 255, 0.95)
          );
          box-shadow: 0 12px 25px rgba(0, 0, 0, 0.18);
        }

        /* === CÁC YẾU TỐ TRÔI NỔI (FLOATINGS ELEMENTS) - Tăng cường === */
        @keyframes floatEffect {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          33% {
            transform: translateY(-25px) rotate(15deg) scale(1.08);
          }
          66% {
            transform: translateY(15px) rotate(-8deg) scale(0.95);
          }
          100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
        }

        .floatingElement {
          position: absolute;
          background: rgba(255, 255, 255, 0.2); /* Trong hơn */
          backdrop-filter: blur(18px) brightness(1.1); /* Blur mạnh, sáng hơn */
          border: 1px solid rgba(255, 255, 255, 0.5); /* Viền rõ hơn */
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); /* Đổ bóng sâu hơn */
          animation: floatEffect 15s ease-in-out infinite alternate; /* Chậm hơn */
          pointer-events: none;
          z-index: 5; /* Nằm giữa nền và hero chính */
        }

        .floatingElement.accent {
          background: color-mix(
            in srgb,
            var(--accent, #8ab8ff) 30%,
            transparent
          );
          border-color: color-mix(
            in srgb,
            var(--accent, #8ab8ff) 60%,
            transparent
          );
        }

        /* Vị trí và kích thước ngẫu nhiên */
        .circleLarge {
          width: 300px; /* Lớn hơn */
          height: 300px;
          border-radius: 50%;
          top: 10%;
          left: 8%;
          animation-delay: 1s;
        }

        .circleMedium.accent {
          width: 220px; /* Lớn hơn */
          height: 220px;
          border-radius: 50%;
          bottom: 15%;
          right: 12%;
          animation-delay: 4s;
          filter: hue-rotate(20deg); /* Thêm màu sắc khác biệt nhẹ */
        }

        .square {
          width: 250px; /* Lớn hơn */
          height: 250px;
          border-radius: 25%; /* Bo góc mềm hơn */
          top: 25%;
          right: 3%;
          animation-delay: 7s;
          transform: rotate(40deg); /* Xoay nhiều hơn */
        }

        .triangle.accent {
          width: 180px; /* Lớn hơn */
          height: 180px;
          border-radius: 25%;
          left: 3%;
          bottom: 8%;
          animation-delay: 10s;
          transform: rotate(-30deg);
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }

        .hexagon {
          width: 180px; /* Lớn hơn */
          height: 103.92px; /* Chiều cao cho hình lục giác */
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          position: absolute;
          top: 5%;
          right: 20%;
          animation-delay: 13s;
          transform: rotate(60deg);
        }

        .hexagon::before,
        .hexagon::after {
          content: "";
          position: absolute;
          width: 0;
          border-left: 90px solid transparent; /* Phù hợp với width */
          border-right: 90px solid transparent;
        }

        .hexagon::before {
          bottom: 100%;
          border-bottom: 51.96px solid rgba(255, 255, 255, 0.2);
        }

        .hexagon::after {
          top: 100%;
          border-top: 51.96px solid rgba(255, 255, 255, 0.2);
        }

        /* MEDIA QUERIES cho responsive */
        @media (max-width: 768px) {
          .hero {
            padding: 50px 30px;
            gap: 24px;
            border-radius: 30px;
          }
          .heroHeading {
            font-size: 38px;
          }
          .heroText {
            font-size: 17px;
          }
          .ctaButton {
            padding: 14px 32px;
            font-size: 16px;
          }
          .secondaryButton {
            padding: 10px 24px;
            font-size: 14px;
          }
          /* Ẩn bớt các hình trôi nổi trên mobile */
          .circleLarge,
          .square,
          .triangle.accent,
          .hexagon {
            display: none;
          }
          .circleMedium.accent {
            width: 150px;
            height: 150px;
            bottom: 5%;
            left: 5%;
          }
        }

        @media (max-width: 480px) {
          .hero {
            padding: 40px 20px;
            gap: 20px;
            border-radius: 24px;
          }
          .heroHeading {
            font-size: 30px;
            letter-spacing: -1px;
          }
          .heroText {
            font-size: 15px;
          }
          .ctaButton {
            padding: 12px 28px;
            font-size: 15px;
          }
          .secondaryButton {
            padding: 8px 20px;
          }
        }
      `}</style>
    </div>
  );
}