import { createClient } from '@supabase/supabase-js'

// Use server-side environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Debug environment variables
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Admin client environment variables:', {
    url: !!supabaseUrl,
    serviceKey: !!supabaseServiceRoleKey
  });
}

// Create admin client with service role key
export const createAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase admin environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
