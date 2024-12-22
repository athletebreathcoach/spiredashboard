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

const tests = [
  {
    id: 1,
    title: 'CO2 Tolerance',
    category: 'Baseline',
    description: 'Measure your CO2 tolerance level',
    icon: 'timer-outline',
    color: '#4A90E2',
  },
  {
    id: 2,
    title: 'O2 Advantage Test',
    category: 'Baseline',
    description: 'Measure your oxygen efficiency',
    icon: 'pulse-outline',
    color: '#FF9500',
  },
  {
    id: 3,
    title: 'BOLT Score',
    category: 'Assessment',
    description: 'Body Oxygen Level Test',
    icon: 'analytics-outline',
    color: '#FF3B30',
  },
  {
    id: 4,
    title: 'MAX Breath Hold',
    category: 'Performance',
    description: 'Maximum breath hold duration',
    icon: 'stopwatch-outline',
    color: '#5856D6',
  },
];

export default function BreathingTests({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Breathing Tests
      </Text>
      <Text style={styles.subtitle}>
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
            style={[styles.card, { backgroundColor: test.color }]}
            onPress={() => navigation.navigate('BreathTestDetail', { test })}
          >
            <View style={styles.cardHeader}>
              <Ionicons name={test.icon} size={24} color="#FFFFFF" />
              <Text style={styles.cardTitle}>{test.title}</Text>
            </View>
            <Text style={styles.cardDescription}>{test.description}</Text>
            <Text style={styles.cardCategory}>#{test.category}</Text>
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
    backgroundColor: '#1C1C1E',
  },
  title: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.small,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.large,
    color: '#8E8E93',
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
  cardTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    color: '#FFFFFF',
    marginLeft: Layout.spacing.medium,
  },
  cardDescription: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    color: '#FFFFFF',
    marginBottom: Layout.spacing.small,
  },
  cardCategory: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    color: '#FFFFFF',
    opacity: 0.8,
  },
}); 