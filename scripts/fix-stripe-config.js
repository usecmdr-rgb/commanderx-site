#!/usr/bin/env node
/**
 * Fix Stripe Price ID Configuration
 * 
 * This script matches your Stripe prices (even with slight amount differences)
 * and generates the correct .env.local configuration.
 */

try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {}

const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY not found');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

// Expected prices (in cents)
const expectedPrices = [
  { name: 'Essentials', amount: 3999, interval: 'month', key: 'STRIPE_PRICE_ID_ESSENTIALS_MONTHLY' },
  { name: 'Essentials', amount: 43900, interval: 'year', key: 'STRIPE_PRICE_ID_ESSENTIALS_YEARLY', tolerance: 100 }, // Allow $1 difference
  { name: 'Professional', amount: 7999, interval: 'month', key: 'STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY' },
  { name: 'Professional', amount: 87900, interval: 'year', key: 'STRIPE_PRICE_ID_PROFESSIONAL_YEARLY', tolerance: 100 },
  { name: 'Executive', amount: 12999, interval: 'month', key: 'STRIPE_PRICE_ID_EXECUTIVE_MONTHLY' },
  { name: 'Executive', amount: 142900, interval: 'year', key: 'STRIPE_PRICE_ID_EXECUTIVE_YEARLY', tolerance: 100 },
];

async function fixConfig() {
  console.log('🔍 Analyzing Stripe Prices...\n');
  
  const prices = await stripe.prices.list({ active: true, limit: 100 });
  
  const matches = [];
  const issues = [];
  
  expectedPrices.forEach(expected => {
    const candidates = prices.data.filter(price => {
      if (!price.recurring) return false;
      const intervalMatch = price.recurring.interval === expected.interval;
      if (!intervalMatch) return false;
      
      // Check amount with tolerance
      const tolerance = expected.tolerance || 0;
      const amountDiff = Math.abs((price.unit_amount || 0) - expected.amount);
      return amountDiff <= tolerance;
    });
    
    if (candidates.length === 0) {
      issues.push({ expected, problem: 'NOT_FOUND' });
    } else if (candidates.length === 1) {
      const price = candidates[0];
      const amountDiff = Math.abs((price.unit_amount || 0) - expected.amount);
      matches.push({ expected, price, amountDiff });
      
      if (amountDiff > 0) {
        issues.push({ expected, price, problem: 'AMOUNT_MISMATCH', amountDiff });
      }
    } else {
      // Multiple matches - pick the closest
      const bestMatch = candidates.reduce((best, current) => {
        const currentDiff = Math.abs((current.unit_amount || 0) - expected.amount);
        const bestDiff = Math.abs((best.unit_amount || 0) - expected.amount);
        return currentDiff < bestDiff ? current : best;
      });
      const amountDiff = Math.abs((bestMatch.unit_amount || 0) - expected.amount);
      matches.push({ expected, price: bestMatch, amountDiff });
      
      if (amountDiff > 0) {
        issues.push({ expected, price: bestMatch, problem: 'AMOUNT_MISMATCH', amountDiff });
      }
    }
  });
  
  console.log('✅ Found Prices:\n');
  matches.forEach(({ expected, price, amountDiff }) => {
    const actualAmount = (price.unit_amount / 100).toFixed(2);
    const expectedAmount = (expected.amount / 100).toFixed(2);
    const status = amountDiff === 0 ? '✅' : '⚠️';
    console.log(`${status} ${expected.name} - ${expected.interval}`);
    console.log(`   Price ID: ${price.id}`);
    console.log(`   Amount: $${actualAmount} (expected: $${expectedAmount})`);
    console.log(`   Env Var: ${expected.key}`);
    console.log('');
  });
  
  if (issues.length > 0) {
    console.log('⚠️  Issues Found:\n');
    issues.forEach(({ expected, price, problem, amountDiff }) => {
      if (problem === 'NOT_FOUND') {
        console.log(`❌ ${expected.name} - ${expected.interval}: NOT FOUND`);
        console.log(`   Create this price in Stripe Dashboard`);
      } else if (problem === 'AMOUNT_MISMATCH') {
        const actualAmount = (price.unit_amount / 100).toFixed(2);
        const expectedAmount = (expected.amount / 100).toFixed(2);
        console.log(`⚠️  ${expected.name} - ${expected.interval}: Amount mismatch`);
        console.log(`   Found: $${actualAmount}, Expected: $${expectedAmount}`);
        console.log(`   Price ID: ${price.id}`);
        console.log(`   Consider updating this price in Stripe Dashboard`);
      }
      console.log('');
    });
  }
  
  console.log('=' .repeat(80));
  console.log('\n📝 .env.local Configuration:\n');
  matches.forEach(({ expected, price }) => {
    console.log(`${expected.key}=${price.id}`);
  });
  
  console.log('\n' + '=' .repeat(80));
}

fixConfig().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

