import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useWorkLogs } from "@/hooks/useDashboard";
import { useAppStore } from "@/stores/appStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface GroupedLogs {
  [date: string]: Array<{
    id: string;
    logText: string;
    xpAwarded: number;
    createdAt: string;
  }>;
}

export default function DiaryScreen() {
  const { data: workLogs, isLoading } = useWorkLogs(50);
  const setLogWorkModalOpen = useAppStore((state) => state.setLogWorkModalOpen);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#58CC02" />
      </View>
    );
  }

  if (!workLogs || workLogs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="book" size={64} color="#6B7280" />
        <Text style={styles.emptyText}>No work logs yet</Text>
        <Text style={styles.emptySubtext}>
          Start logging your work to see it here
        </Text>
        <Button
          title="Log Your First Work"
          onPress={() => setLogWorkModalOpen(true)}
          size="medium"
        />
      </View>
    );
  }

  // Group logs by date
  const groupedLogs: GroupedLogs = workLogs.reduce(
    (acc: GroupedLogs, log: { id: string; logText: string; xpAwarded: number; createdAt: string }) => {
      const date = new Date(log.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(log);
      return acc;
    },
    {} as GroupedLogs
  );

  const dates = Object.keys(groupedLogs);
  const totalXp = workLogs.reduce((sum: number, log: { xpAwarded: number }) => sum + log.xpAwarded, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Stats */}
      <Card className="mb-lg">
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Entries</Text>
            <Text style={styles.statValue}>{workLogs.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total XP</Text>
            <Text style={styles.statValue}>+{totalXp}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Days Logged</Text>
            <Text style={styles.statValue}>{dates.length}</Text>
          </View>
        </View>
        <Button
          title="Log Work"
          onPress={() => setLogWorkModalOpen(true)}
          size="medium"
        />
      </Card>

      {/* Work Logs by Date */}
      {dates.map((date) => (
        <View key={date} style={styles.dateSection}>
          <Text style={styles.dateHeader}>{date}</Text>
          <Card>
            <View style={styles.logsList}>
              {groupedLogs[date].map((log, idx) => (
                <View key={log.id} style={styles.logEntry}>
                  <View style={styles.logTimelineMarker}>
                    <View style={styles.marker} />
                    {idx < groupedLogs[date].length - 1 && (
                      <View style={styles.line} />
                    )}
                  </View>
                  <View style={styles.logContent}>
                    <Text style={styles.logText}>{log.logText}</Text>
                    <View style={styles.logMeta}>
                      <Text style={styles.logTime}>
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      {log.xpAwarded > 0 && (
                        <Badge
                          label={`+${log.xpAwarded} XP`}
                          variant="success"
                        />
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
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
  statsContainer: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
    marginBottom: 16,
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
    fontSize: 20,
    fontWeight: "700",
  },
  dateSection: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#58CC02",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  logsList: {
    gap: 0,
  },
  logEntry: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  logTimelineMarker: {
    alignItems: "center",
    marginRight: 16,
    width: 24,
  },
  marker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#58CC02",
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#374151",
    marginTop: 8,
  },
  logContent: {
    flex: 1,
  },
  logText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#E5E7EB",
    marginBottom: 4,
  },
  logMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  spacing: {
    height: 20,
  },
});
