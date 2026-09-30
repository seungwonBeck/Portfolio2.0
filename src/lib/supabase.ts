import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/** null when .env isn't configured — the forms show a notice instead of crashing. */
export const supabase = url && key ? createClient(url, key) : null
