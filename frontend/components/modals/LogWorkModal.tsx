import { Button } from "@/components/ui/Button";
import { useDashboard } from "@/hooks/useDashboard";
import { useProjects, useProjectTasks } from "@/hooks/useProjects";
import { useTheme } from "@/hooks/useTheme";
import { productivityService } from "@/services/productivityService";
import { useAppStore } from "@/stores/appStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export function LogWorkModal() {
    const theme = useTheme();
    const c = theme.colors;
    const isOpen = useAppStore((state) => state.isLogWorkModalOpen);
    const setOpen = useAppStore((state) => state.setLogWorkModalOpen);
    const showNotification = useAppStore((state) => state.showNotification);
    const activeProjectId = useAppStore((state) => state.activeProjectId);

    const { data: projects } = useProjects();
    const { data: dashboard } = useDashboard();
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const { data: tasks } = useProjectTasks(selectedProjectId);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
    const [logText, setLogText] = useState("");
    const [timeSpent, setTimeSpent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const queryClient = useQueryClient();
    const activeTimers = dashboard?.timeAllocations || [];

    useEffect(() => {
        if (isOpen && activeProjectId) {
            setSelectedProjectId(activeProjectId);
        }
    }, [isOpen, activeProjectId]);

    useEffect(() => {
        if (isOpen && activeTimers.length === 1) {
            setSelectedRoutineId(activeTimers[0].id);
        }
    }, [isOpen, activeTimers.length]);

    const handleClose = () => {
        setOpen(false);
        setLogText("");
        setTimeSpent("");
        setSelectedProjectId(null);
        setSelectedTaskId(null);
        setSelectedRoutineId(null);
    };

    const handleSubmit = async () => {
        if (!logText.trim()) return;
        setIsSubmitting(true);
        try {
            await productivityService.logWork({
                projectId: selectedProjectId || undefined,
                taskId: selectedTaskId || undefined,
                logText: logText.trim(),
                timeSpentMinutes: timeSpent ? parseInt(timeSpent) : undefined,
                routineId: selectedRoutineId || undefined,
            });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["work-logs"] });
            queryClient.invalidateQueries({ queryKey: ["user-profile"] });
            showNotification("Work logged successfully! 🎉", "success");
            handleClose();
        } catch (error) {
            showNotification("Failed to log work. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={handleClose}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.overlay, { backgroundColor: c.overlay }]}>
                <View style={[styles.modalContainer, { backgroundColor: c.dark }]}>
                    <View style={[styles.header, { borderBottomColor: c.border }]}>
                        <Text style={[styles.title, { color: c.primary }]}>Log Work</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <MaterialIcons name="close" size={24} color={c.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {activeTimers.length > 0 && (
                            <View style={styles.fieldGroup}>
                                <Text style={[styles.label, { color: c.text }]}>
                                    <MaterialIcons name="schedule" size={14} color={c.primary} />{" "}
                                    Log time against
                                </Text>
                                <View style={styles.timerChips}>
                                    {activeTimers.map((timer) => {
                                        const isSelected = selectedRoutineId === timer.id;
                                        const pct = timer.allocatedMinutes > 0 ? Math.round((timer.spentMinutes / timer.allocatedMinutes) * 100) : 0;
                                        return (
                                            <TouchableOpacity
                                                key={timer.id}
                                                style={[
                                                    styles.timerChip,
                                                    { backgroundColor: c.surface, borderColor: c.borderLight },
                                                    isSelected && { borderColor: timer.color, backgroundColor: `${timer.color}15` },
                                                ]}
                                                onPress={() => setSelectedRoutineId(isSelected ? null : timer.id)}
                                            >
                                                <Text style={[styles.timerChipName, { color: c.textSecondary }, isSelected && { color: timer.color }]}>
                                                    {timer.categoryName}
                                                </Text>
                                                <Text style={[styles.timerChipProgress, { color: c.textMuted }, isSelected && { color: timer.color }]}>
                                                    {timer.spentMinutes}/{timer.allocatedMinutes} min ({pct}%)
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                {selectedRoutineId && (
                                    <Text style={[styles.timerHint, { color: c.primary }]}>
                                        ⏱ Time will be added to the selected routine
                                    </Text>
                                )}
                            </View>
                        )}

                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: c.text }]}>Project (optional)</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                <TouchableOpacity
                                    style={[styles.chip, { backgroundColor: c.surface, borderColor: c.borderLight }, !selectedProjectId && { backgroundColor: c.primaryMuted, borderColor: c.primary }]}
                                    onPress={() => { setSelectedProjectId(null); setSelectedTaskId(null); }}
                                >
                                    <Text style={[styles.chipText, { color: c.textSecondary }, !selectedProjectId && { color: c.primary }]}>None</Text>
                                </TouchableOpacity>
                                {projects?.map((project) => (
                                    <TouchableOpacity
                                        key={project.id}
                                        style={[styles.chip, { backgroundColor: c.surface, borderColor: c.borderLight }, selectedProjectId === project.id && { backgroundColor: c.primaryMuted, borderColor: c.primary }]}
                                        onPress={() => { setSelectedProjectId(project.id); setSelectedTaskId(null); }}
                                    >
                                        <Text style={[styles.chipText, { color: c.textSecondary }, selectedProjectId === project.id && { color: c.primary }]}>{project.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {selectedProjectId && tasks && tasks.length > 0 && (
                            <View style={styles.fieldGroup}>
                                <Text style={[styles.label, { color: c.text }]}>Task (optional)</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                    <TouchableOpacity
                                        style={[styles.chip, { backgroundColor: c.surface, borderColor: c.borderLight }, !selectedTaskId && { backgroundColor: c.primaryMuted, borderColor: c.primary }]}
                                        onPress={() => setSelectedTaskId(null)}
                                    >
                                        <Text style={[styles.chipText, { color: c.textSecondary }, !selectedTaskId && { color: c.primary }]}>None</Text>
                                    </TouchableOpacity>
                                    {tasks.filter((t) => t.status !== "completed").map((task) => (
                                        <TouchableOpacity
                                            key={task.id}
                                            style={[styles.chip, { backgroundColor: c.surface, borderColor: c.borderLight }, selectedTaskId === task.id && { backgroundColor: c.primaryMuted, borderColor: c.primary }]}
                                            onPress={() => setSelectedTaskId(task.id)}
                                        >
                                            <Text style={[styles.chipText, { color: c.textSecondary }, selectedTaskId === task.id && { color: c.primary }]}>{task.title}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: c.text }]}>What did you work on? *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]}
                                multiline
                                numberOfLines={4}
                                placeholder="Describe what you accomplished..."
                                placeholderTextColor={c.textMuted}
                                value={logText}
                                onChangeText={setLogText}
                                editable={!isSubmitting}
                            />
                        </View>

                        <View style={styles.fieldGroup}>
                            <Text style={[styles.label, { color: c.text }]}>Time spent (minutes)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]}
                                keyboardType="numeric"
                                placeholder="e.g. 30"
                                placeholderTextColor={c.textMuted}
                                value={timeSpent}
                                onChangeText={setTimeSpent}
                                editable={!isSubmitting}
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <Button
                            title={isSubmitting ? "Logging..." : "Log Work ✨"}
                            onPress={handleSubmit}
                            disabled={!logText.trim() || isSubmitting}
                            loading={isSubmitting}
                            size="large"
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end" },
    modalContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%", paddingBottom: 32 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1 },
    title: { fontSize: 20, fontWeight: "700" },
    scrollContent: { paddingHorizontal: 24, paddingTop: 16 },
    fieldGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
    timerChips: { gap: 8 },
    timerChip: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
    timerChipName: { fontSize: 14, fontWeight: "600" },
    timerChipProgress: { fontSize: 12 },
    timerHint: { fontSize: 12, marginTop: 6, fontStyle: "italic" },
    chipScroll: { flexDirection: "row" },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
    chipText: { fontSize: 13, fontWeight: "500" },
    input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
    textArea: { minHeight: 100, textAlignVertical: "top" },
    footer: { paddingHorizontal: 24, paddingTop: 12 },
});
