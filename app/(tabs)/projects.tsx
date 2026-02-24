import { View, Text, ScrollView, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useProjects, useProjectTasks } from '@/hooks/useProjects';
import { useAppStore } from '@/stores/appStore';
import { PathNode } from '@/components/gamification/PathNode';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function ProjectsScreen() {
  const { data: projects, isLoading: isProjectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { data: tasks, isLoading: isTasksLoading } = useProjectTasks(selectedProjectId);
  const setActiveProjectId = useAppStore((state) => state.setActiveProjectId);

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

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const projectTasks = tasks || [];

  const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
  const progressPercentage = projectTasks.length > 0 ? (completedCount / projectTasks.length) * 100 : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Projects List */}
      <View style={styles.projectsSection}>
        <Text style={styles.sectionTitle}>Your Projects</Text>
        <FlatList
          scrollEnabled={false}
          data={projects}
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
                <Text style={styles.projectDesc}>{item.description}</Text>
              </View>
              <Badge 
                label={item.status} 
                variant={item.status === 'active' ? 'success' : 'warning'}
              />
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Selected Project Details */}
      {selectedProject && (
        <Card className="mb-lg">
          <View style={styles.projectHeader}>
            <View>
              <Text style={styles.projectTitle}>{selectedProject.name}</Text>
              <Text style={styles.projectMeta}>
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
            {projectTasks.map((task, index) => (
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
        </Card>
      )}

      {/* Task Details */}
      {projectTasks && projectTasks.length > 0 && (
        <Card className="mb-lg">
          <Text style={styles.sectionTitle}>Tasks</Text>
          <View style={styles.tasksList}>
            {projectTasks.map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskContent}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.description && (
                    <Text style={styles.taskDesc}>{task.description}</Text>
                  )}
                  {task.due_date && (
                    <Text style={styles.taskDate}>Due: {task.due_date}</Text>
                  )}
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
  projectMeta: {
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
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 4,
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
});
