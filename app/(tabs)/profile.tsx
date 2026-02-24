import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useDashboard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: profile, isLoading } = useUserProfile();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#58CC02" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <Card className="mb-lg">
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.display_name || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>
              {profile?.display_name || 'User'}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>
      </Card>

      {/* Gamification Stats */}
      <Card className="mb-lg">
        <Text style={styles.sectionTitle}>Gamification Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <MaterialIcons name="star" size={24} color="#58CC02" />
            <Text style={styles.statLabel}>Total XP</Text>
            <Text style={styles.statValue}>{profile?.total_xp || 0}</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons name="trending-up" size={24} color="#58CC02" />
            <Text style={styles.statLabel}>Level</Text>
            <Text style={styles.statValue}>{profile?.level || 1}</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons name="local-fire-department" size={24} color="#FF9600" />
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>{profile?.streak_count || 0}</Text>
          </View>
        </View>
      </Card>

      {/* Profile Details */}
      <Card className="mb-lg">
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.detailsList}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{user?.email}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>User ID</Text>
            <Text style={styles.detailValue}>{user?.id?.slice(0, 12)}...</Text>
          </View>
          {profile?.last_activity_date && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Last Activity</Text>
              <Text style={styles.detailValue}>
                {new Date(profile.last_activity_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* Streak Status */}
      {profile?.streak_frozen && (
        <Card className="mb-lg">
          <View style={styles.freezeWarning}>
            <MaterialIcons name="info" size={24} color="#FF9600" />
            <View style={styles.freezeContent}>
              <Text style={styles.freezeTitle}>Streak Frozen</Text>
              <Text style={styles.freezeText}>
                Your streak is currently frozen. Log some work to reactivate it!
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Settings Section */}
      <Card className="mb-lg">
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsList}>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="notifications" size={20} color="#58CC02" />
            <Text style={styles.settingLabel}>Notifications</Text>
            <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="palette" size={20} color="#58CC02" />
            <Text style={styles.settingLabel}>Theme</Text>
            <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="help" size={20} color="#58CC02" />
            <Text style={styles.settingLabel}>Help & Support</Text>
            <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="info" size={20} color="#58CC02" />
            <Text style={styles.settingLabel}>About</Text>
            <MaterialIcons name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </Card>

      {/* Logout Button */}
      <Card className="mb-lg">
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          size="medium"
        />
        <Text style={styles.logoutNote}>
          You'll need to sign in again to access your account
        </Text>
      </Card>

      <View style={styles.spacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131F24',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#131F24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#58CC02',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#58CC02',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#0F1419',
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#58CC02',
  },
  detailsList: {
    gap: 12,
  },
  detailItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2C34',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  freezeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#7F5C0F',
    borderRadius: 8,
  },
  freezeContent: {
    flex: 1,
  },
  freezeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FCD34D',
    marginBottom: 4,
  },
  freezeText: {
    fontSize: 12,
    color: '#FEF3C7',
  },
  settingsList: {
    gap: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2C34',
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    color: '#E5E7EB',
    marginLeft: 12,
    fontWeight: '500',
  },
  logoutNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  spacing: {
    height: 20,
  },
});
