#!/usr/bin/env node
/**
 * Verify Stripe Price ID Configuration
 * 
 * This script checks if all required Stripe Price IDs are configured
 * and validates their format (must start with "price_").
 * 
 * Usage:
 *   node scripts/verify-stripe-prices.js
 * 
 * Or with environment variables:
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/verify-stripe-prices.js
 */

require('dotenv').config({ path: '.env.local' });

const requiredPriceIds = [
  'STRIPE_PRICE_ID_ESSENTIALS_MONTHLY',
  'STRIPE_PRICE_ID_ESSENTIALS_YEARLY',
  'STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY',
  'STRIPE_PRICE_ID_PROFESSIONAL_YEARLY',
  'STRIPE_PRICE_ID_EXECUTIVE_MONTHLY',
  'STRIPE_PRICE_ID_EXECUTIVE_YEARLY',
];

const optionalPriceIds = [
  'STRIPE_PRICE_ID_ALOHA_ADDON',
  'STRIPE_PRICE_ID_STUDIO_ADDON',
];

function validatePriceId(name, value) {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Missing or empty' };
  }
  
  if (typeof value !== 'string') {
    return { valid: false, error: `Not a string (type: ${typeof value})` };
  }
  
  if (!value.startsWith('price_')) {
    return { valid: false, error: 'Must start with "price_"' };
  }
  
  return { valid: true };
}

console.log('🔍 Verifying Stripe Price ID Configuration\n');
console.log('=' .repeat(60));

let hasErrors = false;
let hasWarnings = false;

// Check required price IDs
console.log('\n📋 Required Price IDs:');
console.log('-'.repeat(60));

requiredPriceIds.forEach((name) => {
  const value = process.env[name];
  const validation = validatePriceId(name, value);
  
  if (validation.valid) {
    console.log(`✅ ${name}`);
    console.log(`   ${value}`);
  } else {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${validation.error}`);
    hasErrors = true;
  }
  console.log('');
});

// Check optional price IDs
if (optionalPriceIds.some(name => process.env[name])) {
  console.log('\n📋 Optional Price IDs:');
  console.log('-'.repeat(60));
  
  optionalPriceIds.forEach((name) => {
    const value = process.env[name];
    if (value) {
      const validation = validatePriceId(name, value);
      if (validation.valid) {
        console.log(`✅ ${name}`);
        console.log(`   ${value}`);
      } else {
        console.log(`⚠️  ${name}`);
        console.log(`   Warning: ${validation.error}`);
        hasWarnings = true;
      }
      console.log('');
    }
  });
}

// Summary
console.log('=' .repeat(60));
if (hasErrors) {
  console.log('\n❌ Configuration Errors Found');
  console.log('\nPlease set the missing or invalid Stripe Price IDs in your .env.local file.');
  console.log('You can find your Price IDs in the Stripe Dashboard:');
  console.log('  https://dashboard.stripe.com/products');
  console.log('\nExample format:');
  console.log('  STRIPE_PRICE_ID_ESSENTIALS_MONTHLY=price_1234567890abcdef');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  Configuration Warnings Found');
  console.log('Some optional price IDs have invalid formats, but required IDs are OK.');
  process.exit(0);
} else {
  console.log('\n✅ All Price IDs are correctly configured!');
  process.exit(0);
}

