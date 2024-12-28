import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { getExercises } from '../firebase/exercises';
import { useTheme } from '../theme/ThemeContext';
import ActivityMetricsForm from './ActivityMetricsForm';
import { scheduleExercise } from '../firebase/scheduledExercises';
import { auth } from '../config/firebase';

export default function Exercises({ navigation, route }) {
  const theme = useTheme();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMetricsForm, setShowMetricsForm] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedExercises, setSelectedExercises] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Mode handling
  const mode = route.params?.mode;
  const isCalendarMode = mode === 'selection';
  const isSectionBuilderMode = mode === 'section-builder';
  const isSelectionEnabled = isCalendarMode || isSectionBuilderMode;
  
  const onSelect = route.params?.onSelect;
  const onAddExercises = route.params?.onAddExercises;
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
    if (isSelectionEnabled) {
      toggleExerciseSelection(exercise.id);
    } else {
      navigation.navigate('ExerciseDetail', { exercise });
    }
  };

  const toggleExerciseSelection = (exerciseId) => {
    setSelectedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const handleProgramSelected = async () => {
    if (selectedExercises.size === 0) return;
    
    const selectedExercisesList = exercises.filter(ex => selectedExercises.has(ex.id));
    
    try {
      if (isSectionBuilderMode && onAddExercises) {
        // Add exercises to section
        const exercisesToAdd = selectedExercisesList.map(exercise => ({
          id: exercise.id,
          title: exercise.title,
          description: exercise.description,
          type: 'exercises',
          data: exercise
        }));
        
        onAddExercises(exercisesToAdd);
        navigation.goBack();
        return;
      }

      if (isCalendarMode) {
        // Schedule exercises to date
        if (!selectedDate) {
          Alert.alert('Error', 'No date selected for scheduling exercises.');
          return;
        }

        for (const exercise of selectedExercisesList) {
          await scheduleExercise(
            auth.currentUser.uid,
            exercise.id,
            selectedDate,
            { metrics: {} }
          );
        }
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error handling exercises:', error);
      Alert.alert('Error', 'Failed to process exercises. Please try again.');
    }
  };

  const handleMetricsSubmit = (metrics) => {
    if (onExerciseSelect && selectedExercise) {
      onExerciseSelect({ ...selectedExercise, metrics });
      setShowMetricsForm(false);
    }
  };

  const filteredExercises = exercises.filter(exercise => 
    exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.primaryMuscleGroup.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {isSectionBuilderMode ? 'Add to Section' : isCalendarMode ? 'Add to Schedule' : 'Exercises'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        {isSectionBuilderMode 
          ? 'Select exercises to add to section'
          : isCalendarMode 
            ? 'Select exercises to add to schedule' 
            : 'Choose an exercise to begin your workout'}
      </Text>

      <View style={styles.searchContainer}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color={theme.colors.textSecondary} 
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
          }]}
          placeholder="Search exercises..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isSelectionEnabled && selectedExercises.size > 0 && (
        <TouchableOpacity
          style={[styles.programButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleProgramSelected}
        >
          <Text style={styles.programButtonText}>
            {isSectionBuilderMode 
              ? `Add Selected (${selectedExercises.size})`
              : `Program Selected (${selectedExercises.size})`
            }
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredExercises.map((exercise) => (
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

            {isSelectionEnabled && (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => toggleExerciseSelection(exercise.id)}
              >
                <Ionicons 
                  name={selectedExercises.has(exercise.id) ? "checkmark-circle" : "ellipse-outline"} 
                  size={28} 
                  color={selectedExercises.has(exercise.id) ? theme.colors.primary : theme.colors.textSecondary} 
                />
              </TouchableOpacity>
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
  programButton: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
    marginBottom: Layout.spacing.large,
  },
  programButtonText: {
    color: '#FFFFFF',
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
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
    gap: Layout.spacing.small,
  },
  equipmentTag: {
    paddingHorizontal: Layout.spacing.small,
    paddingVertical: Layout.spacing.xsmall,
    borderRadius: Layout.borderRadius.small,
  },
  equipmentText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  selectButton: {
    padding: Layout.spacing.small,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.large,
  },
  searchIcon: {
    position: 'absolute',
    left: Layout.spacing.medium,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: Layout.minTouchSize,
    borderRadius: Layout.borderRadius.large,
    paddingLeft: Layout.spacing.large * 2,
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
}); 