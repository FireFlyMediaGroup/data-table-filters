-- First verify tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Document') THEN
        RAISE EXCEPTION 'Table "Document" does not exist';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'POWRA') THEN
        RAISE EXCEPTION 'Table "POWRA" does not exist';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Tailboard') THEN
        RAISE EXCEPTION 'Table "Tailboard" does not exist';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'FPLMission') THEN
        RAISE EXCEPTION 'Table "FPLMission" does not exist';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'User') THEN
        RAISE EXCEPTION 'Table "User" does not exist';
    END IF;
END
$$;

-- Enable Row Level Security
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "POWRA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tailboard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FPLMission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Force RLS on all tables
ALTER TABLE "Document" FORCE ROW LEVEL SECURITY;
ALTER TABLE "POWRA" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Tailboard" FORCE ROW LEVEL SECURITY;
ALTER TABLE "FPLMission" FORCE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;

-- Grant necessary permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- Allow service_role to bypass RLS
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role bypass" ON "User" TO service_role USING (true) WITH CHECK (true);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own documents and admins/supervisors can read all" ON "Document";
DROP POLICY IF EXISTS "Users can update own documents and admins/supervisors can update all" ON "Document";
DROP POLICY IF EXISTS "Users can delete own documents and admins/supervisors can delete all" ON "Document";
DROP POLICY IF EXISTS "Users can create documents" ON "Document";

DROP POLICY IF EXISTS "Users can read own POWRAs and admins/supervisors can read all" ON "POWRA";
DROP POLICY IF EXISTS "Users can update own POWRAs and admins/supervisors can update all" ON "POWRA";
DROP POLICY IF EXISTS "Users can delete own POWRAs and admins/supervisors can delete all" ON "POWRA";
DROP POLICY IF EXISTS "Users can create POWRAs" ON "POWRA";

DROP POLICY IF EXISTS "Users can read own Tailboards and admins/supervisors can read all" ON "Tailboard";
DROP POLICY IF EXISTS "Users can update own Tailboards and admins/supervisors can update all" ON "Tailboard";
DROP POLICY IF EXISTS "Users can delete own Tailboards and admins/supervisors can delete all" ON "Tailboard";
DROP POLICY IF EXISTS "Users can create Tailboards" ON "Tailboard";

DROP POLICY IF EXISTS "Users can read own FPLMissions and admins/supervisors can read all" ON "FPLMission";
DROP POLICY IF EXISTS "Users can update own FPLMissions and admins/supervisors can update all" ON "FPLMission";
DROP POLICY IF EXISTS "Users can delete own FPLMissions and admins/supervisors can delete all" ON "FPLMission";
DROP POLICY IF EXISTS "Users can create FPLMissions" ON "FPLMission";

DROP POLICY IF EXISTS "Users can read own user and admins/supervisors can read all" ON "User";
DROP POLICY IF EXISTS "Only admins can update users" ON "User";
DROP POLICY IF EXISTS "Only admins can delete users" ON "User";
DROP POLICY IF EXISTS "Only admins can create users" ON "User";

-- Document table policies
CREATE POLICY "Users can read own documents and admins/supervisors can read all"
ON "Document" FOR SELECT
TO authenticated
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

CREATE POLICY "Users can update own documents and admins/supervisors can update all"
ON "Document" FOR UPDATE
TO authenticated
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

CREATE POLICY "Users can delete own documents and admins/supervisors can delete all"
ON "Document" FOR DELETE
TO authenticated
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

CREATE POLICY "Users can create documents"
ON "Document" FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = "userId"
);

-- POWRA table policies
CREATE POLICY "Users can read own POWRAs and admins/supervisors can read all"
ON "POWRA" FOR SELECT
TO authenticated
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

CREATE POLICY "Users can update own POWRAs and admins/supervisors can update all"
ON "POWRA" FOR UPDATE
TO authenticated
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

CREATE POLICY "Users can delete own POWRAs and admins/supervisors can delete all"
ON "POWRA" FOR DELETE
TO authenticated
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

CREATE POLICY "Users can create POWRAs"
ON "POWRA" FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = "userId"
);

-- Tailboard table policies
CREATE POLICY "Users can read own Tailboards and admins/supervisors can read all"
ON "Tailboard" FOR SELECT
TO authenticated
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

CREATE POLICY "Users can update own Tailboards and admins/supervisors can update all"
ON "Tailboard" FOR UPDATE
TO authenticated
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

CREATE POLICY "Users can delete own Tailboards and admins/supervisors can delete all"
ON "Tailboard" FOR DELETE
TO authenticated
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

CREATE POLICY "Users can create Tailboards"
ON "Tailboard" FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = "userId"
);

-- FPLMission table policies
CREATE POLICY "Users can read own FPLMissions and admins/supervisors can read all"
ON "FPLMission" FOR SELECT
TO authenticated
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

CREATE POLICY "Users can update own FPLMissions and admins/supervisors can update all"
ON "FPLMission" FOR UPDATE
TO authenticated
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

CREATE POLICY "Users can delete own FPLMissions and admins/supervisors can delete all"
ON "FPLMission" FOR DELETE
TO authenticated
USING (
  auth.uid()::text = "userId" OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

CREATE POLICY "Users can create FPLMissions"
ON "FPLMission" FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = "userId"
);

-- User table policies
CREATE POLICY "Users can read own user and admins/supervisors can read all"
ON "User" FOR SELECT
TO authenticated
USING (
  id = auth.uid()::text OR 
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('admin', 'supervisor')
);

CREATE POLICY "Only admins can update users"
ON "User" FOR UPDATE
TO authenticated
USING (
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') = 'admin'
);

CREATE POLICY "Only admins can delete users"
ON "User" FOR DELETE
TO authenticated
USING (
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') = 'admin'
);

CREATE POLICY "Only admins can create users"
ON "User" FOR INSERT
TO authenticated
WITH CHECK (
  COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') = 'admin'
);
