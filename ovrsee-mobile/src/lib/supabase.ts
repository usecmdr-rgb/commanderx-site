import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing required Supabase environment variables: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set.'
  );
}

/**
 * Supabase client for mobile app
 * 
 * IMPORTANT: This must use the SAME Supabase URL and anon key as the web app
 * to ensure both apps share the same project and user data.
 * 
 * Web app uses:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 
 * Mobile app uses:
 * - EXPO_PUBLIC_SUPABASE_URL (must match web app's NEXT_PUBLIC_SUPABASE_URL)
 * - EXPO_PUBLIC_SUPABASE_ANON_KEY (must match web app's NEXT_PUBLIC_SUPABASE_ANON_KEY)
 */
let supabase: ReturnType<typeof createClient>;

try {
  // Log configuration status (without exposing full keys)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing environment variables:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'missing'
    });
  } else {
    console.log('[Supabase] Initializing with URL:', supabaseUrl.substring(0, 30) + '...');
  }

  supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseAnonKey || 'placeholder-key', 
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );

  // Test connection
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    console.log('[Supabase] Client created successfully');
  } else {
    console.error('[Supabase] Using placeholder values - Supabase will not work!');
  }
} catch (error) {
  console.error('[Supabase] Failed to create Supabase client:', error);
  // Create a minimal client that won't crash
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export { supabase };

