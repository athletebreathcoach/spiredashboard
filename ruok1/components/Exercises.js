import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { collection, getDocs, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useSelectedClient } from '../context/SelectedClientContext';
import { scheduleExercise } from '../firebase/scheduledExercises';
import { Calendar } from 'react-native-calendars';

export default function Exercises({ navigation }) {
  const theme = useTheme();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCoach, setIsCoach] = useState(false);
  const { selectedClient, updateSelectedClient } = useSelectedClient();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState({});
  const [showMetricsEditor, setShowMetricsEditor] = useState(false);
  const [metrics, setMetrics] = useState({
    sets: [{
      reps: '',
      weight: '',
      rest: '00:00'
    }],
    eachSide: false,
    notes: ''
  });

  useEffect(() => {
    fetchExercises();
    checkIfCoach();
  }, []);

  const checkIfCoach = async () => {
    try {
      const coachDoc = await getDoc(doc(db, 'coaches', auth.currentUser.uid));
      setIsCoach(coachDoc.exists());
    } catch (error) {
      console.error('Error checking coach status:', error);
    }
  };

  const fetchExercises = async () => {
    try {
      const exercisesRef = collection(db, 'exercises');
      const q = query(exercisesRef, orderBy('title'));
      const snapshot = await getDocs(q);
      const exercisesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExercises(exercisesData);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day) => {
    const dateString = day.dateString;
    const updatedDates = { ...selectedDates };
    
    if (updatedDates[dateString]) {
      delete updatedDates[dateString];
    } else {
      updatedDates[dateString] = {
        selected: true,
        selectedColor: theme.colors.primary
      };
    }
    
    setSelectedDates(updatedDates);
  };

  const handleScheduleExercise = async () => {
    try {
      const userId = selectedClient?.id || auth.currentUser.uid;
      
      // Schedule the exercise for each selected date
      const dates = Object.keys(selectedDates);
      for (const dateString of dates) {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date();
        date.setFullYear(year);
        date.setMonth(month - 1);
        date.setDate(day);
        date.setHours(12, 0, 0, 0);

        await scheduleExercise(
          userId, 
          selectedExercise.id, 
          date, 
          {
            metrics,
            timeOfDay: selectedTimeOfDay
          }
        );
      }

      Alert.alert('Success', 'Exercise scheduled successfully');
      setShowCalendar(false);
      setSelectedTimeOfDay(null);
      updateSelectedClient(null);
      setSelectedDates({});
      setSelectedExercise(null);
      setShowMetricsEditor(false);
      setMetrics({
        sets: [{
          reps: '',
          weight: '',
          rest: '00:00'
        }],
        eachSide: false,
        notes: ''
      });
    } catch (error) {
      console.error('Error scheduling exercise:', error);
      Alert.alert('Error', 'Failed to schedule exercise. Please try again.');
    }
  };

  const handleTimeSelection = (timeOfDay) => {
    console.log('Handling time selection:', timeOfDay);
    setSelectedTimeOfDay(timeOfDay);
    setShowCalendar(true);
  };

  const handleCalendarPress = (exercise) => {
    setSelectedExercise(exercise);
    Alert.alert(
      "Select Time of Day",
      "When would you like to schedule this exercise?",
      [
        {
          text: "Morning",
          onPress: () => handleTimeSelection('morning')
        },
        {
          text: "Afternoon",
          onPress: () => handleTimeSelection('afternoon')
        },
        {
          text: "Evening",
          onPress: () => handleTimeSelection('evening')
        },
        {
          text: "Anytime",
          onPress: () => handleTimeSelection('anytime')
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const handleAddSet = () => {
    setMetrics(current => ({
      ...current,
      sets: [
        ...current.sets,
        {
          reps: '',
          weight: '',
          rest: '00:00'
        }
      ]
    }));
  };

  const handleUpdateSet = (setIndex, field, value) => {
    setMetrics(current => {
      const updatedSets = [...current.sets];
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [field]: value
      };
      return {
        ...current,
        sets: updatedSets
      };
    });
  };

  const handleToggleEachSide = () => {
    setMetrics(current => ({
      ...current,
      eachSide: !current.eachSide
    }));
  };

  const handleCalendarDone = () => {
    setShowCalendar(false);
    setShowMetricsEditor(true);
  };

  const filteredExercises = exercises.filter(exercise =>
    exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.type?.toLowerCase().includes(searchQuery.toLowerCase())
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
        Exercises
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Browse and schedule exercises
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredExercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('ExerciseDetail', { exercise })}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Ionicons 
                  name="barbell-outline" 
                  size={24} 
                  color={theme.colors.primary} 
                  style={styles.cardIcon}
                />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {exercise.title}
                </Text>
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCalendarPress(exercise);
                  }}
                >
                  <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              <Text 
                style={[styles.cardDescription, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {exercise.description}
              </Text>
              <View style={styles.cardFooter}>
                <View style={[styles.typeContainer, { backgroundColor: `${theme.colors.primary}10` }]}>
                  <Text style={[styles.typeText, { color: theme.colors.text }]}>
                    {typeof exercise.type === 'object' ? exercise.type.name : exercise.type}
                  </Text>
                </View>
                <View style={styles.muscleGroupContainer}>
                  <Text style={[styles.muscleGroupText, { color: theme.colors.textSecondary }]}>
                    {typeof exercise.primaryMuscleGroup === 'object' ? exercise.primaryMuscleGroup.name : exercise.type}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Select Dates
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Selected dates: {Object.keys(selectedDates).length}
            </Text>

            <Calendar
              onDayPress={handleDayPress}
              markedDates={selectedDates}
              theme={{
                calendarBackground: theme.colors.surface,
                textSectionTitleColor: theme.colors.text,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.white,
                todayTextColor: theme.colors.primary,
                dayTextColor: theme.colors.text,
                textDisabledColor: theme.colors.textSecondary,
                arrowColor: theme.colors.primary,
                monthTextColor: theme.colors.text,
              }}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                onPress={() => {
                  setShowCalendar(false);
                  setSelectedDates({});
                  setSelectedExercise(null);
                  setSelectedTimeOfDay(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.white }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  { 
                    backgroundColor: Object.keys(selectedDates).length > 0 
                      ? theme.colors.primary 
                      : theme.colors.textSecondary 
                  }
                ]}
                onPress={handleCalendarDone}
                disabled={Object.keys(selectedDates).length === 0}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.white }]}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Metrics Editor Modal */}
      <Modal
        visible={showMetricsEditor}
        transparent={true}
        animationType="slide"
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Set Exercise Metrics
            </Text>

            {metrics.sets.map((set, setIndex) => (
              <View 
                key={`set-${setIndex}`} 
                style={styles.metricsRow}
              >
                <View style={styles.metricColumn}>
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>SET</Text>
                  <Text style={[styles.metricValue, { color: theme.colors.text }]}>{setIndex + 1}</Text>
                </View>
                <View style={styles.metricColumn}>
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>LB</Text>
                  <TextInput
                    style={[styles.metricInput, { color: theme.colors.text }]}
                    value={set.weight}
                    onChangeText={(value) => handleUpdateSet(setIndex, 'weight', value)}
                    keyboardType="numeric"
                    placeholder="-"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.metricColumn}>
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>REPS</Text>
                  <TextInput
                    style={[styles.metricInput, { color: theme.colors.text }]}
                    value={set.reps}
                    onChangeText={(value) => handleUpdateSet(setIndex, 'reps', value)}
                    keyboardType="numeric"
                    placeholder="-"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.metricColumn}>
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>REST</Text>
                  <TextInput
                    style={[styles.metricInput, { color: theme.colors.text }]}
                    value={set.rest}
                    onChangeText={(value) => handleUpdateSet(setIndex, 'rest', value)}
                    placeholder="00:00"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity 
              style={styles.addSetButton}
              onPress={handleAddSet}
            >
              <Ionicons name="add" size={20} color={theme.colors.primary} />
              <Text style={[styles.addSetText, { color: theme.colors.primary }]}>Add Set</Text>
            </TouchableOpacity>

            <View style={styles.eachSideRow}>
              <TouchableOpacity 
                style={[
                  styles.checkbox,
                  metrics.eachSide && { 
                    backgroundColor: theme.colors.primary, 
                    borderColor: theme.colors.primary 
                  }
                ]}
                onPress={handleToggleEachSide}
              >
                {metrics.eachSide && (
                  <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                )}
              </TouchableOpacity>
              <Text style={[styles.eachSideText, { color: theme.colors.textSecondary }]}>Each side</Text>
            </View>

            <TextInput
              style={[styles.notesInput, { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text 
              }]}
              placeholder="Add note..."
              placeholderTextColor={theme.colors.textSecondary}
              value={metrics.notes}
              onChangeText={(value) => setMetrics(current => ({ ...current, notes: value }))}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                onPress={() => {
                  setShowMetricsEditor(false);
                  setSelectedDates({});
                  setSelectedExercise(null);
                  setSelectedTimeOfDay(null);
                  setMetrics({
                    sets: [{
                      reps: '',
                      weight: '',
                      rest: '00:00'
                    }],
                    eachSide: false,
                    notes: ''
                  });
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.white }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleScheduleExercise}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.white }]}>Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.large,
  },
  card: {
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.medium,
    overflow: 'hidden',
  },
  cardContent: {
    padding: Layout.spacing.large,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  cardIcon: {
    marginRight: Layout.spacing.medium,
  },
  cardTitle: {
    flex: 1,
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
  },
  calendarButton: {
    padding: Layout.spacing.small,
    marginLeft: Layout.spacing.medium,
  },
  cardDescription: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.medium,
    lineHeight: Layout.text.medium * 1.4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeContainer: {
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.small,
  },
  typeText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
  },
  muscleGroupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muscleGroupText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.large,
  },
  modalTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.small,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.large,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.large,
  },
  modalButton: {
    flex: 1,
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
    marginHorizontal: Layout.spacing.small,
  },
  modalButtonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.medium,
  },
  metricColumn: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: Layout.text.small,
    marginBottom: Layout.spacing.small,
    fontFamily: Typography.fonts.medium,
  },
  metricValue: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  metricInput: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
    width: 60,
    padding: 0,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.medium,
  },
  addSetText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginLeft: Layout.spacing.small,
  },
  eachSideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    marginRight: Layout.spacing.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eachSideText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  notesInput: {
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.medium,
    minHeight: 80,
    marginBottom: Layout.spacing.medium,
    textAlignVertical: 'top',
  },
}); 