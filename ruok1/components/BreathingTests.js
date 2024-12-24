import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useTheme } from '../theme/ThemeContext';

export default function BreathingTests({ navigation }) {
  const theme = useTheme();

  const tests = [
    {
      id: 1,
      title: 'CO2 Tolerance',
      category: 'Baseline',
      description: 'Measure your CO2 tolerance level',
      icon: 'timer-outline',
      color: theme.colors.primary,
    },
    {
      id: 2,
      title: 'O2 Advantage Test',
      category: 'Baseline',
      description: 'Measure your oxygen efficiency',
      icon: 'pulse-outline',
      color: theme.colors.primary,
    },
    {
      id: 3,
      title: 'BOLT Score',
      category: 'Assessment',
      description: 'Body Oxygen Level Test',
      icon: 'analytics-outline',
      color: theme.colors.primary,
    },
    {
      id: 4,
      title: 'MAX Breath Hold',
      category: 'Performance',
      description: 'Maximum breath hold duration',
      icon: 'stopwatch-outline',
      color: theme.colors.primary,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Breathing Tests
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Assess your breathing capacity
      </Text>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tests.map((test) => (
          <TouchableOpacity
            key={test.id}
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface }
            ]}
            onPress={() => navigation.navigate('BreathTestDetail', { test })}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: test.color }]}>
                <Ionicons name={test.icon} size={24} color={theme.colors.background} />
              </View>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{test.title}</Text>
            </View>
            <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
              {test.description}
            </Text>
            <Text style={[styles.cardCategory, { color: theme.colors.primary }]}>
              #{test.category}
            </Text>
          </TouchableOpacity>
        ))}
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
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.small,
  },
  subtitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.large,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.large,
  },
  card: {
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.medium,
  },
  cardTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
  },
  cardDescription: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.small,
  },
  cardCategory: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
}); 