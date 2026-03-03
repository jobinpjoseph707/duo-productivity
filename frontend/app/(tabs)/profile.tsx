import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ALL_THEMES } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useDashboard';
import { useNotifications } from '@/hooks/useNotificationsApi';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/appStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: profile, isLoading } = useUserProfile();
  const { unreadCount } = useNotifications();
  const theme = useTheme();
  const c = theme.colors;
  const themeName = useAppStore((state) => state.themeName);
  const setThemeName = useAppStore((state) => state.setThemeName);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await logout();
        router.replace('/(auth)/login');
      } catch (error) {
        router.replace('/(auth)/login');
      }
    };

    if (Platform.OS === 'web') {
      performLogout();
    } else {
      Alert.alert('Logout', 'Are you sure you want to log out?', [
        { text: 'Cancel' },
        { text: 'Logout', onPress: performLogout },
      ]);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.dark }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.dark }]} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <Card>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: c.primary, ...theme.shadows.glow }]}>
            <Text style={styles.avatarText}>
              {(profile?.display_name || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.displayName, { color: c.text }]}>
              {profile?.display_name || 'User'}
            </Text>
            <Text style={[styles.email, { color: c.textMuted }]}>{user?.email}</Text>
            <View style={[styles.rankBadge, { backgroundColor: c.primaryMuted }]}>
              <Text style={[styles.rankText, { color: c.primary }]}>
                ⚔️ Rank {profile?.level || 1} Hunter
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Gamification Stats */}
      <Card>
        <Text style={[styles.sectionTitle, { color: c.primary }]}>Hunter Stats</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: c.darkest }]}>
            <MaterialIcons name="star" size={24} color={c.secondary} />
            <Text style={[styles.statLabel, { color: c.textMuted }]}>Total XP</Text>
            <Text style={[styles.statValue, { color: c.secondary }]}>{profile?.total_xp || 0}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: c.darkest }]}>
            <MaterialIcons name="trending-up" size={24} color={c.primary} />
            <Text style={[styles.statLabel, { color: c.textMuted }]}>Level</Text>
            <Text style={[styles.statValue, { color: c.primary }]}>{profile?.level || 1}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: c.darkest }]}>
            <MaterialIcons name="local-fire-department" size={24} color={c.accent} />
            <Text style={[styles.statLabel, { color: c.textMuted }]}>Streak</Text>
            <Text style={[styles.statValue, { color: c.accent }]}>{profile?.streak_count || 0}</Text>
          </View>
        </View>
      </Card>

      {/* Account Information */}
      <Card>
        <Text style={[styles.sectionTitle, { color: c.primary }]}>Account Information</Text>
        <View style={styles.detailsList}>
          <View style={[styles.detailItem, { borderBottomColor: c.border }]}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Email</Text>
            <Text style={[styles.detailValue, { color: c.text }]}>{user?.email}</Text>
          </View>
          <View style={[styles.detailItem, { borderBottomColor: c.border }]}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>User ID</Text>
            <Text style={[styles.detailValue, { color: c.text }]}>{user?.id?.slice(0, 12)}...</Text>
          </View>
          {profile?.last_activity_date && (
            <View style={[styles.detailItem, { borderBottomColor: c.border }]}>
              <Text style={[styles.detailLabel, { color: c.textMuted }]}>Last Activity</Text>
              <Text style={[styles.detailValue, { color: c.text }]}>
                {new Date(profile.last_activity_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* Streak Status */}
      {profile?.streak_frozen && (
        <Card>
          <View style={[styles.freezeWarning, { backgroundColor: c.warningBg }]}>
            <MaterialIcons name="info" size={24} color={c.warning} />
            <View style={styles.freezeContent}>
              <Text style={[styles.freezeTitle, { color: c.warning }]}>Streak Frozen</Text>
              <Text style={[styles.freezeText, { color: c.text }]}>
                Your streak is currently frozen. Log some work to reactivate it!
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Settings Section */}
      <Card>
        <Text style={[styles.sectionTitle, { color: c.primary }]}>Settings</Text>
        <View style={styles.settingsList}>
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: c.border }]}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <MaterialIcons name="notifications" size={20} color={c.primary} />
            <Text style={[styles.settingLabel, { color: c.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: c.error }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
            <MaterialIcons name="chevron-right" size={20} color={c.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: c.border }]}
            onPress={() => setThemeModalVisible(true)}
          >
            <MaterialIcons name="palette" size={20} color={c.primary} />
            <Text style={[styles.settingLabel, { color: c.text }]}>Theme</Text>
            <Text style={[styles.settingValue, { color: c.textMuted }]}>{theme.label}</Text>
            <MaterialIcons name="chevron-right" size={20} color={c.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: c.border }]}
            onPress={() => setHelpModalVisible(true)}
          >
            <MaterialIcons name="help" size={20} color={c.primary} />
            <Text style={[styles.settingLabel, { color: c.text }]}>Help & Support</Text>
            <MaterialIcons name="chevron-right" size={20} color={c.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: c.border }]}
            onPress={() => setAboutModalVisible(true)}
          >
            <MaterialIcons name="info" size={20} color={c.primary} />
            <Text style={[styles.settingLabel, { color: c.text }]}>About</Text>
            <MaterialIcons name="chevron-right" size={20} color={c.textMuted} />
          </TouchableOpacity>
        </View>
      </Card>

      {/* Logout Button */}
      <Card>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          size="medium"
        />
        <Text style={[styles.logoutNote, { color: c.textMuted }]}>
          You'll need to sign in again to access your account
        </Text>
      </Card>

      <View style={styles.spacing} />

      {/* ── Theme Picker Modal ── */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: c.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: c.surface, ...theme.shadows.glow }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Select Theme</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={c.textMuted} />
              </TouchableOpacity>
            </View>
            {ALL_THEMES.map((t) => (
              <TouchableOpacity
                key={t.name}
                style={[
                  styles.themeOption,
                  { borderColor: c.border },
                  themeName === t.name && { borderColor: t.colors.primary, backgroundColor: t.colors.primaryMuted },
                ]}
                onPress={() => {
                  setThemeName(t.name);
                  setThemeModalVisible(false);
                }}
              >
                <View style={styles.themePreview}>
                  <View style={[styles.themeCircle, { backgroundColor: t.colors.primary }]} />
                  <View style={[styles.themeCircle, { backgroundColor: t.colors.secondary }]} />
                  <View style={[styles.themeCircle, { backgroundColor: t.colors.accent }]} />
                </View>
                <View style={styles.themeInfo}>
                  <Text style={[styles.themeName, { color: themeName === t.name ? t.colors.primary : c.text }]}>
                    {t.label}
                  </Text>
                  <Text style={[styles.themeDesc, { color: c.textMuted }]}>{t.description}</Text>
                </View>
                {themeName === t.name && (
                  <MaterialIcons name="check-circle" size={24} color={t.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ── Help & Support Modal ── */}
      <Modal
        visible={helpModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: c.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: c.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Help & Support</Text>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.helpSection}>
              <Text style={[styles.helpTitle, { color: c.primary }]}>📌 Getting Started</Text>
              <Text style={[styles.helpText, { color: c.textSecondary }]}>
                1. Create projects & tasks under "Projects"{'\n'}
                2. Plan daily quests from the "Daily Plan" tab{'\n'}
                3. Log work to earn XP and maintain your streak{'\n'}
                4. Track progress in your "Diary"
              </Text>
            </View>

            <View style={styles.helpSection}>
              <Text style={[styles.helpTitle, { color: c.primary }]}>⚡ XP & Levels</Text>
              <Text style={[styles.helpText, { color: c.textSecondary }]}>
                • Earn XP by logging work on tasks & routines{'\n'}
                • Complete all daily quests for a +50 XP bonus{'\n'}
                • Level up every 1000 XP{'\n'}
                • Maintain streaks by logging daily
              </Text>
            </View>

            <View style={styles.helpSection}>
              <Text style={[styles.helpTitle, { color: c.primary }]}>🔥 Streaks</Text>
              <Text style={[styles.helpText, { color: c.textSecondary }]}>
                • Log work every day to build your streak{'\n'}
                • Lost streaks can be restored for 100 XP{'\n'}
                • Frozen streaks protect you from losing progress
              </Text>
            </View>

            <View style={styles.helpSection}>
              <Text style={[styles.helpTitle, { color: c.primary }]}>📧 Contact Support</Text>
              <TouchableOpacity onPress={() => Linking.openURL('mailto:support@duoproductivity.app')}>
                <Text style={[styles.helpLink, { color: c.secondary }]}>support@duoproductivity.app</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── About Modal ── */}
      <Modal
        visible={aboutModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: c.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: c.surface, alignItems: 'center' }]}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setAboutModalVisible(false)}>
              <MaterialIcons name="close" size={24} color={c.textMuted} />
            </TouchableOpacity>

            <Image
              source={require('@/assets/images/app_logo.png')}
              style={styles.aboutLogo}
              resizeMode="contain"
            />
            <Text style={[styles.aboutTitle, { color: c.primary }]}>DuoProductivity</Text>
            <Text style={[styles.aboutVersion, { color: c.textMuted }]}>Version 1.0.0</Text>

            <View style={[styles.aboutDivider, { backgroundColor: c.border }]} />

            <Text style={[styles.aboutDesc, { color: c.textSecondary }]}>
              A gamified productivity app inspired by Solo Leveling.{'\n\n'}
              Track your projects, complete daily quests, earn XP, and level up your real-life skills like a true Hunter.
            </Text>

            <View style={[styles.aboutDivider, { backgroundColor: c.border }]} />

            <Text style={[styles.aboutFooter, { color: c.textDim }]}>
              Built with ❤️ using React Native & Expo
            </Text>
            <Text style={[styles.aboutCopyright, { color: c.textDim }]}>
              © 2026 DuoProductivity. All rights reserved.
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  profileInfo: { flex: 1 },
  displayName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  email: { fontSize: 14 },
  rankBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  rankText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 8 },
  statLabel: { fontSize: 12, marginTop: 8, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },
  detailsList: { gap: 12 },
  detailItem: { paddingVertical: 12, borderBottomWidth: 1 },
  detailLabel: { fontSize: 12, marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '500' },
  freezeWarning: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8 },
  freezeContent: { flex: 1 },
  freezeTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  freezeText: { fontSize: 12 },
  settingsList: { gap: 0 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1 },
  settingLabel: { flex: 1, fontSize: 14, marginLeft: 12, fontWeight: '500' },
  settingValue: { fontSize: 12, marginRight: 8 },
  logoutNote: { fontSize: 12, textAlign: 'center', marginTop: 12 },
  badge: { borderRadius: 12, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, marginRight: 8 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  spacing: { height: 20 },

  // Modal styles
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalCloseBtn: { position: 'absolute', top: 0, right: 0, zIndex: 1, padding: 8 },

  // Theme picker
  themeOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  themePreview: { flexDirection: 'row', gap: 4, marginRight: 14 },
  themeCircle: { width: 18, height: 18, borderRadius: 9 },
  themeInfo: { flex: 1 },
  themeName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  themeDesc: { fontSize: 12 },

  // Help
  helpSection: { marginBottom: 20 },
  helpTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  helpText: { fontSize: 13, lineHeight: 22 },
  helpLink: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },

  // About
  aboutLogo: { width: 80, height: 80, borderRadius: 20, marginBottom: 16, marginTop: 16 },
  aboutTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  aboutVersion: { fontSize: 14, marginBottom: 16 },
  aboutDivider: { height: 1, width: '100%', marginVertical: 16 },
  aboutDesc: { fontSize: 14, lineHeight: 22, textAlign: 'center', paddingHorizontal: 8 },
  aboutFooter: { fontSize: 13, marginTop: 4 },
  aboutCopyright: { fontSize: 11, marginTop: 8, marginBottom: 8 },
});
