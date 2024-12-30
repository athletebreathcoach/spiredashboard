import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useTheme } from '../theme/ThemeContext';
import { getHabits, getTasks } from '../firebase/habits';
import { auth } from '../config/firebase';
import { scheduleHabit } from '../firebase/scheduledExercises';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const { width } = Dimensions.get('window');
const DAYS_IN_WEEK = 7;
const DAY_WIDTH = width / DAYS_IN_WEEK;

export default function HabitsTasks({ navigation, route }) {
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientsList, setClientsList] = useState([]);
  const [habitToSchedule, setHabitToSchedule] = useState(null);
  const isSelectionMode = route.params?.mode === 'selection';
  const onSelect = route.params?.onSelect;
  const selectedDate = route.params?.selectedDate;
  const itemType = route.params?.itemType || 'habit';
  const [isCoach, setIsCoach] = useState(false);

  useEffect(() => {
    loadItems();
    checkIfCoach();
  }, [itemType]);

  const loadItems = async () => {
    try {
      const itemsData = itemType === 'habit' ? await getHabits() : await getTasks();
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfCoach = async () => {
    try {
      const coachDoc = await getDoc(doc(db, 'coaches', auth.currentUser.uid));
      setIsCoach(coachDoc.exists());
    } catch (error) {
      console.error('Error checking coach status:', error);
    }
  };

  const handleItemPress = (item) => {
    if (isSelectionMode && onSelect) {
      onSelect(item);
      navigation.goBack();
    } else {
      navigation.navigate('HabitTaskDetail', { item });
    }
  };

  const handleCalendarPress = (habit) => {
    if (isCoach) {
      showClientSelector(habit);
    } else {
      showTimeOfDayPicker(habit, auth.currentUser.uid);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add days from previous month to fill the first week
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek; i > 0; i--) {
      const prevDate = new Date(year, month, -i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }

    // Add days from next month to fill the last week
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }

    return days;
  };

  const isDateSelected = (date) => {
    return selectedDates.some(selectedDate => 
      selectedDate.toDateString() === date.toDateString()
    );
  };

  const toggleDateSelection = (date) => {
    setSelectedDates(prev => {
      const dateString = date.toDateString();
      const exists = prev.some(d => d.toDateString() === dateString);
      if (exists) {
        return prev.filter(d => d.toDateString() !== dateString);
      } else {
        return [...prev, date];
      }
    });
  };

  const handleScheduleHabit = async (habit, selectedDates, selectedTimeOfDay, selectedClientId) => {
    try {
      console.log('Scheduling habit for client:', selectedClientId);
      console.log('Habit details:', habit);
      console.log('Selected dates:', selectedDates);
      console.log('Time of day:', selectedTimeOfDay);

      const promises = selectedDates.map(date => {
        const scheduledDateTime = new Date(date);
        return scheduleHabit(
          selectedClientId || auth.currentUser.uid,
          habit.id,
          scheduledDateTime,
          { 
            metrics: {
              completed: false,
              streak: 0,
              timeOfDay: selectedTimeOfDay
            }
          }
        );
      });
      await Promise.all(promises);
      Alert.alert('Success', 'Habit scheduled successfully');
      // Reset and close everything
      setShowDatePicker(false);
      setSelectedDates([]);
      setSelectedHabit(null);
      setSelectedClientId(null);
      setSelectedTimeOfDay(null);
    } catch (error) {
      console.error('Error scheduling habit:', error);
      Alert.alert('Error', 'Failed to schedule habit. Please try again.');
    }
  };

  const showTimeOfDayPicker = (habit, clientId) => {
    Alert.alert(
      "Select Time of Day",
      "When would you like to schedule this habit?",
      [
        {
          text: "Morning",
          onPress: () => {
            setShowDatePicker(true);
            setSelectedHabit(habit);
            setSelectedClientId(clientId);
            setSelectedTimeOfDay('morning');
          }
        },
        {
          text: "Afternoon",
          onPress: () => {
            setShowDatePicker(true);
            setSelectedHabit(habit);
            setSelectedClientId(clientId);
            setSelectedTimeOfDay('afternoon');
          }
        },
        {
          text: "Evening",
          onPress: () => {
            setShowDatePicker(true);
            setSelectedHabit(habit);
            setSelectedClientId(clientId);
            setSelectedTimeOfDay('evening');
          }
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
  };

  const showClientSelector = async (habit) => {
    try {
      console.log('Fetching clients for coach:', auth.currentUser.uid);
      
      // First check if the coach document exists
      const coachDoc = await getDoc(doc(db, 'coaches', auth.currentUser.uid));
      console.log('Coach document exists:', coachDoc.exists());
      
      if (!coachDoc.exists()) {
        console.log('No coach document found');
        return;
      }

      // Get client IDs from the coach document
      const coachData = coachDoc.data();
      const clientIds = coachData.clients || [];
      console.log('Found client IDs:', clientIds);

      // Then fetch each client's details from the users collection
      const fetchedClients = await Promise.all(
        clientIds.map(async (clientId) => {
          const clientDoc = await getDoc(doc(db, 'users', clientId));
          if (clientDoc.exists()) {
            const data = clientDoc.data();
            return {
              id: clientId,
              name: data.name || data.email || 'Unnamed Client'
            };
          }
          return null;
        })
      );

      // Filter out any null values and add "My Training" option
      const validClients = fetchedClients.filter(client => client !== null);
      validClients.unshift({
        id: auth.currentUser.uid,
        name: 'My Training'
      });

      console.log('Final client list:', validClients);
      setClientsList(validClients);
      setHabitToSchedule(habit);
      setShowClientModal(true);
    } catch (error) {
      console.error('Error fetching clients:', error);
      Alert.alert('Error', 'Failed to load clients. Please try again.');
    }
  };

  const showCalendar = (habit, clientId, timeOfDay) => {
    setSelectedHabit(habit);
    setSelectedClientId(clientId);
    setSelectedTimeOfDay(timeOfDay);
    setShowCalendarModal(true);
  };

  const changeMonth = (increment) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.categoryId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Ionicons name={item.icon} size={24} color={theme.colors.primary} />
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
        </View>
        <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
          {item.description}
        </Text>
        {item.type === 'task' && (
          <Text style={[styles.cardPriority, { color: theme.colors.primary }]}>
            Priority: {item.priority}
          </Text>
        )}
      </View>

      {item.type === 'habit' && (
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => handleCalendarPress(item)}
        >
          <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
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
        {isSelectionMode ? `Add ${itemType === 'habit' ? 'Habit' : 'Task'}` : 'Habits & Tasks'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        {isSelectionMode 
          ? `Select a ${itemType} to add to schedule` 
          : 'Build consistent practices and complete tasks'}
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
          placeholder="Search habits and tasks..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredItems.map(renderCard)}
      </ScrollView>

      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Select Dates for {selectedHabit?.title}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Selected dates: {selectedDates.length}
            </Text>

            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.monthText, { color: theme.colors.text }]}>
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <Text 
                  key={index} 
                  style={[styles.weekDayText, { color: theme.colors.textSecondary }]}
                >
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendar}>
              {getDaysInMonth(currentMonth).map((item, index) => {
                const isSelected = isDateSelected(item.date);
                const isToday = item.date.toDateString() === new Date().toDateString();
                const isPast = item.date < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayButton,
                      !item.isCurrentMonth && styles.otherMonthDay,
                      isSelected && [styles.selectedDay, { backgroundColor: theme.colors.primary }],
                      isPast && styles.pastDay,
                    ]}
                    onPress={() => !isPast && toggleDateSelection(item.date)}
                    disabled={isPast}
                  >
                    <Text style={[
                      styles.dayText,
                      { color: theme.colors.text },
                      !item.isCurrentMonth && { color: theme.colors.textSecondary },
                      isSelected && { color: theme.colors.white },
                      isToday && { fontWeight: 'bold' },
                      isPast && { color: theme.colors.textSecondary },
                    ]}>
                      {item.date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                onPress={() => {
                  setShowDatePicker(false);
                  setSelectedDates([]);
                  setSelectedHabit(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.white }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  { 
                    backgroundColor: selectedDates.length > 0 
                      ? theme.colors.primary 
                      : theme.colors.textSecondary 
                  }
                ]}
                onPress={() => handleScheduleHabit(selectedHabit, selectedDates, selectedTimeOfDay, selectedClientId)}
                disabled={selectedDates.length === 0}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.white }]}>Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showClientModal}
        transparent={true}
        animationType="slide"
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Select Client
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Choose a client to schedule for
            </Text>

            <ScrollView style={styles.clientListContainer}>
              {clientsList.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={[
                    styles.clientButton,
                    { 
                      backgroundColor: theme.colors.primary + '10',
                      marginBottom: Layout.spacing.small,
                      borderRadius: Layout.borderRadius.medium,
                    }
                  ]}
                  onPress={() => {
                    setShowClientModal(false);
                    showTimeOfDayPicker(habitToSchedule, client.id);
                  }}
                >
                  <Text style={[styles.clientButtonText, { color: theme.colors.text }]}>
                    {client.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.colors.error }]}
              onPress={() => {
                setShowClientModal(false);
                setHabitToSchedule(null);
              }}
            >
              <Text style={[styles.buttonText, { color: theme.colors.white }]}>Cancel</Text>
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
  cardDescription: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.small,
  },
  cardPriority: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  calendarButton: {
    padding: Layout.spacing.medium,
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
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  monthText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.semibold,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.small,
  },
  weekDayText: {
    width: DAY_WIDTH,
    textAlign: 'center',
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Layout.spacing.large,
  },
  dayButton: {
    width: DAY_WIDTH,
    height: DAY_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: DAY_WIDTH / 2,
  },
  dayText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  selectedDay: {
    backgroundColor: '#007AFF',
  },
  otherMonthDay: {
    opacity: 0.5,
  },
  pastDay: {
    opacity: 0.3,
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
  },
  clientListContainer: {
    maxHeight: 300,
    width: '100%',
    marginVertical: Layout.spacing.medium,
  },
  clientButton: {
    width: '100%',
    padding: Layout.spacing.large,
    alignItems: 'center',
    marginBottom: Layout.spacing.small,
  },
  clientButtonText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.semibold,
  },
  cancelButton: {
    width: '100%',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
    marginTop: Layout.spacing.medium,
  },
  buttonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
}); 