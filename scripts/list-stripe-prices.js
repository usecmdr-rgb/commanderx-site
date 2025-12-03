#!/usr/bin/env node
/**
 * List Stripe Prices and Generate .env.local Configuration
 * 
 * This script fetches all active Stripe prices and helps you
 * configure your .env.local file with the correct Price IDs.
 * 
 * Prerequisites:
 *   - STRIPE_SECRET_KEY must be set in environment or .env.local
 *   - Stripe SDK installed: npm install stripe
 * 
 * Usage:
 *   node scripts/list-stripe-prices.js
 */

// Try to load .env.local
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available
}

const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ Error: STRIPE_SECRET_KEY not found in environment');
  console.error('   Please set it in your .env.local file or environment variables');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

// Expected prices
const expectedPrices = [
  { name: 'Essentials - Monthly', amount: 3999, interval: 'month', key: 'STRIPE_PRICE_ID_ESSENTIALS_MONTHLY' },
  { name: 'Essentials - Yearly', amount: 43900, interval: 'year', key: 'STRIPE_PRICE_ID_ESSENTIALS_YEARLY' },
  { name: 'Professional - Monthly', amount: 7999, interval: 'month', key: 'STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY' },
  { name: 'Professional - Yearly', amount: 87900, interval: 'year', key: 'STRIPE_PRICE_ID_PROFESSIONAL_YEARLY' },
  { name: 'Executive - Monthly', amount: 12999, interval: 'month', key: 'STRIPE_PRICE_ID_EXECUTIVE_MONTHLY' },
  { name: 'Executive - Yearly', amount: 142900, interval: 'year', key: 'STRIPE_PRICE_ID_EXECUTIVE_YEARLY' },
];

async function listPrices() {
  console.log('🔍 Fetching Stripe Prices...\n');
  
  try {
    // Fetch all active prices
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
    });
    
    console.log(`Found ${prices.data.length} active prices\n`);
    console.log('=' .repeat(80));
    
    // Match prices to expected configuration
    const matches = [];
    const unmatched = [];
    
    expectedPrices.forEach(expected => {
      const match = prices.data.find(price => {
        const amount = price.unit_amount;
        const interval = price.recurring?.interval;
        const name = price.nickname || price.product?.name || '';
        
        // Check if amount and interval match
        const amountMatch = amount === expected.amount;
        const intervalMatch = interval === expected.interval;
        
        // Also check name if available
        const nameMatch = name.toLowerCase().includes(expected.name.split(' - ')[0].toLowerCase());
        
        return amountMatch && intervalMatch;
      });
      
      if (match) {
        matches.push({ expected, price: match });
      } else {
        unmatched.push(expected);
      }
    });
    
    // Show matches
    if (matches.length > 0) {
      console.log('\n✅ Matched Prices:\n');
      matches.forEach(({ expected, price }) => {
        const displayAmount = (price.unit_amount / 100).toFixed(2);
        console.log(`📋 ${expected.name}`);
        console.log(`   Price ID: ${price.id}`);
        console.log(`   Amount: $${displayAmount} ${price.currency.toUpperCase()}`);
        console.log(`   Interval: ${price.recurring?.interval}`);
        console.log(`   Env Var: ${expected.key}`);
        console.log('');
      });
    }
    
    // Show unmatched expected prices
    if (unmatched.length > 0) {
      console.log('\n⚠️  Missing Prices:\n');
      unmatched.forEach(expected => {
        const displayAmount = (expected.amount / 100).toFixed(2);
        console.log(`❌ ${expected.name} ($${displayAmount}/${expected.interval})`);
        console.log(`   Expected env var: ${expected.key}`);
        console.log('');
      });
    }
    
    // Show all prices (for reference)
    console.log('\n' + '=' .repeat(80));
    console.log('\n📋 All Active Prices in Stripe:\n');
    prices.data.forEach(price => {
      const amount = price.unit_amount ? (price.unit_amount / 100).toFixed(2) : 'N/A';
      const interval = price.recurring ? `${price.recurring.interval}` : 'one-time';
      const name = price.nickname || price.product?.name || 'Unnamed';
      
      console.log(`  ${name}`);
      console.log(`    ID: ${price.id}`);
      console.log(`    Amount: $${amount} ${price.currency.toUpperCase()} / ${interval}`);
      
      // Check if this price has wrong amount
      if (price.recurring) {
        const expected = expectedPrices.find(e => 
          e.interval === price.recurring.interval && 
          name.toLowerCase().includes(e.name.split(' - ')[0].toLowerCase())
        );
        if (expected && price.unit_amount !== expected.amount) {
          const expectedDisplay = (expected.amount / 100).toFixed(2);
          console.log(`    ⚠️  WARNING: Expected $${expectedDisplay}, but found $${amount}`);
        }
      }
      console.log('');
    });
    
    // Generate .env.local configuration
    console.log('=' .repeat(80));
    console.log('\n📝 Generated .env.local Configuration:\n');
    console.log('# Stripe Price IDs');
    matches.forEach(({ expected, price }) => {
      console.log(`${expected.key}=${price.id}`);
    });
    
    if (unmatched.length > 0) {
      console.log('\n# Missing prices - create these in Stripe Dashboard:');
      unmatched.forEach(expected => {
        const displayAmount = (expected.amount / 100).toFixed(2);
        console.log(`# ${expected.key}=price_xxxxx  # ${expected.name} - $${displayAmount}/${expected.interval}`);
      });
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log('\n💡 Next Steps:');
    console.log('   1. Copy the Price IDs above to your .env.local file');
    console.log('   2. If any prices are missing or have wrong amounts, fix them in Stripe Dashboard');
    console.log('   3. Run: node scripts/diagnose-stripe-config.js to verify');
    
  } catch (error) {
    console.error('❌ Error fetching prices:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n   Your STRIPE_SECRET_KEY may be invalid or expired.');
    }
    process.exit(1);
  }
}

listPrices();

