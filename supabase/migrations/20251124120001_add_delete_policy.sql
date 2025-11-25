-- Add DELETE policy for interview_sessions table
CREATE POLICY "Users can delete their own sessions"
  ON public.interview_sessions FOR DELETE
  USING (auth.uid() = user_id);