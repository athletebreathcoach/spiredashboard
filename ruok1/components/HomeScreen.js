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
  const theme = useTheme();

  if (!theme) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]} />
    );
  }

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
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
              onPress={() => navigation.navigate(action.navigateTo)}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={32} color={theme.colors.background} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
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
    flexGrow: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: CARD_MARGIN,
  },
  card: {
    width: CARD_WIDTH,
    aspectRatio: 1,
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.medium,
    marginBottom: CARD_MARGIN,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
}); 