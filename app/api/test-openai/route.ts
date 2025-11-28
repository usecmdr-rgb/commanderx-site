import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { getAuthenticatedUserFromRequest } from "@/lib/auth-helpers";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Gate access: only allow in dev mode or for admin users
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (!isDev) {
    // In production, require authentication and admin check
    const user = await getAuthenticatedUserFromRequest(req);
    if (!user?.email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized: Authentication required",
        },
        { status: 401 }
      );
    }
    
    const userIsAdmin = await isAdmin(user.email);
    if (!userIsAdmin) {
      return NextResponse.json(
        {
          ok: false,
          error: "Forbidden: Admin access required",
        },
        { status: 403 }
      );
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing OPENAI_API_KEY environment variable on the server",
      },
      { status: 500 }
    );
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a simple health-check assistant for the OVRSEE backend.",
        },
        {
          role: "user",
          content:
            "Reply with a short confirmation sentence that the OpenAI API key works.",
        },
      ],
      max_tokens: 32,
      temperature: 0.2,
    });

    const reply =
      response.choices[0]?.message?.content?.trim() ||
      "OpenAI responded, but no text content was returned.";

    return NextResponse.json({
      ok: true,
      reply,
    });
  } catch (error: any) {
    console.error("/api/test-openai error:", error);

    const message =
      error?.message ||
      error?.response?.data?.error?.message ||
      "Unknown error from OpenAI";

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to call OpenAI. The API key may be missing or invalid.",
        details: message,
      },
      { status: 500 }
    );
  }
}









