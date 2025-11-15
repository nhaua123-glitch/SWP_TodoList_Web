// File: components/LogoutButton.tsx
"use client"

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react';

// 1. Định nghĩa lại props giống như code cũ của bạn
interface LogoutButtonProps {
  session: Session | null; // Prop session bắt buộc
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

// 2. Thêm lại các props (className, children, style)
export default function LogoutButton({ 
  session, // Nhận session
  className = '', 
  children = 'Logout', // Giá trị mặc định
  style = {}
}: LogoutButtonProps) {
  
  const router = useRouter()
  const [loading, setLoading] = useState(false);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogout = async () => {
    if (loading) return;

    // Giữ lại logic confirm của bạn
    const confirmed = window.confirm('Bạn có chắc chắn muốn đăng xuất?');
    if (!confirmed) return;

    setLoading(true);
    try {
      // Gọi server logout route thay vì signOut trực tiếp
      // Cách này đảm bảo status được cập nhật TRƯỚC signOut
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        console.error('Logout API failed:', response.status);
        alert('Có lỗi xảy ra khi đăng xuất.');
        setLoading(false);
        return;
      }

      // Nếu server logout thành công, redirect
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout exception:', err);
      alert('Có lỗi xảy ra khi đăng xuất.');
      setLoading(false);
    }
  }

  // 3. Nếu không có session, không hiển thị gì cả
  if (!session) {
    return null; 
  }

  // 4. Nếu có session, hiển thị nút Logout VỚI ĐẦY ĐỦ STYLE VÀ CHILDREN
  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={className} // Dùng prop className
      style={style} // Dùng prop style
    >
      {loading ? 'Đang đăng xuất...' : children} {/* Dùng prop children */}
    </button>
  )
}