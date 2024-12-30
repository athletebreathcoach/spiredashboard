import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useTheme } from '../theme/ThemeContext';
import { Calendar } from 'react-native-calendars';
import { scheduleBreathTest } from '../firebase/scheduledExercises';
import { getBreathingTests, initializeBreathTests } from '../firebase/breathingTests';
import { auth } from '../config/firebase';
import { useSelectedClient } from '../context/SelectedClientContext';

export default function BreathingTests({ navigation }) {
  const theme = useTheme();
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState(null);
  const [selectedDates, setSelectedDates] = useState({});
  const { selectedClient } = useSelectedClient();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      // Initialize default tests if they don't exist
      await initializeBreathTests();
      // Get all tests
      const breathingTests = await getBreathingTests();
      setTests(breathingTests);
    } catch (error) {
      console.error('Error loading tests:', error);
      Alert.alert('Error', 'Failed to load breathing tests');
    } finally {
      setLoading(false);
    }
  };

  const handleCalendarPress = (test) => {
    setSelectedTest(test);
    showTimeOfDayPicker();
  };

  const showTimeOfDayPicker = () => {
    Alert.alert(
      'Select Time of Day',
      'When would you like to schedule this test?',
      [
        { text: 'Morning', onPress: () => handleTimeOfDaySelect('Morning') },
        { text: 'Afternoon', onPress: () => handleTimeOfDaySelect('Afternoon') },
        { text: 'Evening', onPress: () => handleTimeOfDaySelect('Evening') },
        { text: 'Anytime', onPress: () => handleTimeOfDaySelect('Anytime') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleTimeOfDaySelect = (timeOfDay) => {
    setSelectedTimeOfDay(timeOfDay);
    setShowCalendar(true);
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

  const handleScheduleTest = async () => {
    try {
      const userId = selectedClient?.id || auth.currentUser.uid;
      const dates = Object.keys(selectedDates);
      
      for (const dateString of dates) {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date();
        date.setFullYear(year);
        date.setMonth(month - 1);
        date.setDate(day);
        date.setHours(12, 0, 0, 0);
        
        await scheduleBreathTest(
          userId,
          selectedTest.id,
          date,
          {
            metrics: {
              timeOfDay: selectedTimeOfDay,
              completed: false
            }
          }
        );
      }

      setShowCalendar(false);
      setSelectedDates({});
      setSelectedTimeOfDay(null);
      setSelectedTest(null);
      Alert.alert('Success', 'Test scheduled successfully');
    } catch (error) {
      console.error('Error scheduling test:', error);
      Alert.alert('Error', 'Failed to schedule test');
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
        Breathing Tests
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Assess your breathing capacity
      </Text>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tests.map((test) => (
          <TouchableOpacity
            key={test.id}
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface }
            ]}
            onPress={() => navigation.navigate('BreathTestDetail', { test })}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name={test.icon} size={24} color={theme.colors.background} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{test.title}</Text>
              </View>
              <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
                {test.description}
              </Text>
              <Text style={[styles.cardCategory, { color: theme.colors.primary }]}>
                #{test.category}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => handleCalendarPress(test)}
            >
              <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
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
              style={styles.calendar}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: theme.colors.textSecondary,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.white,
                todayTextColor: theme.colors.primary,
                dayTextColor: theme.colors.text,
                textDisabledColor: theme.colors.textSecondary,
                dotColor: theme.colors.primary,
                selectedDotColor: theme.colors.white,
                arrowColor: theme.colors.primary,
                monthTextColor: theme.colors.text,
                textDayFontFamily: Typography.fonts.regular,
                textMonthFontFamily: Typography.fonts.semibold,
                textDayHeaderFontFamily: Typography.fonts.medium,
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
              markedDates={selectedDates}
              onDayPress={handleDayPress}
              minDate={new Date().toISOString().split('T')[0]}
              enableSwipeMonths={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                onPress={() => {
                  setShowCalendar(false);
                  setSelectedDates({});
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
                onPress={handleScheduleTest}
                disabled={Object.keys(selectedDates).length === 0}
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.medium,
  },
  cardTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
  },
  cardDescription: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.small,
  },
  cardCategory: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  calendarButton: {
    padding: Layout.spacing.small,
    marginLeft: Layout.spacing.medium,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
  },
  modalTitle: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.small,
  },
  modalSubtitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.large,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.large,
  },
  modalButton: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.semibold,
  },
  calendar: {
    width: '100%',
    height: 300,
  },
}); 