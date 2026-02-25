import { PathNode } from '@/components/gamification/PathNode';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useDailyQuests } from '@/hooks/useDailyQuests';
import { useCategories, useProjects, useProjectTasks } from '@/hooks/useProjects';
import { useAppStore } from '@/stores/appStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/** Get today's date as YYYY-MM-DD in local timezone */
function getLocalDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function ProjectsScreen() {
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

  // Sync with store state (from dashboard navigation)
  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
    if (activeTaskId) {
      setShowAllTasks(true); // Ensure task is visible if in the first 5 or more
    }
  }, [activeProjectId, activeTaskId]);

  const isLoading = isProjectsLoading;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#58CC02" />
      </View>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="folder-open" size={64} color="#6B7280" />
        <Text style={styles.emptyText}>No projects yet</Text>
        <Text style={styles.emptySubtext}>Start by creating a project</Text>
      </View>
    );
  }

  // Filter projects by selected category
  const filteredProjects = selectedCategoryId
    ? projects.filter((p) => p.category_id === selectedCategoryId)
    : projects;

  const selectedProject = filteredProjects.find((p) => p.id === selectedProjectId) || filteredProjects[0];
  const projectTasks = tasks || [];

  const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
  const progressPercentage = projectTasks.length > 0 ? (completedCount / projectTasks.length) * 100 : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Category Filter Chips */}
      {categories && categories.length > 0 && (
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !selectedCategoryId && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategoryId(null)}
            >
              <Text style={[
                styles.filterChipText,
                !selectedCategoryId && styles.filterChipTextActive,
              ]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  selectedCategoryId === cat.id && styles.filterChipActive,
                  selectedCategoryId === cat.id && { borderColor: cat.color },
                ]}
                onPress={() => setSelectedCategoryId(
                  selectedCategoryId === cat.id ? null : cat.id
                )}
              >
                <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                <Text style={[
                  styles.filterChipText,
                  selectedCategoryId === cat.id && { color: cat.color },
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Projects List */}
      <View style={styles.projectsSection}>
        <Text style={styles.sectionTitle}>
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
                selectedProjectId === item.id && styles.projectItemActive,
              ]}
              onPress={() => {
                setSelectedProjectId(item.id);
                setActiveProjectId(item.id);
              }}
            >
              <View style={styles.projectInfo}>
                <Text style={styles.projectName}>{item.name}</Text>
                <Text style={styles.projectDesc} numberOfLines={1}>{item.description}</Text>
              </View>
              <View style={styles.projectListMeta}>
                <TouchableOpacity
                  onPress={() => handleSetPriority(item.id, item.priority || 0)}
                  style={styles.priorityBtn}
                >
                  <MaterialIcons
                    name={item.priority > 0 ? "star" : "star-border"}
                    size={22}
                    color={item.priority > 0 ? "#FF9600" : "#6B7280"}
                  />
                </TouchableOpacity>
                <Badge
                  label={item.status}
                  variant={item.status === 'active' ? 'success' : 'warning'}
                />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyFilterContainer}>
              <Text style={styles.emptyFilterText}>No projects in this category</Text>
            </View>
          }
        />
      </View>

      {/* Selected Project Details */}
      {selectedProject && (
        <Card className="mb-lg">
          <View style={styles.projectHeader}>
            <View>
              <Text style={styles.projectTitle}>{selectedProject.name}</Text>
              <Text style={styles.projectHeaderMeta}>
                {completedCount} of {projectTasks.length} tasks
              </Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
          </View>
        </Card>
      )}

      {/* Task Path */}
      {projectTasks && projectTasks.length > 0 && (
        <Card className="mb-lg">
          <Text style={styles.sectionTitle}>Task Path</Text>
          <View style={styles.pathContainer}>
            {projectTasks.slice(0, showAllTasks ? projectTasks.length : 5).map((task, index) => (
              <View key={task.id} style={styles.nodeWrapper}>
                {index > 0 && <View style={styles.connector} />}
                <PathNode
                  nodeNumber={index + 1}
                  title={task.title}
                  completed={task.status === 'completed'}
                  onPress={() => {
                    useAppStore.setState({ activeTaskId: task.id });
                  }}
                />
              </View>
            ))}
          </View>
          {projectTasks.length > 5 && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setShowAllTasks(!showAllTasks)}
            >
              <Text style={styles.expandButtonText}>
                {showAllTasks ? 'Show Less' : `Show All ${projectTasks.length} Tasks`}
              </Text>
              <MaterialIcons
                name={showAllTasks ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={20}
                color="#58CC02"
              />
            </TouchableOpacity>
          )}
        </Card>
      )}

      {/* Task Details */}
      {projectTasks && projectTasks.length > 0 && (
        <Card className="mb-lg">
          <Text style={styles.sectionTitle}>Tasks</Text>
          <View style={styles.tasksList}>
            {projectTasks.map((task) => (
              <View
                key={task.id}
                style={[
                  styles.taskItem,
                  activeTaskId === task.id && styles.taskItemHighlighted
                ]}
              >
                <View style={styles.taskContent}>
                  <Text style={[
                    styles.taskTitle,
                    activeTaskId === task.id && styles.taskTitleHighlighted
                  ]}>{task.title}</Text>
                  {task.description && (
                    <Text style={styles.taskDesc}>{task.description}</Text>
                  )}
                  <View style={styles.taskFooter}>
                    <TouchableOpacity
                      style={styles.planBtn}
                      onPress={() => handlePlanTask(task.id)}
                    >
                      <MaterialIcons name="calendar-today" size={14} color="#58CC02" />
                      <Text style={styles.planBtnText}>Plan for Today</Text>
                    </TouchableOpacity>
                    {task.status !== 'completed' && (
                      <Text style={styles.taskStatus}>{task.status}</Text>
                    )}
                  </View>
                </View>
                <Badge
                  label={task.status}
                  variant={
                    task.status === 'completed'
                      ? 'success'
                      : task.status === 'in_progress'
                        ? 'warning'
                        : 'primary'
                  }
                />
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
  emptyContainer: {
    flex: 1,
    backgroundColor: '#131F24',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E5E7EB',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A2C34',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  filterChipActive: {
    backgroundColor: '#0F4C2F',
    borderColor: '#58CC02',
  },
  filterChipText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#58CC02',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyFilterContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyFilterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  projectsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#58CC02',
    marginBottom: 16,
  },
  projectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: '#1A2C34',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  projectItemActive: {
    backgroundColor: '#0F4C2F',
    borderColor: '#58CC02',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  projectDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  projectHeaderMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#58CC02',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#0F1419',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#58CC02',
  },
  pathContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  nodeWrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
  connector: {
    width: 2,
    height: 30,
    backgroundColor: '#58CC02',
    marginBottom: 12,
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2C34',
  },
  taskContent: {
    flex: 1,
  },
  taskItemHighlighted: {
    backgroundColor: 'rgba(88, 204, 2, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#58CC02',
    paddingLeft: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  taskTitleHighlighted: {
    color: '#58CC02',
  },
  taskDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  taskDate: {
    fontSize: 11,
    color: '#FF9600',
  },
  spacing: {
    height: 20,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    gap: 4,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#58CC02',
  },
  priorityBtn: {
    padding: 4,
  },
  projectListMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  planBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(88, 204, 2, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planBtnText: {
    fontSize: 11,
    color: '#58CC02',
    fontWeight: '700',
  },
  taskStatus: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
});
