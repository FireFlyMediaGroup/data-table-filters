# Row Level Security (RLS) and Permissions Guide

This document provides a comprehensive guide to the Row Level Security (RLS) implementation and permission system in our application.

## Overview

Our application uses a multi-layered security approach:
1. Database-level security through Supabase RLS policies
2. API-level permission checks
3. Route-level access control through RBAC middleware
4. Audit logging for accountability

### User Roles

The system supports three roles:
- `user`: Regular users who can only access their own data
- `supervisor`: Can access and modify all documents
- `admin`: Full system access including user management

## Database Security

### RLS Policies

Each table in the database has RLS enabled with specific policies:

#### Document Table

```sql
-- Enable RLS
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" FORCE ROW LEVEL SECURITY;

-- Read Policy
CREATE POLICY "Users can read own documents and admins/supervisors can read all"
ON "Document"
FOR SELECT
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

-- Create Policy
CREATE POLICY "Users can create documents"
ON "Document"
FOR INSERT
WITH CHECK (
  auth.uid()::text = "userId"
);

-- Update Policy
CREATE POLICY "Users can update own documents and admins/supervisors can update all"
ON "Document"
FOR UPDATE
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

-- Delete Policy
CREATE POLICY "Users can delete own documents and admins/supervisors can delete all"
ON "Document"
FOR DELETE
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);
```

#### POWRA Table

```sql
-- Enable RLS
ALTER TABLE "POWRA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "POWRA" FORCE ROW LEVEL SECURITY;

-- Read Policy
CREATE POLICY "Users can read own POWRAs and admins/supervisors can read all"
ON "POWRA"
FOR SELECT
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

-- Create Policy
CREATE POLICY "Users can create POWRAs"
ON "POWRA"
FOR INSERT
WITH CHECK (
  auth.uid()::text = "userId"
);

-- Update Policy
CREATE POLICY "Users can update own POWRAs and admins/supervisors can update all"
ON "POWRA"
FOR UPDATE
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

-- Delete Policy
CREATE POLICY "Users can delete own POWRAs and admins/supervisors can delete all"
ON "POWRA"
FOR DELETE
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);
```

#### Tailboard Table

```sql
-- Enable RLS
ALTER TABLE "Tailboard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tailboard" FORCE ROW LEVEL SECURITY;

-- Read Policy
CREATE POLICY "Users can read own Tailboards and admins/supervisors can read all"
ON "Tailboard"
FOR SELECT
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

-- Create Policy
CREATE POLICY "Users can create Tailboards"
ON "Tailboard"
FOR INSERT
WITH CHECK (
  auth.uid()::text = "userId"
);

-- Update Policy
CREATE POLICY "Users can update own Tailboards and admins/supervisors can update all"
ON "Tailboard"
FOR UPDATE
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

-- Delete Policy
CREATE POLICY "Users can delete own Tailboards and admins/supervisors can delete all"
ON "Tailboard"
FOR DELETE
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);
```

#### FPLMission Table

```sql
-- Enable RLS
ALTER TABLE "FPLMission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FPLMission" FORCE ROW LEVEL SECURITY;

-- Read Policy
CREATE POLICY "Users can read own FPLMissions and admins/supervisors can read all"
ON "FPLMission"
FOR SELECT
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

-- Create Policy
CREATE POLICY "Users can create FPLMissions"
ON "FPLMission"
FOR INSERT
WITH CHECK (
  auth.uid()::text = "userId"
);

-- Update Policy
CREATE POLICY "Users can update own FPLMissions and admins/supervisors can update all"
ON "FPLMission"
FOR UPDATE
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

-- Delete Policy
CREATE POLICY "Users can delete own FPLMissions and admins/supervisors can delete all"
ON "FPLMission"
FOR DELETE
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);
```

#### User Table

```sql
-- Enable RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;

-- Read Policy
CREATE POLICY "Users can read own user and admins/supervisors can read all"
ON "User"
FOR SELECT
USING (
  id = auth.uid()::text OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

-- Update Policy
CREATE POLICY "Only admins can update users"
ON "User"
FOR UPDATE
USING (
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') = 'admin'
);

-- Delete Policy
CREATE POLICY "Only admins can delete users"
ON "User"
FOR DELETE
USING (
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') = 'admin'
);
```

## API Security

### Document Endpoints

The API layer enforces permissions through several endpoints:

1. List Documents (`GET /api/documents`):
- Regular users: Only see their own documents
- Admins/Supervisors: See all documents

2. Single Document (`GET /api/documents/[id]`):
- Checks document ownership
- Allows admin/supervisor access
- Includes audit logging

3. Update Document (`PUT /api/documents/[id]`):
- Validates document ownership
- Allows admin/supervisor access
- Includes audit logging

4. Download/Print Document:
- Checks document ownership
- Allows admin/supervisor access
- Generates PDF with proper headers

## Route-Level Security

### RBAC Middleware

The RBAC middleware (`src/middleware/rbac.ts`) controls route access based on user roles:

```typescript
const roleAccess: { [key: string]: string[] } = {
  admin: ['/dashboard/admin', '/dashboard/documents', '/dashboard/forms'],
  supervisor: ['/dashboard/documents', '/dashboard/forms'],
  user: ['/dashboard/documents', '/dashboard/forms'],
};
```

### Auth Middleware

The auth middleware (`src/middleware/auth.ts`) ensures:
1. Valid session exists
2. User is authenticated
3. Proper redirection for unauthorized access

## Verification Process

### 1. RLS Policy Verification

In Supabase SQL Editor:

```sql
-- Test as regular user
select set_claim('user-id', 'role', 'user');
select * from "Document";  -- Should only show user's documents

-- Test as admin
select set_claim('user-id', 'role', 'admin');
select * from "Document";  -- Should show all documents
```

### 2. API Endpoint Testing

Test endpoints with different user roles:

```bash
# Regular user
curl -H "Authorization: Bearer user-token" /api/documents
# Should only return user's documents

# Admin
curl -H "Authorization: Bearer admin-token" /api/documents
# Should return all documents
```

### 3. Route Access Testing

Verify in browser:
1. Regular users can't access admin routes
2. Proper redirection to login
3. Correct dashboard access based on role

## Troubleshooting

Common issues and solutions:

1. Documents not visible:
- Check user role in JWT metadata
- Verify RLS policies are enabled
- Check document ownership

2. Permission denied:
- Verify user session
- Check role assignments
- Review RLS policy syntax

3. Route access issues:
- Check RBAC configuration
- Verify auth middleware
- Review role mappings

## Maintenance

To maintain security:

1. Regularly audit:
- RLS policies
- Role assignments
- Access patterns

2. Update policies when:
- Adding new tables
- Modifying permissions
- Changing role structure

3. Monitor:
- Auth logs
- Access patterns
- Error rates
