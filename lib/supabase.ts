// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Đọc biến môi trường
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Kiểm tra biến môi trường
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables. Please check your .env.local file.')
  throw new Error('Supabase environment variables are missing.')
}

// Client cho client-side operations
export const supabase = createClient(supabaseUrl, supabaseKey)

// Client cho server-side operations (có quyền bypass RLS)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null
