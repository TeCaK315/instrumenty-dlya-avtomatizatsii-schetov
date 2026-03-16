import { createBrowserClient } from '@supabase/ssr';

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    // Supabase not configured — return a placeholder client
    // App works without Supabase (demo mode), auth features degrade gracefully
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  _client = createBrowserClient(url, key);
  return _client;
}
