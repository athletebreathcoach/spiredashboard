import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  ActivityIndicator,
  TextInput,
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
import { scheduleGuidedSession } from '../firebase/guidedSessions';
import { Calendar } from 'react-native-calendars';

export default function GuidedSessions({ navigation }) {
  const theme = useTheme();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCoach, setIsCoach] = useState(false);
  const { selectedClient, updateSelectedClient } = useSelectedClient();
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState({});

  useEffect(() => {
    fetchGuidedSessions();
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

  const fetchGuidedSessions = async () => {
    try {
      const sessionsRef = collection(db, 'guidedSessions');
      const q = query(sessionsRef, orderBy('title'));
      const snapshot = await getDocs(q);
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching guided sessions:', error);
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

  const handleScheduleSession = async () => {
    try {
      const userId = selectedClient?.id || auth.currentUser.uid;
      
      // Schedule the session for each selected date
      const dates = Object.keys(selectedDates);
      for (const dateString of dates) {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date();
        date.setFullYear(year);
        date.setMonth(month - 1);
        date.setDate(day);
        date.setHours(12, 0, 0, 0);

        await scheduleGuidedSession(userId, selectedSession.id, date, selectedTimeOfDay);
      }

      Alert.alert('Success', 'Session scheduled successfully');
      setShowCalendar(false);
      setSelectedTimeOfDay(null);
      updateSelectedClient(null);
      setSelectedDates({});
      setSelectedSession(null);
    } catch (error) {
      console.error('Error scheduling session:', error);
      Alert.alert('Error', 'Failed to schedule session. Please try again.');
    }
  };

  const handleTimeSelection = (timeOfDay) => {
    console.log('Handling time selection:', timeOfDay);
    setSelectedTimeOfDay(timeOfDay);
    setTimeout(() => {
      console.log('Showing calendar after delay');
      setShowCalendar(true);
    }, 100);
  };

  const handleCalendarPress = (session) => {
    setSelectedSession(session);
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
  };

  const formatDuration = (duration) => {
    return `${duration} min`;
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.type.toLowerCase().includes(searchQuery.toLowerCase())
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
        Guided Sessions
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Follow along with expert-led breathing sessions
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
          placeholder="Search guided sessions..."
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
        {filteredSessions.map((session) => (
          <TouchableOpacity
            key={session.id}
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('GuidedSessionDetail', { session })}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Ionicons 
                  name="play-circle-outline" 
                  size={24} 
                  color={theme.colors.primary} 
                  style={styles.cardIcon}
                />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {session.title}
                </Text>
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleCalendarPress(session);
                  }}
                >
                  <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
              <Text 
                style={[styles.cardDescription, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {session.description}
              </Text>
              <View style={styles.cardFooter}>
                <View style={[styles.typeContainer, { backgroundColor: `${theme.colors.primary}10` }]}>
                  <Text style={[styles.typeText, { color: theme.colors.text }]}>
                    {session.type}
                  </Text>
                </View>
                <View style={styles.durationContainer}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.duration, { color: theme.colors.textSecondary }]}>
                    {formatDuration(session.duration)}
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
                  setSelectedSession(null);
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
    backgroundColor: 'rgba(0, 181, 224, 0.1)',
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.small,
  },
  typeText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
    marginLeft: Layout.spacing.small,
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
    width: '90%',
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
}); 