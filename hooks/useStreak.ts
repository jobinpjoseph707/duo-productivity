import { useMemo } from 'react';
import { useUserProfile } from './useDashboard';

export function useStreak() {
  const { data: profile, isLoading } = useUserProfile();

  const streakInfo = useMemo(() => {
    if (!profile) {
      return { count: 0, isFrozen: false, daysUntilLoss: 0 };
    }

    const lastActivityDate = new Date(profile.last_activity_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastActivityDate.setHours(0, 0, 0, 0);

    const daysSinceActivity = Math.floor(
      (today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      count: profile.streak_count || 0,
      isFrozen: profile.streak_frozen || false,
      daysUntilLoss: Math.max(0, 1 - daysSinceActivity), // Lose after 2 days of inactivity
      daysSinceActivity,
    };
  }, [profile]);

  return {
    ...streakInfo,
    isLoading,
  };
}
