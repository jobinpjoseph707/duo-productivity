import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoggingIn, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleLogin = async () => {
    setLocalError("");

    // Validation
    if (!email.trim()) {
      setLocalError("Email is required");
      return;
    }
    if (!password.trim()) {
      setLocalError("Password is required");
      return;
    }

    try {
      await login(email, password);
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      setLocalError(err.message || "Login failed. Please try again.");
    }
  };

  const displayError = localError || error;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Sign in to DuoProductivity</Text>
        </View>

        {/* Error Message */}
        {displayError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#6B7280"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoggingIn}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#6B7280"
              secureTextEntry
              editable={!isLoggingIn}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Login Button */}
          <Button
            title={isLoggingIn ? "Signing in..." : "Sign In"}
            onPress={handleLogin}
            disabled={isLoggingIn}
            loading={isLoggingIn}
            variant="primary"
          />



          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => {
              Alert.prompt
                ? Alert.prompt(
                  "Reset Password",
                  "Enter your email to receive a reset link:",
                  async (resetEmail: string) => {
                    if (resetEmail?.trim()) {
                      try {
                        await authService.resetPassword(resetEmail.trim());
                        Alert.alert(
                          "Email Sent",
                          "Check your inbox for the password reset link."
                        );
                      } catch (err: any) {
                        Alert.alert(
                          "Error",
                          err.message || "Failed to send reset email."
                        );
                      }
                    }
                  },
                  "plain-text",
                  email
                )
                : Alert.alert(
                  "Reset Password",
                  "Please use the Supabase dashboard or contact support to reset your password."
                );
            }}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.registerLink}>Sign up</Text>
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
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#58CC02",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
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
  forgotButton: {
    marginTop: 8,
  },
  forgotText: {
    color: "#58CC02",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
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
  registerLink: {
    color: "#58CC02",
    fontSize: 14,
    fontWeight: "600",
  },
});
