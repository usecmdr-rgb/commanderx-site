import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getStripe } from "@/lib/stripe";
import { TIERS, type TierId } from "@/lib/pricing";

const stripe = getStripe();

export interface BillingPreview {
  amountDue: number;
  currency: string;
  nextPaymentDate: string | null;
  lineItems: {
    description: string;
    amount: number;
    quantity?: number;
  }[];
}

/**
 * GET /api/billing/preview
 * 
 * Get upcoming invoice preview for the current user's workspace
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("owner_user_id", user.id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // If no subscription, return empty preview
    if (!workspace.stripe_subscription_id) {
      return NextResponse.json({
        ok: true,
        data: {
          amountDue: 0,
          currency: "usd",
          nextPaymentDate: null,
          lineItems: [],
        } as BillingPreview,
      });
    }

    try {
      // Get upcoming invoice from Stripe
      const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        customer: workspace.stripe_customer_id || undefined,
        subscription: workspace.stripe_subscription_id,
      });

      // Transform to BillingPreview format
      const lineItems = upcomingInvoice.lines.data.map((line) => {
        // Extract tier from price ID or description
        let description = line.description || "Subscription item";
        const priceId = line.price?.id;
        
        // Try to match price ID to tier
        const tier = Object.entries({
          basic: process.env.STRIPE_PRICE_ID_BASIC || "",
          advanced: process.env.STRIPE_PRICE_ID_ADVANCED || "",
          elite: process.env.STRIPE_PRICE_ID_ELITE || "",
        }).find(([, id]) => id === priceId)?.[0];

        if (tier) {
          description = `${line.quantity || 1} × ${TIERS[tier as TierId].name} seat${(line.quantity || 1) > 1 ? "s" : ""}`;
        }

        return {
          description,
          amount: line.amount || 0,
          quantity: line.quantity || undefined,
        };
      });

      // Add discount line if present
      if (upcomingInvoice.discount) {
        // Calculate discount amount from subtotal and total
        const subtotal = upcomingInvoice.subtotal || 0;
        const total = upcomingInvoice.total || 0;
        const discountAmount = subtotal - total;
        
        if (discountAmount > 0) {
        lineItems.push({
          description: `Discount: ${upcomingInvoice.discount.coupon?.name || "Team discount"}`,
            amount: -discountAmount,
            quantity: undefined,
        });
        }
      }

      const preview: BillingPreview = {
        amountDue: upcomingInvoice.amount_due || 0,
        currency: upcomingInvoice.currency || "usd",
        nextPaymentDate: upcomingInvoice.next_payment_attempt
          ? new Date(upcomingInvoice.next_payment_attempt * 1000).toISOString()
          : null,
        lineItems,
      };

      return NextResponse.json({ ok: true, data: preview });
    } catch (stripeError: any) {
      // If subscription doesn't exist in Stripe yet, return empty preview
      if (stripeError.code === "resource_missing") {
        return NextResponse.json({
          ok: true,
          data: {
            amountDue: 0,
            currency: "usd",
            nextPaymentDate: null,
            lineItems: [],
          } as BillingPreview,
        });
      }

      throw stripeError;
    }
  } catch (error: any) {
    console.error("Error fetching billing preview:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

