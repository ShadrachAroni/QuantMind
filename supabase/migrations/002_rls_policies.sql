-- QuantMind Migration 002 — Policy Refinements
-- Ensuring all tables have explicit user/service boundaries

-- Simulation Paths refinement
-- (Already handled in 001, but we can add more granular checks if needed)

-- Example: Ensure only admins can see audit logs (if we had an admin role check)
-- Assuming we use Supabase roles later, for now we keep them service-role restricted.
