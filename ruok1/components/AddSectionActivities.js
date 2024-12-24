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
  const [activities, setActivities] = useState(sectionData.activities);

  const handleAddActivity = (activityType) => {
    const screenName = activityType.charAt(0).toUpperCase() + activityType.slice(1) + 's';
    navigation.navigate(screenName, {
      mode: 'selection',
      onSelect: (activity) => {
        console.log('Activity selected:', activity);
        setActivities(current => 
          current.map(a => {
            if (a.type === activityType) {
              return {
                ...a,
                items: [...(a.items || []), { 
                  id: activity.id,
                  title: activity.title,
                  description: activity.description,
                  type: activityType
                }]
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
      const sectionsRef = collection(db, 'sections');
      await addDoc(sectionsRef, {
        ...sectionData,
        activities,
        createdBy: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      navigation.navigate('Programs', { screen: 'Sections' });
    } catch (error) {
      console.error('Error creating section:', error);
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
                  {activityGroup.type.charAt(0).toUpperCase() + activityGroup.type.slice(1)}s
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
    case 'breathingTest': return 'fitness-outline';
    case 'exercise': return 'barbell-outline';
    case 'breathProtocol': return 'pulse-outline';
    case 'habitTask': return 'checkbox-outline';
    case 'guidedSession': return 'play-circle-outline';
    default: return 'add-circle-outline';
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