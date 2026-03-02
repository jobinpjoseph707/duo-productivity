import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Routine, timelineService } from '../services/timelineService';

export function useRoutines() {
    return useQuery({
        queryKey: ['routines'],
        queryFn: () => timelineService.getRoutines(),
    });
}

export function useDailyRoutines(dayOfWeek: number) {
    return useQuery({
        queryKey: ['daily-routines', dayOfWeek],
        queryFn: () => timelineService.getDailyRoutines(dayOfWeek),
    });
}

export function useCreateRoutine() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (routine: Omit<Routine, 'id' | 'is_active'>) => timelineService.createRoutine(routine),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routines'] });
            queryClient.invalidateQueries({ queryKey: ['daily-routines'] });
        },
    });
}

export function useUpdateRoutine() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, routine }: { id: string; routine: Partial<Routine> }) =>
            timelineService.updateRoutine(id, routine),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routines'] });
            queryClient.invalidateQueries({ queryKey: ['daily-routines'] });
        },
    });
}

export function useDeleteRoutine() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => timelineService.deleteRoutine(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['routines'] });
            queryClient.invalidateQueries({ queryKey: ['daily-routines'] });
        },
    });
}
