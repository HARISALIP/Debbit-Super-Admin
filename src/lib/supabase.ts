import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const envUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  ''
) as string

export const envAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  ''
) as string

export const isMissingConfig = !envUrl || !envAnonKey || envUrl.includes('your-project') || envAnonKey.includes('your-anon-key')

export const supabase: SupabaseClient = isMissingConfig
  ? createClient('https://placeholder.supabase.co', 'placeholder-anon-key')
  : createClient(envUrl, envAnonKey)
