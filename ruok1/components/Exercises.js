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

const exercises = [
  {
    id: 1,
    title: 'Running',
    category: 'Cardio',
    icon: 'walk-outline',
    color: '#4A90E2',
  },
  {
    id: 2,
    title: 'Bench Press',
    category: 'Strength',
    icon: 'barbell-outline',
    color: '#FF3B30',
  },
  {
    id: 3,
    title: 'Squats',
    category: 'Strength',
    icon: 'barbell-outline',
    color: '#FF9500',
  },
  {
    id: 4,
    title: 'Swimming',
    category: 'Cardio',
    icon: 'water-outline',
    color: '#5856D6',
  },
];

export default function Exercises({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Exercises
      </Text>
      <Text style={styles.subtitle}>
        Choose an exercise to begin your workout
      </Text>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {exercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={[styles.card, { backgroundColor: exercise.color }]}
            onPress={() => navigation.navigate('ExerciseDetail', { exercise })}
          >
            <View style={styles.cardHeader}>
              <Ionicons name={exercise.icon} size={24} color="#FFFFFF" />
              <Text style={styles.cardTitle}>{exercise.title}</Text>
            </View>
            <Text style={styles.cardCategory}>#{exercise.category}</Text>
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
  cardCategory: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    color: '#FFFFFF',
    opacity: 0.8,
  },
}); 