import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
export interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = cookies()
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      async get(name: string) {
        return (await cookieStore).get(name)?.value
      },
      async set(name: string, value: string, options) {
        (await cookieStore).set({ name, value, ...options })
      },
      async remove(name: string, options) {
        (await cookieStore).set({ name, value: '', ...options })
      },
    },
  }
)
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
    const cookieStore = cookies()
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      async get(name: string) {
        return (await cookieStore).get(name)?.value
      },
      async set(name: string, value: string, options) {
        (await cookieStore).set({ name, value, ...options })
      },
      async remove(name: string, options) {
        (await cookieStore).set({ name, value: '', ...options })
      },
    },
  }
)
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
    const cookieStore = cookies()
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      async get(name: string) {
        return (await cookieStore).get(name)?.value
      },
      async set(name: string, value: string, options) {
        (await cookieStore).set({ name, value, ...options })
      },
      async remove(name: string, options) {
        (await cookieStore).set({ name, value: '', ...options })
      },
    },
  }
)
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
