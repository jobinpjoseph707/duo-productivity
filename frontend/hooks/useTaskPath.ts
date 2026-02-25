import { productivityService, TaskPathGroup } from '@/services/productivityService';
import { useQuery } from '@tanstack/react-query';

export function useTaskPath() {
    return useQuery<TaskPathGroup[], Error>({
        queryKey: ['task-path'],
        queryFn: productivityService.getTaskPath,
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}
