# Port Configuration Guide

## Current Setup

The application is configured to run on **port 3001** by default.

## Why Port 3001?

Port 3000 may be:
- Already in use by another service
- Blocked or slow due to system processes
- Conflicting with other development tools

## Changing the Port

### Option 1: Use the Default (Port 3001)

The `dev` script in `package.json` is configured to use port 3001:

```bash
npm run dev
```

### Option 2: Use Port 3000

If you want to use port 3000, run:

```bash
npm run dev:3000
```

### Option 3: Use a Custom Port

To use a different port, modify `package.json`:

```json
"dev": "next dev -p YOUR_PORT"
```

Or run directly:

```bash
next dev -p YOUR_PORT
```

## Environment Variables

Make sure your `.env.local` matches your port:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

If you change ports, update this value accordingly.

## OAuth Redirect URIs

When setting up Gmail OAuth in Google Cloud Console, use the redirect URI that matches your port:

- Port 3001: `http://localhost:3001/api/gmail/callback`
- Port 3000: `http://localhost:3000/api/gmail/callback`
- Custom port: `http://localhost:YOUR_PORT/api/gmail/callback`

**Important**: The redirect URI in Google Cloud Console must match exactly, including the port number.

## Troubleshooting

### Port Already in Use

If you get an error that the port is in use:

1. Find what's using the port:
   ```bash
   lsof -ti:3001
   ```

2. Kill the process (if safe to do so):
   ```bash
   kill -9 $(lsof -ti:3001)
   ```

3. Or use a different port

### OAuth Not Working

If Gmail OAuth fails, check:

1. The redirect URI in Google Cloud Console matches your current port
2. `NEXT_PUBLIC_APP_URL` in `.env.local` matches your port
3. Restart your development server after changing ports

### Slow Performance on Port 3000

If port 3000 is slow:

1. Check for conflicting processes:
   ```bash
   lsof -i:3000
   ```

2. Switch to port 3001 (already configured)
3. Or use a different port

## Current Configuration

- **Default Port**: 3001
- **Environment Variable**: `NEXT_PUBLIC_APP_URL=http://localhost:3001`
- **Gmail Redirect URI**: `http://localhost:3001/api/gmail/callback`

