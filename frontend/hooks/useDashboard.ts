import { DashboardData, productivityService, UserProfile } from '@/services/productivityService';
import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

export function useDashboard(): UseQueryResult<DashboardData, Error> {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: productivityService.getDashboard,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function useUserProfile(): UseQueryResult<UserProfile, Error> {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: productivityService.getUserProfile,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });
}

export function useWorkLogs(limit: number = 10, date?: string) {
  return useQuery({
    queryKey: ['work-logs', limit, date],
    queryFn: () => productivityService.getWorkLogs(limit, date),
    staleTime: 2 * 60 * 1000,
  });
}

export function useProductivityStats() {
  return useQuery({
    queryKey: ['productivity-stats'],
    queryFn: () => productivityService.getProductivityStats(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRestoreStreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productivityService.restoreStreak,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}
