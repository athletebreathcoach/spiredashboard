import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { getExercises } from '../firebase/exercises';
import { useTheme } from '../theme/ThemeContext';
import ActivityMetricsForm from './ActivityMetricsForm';

export default function Exercises({ navigation, route }) {
  const theme = useTheme();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMetricsForm, setShowMetricsForm] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const isSelectionMode = route.params?.mode === 'selection';
  const onExerciseSelect = route.params?.onExerciseSelect;
  const selectedDate = route.params?.selectedDate;

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const exerciseData = await getExercises();
      setExercises(exerciseData);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExercisePress = (exercise) => {
    if (!isSelectionMode) {
      navigation.navigate('ExerciseDetail', { exercise });
    }
  };

  const handleAddPress = (exercise) => {
    if (isSelectionMode && onExerciseSelect) {
      setSelectedExercise({ ...exercise, type: 'exercise' });
      setShowMetricsForm(true);
    }
  };

  const handleMetricsSubmit = (metrics) => {
    if (onExerciseSelect && selectedExercise) {
      onExerciseSelect({ ...selectedExercise, metrics });
      setShowMetricsForm(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {isSelectionMode ? 'Add Exercise' : 'Exercises'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        {isSelectionMode ? 'Select an exercise to add to schedule' : 'Choose an exercise to begin your workout'}
      </Text>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {exercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleExercisePress(exercise)}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Ionicons name="barbell-outline" size={24} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{exercise.title}</Text>
              </View>
              <View style={styles.cardDetails}>
                <Text style={[styles.cardType, { color: theme.colors.textSecondary }]}>{exercise.type.name}</Text>
                <Text style={[styles.cardCategory, { color: theme.colors.primary }]}>#{exercise.primaryMuscleGroup.name}</Text>
              </View>
              <View style={styles.equipmentContainer}>
                {Object.values(exercise.equipment).map((equip) => (
                  <View key={equip.id} style={[styles.equipmentTag, { backgroundColor: theme.colors.border }]}>
                    <Text style={[styles.equipmentText, { color: theme.colors.text }]}>{equip.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            {isSelectionMode && (
              <View style={styles.addButtonContainer}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddPress(exercise)}
                >
                  <Ionicons name="add-circle" size={32} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ActivityMetricsForm
        visible={showMetricsForm}
        onClose={() => setShowMetricsForm(false)}
        onSubmit={handleMetricsSubmit}
        activity={selectedExercise}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  cardTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    marginLeft: Layout.spacing.medium,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  cardType: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginRight: Layout.spacing.medium,
  },
  cardCategory: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  equipmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentTag: {
    paddingHorizontal: Layout.spacing.small,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.small,
  },
  equipmentText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  addButtonContainer: {
    marginLeft: Layout.spacing.medium,
    justifyContent: 'center',
  },
  addButton: {
    padding: Layout.spacing.small,
  },
}); 