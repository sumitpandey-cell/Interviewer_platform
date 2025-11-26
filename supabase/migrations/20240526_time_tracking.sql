-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  monthly_minutes INTEGER NOT NULL, -- -1 for unlimited
  price_monthly INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '1 month') NOT NULL,
  monthly_minutes INTEGER NOT NULL,
  minutes_used INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Create daily_usage table for free tier tracking
CREATE TABLE IF NOT EXISTS public.daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes_used INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Insert default plans
INSERT INTO public.plans (name, monthly_minutes, price_monthly) VALUES
  ('Free', 30, 0), -- Daily limit handled separately
  ('Basic', 300, 299),
  ('Pro', 1000, 699),
  ('Business', -1, 1499)
ON CONFLICT DO NOTHING;

-- RLS Policies

-- Plans: Everyone can read
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans are viewable by everyone" ON public.plans FOR SELECT USING (true);

-- Subscriptions: Users can view their own
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Daily Usage: Users can view their own
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own daily usage" ON public.daily_usage FOR SELECT USING (auth.uid() = user_id);

-- Functions

-- Function to check and reset daily usage (Lazy Reset)
CREATE OR REPLACE FUNCTION public.check_and_reset_daily_usage(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usage_record RECORD;
  current_date_ist DATE;
  subscription_record RECORD;
  plan_record RECORD;
  remaining_minutes INTEGER;
  is_allowed BOOLEAN;
BEGIN
  -- Get current date in IST
  current_date_ist := (timezone('Asia/Kolkata', now()))::DATE;

  -- Check for active subscription
  SELECT * INTO subscription_record FROM public.subscriptions WHERE user_id = user_uuid AND status = 'active';

  IF FOUND THEN
    -- Paid User Logic
    -- Check if subscription is expired (simple check, ideally should be handled by webhook)
    IF subscription_record.current_period_end < now() THEN
       -- Expired, treat as free user or block? For now, let's fall back to free logic or just block.
       -- Let's assume we just check quota.
       NULL; 
    END IF;

    IF subscription_record.monthly_minutes = -1 THEN
      remaining_minutes := 999999; -- Unlimited
      is_allowed := true;
    ELSE
      remaining_minutes := subscription_record.monthly_minutes - subscription_record.minutes_used;
      is_allowed := remaining_minutes > 0;
    END IF;

    RETURN jsonb_build_object(
      'type', 'paid',
      'allowed', is_allowed,
      'remaining_minutes', remaining_minutes,
      'plan_id', subscription_record.plan_id
    );

  ELSE
    -- Free User Logic
    SELECT * INTO usage_record FROM public.daily_usage WHERE user_id = user_uuid;

    IF NOT FOUND THEN
      -- Create new record
      INSERT INTO public.daily_usage (user_id, date, minutes_used)
      VALUES (user_uuid, current_date_ist, 0)
      RETURNING * INTO usage_record;
    ELSIF usage_record.date < current_date_ist THEN
      -- Reset for new day
      UPDATE public.daily_usage
      SET date = current_date_ist, minutes_used = 0, updated_at = now()
      WHERE id = usage_record.id
      RETURNING * INTO usage_record;
    END IF;

    remaining_minutes := 30 - usage_record.minutes_used;
    is_allowed := remaining_minutes > 0;

    RETURN jsonb_build_object(
      'type', 'free',
      'allowed', is_allowed,
      'remaining_minutes', remaining_minutes
    );
  END IF;
END;
$$;

-- Function to increment usage
CREATE OR REPLACE FUNCTION public.increment_usage(user_uuid UUID, minutes_to_add INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record RECORD;
  current_date_ist DATE;
BEGIN
  -- Check for active subscription
  SELECT * INTO subscription_record FROM public.subscriptions WHERE user_id = user_uuid AND status = 'active';

  IF FOUND THEN
    -- Update subscription usage
    UPDATE public.subscriptions
    SET minutes_used = minutes_used + minutes_to_add, updated_at = now()
    WHERE id = subscription_record.id;
  ELSE
    -- Update daily usage
    current_date_ist := (timezone('Asia/Kolkata', now()))::DATE;
    
    -- Ensure record exists and is for today (check_and_reset should have been called, but safety first)
    UPDATE public.daily_usage
    SET minutes_used = minutes_used + minutes_to_add, updated_at = now()
    WHERE user_id = user_uuid AND date = current_date_ist;
    
    IF NOT FOUND THEN
       -- If not found (e.g. date changed during interview or no record), insert/reset
       INSERT INTO public.daily_usage (user_id, date, minutes_used)
       VALUES (user_uuid, current_date_ist, minutes_to_add)
       ON CONFLICT (user_id) DO UPDATE
       SET date = EXCLUDED.date, minutes_used = EXCLUDED.minutes_used;
    END IF;
  END IF;
END;
$$;
