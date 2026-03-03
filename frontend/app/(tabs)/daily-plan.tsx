import { CategoryQuests } from '@/components/gamification/CategoryQuests';
import { DailyTimeline } from '@/components/timeline/DailyTimeline';
import { RoutineModal } from '@/components/timeline/RoutineModal';
import { Card } from '@/components/ui/Card';
import { useDailyQuests } from '@/hooks/useDailyQuests';
import { useWorkLogs } from '@/hooks/useDashboard';
import { useTheme } from '@/hooks/useTheme';
import { useDailyRoutines } from '@/hooks/useTimeline';
import { Routine } from '@/services/timelineService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

export default function DailyPlanScreen() {
    const theme = useTheme();
    const c = theme.colors;
    const [selectedDate, setSelectedDate] = useState(new Date());
    const currentDayOfWeek = selectedDate.getDay();

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
    const selectedDateLogs = useMemo(() => logs || [], [logs]);

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: c.dark }]}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: c.dark }]}>
            <View style={[styles.header, { borderBottomColor: c.border }]}>
                <View style={styles.dateNavContainer}>
                    <TouchableOpacity onPress={handlePrevDay} style={styles.navBtn}>
                        <MaterialIcons name="chevron-left" size={28} color={c.textSecondary} />
                    </TouchableOpacity>
                    <View style={styles.dateTextContainer}>
                        <Text style={[styles.title, { color: c.text }]}>Daily Plan</Text>
                        <Text style={[styles.subtitle, { color: c.textSecondary }]}>{dateText}</Text>
                    </View>
                    <TouchableOpacity onPress={handleNextDay} style={styles.navBtn}>
                        <MaterialIcons name="chevron-right" size={28} color={c.textSecondary} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: c.primary, ...theme.shadows.button }]} onPress={() => handleAddBlock()}>
                    <MaterialIcons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {isMobile && (
                <View style={styles.mobileTabContainer}>
                    <TouchableOpacity
                        style={[styles.mobileTab, { backgroundColor: c.surface, borderColor: c.border }, activeTab === 'schedule' && { backgroundColor: c.primaryMuted, borderColor: c.primary }]}
                        onPress={() => setActiveTab('schedule')}
                    >
                        <Text style={[styles.mobileTabText, { color: c.textSecondary }, activeTab === 'schedule' && { color: c.primary }]}>Schedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.mobileTab, { backgroundColor: c.surface, borderColor: c.border }, activeTab === 'quests' && { backgroundColor: c.primaryMuted, borderColor: c.primary }]}
                        onPress={() => setActiveTab('quests')}
                    >
                        <Text style={[styles.mobileTabText, { color: c.textSecondary }, activeTab === 'quests' && { color: c.primary }]}>Quests</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={[styles.content, isMobile && { flexDirection: 'column', gap: 0, paddingHorizontal: 0, paddingTop: 0 }]}>
                {(!isMobile || activeTab === 'schedule') && (
                    <View style={[styles.timelineSection, isMobile && { flex: 1, paddingHorizontal: 16 }]}>
                        {!isMobile && <Text style={[styles.sectionHeader, { color: c.primary }]}>Schedule</Text>}
                        <View style={[styles.timelineContainer, { backgroundColor: c.surface, borderColor: c.border }]}>
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
                        {!isMobile && <Text style={[styles.sectionHeader, { color: c.primary }]}>Today's Quests</Text>}
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
    container: { flex: 1, paddingTop: 12 },
    mobileTabContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
    mobileTab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
    mobileTabText: { fontSize: 14, fontWeight: '600' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
    title: { fontSize: 24, fontWeight: '800' },
    subtitle: { fontSize: 14, marginTop: 2 },
    addBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    dateNavContainer: { flexDirection: 'row', alignItems: 'center' },
    dateTextContainer: { alignItems: 'center', marginHorizontal: 12, minWidth: 140 },
    navBtn: { padding: 4 },
    content: { flex: 1, flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 24, maxWidth: 1200, width: '100%', alignSelf: 'center' },
    sectionHeader: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    timelineSection: { flex: 2 },
    timelineContainer: { flex: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
    questsSection: { flex: 1 },
    questsCard: { flex: 1, padding: 0, backgroundColor: 'transparent', borderWidth: 0 },
});
