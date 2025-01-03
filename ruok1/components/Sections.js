import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useTheme } from '../theme/ThemeContext';
import { createSection, updateSection, getSections, deleteSection } from '../firebase/sections';
import { scheduleSection } from '../firebase/scheduledExercises';
import { auth } from '../config/firebase';
import { Calendar } from 'react-native-calendars';
import { useSelectedClient } from '../context/SelectedClientContext';

const SECTION_TYPES = [
  { id: 'standard', label: 'Standard', icon: 'barbell-outline' },
  { id: 'forTime', label: 'For Time', icon: 'timer-outline' },
  { id: 'amrap', label: 'AMRAP', icon: 'infinite-outline' },
  { id: 'chipper', label: 'Chipper', icon: 'list-outline' },
  { id: 'intervals', label: 'Intervals', icon: 'repeat-outline' }
];

export default function Sections({ navigation, route, searchQuery = '' }) {
  const { selectedClient } = useSelectedClient();
  const theme = useTheme();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const isSelectionMode = route.params?.selectedDate != null;
  const { selectedDate, selectedSection: routeSelectedSection, selectedTimeOfDay: routeSelectedTimeOfDay } = route.params || {};
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState(null);

  useEffect(() => {
    loadSections();
  }, [selectedType]);

  useEffect(() => {
    if (routeSelectedSection && routeSelectedTimeOfDay) {
      setSelectedSection(routeSelectedSection);
      setSelectedTimeOfDay(routeSelectedTimeOfDay);
      setShowCalendar(true);
    }
  }, [routeSelectedSection, routeSelectedTimeOfDay]);

  const loadSections = async () => {
    try {
      setLoading(true);
      const sectionsData = await getSections(auth.currentUser.uid, selectedType);
      setSections(sectionsData);
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = () => {
    navigation.navigate('ActivitySelector', {
      onNextScreen: 'SectionDetail'
    });
  };

  const handleSectionPress = (section) => {
    navigation.navigate('SectionDetail', {
      section,
      selectedDate,
      isScheduling: !!selectedDate
    });
  };

  const handleProgramSelected = async () => {
    try {
      setLoading(true);
      await Promise.all(
        selectedSections.map(section =>
          scheduleSection(
            auth.currentUser.uid,
            section,
            selectedDate,
            'Unscheduled'
          )
        )
      );
      navigation.goBack();
    } catch (error) {
      console.error('Error scheduling sections:', error);
      Alert.alert('Error', 'Failed to schedule sections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSelect = (section) => {
    setSelectedSections(prev => {
      const exists = prev.find(s => s.id === section.id);
      if (exists) {
        return prev.filter(s => s.id !== section.id);
      }
      return [...prev, section];
    });
  };

  const handleCalendarPress = (section) => {
    navigation.navigate('SectionDetail', {
      section,
      isScheduling: true
    });
  };

  const showTimeOfDayPicker = () => {
    Alert.alert(
      'Select Time of Day',
      'When would you like to schedule this section?',
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

  const handleScheduleSection = async () => {
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
        
        await scheduleSection(
          userId,
          selectedSection,
          date,
          selectedTimeOfDay
        );
      }

      setShowCalendar(false);
      setSelectedDates({});
      setSelectedTimeOfDay(null);
      setSelectedSection(null);
      Alert.alert('Success', 'Section scheduled successfully');
      navigation.navigate('Programs', { screen: 'Sections' });
    } catch (error) {
      console.error('Error scheduling section:', error);
      Alert.alert('Error', 'Failed to schedule section');
    }
  };

  const handleDeleteSection = (section) => {
    Alert.alert(
      "Delete Section",
      "Are you sure you want to delete this section?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSection(section.id);
              loadSections(); // Reload the sections list
            } catch (error) {
              console.error('Error deleting section:', error);
              Alert.alert('Error', 'Failed to delete section. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderSection = (section) => {
    // Count activities by type
    const activityCounts = section.activities?.reduce((acc, activity) => {
      const type = activity.type || 'exercise';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return (
      <TouchableOpacity
        key={section.id}
        style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => isSelectionMode ? handleSectionSelect(section) : handleSectionPress(section)}
      >
        <View style={styles.sectionContent}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {section.title}
          </Text>
          {section.description && (
            <Text 
              style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
            >
              {section.description}
            </Text>
          )}
          <View style={styles.categoryInfo}>
            {activityCounts?.exercise > 0 && (
              <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
                {activityCounts.exercise} exercises
              </Text>
            )}
            {activityCounts?.habit > 0 && (
              <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
                {activityCounts.habit} habits/tasks
              </Text>
            )}
          </View>
        </View>
        {!isSelectionMode && (
          <View style={styles.sectionActions}>
            <TouchableOpacity 
              style={styles.calendarButton}
              onPress={() => handleCalendarPress(section)}
            >
              <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteSection(section)}
            >
              <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        )}
        {isSelectionMode && (
          <Ionicons 
            name={selectedSections.some(s => s.id === section.id) 
              ? "checkmark-circle" 
              : "ellipse-outline"
            } 
            size={24} 
            color={selectedSections.some(s => s.id === section.id)
              ? theme.colors.primary
              : theme.colors.textSecondary
            } 
            style={styles.selectionIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (section.description && section.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Add type filter UI
  const renderTypeFilters = () => (
    <View style={styles.typeFiltersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeFiltersContent}
      >
        <View style={styles.filterItem}>
          <TouchableOpacity
            style={[
              styles.typeFilterButton,
              selectedType === null && styles.typeFilterButtonSelected
            ]}
            onPress={() => setSelectedType(null)}
          >
            <Ionicons 
              name="apps-outline" 
              size={22} 
              color={selectedType === null ? '#fff' : '#666'} 
            />
          </TouchableOpacity>
          <Text style={[
            styles.typeFilterText,
            selectedType === null && styles.typeFilterTextSelected
          ]}>All</Text>
        </View>
        {SECTION_TYPES.map(type => (
          <View key={type.id} style={styles.filterItem}>
            <TouchableOpacity
              style={[
                styles.typeFilterButton,
                selectedType === type.id && styles.typeFilterButtonSelected
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Ionicons 
                name={type.icon} 
                size={22} 
                color={selectedType === type.id ? '#fff' : '#666'} 
              />
            </TouchableOpacity>
            <Text style={[
              styles.typeFilterText,
              selectedType === type.id && styles.typeFilterTextSelected
            ]}>
              {type.label}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
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
      <View style={styles.content}>
        {!isSelectionMode && renderTypeFilters()}
        
        {isSelectionMode && selectedSections.length > 0 && (
          <TouchableOpacity 
            style={[styles.programButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleProgramSelected}
          >
            <Text style={[styles.programButtonText, { color: theme.colors.white }]}>
              Program Selected ({selectedSections.length})
            </Text>
          </TouchableOpacity>
        )}

        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredSections.map(section => {
            // Calculate activity counts for this section
            const activityCounts = section.activities?.reduce((acc, activity) => {
              const type = activity.type || 'exercise';
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {}) || {};

            return (
              <TouchableOpacity
                key={section.id}
                style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => isSelectionMode ? handleSectionSelect(section) : handleSectionPress(section)}
              >
                <View style={styles.sectionContent}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    {section.title}
                  </Text>
                  {section.description && (
                    <Text 
                      style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {section.description}
                    </Text>
                  )}
                  <View style={styles.categoryInfo}>
                    {activityCounts?.exercise > 0 && (
                      <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
                        {activityCounts.exercise} exercises
                      </Text>
                    )}
                    {activityCounts?.habit > 0 && (
                      <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
                        {activityCounts.habit} habits/tasks
                      </Text>
                    )}
                  </View>
                </View>
                {!isSelectionMode && (
                  <View style={styles.sectionActions}>
                    <TouchableOpacity 
                      style={styles.calendarButton}
                      onPress={() => handleCalendarPress(section)}
                    >
                      <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteSection(section)}
                    >
                      <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
                {isSelectionMode && (
                  <Ionicons 
                    name={selectedSections.some(s => s.id === section.id) 
                      ? "checkmark-circle" 
                      : "ellipse-outline"
                    } 
                    size={24} 
                    color={selectedSections.some(s => s.id === section.id)
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                    } 
                    style={styles.selectionIcon}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {!isSelectionMode && (
          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleCreateSection}
          >
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        )}

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
                  onPress={handleScheduleSection}
                  disabled={Object.keys(selectedDates).length === 0}
                >
                  <Text style={[styles.modalButtonText, { color: theme.colors.white }]}>Schedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: Layout.spacing.medium,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.medium,
    backgroundColor: '#1C1C1E',
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
    marginBottom: 8,
    lineHeight: 20,
  },
  categoryInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCount: {
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
  },
  createButton: {
    position: 'absolute',
    bottom: Layout.spacing.medium,
    right: Layout.spacing.medium,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  programButton: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  programButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  selectionIcon: {
    marginLeft: Layout.spacing.medium,
  },
  modalContainer: {
    flex: 1,
    marginTop: 100,
    borderTopLeftRadius: Layout.borderRadius.large,
    borderTopRightRadius: Layout.borderRadius.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  closeButton: {
    padding: Layout.spacing.small,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
  },
  saveButton: {
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.medium,
  },
  saveButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  calendarButton: {
    padding: Layout.spacing.small,
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.small,
  },
  deleteButton: {
    padding: Layout.spacing.small,
  },
  typeFiltersContainer: {
    marginBottom: Layout.spacing.small,
  },
  typeFiltersContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.small,
    gap: Layout.spacing.medium,
  },
  typeFilterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
  },
  typeFilterButtonSelected: {
    backgroundColor: '#6B4EFF',
  },
  typeFilterText: {
    fontSize: 12,
    fontFamily: Typography.fonts.medium,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  typeFilterTextSelected: {
    color: '#fff',
  },
  filterItem: {
    alignItems: 'center',
    width: 60,
  },
  modalContent: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.small,
  },
  calendar: {
    marginBottom: Layout.spacing.medium,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.medium,
  },
  modalButton: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
}); 