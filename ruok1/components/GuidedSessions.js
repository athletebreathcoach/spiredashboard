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

const sessions = [
  {
    id: 1,
    title: 'Box Breathing',
    category: 'Relaxation',
    description: 'Guided box breathing session',
    duration: '10 min',
    icon: 'square-outline',
    color: '#4A90E2',
  },
  {
    id: 2,
    title: 'Deep Calm',
    category: 'Relaxation',
    description: 'Deep relaxation practice',
    duration: '15 min',
    icon: 'water-outline',
    color: '#FF9500',
  },
  {
    id: 3,
    title: 'Power Breathing',
    category: 'Performance',
    description: 'High-intensity breath work',
    duration: '20 min',
    icon: 'flash-outline',
    color: '#FF3B30',
  },
  {
    id: 4,
    title: 'Sleep Prep',
    category: 'Recovery',
    description: 'Evening wind-down routine',
    duration: '15 min',
    icon: 'moon-outline',
    color: '#5856D6',
  },
];

export default function GuidedSessions({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Guided Sessions
      </Text>
      <Text style={styles.subtitle}>
        Follow along with guided breathing practices
      </Text>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sessions.map((session) => (
          <TouchableOpacity
            key={session.id}
            style={[styles.card, { backgroundColor: session.color }]}
            onPress={() => navigation.navigate('SessionDetail', { session })}
          >
            <View style={styles.cardHeader}>
              <Ionicons name={session.icon} size={24} color="#FFFFFF" />
              <Text style={styles.cardTitle}>{session.title}</Text>
            </View>
            <Text style={styles.cardDescription}>{session.description}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardCategory}>#{session.category}</Text>
              <View style={styles.durationContainer}>
                <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                <Text style={styles.duration}>{session.duration}</Text>
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