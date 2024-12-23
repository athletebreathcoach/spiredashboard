import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { scheduleGuidedSession } from '../firebase/guidedSessions';
import { scheduleExercise } from '../firebase/scheduledExercises';
import { scheduleHabit, scheduleTask } from '../firebase/scheduledExercises';
import { auth } from '../config/firebase';

const categories = [
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
  const { theme } = useTheme();
  const selectedDate = route.params?.selectedDate;

  const handleCategoryPress = (category) => {
    if (category.navigateTo === 'GuidedSessions') {
      navigation.navigate(category.navigateTo, { 
        mode: 'selection',
        selectedDate,
        onSessionSelect: async (session) => {
          try {
            await scheduleGuidedSession(
              auth.currentUser.uid,
              session.id,
              selectedDate
            );
            navigation.navigate('Training');
          } catch (error) {
            console.error('Error scheduling guided session:', error);
          }
        }
      });
    } else if (category.navigateTo === 'Exercises') {
      navigation.navigate(category.navigateTo, { 
        mode: 'selection',
        selectedDate,
        onExerciseSelect: async (exercise) => {
          try {
            console.log('Scheduling exercise:', exercise.id, 'for date:', selectedDate);
            await scheduleExercise(
              auth.currentUser.uid,
              exercise.id,
              selectedDate
            );
            navigation.navigate('Training');
          } catch (error) {
            console.error('Error scheduling exercise:', error);
          }
        }
      });
    } else if (category.navigateTo === 'HabitsTasks') {
      navigation.navigate('HabitsTasks', {
        mode: 'selection',
        selectedDate,
        itemType: 'habit',
        onItemSelect: async (item) => {
          try {
            if (item.type === 'habit') {
              await scheduleHabit(
                auth.currentUser.uid,
                item.id,
                selectedDate
              );
            } else {
              await scheduleTask(
                auth.currentUser.uid,
                item.id,
                selectedDate
              );
            }
            navigation.navigate('Training');
          } catch (error) {
            console.error('Error scheduling habit/task:', error);
          }
        }
      });
    } else {
      navigation.navigate(category.navigateTo, { 
        mode: 'selection',
        selectedDate,
        onSessionSelect: async (session) => {
          navigation.navigate('Training');
        }
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme?.colors?.background }]}>
      <Text style={[styles.title, { color: theme?.colors?.text }]}>
        Add to Schedule
      </Text>
      <Text style={[styles.subtitle, { color: theme?.colors?.textSecondary }]}>
        Select a category to add to your schedule
      </Text>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryCard, { backgroundColor: theme?.colors?.surface }]}
            onPress={() => handleCategoryPress(category)}
          >
            <View style={styles.categoryIcon}>
              <Ionicons name={category.icon} size={24} color={theme?.colors?.primary} />
            </View>
            <Text style={[styles.categoryTitle, { color: theme?.colors?.text }]}>
              {category.title}
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={theme?.colors?.textSecondary} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.medium,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    flex: 1,
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    marginLeft: Layout.spacing.medium,
  },
}); 