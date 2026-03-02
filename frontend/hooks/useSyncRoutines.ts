import * as Notifications from 'expo-notifications';
import { useCallback } from 'react';
import { useRoutines } from './useTimeline'; // Assuming useTimeline hook exists

export function useSyncRoutines() {
    const { data: routines } = useRoutines();
    // Use inline require to avoid circular dependencies if any, or directly import if preferred.
    // Using require as it was safe before.
    const { generateNotification } = require('@/hooks/useNotificationsApi').useNotifications();

    const syncLocalNotifications = useCallback(async () => {
        if (!routines || routines.length === 0) return;

        try {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') return;

            // Clear all existing local notifications to prevent duplicates
            await Notifications.cancelAllScheduledNotificationsAsync();

            const now = new Date();
            const todayStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const todayDayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Adjust based on your days_of_week logic (0=Sun or 1=Mon)?
            // Wait, standard getDay() is 0=Sun, 1=Mon, ..., 6=Sat. 

            for (const routine of routines) {
                if (!routine.is_active || !routine.start_time) continue;

                const [hourStr, minuteStr] = routine.start_time.split(':');
                const hour = parseInt(hourStr, 10);
                const minute = parseInt(minuteStr, 10);
                const daysOfWeek = routine.days_of_week || [0, 1, 2, 3, 4, 5, 6];

                // 1) Retroactive Sync for Today:
                if (daysOfWeek.includes(todayDayOfWeek) || daysOfWeek.includes(now.getDay())) {
                    if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) {
                        generateNotification.mutate({
                            type: 'routine_start',
                            title: `Time for ${routine.title}!`,
                            message: `Your ${routine.title} routine started at ${routine.start_time}.`,
                            external_id: `routine-${routine.id}-${todayStr}`,
                        });
                    }
                }

                // 2) Schedule Future Notifications
                for (const day of daysOfWeek) {
                    // Expo 'weekly' trigger weekday is 1-7 (1 = Sunday)
                    // If your daysOfWeek are 0-6 (0 = Sunday), add 1.
                    const expoWeekday = day + 1;

                    await Notifications.scheduleNotificationAsync({
                        identifier: `routine-${routine.id}-day-${day}`, // deterministic identifier
                        content: {
                            title: `Time for ${routine.title}!`,
                            body: `Your ${routine.title} routine starts now.`,
                            data: { routineId: routine.id },
                        },
                        trigger: {
                            type: 'weekly',
                            channelId: 'default',
                            weekday: expoWeekday,
                            hour,
                            minute,
                        } as Notifications.WeeklyTriggerInput,
                    });
                }
            }

            console.log(`[SyncRoutines] Scheduled notifications for ${routines.length} routines and checked missed routines.`);
        } catch (error) {
            console.error('Failed to sync local notifications:', error);
        }
    }, [routines]);

    return { syncLocalNotifications };
}
