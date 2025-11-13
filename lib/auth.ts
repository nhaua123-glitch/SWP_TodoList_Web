"use client";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createClientComponentClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return (data.user as unknown as User) ?? null;
  } catch (err) {
    console.error('getCurrentUser error:', err);
    return null;
  }
}

export async function getCurrentSession() {
  try {
    const supabase = createClientComponentClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session ?? null;
  } catch (err) {
    console.error('getCurrentSession error:', err);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return !!session;
}

export async function logout(): Promise<boolean> {
  try {
    const supabase = createClientComponentClient();
    await supabase.auth.signOut();
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

export async function requireAuth(): Promise<boolean> {
  const authed = await isAuthenticated();
  if (!authed) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return false;
  }
  return true;
}
