import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useProductivityStats, useWorkLogs } from "@/hooks/useDashboard";
import { useTheme } from "@/hooks/useTheme";
import { WorkLogEntry } from "@/services/productivityService";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface TaskGroup {
  taskId: string | null;
  taskTitle: string | null;
  logs: Array<{
    id: string;
    logText: string;
    xpAwarded: number;
    createdAt: string;
  }>;
}

interface DateGroup {
  date: string;
  displayDate: string;
  totalXp: number;
  tasks: TaskGroup[];
}

export default function DiaryScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const { data: workLogs, isLoading: logsLoading } = useWorkLogs(100);
  const { data: statsData, isLoading: statsLoading } = useProductivityStats();

  const isLoading = logsLoading || statsLoading;

  const stats = useMemo(() => {
    if (!workLogs) return null;

    const last7Days = new Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    const xpByDay: Record<string, number> = {};
    const xpByCategory: Record<string, number> = {};
    const logsByDate: Record<string, DateGroup> = {};

    last7Days.forEach((date: string) => {
      xpByDay[date] = 0;
      const displayDate = new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      logsByDate[date] = { date, displayDate, totalXp: 0, tasks: [] };
    });

    workLogs.forEach((log: WorkLogEntry) => {
      const date = log.createdAt.split("T")[0];
      if (logsByDate[date]) {
        logsByDate[date].totalXp += log.xpAwarded;
        xpByDay[date] += log.xpAwarded;

        let taskGroup = logsByDate[date].tasks.find((t: TaskGroup) => t.taskId === log.taskId);
        if (!taskGroup) {
          taskGroup = { taskId: log.taskId || null, taskTitle: log.taskTitle || "General", logs: [] };
          logsByDate[date].tasks.push(taskGroup);
        }
        taskGroup.logs.push(log as any);

        const category = log.taskTitle ? "Projects" : log.routineId ? "Routines" : "Other";
        xpByCategory[category] = (xpByCategory[category] || 0) + log.xpAwarded;
      }
    });

    return {
      xpByDay: last7Days.map(date => ({ date, xp: xpByDay[date], label: new Date(date).toLocaleDateString("en-US", { weekday: 'narrow' }) })),
      xpByCategory: Object.entries(xpByCategory).map(([name, xp]) => ({ name, xp })),
      logsByDate: Object.values(logsByDate).sort((a, b) => b.date.localeCompare(a.date)).filter(g => g.tasks.length > 0),
      totalWeeklyXp: Object.values(xpByDay).reduce((a, b) => a + b, 0),
    };
  }, [workLogs]);

  const gridData = useMemo(() => {
    if (!statsData?.activityGrid) return [];

    const days = [];
    const today = new Date();
    const end = new Date(today);
    const start = new Date(today);
    start.setDate(today.getDate() - 90);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const xp = statsData.activityGrid[dateStr] || 0;
      days.push({ date: dateStr, xp });
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [statsData]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.dark }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (!workLogs || workLogs.length === 0 || !stats) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: c.dark }]}>
        <MaterialIcons name="book" size={64} color={c.textMuted} />
        <Text style={[styles.emptyText, { color: c.text }]}>No activity in the last 7 days</Text>
        <Text style={[styles.emptySubtext, { color: c.textMuted }]}>
          Completed tasks and logged work will appear here.
        </Text>
      </View>
    );
  }

  const maxDailyXp = Math.max(...(stats?.xpByDay.map(d => d.xp) || [1]), 1);
  const catColors = [c.primary, c.secondary, c.accent];

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.dark }]} showsVerticalScrollIndicator={false}>
      {/* Streaks & Stats Row */}
      <View style={styles.topStatsRow}>
        <Card style={[styles.streakCard, { backgroundColor: c.surface }]}>
          <View style={styles.streakInfo}>
            <MaterialIcons name="local-fire-department" size={32} color={c.accent} />
            <View>
              <Text style={[styles.streakValue, { color: c.accent }]}>{statsData?.streak || 0}</Text>
              <Text style={[styles.streakLabel, { color: c.textMuted }]}>DAY STREAK</Text>
            </View>
          </View>
        </Card>
        <Card style={[styles.levelCard, { backgroundColor: c.surface }]}>
          <View style={styles.levelInfo}>
            <MaterialIcons name="stars" size={32} color={c.primary} />
            <View>
              <Text style={[styles.levelValue, { color: c.primary }]}>{statsData?.level || 1}</Text>
              <Text style={[styles.levelLabel, { color: c.textMuted }]}>CURRENT LEVEL</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Activity Grid */}
      <Card style={styles.gridCard}>
        <Text style={[styles.chartTitle, { color: c.textDim }]}>Activity Grid</Text>
        <View style={styles.gridContainer}>
          {gridData.map((week, wIdx) => (
            <View key={wIdx} style={styles.gridColumn}>
              {week.map((day) => {
                let color = c.gridEmpty;
                if (day.xp > 500) color = c.gridHigh;
                else if (day.xp > 200) color = c.gridMed;
                else if (day.xp > 0) color = c.gridLow;

                return (
                  <View key={day.date} style={[styles.gridSquare, { backgroundColor: color }]} />
                );
              })}
            </View>
          ))}
        </View>
        <View style={styles.gridLegend}>
          <Text style={[styles.legendText, { color: c.textMuted }]}>Less</Text>
          <View style={[styles.gridSquare, { backgroundColor: c.gridEmpty, marginHorizontal: 2 }]} />
          <View style={[styles.gridSquare, { backgroundColor: c.gridLow, marginHorizontal: 2 }]} />
          <View style={[styles.gridSquare, { backgroundColor: c.gridMed, marginHorizontal: 2 }]} />
          <View style={[styles.gridSquare, { backgroundColor: c.gridHigh, marginHorizontal: 2 }]} />
          <Text style={[styles.legendText, { color: c.textMuted }]}>More</Text>
        </View>
      </Card>

      {/* Weekly Charts */}
      <View style={styles.chartsRow}>
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: c.textDim }]}>Weekly XP</Text>
          <View style={styles.xpChartContainer}>
            <View style={[styles.goalLine, { bottom: (100 / maxDailyXp) * 60 + 26, borderColor: c.primaryGlow }]} />
            <View style={styles.xpChart}>
              {stats.xpByDay.map((day) => (
                <View key={day.date} style={styles.chartColumn}>
                  {day.xp > 0 && <Text style={[styles.barValue, { color: c.primary }]}>{day.xp}</Text>}
                  <View style={[styles.chartBarTrack, { backgroundColor: c.surface }]}>
                    <View style={[styles.chartBar, { height: (day.xp / maxDailyXp) * 60 + 2, backgroundColor: c.primary }]} />
                  </View>
                  <Text style={[styles.chartLabel, { color: c.textMuted }]}>{day.label}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={[styles.chartTotal, { color: c.textDim }]}>{stats.totalWeeklyXp} XP · {Math.round(stats.totalWeeklyXp / 7)} Avg/day</Text>
        </Card>

        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: c.textDim }]}>Activity</Text>
          <View style={styles.categoryList}>
            {stats.xpByCategory.map((cat, i) => (
              <View key={cat.name} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryNameRow}>
                    <View style={[styles.categoryDot, { backgroundColor: catColors[i % catColors.length] }]} />
                    <Text style={[styles.categoryName, { color: c.text }]} numberOfLines={1}>{cat.name}</Text>
                  </View>
                  <Text style={[styles.categoryXp, { color: c.text }]}>+{cat.xp}</Text>
                </View>
                <View style={[styles.categoryBarContainer, { backgroundColor: c.surface }]}>
                  <View style={[styles.categoryBar, { width: `${(cat.xp / stats.totalWeeklyXp) * 100}%`, backgroundColor: catColors[i % catColors.length] }]} />
                </View>
              </View>
            ))}
          </View>
        </Card>
      </View>

      {/* Grouped Logs */}
      {stats.logsByDate.map((dateGroup) => (
        <View key={dateGroup.date} style={styles.dateSection}>
          <View style={styles.dateHeaderRow}>
            <Text style={[styles.dateHeader, { color: c.primary }]}>{dateGroup.displayDate}</Text>
            <Badge label={`+${dateGroup.totalXp} XP`} variant="success" />
          </View>

          <Card style={[styles.dateCard, { borderColor: c.border, backgroundColor: c.darkest }]}>
            {dateGroup.tasks.map((taskGroup, tIdx) => (
              <View key={taskGroup.taskId || tIdx} style={[styles.taskGroup, { backgroundColor: c.primaryMuted }, tIdx > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                <View style={styles.taskTitleRow}>
                  <MaterialIcons name={taskGroup.taskId ? "assignment" : "schedule"} size={16} color={c.primary} />
                  <Text style={[styles.taskTitleText, { color: c.primary }]}>{taskGroup.taskTitle}</Text>
                </View>

                {taskGroup.logs.map((log) => (
                  <View key={log.id} style={styles.logItem}>
                    <Text style={[styles.logText, { color: c.text }]}>{log.logText}</Text>
                    <Text style={[styles.logTime, { color: c.textDim }]}>
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </Card>
        </View>
      ))}

      <View style={styles.spacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: "600", marginTop: 16, textAlign: "center" },
  emptySubtext: { fontSize: 14, marginTop: 8, marginBottom: 24, textAlign: "center" },
  spacing: { height: 40 },
  topStatsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  streakCard: { flex: 1, padding: 16 },
  streakInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  streakValue: { fontSize: 24, fontWeight: "900" },
  streakLabel: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  levelCard: { flex: 1, padding: 16 },
  levelInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  levelValue: { fontSize: 24, fontWeight: "900" },
  levelLabel: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  gridCard: { padding: 16, marginBottom: 20 },
  gridContainer: { flexDirection: "row", gap: 3, justifyContent: "center", marginBottom: 12 },
  gridColumn: { gap: 3 },
  gridSquare: { width: 10, height: 10, borderRadius: 2 },
  gridLegend: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 8 },
  legendText: { fontSize: 10, marginHorizontal: 4 },
  chartsRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  chartCard: { flex: 1, padding: 12 },
  chartTitle: { fontSize: 11, fontWeight: "800", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 },
  xpChartContainer: { height: 100, justifyContent: "flex-end", position: "relative" },
  goalLine: { position: "absolute", left: 0, right: 0, height: 1, borderWidth: 0.5, borderStyle: "dashed", zIndex: 1 },
  xpChart: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 80, paddingHorizontal: 2, zIndex: 2 },
  chartColumn: { alignItems: "center", gap: 4 },
  barValue: { fontSize: 9, fontWeight: "700", marginBottom: 2 },
  chartBarTrack: { width: 10, height: 60, borderRadius: 5, justifyContent: "flex-end", overflow: "hidden" },
  chartBar: { width: "100%", borderRadius: 5 },
  chartLabel: { fontSize: 10, fontWeight: "600" },
  chartTotal: { fontSize: 10, fontWeight: "700", marginTop: 12, textAlign: "center" },
  categoryList: { gap: 12 },
  categoryItem: { gap: 6 },
  categoryInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoryNameRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  categoryDot: { width: 6, height: 6, borderRadius: 3 },
  categoryName: { fontSize: 11, fontWeight: "600" },
  categoryXp: { fontSize: 11, fontWeight: "700" },
  categoryBarContainer: { height: 6, borderRadius: 3, overflow: "hidden" },
  categoryBar: { height: "100%", borderRadius: 3 },
  dateSection: { marginBottom: 32 },
  dateHeader: { fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },
  dateHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingHorizontal: 4 },
  dateCard: { padding: 0, overflow: "hidden", borderRadius: 16, borderWidth: 1 },
  taskGroup: { padding: 16 },
  taskTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  taskTitleText: { fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },
  logItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingLeft: 26, marginBottom: 8 },
  logText: { fontSize: 14, lineHeight: 20, flex: 1, marginRight: 16, fontWeight: "400" },
  logTime: { fontSize: 11, fontWeight: "600", marginTop: 4 },
});
