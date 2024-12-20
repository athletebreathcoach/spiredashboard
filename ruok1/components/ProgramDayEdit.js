import React, { useState } from 'react';
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

export default function ProgramDayEdit({ route, navigation }) {
  const { theme } = useTheme();
  const { program, day, date, type } = route.params;

  const categories = [
    {
      id: 'sessions',
      title: 'Sessions',
      icon: 'calendar-outline',
      description: 'Add complete training sessions',
    },
    {
      id: 'sections',
      title: 'Sections',
      icon: 'layers-outline',
      description: 'Add grouped exercises and protocols',
    },
    {
      id: 'breathingTests',
      title: 'Breathing Tests',
      icon: 'fitness-outline',
      description: 'Add breathing assessments',
    },
    {
      id: 'exercises',
      title: 'Exercises',
      icon: 'barbell-outline',
      description: 'Add individual exercises',
    },
    {
      id: 'breathProtocols',
      title: 'Breath Protocols',
      icon: 'pulse-outline',
      description: 'Add breathing protocols',
    },
    {
      id: 'habitsTasks',
      title: 'Habits & Tasks',
      icon: 'checkmark-circle-outline',
      description: 'Add habits and tasks',
    },
    {
      id: 'guidedSessions',
      title: 'Guided Sessions',
      icon: 'play-circle-outline',
      description: 'Add guided workout sessions',
    },
  ];

  const handleCategoryPress = (category) => {
    // Map category IDs to existing screens and components
    const screens = {
      sessions: 'Programs',  // We'll filter for Sessions in Programs component
      sections: 'Programs',  // We'll filter for Sections in Programs component
      breathingTests: 'BreathingTests',
      exercises: 'Exercises',
      breathProtocols: 'Breath Protocols',
      habitsTasks: 'HabitsTasks',
      guidedSessions: 'GuidedSessions',
    };

    // Pass additional params to indicate we're in selection mode
    navigation.navigate(screens[category.id], {
      selectionMode: true,  // This tells the component we're selecting items
      onSelect: (item) => {
        // Handle adding item to the day
        console.log('Selected:', item);
        navigation.goBack();
      },
      day,
      date,
      type,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {type === 'weekly' ? day : new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Add items to this day
        </Text>
      </View>

      <ScrollView style={styles.categoriesList}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryCard, { backgroundColor: '#2C2C2E' }]}
            onPress={() => handleCategoryPress(category)}
          >
            <Ionicons 
              name={category.icon} 
              size={24} 
              color="#00B5E0" 
              style={styles.categoryIcon}
            />
            <View style={styles.categoryContent}>
              <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
                {category.title}
              </Text>
              <Text style={[styles.categoryDescription, { color: theme.colors.textSecondary }]}>
                {category.description}
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={theme.colors.textSecondary} 
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
  },
  header: {
    padding: Layout.spacing.large,
  },
  title: {
    fontSize: 28,
    fontFamily: Typography.fonts.bold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
  },
  categoriesList: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  categoryIcon: {
    marginRight: Layout.spacing.medium,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
  },
}); 