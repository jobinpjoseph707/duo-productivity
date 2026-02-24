# DuoProductivity: Gamified Diary & Task Planner

This plan outlines the integration of Duolingo-style gamification into a new stack using **React Native** and **.NET Core**, directly utilizing the **existing TouchFlow Supabase database** to share project, task, and category data.

## Technology Stack
- **Frontend**: React Native (Expo)
- **Backend**: .NET Core 8 Web API
- **Database**: Supabase (PostgreSQL + Auth + Storage)

## Proposed Changes

### [Component] Backend (.NET Core)

Implementing the business logic and Supabase integration in C#.

#### [NEW] `Productivity.API` Project
- **Auth Middleware**: Handle Supabase JWT tokens for user identity.
- **Project Controller**: CRUD for authorized projects/tasks.
- **Gamification Controller**: Logic for XP, streaks, and "Daily Quests".
- **WorkLog Controller**: Automated logging via MCP endpoints.

---

### [Component] Database (Supabase)

The database remains the source of truth for `projects`, `tasks`, and `categories`, with new extensions for DuoProductivity.

#### [NEW] `time_allocations` & `work_logs`
- (Metadata as previously defined in technical design)

---

### [Component] Frontend (React Native)

A premium, cross-platform mobile app with vibrant aesthetics.

#### [NEW] React Native Application Structure
- **Navigation**: Expo Router (file-indexed) for seamless transitions.
- **Dashboard Screen**: The main "Path View" and "Time Partitioning" rings using `react-native-reanimated` and `react-native-svg`.
- **Auth Flow**: Secure login using `@supabase/supabase-js` and `expo-secure-store` for session persistence.
- **Today/Tomorrow View**: Real-time project status updates using websockets/polling.

---

### [Component] MCP Integration

#### [NEW] `TouchFlow.MCP` (.NET Core)
- Implement a .NET-based MCP server or keep a Node.js bridge to interact with the .NET API.
- `log_work` tool: Communicates directly with the .NET backend to register completions and XP.

#### [MODIFY] [mobileAPP/www/app.js](file:///c:/Users/jobin/project/pocs/prplexlab/mobileAPP/www/app.js)
- Implement a "Quick Log" button that calls the `log_work` tool.
- Add logic to calculate "Remaining Time" for each partition.
- Sync with the `TouchFlow` orchestrator to pull real-time project metrics.

---

### [Component] AI Integration

#### [MODIFY] `src/services/importService.js`
- Enhance the AI agent to recognize "Update my current work" commands and map them to the `log_work` tool.
- Automatically categorize high-level goals into the "Time Partitions" (e.g., if a goal is "Study for exams", it maps to the "Study" partition).

## Verification Plan

### Automated Tests
- Test the `log_work` MCP tool independently.
- Verify XP calculation logic for different task types.

### Manual Verification
1. **Logged Work View**: Perform a task via the agent, say "log this," and verify it appears in the "Done Today" section.
2. **Time Allocation**: Manually add a partition (e.g., "Code: 2 hours"), spend time, and verify the progress bar updates.
3. **Daily Sync**: Check if tomorrow's tasks are correctly pulled from the existing planning data.
