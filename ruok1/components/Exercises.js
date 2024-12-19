import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 10;
const CARD_WIDTH = width - (CARD_MARGIN * 2 + Layout.spacing.large * 2);

const exercises = [
  {
    id: 1,
    title: 'Running',
    description: 'Cardiovascular endurance training',
    color: '#4A90E2',
    icon: 'walk-outline',
    category: 'Cardio',
    difficulty: 'Beginner'
  },
  {
    id: 2,
    title: 'Air Squats',
    description: 'Fundamental lower body movement',
    color: '#FF9500',
    icon: 'body-outline',
    category: 'Bodyweight',
    difficulty: 'Beginner'
  },
  {
    id: 3,
    title: 'Bench Press',
    description: 'Upper body strength development',
    color: '#FF3B30',
    icon: 'barbell-outline',
    category: 'Strength',
    difficulty: 'Intermediate'
  },
  {
    id: 4,
    title: 'Box Jump',
    description: 'Explosive power and coordination',
    color: '#5856D6',
    icon: 'trending-up-outline',
    category: 'Plyometric',
    difficulty: 'Intermediate'
  },
  {
    id: 5,
    title: 'Pull-ups',
    description: 'Upper body pulling strength',
    color: '#34C759',
    icon: 'arrow-up-outline',
    category: 'Bodyweight',
    difficulty: 'Advanced'
  },
  {
    id: 6,
    title: 'Deadlift',
    description: 'Full body strength and power',
    color: '#FF2D55',
    icon: 'barbell-outline',
    category: 'Strength',
    difficulty: 'Advanced'
  }
];

export default function Exercises({ navigation }) {
  const { theme } = useTheme();

  const handleExercisePress = (exercise) => {
    navigation.navigate('ExerciseDetail', { exercise });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Exercises</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Browse exercises by category
      </Text>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {exercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={[styles.card, { backgroundColor: exercise.color }]}
            onPress={() => handleExercisePress(exercise)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <Ionicons name={exercise.icon} size={32} color="#FFFFFF" />
                <View style={styles.titleContainer}>
                  <Text style={styles.cardTitle}>{exercise.title}</Text>
                  <Text style={styles.cardCategory}>{exercise.category}</Text>
                </View>
              </View>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>{exercise.difficulty}</Text>
              </View>
            </View>
            <Text style={styles.cardDescription}>{exercise.description}</Text>
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
    fontSize: Layout.text.xxlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.small,
  },
  subtitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.large,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.large,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.large,
    marginBottom: Layout.spacing.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleContainer: {
    marginLeft: Layout.spacing.medium,
    flex: 1,
  },
  cardTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.semibold,
    color: '#FFFFFF',
  },
  cardCategory: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  cardDescription: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.tiny,
    borderRadius: Layout.borderRadius.large,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
  },
}); 