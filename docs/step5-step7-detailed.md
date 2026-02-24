# Steps 5-7: Folder Structure, Services & Hooks

**Date**: February 24, 2026  
**Focus**: Building the foundational layers with database context

---

## 🎯 Big Picture: Database Schema

### Existing Tables (TouchFlow - Reused)
```sql
categories(id, name, color, sort_order, created_at)
projects(id, name, description, owner, category_id, status, created_at, updated_at)
tasks(id, project_id, title, description, status, assignee, due_date, created_at, updated_at)
```

### New Tables for DuoProductivity
```sql
user_profiles(id, display_name, avatar_url, total_xp, streak_count, last_activity_date, level, streak_frozen)
user_category_access(user_id, category_id) -- RLS enforced
time_allocations(id, user_id, category_name, allocated_minutes, spent_minutes, date)
work_logs(id, user_id, project_id, task_id, log_text, xp_awarded, created_at)
```

**Flow**: React Native App → .NET Core API → Supabase DB (with RLS)

---

## Step 5: Folder Structure & Base Components

### 5.1 Create Directory Structure

```bash
# Run these commands in project root
mkdir -p components/ui
mkdir -p components/gamification
mkdir -p components/projects
mkdir -p components/diary
mkdir -p hooks
mkdir -p stores
mkdir -p constants
```

### 5.2 Create UI Components

#### Button.tsx - Reusable Action Button
```typescript
// components/ui/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  
  const variantStyles = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    outline: 'border border-primary',
  };
  
  const sizeStyles = {
    small: 'px-sm py-xs rounded-lg',
    medium: 'px-md py-sm rounded-lg',
    large: 'px-lg py-md rounded-xl',
  };

  return (
    <TouchableOpacity
      className={`${variantStyles[variant]} ${sizeStyles[size]} ${
        disabled ? 'opacity-50' : ''
      }`}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text className={`text-center font-outfit font-bold ${
        variant === 'outline' ? 'text-primary' : 'text-white'
      }`}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
}
```

#### Card.tsx - Container Component
```typescript
// components/ui/Card.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <View className={`bg-surface rounded-xl p-lg shadow-sm ${className}`}>
      {children}
    </View>
  );
}
```

#### ProgressBar.tsx - Progress Indicator
```typescript
// components/ui/ProgressBar.tsx
import React from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  label?: string;
}

export function ProgressBar({
  progress,
  height = 8,
  color = '#58CC02',
  label,
}: ProgressBarProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${Math.min(progress, 100)}%`, { duration: 500 }),
  }));

  return (
    <View className="w-full">
      {label && <Text className="text-sm text-muted mb-xs">{label}</Text>}
      <View className="w-full bg-dark rounded-full overflow-hidden" style={{ height }}>
        <Animated.View
          style={[animatedStyle, { backgroundColor: color, height }]}
        />
      </View>
      <Text className="text-xs text-muted mt-xs">{progress.toFixed(0)}%</Text>
    </View>
  );
}
```

#### Badge.tsx - Status Indicator
```typescript
// components/ui/Badge.tsx
import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error';
}

export function Badge({ label, variant = 'primary' }: BadgeProps) {
  const variantColors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };

  return (
    <View className={`${variantColors[variant]} rounded-full px-md py-xs`}>
      <Text className="text-white text-xs font-outfit font-semibold">
        {label}
      </Text>
    </View>
  );
}
```

### 5.3 Create Gamification Components

#### StreakFire.tsx - Animated Streak Counter
```typescript
// components/gamification/StreakFire.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';

interface StreakFireProps {
  count: number;
  isFrozen?: boolean;
}

export function StreakFire({ count, isFrozen = false }: StreakFireProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!isFrozen) {
      scale.value = withRepeat(
        withTiming(1.1, { duration: 1000 }),
        -1,
        true
      );
    }
  }, [isFrozen]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View className="items-center">
      <Animated.Text
        style={animatedStyle}
        className="text-5xl mb-sm"
      >
        🔥
      </Animated.Text>
      <View className="bg-accent rounded-full px-md py-xs">
        <Text className="text-white text-lg font-outfit font-bold">
          {count} day streak
        </Text>
      </View>
      {isFrozen && (
        <Text className="text-warning text-xs mt-sm font-outfit">
          Streak frozen ❄️
        </Text>
      )}
    </View>
  );
}
```

#### XPProgressBar.tsx - Level Up Progress
```typescript
// components/gamification/XPProgressBar.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface XPProgressBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
}

export function XPProgressBar({
  currentXP,
  nextLevelXP,
  level,
}: XPProgressBarProps) {
  const progress = (currentXP / nextLevelXP) * 100;

  return (
    <View className="gap-sm">
      <View className="flex-row justify-between items-center">
        <Text className="text-primary font-outfit font-bold text-lg">
          Level {level}
        </Text>
        <Text className="text-muted text-sm">
          {currentXP} / {nextLevelXP} XP
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        color="#58CC02"
        height={12}
      />
    </View>
  );
}
```

#### PathNode.tsx - Task Bubble
```typescript
// components/gamification/PathNode.tsx
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

interface PathNodeProps {
  nodeNumber: number;
  title: string;
  completed: boolean;
  onPress: () => void;
}

export function PathNode({
  nodeNumber,
  title,
  completed,
  onPress,
}: PathNodeProps) {
  const bgColor = completed ? 'bg-primary' : 'bg-surface';
  const textColor = completed ? 'text-white' : 'text-primary';

  return (
    <TouchableOpacity
      className={`${bgColor} w-20 h-20 rounded-full items-center justify-center border-2 border-primary`}
      onPress={onPress}
    >
      <Text className={`${textColor} text-3xl`}>
        {completed ? '✓' : nodeNumber}
      </Text>
      <Text className={`${textColor} text-xs text-center mt-xs font-outfit`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
```

#### TimeRing.tsx - Time Allocation Donut
```typescript
// components/gamification/TimeRing.tsx
import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface TimeRingProps {
  allocated: number;
  spent: number;
  category: string;
}

export function TimeRing({
  allocated,
  spent,
  category,
}: TimeRingProps) {
  const percentage = (spent / allocated) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View className="items-center gap-md">
      <Svg width={120} height={120}>
        {/* Background circle */}
        <Circle
          cx={60}
          cy={60}
          r={45}
          stroke="#1A2C34"
          strokeWidth={8}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={60}
          cy={60}
          r={45}
          stroke="#58CC02"
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      <View className="items-center">
        <Text className="text-2xl font-outfit font-bold text-primary">
          {spent}m
        </Text>
        <Text className="text-sm text-muted">of {allocated}m</Text>
        <Text className="text-xs text-muted mt-xs">{category}</Text>
      </View>
    </View>
  );
}
```

---

## Step 6: Services Layer

### 6.1 API Configuration

#### api.ts - Axios Instance with JWT
```typescript
// services/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { supabase, getCurrentSession } from './supabaseClient';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const session = await getCurrentSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.warn('Error getting session for API request:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      try {
        await supabase.auth.refreshSession();
        // Retry original request
        return api.request(error.config!);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Redirect to login
        // (handled in navigation/auth hook)
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 6.2 Service Implementations

#### authService.ts - Authentication
```typescript
// services/authService.ts
import { supabase } from './supabaseClient';

export const authService = {
  // Register new user
  async register(email: string, password: string, displayName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      
      if (error) throw error;
      
      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user
  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },
};
```

#### projectService.ts - Projects & Tasks
```typescript
// services/projectService.ts
import api from './api';

interface Project {
  id: string;
  name: string;
  description: string;
  category_id: string;
  status: string;
  created_at: string;
}

interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  assignee: string;
  due_date: string;
}

export const projectService = {
  // Get all projects for user (filtered by category access via RLS)
  async getProjects(): Promise<Project[]> {
    try {
      const response = await api.get('/projects');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  // Get tasks for a specific project
  async getProjectTasks(projectId: string): Promise<Task[]> {
    try {
      const response = await api.get(`/projects/${projectId}/tasks`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  // Get single project details
  async getProject(projectId: string): Promise<Project> {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },

  // Update task status
  async updateTaskStatus(taskId: string, status: string) {
    try {
      const response = await api.patch(`/tasks/${taskId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  },
};
```

#### productivityService.ts - Dashboard & Logging
```typescript
// services/productivityService.ts
import api from './api';

interface DashboardData {
  totalXP: number;
  level: number;
  streak: number;
  streakFrozen: boolean;
  timeAllocations: Array<{
    categoryName: string;
    allocatedMinutes: number;
    spentMinutes: number;
  }>;
  recentLogs: Array<{
    id: string;
    logText: string;
    xpAwarded: number;
    createdAt: string;
  }>;
}

interface LogWorkRequest {
  projectId?: string;
  taskId?: string;
  logText: string;
  timeSpentMinutes?: number;
}

export const productivityService = {
  // Get dashboard data
  async getDashboard(): Promise<DashboardData> {
    try {
      const response = await api.get('/productivity/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      throw error;
    }
  },

  // Log work/activity
  async logWork(data: LogWorkRequest) {
    try {
      const response = await api.post('/productivity/log', data);
      return response.data;
    } catch (error) {
      console.error('Error logging work:', error);
      throw error;
    }
  },

  // Update time allocations
  async updateTimeAllocation(categoryName: string, allocatedMinutes: number) {
    try {
      const response = await api.post('/productivity/allocations', {
        categoryName,
        allocatedMinutes,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating time allocation:', error);
      throw error;
    }
  },

  // Get user profile/gamification data
  async getUserProfile() {
    try {
      const response = await api.get('/productivity/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
};
```

---

## Step 7: Custom Hooks

### 7.1 useAuth.ts - Authentication State
```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabaseClient';
import { authService } from '@/services/authService';

interface User {
  id: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check current session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (data.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
          });
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoggingIn(true);
    try {
      const result = await authService.login(email, password);
      if (result.user) {
        setUser({
          id: result.user.id,
          email: result.user.email || '',
        });
      }
      return result;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    setIsSigningUp(true);
    try {
      return await authService.register(email, password, displayName);
    } finally {
      setIsSigningUp(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return {
    user,
    isLoading,
    isSigningUp,
    isLoggingIn,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  };
}
```

### 7.2 useProjects.ts - TanStack Query
```typescript
// hooks/useProjects.ts
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';

interface Project {
  id: string;
  name: string;
  description: string;
  category_id: string;
  status: string;
  created_at: string;
}

export function useProjects(): UseQueryResult<Project[], Error> {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => projectService.getProjectTasks(projectId),
    enabled: !!projectId,
  });
}
```

### 7.3 useDashboard.ts - Dashboard Data
```typescript
// hooks/useDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { productivityService } from '@/services/productivityService';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: productivityService.getDashboard,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: productivityService.getUserProfile,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

### 7.4 useStreak.ts - Streak Calculation
```typescript
// hooks/useStreak.ts
import { useMemo } from 'react';
import { useUserProfile } from './useDashboard';

export function useStreak() {
  const { data: profile, isLoading } = useUserProfile();

  const streakInfo = useMemo(() => {
    if (!profile) {
      return { count: 0, isFrozen: false, daysUntilLoss: 0 };
    }

    const lastActivityDate = new Date(profile.last_activity_date);
    const today = new Date();
    const daysSinceActivity = Math.floor(
      (today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      count: profile.streak_count || 0,
      isFrozen: profile.streak_frozen || false,
      daysUntilLoss: Math.max(0, 1 - daysSinceActivity), // Lose after 2 days
    };
  }, [profile]);

  return {
    ...streakInfo,
    isLoading,
  };
}
```

---

## Integration Flow Summary

```
User interacts with React Native screens
  ↓
Calls custom hooks (useAuth, useProjects, useDashboard)
  ↓
Hooks call services (authService, projectService, productivityService)
  ↓
Services use api (axios with JWT)
  ↓
API sends requests to .NET Core backend with Supabase JWT
  ↓
.NET Core validates JWT, applies RLS
  ↓
Database returns filtered data (Supabase with RLS policies)
  ↓
Data flows back through services to hooks
  ↓
React components render with TanStack Query caching
```

---

## Next Steps After Steps 5-7

1. Create authentication screens (`(auth)/login.tsx`, `(auth)/register.tsx`)
2. Set up root layout with Supabase initialization
3. Create main navigation structure with tab bar
4. Build key dashboard screen
5. Implement project path view

