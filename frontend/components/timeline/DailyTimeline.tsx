import { useTheme } from '@/hooks/useTheme';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WorkLogEntry } from '../../services/productivityService';
import { Routine } from '../../services/timelineService';

interface DailyTimelineProps {
    routines: Routine[];
    logs?: WorkLogEntry[];
    onRoutinePress: (routine: Routine) => void;
    onAddBlock: (hour: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60;

export function DailyTimeline({ routines, logs = [], onRoutinePress, onAddBlock }: DailyTimelineProps) {
    const theme = useTheme();
    const c = theme.colors;

    const timeToDecimal = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours + minutes / 60;
    };

    const blocks = useMemo(() => {
        return routines.map((routine) => {
            const startHour = timeToDecimal(routine.start_time);
            let endHour = timeToDecimal(routine.end_time);
            if (endHour <= startHour) endHour = 24;
            const top = startHour * HOUR_HEIGHT;
            const height = (endHour - startHour) * HOUR_HEIGHT;
            return { ...routine, top, height };
        });
    }, [routines]);

    return (
        <ScrollView style={[styles.container, { backgroundColor: c.dark }]} showsVerticalScrollIndicator={false}>
            <View style={styles.timelineWrapper}>
                {HOURS.map((hour) => (
                    <View key={hour} style={[styles.hourSlot, { height: HOUR_HEIGHT }]}>
                        <View style={styles.timeColumn}>
                            <Text style={[styles.timeText, { color: c.textMuted }]}>
                                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.contentColumn} onPress={() => onAddBlock(hour)}>
                            <View style={[styles.hourDivider, { backgroundColor: c.border }]} />
                        </TouchableOpacity>
                    </View>
                ))}

                {blocks.map((block) => {
                    // If the stored color is the old default green, use theme primary instead
                    const OLD_DEFAULT = '#58CC02';
                    const blockColor = (!block.color || block.color.toUpperCase() === OLD_DEFAULT) ? c.primary : block.color;
                    return (
                        <TouchableOpacity
                            key={block.id}
                            style={[
                                styles.routineBlock,
                                {
                                    top: block.top,
                                    height: block.height,
                                    backgroundColor: `${blockColor}20`,
                                    borderColor: blockColor,
                                }
                            ]}
                            onPress={() => onRoutinePress(block)}
                        >
                            <View style={styles.routineHeader}>
                                <Text style={[styles.routineTitle, { color: blockColor }]} numberOfLines={1}>
                                    {block.title}
                                </Text>
                                <Text style={[styles.routineTime, { color: c.textSecondary }]}>
                                    {block.start_time.substring(0, 5)} - {block.end_time.substring(0, 5)}
                                </Text>
                            </View>

                            {(logs.filter(log => log.routineId === block.id).length > 0) && (
                                <View style={[styles.routineLogs, { borderTopColor: `${blockColor}30` }]}>
                                    {logs.filter(log => log.routineId === block.id).map(log => (
                                        <View key={log.id} style={styles.logItem}>
                                            <Text style={[styles.logText, { color: c.text }]} numberOfLines={1}>• {log.logText}</Text>
                                            {log.xpAwarded > 0 && (
                                                <Text style={[styles.logXp, { color: c.success }]}>+{log.xpAwarded} XP</Text>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}

                <CurrentTimeLine />
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

function CurrentTimeLine() {
    const theme = useTheme();
    const now = new Date();
    const currentDecimalHour = now.getHours() + now.getMinutes() / 60;
    const topPosition = currentDecimalHour * HOUR_HEIGHT;

    return (
        <View style={[styles.currentTimeContainer, { top: topPosition }]}>
            <View style={[styles.currentTimeDot, { backgroundColor: theme.colors.error }]} />
            <View style={[styles.currentTimeLine, { backgroundColor: theme.colors.error }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    timelineWrapper: { position: 'relative', paddingVertical: 10 },
    hourSlot: { flexDirection: 'row', alignItems: 'flex-start' },
    timeColumn: { width: 60, alignItems: 'flex-end', paddingRight: 10 },
    timeText: { fontSize: 12, fontWeight: '500', marginTop: -8 },
    contentColumn: { flex: 1, height: '100%' },
    hourDivider: { height: 1 },
    routineBlock: { position: 'absolute', left: 60, right: 16, borderRadius: 8, borderLeftWidth: 4, padding: 8, zIndex: 10 },
    routineTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    routineTime: { fontSize: 11 },
    routineHeader: { marginBottom: 4 },
    routineLogs: { borderTopWidth: 1, paddingTop: 4, marginTop: 2, gap: 2 },
    logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    logText: { flex: 1, fontSize: 11 },
    logXp: { fontSize: 10, fontWeight: '700', marginLeft: 4 },
    currentTimeContainer: { position: 'absolute', left: 54, right: 0, flexDirection: 'row', alignItems: 'center', zIndex: 20 },
    currentTimeDot: { width: 10, height: 10, borderRadius: 5 },
    currentTimeLine: { flex: 1, height: 2 },
});
