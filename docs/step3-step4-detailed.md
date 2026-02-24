# Step 3 & 4: Detailed Implementation Guide

**Date**: February 24, 2026  
**Objective**: Configure NativeWind (Tailwind CSS) and Supabase authentication client

---

## Step 3: Configure NativeWind ✅

### What is NativeWind?

NativeWind brings **Tailwind CSS utilities** to React Native, allowing you to style components with familiar Tailwind classes (`bg-primary`, `p-lg`, `rounded-xl`, etc.) instead of inline styles.

### 3.1 Create tailwind.config.js

**File**: `tailwind.config.js` (created in project root)

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Define which files contain Tailwind classes
  content: [
    "./app/**/*.{ts,tsx}", // All TypeScript files in app folder
    "./components/**/*.{ts,tsx}", // All TypeScript files in components folder
  ],

  theme: {
    extend: {
      // Custom color palette matching app design
      colors: {
        primary: "#58CC02", // Duolingo green - main button, accents
        secondary: "#CE82FF", // Purple - alternative actions
        accent: "#FF9600", // Orange - streaks, special events
        dark: "#131F24", // Dark background
        surface: "#1A2C34", // Card background
        success: "#58CC02", // Success messages
        warning: "#FF9600", // Warnings
        error: "#EF4444", // Errors
        muted: "#6B7280", // Secondary text
      },

      // Font families for Inter and Outfit fonts
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
      },

      // Additional spacing/sizing utilities
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
      },
    },
  },
  plugins: [],
};
```

### 3.2 How to Use Tailwind Classes in Components

After configuring NativeWind, you can use Tailwind classes in your React Native components:

```typescript
// Example component with NativeWind
import { View, Text } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function DashboardCard() {
  const colorScheme = useColorScheme();

  return (
    <View className="bg-surface rounded-xl p-lg">
      <Text className="text-primary font-outfit font-bold text-lg">
        Today's Progress
      </Text>
      <Text className="text-muted text-sm mt-sm">
        8 of 10 tasks completed
      </Text>
    </View>
  );
}
```

### 3.3 Color Palette Reference

| Usage                   | Class                            | Color     | Hex     |
| ----------------------- | -------------------------------- | --------- | ------- |
| Primary Button, Accents | `text-primary`, `bg-primary`     | Green     | #58CC02 |
| Secondary Actions       | `text-secondary`, `bg-secondary` | Purple    | #CE82FF |
| Streaks, Highlights     | `text-accent`, `bg-accent`       | Orange    | #FF9600 |
| Page Background         | `bg-dark`                        | Dark Gray | #131F24 |
| Cards                   | `bg-surface`                     | Dark Blue | #1A2C34 |
| Success State           | `text-success`                   | Green     | #58CC02 |
| Error State             | `text-error`                     | Red       | #EF4444 |
| Muted Text              | `text-muted`                     | Gray      | #6B7280 |

---

## Step 4: Configure Supabase Client ✅

### What is Supabase?

Supabase is an **open-source Firebase alternative** that provides:

- 🔐 Authentication (email, OAuth, etc.)
- 🗄️ PostgreSQL database
- 💾 File storage
- 🔔 Real-time subscriptions

### 4.1 Create .env File

**File**: `.env` (in project root)

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API Configuration
EXPO_PUBLIC_API_URL=http://localhost:5000/api

# App Environment
EXPO_PUBLIC_ENV=development
```

#### How to Get Supabase Credentials:

1. **Go to** [supabase.com](https://supabase.com) and sign in
2. **Create a new project** or open existing project
3. **Navigate to** Settings → API
4. **Copy these values**:
   - `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**⚠️ Important**: In Expo, environment variables must start with `EXPO_PUBLIC_` to be accessible in the app!

### 4.2 Create supabaseClient.ts

**File**: `services/supabaseClient.ts`

This file initializes and configures the Supabase client with secure token storage.

#### Key Features:

```typescript
// 1. ExpoSecureStoreAdapter
// Stores JWT tokens securely on the device using expo-secure-store
// This ensures tokens persist between app sessions without being exposed

// 2. Error Handling
// Try-catch blocks prevent crashes if secure store fails

// 3. Auto Token Refresh
// autoRefreshToken: true automatically refreshes expired tokens

// 4. App State Listener
// initializeSupabaseListeners() refreshes session when app comes to foreground
// (user may have logged out on another device while app was backgrounded)

// 5. Helper Functions
// - getCurrentSession(): Get current auth session
// - getCurrentUser(): Get logged-in user
// - initializeSupabaseListeners(): Start app state monitoring
// - cleanupSupabaseListeners(): Stop monitoring (cleanup on unmount)
```

#### Usage Example:

```typescript
import {
  supabase,
  getCurrentUser,
  initializeSupabaseListeners,
} from "@/services/supabaseClient";

// In your root layout (_layout.tsx)
useEffect(() => {
  // Initialize Supabase listeners
  initializeSupabaseListeners();

  // Get current user
  const user = await getCurrentUser();
  console.log("Logged in user:", user);

  // Return cleanup function
  return () => {
    cleanupSupabaseListeners();
  };
}, []);
```

### 4.3 Add to app.json

Update your `app.json` to include the new plugin:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-secure-store",
        {
          "faceIDPermission": "Allow $(PRODUCT_NAME) to access your face ID to authenticate securely."
        }
      ]
    ]
  }
}
```

### 4.4 Update package.json Scripts

Make sure your package.json can load environment variables:

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  }
}
```

Expo automatically loads `.env` files, so no additional configuration needed!

### 4.5 Secure Storage Explained

**ExpoSecureStoreAdapter** provides three methods:

| Method                | Purpose                                   |
| --------------------- | ----------------------------------------- |
| `getItem(key)`        | Retrieve token from secure device storage |
| `setItem(key, value)` | Store token securely on device            |
| `removeItem(key)`     | Delete token (on logout)                  |

**Security Benefits**:

- ✅ Tokens never stored in plain text
- ✅ Encrypted using device's secure enclave
- ✅ Survives app restarts
- ✅ Cleared on app uninstall

---

## Complete Integration Checklist

- [x] Create `tailwind.config.js` with custom color palette
- [x] Create `services/supabaseClient.ts` with secure storage
- [x] Create `.env` with Supabase credentials
- [x] Update `app.json` with expo-secure-store plugin
- [ ] **Next**: Add Supabase initialization to `app/_layout.tsx`
- [ ] **Next**: Create authentication service (`services/authService.ts`)
- [ ] **Next**: Create `useAuth` hook for auth state

---

## Testing Configuration

### Test 1: Verify Environment Variables

```bash
# Add this to app/_layout.tsx temporarily
console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('API URL:', process.env.EXPO_PUBLIC_API_URL);
```

### Test 2: Verify Supabase Connection

```typescript
import { supabase } from "@/services/supabaseClient";

// In a test component
useEffect(() => {
  const testConnection = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Supabase error:", error);
    } else {
      console.log("Supabase connection successful");
    }
  };
  testConnection();
}, []);
```

---

## Troubleshooting

| Issue                                          | Solution                                                    |
| ---------------------------------------------- | ----------------------------------------------------------- |
| `"Cannot find module '@supabase/supabase-js'"` | Run `npm install @supabase/supabase-js`                     |
| `"Undefined SUPABASE_URL"`                     | Check `.env` file exists and has `EXPO_PUBLIC_` prefix      |
| `"expo-secure-store error"`                    | Run `npx expo install expo-secure-store`                    |
| `"Tailwind classes not working"`               | Ensure `content` paths in `tailwind.config.js` are correct  |
| `"Token not persisting"`                       | Check app permissions for secure storage in device settings |

---

## Next Steps

After completing steps 3-4:

1. **Create authentication service** (`services/authService.ts`)
2. **Create useAuth hook** (`hooks/useAuth.ts`)
3. **Set up auth screens** (`app/(auth)/login.tsx`, `app/(auth)/register.tsx`)
4. **Initialize Supabase in root layout** (`app/_layout.tsx`)
