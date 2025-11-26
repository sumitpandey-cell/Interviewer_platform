-- Fix for avatar_url not saving to profiles table
-- This script adds RLS policies to allow users to update their own profile

-- First, check if RLS is enabled on profiles table
-- If not enabled, enable it
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing update policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Also ensure users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to insert their own profile (for new signups)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';
