'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Handle error messages from callback
  useEffect(() => {
    const url = new URL(window.location.href);
    const error = url.searchParams.get('error');
    const message = url.searchParams.get('message');
    
    if (error) {
      switch (error) {
        case 'no_code':
          setMessage('Authentication code missing. Please try again.');
          break;
        case 'auth_failed':
          setMessage('Authentication failed. Please try again.');
          break;
        case 'no_session':
          setMessage('Session creation failed. Please try again.');
          break;
        case 'unauthorized':
          setMessage(message || 'You are not authorized to access this application.');
          break;
        case 'link_expired':
          setMessage(message || 'Magic link has expired. Please request a new one by logging in again.');
          break;
        case 'unknown':
          setMessage('An unknown error occurred. Please try again.');
          break;
        default:
          setMessage(message || 'Login failed. Please try again.');
      }
      
      // Clear the error and message from URL
      url.searchParams.delete('error');
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const handleEmailPasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      // Successful login will trigger a redirect through the callback
    } catch (error: any) {
      console.error('Login error:', error);
      setMessage(error.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: 'wearefireflymedia.com', // Restrict to company domain
          },
        },
      });

      if (error) {
        console.error('Google login error:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Error:', error);
      setMessage(error.message || 'Error signing in with Google. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-500 text-white py-2 rounded ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
          >
            {isLoading ? 'Logging in...' : 'Login with Email'}
          </button>
        </form>
        <div className="mt-4">
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className={`w-full bg-red-500 text-white py-2 rounded ${
              isGoogleLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
            }`}
          >
            {isGoogleLoading ? 'Redirecting...' : 'Sign in with Google'}
          </button>
        </div>
        {message && (
          <div className={`mt-4 p-4 rounded text-center ${
            message.includes('Redirecting') 
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
