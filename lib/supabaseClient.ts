import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nupxbdbychuqokubresi.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_MLSPR1MXJshoA9RbEm0oeg_hPdx8oMV";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase URL or anon key - some features may not work");
}

export const supabaseBrowserClient = createBrowserClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

