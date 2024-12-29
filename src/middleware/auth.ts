import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  console.log("Auth middleware running for:", req.nextUrl.pathname);
  console.log("Request cookies:", req.cookies.toString());
  console.log("Auth cookie present:", !!req.cookies.get('sb-access-token'));
  
  const res = NextResponse.next();
  
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const cookie = req.cookies.get(name);
            console.log(`Getting cookie ${name}:`, cookie?.value ? "Present" : "Not found");
            return cookie?.value;
          },
          set: (name, value, options) => {
            console.log(`Setting cookie ${name}`);
            res.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove: (name, options) => {
            console.log(`Removing cookie ${name}`);
            res.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    console.log("Checking session...");
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      throw sessionError;
    }

    // Check if the user is authenticated
    if (!session) {
      console.log("No session found");
      
      // For API routes, return 401 Unauthorized
      if (req.nextUrl.pathname.startsWith('/api')) {
        console.log("Unauthorized API access attempt");
        return NextResponse.json(
          { 
            error: 'Authentication required',
            message: 'No valid session found'
          },
          { status: 401 }
        );
      }
      
      // For dashboard routes, redirect to login
      if (req.nextUrl.pathname.startsWith('/dashboard')) {
        console.log("Redirecting to login");
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/login';
        redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    } else {
      console.log("Valid session found for user:", session.user.id);
    }

    return res;
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    
    // For API routes, return error response
    if (req.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json(
        { 
          error: 'Authentication error',
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 401 }
      );
    }
    
    // For other routes, redirect to login
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname);
    redirectUrl.searchParams.set(`error`, 'auth-error');
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
