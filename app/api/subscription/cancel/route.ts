import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { requireAuthFromRequest } from "@/lib/auth-helpers";
import { setPaidCancellationRetention } from "@/lib/subscription/data-retention";
import { createErrorResponse } from "@/lib/validation";

/**
 * POST /api/subscription/cancel
 * 
 * Cancels a user's subscription and sets 60-day data retention window.
 * 
 * SECURITY:
 * - Requires authentication
 * - User can only cancel their own subscription
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuthFromRequest(request);
    const userId = user.id;

    const supabase = getSupabaseServerClient();

    // Get user's Stripe subscription ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_subscription_id, subscription_tier")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return createErrorResponse("User not found", 404, profileError);
    }

    if (!profile.stripe_subscription_id) {
      return createErrorResponse("No active subscription found", 400);
    }

    // Check if user has a paid subscription
    const isPaidUser = profile.subscription_tier && ["basic", "advanced", "elite"].includes(profile.subscription_tier);
    if (!isPaidUser) {
      return createErrorResponse("Only paid subscriptions can be canceled", 400);
    }

    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    // Update subscription status in Supabase
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        status: subscription.status,
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating subscription:", updateError);
    }

    // If subscription is immediately canceled (not at period end), set retention window
    if (subscription.status === "canceled" || subscription.status === "paused") {
      await setPaidCancellationRetention(userId);
    }

    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return createErrorResponse("Authentication required", 401);
    }

    return createErrorResponse(
      "Failed to cancel subscription",
      500,
      error
    );
  }
}

