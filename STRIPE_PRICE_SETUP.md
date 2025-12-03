# Stripe Price ID Setup Guide

This guide will help you configure the correct Stripe Price IDs for OVRSEE subscriptions.

## Required Price IDs

You need to create **6 Price IDs** in Stripe (3 plans × 2 billing intervals):

### Essentials Plan
- **Monthly**: $39.99/month → `STRIPE_PRICE_ID_ESSENTIALS_MONTHLY`
- **Yearly**: $439.00/year (11 months = 1 month free) → `STRIPE_PRICE_ID_ESSENTIALS_YEARLY`

### Professional Plan
- **Monthly**: $79.99/month → `STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY`
- **Yearly**: $879.00/year (11 months = 1 month free) → `STRIPE_PRICE_ID_PROFESSIONAL_YEARLY`

### Executive Plan
- **Monthly**: $129.99/month → `STRIPE_PRICE_ID_EXECUTIVE_MONTHLY`
- **Yearly**: $1,429.00/year (11 months = 1 month free) → `STRIPE_PRICE_ID_EXECUTIVE_YEARLY`

## How to Get Your Price IDs

### Option 1: Create New Prices in Stripe Dashboard

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click **"+ Add product"**
3. For each plan:
   - **Name**: "Essentials Monthly", "Essentials Yearly", etc.
   - **Pricing model**: Standard pricing
   - **Price**: Enter the amount (e.g., $39.99 for monthly, $439.00 for yearly)
   - **Billing period**: 
     - Monthly → Select "Monthly"
     - Yearly → Select "Yearly"
   - **Currency**: USD
4. Click **"Save product"**
5. Copy the **Price ID** (starts with `price_...`) from the product page

### Option 2: Use Stripe CLI

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Create Essentials Monthly
stripe prices create \
  --product-name "Essentials Monthly" \
  --unit-amount 3999 \
  --currency usd \
  --recurring interval=month

# Create Essentials Yearly
stripe prices create \
  --product-name "Essentials Yearly" \
  --unit-amount 43900 \
  --currency usd \
  --recurring interval=year

# Repeat for Professional and Executive plans
```

### Option 3: List Existing Prices

If you already have prices created, list them:

```bash
stripe prices list --limit 100
```

Look for prices matching your plan names and billing intervals.

## Configure Environment Variables

Add the Price IDs to your `.env.local` file:

```bash
# Essentials
STRIPE_PRICE_ID_ESSENTIALS_MONTHLY=price_1234567890abcdef
STRIPE_PRICE_ID_ESSENTIALS_YEARLY=price_abcdef1234567890

# Professional
STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY=price_9876543210fedcba
STRIPE_PRICE_ID_PROFESSIONAL_YEARLY=price_fedcba0987654321

# Executive
STRIPE_PRICE_ID_EXECUTIVE_MONTHLY=price_1122334455667788
STRIPE_PRICE_ID_EXECUTIVE_YEARLY=price_8877665544332211
```

## Verify Configuration

Run the verification script:

```bash
node scripts/verify-stripe-prices.js
```

This will check:
- ✅ All required Price IDs are set
- ✅ All Price IDs start with `price_` (correct format)
- ✅ No Price IDs are empty or invalid

## Common Errors

### Error: "The `price` parameter should be the ID of a price object, rather than the literal numerical price"

**Cause**: You've set a Price ID to a number (e.g., `3999`) instead of a Stripe Price ID (e.g., `price_1234567890abcdef`).

**Fix**: 
1. Create the Price in Stripe Dashboard (see Option 1 above)
2. Copy the Price ID (starts with `price_`)
3. Update your `.env.local` with the correct Price ID

### Error: "Stripe price ID not configured for essentials (monthly)"

**Cause**: The environment variable `STRIPE_PRICE_ID_ESSENTIALS_MONTHLY` is missing or empty.

**Fix**: 
1. Check your `.env.local` file
2. Ensure the variable name matches exactly: `STRIPE_PRICE_ID_ESSENTIALS_MONTHLY`
3. Set it to a valid Stripe Price ID

## For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add each Price ID as a separate environment variable:
   - Key: `STRIPE_PRICE_ID_ESSENTIALS_MONTHLY`
   - Value: `price_1234567890abcdef`
   - Environment: Production, Preview, Development (select all)
4. Repeat for all 6 Price IDs
5. Redeploy your application

## Testing

After configuring Price IDs:

1. Run the verification script: `node scripts/verify-stripe-prices.js`
2. Test checkout flow in your app
3. Check Stripe Dashboard → Logs for any API errors

## Need Help?

- [Stripe Pricing Documentation](https://stripe.com/docs/billing/prices-guide)
- [Stripe Dashboard](https://dashboard.stripe.com/products)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

