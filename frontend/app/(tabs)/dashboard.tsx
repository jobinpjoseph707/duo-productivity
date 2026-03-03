import { PathNode } from "@/components/gamification/PathNode";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { RoutineModal } from "@/components/timeline/RoutineModal";
import { Card } from "@/components/ui/Card";
import { useDailyQuests } from "@/hooks/useDailyQuests";
import {
  useDashboard,
  useRestoreStreak,
  useUserProfile,
} from "@/hooks/useDashboard";
import { useTaskPath } from "@/hooks/useTaskPath";
import { useTheme } from "@/hooks/useTheme";
import { useAppStore } from "@/stores/appStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
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
  const [isRoutineModalOpen, setRoutineModalOpen] = useState(false);
  const theme = useTheme();
  const c = theme.colors;

  const restoreStreak = useRestoreStreak();

  const isLoading = isDashboardLoading || isProfileLoading;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.dark }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (!dashboard || !userProfile) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: c.dark }]}>
        <Text style={[styles.errorText, { color: c.error }]}>Failed to load dashboard</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.dark }]} showsVerticalScrollIndicator={false}>
      {/* Compact Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: c.textMuted }]}>Welcome back,</Text>
          <Text style={[styles.name, { color: c.text }]}>{userProfile.display_name || "User"}</Text>
        </View>
        <View style={[styles.levelCircle, { backgroundColor: c.primary }]}>
          <Text style={styles.levelNum}>{userProfile.level || 1}</Text>
        </View>
      </View>

      {/* Stats Row — Streak, XP, Level */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={[styles.statNum, { color: c.text }]}>{dashboard.streak || 0}</Text>
          <Text style={[styles.statLabel, { color: c.textMuted }]}>Streak</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={styles.statEmoji}>⚡</Text>
          <Text style={[styles.statNum, { color: c.text }]}>{userProfile.total_xp || 0}</Text>
          <Text style={[styles.statLabel, { color: c.textMuted }]}>Total XP</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={styles.statEmoji}>🏆</Text>
          <Text style={[styles.statNum, { color: c.text }]}>Lv.{userProfile.level || 1}</Text>
          <Text style={[styles.statLabel, { color: c.textMuted }]}>Level</Text>
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

      {/* Streak Restore */}
      {dashboard.lastStreakCount > 0 && dashboard.streak === 0 && (
        <Card style={{ borderColor: c.accent, borderWidth: 1, backgroundColor: c.warningBg }}>
          <Text style={[styles.restoreText, { color: c.text }]}>
            You lost your <Text style={{ color: c.accent, fontWeight: '800' }}>{dashboard.lastStreakCount}-day</Text> streak! 😢
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { marginTop: 12, backgroundColor: c.accent }, userProfile.total_xp < 100 && { opacity: 0.5 }]}
            onPress={() => restoreStreak.mutate()}
            disabled={restoreStreak.isPending || userProfile.total_xp < 100}
          >
            {restoreStreak.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>
                Restore Streak (100 XP)
              </Text>
            )}
          </TouchableOpacity>
          {userProfile.total_xp < 100 && (
            <Text style={{ color: c.error, fontSize: 12, marginTop: 8, textAlign: 'center' }}>You need 100 XP to restore your streak.</Text>
          )}
        </Card>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: c.primary }]}
          onPress={() => setLogWorkModalOpen(true)}
        >
          <MaterialIcons name="edit" size={20} color="#FFF" />
          <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Log Work</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.primary }]}
          onPress={() => setRoutineModalOpen(true)}
        >
          <MaterialIcons name="schedule" size={20} color={c.primary} />
          <Text style={[styles.actionBtnText, { color: c.primary }]}>
            Set Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🎯 Today's Quests */}
      {quests && quests.length > 0 && (
        <Card>
          <View style={styles.pathHeader}>
            <Text style={[styles.sectionTitle, { color: c.primary }]}>Today's Quests</Text>
            <View style={[styles.bonusBadge, { backgroundColor: c.accentGlow, borderColor: c.accent }]}>
              <Text style={[styles.bonusText, { color: c.accent }]}>+50 XP BONUS</Text>
            </View>
          </View>
          <View style={styles.questList}>
            {quests.map((quest: any) => (
              <TouchableOpacity
                key={quest.id}
                style={[styles.questItem, { backgroundColor: c.dark, borderColor: c.border }]}
                onPress={() => {
                  useAppStore.setState({
                    activeProjectId: quest.projectId,
                    activeTaskId: quest.id,
                  });
                  setLogWorkModalOpen(true);
                }}
              >
                <View style={[styles.questCheckbox, { borderColor: c.primary }, quest.status === 'completed' && { backgroundColor: c.primary }]}>
                  {quest.status === 'completed' && <MaterialIcons name="check" size={14} color="#FFF" />}
                </View>
                <View style={styles.questContent}>
                  <Text style={[styles.questTitle, { color: c.text }, quest.status === 'completed' && { textDecorationLine: 'line-through', color: c.textMuted }]}>
                    {quest.title}
                  </Text>
                  <Text style={[styles.questProject, { color: c.textMuted }]}>{quest.projectName}</Text>
                </View>
                {!quest.isPlanned && <MaterialIcons name="auto-awesome" size={14} color={c.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      )}

      {/* ── Your Path ── */}
      {pathGroups && pathGroups.length > 0 && (
        <Card>
          <View style={styles.pathHeader}>
            <Text style={[styles.sectionTitle, { color: c.primary }]}>Your Path</Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/projects")}
            >
              <Text style={[styles.viewAll, { color: c.textMuted }]}>View Projects →</Text>
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
                <View style={[styles.projectHeader, { borderBottomColor: c.border }]}>
                  <MaterialIcons name="folder" size={16} color={c.primary} />
                  <Text style={[styles.projectName, { color: c.text }]}>{group.projectName}</Text>
                  <Text style={[styles.projectProgress, { color: c.textMuted }]}>
                    {completedCount}/{total} ({pct}%)
                  </Text>
                </View>

                <View style={styles.pathContainer}>
                  {group.tasks.map((task, index) => (
                    <View key={task.id} style={styles.nodeWrapper}>
                      {index > 0 && <View style={[styles.connector, { backgroundColor: c.borderLight }]} />}
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
          <Text style={[styles.sectionTitle, { color: c.primary }]}>Today's Time</Text>
          {dashboard.timeAllocations.map((a, idx) => {
            const pct = a.allocatedMinutes > 0
              ? Math.min((a.spentMinutes / a.allocatedMinutes) * 100, 100)
              : 0;
            return (
              <View key={idx} style={styles.timeRow}>
                <Text style={[styles.timeCat, { color: c.textSecondary }]}>{a.categoryName}</Text>
                <View style={[styles.timeBarTrack, { backgroundColor: c.darkest }]}>
                  <View style={[styles.timeBarFill, { width: `${pct}%`, backgroundColor: a.color || c.primary }]} />
                </View>
                <Text style={[styles.timeLabel, { color: c.textMuted }]}>
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
          <Text style={[styles.sectionTitle, { color: c.primary }]}>Recent Activity</Text>
          {dashboard.recentLogs.map((log, idx) => (
            <View key={idx} style={[styles.logItem, { borderBottomColor: c.border }]}>
              <View style={[styles.logDot, { backgroundColor: c.primary }]} />
              <View style={styles.logContent}>
                <Text style={[styles.logText, { color: c.text }]} numberOfLines={1}>
                  {log.logText}
                </Text>
                <Text style={[styles.logDate, { color: c.textMuted }]}>
                  {new Date(log.createdAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              {log.xpAwarded > 0 && (
                <Text style={[styles.logXp, { color: c.success }]}>+{log.xpAwarded}</Text>
              )}
            </View>
          ))}
        </Card>
      )}

      <View style={styles.spacing} />

      <RoutineModal
        visible={isRoutineModalOpen}
        onClose={() => setRoutineModalOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  greeting: { fontSize: 13 },
  name: { fontSize: 22, fontWeight: "700" },
  levelCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  levelNum: { fontSize: 18, fontWeight: "800", color: "#FFF" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", borderWidth: 1 },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statNum: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: 10, marginVertical: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 12 },
  actionBtnText: { fontSize: 15, fontWeight: "700" },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  pathHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  viewAll: { fontSize: 12, fontWeight: "500" },
  pathGroup: { marginBottom: 16 },
  projectHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1 },
  projectName: { flex: 1, fontSize: 14, fontWeight: "700" },
  projectProgress: { fontSize: 12 },
  pathContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 4, paddingVertical: 8 },
  nodeWrapper: { flexDirection: "row", alignItems: "center" },
  connector: { width: 24, height: 3, borderRadius: 2 },
  timeRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  timeCat: { width: 60, fontSize: 12, fontWeight: "500" },
  timeBarTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  timeBarFill: { height: "100%", borderRadius: 4 },
  timeLabel: { width: 70, fontSize: 11, textAlign: "right" },
  logItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 10, borderBottomWidth: 1 },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logContent: { flex: 1 },
  logText: { fontSize: 13, fontWeight: "500" },
  logDate: { fontSize: 11, marginTop: 2 },
  logXp: { fontSize: 13, fontWeight: "700" },
  spacing: { height: 20 },
  bonusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  bonusText: { fontSize: 9, fontWeight: '800' },
  questList: { gap: 8 },
  questItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 12, borderWidth: 1 },
  questCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  questContent: { flex: 1 },
  questTitle: { fontSize: 14, fontWeight: '600' },
  questProject: { fontSize: 11, marginTop: 2 },
  restoreText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
