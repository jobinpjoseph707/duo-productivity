import api from './api';

export interface WorkLogEntry {
  id: string;
  projectId?: string;
  taskId?: string;
  taskTitle?: string | null;
  routineId?: string;
  logText: string;
  xpAwarded: number;
  createdAt: string;
}

export interface DashboardData {
  totalXP: number;
  level: number;
  levelProgress: number;
  xpForNextLevel: number;
  streak: number;
  streakFrozen: boolean;
  timeAllocations: Array<{
    id: string;
    categoryName: string;
    color: string;
    allocatedMinutes: number;
    spentMinutes: number;
  }>;
  recentLogs: WorkLogEntry[];
}

export interface TaskPathGroup {
  projectId: string;
  projectName: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    nodeNumber: number;
    planned_date?: string | null;
  }>;
}

export interface DailyQuest {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  status: string;
  isPlanned: boolean;
  priority: number;
}

export interface LogWorkRequest {
  projectId?: string;
  taskId?: string;
  routineId?: string;
  logText: string;
  timeSpentMinutes?: number;
}

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  total_xp: number;
  streak_count: number;
  last_activity_date: string;
  level: number;
  streak_frozen: boolean;
}

export interface ProductivityStats {
  activityGrid: Record<string, number>;
  streak: number;
  totalXp: number;
  level: number;
}

export const productivityService = {
  // Get productivity stats
  async getProductivityStats(): Promise<ProductivityStats> {
    try {
      const response = await api.get('/productivity/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching productivity stats:', error);
      throw error;
    }
  },

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



  // Get user profile/gamification data
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await api.get('/productivity/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Get work logs
  async getWorkLogs(limit: number = 10, date?: string): Promise<WorkLogEntry[]> {
    try {
      const params: Record<string, any> = { limit };
      if (date) params.date = date;
      const response = await api.get('/productivity/logs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching work logs:', error);
      throw error;
    }
  },

  // Get task path for dashboard
  async getTaskPath(): Promise<TaskPathGroup[]> {
    try {
      const response = await api.get('/productivity/path');
      return response.data;
    } catch (error) {
      console.error('Error fetching task path:', error);
      throw error;
    }
  },

  // Get daily quests (planned + suggested)
  async getDailyQuests(): Promise<DailyQuest[]> {
    try {
      const response = await api.get('/productivity/daily-quests');
      return response.data;
    } catch (error) {
      console.error('Error fetching daily quests:', error);
      throw error;
    }
  },

  // Plan a task or set project priority
  async planQuest(params: { taskId?: string, plannedDate?: string, projectId?: string, priority?: number }) {
    try {
      const response = await api.post('/productivity/daily-quests/plan', params);
      return response.data;
    } catch (error) {
      console.error('Error planning quest:', error);
      throw error;
    }
  },
};
