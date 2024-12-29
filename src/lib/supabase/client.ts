import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create client with debug storage
const customStorage = {
  getItem: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      console.log(`Getting auth item ${key}:`, item ? 'Present' : 'Not found');
      return item;
    } catch (error) {
      console.error(`Error getting auth item ${key}:`, error);
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      console.log(`Setting auth item ${key}`);
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting auth item ${key}:`, error);
    }
  },
  removeItem: (key: string) => {
    try {
      console.log(`Removing auth item ${key}`);
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing auth item ${key}:`, error);
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
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
