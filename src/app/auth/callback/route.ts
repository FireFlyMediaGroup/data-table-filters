import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (!code) {
      console.error('No code provided in callback');
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`);
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
    }

    if (!data.session) {
      console.error('No session returned after code exchange');
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_session`);
    }

    console.log('Authentication successful, redirecting to dashboard');
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
  } catch (error) {
    console.error('Unhandled error in callback:', error);
    const requestUrl = new URL(request.url);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=unknown`);
  }
}
