# Stackly Mobile

Expo / React Native implementation of the Stackly flash card learning app based on the mobile design in `untitled.pen`.

## Includes

- Auth screens: login and sign up
- Language selection: Python, Java, C++
- Levels screen with unlocked, completed, and locked states
- Deck overview screens with 20 cards per language
- Flash card screen with tap-to-flip and swipe gestures
- Result screen with progress feedback
- Profile screen with per-language progress

## Tech

- Expo
- React Native
- TypeScript

## Run

```bash
npm install
npm run start
```

Then open the app in Expo Go or an emulator.

## Main Files

- `App.tsx` - app flow and screen components
- `src/data/cards.ts` - all Ukrainian flash card content
- `src/theme.ts` - colors, spacing, typography tokens
- `src/types.ts` - shared app types
