import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width;  // Use full width for each column

const categories = [
  {
    id: 'cardio',
    title: 'Cardio',
    exercises: [
      {
        id: 1,
        title: 'Running',
        category: 'Cardio',
        date: 'Dec 9',
        icon: 'walk-outline',
        tracking: {
          type: 'cardio',
          fields: [
            { name: 'distance', unit: 'miles', type: 'number' },
            { name: 'time', unit: 'minutes', type: 'time' },
            { name: 'pace', unit: 'min/mile', type: 'calculated' }
          ]
        }
      },
      // Add more cardio exercises with similar tracking structure
    ]
  },
  {
    id: 'strength',
    title: 'Strength',
    exercises: [
      {
        id: 3,
        title: 'Bench Press',
        category: 'Strength',
        date: 'Dec 9',
        icon: 'barbell-outline',
        tracking: {
          type: 'strength',
          fields: [
            { name: 'weight', unit: 'lbs', type: 'number' },
            { name: 'sets', unit: null, type: 'number' },
            { name: 'reps', unit: null, type: 'number' },
            { name: 'rest', unit: 'seconds', type: 'time' }
          ]
        }
      },
      {
        id: 6,
        title: 'Deadlift',
        category: 'Strength',
        date: 'Dec 9',
        icon: 'barbell-outline',
        tracking: {
          type: 'strength',
          fields: [
            { name: 'weight', unit: 'lbs', type: 'number' },
            { name: 'sets', unit: null, type: 'number' },
            { name: 'reps', unit: null, type: 'number' },
            { name: 'rest', unit: 'seconds', type: 'time' }
          ]
        }
      },
    ]
  },
  {
    id: 'plyometrics',
    title: 'Plyometrics',
    exercises: [
      {
        id: 4,
        title: 'Box Jump',
        category: 'Plyometric',
        date: 'Dec 9',
        icon: 'trending-up-outline',
        tracking: {
          type: 'plyometric',
          fields: [
            { name: 'height', unit: 'inches', type: 'number' },
            { name: 'sets', unit: null, type: 'number' },
            { name: 'reps', unit: null, type: 'number' },
            { name: 'rest', unit: 'seconds', type: 'time' }
          ]
        }
      }
    ]
  }
];

export default function Exercises({ navigation }) {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);

  const handleExercisePress = (exercise) => {
    navigation.navigate('ExerciseDetail', { exercise });
  };

  const handleScroll = (event) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentPage(page);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        horizontal
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={COLUMN_WIDTH}
        snapToAlignment="center"
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {categories.map((category) => (
          <View key={category.id} style={styles.column}>
            <Text style={styles.columnTitle}>{category.title}</Text>
            
            <ScrollView 
              style={styles.exerciseList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.exerciseListContent}
            >
              {category.exercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={styles.exerciseItem}
                  onPress={() => handleExercisePress(exercise)}
                >
                  <Ionicons 
                    name={exercise.icon} 
                    size={24} 
                    color="#00B5E0" 
                    style={styles.exerciseIcon}
                  />
                  <View style={styles.exerciseContent}>
                    <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                    <View style={styles.exerciseDetails}>
                      <Text style={[styles.date, { color: '#00B5E0' }]}>{exercise.date}</Text>
                      <Text style={styles.category}>#{exercise.category}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={24} color="#00B5E0" />
                <Text style={[styles.addButtonText, { color: '#00B5E0' }]}>
                  Add {category.title} Exercise
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* Page Indicator */}
      <View style={styles.pageIndicator}>
        {categories.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: currentPage === index ? '#00B5E0' : '#48484A',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  horizontalScroll: {
    flex: 1,
  },
  column: {
    width: COLUMN_WIDTH,
    paddingHorizontal: 20,
    paddingTop: 20, // Add some top padding since we removed the header
  },
  columnTitle: {
    fontSize: 28,
    fontFamily: Typography.fonts.semibold,
    color: '#FFFFFF',
    marginVertical: 20,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseListContent: {
    paddingBottom: Layout.spacing.large,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginBottom: 8,
  },
  exerciseIcon: {
    marginRight: 12,
    width: 24,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 17,
    color: '#FFFFFF',
    fontFamily: Typography.fonts.regular,
    marginBottom: 4,
  },
  exerciseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 15,
    color: '#00B5E0',
    marginRight: 8,
    fontFamily: Typography.fonts.regular,
  },
  category: {
    fontSize: 15,
    color: '#8E8E93',
    fontFamily: Typography.fonts.regular,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  addButtonText: {
    color: '#00B5E0',
    fontSize: 17,
    marginLeft: 8,
    fontFamily: Typography.fonts.regular,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(28, 28, 30, 0.7)', // Slightly transparent background
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
}); 