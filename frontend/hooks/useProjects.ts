import { Category, Project, projectService, Task } from '@/services/projectService';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

export function useProjects(): UseQueryResult<Project[], Error> {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projectService.getProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
  });
}

export function useProjectTasks(projectId: string | null | undefined): UseQueryResult<Task[], Error> {
  return useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => projectService.getProjectTasks(projectId!),
    enabled: !!projectId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useProject(projectId: string | null | undefined): UseQueryResult<Project, Error> {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProject(projectId!),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories(): UseQueryResult<Category[], Error> {
  return useQuery({
    queryKey: ['categories'],
    queryFn: projectService.getCategories,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
