import { Button } from "@/components/ui/Button";
import { authService } from "@/services/authService";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { email: prefillEmail } = useLocalSearchParams<{ email?: string }>();
    const [email, setEmail] = useState(prefillEmail || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const handleReset = async () => {
        setError("");

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        console.log("ForgotPassword: Sending reset email to:", email.trim());
        setIsSubmitting(true);
        try {
            await authService.resetPassword(email.trim());
            console.log("ForgotPassword: Reset email sent successfully!");
            setSent(true);
        } catch (err: any) {
            console.error("ForgotPassword: Error sending reset email:", err);
            setError(err.message || "Failed to send reset email. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success state
    if (sent) {
        return (
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.iconText}>📧</Text>
                        <Text style={styles.title}>Check Your Email</Text>
                        <Text style={styles.subtitle}>
                            We sent a password reset link to{"\n"}
                            <Text style={styles.emailHighlight}>{email}</Text>
                            {"\n\n"}Open the link in your email to set a new password. It may
                            take a minute to arrive.
                        </Text>
                    </View>

                    <View style={styles.tipBox}>
                        <Text style={styles.tipText}>
                            💡 Don't see it? Check your spam folder.
                        </Text>
                    </View>

                    <Button
                        title="Back to Sign In"
                        onPress={() => router.replace("/(auth)/login")}
                        variant="primary"
                    />

                    <TouchableOpacity
                        style={styles.resendButton}
                        onPress={() => {
                            setSent(false);
                            setError("");
                        }}
                    >
                        <Text style={styles.resendText}>
                            Didn't receive it? Try again
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.iconText}>🔒</Text>
                    <Text style={styles.title}>Forgot Password?</Text>
                    <Text style={styles.subtitle}>
                        Enter your email and we'll send you a link to reset your password.
                    </Text>
                </View>

                {/* Error Message */}
                {error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Form */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="your@email.com"
                            placeholderTextColor="#6B7280"
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

                    <Button
                        title={isSubmitting ? "Sending..." : "Send Reset Link"}
                        onPress={handleReset}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        variant="primary"
                    />
                </View>

                {/* Back to Login */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Remember your password? </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.loginLink}>Sign in</Text>
                        </TouchableOpacity>
                    </Link>
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
    emailHighlight: {
        color: "#58CC02",
        fontWeight: "600",
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
    tipBox: {
        backgroundColor: "#1A2C34",
        borderRadius: 8,
        padding: 14,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: "#58CC02",
    },
    tipText: {
        color: "#D1D5DB",
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
    resendButton: {
        marginTop: 16,
        alignItems: "center",
    },
    resendText: {
        color: "#58CC02",
        fontSize: 14,
        fontWeight: "500",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 24,
    },
    footerText: {
        color: "#6B7280",
        fontSize: 14,
    },
    loginLink: {
        color: "#58CC02",
        fontSize: 14,
        fontWeight: "600",
    },
});
