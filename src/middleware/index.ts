import { NextRequest, NextResponse } from 'next/server';
import { middleware as authMiddleware } from './auth';
import { rbacMiddleware } from './rbac';

export async function middleware(req: NextRequest) {
  console.log("\n=== Starting middleware chain for:", req.nextUrl.pathname, "===");
  console.log("Request method:", req.method);
  console.log("Request headers:", Object.fromEntries(req.headers));
  
  try {
    // First, run the authentication middleware
    console.log("\n--- Running auth middleware ---");
    const authRes = await authMiddleware(req);
    
    // If the auth middleware redirected or returned an error response, return that response
    if (authRes instanceof Response && authRes.headers.get('location')) {
      console.log("Auth middleware returned redirect");
      return authRes;
    }
    
    if (authRes instanceof Response && authRes.headers.get('content-type')?.includes('application/json')) {
      console.log("Auth middleware returned JSON response");
      const body = await authRes.json();
      console.log("Auth response:", body);
      if (body.error) {
        return authRes;
      }
    }
    
    console.log("Auth middleware passed");

    // If auth passed, run the RBAC middleware
    console.log("\n--- Running RBAC middleware ---");
    const rbacRes = await rbacMiddleware(req);
    
    // Log RBAC response
    if (rbacRes.status !== 200) {
      console.log("RBAC middleware returned non-200 status:", rbacRes.status);
      if (rbacRes.headers.get('content-type')?.includes('application/json')) {
        const body = await rbacRes.json();
        console.log("RBAC error response:", body);
      }
    } else {
      console.log("RBAC middleware passed");
    }

    return rbacRes;
  } catch (error: any) {
    console.error("\n!!! Middleware chain error !!!");
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    
    // For API routes, return error response
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          error: 'Middleware error',
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        { status: 500 }
      );
    }
    
    // For other routes, redirect to login with error
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('error', 'middleware-error');
    redirectUrl.searchParams.set('message', error.message);
    return NextResponse.redirect(redirectUrl);
  } finally {
    console.log("\n=== Middleware chain completed ===\n");
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
