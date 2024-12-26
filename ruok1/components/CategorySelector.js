import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { scheduleGuidedSession } from '../firebase/guidedSessions';
import { scheduleExercise, scheduleHabit, scheduleTask, scheduleBreathProtocol, scheduleSection } from '../firebase/scheduledExercises';
import { auth } from '../config/firebase';
import ActivityMetricsForm from './ActivityMetricsForm';

const categories = [
  {
    id: 'sections',
    title: 'Sections',
    icon: 'layers-outline',
    screen: 'Sections'
  },
  {
    id: 1,
    title: 'Programs',
    icon: 'library-outline',
    navigateTo: 'Programs'
  },
  {
    id: 2,
    title: 'Breathing Tests',
    icon: 'fitness-outline',
    navigateTo: 'BreathingTests'
  },
  {
    id: 3,
    title: 'Exercises',
    icon: 'barbell-outline',
    navigateTo: 'Exercises'
  },
  {
    id: 4,
    title: 'Breath Protocols',
    icon: 'pulse-outline',
    navigateTo: 'BreathProtocols'
  },
  {
    id: 5,
    title: 'Habits & Tasks',
    icon: 'checkbox-outline',
    navigateTo: 'HabitsTasks'
  },
  {
    id: 6,
    title: 'Guided Sessions',
    icon: 'compass-outline',
    navigateTo: 'GuidedSessions'
  },
];

export default function CategorySelector({ navigation, route }) {
  const theme = useTheme();
  const selectedDate = route.params?.selectedDate;
  const selectedClient = route.params?.selectedClient;
  const [showMetricsForm, setShowMetricsForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  console.log('CategorySelector received:', {
    selectedClient,
    selectedClientId: selectedClient?.id,
    selectedClientName: selectedClient?.name,
    isCoachId: selectedClient?.id === auth.currentUser.uid,
    currentUserId: auth.currentUser.uid
  });

  const handleMetricsSubmit = async (metrics) => {
    try {
      if (selectedActivity.type === 'exercise') {
        await scheduleExercise(
          selectedClient?.id || auth.currentUser.uid,
          selectedActivity.id,
          selectedDate,
          { metrics }
        );
      } else if (selectedActivity.type === 'breathProtocol') {
        await scheduleBreathProtocol(
          selectedClient?.id || auth.currentUser.uid,
          selectedActivity.id,
          selectedDate,
          { metrics }
        );
      }
      setShowMetricsForm(false);
      navigation.navigate('Training');
    } catch (error) {
      console.error('Error scheduling activity with metrics:', error);
    }
  };

  const handleCategoryPress = async (category) => {
    if (category.id === 'sections') {
      navigation.navigate('Sections', {
        mode: 'selection',
        onSectionSelect: async (section) => {
          try {
            await scheduleSection(
              selectedClient?.id || auth.currentUser.uid,
              section,
              selectedDate,
              'Unscheduled'
            );
            navigation.navigate('Training');
          } catch (error) {
            console.error('Error scheduling section:', error);
            Alert.alert('Error', 'Failed to schedule section. Please try again.');
          }
        }
      });
    } else if (category.navigateTo === 'Programs') {
      navigation.navigate('Programs');
    } else if (category.navigateTo === 'GuidedSessions') {
      navigation.navigate(category.navigateTo, { 
        mode: 'selection',
        selectedDate,
        onSessionSelect: async (session) => {
          try {
            await scheduleGuidedSession(
              selectedClient?.id || auth.currentUser.uid,
              session.id,
              selectedDate
            );
            navigation.navigate('Training');
          } catch (error) {
            console.error('Error scheduling guided session:', error);
          }
        }
      });
    }
  };

  const handleItemPress = (item, type) => {
    if (route.params?.onItemSelect) {
      route.params.onItemSelect(item, type);
    }
  };

  const handleAddPress = (item, type) => {
    if (route.params?.onItemSelect) {
      route.params.onItemSelect(item, type);
    }
  };

  const renderActivityList = (activities, type) => {
    return activities.map((activity) => (
      <TouchableOpacity
        key={activity.id}
        style={[styles.activityItem, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleItemPress(activity, type)}
      >
        <View style={styles.activityInfo}>
          <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
            {activity.title || activity.name}
          </Text>
          {activity.description && (
            <Text style={[styles.activityDescription, { color: theme.colors.textSecondary }]}>
              {activity.description}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation();
            handleAddPress(activity, type);
          }}
        >
          <Ionicons name="add-square" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Add to Schedule
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Select a category to add to your schedule
      </Text>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleCategoryPress(category)}
          >
            <View style={styles.cardContent}>
              <Ionicons 
                name={category.icon} 
                size={24} 
                color={theme.colors.primary} 
                style={styles.cardIcon}
              />
              <View style={styles.cardTextContainer}>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {category.title}
                </Text>
                <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
                  {category.description || `Add ${category.title.toLowerCase()} to your schedule`}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ActivityMetricsForm
        visible={showMetricsForm}
        onClose={() => setShowMetricsForm(false)}
        onSubmit={handleMetricsSubmit}
        activity={selectedActivity}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  title: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.small,
  },
  subtitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.large,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.large,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.medium,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    marginRight: Layout.spacing.medium,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.xsmall,
  },
  cardDescription: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.medium,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.xsmall,
  },
  activityDescription: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  addButton: {
    padding: Layout.spacing.small,
  },
}); 