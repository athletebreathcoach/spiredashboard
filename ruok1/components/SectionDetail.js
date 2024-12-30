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
});

// Helper function to get all superset chains
const getAllSupersetChains = (activities) => {
  const chains = [];
  const visited = new Set();

  activities.forEach((activity, index) => {
    if (!visited.has(index) && (activity.supersetWith !== null || 
        (index > 0 && activities[index - 1]?.supersetWith === index))) {
      // Find the start of the chain
      let startIndex = index;
      while (startIndex > 0 && activities[startIndex - 1]?.supersetWith === startIndex) {
        startIndex--;
      }
      
      // Get the full chain
      const chain = [];
      let currentIndex = startIndex;
      while (currentIndex < activities.length) {
        chain.push(currentIndex);
        visited.add(currentIndex);
        const nextIndex = activities[currentIndex].supersetWith;
        if (nextIndex === null || nextIndex <= currentIndex) break;
        currentIndex = nextIndex;
      }
      
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
    const position = chains[i].indexOf(activityIndex);
    if (position !== -1) {
      return {
        color: SUPERSET_COLORS[i % SUPERSET_COLORS.length],
        label: `${String.fromCharCode(65 + i)}${position + 1}`,
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
      return route.params.section.activities.reduce((acc, group) => 
        [...acc, ...(group.items || []).map(item => ({
          ...item,
          type: group.type,
          supersetWith: item.supersetWith !== undefined ? item.supersetWith : null,
          metrics: {
            sets: Array.isArray(item.metrics?.sets) ? item.metrics.sets.map(set => ({
              reps: set.reps || '',
              weight: set.weight || '',
              rest: set.rest || '00:00'
            })) : item.metrics?.sets ? [{
              reps: item.metrics.sets.reps || '',
              weight: item.metrics.sets.weight || '',
              rest: item.metrics.sets.rest || '00:00'
            }] : [{
              reps: '',
              weight: '',
              rest: '00:00'
            }],
            eachSide: item.metrics?.eachSide || false,
            notes: item.metrics?.notes || ''
          }
        }))], []
      );
    } else if (route.params.selectedActivities) {
      return route.params.selectedActivities.map(activity => ({
        ...activity,
        supersetWith: null,
        metrics: {
          sets: [{
            reps: '',
            weight: '',
            rest: '00:00'
          }],
          eachSide: false,
          notes: ''
        }
      }));
    }
    return [];
  });
  const [menuOpen, setMenuOpen] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  const handleAddActivity = () => {
    navigation.navigate('ActivitySelector');
  };

  useEffect(() => {
    if (route.params?.selectedActivities) {
      setActivities(current => [
        ...current,
        ...route.params.selectedActivities.map(activity => ({
          ...activity,
          supersetWith: null,
          metrics: {
            sets: [{
              reps: '',
              weight: '',
              rest: '00:00'
            }],
            eachSide: false,
            notes: ''
          }
        }))
      ]);
      navigation.setParams({ selectedActivities: undefined });
    }
  }, [route.params?.selectedActivities]);

  const handleSave = async () => {
    try {
      if (!section.title.trim()) {
        Alert.alert('Error', 'Please enter a title for the section');
        return;
      }

      // Group activities by type for Firebase
      const groupedActivities = activities.reduce((groups, activity, index) => {
        const type = activity.type.toLowerCase();
        const group = groups.find(g => g.type === type);
        
        // Prepare activity data with superset information
        const activityData = {
          ...activity,
          supersetWith: activity.supersetWith,
          metrics: {
            sets: activity.metrics.sets.map(set => ({
              reps: set.reps || '',
              weight: set.weight || '',
              rest: set.rest || '00:00'
            })),
            eachSide: activity.metrics.eachSide || false,
            notes: activity.metrics.notes || ''
          }
        };

        if (group) {
          group.items.push(activityData);
        } else {
          groups.push({
            type,
            items: [activityData]
          });
        }
        return groups;
      }, []);

      if (section.id) {
        // Update existing section
        await updateSection(section.id, {
          title: section.title,
          description: section.description,
          activities: groupedActivities,
          updatedBy: auth.currentUser.uid,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new section
        const sectionData = {
          title: section.title,
          description: section.description,
          activities: groupedActivities,
          userId: route.params.clientId || auth.currentUser.uid,
          createdBy: auth.currentUser.uid,
          createdAt: new Date().toISOString(),
          updatedBy: auth.currentUser.uid,
          updatedAt: new Date().toISOString()
        };
        await createSection(sectionData);
      }

      navigation.navigate('Search', {
        screen: 'Programs',
        params: {
          screen: 'Sections'
        }
      });
    } catch (error) {
      console.error('Error saving section:', error);
      Alert.alert('Error', 'Failed to save section. Please try again.');
    }
  };

  const handleToggleSuperset = (index) => {
    setActivities(current => {
      const updated = [...current];
      const currentActivity = updated[index];
      const nextActivity = updated[index + 1];

      if (!nextActivity) return updated;

      // Find all activities in the current superset chain
      const findSupersetChain = (startIndex) => {
        const chain = [];
        let currentIndex = startIndex;
        while (currentIndex < updated.length) {
          chain.push(currentIndex);
          const nextIndex = updated[currentIndex].supersetWith;
          if (nextIndex === null || nextIndex <= currentIndex) break;
          currentIndex = nextIndex;
        }
        return chain;
      };

      if (currentActivity.supersetWith === index + 1) {
        // If unlinking from the middle of a chain, we need to maintain the rest of the chain
        const supersetChain = findSupersetChain(index);
        if (supersetChain.length > 2) {
          // If we're breaking a chain of 3+ exercises
          const prevActivity = index > 0 ? updated[index - 1] : null;
          if (prevActivity?.supersetWith === index) {
            // We're unlinking in the middle, connect the previous to the next
            prevActivity.supersetWith = index + 1;
            nextActivity.supersetWith = index - 1;
          } else {
            // We're unlinking at the bottom of the chain
            // Only unlink the current pair
            currentActivity.supersetWith = null;
            nextActivity.supersetWith = null;
          }
          currentActivity.supersetWith = null;
        } else {
          // Just unlinking a pair
          currentActivity.supersetWith = null;
          nextActivity.supersetWith = null;
        }
      } else {
        // Check if we can add to an existing chain or start a new one
        const prevActivity = index > 0 ? updated[index - 1] : null;
        const isPartOfPreviousChain = prevActivity?.supersetWith === index;
        const nextChain = findSupersetChain(index + 1);
        
        if (isPartOfPreviousChain || nextChain.length > 0 || currentActivity.supersetWith === null) {
          // Link the activities
          currentActivity.supersetWith = index + 1;
          nextActivity.supersetWith = index;
          
          // Sync the number of sets across all linked activities
          const supersetChain = findSupersetChain(isPartOfPreviousChain ? index - 1 : index);
          const linkedActivities = supersetChain.map(idx => updated[idx]);
          const maxSets = Math.max(...linkedActivities.map(act => act.metrics.sets.length));
          
          linkedActivities.forEach(activity => {
            while (activity.metrics.sets.length < maxSets) {
              activity.metrics.sets.push({
                reps: '',
                weight: '',
                rest: '00:00'
              });
            }
          });
        }
      }

      return updated;
    });
  };

  const handleAddSet = (activityIndex) => {
    setActivities(current => {
      const updated = [...current];
      const activity = updated[activityIndex];
      
      // Add set to the current activity
      activity.metrics.sets.push({
        reps: '',
        weight: '',
        rest: '00:00'
      });

      // If this activity is part of a superset, add a set to the linked activity
      if (activity.supersetWith !== null) {
        const linkedActivity = updated[activity.supersetWith];
        if (linkedActivity) {
          linkedActivity.metrics.sets.push({
            reps: '',
            weight: '',
            rest: '00:00'
          });
        }
      }

      return updated;
    });
  };

  const handleUpdateSet = (activityIndex, setIndex, field, value) => {
    setActivities(current => {
      const updated = [...current];
      const activity = updated[activityIndex];
      activity.metrics.sets[setIndex][field] = value;
      return updated;
    });
  };

  const handleToggleEachSide = (activityIndex) => {
    setActivities(current => {
      const updated = [...current];
      const activity = updated[activityIndex];
      activity.metrics.eachSide = !activity.metrics.eachSide;
      return updated;
    });
  };

  const handleDeleteActivity = (activityIndex) => {
    Alert.alert(
      "Delete Activity",
      "Are you sure you want to delete this activity?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setActivities(current => {
              const updated = [...current];
              // If this activity is part of a superset, unlink it
              const activity = updated[activityIndex];
              if (activity.supersetWith !== null) {
                const linkedActivity = updated[activity.supersetWith];
                if (linkedActivity) {
                  linkedActivity.supersetWith = null;
                }
              }
              // If the next activity is linked to this one, unlink it
              if (updated[activityIndex + 1]?.supersetWith === activityIndex) {
                updated[activityIndex + 1].supersetWith = null;
              }
              // Remove the activity
              updated.splice(activityIndex, 1);
              return updated;
            });
            setMenuOpen(null);
          }
        }
      ]
    );
  };

  const handleMoveActivity = (index, direction) => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === activities.length - 1)) {
      return;
    }

    setActivities(current => {
      const updated = [...current];

      // Find the complete superset chain
      const findSupersetChain = (startIndex) => {
        if (startIndex < 0 || startIndex >= updated.length) return [];
        
        // Find the start of the chain
        let chainStart = startIndex;
        while (chainStart > 0 && updated[chainStart - 1]?.supersetWith === chainStart) {
          chainStart--;
        }

        // Get all activities in the chain
        const chain = [];
        let currentIndex = chainStart;
        while (currentIndex < updated.length) {
          chain.push(currentIndex);
          const nextIndex = updated[currentIndex].supersetWith;
          if (nextIndex === null || nextIndex <= currentIndex) break;
          currentIndex = nextIndex;
        }
        return chain;
      };

      // Get the chain we're moving (if any)
      const currentChain = findSupersetChain(index);
      const isMovingSuperset = currentChain.length > 1;
      const moveStartIndex = isMovingSuperset ? Math.min(...currentChain) : index;
      const moveEndIndex = isMovingSuperset ? Math.max(...currentChain) : index;

      // Calculate target position
      let targetIndex;
      if (direction === 'up') {
        // Moving up
        const aboveChain = findSupersetChain(moveStartIndex - 1);
        targetIndex = aboveChain.length > 0 ? Math.min(...aboveChain) : moveStartIndex - 1;
      } else {
        // Moving down
        const belowChain = findSupersetChain(moveEndIndex + 1);
        targetIndex = belowChain.length > 0 ? Math.max(...belowChain) + 1 : moveEndIndex + 1;
      }

      // Validate target position
      if (targetIndex < 0 || targetIndex >= updated.length) return current;

      // Extract items to move
      const itemsToMove = updated.slice(moveStartIndex, moveEndIndex + 1);
      updated.splice(moveStartIndex, itemsToMove.length);

      // Calculate insert position
      const insertIndex = targetIndex > moveStartIndex ? targetIndex - itemsToMove.length : targetIndex;
      
      // Insert items at new position
      updated.splice(insertIndex, 0, ...itemsToMove);

      // Update superset references if moving a superset
      if (isMovingSuperset) {
        const newStartIndex = insertIndex;
        for (let i = 0; i < itemsToMove.length; i++) {
          if (i < itemsToMove.length - 1) {
            updated[newStartIndex + i].supersetWith = newStartIndex + i + 1;
          } else {
            updated[newStartIndex + i].supersetWith = null;
          }
          if (i > 0) {
            updated[newStartIndex + i].supersetWith = newStartIndex + i - 1;
          }
        }
      }

      return updated;
    });
  };

  const getMetricsPreview = (activity) => {
    const { sets, eachSide } = activity.metrics;
    
    // Format each set
    const setPreviews = sets.map((set, index) => {
      const parts = [];
      parts.push(`${index + 1}x${set.reps || '-'}`);
      if (set.weight) parts.push(`@ ${set.weight}lb`);
      if (set.rest !== '00:00') parts.push(`rest ${set.rest}`);
      return parts.join(' ');
    });

    // Add each side indicator if needed
    if (eachSide) {
      setPreviews.push('(each side)');
    }

    return setPreviews;
  };

  const toggleCardExpansion = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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
          {section.id ? 'Edit Section' : 'Create Section'}
        </Text>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: theme.colors.white }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
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
                  {menuOpen === activityIndex && (
                    <View style={styles.menuOptions}>
                      <TouchableOpacity 
                        style={styles.menuOption}
                        onPress={() => handleDeleteActivity(activityIndex)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF453A" />
                        <Text style={[styles.menuOptionText, styles.menuOptionDelete]}>Delete</Text>
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

                    <View style={styles.progressRow}>
                      <Text style={{ color: '#666' }}>0-0-0-0</Text>
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
              
              {activityIndex < activities.length - 1 && (
                <View style={[
                  styles.supersetDivider,
                  supersetInfo.isInSuperset && {
                    height: 20,
                    marginVertical: -10,
                  }
                ]}>
                  <TouchableOpacity 
                    style={styles.supersetButton}
                    onPress={() => handleToggleSuperset(activityIndex)}
                  >
                    <Ionicons 
                      name={activity.supersetWith === activityIndex + 1 ? "link" : "link-outline"} 
                      size={20} 
                      color={activity.supersetWith === activityIndex + 1 ? supersetInfo.color : '#666'} 
                    />
                  </TouchableOpacity>
                </View>
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddActivity}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
} 