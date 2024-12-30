import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Add debug logging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event)
  console.log('Session state:', session ? 'Active' : 'None')
  if (session) {
    console.log('User ID:', session.user.id)
    console.log('Auth tokens present:', !!session.access_token)
  }
})
