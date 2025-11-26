-- Add streak columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMP WITH TIME ZONE;

-- Function to increment streak
CREATE OR REPLACE FUNCTION public.increment_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_last_activity TIMESTAMP WITH TIME ZONE;
  user_streak INTEGER;
  current_time_ist TIMESTAMP WITH TIME ZONE;
  last_date DATE;
  current_date_ist DATE;
BEGIN
  -- Check if we should proceed based on operation type
  IF NEW.status <> 'completed' THEN
    RETURN NEW;
  END IF;

  -- For UPDATE, only proceed if status changed to completed
  IF TG_OP = 'UPDATE' AND OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get current time in IST
  current_time_ist := timezone('Asia/Kolkata', now());
  current_date_ist := current_time_ist::DATE;

  -- Get user's last activity and streak
  SELECT last_activity_date, streak_count 
  INTO user_last_activity, user_streak 
  FROM public.profiles 
  WHERE id = NEW.user_id;

  -- If no last activity, set streak to 1
  IF user_last_activity IS NULL THEN
    UPDATE public.profiles 
    SET streak_count = 1, last_activity_date = now() 
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;

  -- Calculate dates
  last_date := (timezone('Asia/Kolkata', user_last_activity))::DATE;

  -- Logic
  IF last_date = current_date_ist THEN
    -- Already active today, just update timestamp
    UPDATE public.profiles 
    SET last_activity_date = now() 
    WHERE id = NEW.user_id;
  ELSIF last_date = (current_date_ist - INTERVAL '1 day')::DATE THEN
    -- Active yesterday, increment streak
    UPDATE public.profiles 
    SET streak_count = streak_count + 1, last_activity_date = now() 
    WHERE id = NEW.user_id;
  ELSE
    -- Streak broken (last activity was before yesterday), reset to 1
    UPDATE public.profiles 
    SET streak_count = 1, last_activity_date = now() 
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for interview completion
DROP TRIGGER IF EXISTS on_interview_completed ON public.interview_sessions;
CREATE TRIGGER on_interview_completed
  AFTER INSERT OR UPDATE ON public.interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_streak();
