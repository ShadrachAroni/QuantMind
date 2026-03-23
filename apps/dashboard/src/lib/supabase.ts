import { createClient } from '@supabase/supabase-js';

// During static generation/pre-rendering, environment variables might be missing.
// We provide placeholder values to prevent 'supabaseUrl is required' errors during build.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://missing-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
