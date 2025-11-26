-- Function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    full_name = COALESCE(new.raw_user_meta_data->>'full_name', full_name),
    avatar_url = COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', avatar_url),
    updated_at = now()
  WHERE id = new.id;
  RETURN new;
END;
$$;

-- Trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (old.raw_user_meta_data IS DISTINCT FROM new.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_user_update();
