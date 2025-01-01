import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useTheme } from '../theme/ThemeContext';
import { collection, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { scheduleBreathProtocol } from '../firebase/scheduledExercises';
import ClientSelector from './ClientSelector';
import { Calendar } from 'react-native-calendars';
import { useSelectedClient } from '../context/SelectedClientContext';

export default function BreathProtocols({ navigation, route }) {
  const theme = useTheme();
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDates, setSelectedDates] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState(null);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const isSelectionMode = route.params?.selectionMode;
  const onProtocolSelect = route.params?.onProtocolSelect;
  const { selectedClient } = useSelectedClient();
  const isCoach = route.params?.isCoach;

  // Add categories based on your protocols
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'relaxation', label: 'Relaxation' },
    { id: 'balance', label: 'Balance' },
    { id: 'energy', label: 'Energy' },
    { id: 'focus', label: 'Focus' },
    { id: 'sleep', label: 'Sleep' }
  ];

  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = async () => {
    try {
      const protocolsRef = collection(db, 'breathProtocols');
      const snapshot = await getDocs(protocolsRef);
      const protocolsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProtocols(protocolsData);
    } catch (error) {
      console.error('Error loading breath protocols:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProtocolPress = (protocol) => {
    if (!isSelectionMode) {
      const breathGuideParams = {
        settings: {
          inhaleTime: protocol.pattern.inhale,
          inhaleHoldTime: protocol.pattern.inHold,
          exhaleTime: protocol.pattern.exhale,
          exhaleHoldTime: protocol.pattern.exHold,
          rounds: protocol.rounds,
          totalTime: parseInt(protocol.duration),
          animationType: protocol.animationType
        },
        presetName: protocol.title
      };
      navigation.navigate('BreathGuide', breathGuideParams);
    }
  };

  const handleCalendarPress = (protocol) => {
    setSelectedProtocol(protocol);
    showTimeOfDayPicker();
  };

  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    setShowClientSelector(false);
    showTimeOfDayPicker();
  };

  const handleTimeOfDaySelect = (timeOfDay) => {
    setSelectedTimeOfDay(timeOfDay);
    setShowCalendar(true);
  };

  const handleDayPress = (day) => {
    console.log('Calendar day selected:', {
      selectedDay: day,
      dateString: day.dateString,
      timestamp: day.timestamp,
      parsedDate: new Date(day.dateString).toLocaleString()
    });
    
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

  const handleScheduleProtocol = async () => {
    try {
      const userId = selectedClient?.id || auth.currentUser.uid;
      const dates = Object.keys(selectedDates);
      
      // Navigate to BreathGuide with scheduling info
      const breathGuideParams = {
        settings: {
          inhaleTime: selectedProtocol.pattern.inhale,
          inhaleHoldTime: selectedProtocol.pattern.inHold,
          exhaleTime: selectedProtocol.pattern.exhale,
          exhaleHoldTime: selectedProtocol.pattern.exHold,
          rounds: selectedProtocol.rounds,
          totalTime: parseInt(selectedProtocol.duration)
        },
        presetName: selectedProtocol.title,
        schedulingInfo: {
          userId,
          protocolId: selectedProtocol.id,
          dates,
          timeOfDay: selectedTimeOfDay,
          protocol: selectedProtocol
        }
      };

      // Reset states
      setShowCalendar(false);
      setSelectedDates({});
      setSelectedTimeOfDay(null);
      setSelectedProtocol(null);

      navigation.navigate('BreathGuide', breathGuideParams);
    } catch (error) {
      console.error('Error preparing protocol:', error);
      Alert.alert('Error', 'Failed to prepare protocol');
    }
  };

  const showTimeOfDayPicker = () => {
    Alert.alert(
      'Select Time of Day',
      'When would you like to schedule this protocol?',
      [
        { text: 'Morning', onPress: () => handleTimeOfDaySelect('Morning') },
        { text: 'Afternoon', onPress: () => handleTimeOfDaySelect('Afternoon') },
        { text: 'Evening', onPress: () => handleTimeOfDaySelect('Evening') },
        { text: 'Anytime', onPress: () => handleTimeOfDaySelect('Anytime') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleAddPress = (protocol) => {
    if (isSelectionMode && route.params?.onSelect) {
      route.params.onSelect(protocol);
    }
  };

  const filteredProtocols = protocols.filter(protocol => {
    const matchesSearch = 
      protocol.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      protocol.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {showClientSelector && (
        <ClientSelector
          onClientSelect={handleClientSelect}
          onClose={() => setShowClientSelector(false)}
        />
      )}

      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {isSelectionMode ? 'Add Breath Protocol' : 'Breath Protocols'}
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {isSelectionMode ? 'Add Breath Protocol' : 'Breath Protocols'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Explore and practice different breathing techniques
        </Text>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                { 
                  backgroundColor: selectedCategory === category.id 
                    ? theme.colors.primary 
                    : theme.colors.surface 
                }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text 
                style={[
                  styles.categoryText, 
                  { 
                    color: selectedCategory === category.id 
                      ? theme.colors.background 
                      : theme.colors.text 
                  }
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
            placeholder="Search breath protocols..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {filteredProtocols.map((protocol) => (
          <TouchableOpacity
            key={protocol.id}
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleProtocolPress(protocol)}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Ionicons name="pulse-outline" size={24} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{protocol.title}</Text>
              </View>
              <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
                {protocol.description}
              </Text>
              <View style={styles.cardDetails}>
                <Text style={[styles.cardDetail, { color: theme.colors.textSecondary }]}>
                  Duration: {protocol.duration}
                </Text>
                <Text style={[styles.cardDetail, { color: theme.colors.textSecondary }]}>
                  {protocol.rounds} rounds
                </Text>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleCalendarPress(protocol)}
              >
                <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
              </TouchableOpacity>

              {isSelectionMode && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleAddPress(protocol)}
                >
                  <Ionicons name="add-circle" size={32} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
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
                onPress={handleScheduleProtocol}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.large,
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
    marginBottom: Layout.spacing.medium,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.medium,
  },
  cardDetail: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
  },
  buttonContainer: {
    marginLeft: Layout.spacing.medium,
    justifyContent: 'center',
    gap: Layout.spacing.medium,
  },
  iconButton: {
    padding: Layout.spacing.small,
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
    padding: Layout.spacing.small,
    borderRadius: Layout.borderRadius.large,
  },
  modalButtonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.semibold,
    textAlign: 'center',
  },
  calendar: {
    width: '100%',
    height: 300,
  },
  categoryContainer: {
    marginBottom: Layout.spacing.large,
  },
  categoryButton: {
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.large,
    marginRight: Layout.spacing.small,
  },
  categoryText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
  },
}); 