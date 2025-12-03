#!/usr/bin/env node
/**
 * Diagnose Stripe Price ID Configuration Issues
 * 
 * This script checks your current Stripe Price ID configuration
 * and identifies common mistakes (like using price amounts instead of Price IDs).
 * 
 * Usage:
 *   node scripts/diagnose-stripe-config.js
 */

// Try to load .env.local if dotenv is available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, rely on process.env
}

const requiredPriceIds = [
  { key: 'STRIPE_PRICE_ID_ESSENTIALS_MONTHLY', plan: 'Essentials', interval: 'Monthly', expectedAmount: '$39.99' },
  { key: 'STRIPE_PRICE_ID_ESSENTIALS_YEARLY', plan: 'Essentials', interval: 'Yearly', expectedAmount: '$439.00' },
  { key: 'STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY', plan: 'Professional', interval: 'Monthly', expectedAmount: '$79.99' },
  { key: 'STRIPE_PRICE_ID_PROFESSIONAL_YEARLY', plan: 'Professional', interval: 'Yearly', expectedAmount: '$879.00' },
  { key: 'STRIPE_PRICE_ID_EXECUTIVE_MONTHLY', plan: 'Executive', interval: 'Monthly', expectedAmount: '$129.99' },
  { key: 'STRIPE_PRICE_ID_EXECUTIVE_YEARLY', plan: 'Executive', interval: 'Yearly', expectedAmount: '$1,429.00' },
];

function diagnosePriceId(name, value, expectedAmount) {
  const issues = [];
  
  if (!value || value.trim() === '') {
    issues.push('❌ MISSING: Environment variable is not set');
    return { status: 'missing', issues };
  }
  
  // Check if it's a number (common mistake)
  const numValue = parseFloat(value);
  if (!isNaN(numValue) && value.trim() === numValue.toString()) {
    issues.push(`❌ WRONG FORMAT: You've set this to "${value}" (a price amount)`);
    issues.push(`   Expected: A Stripe Price ID starting with "price_"`);
    issues.push(`   Note: The price amount (${expectedAmount}) is NOT the same as the Price ID`);
    issues.push(`   Action: Go to Stripe Dashboard → Products → Create/Find the price → Copy the Price ID`);
    return { status: 'wrong_format', issues, value };
  }
  
  // Check if it starts with price_
  if (!value.startsWith('price_')) {
    issues.push(`⚠️  INVALID FORMAT: "${value}" doesn't start with "price_"`);
    issues.push(`   Stripe Price IDs always start with "price_"`);
    return { status: 'invalid_format', issues, value };
  }
  
  // Check if it looks like a valid Stripe ID (price_ followed by alphanumeric)
  if (!/^price_[a-zA-Z0-9]{14,}$/.test(value)) {
    issues.push(`⚠️  SUSPICIOUS FORMAT: "${value}" doesn't look like a valid Stripe Price ID`);
    issues.push(`   Valid Price IDs are typically: price_ followed by 14+ alphanumeric characters`);
    return { status: 'suspicious', issues, value };
  }
  
  return { status: 'valid', issues: [], value };
}

console.log('🔍 Stripe Price ID Configuration Diagnostic\n');
console.log('=' .repeat(70));

let hasErrors = false;
let hasWarnings = false;
const problems = [];

requiredPriceIds.forEach(({ key, plan, interval, expectedAmount }) => {
  const value = process.env[key];
  const diagnosis = diagnosePriceId(key, value, expectedAmount);
  
  console.log(`\n📋 ${plan} - ${interval} (${expectedAmount})`);
  console.log(`   Variable: ${key}`);
  
  if (diagnosis.status === 'valid') {
    console.log(`   ✅ Valid: ${diagnosis.value}`);
  } else {
    diagnosis.issues.forEach(issue => console.log(`   ${issue}`));
    
    if (diagnosis.status === 'missing' || diagnosis.status === 'wrong_format') {
      hasErrors = true;
      problems.push({ key, plan, interval, expectedAmount, issue: diagnosis.status });
    } else {
      hasWarnings = true;
    }
  }
});

// Summary and recommendations
console.log('\n' + '=' .repeat(70));

if (hasErrors) {
  console.log('\n❌ Configuration Errors Found\n');
  
  const wrongFormat = problems.filter(p => p.issue === 'wrong_format');
  if (wrongFormat.length > 0) {
    console.log('⚠️  Common Mistake Detected:');
    console.log('   You\'ve set some Price IDs to price amounts (like "79.99") instead of Stripe Price IDs.');
    console.log('   Price amounts are NOT the same as Price IDs!\n');
    
    console.log('📝 How to Fix:');
    console.log('   1. Go to https://dashboard.stripe.com/products');
    console.log('   2. Create a Product/Price for each plan (or use existing ones)');
    console.log('   3. Copy the Price ID (starts with "price_...")');
    console.log('   4. Update your .env.local file with the correct Price IDs\n');
    
    wrongFormat.forEach(({ plan, interval, expectedAmount }) => {
      console.log(`   - ${plan} ${interval}: Create price for ${expectedAmount}, copy Price ID`);
    });
  }
  
  const missing = problems.filter(p => p.issue === 'missing');
  if (missing.length > 0) {
    console.log('\n📝 Missing Variables:');
    missing.forEach(({ key }) => {
      console.log(`   - ${key}`);
    });
    console.log('\n   Add these to your .env.local file');
  }
  
  console.log('\n📖 For detailed instructions, see: STRIPE_PRICE_SETUP.md');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  Configuration Warnings Found');
  console.log('Some Price IDs have suspicious formats. Please verify they are correct.');
  process.exit(0);
} else {
  console.log('\n✅ All Price IDs appear to be correctly configured!');
  console.log('   If you\'re still experiencing issues, verify the Price IDs exist in your Stripe Dashboard.');
  process.exit(0);
}

