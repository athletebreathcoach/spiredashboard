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

const programs = [
  {
    id: 1,
    title: 'Beginner Program',
    category: 'Foundation',
    description: 'Start your breathing journey',
    duration: '4 weeks',
    icon: 'leaf-outline',
    color: '#4A90E2',
  },
  {
    id: 2,
    title: 'Performance',
    category: 'Advanced',
    description: 'Enhance athletic performance',
    duration: '8 weeks',
    icon: 'flash-outline',
    color: '#FF9500',
  },
  {
    id: 3,
    title: 'Stress Relief',
    category: 'Wellness',
    description: 'Manage stress and anxiety',
    duration: '6 weeks',
    icon: 'water-outline',
    color: '#FF3B30',
  },
  {
    id: 4,
    title: 'Sleep Better',
    category: 'Recovery',
    description: 'Improve sleep quality',
    duration: '4 weeks',
    icon: 'moon-outline',
    color: '#5856D6',
  },
];

export default function Programs({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Programs
      </Text>
      <Text style={styles.subtitle}>
        Structured breathing programs for your goals
      </Text>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {programs.map((program) => (
          <TouchableOpacity
            key={program.id}
            style={[styles.card, { backgroundColor: program.color }]}
            onPress={() => navigation.navigate('ProgramDetail', { program })}
          >
            <View style={styles.cardHeader}>
              <Ionicons name={program.icon} size={24} color="#FFFFFF" />
              <Text style={styles.cardTitle}>{program.title}</Text>
            </View>
            <Text style={styles.cardDescription}>{program.description}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardCategory}>#{program.category}</Text>
              <View style={styles.durationContainer}>
                <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                <Text style={styles.duration}>{program.duration}</Text>
              </View>
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
    marginBottom: Layout.spacing.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCategory: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    color: '#FFFFFF',
    marginLeft: Layout.spacing.small,
  },
}); 