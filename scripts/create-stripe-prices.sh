#!/bin/bash
#
# Create Stripe Prices for OVRSEE Plans
# 
# This script creates all required Stripe Prices using the Stripe CLI.
# You must have Stripe CLI installed and authenticated.
#
# Prerequisites:
#   - Install Stripe CLI: https://stripe.com/docs/stripe-cli
#   - Authenticate: stripe login
#
# Usage:
#   ./scripts/create-stripe-prices.sh
#
# After running, copy the Price IDs to your .env.local file

set -e

echo "🚀 Creating Stripe Prices for OVRSEE Plans"
echo "=========================================="
echo ""
echo "Make sure you have Stripe CLI installed and authenticated."
echo "If not, run: stripe login"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "Creating Essentials Monthly ($39.99/month)..."
ESSENTIALS_MONTHLY=$(stripe prices create \
  --product-name "OVRSEE Essentials Monthly" \
  --unit-amount 3999 \
  --currency usd \
  --recurring interval=month \
  --format json | jq -r '.id')

echo "✅ Created: $ESSENTIALS_MONTHLY"
echo ""

echo "Creating Essentials Yearly ($439.00/year)..."
ESSENTIALS_YEARLY=$(stripe prices create \
  --product-name "OVRSEE Essentials Yearly" \
  --unit-amount 43900 \
  --currency usd \
  --recurring interval=year \
  --format json | jq -r '.id')

echo "✅ Created: $ESSENTIALS_YEARLY"
echo ""

echo "Creating Professional Monthly ($79.99/month)..."
PROFESSIONAL_MONTHLY=$(stripe prices create \
  --product-name "OVRSEE Professional Monthly" \
  --unit-amount 7999 \
  --currency usd \
  --recurring interval=month \
  --format json | jq -r '.id')

echo "✅ Created: $PROFESSIONAL_MONTHLY"
echo ""

echo "Creating Professional Yearly ($879.00/year)..."
PROFESSIONAL_YEARLY=$(stripe prices create \
  --product-name "OVRSEE Professional Yearly" \
  --unit-amount 87900 \
  --currency usd \
  --recurring interval=year \
  --format json | jq -r '.id')

echo "✅ Created: $PROFESSIONAL_YEARLY"
echo ""

echo "Creating Executive Monthly ($129.99/month)..."
EXECUTIVE_MONTHLY=$(stripe prices create \
  --product-name "OVRSEE Executive Monthly" \
  --unit-amount 12999 \
  --currency usd \
  --recurring interval=month \
  --format json | jq -r '.id')

echo "✅ Created: $EXECUTIVE_MONTHLY"
echo ""

echo "Creating Executive Yearly ($1,429.00/year)..."
EXECUTIVE_YEARLY=$(stripe prices create \
  --product-name "OVRSEE Executive Yearly" \
  --unit-amount 142900 \
  --currency usd \
  --recurring interval=year \
  --format json | jq -r '.id')

echo "✅ Created: $EXECUTIVE_YEARLY"
echo ""

echo "=========================================="
echo "✅ All Prices Created Successfully!"
echo ""
echo "📋 Add these to your .env.local file:"
echo ""
echo "STRIPE_PRICE_ID_ESSENTIALS_MONTHLY=$ESSENTIALS_MONTHLY"
echo "STRIPE_PRICE_ID_ESSENTIALS_YEARLY=$ESSENTIALS_YEARLY"
echo "STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY=$PROFESSIONAL_MONTHLY"
echo "STRIPE_PRICE_ID_PROFESSIONAL_YEARLY=$PROFESSIONAL_YEARLY"
echo "STRIPE_PRICE_ID_EXECUTIVE_MONTHLY=$EXECUTIVE_MONTHLY"
echo "STRIPE_PRICE_ID_EXECUTIVE_YEARLY=$EXECUTIVE_YEARLY"
echo ""
echo "Then verify with: node scripts/diagnose-stripe-config.js"

