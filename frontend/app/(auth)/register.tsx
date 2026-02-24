import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const { signup, isSigningUp, error } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleRegister = async () => {
    setLocalError("");

    // Validation
    if (!displayName.trim()) {
      setLocalError("Display name is required");
      return;
    }
    if (!email.trim()) {
      setLocalError("Email is required");
      return;
    }
    if (!password.trim()) {
      setLocalError("Password is required");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      const result = await signup(email, password, displayName);
      if (result?.session) {
        // Email confirmation disabled — session exists, navigate directly
        router.replace("/(tabs)/dashboard");
      } else {
        // Email confirmation enabled — show success message
        setSignupSuccess(true);
      }
    } catch (err: any) {
      setLocalError(err.message || "Registration failed. Please try again.");
    }
  };

  // Show success screen after signup
  if (signupSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Check Your Email ✉️</Text>
            <Text style={[styles.subtitle, { marginTop: 12, lineHeight: 22 }]}>
              We sent a confirmation link to{"\n"}
              <Text style={{ color: "#58CC02", fontWeight: "600" }}>{email}</Text>
              {"\n\n"}Please click the link to verify your account, then sign in.
            </Text>
          </View>
          <Button
            title="Go to Sign In"
            onPress={() => router.replace("/(auth)/login")}
            variant="primary"
          />
        </View>
      </View>
    );
  }

  const displayError = localError || error;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join DuoProductivity</Text>
        </View>

        {/* Error Message */}
        {displayError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          {/* Display Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#6B7280"
              editable={!isSigningUp}
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#6B7280"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSigningUp}
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
              editable={!isSigningUp}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#6B7280"
              secureTextEntry
              editable={!isSigningUp}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {/* Register Button */}
          <Button
            title={isSigningUp ? "Creating account..." : "Sign Up"}
            onPress={handleRegister}
            disabled={isSigningUp}
            loading={isSigningUp}
          />
        </View>

        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
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
