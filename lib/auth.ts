import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

// Lấy user từ localStorage
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Lấy session từ localStorage
export const getCurrentSession = (): Session | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const sessionStr = localStorage.getItem('session');
    return sessionStr ? JSON.parse(sessionStr) : null;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};

// Kiểm tra user đã đăng nhập chưa
export const isAuthenticated = (): boolean => {
  const user = getCurrentUser();
  const session = getCurrentSession();
  
  return !!(user && session && session.expires_at > Date.now() / 1000);
};

// Logout function
export const logout = async (): Promise<boolean> => {
  try {
    const session = getCurrentSession();
    
    // Gọi API logout
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ session })
    });

    const data = await response.json();

    // Xóa dữ liệu khỏi localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    
    // Xóa cookies
    document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Logout từ Supabase client
    await supabase.auth.signOut();

    return data.success || true; // Luôn trả về true để đảm bảo logout
  } catch (error) {
    console.error('Logout error:', error);
    
    // Vẫn xóa dữ liệu local ngay cả khi API fail
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    
    // Xóa cookies
    if (typeof document !== 'undefined') {
      document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
    
    return true;
  }
};

// Redirect đến login nếu chưa đăng nhập
export const requireAuth = (): boolean => {
  if (!isAuthenticated()) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return false;
  }
  return true;
};
