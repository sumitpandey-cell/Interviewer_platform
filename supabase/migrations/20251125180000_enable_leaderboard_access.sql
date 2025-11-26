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
