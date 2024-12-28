import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
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
    paddingTop: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.medium,
    height: 70,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: Layout.spacing.small,
    marginRight: Layout.spacing.small,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Layout.borderRadius.medium,
    zIndex: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontFamily: Typography.fonts.semibold,
    marginLeft: -44,
    textAlign: 'center',
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.large,
  },
  description: {
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.large,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.medium,
  },
  activityTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.medium,
    marginBottom: Layout.spacing.large,
  },
  activityTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activityTypeText: {
    marginLeft: Layout.spacing.small,
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
  activitiesList: {
    gap: Layout.spacing.medium,
    marginTop: Layout.spacing.large,
  },
  activityItem: {
    flexDirection: 'column',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.small,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  activityInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.small,
  },
  activityIcon: {
    marginRight: Layout.spacing.small,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  activityContent: {
    flex: 1,
    marginRight: Layout.spacing.medium,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
    marginBottom: 0,
  },
  activityMetrics: {
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
    opacity: 0.8,
  },
  activityButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.medium,
  },
  actionButton: {
    padding: 4,
    borderRadius: Layout.borderRadius.medium,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.large,
    marginHorizontal: Layout.spacing.large,
    marginTop: Layout.spacing.large,
    marginBottom: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  deleteButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.semibold,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    gap: Layout.spacing.small,
  },
  addButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.semibold,
  },
  metricInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#ffffff15',
    borderRadius: Layout.borderRadius.small,
    paddingHorizontal: Layout.spacing.small,
    marginLeft: Layout.spacing.small,
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
  },
  activityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reorderButtons: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginLeft: 2,
  },
});

export default function SectionDetail({ navigation, route }) {
  const theme = useTheme();
  const [section, setSection] = useState(route.params.section);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState(
    route.params.section.activities?.reduce((acc, group) => 
      [...acc, ...(group.items || []).map(item => ({
        ...item,
        type: group.type,
        supersetWith: null,
        metrics: item.metrics || {
          sets: '',
          reps: '',
          weight: '',
          duration: '',
          intensity: '',
          notes: ''
        }
      }))], []
    ) || []
  );
  const [expandedActivity, setExpandedActivity] = useState(null);

  const themedContainerStyle = [
    styles.container,
    { backgroundColor: theme.colors.background }
  ];

  const handleAddActivity = () => {
    navigation.navigate('ActivitySelector', {
      onNext: (selectedActivities) => {
        setActivities(current => [
          ...current,
          ...selectedActivities.map(activity => ({
            ...activity,
            supersetWith: null,
            metrics: {
              sets: '',
              reps: '',
              weight: '',
              duration: '',
              intensity: '',
              notes: ''
            }
          }))
        ]);
      }
    });
  };

  const handleUpdateMetrics = (index, metrics) => {
    setActivities(current => {
      const updated = [...current];
      updated[index] = {
        ...updated[index],
        metrics: {
          ...updated[index].metrics,
          ...metrics
        }
      };
      return updated;
    });
  };

  const handleToggleSuperset = (index) => {
    setActivities(current => {
      const updated = [...current];
      const currentActivity = updated[index];
      const nextActivity = updated[index + 1];

      if (!nextActivity) return updated;

      if (currentActivity.supersetWith === null) {
        currentActivity.supersetWith = index + 1;
        nextActivity.supersetWith = index;
      } else {
        currentActivity.supersetWith = null;
        nextActivity.supersetWith = null;
      }

      return updated;
    });
  };

  const handleMoveActivity = (index, direction) => {
    setActivities(current => {
      const updated = [...current];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (newIndex < 0 || newIndex >= updated.length) return current;
      
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const groupedActivities = activities.reduce((groups, activity) => {
        const type = activity.type.toLowerCase();
        const group = groups.find(g => g.type === type);
        if (group) {
          group.items.push(activity);
        } else {
          groups.push({
            type,
            items: [activity]
          });
        }
        return groups;
      }, []);

      const sectionRef = doc(db, 'sections', section.id);
      await updateDoc(sectionRef, {
        activities: groupedActivities
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error saving section:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Section",
      "Are you sure you want to delete this section? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const sectionRef = doc(db, 'sections', section.id);
              await deleteDoc(sectionRef);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting section:', error);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleScheduleSection = async () => {
    try {
      setLoading(true);
      await scheduleSection(
        auth.currentUser.uid,
        section,
        route.params?.selectedDate,
        'Unscheduled'
      );
      navigation.navigate('Training');
    } catch (error) {
      console.error('Error scheduling section:', error);
      Alert.alert('Error', 'Failed to schedule section. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMetrics = (activity, index) => {
    const metrics = activity.metrics || {};
    return (
      <View style={[styles.metricsContainer, { borderTopColor: theme.colors.border }]}>
        {activity.type === 'exercises' ? (
          <>
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: theme.colors.text }]}>Sets:</Text>
              <TextInput
                style={[styles.metricInput, { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                }]}
                value={metrics.sets?.toString() || ''}
                onChangeText={(value) => handleUpdateMetrics(index, { sets: value })}
                keyboardType="numeric"
                placeholder="Enter sets"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: theme.colors.text }]}>Reps:</Text>
              <TextInput
                style={[styles.metricInput, { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                }]}
                value={metrics.reps?.toString() || ''}
                onChangeText={(value) => handleUpdateMetrics(index, { reps: value })}
                keyboardType="numeric"
                placeholder="Enter reps"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: theme.colors.text }]}>Weight:</Text>
              <TextInput
                style={[styles.metricInput, { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                }]}
                value={metrics.weight?.toString() || ''}
                onChangeText={(value) => handleUpdateMetrics(index, { weight: value })}
                keyboardType="numeric"
                placeholder="Enter weight"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: theme.colors.text }]}>Duration:</Text>
              <TextInput
                style={[styles.metricInput, { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                }]}
                value={metrics.duration?.toString() || ''}
                onChangeText={(value) => handleUpdateMetrics(index, { duration: value })}
                keyboardType="numeric"
                placeholder="Enter duration (min)"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: theme.colors.text }]}>Intensity:</Text>
              <TextInput
                style={[styles.metricInput, { 
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                }]}
                value={metrics.intensity?.toString() || ''}
                onChangeText={(value) => handleUpdateMetrics(index, { intensity: value })}
                placeholder="Enter intensity"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </>
        )}
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: theme.colors.text }]}>Notes:</Text>
          <TextInput
            style={[styles.metricInput, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              minHeight: 40,
              textAlignVertical: 'top',
            }]}
            value={metrics.notes || ''}
            onChangeText={(value) => handleUpdateMetrics(index, { notes: value })}
            placeholder="Add notes"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
          />
        </View>
      </View>
    );
  };

  return (
    <View style={themedContainerStyle}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.colors.surface }]} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {section.title}
        </Text>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.colors.primary }]} 
          onPress={handleSave}
        >
          <Ionicons name="save-outline" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {section.description && (
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {section.description}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddActivity}
        >
          <Ionicons name="add-circle-outline" size={24} color={theme.colors.white} />
          <Text style={[styles.addButtonText, { color: theme.colors.white }]}>
            Add Activity
          </Text>
        </TouchableOpacity>

        <View style={styles.activitiesList}>
          {activities.map((activity, index) => (
            <View 
              key={index} 
              style={[
                styles.activityItem, 
                { 
                  backgroundColor: theme.colors.surface,
                  borderLeftWidth: activity.supersetWith !== null ? 4 : 0,
                  borderLeftColor: theme.colors.primary
                }
              ]}
            >
              <View style={styles.activityHeader}>
                <View style={styles.activityInfo}>
                  <View style={[styles.activityIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Ionicons 
                      name={ACTIVITY_TYPES.find(t => t.id === activity.type)?.icon || 'fitness'} 
                      size={20} 
                      color={theme.colors.primary} 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text 
                      style={[styles.activityTitle, { color: theme.colors.text }]}
                      numberOfLines={2}
                    >
                      {activity.title || activity.name}
                    </Text>
                  </View>
                </View>
                <View style={styles.activityActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => setExpandedActivity(expandedActivity === index ? null : index)}
                  >
                    <Ionicons 
                      name={expandedActivity === index ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={theme.colors.primary} 
                    />
                  </TouchableOpacity>
                  {index < activities.length - 1 && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleToggleSuperset(index)}
                    >
                      <Ionicons 
                        name={activity.supersetWith !== null ? "link" : "link-outline"} 
                        size={20} 
                        color={theme.colors.primary} 
                      />
                    </TouchableOpacity>
                  )}
                  <View style={styles.reorderButtons}>
                    {index > 0 && (
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleMoveActivity(index, 'up')}
                      >
                        <Ionicons name="chevron-up" size={18} color={theme.colors.primary} />
                      </TouchableOpacity>
                    )}
                    {index < activities.length - 1 && (
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleMoveActivity(index, 'down')}
                      >
                        <Ionicons name="chevron-down" size={18} color={theme.colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      const updated = activities.filter((_, i) => i !== index);
                      setActivities(updated);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              {expandedActivity === index && renderMetrics(activity, index)}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.colors.error + '20' }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
          <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>
            Delete Section
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
} 