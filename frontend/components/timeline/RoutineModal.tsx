import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';
import { useCreateRoutine, useDeleteRoutine, useUpdateRoutine } from '@/hooks/useTimeline';
import { useNotifications } from '@/hooks/useNotificationsApi';
import { useAppStore } from '@/stores/appStore';
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

export function RoutineModal({ visible, onClose, initialHour, existingRoutine }: RoutineModalProps) {
    const theme = useTheme();
    const c = theme.colors;
    const createMutation = useCreateRoutine();
    const updateMutation = useUpdateRoutine();
    const deleteMutation = useDeleteRoutine();
    
    // Notifications support for AI approved routines
    const { markAsRead } = useNotifications();
    const prefillRoutineData = useAppStore(s => s.prefillRoutineData);
    const setPrefillRoutineData = useAppStore(s => s.setPrefillRoutineData);

    const PRESET_CATEGORIES = [
        { name: "Code", icon: "code" as const, color: c.primary },
        { name: "Study", icon: "school" as const, color: c.secondary },
        { name: "Design", icon: "palette" as const, color: c.accent },
        { name: "Writing", icon: "edit" as const, color: "#3B82F6" },
        { name: "Research", icon: "search" as const, color: c.warning },
        { name: "Meetings", icon: "groups" as const, color: c.error },
    ];

    const [title, setTitle] = useState('');
    const [color, setColor] = useState(c.primary);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);

    useEffect(() => {
        if (visible) {
            if (existingRoutine) {
                setTitle(existingRoutine.title);
                setColor(existingRoutine.color || c.primary);
                setStartTime(existingRoutine.start_time.substring(0, 5));
                setEndTime(existingRoutine.end_time.substring(0, 5));
                setSelectedDays(existingRoutine.days_of_week);
            } else if (prefillRoutineData) {
                setTitle(prefillRoutineData.title || '');
                setColor(prefillRoutineData.color || c.primary);
                setStartTime(prefillRoutineData.start_time?.substring(0, 5) || '09:00');
                setEndTime(prefillRoutineData.end_time?.substring(0, 5) || '10:00');
                setSelectedDays(prefillRoutineData.days_of_week || [1, 2, 3, 4, 5]);
            } else {
                const now = new Date();
                const currentHourStr = String(initialHour ?? now.getHours()).padStart(2, '0');
                const currentMinuteStr = String(now.getMinutes()).padStart(2, '0');
                const nextHourStr = String((initialHour ?? now.getHours()) + 1).padStart(2, '0');

                setTitle('');
                setColor(c.primary);
                setStartTime(initialHour ? `${currentHourStr}:00` : `${currentHourStr}:${currentMinuteStr}`);
                setEndTime(initialHour ? `${nextHourStr}:00` : `${nextHourStr}:${currentMinuteStr}`);
                setSelectedDays([1, 2, 3, 4, 5]);
            }
        }
    }, [visible, existingRoutine, initialHour, c.primary, prefillRoutineData]);

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

    const handleCloseWrapper = () => {
        setPrefillRoutineData(null);
        onClose();
    };

    const handleSave = () => {
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

        const afterSave = () => {
            if (prefillRoutineData?.notificationId) {
                markAsRead.mutate(prefillRoutineData.notificationId);
            }
            handleCloseWrapper();
        };

        if (existingRoutine) {
            updateMutation.mutate({ id: existingRoutine.id, routine: payload }, { onSuccess: afterSave });
        } else {
            createMutation.mutate(payload, { onSuccess: afterSave });
        }
    };

    const handleDelete = () => {
        if (!existingRoutine) return;
        Alert.alert("Delete Routine", "Are you sure you want to delete this scheduled routine?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(existingRoutine.id, { onSuccess: handleCloseWrapper }) }
        ]);
    };

    const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleCloseWrapper}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.overlay, { backgroundColor: c.overlay }]}>
                <View style={[styles.modalContainer, { backgroundColor: c.dark }]}>
                    <View style={[styles.header, { borderBottomColor: c.border }]}>
                        <Text style={[styles.title, { color: c.primary }]}>{existingRoutine ? 'Edit Routine' : 'New Routine'}</Text>
                        <TouchableOpacity onPress={handleCloseWrapper}>
                            <MaterialIcons name="close" size={24} color={c.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Preset Categories */}
                        <View style={styles.presetsSection}>
                            <Text style={[styles.label, { color: c.text }]}>Quick Select</Text>
                            <View style={styles.presetsGrid}>
                                {PRESET_CATEGORIES.map((preset) => (
                                    <TouchableOpacity
                                        key={preset.name}
                                        style={[
                                            styles.presetChip,
                                            { backgroundColor: c.surface, borderColor: c.borderLight },
                                            title === preset.name && { borderColor: preset.color, backgroundColor: `${preset.color}15` },
                                        ]}
                                        onPress={() => selectPreset(preset.name, preset.color)}
                                    >
                                        <MaterialIcons name={preset.icon} size={18} color={title === preset.name ? preset.color : c.textMuted} />
                                        <Text style={[styles.presetText, { color: c.textMuted }, title === preset.name && { color: preset.color }]}>
                                            {preset.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Title */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: c.text }]}>Routine Title *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]}
                                placeholder="e.g. Deep Work, Morning Workout"
                                placeholderTextColor={c.textMuted}
                                value={title}
                                onChangeText={setTitle}
                                editable={!isPending}
                            />
                        </View>

                        {/* Times */}
                        <View style={styles.rowWrapper}>
                            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={[styles.label, { color: c.text }]}>Start Time (HH:MM)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]}
                                    placeholder="09:00"
                                    placeholderTextColor={c.textMuted}
                                    value={startTime}
                                    onChangeText={setStartTime}
                                    editable={!isPending}
                                />
                            </View>
                            <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={[styles.label, { color: c.text }]}>End Time (HH:MM)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]}
                                    placeholder="10:00"
                                    placeholderTextColor={c.textMuted}
                                    value={endTime}
                                    onChangeText={setEndTime}
                                    editable={!isPending}
                                />
                            </View>
                        </View>
                        <Text style={[styles.hintText, { color: c.textMuted }]}>Use 24-hour format, e.g., 14:30 for 2:30 PM.</Text>

                        {/* Days of Week */}
                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: c.text }]}>Repeat On</Text>
                            <View style={styles.daysRow}>
                                {DAYS.map((dayName, index) => {
                                    const isSelected = selectedDays.includes(index);
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.dayCircle,
                                                { backgroundColor: c.surface, borderColor: c.borderLight },
                                                isSelected && { backgroundColor: color, borderColor: color },
                                            ]}
                                            onPress={() => toggleDay(index)}
                                            disabled={isPending}
                                        >
                                            <Text style={[styles.dayText, { color: c.textSecondary }, isSelected && { color: '#000' }]}>
                                                {dayName[0]}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>

                    <View style={[styles.footer, { borderTopColor: c.border }]}>
                        {existingRoutine && (
                            <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: c.surface, borderColor: c.borderLight }]} onPress={handleDelete} disabled={isPending}>
                                <MaterialIcons name="delete-outline" size={24} color={c.error} />
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
    overlay: { flex: 1, justifyContent: 'flex-end' },
    modalContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%', paddingBottom: 32 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1 },
    title: { fontSize: 20, fontWeight: '700' },
    scrollContent: { paddingTop: 16 },
    presetsSection: { paddingHorizontal: 24, marginBottom: 20 },
    presetsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    presetChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    presetText: { fontSize: 13, fontWeight: "500" },
    fieldGroup: { paddingHorizontal: 24, marginBottom: 20 },
    rowWrapper: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 4 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    hintText: { fontSize: 12, fontStyle: 'italic', marginBottom: 20, marginTop: -16, paddingHorizontal: 24 },
    input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
    daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    dayText: { fontSize: 14, fontWeight: '600' },
    footer: { flexDirection: 'row', paddingHorizontal: 24, paddingTop: 12, alignItems: 'center', borderTopWidth: 1 },
    deleteBtn: { padding: 12, marginRight: 12, borderRadius: 12, borderWidth: 1 },
    saveBtnWrapper: { flex: 1 },
});
