import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select("*").limit(1);

  return NextResponse.json({
    connected: !error,
    data,
    error,
  });
}

