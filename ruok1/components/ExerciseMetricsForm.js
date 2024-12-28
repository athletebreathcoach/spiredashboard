import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useTheme } from '../theme/ThemeContext';

export default function ExerciseMetricsForm({ exercise, onSubmit, onCancel }) {
  const theme = useTheme();
  const [sets, setSets] = useState([
    { reps: '', weight: '', completed: false }
  ]);
  const [workingMax, setWorkingMax] = useState('');
  const [lastMax, setLastMax] = useState('None');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sectionExercises, setSectionExercises] = useState([]);

  useEffect(() => {
    if (exercise.sectionId && exercise.activities) {
      setSectionExercises(exercise.activities);
    }
  }, [exercise]);

  const handleAddSet = () => {
    setSets([...sets, { reps: '', weight: '', completed: false }]);
  };

  const handleRemoveSet = () => {
    if (sets.length > 1) {
      setSets(sets.slice(0, -1));
    }
  };

  const handleSetChange = (index, field, value) => {
    const newSets = [...sets];
    newSets[index] = {
      ...newSets[index],
      [field]: value
    };
    setSets(newSets);
  };

  const handleSetComplete = (index) => {
    const newSets = [...sets];
    newSets[index] = {
      ...newSets[index],
      completed: !newSets[index].completed
    };
    setSets(newSets);
  };

  const handleSubmit = () => {
    onSubmit({
      sets: sets,
      workingMax,
      lastMax,
    });

    // If there are more exercises in the section, move to the next one
    if (sectionExercises.length > currentExerciseIndex + 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setSets([{ reps: '', weight: '', completed: false }]);
    }
  };

  const currentExercise = sectionExercises.length > 0 
    ? sectionExercises[currentExerciseIndex] 
    : exercise;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.exerciseInfo}>
          {currentExercise.imageUrl && (
            <Image source={{ uri: currentExercise.imageUrl }} style={styles.exerciseImage} />
          )}
          <View style={styles.titleContainer}>
            {exercise.sectionTitle && (
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                {exercise.sectionTitle}
              </Text>
            )}
            <Text style={[styles.exerciseTitle, { color: theme.colors.text }]}>
              {currentExercise.title}
            </Text>
          </View>
        </View>
      </View>

      {sectionExercises.length > 0 && (
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: theme.colors.primary,
                width: `${((currentExerciseIndex + 1) / sectionExercises.length) * 100}%`
              }
            ]} 
          />
        </View>
      )}

      <View style={styles.maxSection}>
        <View style={styles.maxRow}>
          <Text style={[styles.label, { color: theme.colors.text }]}>LAST</Text>
          <Text style={[styles.maxValue, { color: theme.colors.text }]}>{lastMax}</Text>
        </View>
        <View style={styles.maxRow}>
          <Text style={[styles.label, { color: theme.colors.text }]}>WORKING MAX</Text>
          <TouchableOpacity style={styles.addMaxButton}>
            <Text style={[styles.addMaxText, { color: theme.colors.primary }]}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.setsHeader}>
        <Text style={[styles.setsLabel, { color: theme.colors.text }]}>Sets</Text>
        <Text style={[styles.repsLabel, { color: theme.colors.text }]}>Reps</Text>
        <Text style={[styles.weightLabel, { color: theme.colors.text }]}>Lb</Text>
      </View>

      <ScrollView style={styles.setsContainer}>
        {sets.map((set, index) => (
          <View key={index} style={styles.setRow}>
            <Text style={[styles.setNumber, { color: theme.colors.text }]}>{index + 1}</Text>
            <TextInput
              style={[styles.input, { 
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }]}
              value={set.reps}
              onChangeText={(value) => handleSetChange(index, 'reps', value)}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={[styles.input, { 
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }]}
              value={set.weight}
              onChangeText={(value) => handleSetChange(index, 'weight', value)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TouchableOpacity
              style={[styles.checkButton, { 
                backgroundColor: set.completed ? theme.colors.success : 'transparent',
                borderColor: set.completed ? theme.colors.success : theme.colors.border
              }]}
              onPress={() => handleSetComplete(index)}
            >
              {set.completed && (
                <Ionicons name="checkmark" size={20} color={theme.colors.white} />
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.setControls}>
        <TouchableOpacity 
          style={[styles.setControlButton, { borderColor: theme.colors.border }]}
          onPress={handleRemoveSet}
        >
          <Ionicons name="remove" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.setText, { color: theme.colors.text }]}>Set</Text>
        <TouchableOpacity 
          style={[styles.setControlButton, { borderColor: theme.colors.border }]}
          onPress={handleAddSet}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.addNoteButton, { borderColor: theme.colors.border }]}
      >
        <Text style={[styles.addNoteText, { color: theme.colors.textSecondary }]}>
          Add exercise note
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleSubmit}
      >
        <Text style={[styles.submitButtonText, { color: theme.colors.white }]}>
          {sectionExercises.length > currentExerciseIndex + 1 ? 'Next Exercise' : 'Complete'}
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
    padding: Layout.spacing.medium,
  },
  closeButton: {
    padding: Layout.spacing.small,
  },
  exerciseInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Layout.spacing.medium,
  },
  exerciseImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: Layout.spacing.medium,
  },
  exerciseTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
  },
  maxSection: {
    padding: Layout.spacing.medium,
  },
  maxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.small,
  },
  label: {
    fontSize: 14,
    fontFamily: Typography.fonts.medium,
  },
  maxValue: {
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
  addMaxButton: {
    padding: Layout.spacing.small,
  },
  addMaxText: {
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
  setsHeader: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  setsLabel: {
    flex: 0.2,
    fontSize: 14,
    fontFamily: Typography.fonts.medium,
  },
  repsLabel: {
    flex: 0.4,
    fontSize: 14,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
  weightLabel: {
    flex: 0.4,
    fontSize: 14,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
  setsContainer: {
    flex: 1,
    padding: Layout.spacing.medium,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  setNumber: {
    width: 30,
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: Layout.borderRadius.small,
    paddingHorizontal: Layout.spacing.medium,
    marginHorizontal: Layout.spacing.small,
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Layout.spacing.small,
  },
  setControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.medium,
  },
  setControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Layout.spacing.medium,
  },
  setText: {
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
  addNoteButton: {
    margin: Layout.spacing.medium,
    padding: Layout.spacing.medium,
    borderWidth: 1,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
  },
  addNoteText: {
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
    marginBottom: 4,
  },
  progressBar: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: Layout.spacing.medium,
  },
  progressFill: {
    height: '100%',
  },
  submitButton: {
    margin: Layout.spacing.medium,
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
  },
}); 