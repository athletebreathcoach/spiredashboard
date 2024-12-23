import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

const { width } = Dimensions.get('window');
const CARD_MARGIN = Layout.spacing.small;
const CARDS_PER_ROW = 2;
const TOTAL_MARGIN_SPACE = CARD_MARGIN * (CARDS_PER_ROW + 1);
const CARD_WIDTH = (width - (Layout.spacing.large * 2) - TOTAL_MARGIN_SPACE) / CARDS_PER_ROW;

// Combined data source from all categories
const allItems = [
  // From Exercises
  {
    id: 'ex1',
    title: 'Running',
    category: 'Cardio',
    type: 'Exercise',
    icon: 'walk-outline',
    color: '#4A90E2',
    navigateTo: 'Exercises'
  },
  {
    id: 'ex2',
    title: 'Bench Press',
    category: 'Strength',
    type: 'Exercise',
    icon: 'barbell-outline',
    color: '#FF3B30',
    navigateTo: 'Exercises'
  },
  // From Breathing Tests
  {
    id: 'bt1',
    title: 'CO2 Tolerance',
    category: 'Baseline',
    type: 'Breathing Test',
    icon: 'timer-outline',
    color: '#4A90E2',
    navigateTo: 'BreathingTests'
  },
  {
    id: 'bt2',
    title: 'O2 Advantage Test',
    category: 'Baseline',
    type: 'Breathing Test',
    icon: 'pulse-outline',
    color: '#FF9500',
    navigateTo: 'BreathingTests'
  },
  // From Breath Protocols
  {
    id: 'bp1',
    title: 'Box Breathing',
    category: 'Protocol',
    type: 'Breath Protocol',
    icon: 'square-outline',
    color: '#4A90E2',
    navigateTo: 'BreathProtocols'
  },
  {
    id: 'bp2',
    title: 'Triangle Breathing',
    category: 'Protocol',
    type: 'Breath Protocol',
    icon: 'triangle-outline',
    color: '#FF9500',
    navigateTo: 'BreathProtocols'
  },
  {
    id: 'bp3',
    title: '4-7-8 Breathing',
    category: 'Protocol',
    type: 'Breath Protocol',
    icon: 'timer-outline',
    color: '#FF3B30',
    navigateTo: 'BreathProtocols'
  },
  // From Guided Sessions
  {
    id: 'gs1',
    title: 'Box Breathing',
    category: 'Relaxation',
    type: 'Guided Session',
    icon: 'square-outline',
    color: '#4A90E2',
    navigateTo: 'GuidedSessions'
  },
  {
    id: 'gs2',
    title: 'Deep Calm',
    category: 'Relaxation',
    type: 'Guided Session',
    icon: 'water-outline',
    color: '#FF9500',
    navigateTo: 'GuidedSessions'
  },
  // From Habits & Tasks
  {
    id: 'ht1',
    title: 'Morning Breath Work',
    category: 'Daily',
    type: 'Habit',
    icon: 'sunny-outline',
    color: '#4A90E2',
    navigateTo: 'HabitsTasks'
  },
  {
    id: 'ht2',
    title: 'Evening Wind Down',
    category: 'Daily',
    type: 'Habit',
    icon: 'moon-outline',
    color: '#FF9500',
    navigateTo: 'HabitsTasks'
  }
];

const categories = [
  {
    id: 1,
    title: 'Programs',
    icon: 'library-outline',
    color: '#4A90E2',
    navigateTo: 'Programs'
  },
  {
    id: 2,
    title: 'Breathing Tests',
    icon: 'fitness-outline',
    color: '#50E3C2',
    navigateTo: 'BreathingTests'
  },
  {
    id: 3,
    title: 'Exercises',
    icon: 'barbell-outline',
    color: '#FF9500',
    navigateTo: 'Exercises'
  },
  {
    id: 4,
    title: 'Breath Protocols',
    icon: 'pulse-outline',
    color: '#FF3B30',
    navigateTo: 'BreathProtocols'
  },
  {
    id: 5,
    title: 'Habits & Tasks',
    icon: 'checkbox-outline',
    color: '#5856D6',
    navigateTo: 'HabitsTasks'
  },
  {
    id: 6,
    title: 'Guided Sessions',
    icon: 'compass-outline',
    color: '#34C759',
    navigateTo: 'GuidedSessions'
  },
];

export default function Search({ navigation }) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    
    const filtered = allItems.filter(item => 
      item.title.toLowerCase().includes(text.toLowerCase()) ||
      item.category.toLowerCase().includes(text.toLowerCase()) ||
      item.type.toLowerCase().includes(text.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const handleCategoryPress = (category) => {
    navigation.navigate(category.navigateTo);
  };

  const handleItemPress = (item) => {
    if (item.type === 'Exercise') {
      navigation.navigate('ExerciseDetail', { 
        exercise: {
          ...item,
          instructions: [
            "1. Lie on a flat bench with your feet flat on the floor",
            "2. Grip the barbell slightly wider than shoulder-width",
            "3. Unrack the bar and lower it to your mid-chest",
            "4. Keep your elbows at about a 45-degree angle to your body",
            "5. Touch the bar to your chest while maintaining control",
            "6. Press the bar back up to the starting position",
          ],
          tips: [
            "Keep your wrists straight",
            "Maintain a tight core throughout the movement",
            "Drive your feet into the ground for stability",
            "Keep your shoulder blades retracted",
          ]
        }
      });
    } else {
      navigation.navigate(item.navigateTo);
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
          style={[
            styles.searchInput, 
            { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
            }
          ]}
          placeholder="Search exercises, tests, sessions..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
      >
        {searchQuery.length > 0 ? (
          <View style={styles.resultsContainer}>
            {searchResults.length > 0 ? (
              searchResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.resultItem, { backgroundColor: theme.colors.surface }]}
                  onPress={() => handleItemPress(item)}
                >
                  <Ionicons name={item.icon} size={24} color={theme.colors.primary} />
                  <View style={styles.resultContent}>
                    <Text style={[styles.resultTitle, { color: theme.colors.text }]}>{item.title}</Text>
                    <View style={styles.resultDetails}>
                      <Text style={[styles.resultType, { color: theme.colors.textSecondary }]}>{item.type}</Text>
                      <Text style={[styles.resultCategory, { color: theme.colors.primary }]}>#{item.category}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.noResults, { color: theme.colors.textSecondary }]}>
                No results found
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.grid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.card, { backgroundColor: theme.colors.surface }]}
                onPress={() => handleCategoryPress(category)}
              >
                <View style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={category.icon} size={32} color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                    {category.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.large,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -CARD_MARGIN,
    marginTop: -CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    height: 120,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.medium,
    margin: CARD_MARGIN,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  iconContainer: {
    marginTop: Layout.spacing.small,
  },
  cardTitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.semibold,
    marginTop: Layout.spacing.small,
  },
  resultsContainer: {
    flex: 1,
    marginTop: Layout.spacing.medium,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  resultContent: {
    marginLeft: Layout.spacing.medium,
    flex: 1,
  },
  resultTitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.semibold,
    marginBottom: 4,
  },
  resultDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultType: {
    fontSize: Layout.text.small,
    marginRight: Layout.spacing.small,
    fontFamily: Typography.fonts.regular,
  },
  resultCategory: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  noResults: {
    textAlign: 'center',
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginTop: Layout.spacing.large,
  },
}); 