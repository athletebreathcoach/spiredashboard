import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { createSection, updateSection } from '../firebase/sections';
import { auth } from '../config/firebase';
import { scheduleSection } from '../firebase/scheduledExercises';

const SECTION_TYPES = [
  { id: 'standard', label: 'Standard', icon: 'barbell-outline' },
  { id: 'forTime', label: 'For Time', icon: 'timer-outline' },
  { id: 'amrap', label: 'AMRAP', icon: 'infinite-outline' },
  { id: 'chipper', label: 'Chipper', icon: 'list-outline' },
  { id: 'intervals', label: 'Intervals', icon: 'repeat-outline' }
];

const ACTIVITY_TYPES = [
  { id: 'exercises', label: 'Exercise', icon: 'barbell-outline' },
  { id: 'breathProtocols', label: 'Breath Protocol', icon: 'fitness-outline' },
  { id: 'breathingTests', label: 'Breathing Test', icon: 'pulse-outline' },
  { id: 'habitstasks', label: 'Habits & Tasks', icon: 'checkbox-outline' },
  { id: 'guidedSessions', label: 'Guided Session', icon: 'play-circle-outline' },
];

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

export default function SectionDetail({ navigation, route }) {
  const theme = useTheme();
  const [localState, setLocalState] = useState(() => {
    const initialSection = route.params.section || {
      title: '',
      description: '',
      type: 'standard',
      settings: {}
    };

    return {
      title: initialSection.title || '',
      description: initialSection.description || '',
      type: initialSection.type || 'standard',
      settings: initialSection.settings || {},
      id: initialSection.id
    };
  });
  
  const [activities, setActivities] = useState(() => {
    if (route.params.section?.activities) {
      // Flatten activities
      const flattenedActivities = route.params.section.activities.reduce((acc, group) => 
        [...acc, ...(group.items || []).map(item => ({
          id: item.id,
          title: item.title,
          type: group.type,
          description: item.description || '',
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

      return flattenedActivities;
    } else if (route.params.section?.exercises) {
      // Handle exercises array from ActivitySelector
      const exercises = route.params.section.exercises.map(exercise => ({
        id: exercise.id,
        title: exercise.title,
        type: exercise.type,
        description: exercise.description || '',
        metrics: {
          sets: Array.isArray(exercise.metrics?.sets) ? exercise.metrics.sets : [{
            reps: '',
            weight: '',
            rest: '00:00'
          }],
          eachSide: exercise.metrics?.eachSide || false,
          notes: exercise.metrics?.notes || ''
        }
      }));

      return exercises;
    }
    return [];
  });

  const [expandedCards, setExpandedCards] = useState({});
  const isLogging = route.params.isLogging;
  const [menuOption, setMenuOption] = useState(null);
  const [menuActivityIndex, setMenuActivityIndex] = useState(null);

  const updateSettings = (key, value) => {
    setLocalState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: value
      }
    }));

    // Sync exercise sets with rounds/sets setting
    if (key === 'rounds' || key === 'sets') {
      const numSets = parseInt(value) || 1;
      setActivities(current => {
        return current.map(activity => {
          // Keep existing set data where possible
          const existingSets = activity.metrics.sets || [];
          const newSets = Array(numSets).fill(0).map((_, index) => {
            if (index < existingSets.length) {
              return existingSets[index];
            }
            return {
              reps: '',
              weight: '',
              rest: '00:00'
            };
          });

          return {
            ...activity,
            metrics: {
              ...activity.metrics,
              sets: newSets
            }
          };
        });
      });
    }
  };

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

  const handleMoveActivity = (index, direction) => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === activities.length - 1)) {
      return;
    }

    setActivities(current => {
      const updated = [...current];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      console.log('Starting save process...');
      
      // Check if user is authenticated
      if (!auth.currentUser) {
        console.log('Save failed: User not authenticated');
        Alert.alert('Error', 'You must be logged in to save a section.');
        return;
      }

      if (!localState.title && !isLogging && !route.params.isScheduling) {
        console.log('Save failed: Missing title');
        Alert.alert('Required Field', 'Please enter a section title.');
        return;
      }

      // When logging or scheduling, return the updated activities
      if (isLogging || route.params.isScheduling) {
        console.log('Handling logging/scheduling save...');
        const updatedActivities = activities.map(activity => ({
          ...activity,
          metrics: {
            ...activity.metrics,
            sets: activity.metrics.sets.map(set => ({
              reps: set.reps || '',
              weight: set.weight || '',
              rest: set.rest || '00:00'
            })),
            eachSide: activity.metrics.eachSide || false,
            notes: activity.metrics.notes || ''
          }
        }));

        if (route.params.isScheduling) {
          // Create a new section instance for scheduling, preserving the original template
          const schedulingSection = {
            title: localState.title,
            description: localState.description || '',
            type: localState.type || 'standard',
            activities: updatedActivities,
            templateId: localState.id, // Reference to original template
            settings: localState.settings || {}
          };

          Alert.alert(
            'Select Time of Day',
            'When would you like to schedule this section?',
            [
              { 
                text: 'Morning', 
                onPress: () => navigation.navigate('Sections', { 
                  selectedSection: schedulingSection,
                  selectedTimeOfDay: 'Morning'
                })
              },
              { 
                text: 'Afternoon', 
                onPress: () => navigation.navigate('Sections', { 
                  selectedSection: schedulingSection,
                  selectedTimeOfDay: 'Afternoon'
                })
              },
              { 
                text: 'Evening', 
                onPress: () => navigation.navigate('Sections', { 
                  selectedSection: schedulingSection,
                  selectedTimeOfDay: 'Evening'
                })
              },
              { 
                text: 'Anytime', 
                onPress: () => navigation.navigate('Sections', { 
                  selectedSection: schedulingSection,
                  selectedTimeOfDay: 'Anytime'
                })
              },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
          return;
        }

        navigation.goBack();
        return;
      }

      // Regular save for non-logging, non-scheduling case
      const sectionData = {
        title: localState.title,
        description: localState.description || '',
        type: localState.type || 'standard',
        exercises: activities.map(activity => ({
          id: activity.id,
          title: activity.title,
          type: activity.type,
          description: activity.description || '',
          metrics: {
            sets: activity.metrics.sets.map(set => ({
              reps: set.reps || '',
              weight: set.weight || '',
              rest: set.rest || '00:00'
            })),
            eachSide: activity.metrics.eachSide || false,
            notes: activity.metrics.notes || ''
          }
        })),
        settings: localState.settings || {},
        userId: auth.currentUser.uid,
        createdBy: auth.currentUser.uid
      };

      if (localState.id) {
        await updateSection(localState.id, sectionData);
      } else {
        await createSection(sectionData);
      }
      
      navigation.navigate('Programs', { screen: 'Sections' });
    } catch (error) {
      console.error('Error saving section:', error);
      Alert.alert('Error', 'Failed to save section. Please try again.');
    }
  };

  const handleRemoveActivity = (index) => {
    setActivities(current => current.filter((_, i) => i !== index));
    setMenuOption(null);
    setMenuActivityIndex(null);
  };

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
  notesInput: {
    fontSize: 16,
    color: '#fff',
    padding: Layout.spacing.small,
    height: 40,
    backgroundColor: '#2C2C2E',
    borderRadius: Layout.borderRadius.medium,
    marginTop: Layout.spacing.small,
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
    typeSelector: {
      marginVertical: Layout.spacing.medium,
    },
    typeSelectorLabel: {
      fontSize: 16,
      color: '#666',
      marginBottom: Layout.spacing.small,
      fontFamily: Typography.fonts.medium,
    },
    typeList: {
      flexDirection: 'row',
    },
    typeButton: {
      flexDirection: 'row',
    alignItems: 'center',
      padding: Layout.spacing.small,
      marginRight: Layout.spacing.small,
      borderRadius: Layout.borderRadius.medium,
      backgroundColor: '#2C2C2E',
    },
    typeButtonSelected: {
      backgroundColor: '#6B4EFF20',
    },
    typeButtonText: {
      color: '#666',
      marginLeft: Layout.spacing.small,
      fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
    typeButtonTextSelected: {
      color: '#6B4EFF',
    },
    settingsContainer: {
      marginBottom: Layout.spacing.medium,
    padding: Layout.spacing.medium,
      backgroundColor: '#2C2C2E',
      borderRadius: Layout.borderRadius.medium,
    },
    settingsLabel: {
      fontSize: 16,
      color: '#666',
      marginBottom: Layout.spacing.small,
      fontFamily: Typography.fonts.medium,
    },
    settingsInput: {
      fontSize: 16,
      color: '#fff',
      padding: Layout.spacing.small,
      backgroundColor: '#1C1C1E',
      borderRadius: Layout.borderRadius.small,
    },
    intervalInputs: {
      flexDirection: 'row',
    alignItems: 'center',
    },
    intervalInput: {
      flex: 1,
    },
    intervalSeparator: {
      color: '#666',
      fontSize: 20,
      marginHorizontal: Layout.spacing.small,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
      alignItems: 'center',
    },
    menuModal: {
      backgroundColor: '#1C1C1E',
      borderRadius: Layout.borderRadius.large,
      padding: Layout.spacing.medium,
      width: '80%',
      maxWidth: 300,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Layout.spacing.medium,
    },
    menuItemText: {
      fontSize: 16,
    fontFamily: Typography.fonts.medium,
      marginLeft: Layout.spacing.medium,
    },
    menuButton: {
      padding: Layout.spacing.small,
  },
});

  const renderTypeSettings = () => {
    switch(localState.type) {
      case 'standard':
        return (
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsLabel}>Sets</Text>
            <TextInput
              style={styles.settingsInput}
              value={localState.settings?.sets?.toString()}
              onChangeText={(value) => updateSettings('sets', parseInt(value) || 0)}
              keyboardType="numeric"
              placeholder="Number of sets"
              placeholderTextColor="#666"
            />
          </View>
        );
      case 'forTime':
        return (
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsLabel}>Rounds</Text>
            <TextInput
              style={styles.settingsInput}
              value={localState.settings?.rounds?.toString()}
              onChangeText={(value) => updateSettings('rounds', parseInt(value) || 0)}
              keyboardType="numeric"
              placeholder="Number of rounds"
              placeholderTextColor="#666"
            />
          </View>
        );
      case 'intervals':
        return (
          <View>
            <View style={styles.settingsContainer}>
              <Text style={styles.settingsLabel}>Sets</Text>
              <TextInput
                style={styles.settingsInput}
                value={localState.settings?.sets?.toString()}
                onChangeText={(value) => updateSettings('sets', parseInt(value) || 0)}
                keyboardType="numeric"
                placeholder="Number of sets"
                placeholderTextColor="#666"
              />
            </View>
            <View style={styles.settingsContainer}>
              <Text style={styles.settingsLabel}>Work/Rest Intervals</Text>
              <View style={styles.intervalInputs}>
                <TextInput
                  style={[styles.settingsInput, styles.intervalInput]}
                  value={localState.settings?.workInterval?.toString()}
                  onChangeText={(value) => updateSettings('workInterval', parseInt(value) || 0)}
                  keyboardType="numeric"
                  placeholder="Work (sec)"
                  placeholderTextColor="#666"
                />
                <Text style={styles.intervalSeparator}>/</Text>
                <TextInput
                  style={[styles.settingsInput, styles.intervalInput]}
                  value={localState.settings?.restInterval?.toString()}
                  onChangeText={(value) => updateSettings('restInterval', parseInt(value) || 0)}
                  keyboardType="numeric"
                  placeholder="Rest (sec)"
                  placeholderTextColor="#666"
                />
              </View>
            </View>
          </View>
        );
      case 'amrap':
        return (
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsLabel}>Time Cap (minutes)</Text>
            <TextInput
              style={styles.settingsInput}
              value={localState.settings?.timeLimit?.toString()}
              onChangeText={(value) => updateSettings('timeLimit', parseInt(value) || 0)}
              keyboardType="numeric"
              placeholder="Time limit in minutes"
              placeholderTextColor="#666"
            />
          </View>
        );
      default:
        return null;
    }
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
          {isLogging ? localState.title : (localState.id ? 'Edit Section' : 'Create Section')}
        </Text>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: theme.colors.white }]}>
            {isLogging ? 'Complete' : 'Save'}
          </Text>
        </TouchableOpacity>
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
              value={localState.title}
              maxLength={100}
              onChangeText={(value) => setLocalState(prev => ({ ...prev, title: value }))}
            />
            
            <View style={styles.typeSelector}>
              <Text style={styles.typeSelectorLabel}>Section Type</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.typeList}
              >
                {SECTION_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeButton,
                      localState.type === type.id && styles.typeButtonSelected
                    ]}
                    onPress={() => setLocalState(prev => ({ ...prev, type: type.id, settings: {} }))}
                  >
                    <Ionicons 
                      name={type.icon} 
                      size={24} 
                      color={localState.type === type.id ? theme.colors.primary : '#666'} 
                    />
                    <Text style={[
                      styles.typeButtonText,
                      localState.type === type.id && styles.typeButtonTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {renderTypeSettings()}

            <TextInput
              style={styles.descriptionInput}
              placeholder="Description (optional)"
              placeholderTextColor="#666"
              value={localState.description}
              onChangeText={(value) => setLocalState(prev => ({ ...prev, description: value }))}
              multiline
            />
          </View>
        )}

        {isLogging && localState.type !== 'standard' && (
          <View style={styles.sectionInfoContainer}>
            {localState.type === 'amrap' && (
              <View style={styles.settingsContainer}>
                <Text style={styles.settingsLabel}>Total Rounds</Text>
                <TextInput
                  style={styles.settingsInput}
                  value={localState.settings?.completedRounds?.toString()}
                  onChangeText={(value) => updateSettings('completedRounds', parseInt(value) || 0)}
                  keyboardType="numeric"
                  placeholder="Number of rounds completed"
                  placeholderTextColor="#666"
                />
              </View>
            )}
            {localState.type === 'forTime' && (
              <View style={styles.settingsContainer}>
                <Text style={styles.settingsLabel}>Completion Time</Text>
                <TextInput
                  style={styles.settingsInput}
                  value={localState.settings?.completionTime}
                  onChangeText={(value) => updateSettings('completionTime', value)}
                  placeholder="MM:SS"
                  placeholderTextColor="#666"
                />
              </View>
            )}
          </View>
        )}

        {activities.map((activity, activityIndex) => {
          const isExpanded = expandedCards[activityIndex];
          
          return (
            <React.Fragment key={activityIndex}>
              <View 
                style={[
                  styles.activityCard, 
                  { 
                    backgroundColor: theme.colors.surface,
                    marginBottom: Layout.spacing.medium,
                  }
                ]}
              >
                <View style={styles.activityHeader}>
                  <View style={styles.activityIcon}>
                    <Ionicons 
                      name={ACTIVITY_TYPES.find(t => t.id === activity.type)?.icon || 'fitness'} 
                      size={24} 
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.titleContainer}>
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
                        onPress={() => {
                          setMenuActivityIndex(activityIndex);
                          setMenuOption('menu');
                        }}
                      >
                        <Ionicons name="ellipsis-vertical" size={20} color="#666" />
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
                            placeholderTextColor="#666"
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
                            placeholderTextColor="#666"
                          />
                        </View>
                        <View style={styles.metricColumn}>
                          <Text style={styles.metricLabel}>REST</Text>
                          <TextInput
                            style={styles.metricInput}
                            value={set.rest}
                            onChangeText={(value) => handleUpdateSet(activityIndex, setIndex, 'rest', value)}
                            placeholder="00:00"
                            placeholderTextColor="#666"
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
                      placeholderTextColor="#666"
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
            </React.Fragment>
          );
        })}
      </ScrollView>

      <Modal
        visible={menuOption === 'menu'}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuOption(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuOption(null)}
        >
          <View style={styles.menuModal}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleRemoveActivity(menuActivityIndex)}
            >
              <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
              <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Remove Exercise</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
} 