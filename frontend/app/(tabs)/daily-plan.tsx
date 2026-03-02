import { CategoryQuests } from '@/components/gamification/CategoryQuests';
import { DailyTimeline } from '@/components/timeline/DailyTimeline';
import { RoutineModal } from '@/components/timeline/RoutineModal';
import { Card } from '@/components/ui/Card';
import { useDailyQuests } from '@/hooks/useDailyQuests';
import { useWorkLogs } from '@/hooks/useDashboard';
import { useDailyRoutines } from '@/hooks/useTimeline';
import { Routine } from '@/services/timelineService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

export default function DailyPlanScreen() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const currentDayOfWeek = selectedDate.getDay(); // 0 is Sunday, 1 is Monday, etc.

    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [activeTab, setActiveTab] = useState<'schedule' | 'quests'>('schedule');

    const { quests, isLoading: questsLoading } = useDailyQuests();
    const { data: routines, isLoading: routinesLoading } = useDailyRoutines(currentDayOfWeek);
    const dateStr = selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0');
    const { data: logs, isLoading: logsLoading } = useWorkLogs(50, dateStr);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRoutine, setSelectedRoutine] = useState<Routine | undefined>(undefined);
    const [initialHour, setInitialHour] = useState<number | undefined>(undefined);

    // Format date header
    const dateText = useMemo(() => {
        return selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
    }, [selectedDate]);

    const handlePrevDay = () => {
        setSelectedDate(prev => {
            const next = new Date(prev);
            next.setDate(prev.getDate() - 1);
            return next;
        });
    };

    const handleNextDay = () => {
        setSelectedDate(prev => {
            const next = new Date(prev);
            next.setDate(prev.getDate() + 1);
            return next;
        });
    };

    const handleAddBlock = (hour?: number) => {
        setSelectedRoutine(undefined);
        setInitialHour(hour);
        setModalVisible(true);
    };

    const handleEditRoutine = (routine: Routine) => {
        setSelectedRoutine(routine);
        setInitialHour(undefined);
        setModalVisible(true);
    };

    const isLoading = questsLoading || routinesLoading || logsLoading;

    // The logs are already filtered by date from the backend now, so we can just use them directly
    const selectedDateLogs = useMemo(() => logs || [], [logs]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#58CC02" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.dateNavContainer}>
                    <TouchableOpacity onPress={handlePrevDay} style={styles.navBtn}>
                        <MaterialIcons name="chevron-left" size={28} color="#9CA3AF" />
                    </TouchableOpacity>
                    <View style={styles.dateTextContainer}>
                        <Text style={styles.title}>Daily Plan</Text>
                        <Text style={styles.subtitle}>{dateText}</Text>
                    </View>
                    <TouchableOpacity onPress={handleNextDay} style={styles.navBtn}>
                        <MaterialIcons name="chevron-right" size={28} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => handleAddBlock()}>
                    <MaterialIcons name="add" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {isMobile && (
                <View style={styles.mobileTabContainer}>
                    <TouchableOpacity
                        style={[styles.mobileTab, activeTab === 'schedule' && styles.mobileTabActive]}
                        onPress={() => setActiveTab('schedule')}
                    >
                        <Text style={[styles.mobileTabText, activeTab === 'schedule' && styles.mobileTabTextActive]}>Schedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.mobileTab, activeTab === 'quests' && styles.mobileTabActive]}
                        onPress={() => setActiveTab('quests')}
                    >
                        <Text style={[styles.mobileTabText, activeTab === 'quests' && styles.mobileTabTextActive]}>Quests</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={[styles.content, isMobile && { flexDirection: 'column', gap: 0, paddingHorizontal: 0, paddingTop: 0 }]}>
                {(!isMobile || activeTab === 'schedule') && (
                    <View style={[styles.timelineSection, isMobile && { flex: 1, paddingHorizontal: 16 }]}>
                        {!isMobile && <Text style={styles.sectionHeader}>Schedule</Text>}
                        <View style={styles.timelineContainer}>
                            <DailyTimeline
                                routines={routines || []}
                                logs={selectedDateLogs}
                                onRoutinePress={handleEditRoutine}
                                onAddBlock={handleAddBlock}
                            />
                        </View>
                    </View>
                )}

                {(!isMobile || activeTab === 'quests') && (
                    <View style={[styles.questsSection, isMobile && { flex: 1, paddingHorizontal: 16 }]}>
                        {!isMobile && <Text style={styles.sectionHeader}>Today's Quests</Text>}
                        <Card style={styles.questsCard}>
                            <CategoryQuests quests={quests || []} />
                        </Card>
                    </View>
                )}
            </View>

            <RoutineModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                initialHour={initialHour}
                existingRoutine={selectedRoutine}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#131F24',
        paddingTop: 12,
    },
    mobileTabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 12,
    },
    mobileTab: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: '#1A2C34',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A3C44',
    },
    mobileTabActive: {
        backgroundColor: '#58CC0220',
        borderColor: '#58CC02',
    },
    mobileTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    mobileTabTextActive: {
        color: '#58CC02',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#131F24',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1A2C34',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    subtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 2,
    },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#58CC02',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#58CC02',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    dateNavContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateTextContainer: {
        alignItems: 'center', // Center text between arrows
        marginHorizontal: 12,
        minWidth: 140, // Ensure fixed space so it doesn't jump
    },
    navBtn: {
        padding: 4,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 24,
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: '#58CC02',
        marginBottom: 12,
    },
    timelineSection: {
        flex: 2, // Gives timeline more space relative to quests
    },
    timelineContainer: {
        flex: 1,
        backgroundColor: '#1A2C34',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2A3C44',
    },
    questsSection: {
        flex: 1,
    },
    questsCard: {
        flex: 1,
        padding: 0, // override default padding for scrolling
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
});
