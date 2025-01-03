import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';
import Sections from './Sections';
import Sessions from './Sessions';

export default function Programs({ navigation }) {
  const theme = useTheme();
  const [activeView, setActiveView] = useState('programs');
  const [searchQuery, setSearchQuery] = useState('');

  const renderContent = () => {
    switch (activeView) {
      case 'programs':
        return (
          <ScrollView style={styles.scrollView}>
            {/* Existing programs content */}
          </ScrollView>
        );
      case 'sections':
        return <Sections navigation={navigation} route={{ params: {} }} searchQuery={searchQuery} />;
      case 'sessions':
        return <Sessions navigation={navigation} searchQuery={searchQuery} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
          placeholder="Search..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: activeView === 'programs' ? theme.colors.primary : theme.colors.surface }
          ]}
          onPress={() => setActiveView('programs')}
        >
          <Text
            style={[
              styles.buttonText,
              { color: activeView === 'programs' ? '#FFFFFF' : theme.colors.textSecondary }
            ]}
          >
            Programs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: activeView === 'sections' ? theme.colors.primary : theme.colors.surface }
          ]}
          onPress={() => setActiveView('sections')}
        >
          <Text
            style={[
              styles.buttonText,
              { color: activeView === 'sections' ? '#FFFFFF' : theme.colors.textSecondary }
            ]}
          >
            Sections
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.navButton,
            { backgroundColor: activeView === 'sessions' ? theme.colors.primary : theme.colors.surface }
          ]}
          onPress={() => setActiveView('sessions')}
        >
          <Text
            style={[
              styles.buttonText,
              { color: activeView === 'sessions' ? '#FFFFFF' : theme.colors.textSecondary }
            ]}
          >
            Sessions
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Layout.spacing.medium,
    marginBottom: Layout.spacing.small,
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
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.medium,
    marginBottom: Layout.spacing.medium,
    gap: Layout.spacing.medium,
  },
  navButton: {
    flex: 1,
    paddingVertical: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  sessionsContainer: {
    flex: 1,
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
}); 