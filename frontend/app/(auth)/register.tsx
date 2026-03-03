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

export default function RegisterScreen() {
  const router = useRouter();
  const { signup, isSigningUp, error } = useAuth();
  const theme = useTheme();
  const c = theme.colors;
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const themeName = useAppStore((state) => state.themeName);

  const handleRegister = async () => {
    setLocalError("");
    if (!displayName.trim()) { setLocalError("Display name is required"); return; }
    if (!email.trim()) { setLocalError("Email is required"); return; }
    if (!password.trim()) { setLocalError("Password is required"); return; }
    if (password.length < 6) { setLocalError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setLocalError("Passwords do not match"); return; }

    try {
      const result = await signup(email, password, displayName);
      if (result?.session) {
        router.replace("/(tabs)/dashboard");
      } else {
        setSignupSuccess(true);
      }
    } catch (err: any) {
      setLocalError(err.message || "Registration failed. Please try again.");
    }
  };

  if (signupSuccess) {
    return (
      <ImageBackground source={getAuthBackground(themeName)} style={styles.backgroundImage} imageStyle={styles.imageStyle} resizeMode="cover">
        <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formCard}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: c.primary }]}>Check Your Email ✉️</Text>
                <Text style={[styles.subtitle, { color: c.textSecondary, marginTop: 12, lineHeight: 22 }]}>
                  We sent a confirmation link to{"\n"}
                  <Text style={{ color: c.secondary, fontWeight: "600" }}>{email}</Text>
                  {"\n\n"}Please click the link to verify your account, then sign in.
                </Text>
              </View>
              <Button title="Go to Sign In" onPress={() => router.replace("/(auth)/login")} variant="primary" />
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    );
  }

  const displayError = localError || error;

  return (
    <ImageBackground source={getAuthBackground(themeName)} style={styles.backgroundImage} imageStyle={styles.imageStyle} resizeMode="cover">
      <View style={[styles.overlay, { backgroundColor: c.overlay }]}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <View style={styles.header}>
              <Image source={require('@/assets/images/app_logo.png')} style={styles.logo} resizeMode="contain" />
              <Text style={[styles.title, { color: c.primary }]}>Create Account</Text>
              <Text style={[styles.subtitle, { color: c.textMuted }]}>Join DuoProductivity</Text>
            </View>

            {displayError && (
              <View style={[styles.errorBox, { backgroundColor: c.errorBg, borderLeftColor: c.error }]}>
                <Text style={[styles.errorText, { color: c.error }]}>{displayError}</Text>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: c.text }]}>Display Name</Text>
                <TextInput style={[styles.input, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]} placeholder="Your name" placeholderTextColor={c.textMuted} editable={!isSigningUp} value={displayName} onChangeText={setDisplayName} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: c.text }]}>Email</Text>
                <TextInput style={[styles.input, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]} placeholder="your@email.com" placeholderTextColor={c.textMuted} keyboardType="email-address" autoCapitalize="none" editable={!isSigningUp} value={email} onChangeText={setEmail} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: c.text }]}>Password</Text>
                <TextInput style={[styles.input, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]} placeholder="••••••••" placeholderTextColor={c.textMuted} secureTextEntry editable={!isSigningUp} value={password} onChangeText={setPassword} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: c.text }]}>Confirm Password</Text>
                <TextInput style={[styles.input, { backgroundColor: c.surface, borderColor: c.borderLight, color: c.text }]} placeholder="••••••••" placeholderTextColor={c.textMuted} secureTextEntry editable={!isSigningUp} value={confirmPassword} onChangeText={setConfirmPassword} />
              </View>
              <Button title={isSigningUp ? "Creating account..." : "Sign Up"} onPress={handleRegister} disabled={isSigningUp} loading={isSigningUp} />
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: c.textMuted }]}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={[styles.registerLink, { color: c.primary }]}>Sign in</Text>
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
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
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
  logo: { width: 72, height: 72, borderRadius: 16, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16 },
  errorBox: { borderRadius: 8, padding: 12, marginBottom: 24, borderLeftWidth: 4 },
  errorText: { fontSize: 14 },
  form: { gap: 20, marginBottom: 32 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  footerText: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: "600" },
});
