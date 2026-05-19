import { createBrowserClient } from '@supabase/ssr'

type SupabaseClient = ReturnType<typeof createBrowserClient>

const globalForSupabase = global as unknown as { supabase: SupabaseClient | undefined }

export const supabase =
  globalForSupabase.supabase ??
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase
}
