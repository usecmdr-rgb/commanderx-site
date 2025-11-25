# Gmail OAuth Troubleshooting: "invalid_client" Error

## Error: "Error 401: invalid_client" - "The OAuth client was not found"

This error means Google cannot find your OAuth client. Here are the most common causes and fixes:

## ✅ Check 1: Verify Redirect URI in Google Cloud Console

**This is the #1 cause of this error!**

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Scroll to **"Authorized redirect URIs"**
4. Make sure it contains **EXACTLY** (no trailing slash, exact match):
   ```
   http://localhost:3001/api/gmail/callback
   ```
5. If it's missing or different, click **"+ ADD URI"** and add it
6. Click **"SAVE"**

**Important:** The redirect URI must match EXACTLY, including:
- Protocol: `http://` (not `https://` for localhost)
- Port: `3001` (not `3000`)
- Path: `/api/gmail/callback` (no trailing slash)

## ✅ Check 2: Verify OAuth Consent Screen

1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Make sure:
   - Publishing status is "Testing" (for development)
   - Your email (`nematollah.cas@gmail.com`) is added as a **Test user**
   - Scopes include Gmail API scopes

## ✅ Check 3: Verify Client ID is Correct

1. In Google Cloud Console, go to Credentials
2. Click on your OAuth 2.0 Client ID
3. Copy the **Client ID** shown
4. Verify it matches what's in your `.env.local`:
   ```bash
   cat .env.local | grep GMAIL_CLIENT_ID
   ```
5. Should show: `GMAIL_CLIENT_ID=1077385431224-vn2b4p0jl1gqs1gm7eubj0egephtt610.apps.googleusercontent.com`

## ✅ Check 4: Restart Your Server

After updating `.env.local`, you **MUST** restart your Next.js server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

Environment variables are only loaded when the server starts!

## ✅ Check 5: Verify Project and Client ID Match

Make sure you're using the Client ID from the correct Google Cloud project. If you have multiple projects, verify you're using the right one.

## ✅ Check 6: Test the Configuration

Visit this URL to see your current configuration:
```
http://localhost:3001/api/gmail/test
```

This will show:
- Whether Client ID is set correctly
- What redirect URI is being used
- Any configuration issues

## Common Mistakes

1. **Wrong port**: Using `3000` instead of `3001`
2. **Trailing slash**: `http://localhost:3001/api/gmail/callback/` (has trailing slash)
3. **HTTPS instead of HTTP**: Using `https://localhost:3001` (should be `http://`)
4. **Different redirect URI**: Not matching exactly what's in Google Cloud Console
5. **Server not restarted**: Environment variables not loaded

## Quick Fix Checklist

- [ ] Redirect URI in Google Cloud Console: `http://localhost:3001/api/gmail/callback`
- [ ] No trailing slash on redirect URI
- [ ] Using `http://` not `https://` for localhost
- [ ] Port is `3001` not `3000`
- [ ] Client ID in `.env.local` matches Google Cloud Console
- [ ] Server restarted after updating `.env.local`
- [ ] Email added as test user in OAuth consent screen
- [ ] Gmail API is enabled in the project

## Still Not Working?

1. Double-check the redirect URI in Google Cloud Console matches exactly
2. Try deleting and recreating the OAuth client
3. Make sure you're signed in to the correct Google account in the browser
4. Clear browser cache and cookies
5. Check browser console for any additional error messages

