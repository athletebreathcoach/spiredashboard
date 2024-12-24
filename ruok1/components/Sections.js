import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

const getActivityIcon = (type) => {
  switch (type.toLowerCase()) {
    case 'exercise':
      return 'barbell-outline';
    case 'breathprotocol':
      return 'fitness-outline';
    case 'breathingtest':
      return 'pulse-outline';
    case 'habit':
    case 'task':
      return 'checkbox-outline';
    case 'guidedsession':
      return 'play-circle-outline';
    default:
      return 'list-outline';
  }
};

export default function Sections({ navigation, route }) {
  const theme = useTheme();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const isSelectionMode = route.params?.mode === 'selection';
  const onSelect = route.params?.onSelect;
  const isEmbedded = !route.params?.mode; // If no mode is set, we're embedded in Programs tab

  useEffect(() => {
    loadSections();
  }, []);

  // Add focus listener to reload sections when returning to this screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSections();
    });

    return unsubscribe;
  }, [navigation]);

  const loadSections = async () => {
    try {
      setLoading(true);
      const sectionsRef = collection(db, 'sections');
      const snapshot = await getDocs(sectionsRef);
      const sectionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSections(sectionsData);
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionPress = (section) => {
    if (isSelectionMode && onSelect) {
      onSelect(section);
      navigation.goBack();
    } else {
      navigation.navigate('SectionDetail', { section });
    }
  };

  const handleAddPress = (section) => {
    navigation.navigate('CategorySelector', {
      selectedDate: new Date(),
      selectedClient: null,
      onItemSelect: (activity, type) => {
        // Navigate to ActivityMetricsForm first
        navigation.navigate('ActivityMetricsForm', {
          activity,
          type,
          onSave: async (metrics) => {
            try {
              setLoading(true);
              const sectionRef = doc(db, 'sections', section.id);
              const updatedActivities = [...(section.activities || []), {
                id: activity.id,
                type: type,
                title: activity.title || activity.name,
                data: activity,
                metrics
              }];
              
              await updateDoc(sectionRef, {
                activities: updatedActivities
              });
              
              // Refresh sections list
              loadSections();
              
              // Navigate back to sections list
              navigation.navigate('Sections');
            } catch (error) {
              console.error('Error adding activity:', error);
            } finally {
              setLoading(false);
            }
          }
        });
      }
    });
  };

  const handleCreateSection = () => {
    navigation.navigate('CreateSection');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {!isEmbedded && (
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {isSelectionMode ? 'Select Section' : 'Sections'}
          </Text>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSectionPress(section)}
          >
            <View style={styles.sectionContent}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {section.title}
              </Text>
              {section.description && (
                <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
                  {section.description}
                </Text>
              )}
              <View style={styles.activityTypes}>
                {section.activities?.map((activity) => (
                  <View 
                    key={activity.type}
                    style={[styles.activityTag, { backgroundColor: theme.colors.primary + '20' }]}
                  >
                    <Ionicons 
                      name={getActivityIcon(activity.type)} 
                      size={16} 
                      color={theme.colors.primary} 
                      style={styles.activityIcon}
                    />
                    <Text style={[styles.activityText, { color: theme.colors.primary }]}>
                      {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}s
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            {isSelectionMode ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddPress(section);
                }}
              >
                <Ionicons 
                  name="add-circle" 
                  size={24} 
                  color={theme.colors.primary} 
                />
              </TouchableOpacity>
            ) : (
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={theme.colors.primary} 
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateSection}
      >
        <Ionicons name="add" size={24} color={theme.colors.white} />
        <Text style={[styles.createButtonText, { color: theme.colors.white }]}>
          Create Section
        </Text>
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.medium,
    height: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Layout.spacing.small,
    marginRight: Layout.spacing.small,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.large,
  },
  sectionCard: {
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.medium,
  },
  sectionDescription: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.medium,
  },
  activityTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.small,
  },
  activityTag: {
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.full,
    marginRight: Layout.spacing.small,
  },
  activityIcon: {
    marginRight: Layout.spacing.small,
  },
  activityText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
  },
  createButton: {
    position: 'absolute',
    right: Layout.spacing.large,
    bottom: Layout.spacing.large,
    width: 120,
    height: 48,
    borderRadius: Layout.borderRadius.medium,
    flexDirection: 'row',
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
  createButtonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.semibold,
    marginLeft: Layout.spacing.small,
  },
}); 