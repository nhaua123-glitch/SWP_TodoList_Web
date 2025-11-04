"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export default function LogoutButton({ 
  className = '', 
  children = 'Logout',
  style = {}
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    if (loading) return;
    
    const confirmed = window.confirm('Bạn có chắc chắn muốn đăng xuất?');
    if (!confirmed) return;

    try {
      setLoading(true);
      
      const success = await logout();
      
      if (success) {
        // Redirect về trang login
        router.push('/login');
      } else {
        alert('Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={className}
    >
      {loading ? 'Đang đăng xuất...' : children}
    </button>
  );
}
