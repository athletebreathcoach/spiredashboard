import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Calendar } from 'react-native-calendars';

export default function ProgramDetail({ route, navigation }) {
  const theme = useTheme();
  const { program } = route.params;
  const [programType, setProgramType] = useState(null); // 'weekly' or 'calendar'
  const [showTypeSelector, setShowTypeSelector] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState({});

  const days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday',
    'Friday', 'Saturday', 'Sunday'
  ];

  const handleTypeSelect = (type) => {
    setProgramType(type);
    setShowTypeSelector(false);
  };

  const handleDayPress = (day) => {
    navigation.navigate('ProgramDayEdit', { 
      program,
      day,
      type: programType 
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date.dateString);
    navigation.navigate('ProgramDayEdit', {
      program,
      date: date.dateString,
      type: programType
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Program Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {program.title}
        </Text>
        <Text style={[styles.duration, { color: '#00B5E0' }]}>
          {program.duration}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {program.description}
        </Text>
      </View>

      {/* Program Type Selector Modal */}
      <Modal
        visible={showTypeSelector}
        transparent
        animationType="slide"
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Select Program Type
            </Text>
            <TouchableOpacity
              style={[styles.typeOption, { backgroundColor: theme.colors.background }]}
              onPress={() => handleTypeSelect('weekly')}
            >
              <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
              <View style={styles.typeOptionContent}>
                <Text style={[styles.typeTitle, { color: theme.colors.text }]}>
                  Weekly Schedule
                </Text>
                <Text style={[styles.typeDescription, { color: theme.colors.textSecondary }]}>
                  Repeats every week
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeOption, { backgroundColor: theme.colors.background }]}
              onPress={() => handleTypeSelect('calendar')}
            >
              <Ionicons name="today-outline" size={24} color={theme.colors.primary} />
              <View style={styles.typeOptionContent}>
                <Text style={[styles.typeTitle, { color: theme.colors.text }]}>
                  Calendar Based
                </Text>
                <Text style={[styles.typeDescription, { color: theme.colors.textSecondary }]}>
                  Specific dates
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Program Schedule */}
      {programType === 'weekly' && (
        <ScrollView style={styles.schedule}>
          {days.map((day) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayCard, { backgroundColor: '#2C2C2E' }]}
              onPress={() => handleDayPress(day)}
            >
              <Text style={[styles.dayTitle, { color: theme.colors.text }]}>
                {day}
              </Text>
              <Ionicons name="chevron-forward" size={24} color="#00B5E0" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {programType === 'calendar' && (
        <View style={styles.calendarContainer}>
          <Calendar
            style={styles.calendar}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: theme.colors.textSecondary,
              selectedDayBackgroundColor: '#00B5E0',
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: '#00B5E0',
              dayTextColor: theme.colors.text,
              textDisabledColor: theme.colors.textSecondary,
              dotColor: '#00B5E0',
              selectedDotColor: '#FFFFFF',
              arrowColor: '#00B5E0',
              monthTextColor: theme.colors.text,
              textDayFontFamily: Typography.fonts.regular,
              textMonthFontFamily: Typography.fonts.semibold,
              textDayHeaderFontFamily: Typography.fonts.medium,
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                selected: true,
                selectedColor: '#00B5E0',
              }
            }}
            onDayPress={handleDateSelect}
            enableSwipeMonths={true}
            minDate={new Date().toISOString().split('T')[0]}
            maxDate={new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
          />
          
          <View style={styles.upcomingContainer}>
            <Text style={[styles.upcomingTitle, { color: theme.colors.text }]}>
              Upcoming Workouts
            </Text>
            <ScrollView style={styles.upcomingList}>
              {Object.keys(markedDates).map(date => (
                <TouchableOpacity
                  key={date}
                  style={[styles.upcomingCard, { backgroundColor: '#2C2C2E' }]}
                  onPress={() => handleDateSelect({ dateString: date })}
                >
                  <View>
                    <Text style={[styles.upcomingDate, { color: theme.colors.text }]}>
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                    <Text style={[styles.upcomingCount, { color: theme.colors.textSecondary }]}>
                      {markedDates[date].exercises?.length || 0} exercises
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#00B5E0" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Layout.spacing.large,
  },
  title: {
    fontSize: 28,
    fontFamily: Typography.fonts.bold,
    marginBottom: 8,
  },
  duration: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: Layout.spacing.large,
  },
  modalContent: {
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: Typography.fonts.semibold,
    marginBottom: Layout.spacing.large,
    textAlign: 'center',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.medium,
    backgroundColor: '#2C2C2E',
  },
  typeOptionContent: {
    marginLeft: Layout.spacing.medium,
  },
  typeTitle: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
  },
  schedule: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  dayTitle: {
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
  },
  calendarContainer: {
    flex: 1,
  },
  calendar: {
    marginBottom: Layout.spacing.large,
  },
  upcomingContainer: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  upcomingTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    marginBottom: Layout.spacing.medium,
  },
  upcomingList: {
    flex: 1,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  upcomingDate: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginBottom: 4,
  },
  upcomingCount: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
  },
}); 