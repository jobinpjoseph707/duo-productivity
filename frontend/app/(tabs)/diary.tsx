import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { useProductivityStats, useWorkLogs } from "@/hooks/useDashboard";
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

        // Group by task
        let taskGroup = logsByDate[date].tasks.find((t: TaskGroup) => t.taskId === log.taskId);
        if (!taskGroup) {
          taskGroup = { taskId: log.taskId || null, taskTitle: log.taskTitle || "General", logs: [] };
          logsByDate[date].tasks.push(taskGroup);
        }
        taskGroup.logs.push(log as any);

        // Aggregate by simple "Category" (placeholder categorization)
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

  // Activity Grid Data (last 13 weeks / 91 days)
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#58CC02" />
      </View>
    );
  }

  if (!workLogs || workLogs.length === 0 || !stats) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="book" size={64} color="#6B7280" />
        <Text style={styles.emptyText}>No activity in the last 7 days</Text>
        <Text style={styles.emptySubtext}>
          Completed tasks and logged work will appear here.
        </Text>
      </View>
    );
  }

  const maxDailyXp = Math.max(...(stats?.xpByDay.map(d => d.xp) || [1]), 1);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Streaks & Stats Row */}
      <View style={styles.topStatsRow}>
        <Card style={styles.streakCard}>
          <View style={styles.streakInfo}>
            <MaterialIcons name="local-fire-department" size={32} color="#FF9600" />
            <View>
              <Text style={styles.streakValue}>{statsData?.streak || 0}</Text>
              <Text style={styles.streakLabel}>DAY STREAK</Text>
            </View>
          </View>
        </Card>
        <Card style={styles.levelCard}>
          <View style={styles.levelInfo}>
            <MaterialIcons name="stars" size={32} color="#58CC02" />
            <View>
              <Text style={styles.levelValue}>{statsData?.level || 1}</Text>
              <Text style={styles.levelLabel}>CURRENT LEVEL</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Activity Grid (GitHub Style) */}
      <Card style={styles.gridCard}>
        <Text style={styles.chartTitle}>Activity Grid</Text>
        <View style={styles.gridContainer}>
          {gridData.map((week, wIdx) => (
            <View key={wIdx} style={styles.gridColumn}>
              {week.map((day) => {
                let color = "#1A2C34";
                if (day.xp > 500) color = "#58CC02";
                else if (day.xp > 200) color = "#46A302";
                else if (day.xp > 0) color = "#2F6D01";

                return (
                  <View
                    key={day.date}
                    style={[styles.gridSquare, { backgroundColor: color }]}
                  />
                );
              })}
            </View>
          ))}
        </View>
        <View style={styles.gridLegend}>
          <Text style={styles.legendText}>Less</Text>
          <View style={[styles.gridSquare, { backgroundColor: "#1A2C34", marginHorizontal: 2 }]} />
          <View style={[styles.gridSquare, { backgroundColor: "#2F6D01", marginHorizontal: 2 }]} />
          <View style={[styles.gridSquare, { backgroundColor: "#46A302", marginHorizontal: 2 }]} />
          <View style={[styles.gridSquare, { backgroundColor: "#58CC02", marginHorizontal: 2 }]} />
          <Text style={styles.legendText}>More</Text>
        </View>
      </Card>

      {/* Weekly Charts */}
      <View style={styles.chartsRow}>
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly XP</Text>
          <View style={styles.xpChartContainer}>
            {/* Goal Line (Target: 100 XP) */}
            <View style={[styles.goalLine, { bottom: (100 / maxDailyXp) * 60 + 26 }]} />

            <View style={styles.xpChart}>
              {stats.xpByDay.map((day, i) => (
                <View key={day.date} style={styles.chartColumn}>
                  {day.xp > 0 && (
                    <Text style={styles.barValue}>{day.xp}</Text>
                  )}
                  <View style={styles.chartBarTrack}>
                    <View style={[styles.chartBar, { height: (day.xp / maxDailyXp) * 60 + 2 }]} />
                  </View>
                  <Text style={styles.chartLabel}>{day.label}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.chartTotal}>{stats.totalWeeklyXp} XP · {Math.round(stats.totalWeeklyXp / 7)} Avg/day</Text>
        </Card>

        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Activity</Text>
          <View style={styles.categoryList}>
            {stats.xpByCategory.map((cat, i) => (
              <View key={cat.name} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryNameRow}>
                    <View style={[styles.categoryDot, { backgroundColor: i === 0 ? "#58CC02" : i === 1 ? "#3B82F6" : "#F59E0B" }]} />
                    <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                  </View>
                  <Text style={styles.categoryXp}>+{cat.xp}</Text>
                </View>
                <View style={styles.categoryBarContainer}>
                  <View style={[styles.categoryBar, { width: `${(cat.xp / stats.totalWeeklyXp) * 100}%`, backgroundColor: i === 0 ? "#58CC02" : i === 1 ? "#3B82F6" : "#F59E0B" }]} />
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
            <Text style={styles.dateHeader}>{dateGroup.displayDate}</Text>
            <Badge label={`+${dateGroup.totalXp} XP`} variant="success" />
          </View>

          <Card style={styles.dateCard}>
            {dateGroup.tasks.map((taskGroup, tIdx) => (
              <View key={taskGroup.taskId || tIdx} style={[styles.taskGroup, tIdx > 0 && styles.taskGroupBorder]}>
                <View style={styles.taskTitleRow}>
                  <MaterialIcons name={taskGroup.taskId ? "assignment" : "schedule"} size={16} color="#58CC02" />
                  <Text style={styles.taskTitleText}>{taskGroup.taskTitle}</Text>
                </View>

                {taskGroup.logs.map((log) => (
                  <View key={log.id} style={styles.logItem}>
                    <Text style={styles.logText}>{log.logText}</Text>
                    <Text style={styles.logTime}>
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
  emptyContainer: {
    flex: 1,
    backgroundColor: "#131F24",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#E5E7EB",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
  },
  spacing: {
    height: 40,
  },
  topStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  streakCard: {
    flex: 1,
    padding: 16,
    backgroundColor: "#1A2C34",
  },
  streakInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FF9600",
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  levelCard: {
    flex: 1,
    padding: 16,
    backgroundColor: "#1A2C34",
  },
  levelInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  levelValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#58CC02",
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  gridCard: {
    padding: 16,
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: "row",
    gap: 3,
    justifyContent: "center",
    marginBottom: 12,
  },
  gridColumn: {
    gap: 3,
  },
  gridSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  gridLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  legendText: {
    fontSize: 10,
    color: "#6B7280",
    marginHorizontal: 4,
  },
  chartsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  chartCard: {
    flex: 1,
    padding: 12,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4B5563",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  xpChartContainer: {
    height: 100,
    justifyContent: "flex-end",
    position: "relative",
  },
  goalLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    borderWidth: 0.5,
    borderColor: "rgba(88, 204, 2, 0.2)",
    borderStyle: "dashed",
    zIndex: 1,
  },
  xpChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 80,
    paddingHorizontal: 2,
    zIndex: 2,
  },
  chartColumn: {
    alignItems: "center",
    gap: 4,
  },
  barValue: {
    fontSize: 9,
    fontWeight: "700",
    color: "#58CC02",
    marginBottom: 2,
  },
  chartBarTrack: {
    width: 10,
    height: 60,
    backgroundColor: "#1A2C34",
    borderRadius: 5,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  chartBar: {
    width: "100%",
    backgroundColor: "#58CC02",
    borderRadius: 5,
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
  },
  chartTotal: {
    fontSize: 10,
    fontWeight: "700",
    color: "#4B5563",
    marginTop: 12,
    textAlign: "center",
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    gap: 6,
  },
  categoryInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#E5E7EB",
  },
  categoryXp: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E5E7EB",
  },
  categoryBarContainer: {
    height: 6,
    backgroundColor: "#1A2C34",
    borderRadius: 3,
    overflow: "hidden",
  },
  categoryBar: {
    height: "100%",
    borderRadius: 3,
  },
  dateSection: {
    marginBottom: 32,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: "800",
    color: "#58CC02",
    letterSpacing: 0.5,
  },
  dateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateCard: {
    padding: 0,
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1A2C34",
    backgroundColor: "#0F1419",
  },
  taskGroup: {
    padding: 16,
    backgroundColor: "rgba(88, 204, 2, 0.03)", // Very subtle green tint
  },
  taskGroupBorder: {
    borderTopWidth: 1,
    borderTopColor: "#1A2C34",
  },
  taskTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  taskTitleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#58CC02",
    letterSpacing: 0.3,
  },
  logItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingLeft: 26,
    marginBottom: 8,
  },
  logText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#E5E7EB",
    flex: 1,
    marginRight: 16,
    fontWeight: "400",
  },
  logTime: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4B5563",
    marginTop: 4,
  },
});
