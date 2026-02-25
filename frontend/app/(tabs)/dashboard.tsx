import { PathNode } from "@/components/gamification/PathNode";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { Card } from "@/components/ui/Card";
import { useDailyQuests } from "@/hooks/useDailyQuests";
import {
  useDashboard,
  useUserProfile,
} from "@/hooks/useDashboard";
import { useTaskPath } from "@/hooks/useTaskPath";
import { useAppStore } from "@/stores/appStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DashboardScreen() {
  const { data: dashboard, isLoading: isDashboardLoading } = useDashboard();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { data: pathGroups } = useTaskPath();
  const { quests } = useDailyQuests();
  const setLogWorkModalOpen = useAppStore((state) => state.setLogWorkModalOpen);
  const router = useRouter();

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
      {/* Compact Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{userProfile.display_name || "User"}</Text>
        </View>
        <View style={styles.levelCircle}>
          <Text style={styles.levelNum}>{userProfile.level || 1}</Text>
        </View>
      </View>

      {/* Stats Row — Streak, XP, Level */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statNum}>{userProfile.streak_count || 0}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⚡</Text>
          <Text style={styles.statNum}>{userProfile.total_xp || 0}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🏆</Text>
          <Text style={styles.statNum}>Lv.{userProfile.level || 1}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
      </View>

      {/* XP Progress Bar */}
      <Card>
        <XPProgressBar
          currentXP={userProfile.total_xp || 0}
          nextLevelXP={dashboard.xpForNextLevel || (userProfile.level || 1) * 1000}
          level={userProfile.level || 1}
        />
      </Card>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setLogWorkModalOpen(true)}
        >
          <MaterialIcons name="edit" size={20} color="#000" />
          <Text style={styles.actionBtnText}>Log Work</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={() =>
            useAppStore.setState({ isTimeAllocationModalOpen: true })
          }
        >
          <MaterialIcons name="schedule" size={20} color="#58CC02" />
          <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>
            Set Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🎯 Today's Quests — Gamified Daily Backlog */}
      {quests && quests.length > 0 && (
        <Card>
          <View style={styles.pathHeader}>
            <Text style={styles.sectionTitle}>Today's Quests</Text>
            <View style={styles.bonusBadge}>
              <Text style={styles.bonusText}>+50 XP BONUS</Text>
            </View>
          </View>
          <View style={styles.questList}>
            {quests.map((quest: any) => (
              <TouchableOpacity
                key={quest.id}
                style={styles.questItem}
                onPress={() => {
                  useAppStore.setState({
                    activeProjectId: quest.projectId,
                    activeTaskId: quest.id,
                  });
                  setLogWorkModalOpen(true);
                }}
              >
                <View style={[styles.questCheckbox, quest.status === 'completed' && styles.questCheckboxDone]}>
                  {quest.status === 'completed' && <MaterialIcons name="check" size={14} color="#000" />}
                </View>
                <View style={styles.questContent}>
                  <Text style={[styles.questTitle, quest.status === 'completed' && styles.questTextDone]}>
                    {quest.title}
                  </Text>
                  <Text style={styles.questProject}>{quest.projectName}</Text>
                </View>
                {!quest.isPlanned && <MaterialIcons name="auto-awesome" size={14} color="#FF9600" />}
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      )}

      {/* ── Your Path ── Duolingo-style task path */}
      {pathGroups && pathGroups.length > 0 && (
        <Card>
          <View style={styles.pathHeader}>
            <Text style={styles.sectionTitle}>Your Path</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/projects")}
            >
              <Text style={styles.viewAll}>View Projects →</Text>
            </TouchableOpacity>
          </View>

          {pathGroups.map((group) => {
            const completedCount = group.tasks.filter(
              (t) => t.status === "completed"
            ).length;
            const total = group.tasks.length;
            const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

            return (
              <View key={group.projectId} style={styles.pathGroup}>
                {/* Project Header */}
                <View style={styles.projectHeader}>
                  <MaterialIcons name="folder" size={16} color="#58CC02" />
                  <Text style={styles.projectName}>{group.projectName}</Text>
                  <Text style={styles.projectProgress}>
                    {completedCount}/{total} ({pct}%)
                  </Text>
                </View>

                {/* Task Path */}
                <View style={styles.pathContainer}>
                  {group.tasks.map((task, index) => (
                    <View key={task.id} style={styles.nodeWrapper}>
                      {index > 0 && <View style={styles.connector} />}
                      <PathNode
                        nodeNumber={task.nodeNumber}
                        title={task.title}
                        completed={task.status === "completed"}
                        onPress={() => {
                          useAppStore.setState({
                            activeProjectId: group.projectId,
                            activeTaskId: task.id,
                          });
                          router.push("/(tabs)/projects");
                        }}
                      />
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </Card>
      )}

      {/* Today's Time */}
      {dashboard.timeAllocations && dashboard.timeAllocations.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Today's Time</Text>
          {dashboard.timeAllocations.map((a, idx) => {
            const pct = a.allocatedMinutes > 0
              ? Math.min((a.spentMinutes / a.allocatedMinutes) * 100, 100)
              : 0;
            return (
              <View key={idx} style={styles.timeRow}>
                <Text style={styles.timeCat}>{a.categoryName}</Text>
                <View style={styles.timeBarTrack}>
                  <View style={[styles.timeBarFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.timeLabel}>
                  {a.spentMinutes}/{a.allocatedMinutes} min
                </Text>
              </View>
            );
          })}
        </Card>
      )}

      {/* Recent Activity */}
      {dashboard.recentLogs && dashboard.recentLogs.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {dashboard.recentLogs.map((log, idx) => (
            <View key={idx} style={styles.logItem}>
              <View style={styles.logDot} />
              <View style={styles.logContent}>
                <Text style={styles.logText} numberOfLines={1}>
                  {log.logText}
                </Text>
                <Text style={styles.logDate}>
                  {new Date(log.createdAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              {log.xpAwarded > 0 && (
                <Text style={styles.logXp}>+{log.xpAwarded}</Text>
              )}
            </View>
          ))}
        </Card>
      )}

      <View style={styles.spacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131F24",
    paddingHorizontal: 16,
    paddingTop: 12,
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
  errorText: { color: "#EF4444", fontSize: 16 },

  /* Header */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greeting: { fontSize: 13, color: "#6B7280" },
  name: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  levelCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#58CC02",
    justifyContent: "center",
    alignItems: "center",
  },
  levelNum: { fontSize: 18, fontWeight: "800", color: "#000" },

  /* Stats Row */
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1A2C34",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A3C44",
  },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statNum: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  statLabel: { fontSize: 11, color: "#6B7280", marginTop: 2 },

  /* Actions */
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#58CC02",
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#58CC02",
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  actionBtnTextSecondary: {
    color: "#58CC02",
  },

  /* Section */
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#58CC02",
    marginBottom: 12,
  },

  /* Path */
  pathHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  viewAll: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  pathGroup: {
    marginBottom: 16,
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2C34",
  },
  projectName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#E5E7EB",
  },
  projectProgress: {
    fontSize: 12,
    color: "#6B7280",
  },
  pathContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
  },
  nodeWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  connector: {
    width: 24,
    height: 3,
    backgroundColor: "#374151",
    borderRadius: 2,
  },

  /* Time Rows */
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  timeCat: {
    width: 60,
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  timeBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#0F1419",
    borderRadius: 4,
    overflow: "hidden",
  },
  timeBarFill: {
    height: "100%",
    backgroundColor: "#58CC02",
    borderRadius: 4,
  },
  timeLabel: {
    width: 70,
    fontSize: 11,
    color: "#6B7280",
    textAlign: "right",
  },

  /* Activity */
  logItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1A2C34",
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#58CC02",
  },
  logContent: { flex: 1 },
  logText: { color: "#E5E7EB", fontSize: 13, fontWeight: "500" },
  logDate: { color: "#6B7280", fontSize: 11, marginTop: 2 },
  logXp: {
    color: "#58CC02",
    fontSize: 13,
    fontWeight: "700",
  },

  spacing: { height: 20 },

  /* Quests Styles */
  bonusBadge: {
    backgroundColor: 'rgba(255, 150, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 150, 0, 0.3)',
  },
  bonusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FF9600',
  },
  questList: {
    gap: 8,
  },
  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131F24',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1A2C34',
  },
  questCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#58CC02',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questCheckboxDone: {
    backgroundColor: '#58CC02',
  },
  questContent: {
    flex: 1,
  },
  questTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  questTextDone: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  questProject: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});
