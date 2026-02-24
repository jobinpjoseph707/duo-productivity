import { StreakFire } from "@/components/gamification/StreakFire";
import { TimeRing } from "@/components/gamification/TimeRing";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  useDashboard,
  useUserProfile,
  useWorkLogs,
} from "@/hooks/useDashboard";
import { useAppStore } from "@/stores/appStore";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function DashboardScreen() {
  const { data: dashboard, isLoading: isDashboardLoading } = useDashboard();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { data: workLogs, isLoading: isLogsLoading } = useWorkLogs(5);
  const setLogWorkModalOpen = useAppStore((state) => state.setLogWorkModalOpen);

  const isLoading = isDashboardLoading || isProfileLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#58CC02" />
      </View>
    );
  }

  if (!dashboard || !userProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load dashboard</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{userProfile.display_name || "User"}</Text>
      </View>

      {/* Streak Section */}
      <Card className="mb-lg">
        <StreakFire
          count={userProfile.streak_count || 0}
          isFrozen={userProfile.streak_frozen || false}
        />
      </Card>

      {/* XP Progress */}
      <Card className="mb-lg">
        <XPProgressBar
          currentXP={userProfile.total_xp || 0}
          nextLevelXP={(userProfile.level || 1) * 1000}
          level={userProfile.level || 1}
        />
      </Card>

      {/* Time Allocations */}
      {dashboard.timeAllocations && dashboard.timeAllocations.length > 0 && (
        <Card className="mb-lg">
          <Text style={styles.sectionTitle}>Today's Time</Text>
          <View style={styles.timeRingsContainer}>
            {dashboard.timeAllocations.map((allocation, idx) => (
              <View key={idx} style={styles.ringWrapper}>
                <TimeRing
                  allocated={allocation.allocatedMinutes}
                  spent={allocation.spentMinutes}
                  category={allocation.categoryName}
                />
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="mb-lg">
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <Button
            title="Log Work"
            onPress={() => setLogWorkModalOpen(true)}
            size="medium"
          />
          <Button
            title="Set Time"
            onPress={() =>
              useAppStore.setState({ isTimeAllocationModalOpen: true })
            }
            variant="secondary"
            size="medium"
          />
        </View>
      </Card>

      {/* Recent Activity */}
      {workLogs && workLogs.length > 0 && (
        <Card className="mb-lg">
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.logsList}>
            {workLogs.map((log, idx) => (
              <View key={idx} style={styles.logItem}>
                <View style={styles.logContent}>
                  <Text style={styles.logText}>{log.logText}</Text>
                  <Text style={styles.logDate}>
                    {new Date(log.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {log.xpAwarded > 0 && (
                  <View style={styles.xpBadge}>
                    <Text style={styles.xpText}>+{log.xpAwarded} XP</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Stats Footer */}
      <Card>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total XP</Text>
            <Text style={styles.statValue}>{userProfile.total_xp || 0}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Level</Text>
            <Text style={styles.statValue}>{userProfile.level || 1}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>
              {userProfile.streak_count || 0}
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.spacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131F24",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#131F24",
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#131F24",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#58CC02",
    marginBottom: 16,
  },
  timeRingsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  ringWrapper: {
    width: "48%",
    alignItems: "center",
  },
  actionsContainer: {
    gap: 12,
  },
  logsList: {
    gap: 12,
  },
  logItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2C34",
  },
  logContent: {
    flex: 1,
  },
  logText: {
    color: "#E5E7EB",
    fontSize: 14,
    marginBottom: 4,
  },
  logDate: {
    color: "#6B7280",
    fontSize: 12,
  },
  xpBadge: {
    backgroundColor: "#58CC02",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
  },
  xpText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#0F1419",
    borderRadius: 8,
  },
  statLabel: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: "#58CC02",
    fontSize: 24,
    fontWeight: "700",
  },
  spacing: {
    height: 20,
  },
});
