# Document Feature Authentication & Security

This document covers the authentication and security aspects of the document management system, including Row Level Security (RLS), user roles, and permission handling at various levels.

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flow](#authentication-flow)
3. [Row Level Security (RLS)](#row-level-security-rls)
4. [User Roles & Permissions](#user-roles--permissions)
5. [User Metadata](#user-metadata)
6. [Security Layers](#security-layers)
7. [Troubleshooting](#troubleshooting)

## Overview

The document management system uses a multi-layered security approach:

- **Authentication**: Handled by Supabase Auth
- **Authorization**: Implemented through RLS policies and role-based checks
- **User Roles**: Three levels - user, supervisor, admin
- **Permission Checks**: Enforced at database, API, and UI levels

## Authentication Flow

1. **Login Process**:
   ```typescript
   // src/app/auth/callback/route.ts
   export async function GET(request: Request) {
     try {
       const requestUrl = new URL(request.url);
       const code = requestUrl.searchParams.get('code');

       const cookieStore = cookies();
       const supabase = createServerClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
         {
           cookies: {
             get: (name) => cookieStore.get(name)?.value,
             set: () => {},
             remove: () => {},
           },
         }
       );

       const { data: sessionData, error: sessionError } = 
         await supabase.auth.exchangeCodeForSession(code);

       // Fetch user's role from database
       const { data: userData, error: userError } = await supabase
         .from('User')
         .select('role')
         .eq('id', sessionData.session.user.id)
         .single();

       // Update user metadata with role
       await supabase.auth.updateUser({
         data: { role: userData.role }
       });

       return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
     } catch (error) {
       return NextResponse.redirect(`${requestUrl.origin}/login?error=unknown`);
     }
   }
   ```

2. **Session Management**:
   ```typescript
   // src/middleware/auth.ts
   export async function middleware(req: NextRequest) {
     const supabase = createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           get: (name) => req.cookies.get(name)?.value,
           set: (name, value, options) => res.cookies.set({
             name, value, ...options
           }),
           remove: (name, options) => res.cookies.set({
             name, value: '', ...options
           }),
         },
       }
     );

     const { data: { session } } = await supabase.auth.getSession();
     
     if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
       return NextResponse.redirect(new URL('/login', req.url));
     }
   }
   ```

## Row Level Security (RLS)

### RLS Setup Script

The RLS setup script (`scripts/setup-rls.ts`) configures Row Level Security for both Document and User tables. Key features include:

1. **Schema Permissions**:
```sql
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Ensure authenticated users can use the schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;
```

2. **User Table Policies**:
```sql
-- Policy for users to read their own user data and admins/supervisors to read all
CREATE POLICY "Users can read own user"
ON "User"
FOR SELECT
USING (
  id = auth.uid()::text OR
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

-- Policy for general user data access (needed for joins)
CREATE POLICY "Users can read all users"
ON "User"
FOR SELECT
TO authenticated
USING (true);
```

3. **Document Table Policies**:
```sql
-- Read access policy
CREATE POLICY "Users can read own documents and admins/supervisors can read all"
ON "Document"
FOR SELECT
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

-- Update access policy
CREATE POLICY "Users can update own documents and admins/supervisors can update all"
ON "Document"
FOR UPDATE
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
)
WITH CHECK (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

-- Delete access policy
CREATE POLICY "Users can delete own documents and admins/supervisors can delete all"
ON "Document"
FOR DELETE
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

-- Insert access policy
CREATE POLICY "Users can create documents"
ON "Document"
FOR INSERT
WITH CHECK (
  auth.uid()::text = "userId"
);
```

### Key RLS Features

1. **Default Role Handling**:
   - Uses `COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user')` to default to 'user' role if metadata is missing
   - Ensures consistent behavior across all policies
   - Handles edge cases where user metadata might not be set

2. **User Table Access**:
   - Two-tier access system:
     1. Users can read their own user data
     2. Admins/supervisors can read all user data
   - Additional policy for authenticated users to read basic user data (needed for joins)
   - Prevents unauthorized access to sensitive user information

3. **Document Access Control**:
   - Users can only access their own documents
   - Admins and supervisors can access all documents
   - Create operations restricted to document owner
   - Update/Delete operations follow the same ownership/role rules

## User Roles & Permissions

### Role Types

```typescript
enum UserRole {
  user
  supervisor
  admin
}
```

### Permission Checks

1. **Database Level**:
   ```sql
   -- Example: Read access policy
   auth.uid()::text = "userId" OR 
   COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
   ```

2. **API Level**:
   ```typescript
   // src/app/api/documents/[id]/route.ts
   const userRole = user.user_metadata?.role || 'user';
   const canAccess = document.userId === user.id || 
                    ['admin', 'supervisor'].includes(userRole);
   
   if (!canAccess) {
     return new Response('Unauthorized', { status: 403 });
   }
   ```

3. **UI Level**:
   ```typescript
   // src/app/dashboard/documents/columns.tsx
   const canApprove = (userRole: UserRole, document: DocumentSchema) => 
     ['admin', 'supervisor'].includes(userRole) && 
     document.status === 'PENDING';

   return (
     <>
       {canApprove(userRole, document) && (
         <DropdownMenuItem onClick={() => onApprove(document)}>
           Approve
         </DropdownMenuItem>
       )}
     </>
   );
   ```

## User Metadata

### Setting User Metadata

1. **During Authentication**:
   ```typescript
   // src/app/auth/callback/route.ts
   const { error: updateError } = await supabase.auth.updateUser({
     data: { role: userData.role }
   });
   ```

2. **Bulk Update Script**:
   ```typescript
   // scripts/update-user-metadata.ts
   async function updateUserMetadata() {
     const users = await prisma.user.findMany({
       select: { id: true, role: true, email: true }
     });

     for (const user of users) {
       try {
         const { data: userData, error: getUserError } = 
           await adminAuthClient.getUserById(user.id);

         if (getUserError) {
           // Create user if they don't exist
           await adminAuthClient.createUser({
             email: user.email,
             password: Math.random().toString(36).slice(-8),
             email_confirm: true,
             user_metadata: { role: user.role },
             user_id: user.id
           });
         } else {
           // Update existing user's metadata
           await adminAuthClient.updateUserById(user.id, {
             user_metadata: { role: user.role }
           });
         }
       } catch (error) {
         console.error(`Error processing user ${user.id}:`, error);
         continue;
       }
     }
   }
   ```

### Using Metadata in Policies

```sql
-- Example: Using metadata in RLS policy
COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
```

## Security Layers

### 1. Authentication Middleware

```typescript
// src/middleware/auth.ts
export async function middleware(req: NextRequest) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}
```

### 2. RBAC Middleware

```typescript
// src/middleware/rbac.ts
export async function rbacMiddleware(req: NextRequest) {
  const user = await getUser(req);
  const path = req.nextUrl.pathname;
  
  if (path.startsWith('/api/documents') && req.method === 'DELETE') {
    if (!['admin', 'supervisor'].includes(user.role)) {
      return new Response('Unauthorized', { status: 403 });
    }
  }
}
```

### 3. Component-Level Guards

```typescript
// src/app/dashboard/documents/[id]/page.tsx
if (!user || userError) {
  return null; // Let auth middleware handle redirect
}

if (documentError?.code === '42501') {
  throw new Error('You do not have permission to view this document');
}
```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**:
   - Check if RLS policies are enabled
   - Verify user metadata contains role
   - Ensure schema permissions are granted
   - Check policy expressions for syntax errors

2. **Authentication Issues**:
   - Verify session cookies are present
   - Check if user metadata is properly set
   - Ensure auth middleware is running
   - Check for token expiration

3. **Role-Based Access Issues**:
   - Verify role in user metadata matches database
   - Check COALESCE handling in policies
   - Ensure role updates trigger metadata updates

### Debugging Steps

1. **Check RLS Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'Document';
   ```

2. **Verify User Metadata**:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User metadata:', user.user_metadata);
   ```

3. **Test Policy Expressions**:
   ```sql
   SELECT auth.uid()::text = "userId" OR 
          COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') 
          IN ('admin', 'supervisor')
   FROM "Document"
   WHERE id = '[document-id]';
   ```

4. **Check Schema Permissions**:
   ```sql
   SELECT grantee, privilege_type 
   FROM information_schema.role_table_grants 
   WHERE table_name = 'Document';
   ```

### Best Practices

1. **Always Use COALESCE**:
   - Handle missing metadata gracefully
   - Provide sensible defaults
   - Be consistent across policies

2. **Layer Security Checks**:
   - Implement at database level first
   - Add API-level validation
   - Include UI-level guards
   - Don't rely on single layer

3. **Audit Important Operations**:
   ```typescript
   await auditLogger.log({
     action: 'document.approve',
     userId: user.id,
     resourceId: documentId,
     details: {
       documentTitle: document.title,
       userRole: user.user_metadata?.role || 'user',
     },
   });
   ```

4. **Handle Edge Cases**:
   - Missing metadata
   - Token expiration
   - Network errors
   - Concurrent updates

5. **Client Creation Consistency**:
   - Use `createServerClient` from @supabase/ssr for all server-side code
   - Configure cookie handling based on context:
     ```typescript
     const supabase = createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           get: (name) => cookieStore.get(name)?.value,
           set: () => {}, // No-op for read-only contexts
           remove: () => {}, // No-op for read-only contexts
         },
       }
     );
     ```
   - Use `createBrowserClient` for client-side code
   - Ensure PKCE flow is enabled for secure authentication
