# Arkive Mobile

A simple, beautiful journaling app for iOS and Android built with Expo and React Native.

## About

Arkive is a reflective journal designed to help you capture your thoughts across time — from fleeting daily moments to the broader arcs of months and years.

The mobile app features:
- **Home**: Greeting, streak tracking, quotes, and insights
- **Year**: Reflect on your year
- **Month**: Track your monthly journey
- **Day**: Daily journal entries

All entries are stored locally on your device using AsyncStorage — completely private and offline.

## Quick Start

### Test in Expo Go (Fastest)

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Start the development server:**
   ```bash
   npx expo start
   ```

3. **Open in Expo Go:**
   - Install Expo Go on your phone: [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - Scan the QR code with your camera (iOS) or Expo Go app (Android)
   - The app will load on your device!

### Run on Simulator/Emulator

- **iOS (requires macOS):**
  ```bash
  npm run ios
  ```

- **Android:**
  ```bash
  npm run android
  ```

- **Web:**
  ```bash
  npm run web
  ```

## Design Philosophy

Arkive uses a **dark tarot aesthetic**:
- Near-black backgrounds (`#1A1A1A`, `#121212`)
- Muted gold/bronze text (`#B9906B`, `#D4B08C`)
- Quiet, poetic, non-guru — like a friend's notebook
- Simple, focused on the writing experience

## Architecture

- **Expo Router** for navigation (file-based routing)
- **AsyncStorage** for local-only persistence
- **TypeScript** for type safety
- **Dark theme** by default

### Storage Structure

Entries are stored with date keys:
- **Year**: `YYYY` (e.g., `2026`)
- **Month**: `YYYY-MM` (e.g., `2026-09`)
- **Day**: `YYYY-MM-DD` (e.g., `2026-09-18`)

All data stays on the device — no cloud, no tracking, fully private.

## What's NOT Included (Yet)

This v1 focuses on core journaling:
- ❌ No AI/slash commands (web has this)
- ❌ No rich text editor (plain text only)
- ❌ No cloud sync
- ❌ No authentication

These can be added later — priority is shipping something Rashid can test **today**.

## Project Structure

```
mobile/
├── app/
│   ├── (tabs)/           # Tab navigation
│   │   ├── index.tsx     # Home screen
│   │   ├── year.tsx      # Year entries
│   │   ├── month.tsx     # Month entries
│   │   └── day.tsx       # Day entries
│   └── _layout.tsx       # Root layout
├── lib/
│   └── storage.ts        # AsyncStorage utilities
├── constants/
│   └── Colors.ts         # Tarot color scheme
└── package.json
```

## Development

### Adding Features

- Tabs are in `app/(tabs)/`
- Storage utilities in `lib/storage.ts`
- Colors in `constants/Colors.ts`

### Testing

Test on a physical device for the best experience:
1. Start: `npx expo start`
2. Scan QR with Expo Go
3. Journal entries persist across app restarts

## Building for Production

When ready to deploy:

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## License

Same as the web app — free, open source, fully private.

## Questions?

- Web app: Repository root (Vite + React)
- Mobile app: This directory (Expo + React Native)

Built with ❤️ for thoughtful reflection.
