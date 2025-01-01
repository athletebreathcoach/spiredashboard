import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { createSection, updateSection } from '../firebase/sections';
import { auth } from '../config/firebase';

const ACTIVITY_TYPES = [
  { id: 'exercises', label: 'Exercise', icon: 'barbell-outline' },
  { id: 'breathProtocols', label: 'Breath Protocol', icon: 'fitness-outline' },
  { id: 'breathingTests', label: 'Breathing Test', icon: 'pulse-outline' },
  { id: 'habitstasks', label: 'Habits & Tasks', icon: 'checkbox-outline' },
  { id: 'guidedSessions', label: 'Guided Session', icon: 'play-circle-outline' },
];

const SUPERSET_COLORS = [
  '#4CAF50',  // Green
  '#2196F3',  // Blue
  '#9C27B0',  // Purple
  '#FF9800',  // Orange
  '#E91E63',  // Pink
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.medium,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    marginTop: 40,
  },
  backButton: {
    padding: Layout.spacing.small,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    textAlign: 'center',
    color: '#fff',
  },
  headerButton: {
    padding: Layout.spacing.small,
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.medium,
  },
  activityCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.medium,
    marginBottom: Layout.spacing.medium,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: Layout.spacing.medium,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 18,
    fontFamily: Typography.fonts.medium,
    flex: 1,
    color: '#fff',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.medium,
  },
  metricColumn: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: Typography.fonts.medium,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: Typography.fonts.medium,
    color: '#fff',
  },
  metricInput: {
    fontSize: 20,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
    width: 60,
    padding: 0,
    color: '#fff',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.small,
  },
  addSetText: {
    color: '#4CAF50',
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
    marginLeft: Layout.spacing.small,
  },
  eachSideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    marginRight: Layout.spacing.small,
  },
  eachSideText: {
    fontSize: 16,
    color: '#666',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: Layout.spacing.small,
    borderRadius: Layout.borderRadius.medium,
  },
  notesInput: {
    fontSize: 16,
    color: '#fff',
    padding: Layout.spacing.small,
    height: 40,
    backgroundColor: '#2C2C2E',
    borderRadius: Layout.borderRadius.medium,
    marginTop: Layout.spacing.small,
  },
  bottomBar: {
    position: 'absolute',
    right: Layout.spacing.medium,
    bottom: Layout.spacing.medium,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  supersetDivider: {
    position: 'relative',
    height: 40,
    marginVertical: -20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  supersetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  menuButton: {
    padding: 8,
    borderRadius: 16,
  },
  menuOptions: {
    position: 'absolute',
    right: 0,
    top: 40,
    backgroundColor: '#2C2C2E',
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.small,
    zIndex: 2,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.small,
    gap: Layout.spacing.small,
  },
  menuOptionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
  menuOptionDelete: {
    color: '#FF453A',
  },
  sectionInfoContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.medium,
    marginBottom: Layout.spacing.medium,
  },
  titleInput: {
    fontSize: 24,
    fontFamily: Typography.fonts.semibold,
    color: '#fff',
    marginBottom: Layout.spacing.small,
  },
  descriptionInput: {
    fontSize: 16,
    fontFamily: Typography.fonts.regular,
    color: '#fff',
    minHeight: 60,
  },
  saveButton: {
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.medium,
  },
  saveButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  activityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moveButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  moveButtonDisabled: {
    opacity: 0.3,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.small,
  },
  supersetLabel: {
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
    marginRight: Layout.spacing.small,
  },
  expandButton: {
    position: 'absolute',
    right: Layout.spacing.small,
    padding: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButtonCollapsed: {
    bottom: Layout.spacing.medium,
  },
  expandButtonExpanded: {
    bottom: Layout.spacing.small,
  },
  metricsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: Layout.spacing.small,
    marginBottom: Layout.spacing.small,
    paddingRight: Layout.spacing.medium,
  },
  metricsPreviewText: {
    color: '#666',
    fontSize: 14,
    fontFamily: Typography.fonts.medium,
  },
  metricsPreviewDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
    marginHorizontal: Layout.spacing.small,
  },
  logButton: {
    position: 'absolute',
    bottom: Layout.spacing.large,
    left: Layout.spacing.large,
    right: Layout.spacing.large,
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
});

// Helper function to get metrics preview for an activity
const getMetricsPreview = (activity) => {
  if (!activity.metrics?.sets || activity.metrics.sets.length === 0) return [];
  
  const { sets, eachSide } = activity.metrics;
  
  // Format each set
  const setPreviews = sets.map((set, index) => {
    const parts = [];
    if (set.reps) parts.push(`${set.reps}`);
    if (set.weight) parts.push(`@ ${set.weight}lb`);
    return parts.join(' ');
  });

  // If all sets are the same, just show one number with the total sets
  const allSetsEqual = setPreviews.every(preview => preview === setPreviews[0]);
  let preview = allSetsEqual 
    ? [`${sets.length} x ${setPreviews[0]}`]
    : setPreviews;

  // Add each side indicator if needed
  if (eachSide) {
    preview.push('each side');
  }

  return preview;
};

// Helper function to get all superset chains
const getAllSupersetChains = (activities) => {
  const chains = [];
  const visited = new Set();

  activities.forEach((activity, index) => {
    if (!visited.has(index) && activity.supersetId) {
      const chain = [];
      const letter = activity.supersetId.charAt(0);
      
      // Find all activities in this superset group
      activities.forEach((a, i) => {
        if (a.supersetId && a.supersetId.charAt(0) === letter) {
          chain.push(i);
          visited.add(i);
        }
      });

      if (chain.length > 0) {
        chains.push(chain);
      }
    }
  });

  return chains;
};

// Helper function to get superset info for an activity
const getSupersetInfo = (activityIndex, activities) => {
  const chains = getAllSupersetChains(activities);
  for (let i = 0; i < chains.length; i++) {
    if (chains[i].includes(activityIndex)) {
      const activity = activities[activityIndex];
      return {
        color: SUPERSET_COLORS[i % SUPERSET_COLORS.length],
        label: activity.supersetId,
        isInSuperset: true
      };
    }
  }
  return { color: 'transparent', label: '', isInSuperset: false };
};

export default function SectionDetail({ navigation, route }) {
  const theme = useTheme();
  const [section, setSection] = useState(route.params.section || { title: '', description: '' });
  const [activities, setActivities] = useState(() => {
    if (route.params.section?.activities) {
      // Flatten activities and preserve supersetId
      const flattenedActivities = route.params.section.activities.reduce((acc, group) => 
        [...acc, ...(group.items || []).map(item => ({
          id: item.id,
          title: item.title,
          type: group.type,
          description: item.description || '',
          supersetId: item.supersetId,
          metrics: {
            sets: Array.isArray(item.metrics?.sets) ? item.metrics.sets.map(set => ({
              reps: set.reps || '',
              weight: set.weight || '',
              rest: set.rest || '00:00'
            })) : [{
              reps: '',
              weight: '',
              rest: '00:00'
            }],
            eachSide: item.metrics?.eachSide || false,
            notes: item.metrics?.notes || ''
          }
        }))], []
      );

      console.log('Loaded activities with supersets:', flattenedActivities);
      return flattenedActivities;
    }
    return [];
  });
  const [expandedCards, setExpandedCards] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const isLogging = route.params.isLogging;

  const handleUpdateSet = (activityIndex, setIndex, field, value) => {
    setActivities(current => {
      const updated = [...current];
      updated[activityIndex].metrics.sets[setIndex] = {
        ...updated[activityIndex].metrics.sets[setIndex],
        [field]: value
      };
      return updated;
    });
  };

  const syncSupersetSets = (activityIndex) => {
    setActivities(current => {
      const updated = [...current];
      const activity = updated[activityIndex];
      
      if (!activity.supersetId) return updated;
      
      // Find all activities in this superset
      const letter = activity.supersetId.charAt(0);
      const supersetActivities = updated.filter(a => 
        a.supersetId && a.supersetId.charAt(0) === letter
      );
      
      // Find the maximum number of sets in the superset
      const maxSets = Math.max(...supersetActivities.map(a => a.metrics.sets.length));
      
      // Sync all activities to have the same number of sets
      supersetActivities.forEach(a => {
        while (a.metrics.sets.length < maxSets) {
          a.metrics.sets.push({
            reps: '',
            weight: '',
            rest: '00:00'
          });
        }
      });
      
      return updated;
    });
  };

  const handleAddSet = (activityIndex) => {
    setActivities(current => {
      const updated = [...current];
      updated[activityIndex].metrics.sets.push({
        reps: '',
        weight: '',
        rest: '00:00'
      });
      return updated;
    });
    // Sync sets after adding a new one
    syncSupersetSets(activityIndex);
  };

  const handleToggleEachSide = (activityIndex) => {
    setActivities(current => {
      const updated = [...current];
      updated[activityIndex].metrics.eachSide = !updated[activityIndex].metrics.eachSide;
      return updated;
    });
  };

  const toggleCardExpansion = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleToggleSuperset = (index) => {
    const currentItem = activities[index];
    const nextItem = activities[index + 1];

    if (!currentItem || !nextItem) return;

    setActivities(current => {
      const updated = [...current];
      
      // If they're already in a superset
      if (currentItem.supersetId) {
        const letter = currentItem.supersetId.charAt(0);
        
        // If next item is not in this superset, add it
        if (!nextItem.supersetId || nextItem.supersetId.charAt(0) !== letter) {
          // Find the highest number in this superset
          let maxNumber = 0;
          updated.forEach(item => {
            if (item.supersetId && item.supersetId.charAt(0) === letter) {
              const num = parseInt(item.supersetId.slice(1));
              maxNumber = Math.max(maxNumber, num);
            }
          });
          
          // Add next item to this superset with next number
          nextItem.supersetId = `${letter}${maxNumber + 1}`;
        } else {
          // If next item is already in this superset, remove it
          delete nextItem.supersetId;
          
          // If only one item remains in superset, remove the superset entirely
          const remainingInSuperset = updated.filter(item => 
            item.supersetId && item.supersetId.charAt(0) === letter
          ).length;
          
          if (remainingInSuperset <= 1) {
            updated.forEach(item => {
              if (item.supersetId && item.supersetId.charAt(0) === letter) {
                delete item.supersetId;
              }
            });
          }
        }
      } else {
        // Create new superset relationship
        const chains = getAllSupersetChains(current);
        const letter = String.fromCharCode(65 + chains.length);
        
        currentItem.supersetId = `${letter}1`;
        nextItem.supersetId = `${letter}2`;
      }
      
      return updated;
    });
  };

  const handleSave = () => {
    if (!section.title && !isLogging && !route.params.isScheduling) {
      Alert.alert('Required Field', 'Please enter a section title.');
      return;
    }

    // When logging or scheduling, return the updated activities
    if (isLogging || route.params.isScheduling) {
      route.params.onComplete?.(activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        type: activity.type,
        description: activity.description || '',
        supersetId: activity.supersetId,
        metrics: {
          sets: activity.metrics.sets,
          eachSide: activity.metrics.eachSide,
          notes: activity.metrics.notes,
          timeOfDay: route.params.timeOfDay
        }
      })));
      navigation.goBack();
      return;
    }

    // Normal save for editing/creating section
    const groupedActivities = ACTIVITY_TYPES.map(type => ({
      type: type.id,
      items: activities
        .filter(a => a.type === type.id)
        .map(activity => ({
          id: activity.id,
          title: activity.title,
          type: activity.type,
          description: activity.description || '',
          supersetId: activity.supersetId,
          metrics: {
            sets: activity.metrics.sets.map(set => ({
              reps: set.reps || '',
              weight: set.weight || '',
              rest: set.rest || '00:00'
            })),
            eachSide: activity.metrics.eachSide,
            notes: activity.metrics.notes
          }
        }))
    })).filter(group => group.items.length > 0);

    const sectionData = {
      ...section,
      activities: groupedActivities,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.uid,
      userId: auth.currentUser.uid,
      createdAt: section.createdAt || new Date().toISOString(),
      createdBy: section.createdBy || auth.currentUser.uid
    };

    console.log('Saving section data:', JSON.stringify(sectionData, null, 2));

    if (section.id) {
      updateSection(section.id, sectionData)
        .then(() => navigation.goBack())
        .catch(error => {
          console.error('Error updating section:', error);
          Alert.alert('Error', 'Failed to update section. Please try again.');
        });
    } else {
      createSection(sectionData)
        .then(() => navigation.goBack())
        .catch(error => {
          console.error('Error creating section:', error);
          Alert.alert('Error', 'Failed to create section. Please try again.');
        });
    }
  };

  const handleMoveActivity = (index, direction) => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === activities.length - 1)) {
      return;
    }

    setActivities(current => {
      const updated = [...current];
      const activity = updated[index];
      
      // If this activity is part of a superset, move the entire superset
      if (activity.supersetId) {
        const letter = activity.supersetId.charAt(0);
        const supersetIndices = updated
          .map((a, i) => a.supersetId?.charAt(0) === letter ? i : null)
          .filter(i => i !== null);
        
        if (direction === 'up') {
          // Check if we can move up
          if (supersetIndices[0] <= 0) return current;
          
          // Move each activity in the superset up one position
          const targetIndex = supersetIndices[0] - 1;
          const temp = updated[targetIndex];
          
          // Shift superset activities up
          for (let i = supersetIndices.length - 1; i >= 0; i--) {
            const currentIndex = supersetIndices[i];
            const targetIndex = currentIndex - 1;
            updated[targetIndex] = updated[currentIndex];
          }
          
          // Place the displaced activity at the end of the superset
          updated[supersetIndices[supersetIndices.length - 1]] = temp;
          
        } else {
          // Check if we can move down
          if (supersetIndices[supersetIndices.length - 1] >= updated.length - 1) return current;
          
          // Move each activity in the superset down one position
          const targetIndex = supersetIndices[supersetIndices.length - 1] + 1;
          const temp = updated[targetIndex];
          
          // Shift superset activities down
          for (let i = 0; i < supersetIndices.length; i++) {
            const currentIndex = supersetIndices[i];
            const targetIndex = currentIndex + 1;
            updated[targetIndex] = updated[currentIndex];
          }
          
          // Place the displaced activity at the start of the superset
          updated[supersetIndices[0]] = temp;
        }
      } else {
        // Handle moving a single activity
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        // Check if target position is in the middle of a superset
        const targetActivity = updated[newIndex];
        if (targetActivity.supersetId) {
          // Find the bounds of the superset
          const letter = targetActivity.supersetId.charAt(0);
          const supersetIndices = updated
            .map((a, i) => a.supersetId?.charAt(0) === letter ? i : null)
            .filter(i => i !== null);
          
          // Skip over the entire superset
          if (direction === 'up') {
            const targetIndex = supersetIndices[0] - 1;
            if (targetIndex < 0) return current;
            [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
          } else {
            const targetIndex = supersetIndices[supersetIndices.length - 1] + 1;
            if (targetIndex >= updated.length) return current;
            [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
          }
        } else {
          // Normal swap for non-superset items
          [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        }
      }
      
      return updated;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isLogging || route.params.isScheduling ? section.title : (section.id ? 'Edit Section' : 'Create Section')}
        </Text>
        {(isLogging || route.params.isScheduling) ? (
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: theme.colors.white }]}>
              {route.params.isScheduling ? 'Schedule' : 'Complete'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: theme.colors.white }]}>
              Save
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {!isLogging && (
          <View style={styles.sectionInfoContainer}>
            <TextInput
              style={styles.titleInput}
              placeholder="Section Title"
              placeholderTextColor="#666"
              value={section.title}
              onChangeText={(text) => setSection(prev => ({ ...prev, title: text }))}
            />
            <TextInput
              style={styles.descriptionInput}
              placeholder="Description (optional)"
              placeholderTextColor="#666"
              value={section.description}
              onChangeText={(text) => setSection(prev => ({ ...prev, description: text }))}
              multiline
            />
          </View>
        )}

        {activities.map((activity, activityIndex) => {
          const supersetInfo = getSupersetInfo(activityIndex, activities);
          const isExpanded = expandedCards[activityIndex];
          
          return (
            <React.Fragment key={activityIndex}>
              <View 
                style={[
                  styles.activityCard, 
                  { 
                    backgroundColor: theme.colors.surface,
                    borderLeftColor: supersetInfo.color,
                    marginBottom: supersetInfo.isInSuperset ? Layout.spacing.small : Layout.spacing.medium,
                  }
                ]}
              >
                <View style={styles.activityHeader}>
                  <View style={styles.activityIcon}>
                    <Ionicons 
                      name={ACTIVITY_TYPES.find(t => t.id === activity.type)?.icon || 'fitness'} 
                      size={24} 
                      color={supersetInfo.color === 'transparent' ? '#4CAF50' : supersetInfo.color}
                    />
                  </View>
                  <View style={styles.titleContainer}>
                    {supersetInfo.label && (
                      <Text style={[styles.supersetLabel, { color: supersetInfo.color }]}>
                        {supersetInfo.label}
                      </Text>
                    )}
                    <Text style={styles.activityTitle}>
                      {activity.title || activity.name}
                    </Text>
                  </View>
                  {!isLogging && (
                    <View style={styles.activityControls}>
                      <TouchableOpacity 
                        style={[styles.moveButton, activityIndex === 0 && styles.moveButtonDisabled]}
                        onPress={() => handleMoveActivity(activityIndex, 'up')}
                        disabled={activityIndex === 0}
                      >
                        <Ionicons 
                          name="chevron-up" 
                          size={20} 
                          color={activityIndex === 0 ? "#444" : "#666"} 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.moveButton, activityIndex === activities.length - 1 && styles.moveButtonDisabled]}
                        onPress={() => handleMoveActivity(activityIndex, 'down')}
                        disabled={activityIndex === activities.length - 1}
                      >
                        <Ionicons 
                          name="chevron-down" 
                          size={20} 
                          color={activityIndex === activities.length - 1 ? "#444" : "#666"} 
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.menuButton}
                        onPress={() => setMenuOpen(menuOpen === activityIndex ? null : activityIndex)}
                      >
                        <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {!isExpanded ? (
                  <View style={styles.metricsPreview}>
                    {getMetricsPreview(activity).map((preview, index, array) => (
                      <React.Fragment key={index}>
                        <Text style={styles.metricsPreviewText}>
                          {preview}
                        </Text>
                        {index < array.length - 1 && (
                          <View style={styles.metricsPreviewDot} />
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                ) : (
                  <>
                    {activity.metrics.sets.map((set, setIndex) => (
                      <View 
                        key={`${activityIndex}-set-${setIndex}`} 
                        style={styles.metricsRow}
                      >
                        <View style={styles.metricColumn}>
                          <Text style={styles.metricLabel}>SET</Text>
                          <Text style={styles.metricValue}>{setIndex + 1}</Text>
                        </View>
                        <View style={styles.metricColumn}>
                          <Text style={styles.metricLabel}>LB</Text>
                          <TextInput
                            style={styles.metricInput}
                            value={set.weight}
                            onChangeText={(value) => handleUpdateSet(activityIndex, setIndex, 'weight', value)}
                            keyboardType="numeric"
                            placeholder="-"
                          />
                        </View>
                        <View style={styles.metricColumn}>
                          <Text style={styles.metricLabel}>REPS</Text>
                          <TextInput
                            style={styles.metricInput}
                            value={set.reps}
                            onChangeText={(value) => handleUpdateSet(activityIndex, setIndex, 'reps', value)}
                            keyboardType="numeric"
                            placeholder="-"
                          />
                        </View>
                        <View style={styles.metricColumn}>
                          <Text style={styles.metricLabel}>REST</Text>
                          <TextInput
                            style={styles.metricInput}
                            value={set.rest}
                            onChangeText={(value) => handleUpdateSet(activityIndex, setIndex, 'rest', value)}
                            placeholder="00:00"
                          />
                        </View>
                      </View>
                    ))}

                    <TouchableOpacity 
                      style={styles.addSetButton}
                      onPress={() => handleAddSet(activityIndex)}
                    >
                      <Ionicons name="add" size={20} color="#6B4EFF" />
                      <Text style={styles.addSetText}>Add Set</Text>
                    </TouchableOpacity>

                    <View style={styles.eachSideRow}>
                      <TouchableOpacity 
                        style={[
                          styles.checkbox,
                          activity.metrics.eachSide && { backgroundColor: '#6B4EFF', borderColor: '#6B4EFF' }
                        ]}
                        onPress={() => handleToggleEachSide(activityIndex)}
                      >
                        {activity.metrics.eachSide && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </TouchableOpacity>
                      <Text style={styles.eachSideText}>Each side</Text>
                    </View>

                    <TextInput
                      style={styles.notesInput}
                      placeholder="Add note..."
                      value={activity.metrics.notes}
                      onChangeText={(value) => {
                        const updated = [...activities];
                        updated[activityIndex].metrics.notes = value;
                        setActivities(updated);
                      }}
                    />
                  </>
                )}

                <TouchableOpacity 
                  style={[
                    styles.expandButton,
                    isExpanded ? styles.expandButtonExpanded : styles.expandButtonCollapsed
                  ]}
                  onPress={() => toggleCardExpansion(activityIndex)}
                >
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              {!isLogging && activityIndex < activities.length - 1 && (
                <View style={styles.supersetDivider}>
                  <TouchableOpacity
                    style={[
                      styles.supersetButton,
                      activities[activityIndex].supersetWith === activityIndex + 1 && {
                        backgroundColor: SUPERSET_COLORS[
                          getAllSupersetChains(activities).findIndex(chain => 
                            chain.includes(activityIndex)
                          ) % SUPERSET_COLORS.length
                        ],
                        borderColor: 'transparent'
                      }
                    ]}
                    onPress={() => handleToggleSuperset(activityIndex)}
                  >
                    <Ionicons
                      name={activities[activityIndex].supersetWith === activityIndex + 1 ? "link" : "link-outline"}
                      size={20}
                      color={activities[activityIndex].supersetWith === activityIndex + 1 ? "#fff" : "#666"}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
} 