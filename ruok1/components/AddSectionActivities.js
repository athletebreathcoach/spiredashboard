import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

export default function AddSectionActivities({ navigation, route }) {
  const theme = useTheme();
  const { sectionData } = route.params;
  
  console.log('Initial sectionData:', sectionData);
  
  // Ensure activities is always an array with valid structure
  const initialActivities = sectionData.activities.map(activity => ({
    type: activity.type,
    items: activity.items || []
  }));
  
  console.log('Structured initialActivities:', initialActivities);
  
  const [activities, setActivities] = useState(initialActivities);

  const handleAddActivity = (activityType) => {
    let screenName;
    switch (activityType) {
      case 'habitstasks':
        screenName = 'HabitsTasks';
        break;
      case 'guidedSessions':
        screenName = 'GuidedSessions';
        break;
      case 'exercises':
        screenName = 'Exercises';
        break;
      case 'breathProtocols':
        screenName = 'BreathProtocols';
        break;
      case 'breathingTests':
        screenName = 'BreathingTests';
        break;
      default:
        screenName = activityType;
    }

    navigation.navigate(screenName, {
      mode: 'selection',
      onSelect: (activity) => {
        console.log('Raw activity selected:', activity);
        
        // Clean the activity data to ensure it's serializable
        const cleanActivity = {
          id: activity.id || Date.now().toString(),
          title: activity.title || '',
          description: activity.description || '',
          type: activityType,
          // Only include serializable fields
          primaryMuscleGroup: activity.primaryMuscleGroup ? {
            id: activity.primaryMuscleGroup.id,
            name: activity.primaryMuscleGroup.name
          } : null,
          secondaryMuscleGroups: activity.secondaryMuscleGroups ? 
            activity.secondaryMuscleGroups.map(mg => ({
              id: mg.id,
              name: mg.name
            })) : [],
          imageUrl: activity.imageUrl || '',
          metrics: activity.metrics || {},
        };

        console.log('Cleaned activity:', cleanActivity);

        setActivities(current => 
          current.map(a => {
            if (a.type === activityType) {
              return {
                ...a,
                items: [...(a.items || []), cleanActivity]
              };
            }
            return a;
          })
        );
        navigation.goBack();
      }
    });
  };

  const handleRemoveActivity = (activityType, itemId) => {
    setActivities(current =>
      current.map(a => {
        if (a.type === activityType) {
          return {
            ...a,
            items: (a.items || []).filter(item => item.id !== itemId)
          };
        }
        return a;
      })
    );
  };

  const handleSave = async () => {
    try {
      console.log('Starting save operation...');
      console.log('Initial activities:', activities);
      
      const sectionsRef = collection(db, 'sections');
      
      const validActivities = activities
        .map(activityGroup => ({
          type: activityGroup.type,
          items: (activityGroup.items || [])
            .filter(item => item && item.id && item.title)
            .map(item => ({
              id: item.id,
              title: item.title || '',
              type: activityGroup.type,
              description: item.description || '',
              metrics: item.metrics || {},
              data: item.data || {}
            }))
        }))
        .filter(group => group.items && group.items.length > 0);

      console.log('Processed validActivities:', validActivities);

      const sectionDoc = {
        userId: auth.currentUser.uid,
        title: sectionData.title || '',
        description: sectionData.description || '',
        activities: validActivities,
        createdBy: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      };

      console.log('Final sectionDoc to save:', JSON.stringify(sectionDoc, null, 2));
      
      // Verify auth.currentUser exists
      if (!auth.currentUser) {
        console.error('No authenticated user found');
        throw new Error('User not authenticated');
      }

      console.log('Current user ID:', auth.currentUser.uid);
      
      const docRef = await addDoc(sectionsRef, sectionDoc);
      console.log('Successfully saved section with ID:', docRef.id);
      
      navigation.navigate('Programs', { screen: 'Sections' });
    } catch (error) {
      console.error('Detailed error in handleSave:', error);
      Alert.alert('Error', 'Failed to create section. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { 
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.background 
      }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          Add Activities
        </Text>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.colors.primary + '20' }]}
          onPress={handleSave}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.saveButtonText, { color: theme.colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activities.map((activityGroup) => (
          <View key={activityGroup.type} style={styles.activityGroup}>
            <View style={styles.activityGroupHeader}>
              <View style={styles.activityGroupTitleContainer}>
                <Ionicons 
                  name={getActivityIcon(activityGroup.type)} 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <Text style={[styles.activityGroupTitle, { color: theme.colors.text }]}>
                  {getActivityLabel(activityGroup.type)}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.colors.primary + '20' }]}
                onPress={() => handleAddActivity(activityGroup.type)}
              >
                <Ionicons name="add" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {(activityGroup.items || []).map((item) => (
              <View 
                key={item.id} 
                style={[styles.activityItem, { backgroundColor: theme.colors.surface }]}
              >
                <View style={styles.activityItemContent}>
                  <Text style={[styles.activityItemTitle, { color: theme.colors.text }]}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text style={[styles.activityItemDescription, { color: theme.colors.textSecondary }]}>
                      {item.description}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveActivity(activityGroup.type, item.id)}
                >
                  <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            {(!activityGroup.items || activityGroup.items.length === 0) && (
              <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                  No activities added yet
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const getActivityIcon = (type) => {
  switch (type) {
    case 'breathingTests': return 'fitness-outline';
    case 'exercises': return 'barbell-outline';
    case 'breathProtocols': return 'pulse-outline';
    case 'habitstasks': return 'checkbox-outline';
    case 'guidedSessions': return 'play-circle-outline';
    default: return 'add-circle-outline';
  }
};

const getActivityLabel = (type) => {
  switch (type) {
    case 'habitstasks':
      return 'Habits & Tasks';
    case 'guidedSessions':
      return 'Guided Sessions';
    case 'exercises':
      return 'Exercises';
    case 'breathProtocols':
      return 'Breath Protocols';
    case 'breathingTests':
      return 'Breathing Tests';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.medium,
    height: 60,
    borderBottomWidth: 1,
    marginTop: 40,
  },
  backButton: {
    padding: Layout.spacing.small,
    marginRight: Layout.spacing.small,
    zIndex: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    marginLeft: -40,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: Layout.spacing.small,
    paddingHorizontal: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    zIndex: 1,
  },
  saveButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.large,
  },
  activityGroup: {
    marginBottom: Layout.spacing.large,
  },
  activityGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.medium,
  },
  activityGroupTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityGroupTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    marginLeft: Layout.spacing.medium,
  },
  addButton: {
    padding: Layout.spacing.small,
    borderRadius: Layout.borderRadius.full,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  activityItemContent: {
    flex: 1,
  },
  activityItemTitle: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginBottom: 4,
  },
  activityItemDescription: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
  },
  removeButton: {
    padding: Layout.spacing.small,
  },
  emptyState: {
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
}); 