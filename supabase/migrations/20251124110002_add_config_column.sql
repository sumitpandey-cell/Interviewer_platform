-- Add config column to interview_sessions table to store additional interview configuration
ALTER TABLE public.interview_sessions 
ADD COLUMN config JSONB DEFAULT '{}'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN public.interview_sessions.config IS 'Stores additional interview configuration like skills, job description, etc.';
