import api from './api';

export interface Project {
  id: string;
  name: string;
  description: string;
  category_id: string;
  status: string;
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
