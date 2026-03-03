import { PathNode } from '@/components/gamification/PathNode';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useDailyQuests } from '@/hooks/useDailyQuests';
import { useCategories, useProjects, useProjectTasks } from '@/hooks/useProjects';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/appStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function getLocalDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function ProjectsScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const { data: projects, isLoading: isProjectsLoading } = useProjects();
  const { data: categories } = useCategories();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const { data: tasks, isLoading: isTasksLoading } = useProjectTasks(selectedProjectId);
  const { planQuest } = useDailyQuests();
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const activeTaskId = useAppStore((state) => state.activeTaskId);
  const setActiveProjectId = useAppStore((state) => state.setActiveProjectId);
  const setActiveTaskId = useAppStore((state) => state.setActiveTaskId);
  const showNotification = useAppStore((state) => state.showNotification);

  const handleSetPriority = async (projectId: string, currentPriority: number) => {
    const newPriority = currentPriority > 0 ? 0 : 1;
    await planQuest({ projectId, priority: newPriority });
    showNotification(newPriority > 0 ? 'Project prioritized!' : 'Priority removed', 'info');
  };

  const handlePlanTask = async (taskId: string) => {
    const today = getLocalDateString();
    await planQuest({ taskId, plannedDate: today });
    showNotification('Task planned for today!', 'success');
  };

  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
    if (activeTaskId) {
      setShowAllTasks(true);
    }
  }, [activeProjectId, activeTaskId]);

  if (isProjectsLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.dark }]}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: c.dark }]}>
        <MaterialIcons name="folder-open" size={64} color={c.textMuted} />
        <Text style={[styles.emptyText, { color: c.text }]}>No projects yet</Text>
        <Text style={[styles.emptySubtext, { color: c.textMuted }]}>Start by creating a project</Text>
      </View>
    );
  }

  const filteredProjects = selectedCategoryId
    ? projects.filter((p) => p.category_id === selectedCategoryId)
    : projects;

  const selectedProject = filteredProjects.find((p) => p.id === selectedProjectId) || filteredProjects[0];
  const projectTasks = tasks || [];
  const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
  const progressPercentage = projectTasks.length > 0 ? (completedCount / projectTasks.length) * 100 : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.dark }]} showsVerticalScrollIndicator={false}>
      {/* Category Filter Chips */}
      {categories && categories.length > 0 && (
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, { backgroundColor: c.surface, borderColor: c.borderLight }, !selectedCategoryId && { backgroundColor: c.primaryMuted, borderColor: c.primary }]}
              onPress={() => setSelectedCategoryId(null)}
            >
              <Text style={[styles.filterChipText, { color: c.textSecondary }, !selectedCategoryId && { color: c.primary }]}>All</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: c.surface, borderColor: c.borderLight },
                  selectedCategoryId === cat.id && { backgroundColor: c.primaryMuted, borderColor: cat.color },
                ]}
                onPress={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
              >
                <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                <Text style={[styles.filterChipText, { color: c.textSecondary }, selectedCategoryId === cat.id && { color: cat.color }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Projects List */}
      <View style={styles.projectsSection}>
        <Text style={[styles.sectionTitle, { color: c.primary }]}>
          Your Projects {selectedCategoryId ? `(${filteredProjects.length})` : ''}
        </Text>
        <FlatList
          scrollEnabled={false}
          data={filteredProjects}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.projectItem,
                { backgroundColor: c.surface, borderColor: c.borderLight },
                selectedProjectId === item.id && { backgroundColor: c.primaryMuted, borderColor: c.primary },
              ]}
              onPress={() => { setSelectedProjectId(item.id); setActiveProjectId(item.id); }}
            >
              <View style={styles.projectInfo}>
                <Text style={[styles.projectName, { color: c.text }]}>{item.name}</Text>
                <Text style={[styles.projectDesc, { color: c.textMuted }]} numberOfLines={1}>{item.description}</Text>
              </View>
              <View style={styles.projectListMeta}>
                <TouchableOpacity onPress={() => handleSetPriority(item.id, item.priority || 0)} style={styles.priorityBtn}>
                  <MaterialIcons name={item.priority > 0 ? "star" : "star-border"} size={22} color={item.priority > 0 ? c.accent : c.textMuted} />
                </TouchableOpacity>
                <Badge label={item.status} variant={item.status === 'active' ? 'success' : 'warning'} />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyFilterContainer}>
              <Text style={[styles.emptyFilterText, { color: c.textMuted }]}>No projects in this category</Text>
            </View>
          }
        />
      </View>

      {/* Selected Project Details */}
      {selectedProject && (
        <Card>
          <View style={styles.projectHeader}>
            <View>
              <Text style={[styles.projectTitle, { color: c.text }]}>{selectedProject.name}</Text>
              <Text style={[styles.projectHeaderMeta, { color: c.textMuted }]}>{completedCount} of {projectTasks.length} tasks</Text>
            </View>
            <View style={[styles.progressCircle, { backgroundColor: c.primary }]}>
              <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
            </View>
          </View>
          <View style={[styles.progressBarContainer, { backgroundColor: c.darkest }]}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%`, backgroundColor: c.primary }]} />
          </View>
        </Card>
      )}

      {/* Task Path */}
      {projectTasks && projectTasks.length > 0 && (
        <Card>
          <Text style={[styles.sectionTitle, { color: c.primary }]}>Task Path</Text>
          <View style={styles.pathContainer}>
            {projectTasks.slice(0, showAllTasks ? projectTasks.length : 5).map((task, index) => (
              <View key={task.id} style={styles.nodeWrapper}>
                {index > 0 && <View style={[styles.connector, { backgroundColor: c.primary }]} />}
                <PathNode
                  nodeNumber={index + 1}
                  title={task.title}
                  completed={task.status === 'completed'}
                  onPress={() => { useAppStore.setState({ activeTaskId: task.id }); }}
                />
              </View>
            ))}
          </View>
          {projectTasks.length > 5 && (
            <TouchableOpacity style={[styles.expandButton, { borderTopColor: c.borderLight }]} onPress={() => setShowAllTasks(!showAllTasks)}>
              <Text style={[styles.expandButtonText, { color: c.primary }]}>
                {showAllTasks ? 'Show Less' : `Show All ${projectTasks.length} Tasks`}
              </Text>
              <MaterialIcons name={showAllTasks ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color={c.primary} />
            </TouchableOpacity>
          )}
        </Card>
      )}

      {/* Task Details */}
      {projectTasks && projectTasks.length > 0 && (
        <Card>
          <Text style={[styles.sectionTitle, { color: c.primary }]}>Tasks</Text>
          <View style={styles.tasksList}>
            {projectTasks.map((task) => (
              <View
                key={task.id}
                style={[
                  styles.taskItem,
                  { borderBottomColor: c.border },
                  activeTaskId === task.id && { backgroundColor: c.primaryMuted, borderLeftWidth: 4, borderLeftColor: c.primary, paddingLeft: 8 },
                ]}
              >
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, { color: c.text }, activeTaskId === task.id && { color: c.primary }]}>{task.title}</Text>
                  {task.description && <Text style={[styles.taskDesc, { color: c.textMuted }]}>{task.description}</Text>}
                  <View style={styles.taskFooter}>
                    <TouchableOpacity style={[styles.planBtn, { backgroundColor: c.primaryMuted }]} onPress={() => handlePlanTask(task.id)}>
                      <MaterialIcons name="calendar-today" size={14} color={c.primary} />
                      <Text style={[styles.planBtnText, { color: c.primary }]}>Plan for Today</Text>
                    </TouchableOpacity>
                    {task.status !== 'completed' && <Text style={[styles.taskStatus, { color: c.textMuted }]}>{task.status}</Text>}
                  </View>
                </View>
                <Badge label={task.status} variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'primary'} />
              </View>
            ))}
          </View>
        </Card>
      )}

      <View style={styles.spacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16, textAlign: 'center' },
  emptySubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  filterSection: { marginBottom: 16 },
  filterScroll: { flexDirection: 'row' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  filterChipText: { fontSize: 13, fontWeight: '500' },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  emptyFilterContainer: { paddingVertical: 32, alignItems: 'center' },
  emptyFilterText: { fontSize: 14 },
  projectsSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  projectItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8, borderRadius: 8, borderWidth: 1 },
  projectInfo: { flex: 1 },
  projectName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  projectDesc: { fontSize: 12 },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  projectTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  projectHeaderMeta: { fontSize: 13 },
  progressCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  progressText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  progressBarContainer: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%' },
  pathContainer: { alignItems: 'center', paddingVertical: 16 },
  nodeWrapper: { alignItems: 'center', marginVertical: 12 },
  connector: { width: 2, height: 30, marginBottom: 12 },
  tasksList: { gap: 12 },
  taskItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  taskDesc: { fontSize: 12, marginBottom: 4 },
  spacing: { height: 20 },
  expandButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginTop: 8, borderTopWidth: 1, gap: 4 },
  expandButtonText: { fontSize: 13, fontWeight: '600' },
  priorityBtn: { padding: 4 },
  projectListMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  taskFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  planBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  planBtnText: { fontSize: 11, fontWeight: '700' },
  taskStatus: { fontSize: 11, textTransform: 'capitalize' },
});
