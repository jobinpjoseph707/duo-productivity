import { Button } from '@/components/ui/Button';
import { useCreateRoutine, useDeleteRoutine, useUpdateRoutine } from '@/hooks/useTimeline';
import { Routine } from '@/services/timelineService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface RoutineModalProps {
    visible: boolean;
    onClose: () => void;
    initialHour?: number;
    existingRoutine?: Routine;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRESET_CATEGORIES = [
    { name: "Code", icon: "code" as const, color: "#58CC02" },
    { name: "Study", icon: "school" as const, color: "#CE82FF" },
    { name: "Design", icon: "palette" as const, color: "#FF9600" },
    { name: "Writing", icon: "edit" as const, color: "#3B82F6" },
    { name: "Research", icon: "search" as const, color: "#F59E0B" },
    { name: "Meetings", icon: "groups" as const, color: "#EF4444" },
];

export function RoutineModal({ visible, onClose, initialHour, existingRoutine }: RoutineModalProps) {
    const createMutation = useCreateRoutine();
    const updateMutation = useUpdateRoutine();
    const deleteMutation = useDeleteRoutine();

    const [title, setTitle] = useState('');
    const [color, setColor] = useState('#58CC02');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            if (existingRoutine) {
                setTitle(existingRoutine.title);
                setColor(existingRoutine.color || '#58CC02');
                setStartTime(existingRoutine.start_time.substring(0, 5));
                setEndTime(existingRoutine.end_time.substring(0, 5));
                setSelectedDays(existingRoutine.days_of_week);
            } else {
                const now = new Date();
                const currentHourStr = String(initialHour ?? now.getHours()).padStart(2, '0');
                const currentMinuteStr = String(now.getMinutes()).padStart(2, '0');
                const nextHourStr = String((initialHour ?? now.getHours()) + 1).padStart(2, '0');

                setTitle('');
                setColor('#58CC02');
                setStartTime(initialHour ? `${currentHourStr}:00` : `${currentHourStr}:${currentMinuteStr}`);
                setEndTime(initialHour ? `${nextHourStr}:00` : `${nextHourStr}:${currentMinuteStr}`);
                setSelectedDays([1, 2, 3, 4, 5]);
            }
        }
    }, [visible, existingRoutine, initialHour]);

    const selectPreset = (presetName: string, presetColor: string) => {
        setTitle(presetName);
        setColor(presetColor);
    };

    const toggleDay = (dayIndex: number) => {
        if (selectedDays.includes(dayIndex)) {
            setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
        } else {
            setSelectedDays([...selectedDays, dayIndex].sort());
        }
    };

    const handleSave = () => {
        // Basic validation; format must be HH:MM
        if (!title.trim() || !startTime || !endTime || selectedDays.length === 0) {
            Alert.alert("Invalid Input", "Please fill out all required fields and select at least one day.");
            return;
        }

        const payload = {
            title: title.trim(),
            color: color,
            start_time: startTime.includes(':') && startTime.length === 5 ? `${startTime}:00` : startTime,
            end_time: endTime.includes(':') && endTime.length === 5 ? `${endTime}:00` : endTime,
            days_of_week: selectedDays,
        };

        if (existingRoutine) {
            updateMutation.mutate(
                { id: existingRoutine.id, routine: payload },
                { onSuccess: onClose }
            );
        } else {
            createMutation.mutate(payload, { onSuccess: onClose });
        }
    };

    const handleDelete = () => {
        if (!existingRoutine) return;
        Alert.alert(
            "Delete Routine",
            "Are you sure you want to delete this scheduled routine?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        deleteMutation.mutate(existingRoutine.id, { onSuccess: onClose });
                    }
                }
            ]
        );
    };

    const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{existingRoutine ? 'Edit Routine' : 'New Routine'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        {/* Preset Categories */}
                        <View style={styles.presetsSection}>
                            <Text style={styles.label}>Quick Select</Text>
                            <View style={styles.presetsGrid}>
                                {PRESET_CATEGORIES.map((preset) => (
                                    <TouchableOpacity
                                        key={preset.name}
                                        style={[
                                            styles.presetChip,
                                            title === preset.name && {
                                                borderColor: preset.color,
                                                backgroundColor: `${preset.color}15`,
                                            },
                                        ]}
                                        onPress={() => selectPreset(preset.name, preset.color)}
                                    >
                                        <MaterialIcons
                                            name={preset.icon}
                                            size={18}
                                            color={
                                                title === preset.name ? preset.color : "#6B7280"
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.presetText,
                                                title === preset.name && {
                                                    color: preset.color,
                                                },
                                            ]}
                                        >
                                            {preset.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Title */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Routine Title *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Deep Work, Morning Workout"
                                placeholderTextColor="#6B7280"
                                value={title}
                                onChangeText={setTitle}
                                editable={!isPending}
                            />
                        </View>

                        {/* Times */}
                        <View style={styles.rowWrapper}>
                            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Start Time (HH:MM)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="09:00"
                                    placeholderTextColor="#6B7280"
                                    value={startTime}
                                    onChangeText={setStartTime}
                                    editable={!isPending}
                                />
                            </View>
                            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>End Time (HH:MM)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="10:00"
                                    placeholderTextColor="#6B7280"
                                    value={endTime}
                                    onChangeText={setEndTime}
                                    editable={!isPending}
                                />
                            </View>
                        </View>
                        <Text style={styles.hintText}>Use 24-hour format, e.g., 14:30 for 2:30 PM.</Text>

                        {/* Days of Week */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Repeat On</Text>
                            <View style={styles.daysRow}>
                                {DAYS.map((dayName, index) => {
                                    const isSelected = selectedDays.includes(index);
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.dayCircle, isSelected && { backgroundColor: color, borderColor: color }]}
                                            onPress={() => toggleDay(index)}
                                            disabled={isPending}
                                        >
                                            <Text style={[styles.dayText, isSelected && styles.dayTextActive]}>
                                                {dayName[0]}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                    </ScrollView>

                    <View style={styles.footer}>
                        {existingRoutine && (
                            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={isPending}>
                                <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
                            </TouchableOpacity>
                        )}
                        <View style={styles.saveBtnWrapper}>
                            <Button
                                title={isPending ? "Saving..." : "Save Routine"}
                                onPress={handleSave}
                                disabled={isPending || !title.trim() || selectedDays.length === 0}
                                loading={isPending}
                                size="large"
                            />
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContainer: {
        backgroundColor: '#131F24',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        paddingBottom: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1A2C34',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#58CC02',
    },
    scrollContent: {
        paddingTop: 16,
    },
    presetsSection: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    presetsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    presetChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#1A2C34",
        borderWidth: 1,
        borderColor: "#374151",
    },
    presetText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#6B7280",
    },
    fieldGroup: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    rowWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E5E7EB',
        marginBottom: 8,
    },
    hintText: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
        marginBottom: 20,
        marginTop: -16,
        paddingHorizontal: 24,
    },
    input: {
        backgroundColor: '#1A2C34',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: '#FFFFFF',
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1A2C34',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#374151',
    },
    dayText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    dayTextActive: {
        color: '#000000',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingTop: 12,
        alignItems: 'center',
    },
    deleteBtn: {
        padding: 12,
        marginRight: 12,
        backgroundColor: '#1A2C34',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#374151',
    },
    saveBtnWrapper: {
        flex: 1,
    }
});
