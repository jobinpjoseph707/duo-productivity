import { productivityService } from '@/services/productivityService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useDailyQuests() {
    const queryClient = useQueryClient();

    const questsQuery = useQuery({
        queryKey: ['daily-quests'],
        queryFn: productivityService.getDailyQuests,
        staleTime: 5 * 60 * 1000,
    });

    const planMutation = useMutation({
        mutationFn: productivityService.planQuest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-quests'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['project'] });
            queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
        },
    });

    return {
        quests: questsQuery.data || [],
        isLoading: questsQuery.isLoading,
        refetch: questsQuery.refetch,
        planQuest: planMutation.mutateAsync,
        isPlanning: planMutation.isPending,
    };
}
