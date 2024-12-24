import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import Sections from './Sections';

const TABS = [
  { id: 'programs', label: 'Programs' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'sections', label: 'Sections' },
];

export default function Programs({ navigation }) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('programs');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'programs':
        return (
          <ScrollView style={styles.scrollView}>
            {/* Existing programs content */}
          </ScrollView>
        );
      case 'sessions':
        return (
          <ScrollView style={styles.scrollView}>
            {/* Existing sessions content */}
          </ScrollView>
        );
      case 'sections':
        return <Sections navigation={navigation} route={{ params: {} }} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Programs
        </Text>
      </View>

      <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
              { borderBottomColor: theme.colors.primary }
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeTab === tab.id && { color: theme.colors.primary }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {renderTabContent()}
      </View>
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
    paddingHorizontal: Layout.spacing.large,
    height: 60,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Typography.fonts.bold,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Layout.spacing.medium,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontFamily: Typography.fonts.medium,
  },
  content: {
    flex: 1,
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.large,
  },
  comingSoonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
}); 