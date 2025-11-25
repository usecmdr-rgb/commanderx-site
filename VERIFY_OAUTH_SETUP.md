# OAuth Setup Verification Checklist

Based on your Google Cloud Console screenshot, here's what to verify:

## ✅ What Looks Correct:

1. **Client ID**: `1077385431224-vn2b4p0jl1gqs1gm7eubj0egephtt610.apps.googleusercontent.com`
   - ✓ Matches your .env.local file
   - ✓ This is the correct Client ID

2. **Redirect URI**: `http://localhost:3001/api/gmail/callback`
   - ✓ Correctly added
   - ✓ Matches what the app is using
   - ✓ No trailing slash
   - ✓ Correct port (3001)

3. **Client Secret**: Shows as `****gLnq` (masked)
   - Should match: `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` in your .env.local

## ⚠️ Potential Issues:

### Issue 1: Client Secret Mismatch

The Client Secret in Google Cloud Console is masked. If you lost it or it doesn't match:

**Fix:**
1. In Google Cloud Console, click **"+ Add secret"** button
2. This will create a new client secret
3. **Copy the new secret immediately** (you won't see it again!)
4. Update `.env.local`:
   ```
   GMAIL_CLIENT_SECRET=the_new_secret_here
   ```
5. Restart your dev server

### Issue 2: OAuth Consent Screen Not Configured

Even though the Client ID and redirect URI are correct, you still need:

1. **OAuth Consent Screen configured:**
   - Go to: https://console.cloud.google.com/apis/credentials/consent
   - Make sure it's configured with:
     - App name
     - Your email as support email
     - Gmail scopes added
     - Your email (`usecmdr@gmail.com`) added as **Test user**

2. **Gmail API Enabled:**
   - Go to: https://console.cloud.google.com/apis/library/gmail.googleapis.com
   - Make sure "Gmail API" shows as "Enabled"

### Issue 3: Settings Not Propagated

The note says: "It may take 5 minutes to a few hours for settings to take effect"

**Fix:**
- Wait a few minutes after saving
- Try again
- Clear browser cache
- Try in incognito mode

## 🔍 Verification Steps:

1. **Verify .env.local matches:**
   ```bash
   cat .env.local | grep GMAIL
   ```
   Should show:
   ```
   GMAIL_CLIENT_ID=1077385431224-vn2b4p0jl1gqs1gm7eubj0egephtt610.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=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
   ```

2. **Check OAuth Consent Screen:**
   - Visit: https://console.cloud.google.com/apis/credentials/consent
   - Verify:
     - Status is "Testing" or "In production"
     - Gmail scopes are added
     - Your email is in "Test users" list

3. **Test the configuration:**
   - Visit: http://localhost:3001/api/gmail/test
   - Should show all green checkmarks

4. **Restart server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

## 🚨 If Still Getting "invalid_client":

1. **Create a new Client Secret:**
   - Click "+ Add secret" in Google Cloud Console
   - Copy the new secret
   - Update .env.local
   - Restart server

2. **Verify OAuth Consent Screen:**
   - Make sure it's fully configured
   - Add your email as test user
   - Add Gmail scopes

3. **Wait for propagation:**
   - Google says settings can take 5 minutes to hours
   - Try again after waiting

4. **Check browser console:**
   - Open browser DevTools (F12)
   - Check Console tab for any errors
   - Check Network tab for failed requests

