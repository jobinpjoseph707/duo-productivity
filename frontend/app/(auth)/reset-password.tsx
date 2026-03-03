import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { clearPasswordReset } = useAuth();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleUpdatePassword = async () => {
        setError("");

        if (!password.trim()) {
            setError("Please enter a new password.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        try {
            await authService.updatePassword(password);
            setSuccess(true);
        } catch (err: any) {
            console.error("ResetPassword: Error updating password:", err);
            setError(err.message || "Failed to update password. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.iconText}>✅</Text>
                        <Text style={styles.title}>Password Updated!</Text>
                        <Text style={styles.subtitle}>
                            Your password has been changed successfully.{"\n"}
                            You can now sign in with your new password.
                        </Text>
                    </View>

                    <Button
                        title="Sign In"
                        onPress={() => {
                            clearPasswordReset();
                            router.replace("/(auth)/login");
                        }}
                        variant="primary"
                    />
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.iconText}>🔐</Text>
                    <Text style={styles.title}>Set New Password</Text>
                    <Text style={styles.subtitle}>
                        Enter your new password below.
                    </Text>
                </View>

                {error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="At least 6 characters"
                            placeholderTextColor="#6B7280"
                            secureTextEntry
                            autoFocus
                            editable={!isSubmitting}
                            value={password}
                            onChangeText={setPassword}
                            returnKeyType="next"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Re-enter your password"
                            placeholderTextColor="#6B7280"
                            secureTextEntry
                            editable={!isSubmitting}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            onSubmitEditing={handleUpdatePassword}
                            returnKeyType="done"
                        />
                    </View>

                    <Button
                        title={isSubmitting ? "Updating..." : "Update Password"}
                        onPress={handleUpdatePassword}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        variant="primary"
                    />
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => {
                        clearPasswordReset();
                        router.replace("/(auth)/login");
                    }}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#131F24",
        justifyContent: "center",
        paddingVertical: 20,
    },
    content: {
        paddingHorizontal: 24,
    },
    header: {
        marginBottom: 32,
        alignItems: "center",
    },
    iconText: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: "700",
        color: "#58CC02",
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: "#9CA3AF",
        textAlign: "center",
        lineHeight: 22,
    },
    errorBox: {
        backgroundColor: "#7F1D1D",
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: "#EF4444",
    },
    errorText: {
        color: "#FCA5A5",
        fontSize: 14,
    },
    form: {
        gap: 20,
        marginBottom: 32,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#E5E7EB",
    },
    input: {
        backgroundColor: "#1A2C34",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: "#FFFFFF",
    },
    footer: {
        alignItems: "center",
        marginTop: 8,
    },
    cancelText: {
        color: "#6B7280",
        fontSize: 14,
    },
});
