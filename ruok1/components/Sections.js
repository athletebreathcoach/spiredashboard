import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useTheme } from '../theme/ThemeContext';
import { getSections } from '../firebase/sections';
import { auth } from '../config/firebase';

export default function Sections({ navigation }) {
  const theme = useTheme();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

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
    navigation.navigate('SectionDetail', { section });
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
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleCreateSection}
        >
          <Ionicons name="add" size={24} color={theme.colors.white} />
        </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: Layout.spacing.medium,
  },
  sectionCard: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.medium,
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
}); 