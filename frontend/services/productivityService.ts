import api from './api';

export interface DashboardData {
  totalXP: number;
  level: number;
  levelProgress: number;
  xpForNextLevel: number;
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

export interface TaskPathGroup {
  projectId: string;
  projectName: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    nodeNumber: number;
  }>;
}

export interface LogWorkRequest {
  projectId?: string;
  taskId?: string;
  logText: string;
  timeSpentMinutes?: number;
  categoryName?: string;
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
  async getWorkLogs(limit: number = 10) {
    try {
      const response = await api.get('/productivity/logs', {
        params: { limit },
      });
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
};
