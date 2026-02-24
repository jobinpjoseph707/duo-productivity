# Technical Design: DuoProductivity (.NET Core + React)

This document details the architecture for the DuoProductivity app using a .NET Core 8 Web API backend and a React (Vite) frontend, integrated with Supabase.

## 1. Backend Architecture (.NET Core 8)

### Project Structure
- `DuoProductivity.API`: Entry point, Controllers, Middleware.
- `DuoProductivity.Core`: Entities, Interfaces, Service Logic.
- `DuoProductivity.Infrastructure`: Supabase Client, Database Context, External APIs.

### Supabase Integration (C#)
We will use the `supabase-csharp` library.
```csharp
// Example Dependency Injection setup
builder.Services.AddScoped<Supabase.Client>(_ => 
    new Supabase.Client(url, key, new SupabaseOptions { AutoRefreshToken = true }));
```

### Controllers & Logic
- **`ProjectsController`**: 
  - `GET /api/projects`: Fetches and filters projects based on user category permissions (enforced by RLS in Supabase).
- **`ProductivityController`**:
  - `POST /api/productivity/log`: Receives work summaries from MCP or UI, updates tasks, and awards XP.
  - `GET /api/productivity/dashboard`: Aggregates XP, streaks, and time partitions.

## 2. Row Level Security (RLS) Policies
(As defined in previous sections, RLS remains the primary security layer in Supabase, ensuring .NET Core requests are properly scoped).

## 3. MCP Tool: `log_touchflow_work`
The MCP tool will now interface with the .NET Core API:
- **Protocol**: HTTP/HTTPS POST to `/api/productivity/log`.
- **Payload**: `{ "projectId": "...", "taskId": "...", "summary": "..." }`.

## 4. Frontend Architecture (React Native)
- **Framework**: Expo (SDK 50+) for rapid development and OTA updates.
- **State Management**: TanStack Query (React Query) for server state and caching.
- **UI System**: `NativeWind` (Tailwind for React Native) or `Tamagui` for premium mobile aesthetics.
- **Gamification Components**: 
  - `StreakFire`: Animated Lottie or Reanimated fire icon for daily streaks.
  - `XPProgressBar`: Smooth bar using `react-native-reanimated`.
  - `PathLeaf`: Touchable bubble nodes for the project task path.
- **Storage**: `expo-secure-store` for encrypted session tokens.

## 5. Authentication & Access Control (RBAC)
- **Client Side**: `@supabase/supabase-js` for login and session management.
- **Server Side**: .NET JwtBearer authentication to validate Supabase JWTs.

```csharp
// JWT Validation
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.Authority = "https://your-supabase-url.supabase.co/auth/v1";
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateIssuer = true
        };
    });
```

## 6. Database Schema Extensions (Supabase)

### `time_allocations` Table
```sql
CREATE TABLE time_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    category_name TEXT NOT NULL,
    allocated_minutes INTEGER NOT NULL,
    spent_minutes INTEGER DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### `work_logs` Table
```sql
CREATE TABLE work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    task_id UUID REFERENCES tasks(id),
    log_text TEXT,
    xp_awarded INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

## 7. AI Prompt Enhancement
The AI agent prompt will be updated to:
> "Upon completing task work, call `log_touchflow_work` via the .NET API to sync the DuoProductivity state."
