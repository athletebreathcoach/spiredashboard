import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useTheme } from '../theme/ThemeContext';
import { getSections, scheduleSection } from '../firebase/sections';
import { auth } from '../config/firebase';

export default function Sections({ navigation, route }) {
  const theme = useTheme();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSections, setSelectedSections] = useState([]);
  const isSelectionMode = route.params?.selectedDate != null;
  const { selectedDate } = route.params || {};

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
    navigation.navigate('ActivitySelector');
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
      // Schedule all selected sections
      await Promise.all(
        selectedSections.map(section =>
          scheduleSection({
            userId: auth.currentUser.uid,
            sectionId: section.id,
            scheduledDate: selectedDate
          })
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

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Sections
        </Text>
        {!isSelectionMode && (
          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleCreateSection}
          >
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        )}
        {isSelectionMode && selectedSections.length > 0 && (
          <TouchableOpacity 
            style={[styles.programButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleProgramSelected}
          >
            <Text style={[styles.programButtonText, { color: theme.colors.white }]}>
              Add Selected ({selectedSections.length})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {sections.map(section => (
          <TouchableOpacity
            key={section.id}
            style={[styles.sectionCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSectionPress(section)}
          >
            <View style={styles.sectionContent}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {section.title}
                </Text>
                <Text style={[styles.activityCount, { color: theme.colors.textSecondary }]}>
                  {section.activities.length} activities
                </Text>
              </View>
              {section.description && (
                <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
                  {section.description}
                </Text>
              )}
              <View style={styles.activityTypes}>
                {Array.from(new Set(section.activities.map(a => a.type))).map(type => (
                  <View 
                    key={type}
                    style={[styles.activityTypeTag, { backgroundColor: theme.colors.border }]}
                  >
                    <Text style={[styles.activityTypeText, { color: theme.colors.text }]}>
                      {type}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
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
        ))}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.medium,
    height: 60,
    borderBottomWidth: 1,
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Typography.fonts.semibold,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  programButton: {
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.medium,
  },
  programButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.medium,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.medium,
  },
  sectionContent: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Typography.fonts.semibold,
  },
  activityCount: {
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.medium,
  },
  activityTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.small,
  },
  activityTypeTag: {
    paddingHorizontal: Layout.spacing.small,
    paddingVertical: Layout.spacing.xsmall,
    borderRadius: Layout.borderRadius.small,
  },
  activityTypeText: {
    fontSize: 12,
    fontFamily: Typography.fonts.medium,
  },
  selectionIcon: {
    marginLeft: Layout.spacing.medium,
  },
}); 