import { Button } from "@/components/ui/Button";
import { useProjects, useProjectTasks } from "@/hooks/useProjects";
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
    const isOpen = useAppStore((state) => state.isLogWorkModalOpen);
    const setOpen = useAppStore((state) => state.setLogWorkModalOpen);
    const showNotification = useAppStore((state) => state.showNotification);
    const activeProjectId = useAppStore((state) => state.activeProjectId);

    const { data: projects } = useProjects();
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
        null
    );
    const { data: tasks } = useProjectTasks(selectedProjectId);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [logText, setLogText] = useState("");
    const [timeSpent, setTimeSpent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const queryClient = useQueryClient();

    // Set default project on open
    useEffect(() => {
        if (isOpen && activeProjectId) {
            setSelectedProjectId(activeProjectId);
        }
    }, [isOpen, activeProjectId]);

    const handleClose = () => {
        setOpen(false);
        setLogText("");
        setTimeSpent("");
        setSelectedProjectId(null);
        setSelectedTaskId(null);
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
            });

            // Invalidate related queries
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
        <Modal
            visible={isOpen}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.overlay}
            >
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Log Work</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <MaterialIcons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Project Selector */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Project (optional)</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.chipScroll}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.chip,
                                        !selectedProjectId && styles.chipActive,
                                    ]}
                                    onPress={() => {
                                        setSelectedProjectId(null);
                                        setSelectedTaskId(null);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            !selectedProjectId && styles.chipTextActive,
                                        ]}
                                    >
                                        None
                                    </Text>
                                </TouchableOpacity>
                                {projects?.map((project) => (
                                    <TouchableOpacity
                                        key={project.id}
                                        style={[
                                            styles.chip,
                                            selectedProjectId === project.id && styles.chipActive,
                                        ]}
                                        onPress={() => {
                                            setSelectedProjectId(project.id);
                                            setSelectedTaskId(null);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                selectedProjectId === project.id &&
                                                styles.chipTextActive,
                                            ]}
                                        >
                                            {project.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Task Selector */}
                        {selectedProjectId && tasks && tasks.length > 0 && (
                            <View style={styles.fieldGroup}>
                                <Text style={styles.label}>Task (optional)</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.chipScroll}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.chip,
                                            !selectedTaskId && styles.chipActive,
                                        ]}
                                        onPress={() => setSelectedTaskId(null)}
                                    >
                                        <Text
                                            style={[
                                                styles.chipText,
                                                !selectedTaskId && styles.chipTextActive,
                                            ]}
                                        >
                                            None
                                        </Text>
                                    </TouchableOpacity>
                                    {tasks
                                        .filter((t) => t.status !== "completed")
                                        .map((task) => (
                                            <TouchableOpacity
                                                key={task.id}
                                                style={[
                                                    styles.chip,
                                                    selectedTaskId === task.id && styles.chipActive,
                                                ]}
                                                onPress={() => setSelectedTaskId(task.id)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.chipText,
                                                        selectedTaskId === task.id &&
                                                        styles.chipTextActive,
                                                    ]}
                                                >
                                                    {task.title}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Log Text */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>What did you work on? *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                multiline
                                numberOfLines={4}
                                placeholder="Describe what you accomplished..."
                                placeholderTextColor="#6B7280"
                                value={logText}
                                onChangeText={setLogText}
                                editable={!isSubmitting}
                            />
                        </View>

                        {/* Time Spent */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.label}>Time spent (minutes)</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder="e.g. 30"
                                placeholderTextColor="#6B7280"
                                value={timeSpent}
                                onChangeText={setTimeSpent}
                                editable={!isSubmitting}
                            />
                        </View>
                    </ScrollView>

                    {/* Submit Button */}
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
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    modalContainer: {
        backgroundColor: "#131F24",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "85%",
        paddingBottom: 32,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#1A2C34",
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#58CC02",
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    fieldGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#E5E7EB",
        marginBottom: 8,
    },
    chipScroll: {
        flexDirection: "row",
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#1A2C34",
        marginRight: 8,
        borderWidth: 1,
        borderColor: "#374151",
    },
    chipActive: {
        backgroundColor: "#0F4C2F",
        borderColor: "#58CC02",
    },
    chipText: {
        fontSize: 13,
        color: "#9CA3AF",
        fontWeight: "500",
    },
    chipTextActive: {
        color: "#58CC02",
    },
    input: {
        backgroundColor: "#1A2C34",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: "#FFFFFF",
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: "top",
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 12,
    },
});
