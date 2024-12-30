import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions,
  Alert,
  Modal
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Calendar } from 'react-native-calendars';
import { useSelectedClient } from '../context/SelectedClientContext';
import { scheduleGuidedSession } from '../firebase/guidedSessions';
import { updateExerciseMetrics } from '../firebase/scheduledExercises';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = width * 9/16; // 16:9 aspect ratio

export default function GuidedSessionDetail({ navigation, route }) {
  const theme = useTheme();
  const { session, isScheduled, scheduledExerciseId } = route.params;
  const [playing, setPlaying] = useState(false);
  const [isCoach, setIsCoach] = useState(false);
  const { selectedClient, updateSelectedClient } = useSelectedClient();
  const [showTimeOfDayPicker, setShowTimeOfDayPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState(null);
  const [selectedDates, setSelectedDates] = useState({});

  useEffect(() => {
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

  const handleScheduleSession = async () => {
    try {
      const userId = selectedClient?.id || auth.currentUser.uid;
      
      // Schedule the session for each selected date
      const dates = Object.keys(selectedDates);
      for (const dateString of dates) {
        // Parse the date string components
        const [year, month, day] = dateString.split('-').map(Number);
        // Create date using local components to avoid timezone issues
        const date = new Date();
        date.setFullYear(year);
        date.setMonth(month - 1); // months are 0-based
        date.setDate(day);
        date.setHours(12, 0, 0, 0);

        console.log('Scheduling guided session date:', {
          originalDateString: dateString,
          year,
          month,
          day,
          parsedDate: date,
          parsedDateISO: date.toISOString(),
          parsedDateLocale: date.toLocaleString()
        });

        await scheduleGuidedSession(userId, session.id, date, selectedTimeOfDay);
      }

      Alert.alert('Success', 'Session scheduled successfully');
      setShowCalendar(false);
      setSelectedTimeOfDay(null);
      updateSelectedClient(null);
      setSelectedDates({});
    } catch (error) {
      console.error('Error scheduling session:', error);
      Alert.alert('Error', 'Failed to schedule session. Please try again.');
    }
  };

  const handleTimeSelection = (timeOfDay) => {
    console.log('Handling time selection:', timeOfDay);
    setSelectedTimeOfDay(timeOfDay);
    // Small delay before showing calendar
    setTimeout(() => {
      console.log('Showing calendar after delay');
      setShowCalendar(true);
    }, 100);
  };

  const handleCalendarPress = () => {
    if (isCoach) {
      // Show time of day picker immediately
      Alert.alert(
        "Select Time of Day",
        "When would you like to schedule this session?",
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
    } else {
      Alert.alert(
        "Select Time of Day",
        "When would you like to schedule this session?",
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
    }
  };

  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      setPlaying(false);
      handleSessionComplete();
    }
  }, []);

  const handleSessionComplete = async () => {
    try {
      // Save to the guidedSessions subcollection
      const guidedSessionsRef = collection(db, 'users', auth.currentUser.uid, 'guidedSessions');
      await addDoc(guidedSessionsRef, {
        sessionId: session.id,
        title: session.title,
        type: session.type,
        duration: session.duration,
        intensity: session.intensity,
        completedAt: serverTimestamp()
      });

      Alert.alert(
        "Session Complete!",
        "Great job completing the guided session! It has been saved to your history.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving guided session:', error);
      Alert.alert('Error', 'Failed to save session to history');
    }
  };

  const handleLogSession = async () => {
    try {
      // Update the scheduled exercise as completed
      await updateExerciseMetrics(scheduledExerciseId, {
        completed: true,
        logged: true
      });

      // Save to guided sessions collection
      const guidedSessionsRef = collection(db, 'users', auth.currentUser.uid, 'guidedSessions');
      await addDoc(guidedSessionsRef, {
        sessionId: session.id,
        title: session.title,
        type: 'guidedSession',
        duration: session.duration,
        intensity: session.intensity,
        completedAt: serverTimestamp(),
      });

      Alert.alert(
        "Session Logged!",
        "Great job completing the guided session!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error logging guided session:', error);
      Alert.alert('Error', 'Failed to log session. Please try again.');
    }
  };

  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeVideoId(session.videoUrl);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          Guided Session
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.videoContainer}>
          <YoutubePlayer
            height={VIDEO_HEIGHT}
            play={playing}
            videoId={videoId}
            onChangeState={onStateChange}
          />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {session.title}
          </Text>

          <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {session.duration} min
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Duration
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="fitness-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {session.type}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Type
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="speedometer-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {session.intensity}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Intensity
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            About this session
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {session.description}
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      {!isCoach && !isScheduled && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={handleCalendarPress}
          >
            <Ionicons name="calendar-outline" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Log Button for Scheduled Sessions */}
      {isScheduled && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={handleLogSession}
          >
            <Ionicons name="checkmark" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      )}

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
                onPress={handleScheduleSession}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.medium,
    height: 60,
    marginTop: 40,
  },
  backButton: {
    padding: Layout.spacing.small,
    marginRight: Layout.spacing.small,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    textAlign: 'center',
    marginRight: Layout.spacing.xlarge,
  },
  scrollView: {
    flex: 1,
  },
  videoContainer: {
    width: width,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  content: {
    padding: Layout.spacing.large,
  },
  title: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.large,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.large,
    marginBottom: Layout.spacing.large,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    marginHorizontal: Layout.spacing.large,
  },
  statValue: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    marginVertical: Layout.spacing.small,
  },
  statLabel: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  sectionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.medium,
  },
  description: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    lineHeight: Layout.text.medium * 1.5,
    marginBottom: Layout.spacing.large,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    margin: Layout.spacing.large,
  },
  scheduleButtonText: {
    marginLeft: Layout.spacing.small,
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  calendar: {
    marginBottom: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
    overflow: 'hidden',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.large,
  },
  modalTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.medium,
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
    marginHorizontal: Layout.spacing.small,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
  clientOption: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  clientName: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  timeOption: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  timeText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
  cancelButton: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginTop: Layout.spacing.medium,
  },
  cancelButtonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: Layout.spacing.large,
    right: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
    overflow: 'hidden',
  },
  fab: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
  },
}); 