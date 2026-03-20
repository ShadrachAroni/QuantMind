-- Migration 008: Student Verification Metadata
-- Adds fields to track third-party verification status for student accounts.

ALTER TABLE public.user_profiles
ADD COLUMN is_student_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN student_verification_id TEXT,
ADD COLUMN student_verified_at TIMESTAMPTZ;

-- Index for admin lookups
CREATE INDEX user_profiles_student_verified_idx ON public.user_profiles (is_student_verified) WHERE is_student_verified = true;

-- Comment for documentation
COMMENT ON COLUMN public.user_profiles.is_student_verified IS 'Flags if the user has completed third-party student verification (SheerID/UNiDAYS/Bridge).';
