import { useNotifications } from '@/hooks/useNotificationsApi';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
    const router = useRouter();
    const { data: notifications, isLoading, markAsRead, markAllAsRead } = useNotifications();

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
            onPress={() => {
                if (!item.is_read) markAsRead.mutate(item.id);
            }}
            disabled={item.is_read || markAsRead.isPending}
        >
            <View style={styles.iconContainer}>
                <MaterialIcons
                    name={item.type === 'routine_start' ? 'access-time' : 'notifications'}
                    size={24}
                    color={item.is_read ? '#6B7280' : '#58CC02'}
                />
            </View>
            <View style={styles.contentContainer}>
                <Text style={[styles.title, !item.is_read && styles.unreadText]}>
                    {item.title}
                </Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.timestamp}>
                    {new Date(item.created_at).toLocaleString([], {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                </Text>
            </View>
            {!item.is_read && (
                <View style={styles.unreadDot} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Notifications',
                    headerStyle: { backgroundColor: '#131F24' },
                    headerTintColor: '#fff',
                    headerShadowVisible: false,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
                            <MaterialIcons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => markAllAsRead.mutate()}
                            style={{ marginRight: 16 }}
                            disabled={!notifications?.some(n => !n.is_read)}
                        >
                            <MaterialIcons
                                name="done-all"
                                size={24}
                                color={notifications?.some(n => !n.is_read) ? '#58CC02' : '#6B7280'}
                            />
                        </TouchableOpacity>
                    ),
                }}
            />

            {isLoading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#58CC02" />
                </View>
            ) : notifications?.length === 0 ? (
                <View style={styles.centerContent}>
                    <MaterialIcons name="notifications-none" size={64} color="#374151" />
                    <Text style={styles.emptyTitle}>No Notifications</Text>
                    <Text style={styles.emptyText}>You're all caught up!</Text>
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
    container: {
        flex: 1,
        backgroundColor: '#131F24',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#1F2937',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    unreadCard: {
        backgroundColor: '#183321', // subtle green tint
        borderWidth: 1,
        borderColor: '#2D5B37',
    },
    iconContainer: {
        marginRight: 16,
        marginTop: 4,
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E5E7EB',
        marginBottom: 4,
    },
    unreadText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    message: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 8,
        lineHeight: 20,
    },
    timestamp: {
        fontSize: 12,
        color: '#6B7280',
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#58CC02',
        marginTop: 10,
        marginLeft: 8,
    },
});
