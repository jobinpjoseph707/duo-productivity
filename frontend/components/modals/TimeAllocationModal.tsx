import { Button } from "@/components/ui/Button";
import { productivityService } from "@/services/productivityService";
import { useAppStore } from "@/stores/appStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const PRESET_CATEGORIES = [
    { name: "Code", icon: "code" as const, color: "#58CC02" },
    { name: "Study", icon: "school" as const, color: "#CE82FF" },
    { name: "Design", icon: "palette" as const, color: "#FF9600" },
    { name: "Writing", icon: "edit" as const, color: "#3B82F6" },
    { name: "Research", icon: "search" as const, color: "#F59E0B" },
    { name: "Meetings", icon: "groups" as const, color: "#EF4444" },
];

export function TimeAllocationModal() {
    const isOpen = useAppStore((state) => state.isTimeAllocationModalOpen);
    const setOpen = useAppStore((state) => state.setTimeAllocationModalOpen);
    const showNotification = useAppStore((state) => state.showNotification);

    const [categoryName, setCategoryName] = useState("");
    const [allocatedMinutes, setAllocatedMinutes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const queryClient = useQueryClient();

    const handleClose = () => {
        setOpen(false);
        setCategoryName("");
        setAllocatedMinutes("");
    };

    const selectPreset = (name: string) => {
        setCategoryName(name);
    };

    const handleSubmit = async () => {
        if (!categoryName.trim() || !allocatedMinutes.trim()) return;

        setIsSubmitting(true);
        try {
            await productivityService.updateTimeAllocation(
                categoryName.trim(),
                parseInt(allocatedMinutes)
            );

            queryClient.invalidateQueries({ queryKey: ["dashboard"] });

            showNotification("Time allocation saved! ⏰", "success");
            handleClose();
        } catch (error) {
            showNotification("Failed to save allocation. Try again.", "error");
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
                        <Text style={styles.title}>Set Time Allocation</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <MaterialIcons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {/* Preset Categories */}
                    <View style={styles.presetsSection}>
                        <Text style={styles.label}>Quick Select</Text>
                        <View style={styles.presetsGrid}>
                            {PRESET_CATEGORIES.map((preset) => (
                                <TouchableOpacity
                                    key={preset.name}
                                    style={[
                                        styles.presetChip,
                                        categoryName === preset.name && {
                                            borderColor: preset.color,
                                            backgroundColor: `${preset.color}15`,
                                        },
                                    ]}
                                    onPress={() => selectPreset(preset.name)}
                                >
                                    <MaterialIcons
                                        name={preset.icon}
                                        size={18}
                                        color={
                                            categoryName === preset.name ? preset.color : "#6B7280"
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.presetText,
                                            categoryName === preset.name && {
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

                    {/* Custom Category Name */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Category Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Or type a custom category..."
                            placeholderTextColor="#6B7280"
                            value={categoryName}
                            onChangeText={setCategoryName}
                            editable={!isSubmitting}
                        />
                    </View>

                    {/* Minutes Input */}
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Allocated Minutes *</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="e.g. 120"
                            placeholderTextColor="#6B7280"
                            value={allocatedMinutes}
                            onChangeText={setAllocatedMinutes}
                            editable={!isSubmitting}
                        />

                        {/* Quick Time Buttons */}
                        <View style={styles.quickTimes}>
                            {["30", "60", "90", "120"].map((mins) => (
                                <TouchableOpacity
                                    key={mins}
                                    style={[
                                        styles.quickTimeChip,
                                        allocatedMinutes === mins && styles.quickTimeActive,
                                    ]}
                                    onPress={() => setAllocatedMinutes(mins)}
                                >
                                    <Text
                                        style={[
                                            styles.quickTimeText,
                                            allocatedMinutes === mins && styles.quickTimeTextActive,
                                        ]}
                                    >
                                        {parseInt(mins) >= 60
                                            ? `${parseInt(mins) / 60}h`
                                            : `${mins}m`}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Submit Button */}
                    <View style={styles.footer}>
                        <Button
                            title={isSubmitting ? "Saving..." : "Set Allocation 🎯"}
                            onPress={handleSubmit}
                            disabled={
                                !categoryName.trim() ||
                                !allocatedMinutes.trim() ||
                                isSubmitting
                            }
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
    presetsSection: {
        paddingHorizontal: 24,
        paddingTop: 20,
        marginBottom: 8,
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
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#E5E7EB",
        marginBottom: 8,
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
    quickTimes: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
    },
    quickTimeChip: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#1A2C34",
        borderWidth: 1,
        borderColor: "#374151",
        alignItems: "center",
    },
    quickTimeActive: {
        borderColor: "#CE82FF",
        backgroundColor: "#CE82FF15",
    },
    quickTimeText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6B7280",
    },
    quickTimeTextActive: {
        color: "#CE82FF",
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 4,
    },
});
