-- Migration 008: Student Verification Metadata
-- Adds fields to track third-party verification status for student accounts.

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='is_student_verified' AND table_schema='public') THEN
    ALTER TABLE public.user_profiles ADD COLUMN is_student_verified BOOLEAN NOT NULL DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='student_verification_id' AND table_schema='public') THEN
    ALTER TABLE public.user_profiles ADD COLUMN student_verification_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='student_verified_at' AND table_schema='public') THEN
    ALTER TABLE public.user_profiles ADD COLUMN student_verified_at TIMESTAMPTZ;
  END IF;
END $$;

-- Index for admin lookups
CREATE INDEX IF NOT EXISTS user_profiles_student_verified_idx ON public.user_profiles (is_student_verified) WHERE is_student_verified = true;

-- Comment for documentation
COMMENT ON COLUMN public.user_profiles.is_student_verified IS 'Flags if the user has completed third-party student verification (SheerID/UNiDAYS/Bridge).';
