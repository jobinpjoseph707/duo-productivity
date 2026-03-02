import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

import { getCurrentSession } from '@/services/supabaseClient';

const getAuthHeaders = async () => {
    const session = await getCurrentSession();
    if (!session?.access_token) throw new Error('No auth token found');
    return {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
    };
};

export interface NotificationItem {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    external_id?: string;
    created_at: string;
}

export function useNotifications() {
    const queryClient = useQueryClient();

    const query = useQuery<NotificationItem[], Error>({
        queryKey: ['notifications'],
        queryFn: async () => {
            const headers = await getAuthHeaders();
            const response = await axios.get(`${API_URL}/notifications`, { headers });
            return response.data;
        },
        staleTime: 60 * 1000,
    });

    const generateNotification = useMutation({
        mutationFn: async (data: { type: string; title: string; message: string; external_id?: string }) => {
            console.log("[useNotificationsApi] Attempting POST /notifications with data:", data);
            const headers = await getAuthHeaders();
            const response = await axios.post(`${API_URL}/notifications`, data, { headers });
            return response.data;
        },
        onSuccess: (data) => {
            console.log("[useNotificationsApi] Successfully logged to DB:", data);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
        onError: (error: any) => {
            console.error("[useNotificationsApi] Failed to log notification:", error.response?.data || error.message);
        }
    });

    const markAsRead = useMutation({
        mutationFn: async (id: string) => {
            const headers = await getAuthHeaders();
            const response = await axios.put(`${API_URL}/notifications/${id}/read`, {}, { headers });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllAsRead = useMutation({
        mutationFn: async () => {
            const headers = await getAuthHeaders();
            const response = await axios.put(`${API_URL}/notifications/read-all`, {}, { headers });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const unreadCount = query.data?.filter(n => !n.is_read).length || 0;

    return {
        ...query,
        generateNotification,
        markAsRead,
        markAllAsRead,
        unreadCount,
    };
}
