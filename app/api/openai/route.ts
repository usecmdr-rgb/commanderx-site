import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.OPENAI_API_KEY;

  return NextResponse.json({
    ok: !!key,
    value: key ? `sk-${key.slice(3, 8)}...${key.slice(-4)}` : null,
  });
}





