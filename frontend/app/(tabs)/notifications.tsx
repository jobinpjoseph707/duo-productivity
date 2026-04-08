import { useNotifications } from '@/hooks/useNotificationsApi';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/appStore';
import { productivityService } from '@/services/productivityService';
import { projectService } from '@/services/projectService';
import { timelineService } from '@/services/timelineService';
import { RoutineModal } from '@/components/timeline/RoutineModal';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
    const router = useRouter();
    const theme = useTheme();
    const c = theme.colors;
    const { data: notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();
    const showNotification = useAppStore(s => s.showNotification);
    const setLogWorkModalOpen = useAppStore(s => s.setLogWorkModalOpen);
    const setPrefillLogData = useAppStore(s => s.setPrefillLogData);
    const setRoutineModalOpen = useAppStore(s => s.setRoutineModalOpen);
    const isRoutineModalOpen = useAppStore(s => s.isRoutineModalOpen);
    const setPrefillRoutineData = useAppStore(s => s.setPrefillRoutineData);
    const queryClient = useQueryClient();

    // MCP mutations for projects and tasks
    const updateProjectMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => projectService.updateProject(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            showNotification("Project updated! 🎉", "success");
        },
        onError: () => showNotification("Failed to update project", "error")
    });

    const deleteProjectMutation = useMutation({
        mutationFn: (id: string) => projectService.deleteProject(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            showNotification("Project deleted!", "success");
        },
        onError: () => showNotification("Failed to delete project", "error")
    });

    const updateTaskMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => projectService.updateTask(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            showNotification("Task updated! ✅", "success");
        },
        onError: () => showNotification("Failed to update task", "error")
    });

    const deleteTaskMutation = useMutation({
        mutationFn: (id: string) => projectService.deleteTask(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            showNotification("Task deleted!", "success");
        },
        onError: () => showNotification("Failed to delete task", "error")
    });

    const handleApproveMCP = (item: any) => {
        try {
            const payload = JSON.parse(item.external_id || '{}');
            
            if (item.type === 'pending_project_create') {
                updateProjectMutation.mutate({ id: payload.projectId, data: { status: 'active' } }, {
                    onSuccess: () => markAsRead.mutate(item.id)
                });
            }
            else if (item.type === 'pending_task_create') {
                updateTaskMutation.mutate({ id: payload.taskId, data: { status: 'todo' } }, {
                    onSuccess: () => markAsRead.mutate(item.id)
                });
            }
            else if (item.type === 'pending_project_update') {
                updateProjectMutation.mutate({ id: payload.projectId, data: payload.updates }, {
                    onSuccess: () => markAsRead.mutate(item.id)
                });
            }
            else if (item.type === 'pending_task_update') {
                updateTaskMutation.mutate({ id: payload.taskId, data: payload.updates }, {
                    onSuccess: () => markAsRead.mutate(item.id)
                });
            }
            else if (item.type === 'pending_project_delete') {
                deleteProjectMutation.mutate(payload.projectId, {
                    onSuccess: () => markAsRead.mutate(item.id)
                });
            }
            else if (item.type === 'pending_task_delete') {
                deleteTaskMutation.mutate(payload.taskId, {
                    onSuccess: () => markAsRead.mutate(item.id)
                });
            }
        } catch (e) {
            showNotification("Invalid notification data", "error");
        }
    };

    const handleDismissMCP = (item: any) => {
        try {
            const payload = JSON.parse(item.external_id || '{}');

            if (item.type === 'pending_project_create') {
                deleteProjectMutation.mutate(payload.projectId, {
                    onSuccess: () => markAsRead.mutate(item.id),
                    onError: () => markAsRead.mutate(item.id)
                });
            }
            else if (item.type === 'pending_task_create') {
                deleteTaskMutation.mutate(payload.taskId, {
                    onSuccess: () => markAsRead.mutate(item.id),
                    onError: () => markAsRead.mutate(item.id)
                });
            }
            else {
                markAsRead.mutate(item.id);
            }
        } catch (e) {
            markAsRead.mutate(item.id);
        }
    };

    // Work Log mutations
    const approveWorkMutation = useMutation({
        mutationFn: (data: any) => productivityService.logWork(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["work-logs"] });
            queryClient.invalidateQueries({ queryKey: ["user-profile"] });
            showNotification("Work log approved! 🎉", "success");
        },
        onError: () => {
            showNotification("Failed to approve work log", "error");
        }
    });

    const handleApproveWork = (item: any) => {
        try {
            const payload = JSON.parse(item.external_id || '{}');
            approveWorkMutation.mutate(payload, {
                onSuccess: () => markAsRead.mutate(item.id)
            });
        } catch (e) {
            showNotification("Invalid work log data", "error");
        }
    };

    const handleEditWork = (item: any) => {
        try {
            const payload = JSON.parse(item.external_id || '{}');
            setPrefillLogData({ ...payload, notificationId: item.id });
            setLogWorkModalOpen(true);
        } catch (e) {
            showNotification("Invalid work log data", "error");
        }
    };

    // Routine mutations
    const approveRoutineMutation = useMutation({
        mutationFn: (data: any) => timelineService.createRoutine(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timeline"] });
            showNotification("Routine scheduled! 📅", "success");
        },
        onError: () => {
            showNotification("Failed to schedule routine", "error");
        }
    });

    const handleApproveRoutine = (item: any) => {
        try {
            const payload = JSON.parse(item.external_id || '{}');
            approveRoutineMutation.mutate(payload, {
                onSuccess: () => markAsRead.mutate(item.id)
            });
        } catch (e) {
            showNotification("Invalid routine data", "error");
        }
    };

    const handleEditRoutine = (item: any) => {
        try {
            const payload = JSON.parse(item.external_id || '{}');
            setPrefillRoutineData({ ...payload, notificationId: item.id });
            setRoutineModalOpen(true);
        } catch (e) {
            showNotification("Invalid routine data", "error");
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[
                styles.notificationCard,
                { backgroundColor: c.surface },
                !item.is_read && { backgroundColor: c.primaryMuted, borderWidth: 1, borderColor: c.primary + '40' },
            ]}
            onPress={() => { if (!item.is_read) markAsRead.mutate(item.id); }}
            disabled={item.is_read || markAsRead.isPending}
        >
            <View style={styles.iconContainer}>
                <MaterialIcons
                    name={item.type === 'routine_start' ? 'access-time' : 'notifications'}
                    size={24}
                    color={item.is_read ? c.textMuted : c.primary}
                />
            </View>
            <View style={styles.contentContainer}>
                <Text style={[styles.title, { color: c.text }, !item.is_read && { color: '#FFF', fontWeight: '700' }]}>
                    {item.title}
                </Text>
                <Text style={[styles.message, { color: c.textSecondary }]}>{item.message}</Text>
                <Text style={[styles.timestamp, { color: c.textMuted }]}>
                    {new Date(item.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
                
                {item.type === 'pending_work' && !item.is_read && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: c.primary }]}
                            onPress={() => handleApproveWork(item)}
                            disabled={approveWorkMutation.isPending}
                        >
                            <Text style={styles.actionBtnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: c.surface, borderWidth: 1, borderColor: c.primary }]}
                            onPress={() => handleEditWork(item)}
                        >
                            <Text style={[styles.actionBtnText, { color: c.primary }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.borderLight }]}
                            onPress={() => markAsRead.mutate(item.id)}
                        >
                            <Text style={[styles.actionBtnText, { color: c.text }]}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {item.type === 'pending_routine' && !item.is_read && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: c.primary }]}
                            onPress={() => handleApproveRoutine(item)}
                            disabled={approveRoutineMutation.isPending}
                        >
                            <Text style={styles.actionBtnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: c.surface, borderWidth: 1, borderColor: c.primary }]}
                            onPress={() => handleEditRoutine(item)}
                        >
                            <Text style={[styles.actionBtnText, { color: c.primary }]}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.borderLight }]}
                            onPress={() => markAsRead.mutate(item.id)}
                        >
                            <Text style={[styles.actionBtnText, { color: c.text }]}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {[
                    'pending_project_create',
                    'pending_task_create',
                    'pending_project_update',
                    'pending_task_update',
                    'pending_project_delete',
                    'pending_task_delete'
                ].includes(item.type) && !item.is_read && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: c.primary }]}
                            onPress={() => handleApproveMCP(item)}
                        >
                            <Text style={styles.actionBtnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.borderLight }]}
                            onPress={() => handleDismissMCP(item)}
                        >
                            <Text style={[styles.actionBtnText, { color: c.text }]}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: c.primary }]} />}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: c.dark }]}>
            <Stack.Screen
                options={{
                    title: 'Notifications',
                    headerStyle: { backgroundColor: c.dark },
                    headerTintColor: c.text,
                    headerShadowVisible: false,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
                            <MaterialIcons name="arrow-back" size={24} color={c.text} />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => markAllAsRead.mutate()}
                            style={{ marginRight: 16 }}
                            disabled={!notifications?.some(n => !n.is_read)}
                        >
                            <MaterialIcons name="done-all" size={24} color={notifications?.some(n => !n.is_read) ? c.primary : c.textMuted} />
                        </TouchableOpacity>
                    ),
                }}
            />

            {isLoading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={c.primary} />
                </View>
            ) : notifications?.length === 0 ? (
                <View style={styles.centerContent}>
                    <MaterialIcons name="notifications-none" size={64} color={c.borderLight} />
                    <Text style={[styles.emptyTitle, { color: c.text }]}>No Notifications</Text>
                    <Text style={[styles.emptyText, { color: c.textSecondary }]}>You're all caught up!</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
            <RoutineModal 
                visible={isRoutineModalOpen} 
                onClose={() => setRoutineModalOpen(false)} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
    emptyText: { fontSize: 16, textAlign: 'center' },
    listContent: { padding: 16, paddingBottom: 40 },
    notificationCard: { flexDirection: 'row', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'flex-start' },
    iconContainer: { marginRight: 16, marginTop: 4 },
    contentContainer: { flex: 1 },
    title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    message: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
    timestamp: { fontSize: 12 },
    unreadDot: { width: 10, height: 10, borderRadius: 5, marginTop: 10, marginLeft: 8 },
    actionButtons: { flexDirection: 'row', marginTop: 12, gap: 10 },
    actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
