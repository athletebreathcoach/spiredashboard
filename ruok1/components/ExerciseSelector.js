import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { getPresetExercises } from '../firebase/exercises';

export default function ExerciseSelector({ route, navigation }) {
  const { theme } = useTheme();
  const { onSelect } = route.params;
  const [exercises, setExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const exerciseData = await getPresetExercises();
      setExercises(exerciseData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading exercises:', error);
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(exercise => 
    exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (exercise) => {
    onSelect(exercise);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Search Bar */}
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

      {/* Exercise List */}
      <ScrollView style={styles.exerciseList}>
        {filteredExercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={[styles.exerciseCard, { backgroundColor: '#2C2C2E' }]}
            onPress={() => handleSelect(exercise)}
          >
            <Ionicons 
              name={exercise.icon} 
              size={24} 
              color="#00B5E0" 
              style={styles.exerciseIcon}
            />
            <View style={styles.exerciseContent}>
              <Text style={[styles.exerciseTitle, { color: theme.colors.text }]}>
                {exercise.title}
              </Text>
              <View style={styles.exerciseDetails}>
                <Text style={[styles.exerciseType, { color: theme.colors.textSecondary }]}>
                  {exercise.type}
                </Text>
                <Text style={[styles.exerciseCategory, { color: '#00B5E0' }]}>
                  #{exercise.category}
                </Text>
              </View>
            </View>
            <Ionicons 
              name="add-circle-outline" 
              size={24} 
              color="#00B5E0" 
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
  exerciseList: {
    flex: 1,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  exerciseIcon: {
    marginRight: Layout.spacing.medium,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: 4,
  },
  exerciseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseType: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
    marginRight: Layout.spacing.medium,
  },
  exerciseCategory: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
}); 