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
import { createSection, updateSection, getSections, scheduleSection, deleteSection } from '../firebase/sections';
import { auth } from '../config/firebase';
import { Calendar } from 'react-native-calendars';

export default function Sections({ navigation, route, searchQuery = '' }) {
  const theme = useTheme();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSections, setSelectedSections] = useState([]);
  const isSelectionMode = route.params?.selectedDate != null;
  const { selectedDate } = route.params || {};
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState(null);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const sectionsData = await getSections(auth.currentUser.uid);
      setSections(sectionsData);
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = () => {
    navigation.navigate('ActivitySelector', {
      onNext: (selectedActivities) => {
        navigation.navigate('SectionDetail', {
          selectedActivities
        });
      }
    });
  };

  const handleSectionPress = (section) => {
    navigation.navigate('SectionDetail', {
      section,
      selectedDate
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
      const userId = auth.currentUser.uid;
      
      // Schedule the section for each selected date
      const dates = Object.keys(selectedDates);
      for (const dateString of dates) {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date();
        date.setFullYear(year);
        date.setMonth(month - 1);
        date.setDate(day);
        date.setHours(12, 0, 0, 0);

        // Ensure all required fields are present
        const sectionToSchedule = {
          ...selectedSection,
          assignedBy: auth.currentUser.uid,
          createdBy: auth.currentUser.uid,
          activities: selectedSection.activities.map(group => ({
            ...group,
            items: group.items.map(item => ({
              ...item,
              metrics: {
                ...(item.metrics || {}),  // Preserve all existing metrics
                sets: item.metrics?.sets || [{
                  reps: '',
                  weight: '',
                  rest: '00:00'
                }],
                eachSide: item.metrics?.eachSide || false,
                notes: item.metrics?.notes || '',
                timeOfDay: selectedTimeOfDay
              },
              supersetIndex: item.supersetIndex,
              supersetWith: item.supersetWith
            }))
          }))
        };

        await scheduleSection(
          userId, 
          sectionToSchedule,
          date,
          selectedTimeOfDay
        );
      }

      Alert.alert('Success', 'Section scheduled successfully');
      setShowCalendar(false);
      setSelectedTimeOfDay(null);
      setSelectedDates({});
      setSelectedSection(null);
    } catch (error) {
      console.error('Error scheduling section:', error);
      Alert.alert('Error', 'Failed to schedule section. Please try again.');
    }
  };

  const handleTimeSelection = (section, timeOfDay) => {
    setSelectedTimeOfDay(timeOfDay);
    setSelectedSection(section);
    
    // Clean up section data to ensure it's serializable
    const cleanSection = {
      ...section,
      activities: section.activities.map(group => ({
        ...group,
        items: group.items.map(item => {
          // Create a clean copy of the item without any Firestore references
          const cleanItem = {
            id: item.id,
            title: item.title,
            type: item.type || 'exercise',
            description: item.description || '',
            exerciseId: item.exerciseId,
            supersetIndex: item.supersetIndex,
            supersetWith: item.supersetWith,
            metrics: {
              ...(item.metrics || {}),
              sets: item.metrics?.sets || [{
                reps: '',
                weight: '',
                rest: '00:00'
              }],
              eachSide: item.metrics?.eachSide || false,
              notes: item.metrics?.notes || '',
              timeOfDay: timeOfDay
            }
          };

          // Only include equipment if it's a simple object (no Firestore refs)
          if (item.equipment && typeof item.equipment === 'object') {
            cleanItem.equipment = Object.keys(item.equipment).reduce((acc, key) => {
              const equip = item.equipment[key];
              if (typeof equip === 'object' && !equip.ref) {
                acc[key] = equip;
              }
              return acc;
            }, {});
          }

          return cleanItem;
        })
      }))
    };

    // Navigate to SectionDetail with clean data
    navigation.navigate('SectionDetail', {
      section: cleanSection,
      isScheduling: true,
      timeOfDay: timeOfDay,
      onComplete: (updatedActivities) => {
        // Update the selectedSection with the edited metrics
        setSelectedSection(current => ({
          ...current,
          activities: current.activities.map(group => ({
            ...group,
            items: group.items.map(item => {
              // Find the matching updated activity
              const updatedActivity = updatedActivities.find(a => a.id === item.id);
              if (updatedActivity) {
                return {
                  ...item,
                  metrics: updatedActivity.metrics,
                  supersetIndex: updatedActivity.supersetIndex,
                  supersetWith: updatedActivity.supersetWith
                };
              }
              return item;
            })
          }))
        }));
        setShowCalendar(true);
      }
    });
  };

  const handleCalendarPress = (section) => {
    Alert.alert(
      "Select Time of Day",
      "When would you like to schedule this section?",
      [
        {
          text: "Morning",
          onPress: () => handleTimeSelection(section, 'morning')
        },
        {
          text: "Afternoon",
          onPress: () => handleTimeSelection(section, 'afternoon')
        },
        {
          text: "Evening",
          onPress: () => handleTimeSelection(section, 'evening')
        },
        {
          text: "Anytime",
          onPress: () => handleTimeSelection(section, 'anytime')
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
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
          {filteredSections.map(section => renderSection(section))}
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
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => {
                  setShowCalendar(false);
                  setSelectedDates({});
                  setSelectedSection(null);
                  setSelectedTimeOfDay(null);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Schedule Section
              </Text>
              <TouchableOpacity 
                onPress={handleScheduleSection}
                style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
                disabled={Object.keys(selectedDates).length === 0}
              >
                <Text style={[styles.saveButtonText, { color: theme.colors.white }]}>
                  Schedule
                </Text>
              </TouchableOpacity>
            </View>

            <Calendar
              onDayPress={handleDayPress}
              markedDates={selectedDates}
              theme={{
                backgroundColor: theme.colors.background,
                calendarBackground: theme.colors.background,
                textSectionTitleColor: theme.colors.text,
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.white,
                todayTextColor: theme.colors.primary,
                dayTextColor: theme.colors.text,
                textDisabledColor: theme.colors.textSecondary,
                monthTextColor: theme.colors.text,
                arrowColor: theme.colors.primary,
              }}
            />
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
}); 