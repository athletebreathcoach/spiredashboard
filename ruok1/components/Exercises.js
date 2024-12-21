import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { addExerciseToToday, addExerciseToDate } from '../firebase/programs';
import { auth } from '../config/firebase';
import { Calendar } from 'react-native-calendars';

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
        description: 'Cardiovascular endurance training',
        duration: '30 min',
        icon: 'walk-outline',
        settings: {
          defaultDistance: 3,
          defaultDuration: 30,
        },
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
        description: 'Compound upper body pushing movement',
        duration: '15 min',
        icon: 'barbell-outline',
        settings: {
          defaultSets: 3,
          defaultReps: 10,
          defaultRest: 90,
        },
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

export default function Exercises({ route, navigation }) {
  const { selectionMode, programId, dayData } = route.params || {};
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const handleExercisePress = async (exercise) => {
    if (selectionMode) {
      try {
        await addExerciseToToday(auth.currentUser.uid, exercise);
        navigation.goBack();
      } catch (error) {
        console.error('Error adding exercise:', error);
      }
    } else {
      navigation.navigate('ExerciseDetail', { exercise });
    }
  };

  const handleScroll = (event) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentPage(page);
  };

  const handleAddPress = (exercise, event) => {
    event.stopPropagation(); // Prevent triggering the card's onPress
    setSelectedExercise(exercise);
    setShowCalendar(true);
  };

  const handleDateSelect = async (date) => {
    console.log('Auth object:', auth);
    console.log('Current user:', auth.currentUser);
    console.log('User ID:', auth.currentUser?.uid);
    console.log('User email:', auth.currentUser?.email);

    if (!auth.currentUser) {
      console.log('No authenticated user!');
      Alert.alert('Error', 'Not authenticated');
      return;
    }

    const selectedDate = new Date(date.dateString);
    const today = new Date();
    
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() < today.getTime()) {
      Alert.alert('Invalid Date', 'Please select today or a future date');
      return;
    }

    try {
      await addExerciseToDate(auth.currentUser.uid, selectedExercise, selectedDate);
      setShowCalendar(false);
      setSelectedExercise(null);
    } catch (error) {
      console.error('Error scheduling exercise:', error);
      Alert.alert('Error', 'Failed to schedule exercise');
    }
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
                  style={[styles.exerciseItem, { backgroundColor: '#2C2C2E' }]}
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
                      <Text style={[styles.category, { color: '#00B5E0' }]}>
                        #{exercise.category}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={(event) => handleAddPress(exercise, event)}
                  >
                    <Ionicons 
                      name="add-circle-outline" 
                      size={24} 
                      color="#00B5E0" 
                    />
                  </TouchableOpacity>
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

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Select Date
            </Text>
            
            <Calendar
              theme={{
                backgroundColor: theme.colors.surface,
                calendarBackground: theme.colors.surface,
                textSectionTitleColor: theme.colors.textSecondary,
                selectedDayBackgroundColor: '#00B5E0',
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: '#00B5E0',
                dayTextColor: theme.colors.text,
                textDisabledColor: theme.colors.textSecondary,
                arrowColor: '#00B5E0',
                monthTextColor: theme.colors.text,
                textDayFontFamily: Typography.fonts.regular,
                textMonthFontFamily: Typography.fonts.semibold,
                textDayHeaderFontFamily: Typography.fonts.medium,
              }}
              onDayPress={handleDateSelect}
              enableSwipeMonths={true}
              current={new Date().toISOString().split('T')[0]}
              markedDates={{
                [new Date().toISOString().split('T')[0]]: {
                  selected: true,
                  selectedColor: '#00B5E0',
                }
              }}
            />

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowCalendar(false);
                setSelectedExercise(null);
              }}
            >
              <Text style={[styles.cancelText, { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addButton: {
    padding: 4,  // Give the plus icon some padding for better touch area
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: Layout.spacing.large,
  },
  modalContent: {
    width: '100%',
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.large,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    textAlign: 'center',
    marginBottom: Layout.spacing.large,
  },
  cancelButton: {
    marginTop: Layout.spacing.large,
    padding: Layout.spacing.medium,
  },
  cancelText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
}); 