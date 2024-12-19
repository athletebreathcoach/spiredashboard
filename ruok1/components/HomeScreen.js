import React from 'react';
import {
  StyleSheet,
  View,
  Text,
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

const quickActions = [
  {
    id: 1,
    title: 'Quick Breath',
    icon: 'pulse-outline',
    color: '#4A90E2',
    navigateTo: 'BreathGuide'
  },
  {
    id: 2,
    title: 'Daily Exercise',
    icon: 'barbell-outline',
    color: '#FF9500',
    navigateTo: 'Exercises'
  },
  {
    id: 3,
    title: 'Breath Test',
    icon: 'fitness-outline',
    color: '#FF3B30',
    navigateTo: 'BreathingTests'
  },
  {
    id: 4,
    title: 'Guided Session',
    icon: 'compass-outline',
    color: '#34C759',
    navigateTo: 'GuidedSessions'
  }
];

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.card, { backgroundColor: action.color }]}
              onPress={() => navigation.navigate(action.navigateTo)}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name={action.icon} size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.cardTitle}>
                  {action.title}
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