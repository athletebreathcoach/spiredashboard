import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { doc, updateDoc, getDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import ActivityMetricsForm from './ActivityMetricsForm';
import { scheduleSection } from '../firebase/sections';
import { auth } from '../config/firebase';

const ACTIVITY_TYPES = [
  { id: 'exercises', label: 'Exercise', icon: 'barbell-outline' },
  { id: 'breathProtocols', label: 'Breath Protocol', icon: 'fitness-outline' },
  { id: 'breathingTests', label: 'Breathing Test', icon: 'pulse-outline' },
  { id: 'habitstasks', label: 'Habits & Tasks', icon: 'checkbox-outline' },
  { id: 'guidedSessions', label: 'Guided Session', icon: 'play-circle-outline' },
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
});

export default function SectionDetail({ navigation, route }) {
  const theme = useTheme();
  const [section, setSection] = useState(route.params.section || { title: '', description: '' });
  const [activities, setActivities] = useState(
    route.params.section?.activities?.reduce((acc, group) => 
      [...acc, ...(group.items || []).map(item => ({
        ...item,
        type: group.type,
        supersetWith: item.supersetWith !== undefined ? item.supersetWith : null,
        metrics: {
          sets: item.metrics?.sets?.map(set => ({
            reps: set.reps || '',
            weight: set.weight || '',
            rest: set.rest || '00:00'
          })) || [{
            reps: '',
            weight: '',
            rest: '00:00'
          }],
          eachSide: item.metrics?.eachSide || false,
          notes: item.metrics?.notes || ''
        }
      }))], []
    ) || route.params.selectedActivities?.map(activity => ({
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
    })) || []
  );
  const [menuOpen, setMenuOpen] = useState(null);

  const handleAddActivity = () => {
    navigation.navigate('ActivitySelector', {
      onNext: (selectedActivities) => {
        setActivities(current => [
          ...current,
          ...selectedActivities.map(activity => ({
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
      }
    });
  };

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
          supersetWith: activity.supersetWith,  // Preserve superset relationship
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
        const sectionRef = doc(db, 'sections', section.id);
        await updateDoc(sectionRef, {
          title: section.title,
          description: section.description,
          activities: groupedActivities,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new section
        const sectionData = {
          title: section.title,
          description: section.description,
          activities: groupedActivities,
          userId: auth.currentUser.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await addDoc(collection(db, 'sections'), sectionData);
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

      if (currentActivity.supersetWith === null) {
        // Link the activities
        currentActivity.supersetWith = index + 1;
        nextActivity.supersetWith = index;
        
        // Sync the number of sets
        const maxSets = Math.max(
          currentActivity.metrics.sets.length,
          nextActivity.metrics.sets.length
        );
        
        // Add sets to current activity if needed
        while (currentActivity.metrics.sets.length < maxSets) {
          currentActivity.metrics.sets.push({
            reps: '',
            weight: '',
            rest: '00:00'
          });
        }
        
        // Add sets to next activity if needed
        while (nextActivity.metrics.sets.length < maxSets) {
          nextActivity.metrics.sets.push({
            reps: '',
            weight: '',
            rest: '00:00'
          });
        }
      } else {
        // Unlink the activities
        currentActivity.supersetWith = null;
        nextActivity.supersetWith = null;
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

        {activities.map((activity, activityIndex) => (
          <React.Fragment key={activityIndex}>
            <View 
              style={[
                styles.activityCard, 
                { 
                  backgroundColor: theme.colors.surface,
                  borderLeftColor: activity.supersetWith !== null ? '#4CAF50' : 'transparent',
                }
              ]}
            >
              <View style={styles.activityHeader}>
                <View style={styles.activityIcon}>
                  <Ionicons 
                    name={ACTIVITY_TYPES.find(t => t.id === activity.type)?.icon || 'fitness'} 
                    size={24} 
                    color="#4CAF50" 
                  />
                </View>
                <Text style={styles.activityTitle}>
                  {activity.title || activity.name}
                  {activity.supersetWith !== null && " (Superset)"}
                </Text>
                <TouchableOpacity 
                  style={styles.menuButton}
                  onPress={() => setMenuOpen(menuOpen === activityIndex ? null : activityIndex)}
                >
                  <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
                </TouchableOpacity>
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
            </View>
            
            {activityIndex < activities.length - 1 && (
              <View style={styles.supersetDivider}>
                <TouchableOpacity 
                  style={styles.supersetButton}
                  onPress={() => handleToggleSuperset(activityIndex)}
                >
                  <Ionicons 
                    name={activity.supersetWith !== null ? "link" : "link-outline"} 
                    size={20} 
                    color={activity.supersetWith !== null ? '#4CAF50' : '#666'} 
                  />
                </TouchableOpacity>
              </View>
            )}
          </React.Fragment>
        ))}
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