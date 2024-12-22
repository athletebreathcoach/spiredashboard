import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

const habits = [
  {
    id: 1,
    title: 'Morning Breath Work',
    category: 'Daily',
    description: 'Start your day with mindful breathing',
    icon: 'sunny-outline',
    color: '#4A90E2',
  },
  {
    id: 2,
    title: 'Evening Wind Down',
    category: 'Daily',
    description: 'Prepare for restful sleep',
    icon: 'moon-outline',
    color: '#FF9500',
  },
  {
    id: 3,
    title: 'Pre-Workout Routine',
    category: 'Exercise',
    description: 'Optimize your workout performance',
    icon: 'barbell-outline',
    color: '#FF3B30',
  },
  {
    id: 4,
    title: 'Recovery Session',
    category: 'Exercise',
    description: 'Enhance post-workout recovery',
    icon: 'refresh-outline',
    color: '#5856D6',
  },
];

export default function HabitsTasks({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Habits & Tasks
      </Text>
      <Text style={styles.subtitle}>
        Build consistent breathing practices
      </Text>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {habits.map((habit) => (
          <TouchableOpacity
            key={habit.id}
            style={[styles.card, { backgroundColor: habit.color }]}
            onPress={() => navigation.navigate('HabitDetail', { habit })}
          >
            <View style={styles.cardHeader}>
              <Ionicons name={habit.icon} size={24} color="#FFFFFF" />
              <Text style={styles.cardTitle}>{habit.title}</Text>
            </View>
            <Text style={styles.cardDescription}>{habit.description}</Text>
            <Text style={styles.cardCategory}>#{habit.category}</Text>
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
    backgroundColor: '#1C1C1E',
  },
  title: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.small,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.large,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.large,
  },
  card: {
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  cardTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    color: '#FFFFFF',
    marginLeft: Layout.spacing.medium,
  },
  cardDescription: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    color: '#FFFFFF',
    marginBottom: Layout.spacing.small,
  },
  cardCategory: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    color: '#FFFFFF',
    opacity: 0.8,
  },
}); 