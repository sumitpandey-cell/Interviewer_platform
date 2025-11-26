# Leaderboard Visibility Fix

To make the leaderboard visible to all users, you need to update the Row Level Security (RLS) policies in your Supabase database.

Currently, users can only see their own data. The following SQL commands will allow all authenticated users to see:
1. Other users' names and avatars (from `profiles` table).
2. Other users' completed interview scores (from `interview_sessions` table).

## Instructions

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Go to the **SQL Editor** (icon on the left sidebar).
4. Click **New Query**.
5. Copy and paste the following SQL code:

```sql
-- Allow authenticated users to view all profiles (needed for leaderboard names/avatars)
CREATE POLICY "Allow authenticated users to view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to view all completed interview sessions (needed for leaderboard scores)
CREATE POLICY "Allow authenticated users to view all completed sessions"
ON public.interview_sessions FOR SELECT
TO authenticated
USING (status = 'completed');
```

6. Click **Run**.

After running this, the leaderboard should populate with all users who have completed interviews.
