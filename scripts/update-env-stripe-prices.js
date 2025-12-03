#!/usr/bin/env node
/**
 * Update .env.local with Stripe Price IDs
 * 
 * This script updates your .env.local file with the correct Stripe Price IDs.
 */

const fs = require('fs');
const path = require('path');

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

const expectedPrices = [
  { name: 'Essentials', amount: 3999, interval: 'month', key: 'STRIPE_PRICE_ID_ESSENTIALS_MONTHLY' },
  { name: 'Essentials', amount: 43900, interval: 'year', key: 'STRIPE_PRICE_ID_ESSENTIALS_YEARLY', tolerance: 100 },
  { name: 'Professional', amount: 7999, interval: 'month', key: 'STRIPE_PRICE_ID_PROFESSIONAL_MONTHLY' },
  { name: 'Professional', amount: 87900, interval: 'year', key: 'STRIPE_PRICE_ID_PROFESSIONAL_YEARLY', tolerance: 100 },
  { name: 'Executive', amount: 12999, interval: 'month', key: 'STRIPE_PRICE_ID_EXECUTIVE_MONTHLY' },
  { name: 'Executive', amount: 142900, interval: 'year', key: 'STRIPE_PRICE_ID_EXECUTIVE_YEARLY', tolerance: 100 },
];

async function updateEnvFile() {
  console.log('🔍 Fetching Stripe Prices...\n');
  
  const prices = await stripe.prices.list({ active: true, limit: 100 });
  const envPath = path.join(process.cwd(), '.env.local');
  
  // Read existing .env.local
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  const updates = [];
  const missing = [];
  
  // Match prices
  expectedPrices.forEach(expected => {
    const candidates = prices.data.filter(price => {
      if (!price.recurring) return false;
      return price.recurring.interval === expected.interval;
    });
    
    const match = candidates.find(price => {
      const tolerance = expected.tolerance || 0;
      const amountDiff = Math.abs((price.unit_amount || 0) - expected.amount);
      return amountDiff <= tolerance;
    });
    
    if (match) {
      updates.push({ key: expected.key, value: match.id, expected });
    } else {
      missing.push(expected);
    }
  });
  
  // Create missing Executive Yearly price
  if (missing.some(m => m.key === 'STRIPE_PRICE_ID_EXECUTIVE_YEARLY')) {
    console.log('📝 Creating missing Executive Yearly price...\n');
    try {
      // First, find or create the product
      const products = await stripe.products.list({ limit: 100 });
      let product = products.data.find(p => p.name?.includes('Executive'));
      
      if (!product) {
        product = await stripe.products.create({
          name: 'OVRSEE Executive',
        });
      }
      
      const newPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: 142900, // $1,429.00
        currency: 'usd',
        recurring: {
          interval: 'year',
        },
      });
      updates.push({ 
        key: 'STRIPE_PRICE_ID_EXECUTIVE_YEARLY', 
        value: newPrice.id,
        expected: missing.find(m => m.key === 'STRIPE_PRICE_ID_EXECUTIVE_YEARLY')
      });
      console.log(`✅ Created Executive Yearly: ${newPrice.id}\n`);
    } catch (err) {
      console.error(`❌ Failed to create Executive Yearly: ${err.message}\n`);
    }
  }
  
  // Update .env.local
  updates.forEach(({ key, value }) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
      console.log(`✅ Updated ${key}=${value}`);
    } else {
      // Add new line
      if (envContent && !envContent.endsWith('\n')) {
        envContent += '\n';
      }
      envContent += `${key}=${value}\n`;
      console.log(`✅ Added ${key}=${value}`);
    }
  });
  
  // Write back to file
  fs.writeFileSync(envPath, envContent, 'utf8');
  
  console.log('\n✅ Updated .env.local successfully!');
  console.log('\n📋 Summary:');
  updates.forEach(({ key, expected }) => {
    console.log(`   ${key}`);
  });
  
  if (missing.length > 0) {
    console.log('\n⚠️  Still missing:');
    missing.forEach(({ key }) => {
      console.log(`   ${key}`);
    });
  }
  
  console.log('\n💡 Next step: Run "node scripts/diagnose-stripe-config.js" to verify');
}

updateEnvFile().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

