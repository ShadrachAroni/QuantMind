-- Migration: Add region and interface_language to user_profiles
-- Created: 2026-03-25

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'US_EAST_NY';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS interface_language TEXT DEFAULT 'ENGLISH_INTL';

-- Update RLS if necessary (usually not needed for column additions unless policies are very restrictive)
-- But ensuring they are included in existing selection/update logic.
