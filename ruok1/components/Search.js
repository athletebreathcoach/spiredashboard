import React from 'react';
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
const CARD_MARGIN = 10;
const CARD_WIDTH = (width - (CARD_MARGIN * 3 + Layout.spacing.large * 2)) / 2;

const categories = [
  {
    id: 1,
    title: 'Programs',
    icon: 'library-outline',
    color: '#4A90E2',
  },
  {
    id: 2,
    title: 'Breathing Tests',
    icon: 'fitness-outline',
    color: '#50E3C2',
  },
  {
    id: 3,
    title: 'Exercises',
    icon: 'barbell-outline',
    color: '#FF9500',
  },
  {
    id: 4,
    title: 'Breath Protocols',
    icon: 'pulse-outline',
    color: '#FF3B30',
  },
  {
    id: 5,
    title: 'Habits & Tasks',
    icon: 'checkbox-outline',
    color: '#5856D6',
  },
  {
    id: 6,
    title: 'Guided Sessions',
    icon: 'compass-outline',
    color: '#34C759',
  },
];

export default function Search({ navigation }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Search</Text>
      
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
          placeholder="Programs, Categories, Exercises..."
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.card, { backgroundColor: category.color }]}
              onPress={() => navigation.navigate(category.title)}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name={category.icon} size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.cardTitle}>
                  {category.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  title: {
    fontSize: Layout.text.xxxlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.large,
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
  scrollContent: {
    paddingBottom: Layout.spacing.large,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    height: 120,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.medium,
    overflow: 'hidden',
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
    color: '#FFFFFF',
    marginTop: Layout.spacing.small,
  },
}); 