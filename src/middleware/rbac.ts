import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function rbacMiddleware(req: NextRequest) {
  console.log("RBAC middleware running for:", req.nextUrl.pathname);
  
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

    console.log("Getting user...");
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("User error:", userError);
      throw userError;
    }

    if (!user) {
      console.log("No user found in RBAC check");
      return res;
    }

    // Get role from user metadata
    const role = user.user_metadata?.role || 'user';
    console.log("User role:", role);

    // Define route access based on roles
    const roleAccess: { [key: string]: string[] } = {
      admin: ['/dashboard/admin', '/dashboard/documents', '/dashboard/forms'],
      supervisor: ['/dashboard/documents', '/dashboard/forms'],
      user: ['/dashboard/documents', '/dashboard/forms'],
    };

    const path = req.nextUrl.pathname;
    console.log("Checking access for path:", path);
    
    // Handle API routes differently
    if (path.startsWith('/api/')) {
      console.log("Checking API route access...");
      // Map API route to corresponding dashboard path
      const dashboardPath = path.replace('/api/', '/dashboard/');
      console.log("Mapped to dashboard path:", dashboardPath);
      
      const allowedPaths = roleAccess[role] || [];
      const hasAccess = allowedPaths.some(allowedPath => dashboardPath.startsWith(allowedPath));
      console.log("Access allowed:", hasAccess);
      
      if (!hasAccess) {
        console.error("Insufficient permissions for API route");
        return NextResponse.json(
          { 
            error: 'Unauthorized',
            message: 'Insufficient permissions for this operation',
            requiredRole: 'appropriate role',
            currentRole: role
          },
          { status: 403 }
        );
      }
      return res;
    }
    
    // Handle dashboard routes
    console.log("Checking dashboard route access...");
    const allowedPaths = roleAccess[role] || [];
    const hasAccess = allowedPaths.some(allowedPath => path.startsWith(allowedPath));
    console.log("Access allowed:", hasAccess);
    
    if (!hasAccess) {
      console.error("Insufficient permissions for dashboard route");
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      redirectUrl.searchParams.set('error', 'insufficient-permissions');
      return NextResponse.redirect(redirectUrl);
    }

    return res;
  } catch (error: any) {
    console.error("RBAC middleware error:", error);
    
    // For API routes, return error response
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { 
          error: 'Authorization error',
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 403 }
      );
    }
    
    // For other routes, redirect with error
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.searchParams.set('error', 'rbac-error');
    redirectUrl.searchParams.set('message', error.message);
    return NextResponse.redirect(redirectUrl);
  }
}
