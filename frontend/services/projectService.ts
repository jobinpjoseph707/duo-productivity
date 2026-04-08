import api from './api';

export interface Category {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category_id: string;
  status: string;
  priority: number;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  assignee: string;
  due_date: string;
  planned_date?: string | null;
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

  // Update task completely or just status
  async updateTask(taskId: string, data: any) {
    try {
      const response = await api.patch(`/projects/tasks/${taskId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Delete task
  async deleteTask(taskId: string) {
    try {
      const response = await api.delete(`/projects/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Update project
  async updateProject(projectId: string, data: any) {
    try {
      const response = await api.patch(`/projects/${projectId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  // Delete project
  async deleteProject(projectId: string) {
    try {
      const response = await api.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // Get categories
  async getCategories() {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
};
