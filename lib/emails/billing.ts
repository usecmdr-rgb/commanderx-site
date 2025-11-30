/**
 * Billing lifecycle email utilities
 * Sends emails for subscription and billing events
 */

import { getSupabaseServerClient } from "@/lib/supabaseServerClient";
import { formatPrice } from "@/lib/currency";

/**
 * Get workspace owner email
 */
async function getWorkspaceOwnerEmail(workspaceId: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();

  // Get workspace and owner
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("owner_user_id, stripe_customer_id")
    .eq("id", workspaceId)
    .single();

  if (workspaceError || !workspace) {
    console.error("Failed to fetch workspace:", workspaceError);
    return null;
  }

  // Try to get email from Stripe customer if available
  if (workspace.stripe_customer_id) {
    try {
      const { getStripe } = await import("@/lib/stripe");
      const stripe = getStripe();
      const customer = await stripe.customers.retrieve(workspace.stripe_customer_id);
      if (customer && !customer.deleted && "email" in customer && customer.email) {
        return customer.email;
      }
    } catch (error) {
      console.error("Failed to fetch email from Stripe customer:", error);
    }
  }

  // Fallback: Try to get from profiles table (may have email stored)
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", workspace.owner_user_id)
    .single();

  if (profile?.email) {
    return profile.email;
  }

  // Last resort: Query auth.users using admin API
  // Note: This requires service role key or RPC function
  // For now, return null and log
  console.warn(`Could not find email for workspace owner ${workspace.owner_user_id}`);
  return null;
}

/**
 * Send email via configured email service
 * This is a stub that should be replaced with your actual email service
 * (e.g., Resend, SendGrid, AWS SES, etc.)
 */
async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  // TODO: Integrate with your email service
  // Example with Resend:
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ ...params });

  // For now, just log the email
  console.log("Email would be sent:", {
    to: params.to,
    subject: params.subject,
    preview: params.text || params.html.substring(0, 100),
  });

  // In development, you might want to use a service like Mailtrap or just log
  // In production, replace this with actual email sending logic
}

/**
 * Format currency for email
 */
function formatCurrency(amount: number, currency: string = "USD"): string {
  return formatPrice(amount / 100, "en"); // Amount in cents, convert to dollars
}

/**
 * Send subscription created email
 */
export async function sendSubscriptionCreatedEmail(params: {
  workspaceId: string;
  seatCount: number;
  tiers: { tier: string; count: number }[];
  nextBillingDate: string;
  monthlyTotal: number;
}): Promise<void> {
  const { workspaceId, seatCount, tiers, nextBillingDate, monthlyTotal } = params;

  const ownerEmail = await getWorkspaceOwnerEmail(workspaceId);
  if (!ownerEmail) {
    console.error("Cannot send subscription created email: no owner email");
    return;
  }

  const tierSummary = tiers
    .filter((t) => t.count > 0)
    .map((t) => `${t.count} × ${t.tier}`)
    .join(", ");

  const subject = "Welcome to your OVRSEE subscription";
  const text = `
Hi there,

Welcome to OVRSEE! Your subscription has been activated.

Your Team Configuration:
- Total Seats: ${seatCount}
- Tiers: ${tierSummary}
- Monthly Total: ${formatCurrency(monthlyTotal * 100)}

Your next billing date is ${new Date(nextBillingDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}.

You can review your team seats and billing anytime from your account settings.

Thanks for choosing OVRSEE!

The OVRSEE Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to OVRSEE</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #059669;">Welcome to OVRSEE!</h1>
  <p>Hi there,</p>
  <p>Welcome to OVRSEE! Your subscription has been activated.</p>
  
  <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <h2 style="margin-top: 0; font-size: 18px;">Your Team Configuration</h2>
    <p style="margin: 8px 0;"><strong>Total Seats:</strong> ${seatCount}</p>
    <p style="margin: 8px 0;"><strong>Tiers:</strong> ${tierSummary}</p>
    <p style="margin: 8px 0;"><strong>Monthly Total:</strong> ${formatCurrency(monthlyTotal * 100)}</p>
  </div>
  
  <p>Your next billing date is <strong>${new Date(nextBillingDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}</strong>.</p>
  
  <p>You can review your team seats and billing anytime from your <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://ovrsee.com"}/account/subscription" style="color: #059669;">account settings</a>.</p>
  
  <p>Thanks for choosing OVRSEE!</p>
  
  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
    The OVRSEE Team
  </p>
</body>
</html>
  `.trim();

  await sendEmail({ to: ownerEmail, subject, html, text });
}

/**
 * Send subscription updated email
 */
export async function sendSubscriptionUpdatedEmail(params: {
  workspaceId: string;
  diffSummary: string;
  newMonthlyTotal: number;
  nextBillingDate: string;
}): Promise<void> {
  const { workspaceId, diffSummary, newMonthlyTotal, nextBillingDate } = params;

  const ownerEmail = await getWorkspaceOwnerEmail(workspaceId);
  if (!ownerEmail) {
    console.error("Cannot send subscription updated email: no owner email");
    return;
  }

  const subject = "Your OVRSEE subscription has been updated";
  const text = `
Hi there,

Your OVRSEE subscription has been updated.

Changes:
${diffSummary}

Your new monthly total is ${formatCurrency(newMonthlyTotal * 100)}.

Your next billing date is ${new Date(nextBillingDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}.

You can review your team seats and billing anytime from your account settings.

Thanks,
The OVRSEE Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Updated</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #059669;">Subscription Updated</h1>
  <p>Hi there,</p>
  <p>Your OVRSEE subscription has been updated.</p>
  
  <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <h2 style="margin-top: 0; font-size: 18px;">Changes</h2>
    <p style="white-space: pre-line; margin: 0;">${diffSummary}</p>
  </div>
  
  <p>Your new monthly total is <strong>${formatCurrency(newMonthlyTotal * 100)}</strong>.</p>
  
  <p>Your next billing date is <strong>${new Date(nextBillingDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}</strong>.</p>
  
  <p>You can review your team seats and billing anytime from your <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://ovrsee.com"}/account/subscription" style="color: #059669;">account settings</a>.</p>
  
  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
    The OVRSEE Team
  </p>
</body>
</html>
  `.trim();

  await sendEmail({ to: ownerEmail, subject, html, text });
}

/**
 * Send invoice upcoming email
 */
export async function sendInvoiceUpcomingEmail(params: {
  workspaceId: string;
  amountDue: number;
  date: string;
}): Promise<void> {
  const { workspaceId, amountDue, date } = params;

  const ownerEmail = await getWorkspaceOwnerEmail(workspaceId);
  if (!ownerEmail) {
    console.error("Cannot send invoice upcoming email: no owner email");
    return;
  }

  const subject = "Upcoming OVRSEE invoice";
  const text = `
Hi there,

This is a heads up that your next OVRSEE invoice for ${formatCurrency(amountDue)} is scheduled for ${new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}.

You can review your team seats and pricing anytime from your account settings.

Thanks,
The OVRSEE Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upcoming Invoice</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #059669;">Upcoming Invoice</h1>
  <p>Hi there,</p>
  <p>This is a heads up that your next OVRSEE invoice for <strong>${formatCurrency(amountDue)}</strong> is scheduled for <strong>${new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}</strong>.</p>
  
  <p>You can review your team seats and pricing anytime from your <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://ovrsee.com"}/account/subscription" style="color: #059669;">account settings</a>.</p>
  
  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
    The OVRSEE Team
  </p>
</body>
</html>
  `.trim();

  await sendEmail({ to: ownerEmail, subject, html, text });
}

/**
 * Send invoice paid email (receipt)
 */
export async function sendInvoicePaidEmail(params: {
  workspaceId: string;
  amountPaid: number;
  date: string;
  invoiceUrl?: string;
}): Promise<void> {
  const { workspaceId, amountPaid, date, invoiceUrl } = params;

  const ownerEmail = await getWorkspaceOwnerEmail(workspaceId);
  if (!ownerEmail) {
    console.error("Cannot send invoice paid email: no owner email");
    return;
  }

  const subject = "Payment received for OVRSEE";
  const text = `
Hi there,

Your payment of ${formatCurrency(amountPaid)} has been received.

Payment Date: ${new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}

${invoiceUrl ? `View invoice: ${invoiceUrl}` : ""}

Thanks for your payment!

The OVRSEE Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #059669;">Payment Received</h1>
  <p>Hi there,</p>
  <p>Your payment of <strong>${formatCurrency(amountPaid)}</strong> has been received.</p>
  
  <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Payment Date:</strong> ${new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}</p>
  </div>
  
  ${invoiceUrl ? `<p><a href="${invoiceUrl}" style="color: #059669;">View invoice</a></p>` : ""}
  
  <p>Thanks for your payment!</p>
  
  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
    The OVRSEE Team
  </p>
</body>
</html>
  `.trim();

  await sendEmail({ to: ownerEmail, subject, html, text });
}

/**
 * Send invoice failed email
 */
export async function sendInvoiceFailedEmail(params: {
  workspaceId: string;
  amountDue: number;
  retryDate?: string;
}): Promise<void> {
  const { workspaceId, amountDue, retryDate } = params;

  const ownerEmail = await getWorkspaceOwnerEmail(workspaceId);
  if (!ownerEmail) {
    console.error("Cannot send invoice failed email: no owner email");
    return;
  }

  const subject = "Payment failed for OVRSEE";
  const text = `
Hi there,

We were unable to process your payment of ${formatCurrency(amountDue)} for your OVRSEE subscription.

${retryDate ? `We'll automatically retry on ${new Date(retryDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}.` : "We'll automatically retry in a few days."}

To avoid service interruption, please update your payment method:
${process.env.NEXT_PUBLIC_APP_URL || "https://ovrsee.com"}/account/subscription

Thanks,
The OVRSEE Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #dc2626;">Payment Failed</h1>
  <p>Hi there,</p>
  <p>We were unable to process your payment of <strong>${formatCurrency(amountDue)}</strong> for your OVRSEE subscription.</p>
  
  <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0; color: #991b1b;">
      ${retryDate ? `We'll automatically retry on <strong>${new Date(retryDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}</strong>.` : "We'll automatically retry in a few days."}
    </p>
  </div>
  
  <p>To avoid service interruption, please <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://ovrsee.com"}/account/subscription" style="color: #059669; font-weight: bold;">update your payment method</a>.</p>
  
  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
    The OVRSEE Team
  </p>
</body>
</html>
  `.trim();

  await sendEmail({ to: ownerEmail, subject, html, text });
}

