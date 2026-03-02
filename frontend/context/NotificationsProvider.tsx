import { useAuth } from '@/hooks/useAuth';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { useSyncRoutines } from '@/hooks/useSyncRoutines';
import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const appState = useRef(AppState.currentState);

    // Initialize notification listeners
    useLocalNotifications();

    // Sync routines strictly when user is available mapping to local scheduling
    const { syncLocalNotifications } = useSyncRoutines();

    useEffect(() => {
        if (user) {
            syncLocalNotifications();
        }

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                console.log('App has come to the foreground! Resyncing routines...');
                if (user) syncLocalNotifications();
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [user, syncLocalNotifications]);

    return <>{children}</>;
}
