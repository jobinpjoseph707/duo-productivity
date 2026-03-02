import { useAppStore } from '@/stores/appStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Quest {
    id: string;
    title: string;
    projectId: string;
    projectName: string;
    status: string;
    isPlanned: boolean;
    priority: number;
    categoryName?: string;
    categoryColor?: string;
}

interface CategoryQuestsProps {
    quests: Quest[];
}

export function CategoryQuests({ quests }: CategoryQuestsProps) {
    const setLogWorkModalOpen = useAppStore((state) => state.setLogWorkModalOpen);

    if (!quests || quests.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No quests planned for today. Enjoy your day! 🎉</Text>
            </View>
        );
    }

    // Group quests by category name (we assume the backend now provides this, 
    // or we group them into a default "Uncategorized" bucket for now)
    const groupedQuests = quests.reduce((acc: Record<string, Quest[]>, quest) => {
        const catName = quest.categoryName || 'General';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(quest);
        return acc;
    }, {});

    return (
        <View style={styles.container}>
            {Object.entries(groupedQuests).map(([categoryName, categoryQuests]) => {
                const color = categoryQuests[0]?.categoryColor || '#58CC02';

                return (
                    <View key={categoryName} style={styles.categoryGroup}>
                        <View style={styles.headerRow}>
                            <View style={[styles.colorDot, { backgroundColor: color }]} />
                            <Text style={[styles.categoryTitle, { color }]}>{categoryName}</Text>
                        </View>

                        <View style={styles.questList}>
                            {categoryQuests.map((quest) => (
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
                                    <View style={[styles.questCheckbox, quest.status === 'completed' && { backgroundColor: color, borderColor: color }]}>
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
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emptyContainer: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A2C34',
        borderRadius: 12,
        marginTop: 16,
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 14,
        textAlign: 'center',
    },
    categoryGroup: {
        marginBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    colorDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    categoryTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    questList: {
        gap: 8,
    },
    questItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A2C34',
        padding: 12,
        borderRadius: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: '#2A3C44',
    },
    questCheckbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
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
