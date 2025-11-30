# Quick Start - Running the Mobile App

## Important: Always Run Commands from Mobile Directory

All Expo commands must be run from the `ovrsee-mobile/` directory, NOT the root directory.

## Starting the App

```bash
# Navigate to mobile app directory first
cd ovrsee-mobile

# Then start Expo
npx expo start -c
```

## Common Commands

### Start Development Server
```bash
cd ovrsee-mobile
npx expo start -c
```

### Start for Web
```bash
cd ovrsee-mobile
npx expo start --web
```

### Start for iOS Simulator
```bash
cd ovrsee-mobile
npx expo start --ios
```

### Start for Android Emulator
```bash
cd ovrsee-mobile
npx expo start --android
```

## Directory Structure

```
COMMANDX/                    ← Root directory (web app)
├── ovrsee-mobile/          ← Mobile app directory (use this!)
│   ├── .env               ← Mobile app environment variables
│   ├── package.json       ← Mobile app dependencies
│   └── src/
```

## Common Mistakes

❌ **Wrong:**
```bash
cd /Users/nemo/cursor/COMMANDX
npx expo start -c  # ERROR: expo not found in root
```

✅ **Correct:**
```bash
cd /Users/nemo/cursor/COMMANDX/ovrsee-mobile
npx expo start -c  # Works!
```

## Environment Variables

The mobile app's `.env` file should be in `ovrsee-mobile/` directory:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## After Starting

1. Expo will open a browser with QR code
2. Scan QR code with Expo Go app (iOS/Android)
3. Or press `w` to open in web browser
4. Or press `i` for iOS simulator
5. Or press `a` for Android emulator
