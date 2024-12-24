import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import ActivityMetricsForm from './ActivityMetricsForm';

const ACTIVITY_TYPES = [
  { id: 'exercise', label: 'Exercise', icon: 'barbell-outline' },
  { id: 'breathprotocol', label: 'Breath Protocol', icon: 'fitness-outline' },
  { id: 'breathingtest', label: 'Breathing Test', icon: 'pulse-outline' },
  { id: 'habit', label: 'Habit', icon: 'checkbox-outline' },
  { id: 'task', label: 'Task', icon: 'checkbox-outline' },
  { id: 'guidedsession', label: 'Guided Session', icon: 'play-circle-outline' },
];

export default function SectionDetail({ navigation, route }) {
  const theme = useTheme();
  const [section, setSection] = useState(route.params.section);
  const [loading, setLoading] = useState(false);
  const [localActivities, setLocalActivities] = useState(route.params.section.activities || []);
  const [showMetricsForm, setShowMetricsForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const handleAddActivity = (type) => {
    const activityType = ACTIVITY_TYPES.find(t => t.id === type);
    let screen;
    switch (type) {
      case 'exercise':
        screen = 'Exercises';
        break;
      case 'breathprotocol':
        screen = 'BreathProtocols';
        break;
      case 'breathingtest':
        screen = 'BreathingTests';
        break;
      case 'habit':
      case 'task':
        screen = 'HabitsTasks';
        break;
      case 'guidedsession':
        screen = 'GuidedSessions';
        break;
      default:
        return;
    }

    navigation.navigate(screen, {
      mode: 'selection',
      onSelect: (activity) => {
        setSelectedActivity(activity);
        setSelectedType(type);
        setShowMetricsForm(true);
      }
    });
  };

  const handleMetricsSubmit = (metrics) => {
    const newActivity = {
      id: selectedActivity.id,
      type: selectedType,
      title: selectedActivity.title || selectedActivity.name,
      data: selectedActivity,
      metrics
    };
    setLocalActivities(prev => [...prev, newActivity]);
    setShowMetricsForm(false);
    setSelectedActivity(null);
    setSelectedType(null);
  };

  const handleRemoveActivity = (activityIndex) => {
    setLocalActivities(prev => prev.filter((_, index) => index !== activityIndex));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const sectionRef = doc(db, 'sections', section.id);
      await updateDoc(sectionRef, {
        activities: localActivities
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {section.title}
        </Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
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

        <View style={styles.activityTypes}>
          {ACTIVITY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.activityTypeButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleAddActivity(type.id)}
            >
              <Ionicons name={type.icon} size={24} color={theme.colors.primary} />
              <Text style={[styles.activityTypeText, { color: theme.colors.text }]}>
                Add {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.activitiesList}>
          {localActivities.map((activity, index) => (
            <View 
              key={`${activity.id}-${index}`}
              style={[styles.activityItem, { backgroundColor: theme.colors.surface }]}
            >
              <View style={styles.activityInfo}>
                <Ionicons 
                  name={ACTIVITY_TYPES.find(t => t.id === activity.type)?.icon || 'list-outline'} 
                  size={24} 
                  color={theme.colors.primary} 
                  style={styles.activityIcon}
                />
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                    {activity.title}
                  </Text>
                  {activity.metrics && (
                    <Text style={[styles.activityMetrics, { color: theme.colors.textSecondary }]}>
                      {Object.entries(activity.metrics)
                        .filter(([key, value]) => value && key !== 'timeOfDay')
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(' • ')}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveActivity(index)}
              >
                <Ionicons name="close-circle-outline" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      <ActivityMetricsForm
        visible={showMetricsForm}
        onClose={() => {
          setShowMetricsForm(false);
          setSelectedActivity(null);
          setSelectedType(null);
        }}
        onSubmit={handleMetricsSubmit}
        activity={selectedActivity ? { ...selectedActivity, type: selectedType } : null}
      />

      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
        onPress={handleDelete}
        disabled={loading}
      >
        <Ionicons name="trash-outline" size={24} color={theme.colors.white} />
        <Text style={[styles.deleteButtonText, { color: theme.colors.white }]}>
          Delete Section
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.medium,
    height: 60,
    borderBottomWidth: 1,
    marginTop: 40,
  },
  backButton: {
    padding: Layout.spacing.small,
    marginRight: Layout.spacing.small,
    zIndex: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    marginLeft: -40,
    textAlign: 'center',
  },
  saveButton: {
    padding: Layout.spacing.medium,
  },
  saveButtonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.semibold,
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
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    flex: 1,
    minWidth: '45%',
  },
  activityTypeText: {
    marginLeft: Layout.spacing.small,
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  activitiesList: {
    gap: Layout.spacing.medium,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    justifyContent: 'space-between',
  },
  activityInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    marginRight: Layout.spacing.medium,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginBottom: 4,
  },
  activityMetrics: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  activityButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.small,
  },
  actionButton: {
    padding: Layout.spacing.small,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.medium,
    marginHorizontal: Layout.spacing.large,
    marginBottom: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
    gap: Layout.spacing.small,
  },
  deleteButtonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.semibold,
  },
}); 