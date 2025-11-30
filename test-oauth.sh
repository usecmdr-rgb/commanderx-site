#!/bin/bash
echo "🔍 OAuth Configuration Test"
echo "=========================="
echo ""

# Check .env.local
echo "1. Checking .env.local file..."
if grep -q "your_gmail_client_id_here" .env.local; then
  echo "   ❌ GMAIL_CLIENT_ID is still a placeholder"
else
  echo "   ✅ GMAIL_CLIENT_ID is set"
fi

if grep -q "your_gmail_client_secret_here" .env.local; then
  echo "   ❌ GMAIL_CLIENT_SECRET is still a placeholder"
else
  echo "   ✅ GMAIL_CLIENT_SECRET is set"
fi

echo ""
echo "2. Checking NEXT_PUBLIC_APP_URL..."
if grep -q "NEXT_PUBLIC_APP_URL" .env.local; then
  echo "   ✅ NEXT_PUBLIC_APP_URL is set"
  grep "NEXT_PUBLIC_APP_URL" .env.local | head -1
else
  echo "   ⚠️  NEXT_PUBLIC_APP_URL not found"
fi

echo ""
echo "3. To test the configuration:"
echo "   - Start your dev server: npm run dev"
echo "   - Visit: http://localhost:3001/api/gmail/test"
echo "   - Try the 'Continue with Google' button"
echo "   - Try connecting Gmail from /sync page"
