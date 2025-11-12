// File: components/LogoutButton.tsx
// THAY THẾ TOÀN BỘ FILE BẰNG CODE NÀY

"use client"

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { useState } from 'react';

// 1. Nhận session từ prop (thay vì import lib/auth)
export default function LogoutButton({ session }: { session: Session | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false);
  
  // 2. Dùng browser client (client-side) để logout
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogout = async () => {
    if (loading) return;

    const confirmed = window.confirm('Bạn có chắc chắn muốn đăng xuất?');
    if (!confirmed) return;

    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      alert('Có lỗi xảy ra khi đăng xuất.');
    } else {
      router.push('/login'); // Chuyển về trang login
      router.refresh(); // Tải lại trang để server component cập nhật
    }
    
    setLoading(false);
  }

  // 3. Nếu không có session (chưa đăng nhập), không hiển thị gì cả
  if (!session) {
    return null; // Hoặc có thể hiển thị nút Login
    // return <button onClick={() => router.push('/login')}>Login</button>
  }

  // 4. Nếu có session, hiển thị nút Logout
  return (
    <button
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? 'Đang đăng xuất...' : 'Logout'}
    </button>
  )
}