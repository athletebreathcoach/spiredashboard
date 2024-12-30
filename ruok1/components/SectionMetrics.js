import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useTheme } from '../theme/ThemeContext';
import ExerciseMetricsForm from './ExerciseMetricsForm';
import { updateScheduledExercise } from '../firebase/scheduledExercises';

export default function SectionMetrics({ navigation, route }) {
  const theme = useTheme();
  const { section, date } = route.params;
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleMetricsSubmit = async (metrics) => {
    try {
      setLoading(true);
      await updateScheduledExercise(selectedActivity.id, {
        ...selectedActivity,
        metrics: {
          ...selectedActivity.metrics,
          ...metrics,
          completed: true
        },
        status: 'completed'
      });
      
      // Check if all activities are completed
      const allActivitiesCompleted = section.activities.every(
        activity => activity.metrics?.completed
      );
      
      if (allActivitiesCompleted) {
        navigation.goBack();
      } else {
        setSelectedActivity(null);
      }
    } catch (error) {
      console.error('Error updating metrics:', error);
      Alert.alert('Error', 'Failed to save metrics. Please try again.');
    } finally {
      setLoading(false);
    }
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
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {section.activities.map((activity, index) => (
          <TouchableOpacity
            key={activity.id || index}
            style={[styles.activityCard, { 
              backgroundColor: theme.colors.surface,
              borderColor: activity.metrics?.completed 
                ? theme.colors.success 
                : theme.colors.border
            }]}
            onPress={() => setSelectedActivity(activity)}
          >
            <View style={styles.activityHeader}>
              <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
                {activity.title}
              </Text>
              {activity.metrics?.completed ? (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              ) : (
                <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
              )}
            </View>
            
            {activity.metrics?.completed && (
              <View style={styles.completedMetrics}>
                {activity.metrics.sets?.map((set, idx) => (
                  <Text key={idx} style={[styles.metricText, { color: theme.colors.textSecondary }]}>
                    Set {idx + 1}: {set.reps} reps @ {set.weight}lb
                  </Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedActivity && (
        <ExerciseMetricsForm
          exercise={selectedActivity}
          onSubmit={handleMetricsSubmit}
          onCancel={() => setSelectedActivity(null)}
        />
      )}
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
    marginTop: 44,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    textAlign: 'center',
    marginLeft: -28,
  },
  backButton: {
    padding: Layout.spacing.small,
    marginRight: Layout.spacing.small,
    zIndex: 1,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.medium,
  },
  activityCard: {
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.medium,
    marginBottom: Layout.spacing.medium,
    borderWidth: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
  completedMetrics: {
    marginTop: Layout.spacing.small,
  },
  metricText: {
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
    marginTop: 4,
  },
}); 