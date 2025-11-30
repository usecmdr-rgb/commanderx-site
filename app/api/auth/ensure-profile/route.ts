import { NextRequest, NextResponse } from "next/server";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { ensureUserProfileAndSubscription } from "@/lib/auth/signup";

/**
 * POST /api/auth/ensure-profile
 * 
 * Ensures that a user has a profile and subscription.
 * This is useful after OAuth sign-in to make sure the database trigger
 * created the profile, or create it if the trigger didn't fire.
 * 
 * This endpoint is idempotent - safe to call multiple times.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthFromRequest(request);
    const userId = user.id;
    const userEmail = user.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    // Ensure profile and subscription exist
    await ensureUserProfileAndSubscription(userId, userEmail);

    return NextResponse.json({
      success: true,
      message: "Profile and subscription ensured",
    });
  } catch (error: any) {
    console.error("Error ensuring profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to ensure profile" },
      { status: 500 }
    );
  }
}

