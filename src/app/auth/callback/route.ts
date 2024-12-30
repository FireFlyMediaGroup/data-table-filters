import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    // Check for error parameters first
    const error = requestUrl.searchParams.get('error');
    const errorCode = requestUrl.searchParams.get('error_code');
    const errorDescription = requestUrl.searchParams.get('error_description');

    if (error || errorCode) {
      console.error('Auth error:', { error, errorCode, errorDescription });
      if (errorCode === 'otp_expired') {
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=link_expired&message=${encodeURIComponent('Magic link has expired. Please request a new one.')}`
        );
      }
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${error}`);
    }

    const code = requestUrl.searchParams.get('code');
    if (!code) {
      console.error('No code provided in callback');
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`);
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const cookie = cookieStore.get(name);
            console.log(`Getting cookie ${name}:`, cookie?.value ? "Present" : "Not found");
            return cookie?.value;
          },
          set: (name, value, options) => {
            try {
              cookieStore.set(name, value, options);
            } catch (error) {
              console.error(`Error setting cookie ${name}:`, error);
            }
          },
          remove: (name, options) => {
            try {
              cookieStore.set(name, '', { ...options, maxAge: 0 });
            } catch (error) {
              console.error(`Error removing cookie ${name}:`, error);
            }
          },
        },
      }
    );
    
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.error('Error exchanging code for session:', sessionError);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
    }

    if (!sessionData.session) {
      console.error('No session returned after code exchange');
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_session`);
    }

    // Check if user exists in User table
    const { data: existingUser, error: checkError } = await supabase
      .from('User')
      .select('id, role')
      .eq('id', sessionData.session.user.id)
      .single();

    console.log('Existing user check:', { existingUser, checkError });

    if (!existingUser) {
      console.error('User not found in User table');
      // Sign out the user from Supabase Auth
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=unauthorized&message=Please contact your administrator to activate your account`
      );
    }

    const userRole = existingUser.role;

    // Update user metadata with role
    const { error: updateError } = await supabase.auth.updateUser({
      data: { role: userRole }
    });

    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=metadata_update_failed`);
    }

    console.log('Authentication successful with role:', userRole);
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
  } catch (error) {
    console.error('Unhandled error in callback:', error);
    const requestUrl = new URL(request.url);
    return NextResponse.redirect(`${requestUrl.origin}/login?error=unknown`);
  }
}
