import { Button } from "@/components/ui/Button";
import { getAuthBackground } from "@/constants/authImages";
import { useTheme } from "@/hooks/useTheme";
import { authService } from "@/services/authService";
import { useAppStore } from "@/stores/appStore";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
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

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const theme = useTheme();
    const c = theme.colors;
    const { email: prefillEmail } = useLocalSearchParams<{ email?: string }>();
    const [email, setEmail] = useState(prefillEmail || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);
    const themeName = useAppStore((state) => state.themeName);

    const handleReset = async () => {
        setError("");
        if (!email.trim()) { setError("Please enter your email address."); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) { setError("Please enter a valid email address."); return; }

        setIsSubmitting(true);
        try {
            await authService.resetPassword(email.trim());
            setSent(true);
        } catch (err: any) {
            setError(err.message || "Failed to send reset email. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (sent) {
        return (
            <ImageBackground source={getAuthBackground(themeName)} style={styles.bg} imageStyle={styles.imageStyle} resizeMode="cover">
                <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        <View style={styles.formCard}>
                            <View style={styles.header}>
                                <Text style={styles.iconText}>📧</Text>
                                <Text style={[styles.title, { color: c.primary }]}>Check Your Email</Text>
                                <Text style={[styles.subtitle, { color: c.textSecondary }]}>
                                    We sent a password reset link to{"\n"}
                                    <Text style={{ color: c.secondary, fontWeight: "600" }}>{email}</Text>
                                    {"\n\n"}Open the link in your email to set a new password.
                                </Text>
                            </View>
                            <View style={[styles.tipBox, { backgroundColor: c.surface, borderLeftColor: c.primary }]}>
                                <Text style={[styles.tipText, { color: c.text }]}>💡 Don't see it? Check your spam folder.</Text>
                            </View>
                            <Button title="Back to Sign In" onPress={() => router.replace("/(auth)/login")} variant="primary" />
                            <TouchableOpacity style={styles.resendButton} onPress={() => { setSent(false); setError(""); }}>
                                <Text style={[styles.resendText, { color: c.secondary }]}>Didn't receive it? Try again</Text>
                            </TouchableOpacity>
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
                            <Text style={styles.iconText}>🔒</Text>
                            <Text style={[styles.title, { color: c.primary }]}>Forgot Password?</Text>
                            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
                                Enter your email and we'll send you a link to reset your password.
                            </Text>
                        </View>

                        {error ? (
                            <View style={[styles.errorBox, { backgroundColor: c.errorBg, borderLeftColor: c.error }]}>
                                <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: c.text }]}>Email</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]}
                                    placeholder="your@email.com"
                                    placeholderTextColor={c.textMuted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoFocus
                                    editable={!isSubmitting}
                                    value={email}
                                    onChangeText={setEmail}
                                    onSubmitEditing={handleReset}
                                    returnKeyType="send"
                                />
                            </View>
                            <Button title={isSubmitting ? "Sending..." : "Send Reset Link"} onPress={handleReset} disabled={isSubmitting} loading={isSubmitting} variant="primary" />
                        </View>

                        <View style={styles.footer}>
                            <Text style={[styles.footerText, { color: c.textMuted }]}>Remember your password? </Text>
                            <Link href="/(auth)/login" asChild>
                                <TouchableOpacity>
                                    <Text style={[styles.loginLink, { color: c.primary }]}>Sign in</Text>
                                </TouchableOpacity>
                            </Link>
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
    tipBox: { borderRadius: 8, padding: 14, marginBottom: 24, borderLeftWidth: 4 },
    tipText: { fontSize: 14 },
    form: { gap: 20, marginBottom: 32 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: "600" },
    input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
    resendButton: { marginTop: 16, alignItems: "center" },
    resendText: { fontSize: 14, fontWeight: "500" },
    footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
    footerText: { fontSize: 14 },
    loginLink: { fontSize: 14, fontWeight: "600" },
});
