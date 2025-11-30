# OAuth Setup Verification Checklist

## ✅ What You've Configured

### 1. Supabase Google Provider
- [x] Google provider enabled in Supabase
- [x] Client ID added to Supabase
- [x] Client Secret added to Supabase
- [x] Callback URL configured: `https://nupxbdbychuqokubresi.supabase.co/auth/v1/callback`

### 2. Google Cloud Console
- [x] OAuth client "CommanderX" created
- [x] Redirect URIs added:
  - `http://localhost:3001/api/gmail/callback` (Gmail API - local)
  - `https://ovrsee.ai/api/gmail/callback` (Gmail API - production)
  - `https://nupxbdbychuqokubresi.supabase.co/auth/v1/callback` (Supabase Google sign-in)

## ⚠️ What Still Needs to be Done

### 3. Update `.env.local` File
Your Gmail credentials are still placeholders. You need to:

1. Open `.env.local` in your project root
2. Replace these lines:
   ```
   GMAIL_CLIENT_ID=your_gmail_client_id_here
   GMAIL_CLIENT_SECRET=your_gmail_client_secret_here
   ```
   
   With your actual credentials from Google Cloud Console:
   ```
   GMAIL_CLIENT_ID=1077385431224-vn2b4p0jl1gqs1gm7eubj0egephtt610.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=your_actual_secret_here
   ```

3. **Restart your dev server** after updating (important!)

## 🧪 How to Test

### Test 1: Google Sign-In Button
1. Start your dev server: `npm run dev`
2. Go to your app homepage
3. Click "Log in" or "Sign up"
4. Click "Continue with Google" button
5. **Expected**: Should redirect to Google sign-in page
6. After signing in, should redirect back to `/app`

### Test 2: Gmail Connection
1. Log in to your app
2. Go to `/sync` page
3. Click "Connect your Gmail" button
4. **Expected**: Should open Google OAuth popup
5. After authorizing, should show "Gmail Connected"

### Test 3: Configuration Check
1. Visit: `http://localhost:3001/api/gmail/test`
2. **Expected**: Should show all green checkmarks
3. Should show your redirect URI: `http://localhost:3001/api/gmail/callback`

### Test 4: Check Config API
1. Visit: `http://localhost:3001/api/gmail/check-config`
2. **Expected**: Should return `{"ok": true}` with no issues

## 🔍 Troubleshooting

### If "Continue with Google" doesn't work:
- Check Supabase dashboard → Authentication → Providers → Google is enabled
- Verify Client ID and Secret are correct in Supabase
- Check browser console for errors
- Make sure callback URL is in Google Cloud Console

### If Gmail connection doesn't work:
- Verify `.env.local` has real credentials (not placeholders)
- Restart dev server after updating `.env.local`
- Check redirect URI matches exactly in Google Cloud Console
- Visit `/api/gmail/test` to see configuration status

## 📝 Quick Commands

```bash
# Check if credentials are set (should NOT show "your_")
grep GMAIL_CLIENT .env.local

# Test configuration endpoint
curl http://localhost:3001/api/gmail/check-config

# View test page in browser
open http://localhost:3001/api/gmail/test
```
