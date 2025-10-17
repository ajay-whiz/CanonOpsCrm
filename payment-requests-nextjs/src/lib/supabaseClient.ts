import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

let supabaseClient: SupabaseClient | any;

if (!url || !anonKey) {
  // Dev-friendly stub that throws when used (so page doesn't crash on import)
  // and gives a clear message to set the required env vars.
  // In production ensure these env vars are present.
  // eslint-disable-next-line no-console
  console.warn(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Supabase client is stubbed.'
  );

  const stubHandler = {
    get() {
      return () => {
        throw new Error(
          'Supabase client is not initialized. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
        );
      };
    },
  };

  supabaseClient = new Proxy({}, stubHandler);
} else {
  supabaseClient = createClient(url, anonKey);
}

export const supabase: SupabaseClient | any = supabaseClient;