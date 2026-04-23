import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if ((!supabaseUrl || !supabaseAnonKey) && process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  console.warn('Supabase environment variables are missing! Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
}

if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
