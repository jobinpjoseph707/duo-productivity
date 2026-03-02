import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAppStore } from '../stores/appStore';

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true
    }),
});

export function useLocalNotifications() {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState<Notifications.Notification | false>(false);
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    const showNotification = useAppStore(state => state.showNotification);
    const { generateNotification } = require('@/hooks/useNotificationsApi').useNotifications();

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => token && setExpoPushToken(token));

        // This listener is fired whenever a notification is received while the app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);

            // Optionally show a toast in-app as well
            if (notification.request.content.title) {
                showNotification(
                    `🔔 ${notification.request.content.title}: ${notification.request.content.body}`,
                    'info'
                );

                const todayStr = new Date().toISOString().split('T')[0];
                let externalId = notification.request.identifier;
                if (externalId.startsWith('routine-') && externalId.includes('-day-')) {
                    externalId = `${externalId.split('-day-')[0]}-${todayStr}`;
                } else {
                    externalId = `${externalId}-${todayStr}`;
                }

                // Log to backend in-app feed
                generateNotification.mutate({
                    type: 'routine_start',
                    title: notification.request.content.title,
                    message: notification.request.content.body || '',
                    external_id: externalId,
                });
            }
        });

        // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log("Notification tapped!", response);

            if (response.notification.request.content.title) {
                const todayStr = new Date().toISOString().split('T')[0];

                // Keep the exact same deduplication logic as useSyncRoutines
                // By making the identifier unique strictly to today
                let externalId = response.notification.request.identifier;
                if (externalId.startsWith('routine-') && externalId.includes('-day-')) {
                    externalId = `${externalId.split('-day-')[0]}-${todayStr}`;
                } else {
                    externalId = `${externalId}-${todayStr}`;
                }

                generateNotification.mutate({
                    type: 'routine_start',
                    title: response.notification.request.content.title,
                    message: response.notification.request.content.body || '',
                    external_id: externalId,
                });
            }
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    return {
        expoPushToken,
        notification,
    };
}

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.warn('Failed to get push token for push notification!');
            return;
        }

        // We only use LOCAL notifications, so getting an Expo Push Token (which requires an EAS projectId) is not necessary.
        token = 'local-token-only';
    }

    return token;
}
