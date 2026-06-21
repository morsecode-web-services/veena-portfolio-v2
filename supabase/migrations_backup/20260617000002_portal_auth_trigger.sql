-- Migration: Student Portal Auth Trigger
-- When a new user signs in via Magic Link (creating an auth.users row),
-- this trigger automatically links their auth account to their historical
-- student record by matching on email.

-- Function: called by trigger on every new auth user insert
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to link to an existing student record by email
    UPDATE public.students
    SET auth_user_id = NEW.id,
        updated_at = NOW()
    WHERE email = NEW.email
      AND auth_user_id IS NULL;

    -- If no existing student, create a new placeholder record
    -- (handles the edge case of a completely new user)
    IF NOT FOUND THEN
        INSERT INTO public.students (auth_user_id, email, name, created_at, updated_at)
        VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NOW(), NOW())
        ON CONFLICT (email) DO UPDATE
        SET auth_user_id = NEW.id, updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists (safe re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on new auth user signup/login
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
