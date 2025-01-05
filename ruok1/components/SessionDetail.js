import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useSelectedClient } from '../context/SelectedClientContext';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { scheduleSession } from '../firebase/scheduledSessions';
import { Calendar } from 'react-native-calendars';

const ACTIVITY_TYPES = [
  { id: 'exercises', label: 'Exercise', icon: 'barbell-outline' },
  { id: 'breathProtocols', label: 'Breath Protocol', icon: 'fitness-outline' },
  { id: 'breathingTests', label: 'Breathing Test', icon: 'pulse-outline' },
  { id: 'habitstasks', label: 'Habits & Tasks', icon: 'checkbox-outline' },
  { id: 'guidedSessions', label: 'Guided Session', icon: 'play-circle-outline' },
];

const SECTION_TYPES = [
  { id: 'standard', label: 'Standard', icon: 'barbell-outline' },
  { id: 'forTime', label: 'For Time', icon: 'timer-outline' },
  { id: 'amrap', label: 'AMRAP', icon: 'infinite-outline' },
  { id: 'chipper', label: 'Chipper', icon: 'list-outline' },
  { id: 'intervals', label: 'Intervals', icon: 'repeat-outline' }
];

export default function SessionDetail({ navigation, route }) {
  const theme = useTheme();
  const { selectedClient } = useSelectedClient();
  const { session, isScheduling = false } = route.params;
  const [activities, setActivities] = useState(session?.items || []);
  const [localState, setLocalState] = useState({
    title: session?.title || '',
    description: session?.description || '',
  });
  const [expandedCards, setExpandedCards] = useState({});
  const [menuOption, setMenuOption] = useState(null);
  const [menuActivityIndex, setMenuActivityIndex] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState(null);
  const [selectedDates, setSelectedDates] = useState({});

  useEffect(() => {
    navigation.setOptions({
      headerTitle: session?.title || 'New Session',
      headerRight: () => (
        <TouchableOpacity
          style={[styles.scheduleButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSchedulePress}
        >
          <Text style={[styles.scheduleButtonText, { color: theme.colors.white }]}>Schedule</Text>
        </TouchableOpacity>
      )
    });
  }, [navigation, session]);

  const handleCompleteSession = async (session) => {
    try {
      await updateScheduledSession(session.id, {
      metrics: {
          ...session.metrics,
          completed: true
        }
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error completing session:', error);
      Alert.alert('Error', 'Failed to complete session. Please try again.');
    }
  };

  const handleSchedulePress = () => {
    Alert.alert(
      'Select Time of Day',
      'When would you like to schedule this session?',
      [
        { text: 'Morning', onPress: () => handleTimeOfDaySelect('Morning') },
        { text: 'Afternoon', onPress: () => handleTimeOfDaySelect('Afternoon') },
        { text: 'Evening', onPress: () => handleTimeOfDaySelect('Evening') },
        { text: 'Anytime', onPress: () => handleTimeOfDaySelect('Anytime') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleUpdateSet = (activityIndex, setIndex, field, value) => {
    setActivities(current => {
      const updated = [...current];
      // Check if this is a nested activity by looking for a hyphen in the index
      if (typeof activityIndex === 'string' && activityIndex.includes('-')) {
        const [sectionIndex, exerciseIndex] = activityIndex.split('-').map(Number);
        if (!updated[sectionIndex].activities[exerciseIndex].metrics) {
          updated[sectionIndex].activities[exerciseIndex].metrics = {
            sets: [{
              reps: '',
              weight: '',
              rest: '00:00'
            }],
            eachSide: false,
            notes: ''
          };
        }
        updated[sectionIndex].activities[exerciseIndex].metrics.sets[setIndex] = {
          ...updated[sectionIndex].activities[exerciseIndex].metrics.sets[setIndex],
          [field]: value
        };
      } else {
        // Handle non-nested activity
        if (!updated[activityIndex].metrics) {
          updated[activityIndex].metrics = {
            sets: [{
              reps: '',
              weight: '',
              rest: '00:00'
            }],
            eachSide: false,
            notes: ''
          };
        }
        updated[activityIndex].metrics.sets[setIndex] = {
          ...updated[activityIndex].metrics.sets[setIndex],
          [field]: value
        };
      }
      return updated;
    });
  };

  const handleAddSet = (activityIndex) => {
    setActivities(current => {
      const updated = [...current];
      // Check if this is a nested activity
      if (typeof activityIndex === 'string' && activityIndex.includes('-')) {
        const [sectionIndex, exerciseIndex] = activityIndex.split('-').map(Number);
        if (!updated[sectionIndex].activities[exerciseIndex].metrics) {
          updated[sectionIndex].activities[exerciseIndex].metrics = {
            sets: [],
            eachSide: false,
            notes: ''
          };
        }
        updated[sectionIndex].activities[exerciseIndex].metrics.sets.push({
          reps: '',
          weight: '',
          rest: '00:00'
        });
      } else {
        // Handle non-nested activity
        if (!updated[activityIndex].metrics) {
          updated[activityIndex].metrics = {
            sets: [],
            eachSide: false,
            notes: ''
          };
        }
        updated[activityIndex].metrics.sets.push({
          reps: '',
          weight: '',
          rest: '00:00'
        });
      }
      return updated;
    });
  };

  const handleToggleEachSide = (activityIndex) => {
    setActivities(current => {
      const updated = [...current];
      // Check if this is a nested activity
      if (typeof activityIndex === 'string' && activityIndex.includes('-')) {
        const [sectionIndex, exerciseIndex] = activityIndex.split('-').map(Number);
        if (!updated[sectionIndex].activities[exerciseIndex].metrics) {
          updated[sectionIndex].activities[exerciseIndex].metrics = {
            sets: [{
              reps: '',
              weight: '',
              rest: '00:00'
            }],
            eachSide: false,
            notes: ''
          };
        }
        updated[sectionIndex].activities[exerciseIndex].metrics.eachSide = 
          !updated[sectionIndex].activities[exerciseIndex].metrics.eachSide;
      } else {
        // Handle non-nested activity
        if (!updated[activityIndex].metrics) {
          updated[activityIndex].metrics = {
            sets: [{
              reps: '',
              weight: '',
              rest: '00:00'
            }],
            eachSide: false,
            notes: ''
          };
        }
        updated[activityIndex].metrics.eachSide = !updated[activityIndex].metrics.eachSide;
      }
      return updated;
    });
  };

  const toggleCardExpansion = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleMoveActivity = (index, direction) => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === activities.length - 1)) {
      return;
    }

    setActivities(current => {
      const updated = [...current];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      if (!localState.title.trim()) {
        Alert.alert('Error', 'Please enter a title for the session');
        return;
      }

      const sessionData = {
        title: localState.title,
        description: localState.description,
        items: activities.map(item => {
          if (item.type === 'section' || SECTION_TYPES.some(t => t.id === item.type)) {
            // Handle sections
            return {
              id: item.id,
              title: item.title,
              type: item.type,
              description: item.description || '',
              settings: item.settings || {},
              activities: Array.isArray(item.activities) ? item.activities.map(exercise => ({
                id: exercise.id,
                title: exercise.title,
                type: exercise.type || 'exercise',
                description: exercise.description || '',
                metrics: {
                  sets: exercise.metrics.sets.map(set => ({
                    reps: set.reps || '',
                    weight: set.weight || '',
                    rest: set.rest || '00:00'
                  })),
                  eachSide: exercise.metrics.eachSide || false,
                  notes: exercise.metrics.notes || ''
                }
              })) : []
            };
          } else {
            // Handle regular activities
            return {
              id: item.id,
              title: item.title,
              type: item.type,
              description: item.description || '',
              metrics: {
                sets: item.metrics.sets.map(set => ({
                  reps: set.reps || '',
                  weight: set.weight || '',
                  rest: set.rest || '00:00'
                })),
                eachSide: item.metrics.eachSide || false,
                notes: item.metrics.notes || ''
              }
            };
          }
        }),
        userId: auth.currentUser.uid,
        updatedAt: serverTimestamp()
      };

      if (session.id) {
        await updateDoc(doc(db, 'sessions', session.id), sessionData);
      } else {
        sessionData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'sessions'), sessionData);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save session. Please try again.');
    }
  };

  const handleRemoveActivity = (index) => {
    setActivities(current => current.filter((_, i) => i !== index));
    setMenuOption(null);
    setMenuActivityIndex(null);
  };

  const getMetricsPreview = (activity) => {
    if (!activity.metrics?.sets?.length) return [];

    const preview = [];
    const firstSet = activity.metrics.sets[0];
    
    if (firstSet.weight) preview.push(`${firstSet.weight} lb`);
    if (firstSet.reps) preview.push(`${firstSet.reps} reps`);
    if (activity.metrics.sets.length > 1) {
      preview.push(`${activity.metrics.sets.length} sets`);
    }
    if (activity.metrics.eachSide) preview.push('Each side');
    
    return preview;
  };

  const renderMetrics = (activity, activityIndex) => {
    if (!activity.metrics?.sets) return null;

    return (
      <>
        {activity.metrics.sets.map((set, setIndex) => (
          <View 
            key={`${activityIndex}-set-${setIndex}`} 
            style={styles.metricsRow}
          >
            <View style={styles.metricColumn}>
              <Text style={styles.metricLabel}>SET</Text>
              <Text style={styles.metricValue}>{setIndex + 1}</Text>
            </View>
            <View style={styles.metricColumn}>
              <Text style={styles.metricLabel}>LB</Text>
              <TextInput
                style={styles.metricInput}
                value={set.weight}
                onChangeText={(value) => handleUpdateSet(activityIndex, setIndex, 'weight', value)}
                keyboardType="numeric"
                placeholder="-"
                placeholderTextColor="#666"
              />
            </View>
            <View style={styles.metricColumn}>
              <Text style={styles.metricLabel}>REPS</Text>
              <TextInput
                style={styles.metricInput}
                value={set.reps}
                onChangeText={(value) => handleUpdateSet(activityIndex, setIndex, 'reps', value)}
                keyboardType="numeric"
                placeholder="-"
                placeholderTextColor="#666"
              />
            </View>
            <View style={styles.metricColumn}>
              <Text style={styles.metricLabel}>REST</Text>
              <TextInput
                style={styles.metricInput}
                value={set.rest}
                onChangeText={(value) => handleUpdateSet(activityIndex, setIndex, 'rest', value)}
                placeholder="00:00"
                placeholderTextColor="#666"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity 
          style={styles.addSetButton}
          onPress={() => handleAddSet(activityIndex)}
        >
          <Ionicons name="add" size={20} color="#6B4EFF" />
          <Text style={styles.addSetText}>Add Set</Text>
        </TouchableOpacity>

        <View style={styles.eachSideRow}>
          <TouchableOpacity 
            style={[
              styles.checkbox,
              activity.metrics.eachSide && { backgroundColor: '#6B4EFF', borderColor: '#6B4EFF' }
            ]}
            onPress={() => handleToggleEachSide(activityIndex)}
          >
            {activity.metrics.eachSide && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </TouchableOpacity>
          <Text style={styles.eachSideText}>Each side</Text>
        </View>

        <TextInput
          style={styles.notesInput}
          placeholder="Add note..."
          placeholderTextColor="#666"
          value={activity.metrics.notes}
          onChangeText={(value) => {
            const updated = [...activities];
            updated[activityIndex].metrics.notes = value;
            setActivities(updated);
          }}
        />
      </>
    );
  };

  const renderSectionSettings = (activity) => {
    if (!activity.settings) return null;

    switch(activity.type) {
      case 'amrap':
        return (
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsLabel}>Time Cap</Text>
            <TextInput
              style={styles.settingsInput}
              value={activity.settings.timeLimit?.toString()}
              onChangeText={(value) => {
                const updated = [...activities];
                const index = activities.findIndex(a => a.id === activity.id);
                if (index !== -1) {
                  updated[index].settings = {
                    ...updated[index].settings,
                    timeLimit: value
                  };
                  setActivities(updated);
                }
              }}
              keyboardType="numeric"
              placeholder="Time in minutes"
              placeholderTextColor="#666"
            />
          </View>
        );
      case 'forTime':
        return (
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsLabel}>Rounds</Text>
            <TextInput
              style={styles.settingsInput}
              value={activity.settings.rounds?.toString()}
              onChangeText={(value) => {
                const updated = [...activities];
                const index = activities.findIndex(a => a.id === activity.id);
                if (index !== -1) {
                  updated[index].settings = {
                    ...updated[index].settings,
                    rounds: value
                  };
                  setActivities(updated);
                }
              }}
              keyboardType="numeric"
              placeholder="Number of rounds"
              placeholderTextColor="#666"
            />
          </View>
        );
      default:
        return null;
    }
  };

  const renderActivity = (activity, activityIndex, isNested = false) => {
    const isExpanded = expandedCards[activityIndex];
    const isSection = activity.type === 'section' || SECTION_TYPES.some(t => t.id === activity.type);

    // Ensure metrics object exists with default values
    if (!activity.metrics) {
      activity.metrics = {
        sets: [{
          reps: '',
          weight: '',
          rest: '00:00'
        }],
        eachSide: false,
        notes: ''
      };
    }

    return (
      <View 
        key={activityIndex}
        style={[
          styles.activityCard, 
          { 
            backgroundColor: theme.colors.surface,
            marginBottom: Layout.spacing.medium,
          },
          isNested && styles.nestedActivity
        ]}
      >
        <View style={styles.activityHeader}>
          <View style={styles.activityIcon}>
            <Ionicons 
              name={
                isSection 
                  ? SECTION_TYPES.find(t => t.id === activity.type)?.icon || 'layers-outline'
                  : ACTIVITY_TYPES.find(t => t.id === activity.type)?.icon || 'fitness'
              } 
              size={24} 
              color={theme.colors.primary} 
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.activityTitle}>
              {activity.title || activity.name}
            </Text>
          </View>
          {!isNested && (
            <View style={styles.activityControls}>
              <TouchableOpacity 
                style={[styles.moveButton, activityIndex === 0 && styles.moveButtonDisabled]}
                onPress={() => handleMoveActivity(activityIndex, 'up')}
                disabled={activityIndex === 0}
              >
                <Ionicons 
                  name="chevron-up" 
                  size={20} 
                  color={activityIndex === 0 ? "#444" : "#666"} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.moveButton, activityIndex === activities.length - 1 && styles.moveButtonDisabled]}
                onPress={() => handleMoveActivity(activityIndex, 'down')}
                disabled={activityIndex === activities.length - 1}
              >
                <Ionicons 
                  name="chevron-down" 
                  size={20} 
                  color={activityIndex === activities.length - 1 ? "#444" : "#666"} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuButton}
                onPress={() => {
                  setMenuActivityIndex(activityIndex);
                  setMenuOption('menu');
                }}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!isExpanded ? (
          <View style={styles.metricsPreview}>
            {getMetricsPreview(activity).map((preview, index, array) => (
              <React.Fragment key={index}>
                <Text style={styles.metricsPreviewText}>
                  {preview}
                </Text>
                {index < array.length - 1 && (
                  <View style={styles.metricsPreviewDot} />
                )}
              </React.Fragment>
            ))}
          </View>
        ) : (
          <>
            {activity.metrics?.sets?.map((set, setIndex) => (
              <View 
                key={`${activityIndex}-set-${setIndex}`} 
                style={styles.metricsRow}
              >
                <View style={styles.metricColumn}>
                  <Text style={styles.metricLabel}>SET</Text>
                  <Text style={styles.metricValue}>{setIndex + 1}</Text>
                </View>
                <View style={styles.metricColumn}>
                  <Text style={styles.metricLabel}>LB</Text>
                  <TextInput
                    style={styles.metricInput}
                    value={set.weight}
                    onChangeText={(value) => handleUpdateSet(activityIndex, setIndex, 'weight', value)}
                    keyboardType="numeric"
                    placeholder="-"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={styles.metricColumn}>
                  <Text style={styles.metricLabel}>REPS</Text>
                  <TextInput
                    style={styles.metricInput}
                    value={set.reps}
                    onChangeText={(value) => handleUpdateSet(activityIndex, setIndex, 'reps', value)}
                    keyboardType="numeric"
                    placeholder="-"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={styles.metricColumn}>
                  <Text style={styles.metricLabel}>REST</Text>
                  <TextInput
                    style={styles.metricInput}
                    value={set.rest}
                    onChangeText={(value) => handleUpdateSet(activityIndex, setIndex, 'rest', value)}
                    placeholder="00:00"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity 
              style={styles.addSetButton}
              onPress={() => handleAddSet(activityIndex)}
            >
              <Ionicons name="add" size={20} color="#6B4EFF" />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>

            <View style={styles.eachSideRow}>
              <TouchableOpacity 
                style={[
                  styles.checkbox,
                  activity.metrics?.eachSide && { backgroundColor: '#6B4EFF', borderColor: '#6B4EFF' }
                ]}
                onPress={() => handleToggleEachSide(activityIndex)}
              >
                {activity.metrics?.eachSide && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </TouchableOpacity>
              <Text style={styles.eachSideText}>Each side</Text>
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Add note..."
              placeholderTextColor="#666"
              value={activity.metrics?.notes || ''}
              onChangeText={(value) => {
                const updated = [...activities];
                if (!updated[activityIndex].metrics) {
                  updated[activityIndex].metrics = {
                    sets: [{
                      reps: '',
                      weight: '',
                      rest: '00:00'
                    }],
                    eachSide: false,
                    notes: ''
                  };
                }
                updated[activityIndex].metrics.notes = value;
                setActivities(updated);
              }}
            />
          </>
        )}

        <TouchableOpacity 
          style={[
            styles.expandButton,
            isExpanded ? styles.expandButtonExpanded : styles.expandButtonCollapsed
          ]}
          onPress={() => toggleCardExpansion(activityIndex)}
        >
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666"
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderSection = (section, sectionIndex) => {
    const isExpanded = expandedCards[sectionIndex];
    
    return (
              <View 
        key={sectionIndex}
        style={[
          styles.sectionCard, 
          { backgroundColor: theme.colors.surface }
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons 
              name={SECTION_TYPES.find(t => t.id === section.type)?.icon || 'layers-outline'} 
              size={24} 
              color={theme.colors.primary}
                />
              </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.type && (
              <Text style={styles.sectionType}>
                {SECTION_TYPES.find(t => t.id === section.type)?.label || 'Section'}
              </Text>
            )}
          </View>
          <View style={styles.sectionControls}>
              <TouchableOpacity
              style={[styles.moveButton, sectionIndex === 0 && styles.moveButtonDisabled]}
              onPress={() => handleMoveActivity(sectionIndex, 'up')}
              disabled={sectionIndex === 0}
            >
              <Ionicons 
                name="chevron-up" 
                size={20} 
                color={sectionIndex === 0 ? "#444" : "#666"} 
              />
              </TouchableOpacity>
                <TouchableOpacity
              style={[styles.moveButton, sectionIndex === activities.length - 1 && styles.moveButtonDisabled]}
              onPress={() => handleMoveActivity(sectionIndex, 'down')}
              disabled={sectionIndex === activities.length - 1}
            >
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color={sectionIndex === activities.length - 1 ? "#444" : "#666"} 
              />
                </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => {
                setMenuActivityIndex(sectionIndex);
                setMenuOption('menu');
              }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#666" />
            </TouchableOpacity>
            </View>
          </View>

        {renderSectionSettings(section)}

            <TouchableOpacity 
          style={[
            styles.expandButton,
            isExpanded ? styles.expandButtonExpanded : styles.expandButtonCollapsed
          ]}
          onPress={() => toggleCardExpansion(sectionIndex)}
        >
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666"
          />
            </TouchableOpacity>

        {isExpanded && section.activities && (
          <View style={styles.sectionExercises}>
            {section.activities.map((exercise, exerciseIndex) => (
              <View 
                key={exerciseIndex}
                style={styles.exerciseCard}
              >
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseIcon}>
                    <Ionicons 
                      name="barbell-outline"
                      size={20} 
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                </View>
                {renderMetrics(exercise, `${sectionIndex}-${exerciseIndex}`)}
              </View>
            ))}
          </View>
        )}
      </View>
    );
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

  const handleTimeOfDaySelect = (timeOfDay) => {
    setSelectedTimeOfDay(timeOfDay);
    setShowCalendar(true);
  };

  const handleSchedule = async () => {
    try {
      if (!localState.title.trim()) {
        Alert.alert('Error', 'Please enter a title for the session');
        return;
      }

      const dateString = Object.keys(selectedDates)[0];
      if (!dateString) {
        Alert.alert('Error', 'Please select a date');
        return;
      }

      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date();
      date.setFullYear(year);
      date.setMonth(month - 1);
      date.setDate(day);
      date.setHours(12, 0, 0, 0);

      const sessionData = {
        title: localState.title,
        description: localState.description,
        items: activities.map(item => {
          if (item.type === 'section' || SECTION_TYPES.some(t => t.id === item.type)) {
            // Handle sections
            return {
              id: item.id || Math.random().toString(),
              title: item.title,
              type: item.type,
              description: item.description || '',
              settings: item.settings || {},
              activities: Array.isArray(item.activities) ? item.activities.map(exercise => ({
                id: exercise.id || Math.random().toString(),
                title: exercise.title,
                type: exercise.type || 'exercise',
                description: exercise.description || '',
                metrics: {
                  sets: (exercise.metrics?.sets || []).map(set => ({
                    reps: set.reps || '',
                    weight: set.weight || '',
                    rest: set.rest || '00:00'
                  })),
                  eachSide: exercise.metrics?.eachSide || false,
                  notes: exercise.metrics?.notes || ''
                }
              })) : []
            };
          } else {
            // Handle regular activities
            return {
              id: item.id || Math.random().toString(),
              title: item.title,
              type: item.type,
              description: item.description || '',
              metrics: {
                sets: (item.metrics?.sets || []).map(set => ({
                  reps: set.reps || '',
                  weight: set.weight || '',
                  rest: set.rest || '00:00'
                })),
                eachSide: item.metrics?.eachSide || false,
                notes: item.metrics?.notes || ''
              }
            };
          }
        })
      };

      const userId = selectedClient?.id || auth.currentUser.uid;

      await scheduleSession(
        userId,
        sessionData,
        date,
        selectedTimeOfDay
      );

      navigation.goBack();
    } catch (error) {
      console.error('Error scheduling session:', error);
      Alert.alert('Error', 'Failed to schedule session. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {localState.id ? 'Edit Session' : 'New Session'}
        </Text>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={isScheduling ? () => {
            Alert.alert(
              'Select Time of Day',
              'When would you like to schedule this session?',
              [
                { text: 'Morning', onPress: () => handleTimeOfDaySelect('Morning') },
                { text: 'Afternoon', onPress: () => handleTimeOfDaySelect('Afternoon') },
                { text: 'Evening', onPress: () => handleTimeOfDaySelect('Evening') },
                { text: 'Anytime', onPress: () => handleTimeOfDaySelect('Anytime') },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          } : handleSave}
        >
          <Text style={[styles.saveButtonText, { color: theme.colors.white }]}>
            {isScheduling ? 'Schedule' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.sectionInfoContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="Session Title"
            placeholderTextColor="#666"
            value={localState.title}
            maxLength={100}
            onChangeText={(value) => setLocalState(prev => ({ ...prev, title: value }))}
          />

          <TextInput
            style={styles.descriptionInput}
            placeholder="Description (optional)"
            placeholderTextColor="#666"
            value={localState.description}
            onChangeText={(value) => setLocalState(prev => ({ ...prev, description: value }))}
            multiline
          />
        </View>

        {activities.map((item, index) => {
          if (item.type === 'section' || SECTION_TYPES.some(t => t.id === item.type)) {
            return renderSection(item, index);
          } else {
            return renderActivity(item, index);
          }
        })}
      </ScrollView>

        <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('ActivitySelector', { 
          type: 'session',
          multiSelect: true,
          onSelect: (selectedItems) => {
            setActivities(current => [
              ...current,
              ...selectedItems.map(item => ({
                ...item,
                id: Math.random().toString(),
                metrics: {
                  sets: [{
                    reps: '',
                    weight: '',
                    rest: '00:00'
                  }],
                  eachSide: false,
                  notes: ''
                }
              }))
            ]);
          }
        })}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={menuOption === 'menu'}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuOption(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuOption(null)}
        >
          <View style={styles.menuModal}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleRemoveActivity(menuActivityIndex)}
            >
              <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
              <Text style={[styles.menuItemText, { color: theme.colors.error }]}>Remove Activity</Text>
        </TouchableOpacity>
      </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="slide"
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Select Date
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
                onPress={handleSchedule}
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
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.medium,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    marginTop: 40,
  },
  backButton: {
    padding: Layout.spacing.small,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    textAlign: 'center',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.medium,
  },
  activityCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.medium,
    marginBottom: Layout.spacing.medium,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: Layout.spacing.medium,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 18,
    fontFamily: Typography.fonts.medium,
    flex: 1,
    color: '#fff',
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
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: Typography.fonts.medium,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: Typography.fonts.medium,
    color: '#fff',
  },
  metricInput: {
    fontSize: 20,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
    width: 60,
    padding: 0,
    color: '#fff',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.small,
  },
  addSetText: {
    color: '#4CAF50',
    fontSize: 16,
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
  },
  eachSideText: {
    fontSize: 16,
    color: '#666',
  },
  notesInput: {
    fontSize: 16,
    color: '#fff',
    padding: Layout.spacing.small,
    height: 40,
    backgroundColor: '#2C2C2E',
    borderRadius: Layout.borderRadius.medium,
    marginTop: Layout.spacing.small,
  },
  sectionInfoContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.medium,
    marginBottom: Layout.spacing.medium,
  },
  titleInput: {
    fontSize: 24,
    fontFamily: Typography.fonts.semibold,
    color: '#fff',
    marginBottom: Layout.spacing.small,
  },
  descriptionInput: {
    fontSize: 16,
    fontFamily: Typography.fonts.regular,
    color: '#fff',
    minHeight: 60,
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
  activityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moveButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  moveButtonDisabled: {
    opacity: 0.3,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.small,
  },
  expandButton: {
    position: 'absolute',
    right: Layout.spacing.small,
    padding: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButtonCollapsed: {
    bottom: Layout.spacing.medium,
  },
  expandButtonExpanded: {
    bottom: Layout.spacing.small,
  },
  metricsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: Layout.spacing.small,
    marginBottom: Layout.spacing.small,
    paddingRight: Layout.spacing.medium,
  },
  metricsPreviewText: {
    color: '#666',
    fontSize: 14,
    fontFamily: Typography.fonts.medium,
  },
  metricsPreviewDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#666',
    marginHorizontal: Layout.spacing.small,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuModal: {
    backgroundColor: '#1C1C1E',
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.medium,
    width: '80%',
    maxWidth: 300,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
    marginLeft: Layout.spacing.medium,
  },
  menuButton: {
    padding: Layout.spacing.small,
  },
  fab: {
    position: 'absolute',
    right: Layout.spacing.large,
    bottom: Layout.spacing.large,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  nestedActivity: {
    marginLeft: Layout.spacing.large,
    marginRight: 0,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
  },
  nestedActivitiesContainer: {
    marginTop: Layout.spacing.medium,
  },
  settingsContainer: {
    marginBottom: Layout.spacing.medium,
    padding: Layout.spacing.medium,
    backgroundColor: '#2C2C2E',
    borderRadius: Layout.borderRadius.medium,
  },
  settingsLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: Layout.spacing.small,
    fontFamily: Typography.fonts.medium,
  },
  settingsInput: {
    fontSize: 16,
    color: '#fff',
    padding: Layout.spacing.small,
    backgroundColor: '#1C1C1E',
    borderRadius: Layout.borderRadius.small,
  },
  sectionCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.medium,
    marginBottom: Layout.spacing.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: Layout.spacing.medium,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Typography.fonts.semibold,
    color: '#fff',
  },
  sectionType: {
    fontSize: 14,
    fontFamily: Typography.fonts.medium,
    color: '#666',
    marginTop: 4,
  },
  sectionControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionExercises: {
    marginTop: Layout.spacing.medium,
    paddingLeft: Layout.spacing.large,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.medium,
    marginBottom: Layout.spacing.medium,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: Layout.spacing.medium,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseTitle: {
    fontSize: 16,
    fontFamily: Typography.fonts.medium,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.medium,
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