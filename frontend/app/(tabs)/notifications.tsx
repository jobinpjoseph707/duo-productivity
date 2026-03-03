import { useNotifications } from '@/hooks/useNotificationsApi';
import { useTheme } from '@/hooks/useTheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
    const router = useRouter();
    const theme = useTheme();
    const c = theme.colors;
    const { data: notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();

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
});
