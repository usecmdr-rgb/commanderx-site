import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select("*").limit(1);

  return Response.json({
    connected: !error,
    data,
    error,
  });
}

