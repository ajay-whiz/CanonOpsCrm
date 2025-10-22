import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

let supabaseServerImpl: SupabaseClient | any;

if (!url || !serviceKey) {
  const stubHandler = {
    get() {
      return () => {
        throw new Error('Supabase server client not initialized. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      };
    },
  };
  supabaseServerImpl = new Proxy({}, stubHandler);
} else {
  supabaseServerImpl = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const supabaseServer: SupabaseClient | any = supabaseServerImpl;
