import { Button } from "@/components/ui/Button";
import { getAuthBackground } from "@/constants/authImages";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useAppStore } from "@/stores/appStore";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ImageBackground,
  Platform,
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
  const theme = useTheme();
  const c = theme.colors;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const themeName = useAppStore((state) => state.themeName);

  const handleLogin = async () => {
    setLocalError("");
    if (!email.trim()) { setLocalError("Email is required"); return; }
    if (!password.trim()) { setLocalError("Password is required"); return; }

    try {
      await login(email, password);
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      setLocalError(err.message || "Login failed. Please try again.");
    }
  };

  const displayError = localError || error;

  return (
    <ImageBackground
      source={getAuthBackground(themeName)}
      style={styles.backgroundImage}
      imageStyle={styles.imageStyle}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            {/* Logo & Header */}
            <View style={styles.header}>
              <Image
                source={require('@/assets/images/app_logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={[styles.title, { color: c.primary }]}>Login</Text>
              <Text style={[styles.subtitle, { color: c.textMuted }]}>Sign in to DuoProductivity</Text>
            </View>

            {/* Error Message */}
            {displayError && (
              <View style={[styles.errorBox, { backgroundColor: c.errorBg, borderLeftColor: c.error }]}>
                <Text style={[styles.errorText, { color: c.error }]}>{displayError}</Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: c.text }]}>Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]}
                  placeholder="your@email.com"
                  placeholderTextColor={c.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoggingIn}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: c.text }]}>Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={c.textMuted}
                  secureTextEntry
                  editable={!isLoggingIn}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <Button
                title={isLoggingIn ? "Signing in..." : "Sign In"}
                onPress={handleLogin}
                disabled={isLoggingIn}
                loading={isLoggingIn}
                variant="primary"
              />

              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => {
                  router.push({
                    pathname: "/(auth)/forgot-password",
                    params: { email: email.trim() || undefined },
                  });
                }}
              >
                <Text style={[styles.forgotText, { color: c.secondary }]}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Register Link */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: c.textMuted }]}>Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={[styles.registerLink, { color: c.primary }]}>Sign up</Text>
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
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    width: '100%',
    height: '100%',
  },
  overlay: { flex: 1, width: '100%', height: '100%' },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 24,
    paddingVertical: 32,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  header: { marginBottom: 32, alignItems: "center" },
  logo: { width: 72, height: 72, borderRadius: 16, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16 },
  errorBox: { borderRadius: 8, padding: 12, marginBottom: 24, borderLeftWidth: 4 },
  errorText: { fontSize: 14 },
  form: { gap: 20, marginBottom: 32 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  forgotButton: { marginTop: 8 },
  forgotText: { fontSize: 14, fontWeight: "500", textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  footerText: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: "600" },
});
