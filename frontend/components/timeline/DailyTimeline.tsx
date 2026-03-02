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
const HOUR_HEIGHT = 60; // Pixels per hour

export function DailyTimeline({ routines, logs = [], onRoutinePress, onAddBlock }: DailyTimelineProps) {
    // Helper to convert HH:MM:SS to decimal hours (e.g., 09:30:00 -> 9.5)
    const timeToDecimal = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours + minutes / 60;
    };

    // Prepare blocks with calculated top and height positioning
    const blocks = useMemo(() => {
        return routines.map((routine) => {
            const startHour = timeToDecimal(routine.start_time);
            let endHour = timeToDecimal(routine.end_time);

            // Handle over-midnight blocks (simplistic approach for now)
            if (endHour <= startHour) {
                endHour = 24;
            }

            const top = startHour * HOUR_HEIGHT;
            const height = (endHour - startHour) * HOUR_HEIGHT;

            return {
                ...routine,
                top,
                height,
            };
        });
    }, [routines]);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.timelineWrapper}>
                {/* Background Time Slots */}
                {HOURS.map((hour) => (
                    <View key={hour} style={[styles.hourSlot, { height: HOUR_HEIGHT }]}>
                        <View style={styles.timeColumn}>
                            <Text style={styles.timeText}>
                                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.contentColumn}
                            onPress={() => onAddBlock(hour)}
                        >
                            <View style={styles.hourDivider} />
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Absolute Positioned Routine Blocks */}
                {blocks.map((block) => (
                    <TouchableOpacity
                        key={block.id}
                        style={[
                            styles.routineBlock,
                            {
                                top: block.top,
                                height: block.height,
                                backgroundColor: block.color ? `${block.color}20` : '#1A2C34',
                                borderColor: block.color || '#374151',
                            }
                        ]}
                        onPress={() => onRoutinePress(block)}
                    >
                        <View style={styles.routineHeader}>
                            <Text style={[styles.routineTitle, { color: block.color || '#E5E7EB' }]} numberOfLines={1}>
                                {block.title}
                            </Text>
                            <Text style={styles.routineTime}>
                                {block.start_time.substring(0, 5)} - {block.end_time.substring(0, 5)}
                            </Text>
                        </View>

                        {/* Display Work Logs for this routine */}
                        {(logs.filter(log => log.routineId === block.id).length > 0) && (
                            <View style={styles.routineLogs}>
                                {logs.filter(log => log.routineId === block.id).map(log => (
                                    <View key={log.id} style={styles.logItem}>
                                        <Text style={styles.logText} numberOfLines={1}>• {log.logText}</Text>
                                        {log.xpAwarded > 0 && (
                                            <Text style={styles.logXp}>+{log.xpAwarded} XP</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </TouchableOpacity>
                ))}

                {/* Current Time Indicator (Animated/Live ideally, static for demo) */}
                <CurrentTimeLine />

            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

function CurrentTimeLine() {
    // Calculates where the red line should be right now
    const now = new Date();
    const currentDecimalHour = now.getHours() + now.getMinutes() / 60;
    const topPosition = currentDecimalHour * HOUR_HEIGHT;

    return (
        <View style={[styles.currentTimeContainer, { top: topPosition }]}>
            <View style={styles.currentTimeDot} />
            <View style={styles.currentTimeLine} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#131F24',
    },
    timelineWrapper: {
        position: 'relative',
        paddingVertical: 10,
    },
    hourSlot: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    timeColumn: {
        width: 60,
        alignItems: 'flex-end',
        paddingRight: 10,
    },
    timeText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: -8, // Center with the line
    },
    contentColumn: {
        flex: 1,
        height: '100%',
    },
    hourDivider: {
        height: 1,
        backgroundColor: '#1A2C34',
    },
    routineBlock: {
        position: 'absolute',
        left: 60, // Match timeColumn width
        right: 16, // Right margin
        borderRadius: 8,
        borderLeftWidth: 4,
        padding: 8,
        zIndex: 10,
    },
    routineTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    routineTime: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    routineHeader: {
        marginBottom: 4,
    },
    routineLogs: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 4,
        marginTop: 2,
        gap: 2,
    },
    logItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logText: {
        flex: 1,
        fontSize: 11,
        color: '#D1D5DB', // gray-300
    },
    logXp: {
        fontSize: 10,
        fontWeight: '700',
        color: '#58CC02',
        marginLeft: 4,
    },
    currentTimeContainer: {
        position: 'absolute',
        left: 54, // Slight offset to overlap the line
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 20,
    },
    currentTimeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
    },
    currentTimeLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#EF4444',
    },
});
