import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client using environment variables.
 */
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
