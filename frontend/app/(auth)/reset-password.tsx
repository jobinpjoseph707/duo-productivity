import { Button } from "@/components/ui/Button";
import { getAuthBackground } from "@/constants/authImages";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { authService } from "@/services/authService";
import { useAppStore } from "@/stores/appStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ImageBackground,
    Platform,
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
    const theme = useTheme();
    const c = theme.colors;
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const themeName = useAppStore((state) => state.themeName);

    const handleUpdatePassword = async () => {
        setError("");
        if (!password.trim()) { setError("Please enter a new password."); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
        if (password !== confirmPassword) { setError("Passwords do not match."); return; }

        setIsSubmitting(true);
        try {
            await authService.updatePassword(password);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to update password. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <ImageBackground source={getAuthBackground(themeName)} style={styles.bg} imageStyle={styles.imageStyle} resizeMode="cover">
                <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        <View style={styles.formCard}>
                            <View style={styles.header}>
                                <Text style={styles.iconText}>✅</Text>
                                <Text style={[styles.title, { color: c.success }]}>Password Updated!</Text>
                                <Text style={[styles.subtitle, { color: c.textSecondary }]}>
                                    Your password has been changed successfully.{"\n"}
                                    You can now sign in with your new password.
                                </Text>
                            </View>
                            <Button title="Sign In" onPress={() => { clearPasswordReset(); router.replace("/(auth)/login"); }} variant="primary" />
                        </View>
                    </ScrollView>
                </View>
            </ImageBackground>
        );
    }

    return (
        <ImageBackground source={getAuthBackground(themeName)} style={styles.bg} imageStyle={styles.imageStyle} resizeMode="cover">
            <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                    <View style={styles.formCard}>
                        <View style={styles.header}>
                            <Text style={styles.iconText}>🔐</Text>
                            <Text style={[styles.title, { color: c.primary }]}>Set New Password</Text>
                            <Text style={[styles.subtitle, { color: c.textSecondary }]}>Enter your new password below.</Text>
                        </View>

                        {error ? (
                            <View style={[styles.errorBox, { backgroundColor: c.errorBg, borderLeftColor: c.error }]}>
                                <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: c.text }]}>New Password</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]}
                                    placeholder="At least 6 characters"
                                    placeholderTextColor={c.textMuted}
                                    secureTextEntry
                                    autoFocus
                                    editable={!isSubmitting}
                                    value={password}
                                    onChangeText={setPassword}
                                    returnKeyType="next"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: c.text }]}>Confirm Password</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]}
                                    placeholder="Re-enter your password"
                                    placeholderTextColor={c.textMuted}
                                    secureTextEntry
                                    editable={!isSubmitting}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    onSubmitEditing={handleUpdatePassword}
                                    returnKeyType="done"
                                />
                            </View>
                            <Button title={isSubmitting ? "Updating..." : "Update Password"} onPress={handleUpdatePassword} disabled={isSubmitting} loading={isSubmitting} variant="primary" />
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity onPress={() => { clearPasswordReset(); router.replace("/(auth)/login"); }}>
                                <Text style={[styles.cancelText, { color: c.textMuted }]}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1, width: '100%', height: '100%' },
    imageStyle: { width: '100%', height: '100%' },
    overlay: { flex: 1, width: '100%', height: '100%' },
    scrollContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40, paddingHorizontal: 16 },
    formCard: {
        width: '100%',
        maxWidth: 420,
        paddingHorizontal: 24,
        paddingVertical: 32,
        ...Platform.select({ web: { backdropFilter: 'blur(10px)' } }),
    },
    header: { marginBottom: 32, alignItems: "center" },
    iconText: { fontSize: 48, marginBottom: 16 },
    title: { fontSize: 32, fontWeight: "700", marginBottom: 12 },
    subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
    errorBox: { borderRadius: 8, padding: 12, marginBottom: 24, borderLeftWidth: 4 },
    errorText: { fontSize: 14 },
    form: { gap: 20, marginBottom: 32 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: "600" },
    input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
    footer: { alignItems: "center", marginTop: 8 },
    cancelText: { fontSize: 14 },
});
