# Frontend Plan: React Native (Expo)

## Technology
- **Framework**: React Native with Expo (SDK 52+)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based)
- **State**: TanStack Query (React Query) + Zustand
- **UI**: NativeWind (Tailwind for RN) + react-native-reanimated
- **Auth**: @supabase/supabase-js + expo-secure-store

---

## Folder Structure

```
duo-productivity-app/
├── app/                          # Expo Router (file-based navigation)
│   ├── _layout.tsx               # Root layout (providers, fonts, splash)
│   ├── index.tsx                 # Entry redirect (auth check)
│   ├── (auth)/                   # Auth group (unauthenticated)
│   │   ├── _layout.tsx
│   │   ├── login.tsx             # Login screen
│   │   └── register.tsx          # Registration screen
│   └── (tabs)/                   # Main app (authenticated)
│       ├── _layout.tsx           # Tab bar layout
│       ├── dashboard.tsx         # Today/Tomorrow view
│       ├── projects.tsx          # Project path view (Duolingo-style)
│       ├── diary.tsx             # Work log / diary timeline
│       └── profile.tsx           # User profile & settings
│
├── components/
│   ├── ui/                       # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Badge.tsx
│   ├── gamification/             # Gamification-specific components
│   │   ├── StreakFire.tsx         # Animated streak counter
│   │   ├── XPProgressBar.tsx     # Level-up progress bar
│   │   ├── PathNode.tsx          # Bubble node for task path
│   │   └── TimeRing.tsx          # Time allocation donut chart
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── TaskItem.tsx
│   │   └── PathView.tsx          # Vertical scrolling task path
│   └── diary/
│       ├── LogEntry.tsx
│       └── QuickLogButton.tsx
│
├── services/                     # API layer
│   ├── api.ts                    # Axios/fetch instance with JWT
│   ├── authService.ts            # Login, register, logout
│   ├── projectService.ts         # GET /api/projects, tasks
│   ├── productivityService.ts    # Dashboard, log work, allocations
│   └── supabaseClient.ts         # Supabase JS client init
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Auth state & session
│   ├── useProjects.ts            # TanStack Query for projects
│   ├── useDashboard.ts           # Dashboard data hook
│   └── useStreak.ts              # Streak calculation hook
│
├── stores/                       # Zustand stores
│   └── appStore.ts               # Global UI state (theme, modals)
│
├── constants/
│   ├── colors.ts                 # Vibrant color palette
│   ├── fonts.ts                  # Font family definitions
│   └── config.ts                 # API_URL, SUPABASE_URL, etc.
│
├── assets/
│   ├── fonts/                    # Custom fonts (Inter, Outfit)
│   ├── images/                   # App icons, illustrations
│   └── animations/               # Lottie JSON files (fire, confetti)
│
├── app.json                      # Expo config
├── tailwind.config.js            # NativeWind config
├── tsconfig.json
├── package.json
└── .env                          # SUPABASE_URL, SUPABASE_ANON_KEY, API_URL
```

---

## Setup Steps

### 1. Initialize the Project
```bash
npx -y create-expo-app@latest duo-productivity-app --template tabs
cd duo-productivity-app
```

### 2. Install Core Dependencies
```bash
# Navigation & UI
npx expo install expo-router expo-secure-store expo-font expo-splash-screen

# Supabase
npm install @supabase/supabase-js

# State & Data
npm install @tanstack/react-query zustand

# Styling & Animation
npm install nativewind tailwindcss react-native-reanimated react-native-svg
npm install lottie-react-native

# HTTP Client
npm install axios
```

### 3. Configure NativeWind
```js
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#58CC02',    // Duolingo green
        secondary: '#CE82FF',  // Purple accent
        accent: '#FF9600',     // Orange streak
        dark: '#131F24',       // Dark background
        surface: '#1A2C34',    // Card surface
      }
    }
  }
};
```

### 4. Configure Supabase Client
```typescript
// services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { storage: ExpoSecureStoreAdapter, autoRefreshToken: true } }
);
```

### 5. Key Screen: Dashboard
```typescript
// app/(tabs)/dashboard.tsx
// - Fetch data from .NET Core API via productivityService
// - Display StreakFire, XPProgressBar, TimeRing components
// - Show "Done Today" list from work_logs
// - Show "Up Next" from pending tasks
```

### 6. Key Screen: Project Path
```typescript
// app/(tabs)/projects.tsx
// - Fetch projects filtered by user category (RLS enforced)
// - Render PathView with PathNode bubbles (Duolingo-style vertical scroll)
// - Tap a node to expand task details
// - Complete button triggers POST /api/productivity/log
```

---

## API Integration Pattern

All API calls go through the `.NET Core` backend (not directly to Supabase for writes):

```
React Native App  →  .NET Core API  →  Supabase DB
                  ←  JSON Response  ←
```

Auth tokens from Supabase are sent as `Authorization: Bearer <token>` headers to the .NET API.
