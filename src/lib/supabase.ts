import { createClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

/** Public URL for an object in the venue-media bucket. */
export function mediaUrl(storagePath?: string | null): string | null {
  if (!storagePath) return null
  const { data } = supabase.storage.from('venue-media').getPublicUrl(storagePath)
  return data.publicUrl
}
