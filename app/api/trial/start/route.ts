import { NextRequest, NextResponse } from "next/server";
import { stripe, tierConfig, type TierId } from "@/lib/stripe";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";

export async function POST(request: NextRequest) {
  try {
    const { tier, userId } = await request.json();

    if (!tier || !["basic", "advanced", "elite"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 });
    }

    const tierData = tierConfig[tier as TierId];
    const supabase = getSupabaseServerClient();

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        metadata: {
          supabase_user_id: userId,
        },
      });

      customerId = customer.id;

      // Save customer ID to Supabase
      await supabase
        .from("profiles")
        .upsert({
          id: userId,
          stripe_customer_id: customerId,
        });
    }

    // Check if user already has an active subscription or trial
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    if (existingSubscriptions.data.length > 0) {
      const activeSub = existingSubscriptions.data[0];
      if (activeSub.status === "active" || activeSub.status === "trialing") {
        return NextResponse.json(
          { error: "You already have an active subscription or trial" },
          { status: 400 }
        );
      }
    }

    // Create subscription with 3-day free trial
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: tierData.priceId,
        },
      ],
      trial_period_days: 3,
      metadata: {
        tier,
        userId,
        is_trial: "true",
      },
    });

    // Store subscription info in Supabase (you may want to create a subscriptions table)
    await supabase.from("profiles").update({
      subscription_tier: tier,
      subscription_status: "trialing",
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq("id", userId);

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    });
  } catch (error: any) {
    console.error("Trial start error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


