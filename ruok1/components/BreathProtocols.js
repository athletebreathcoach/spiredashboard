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
const CARD_WIDTH = width - (CARD_MARGIN * 2 + Layout.spacing.large * 2);

const protocols = [
  {
    id: 1,
    title: 'Test Breath',
    description: 'A quick test protocol with a 1-2-3-4 pattern.',
    color: '#9B59B6',
    icon: 'flask-outline',
    settings: {
      inhaleTime: 1,
      inhaleHoldTime: 2,
      exhaleTime: 3,
      exhaleHoldTime: 4,
      rounds: 2,
      totalTime: 20
    }
  },
  {
    id: 2,
    title: 'Box Breathing',
    description: 'Equal parts inhale, hold, exhale, and hold. A technique used by Navy SEALs for calm and focus.',
    color: '#4A90E2',
    icon: 'square-outline',
    settings: {
      inhaleTime: 4,
      inhaleHoldTime: 4,
      exhaleTime: 4,
      exhaleHoldTime: 4,
      rounds: 19,
      totalTime: 304
    }
  },
  {
    id: 3,
    title: 'Triangle Breathing',
    description: 'Three-part breath pattern without holds. Promotes relaxation and stress relief.',
    color: '#FF9500',
    icon: 'triangle-outline',
    settings: {
      inhaleTime: 5,
      inhaleHoldTime: 0,
      exhaleTime: 5,
      exhaleHoldTime: 5,
      rounds: 20,
      totalTime: 300
    }
  },
  {
    id: 4,
    title: '4-7-8 Breathing',
    description: 'Inhale for 4, hold for 7, exhale for 8. Dr. Weil\'s technique for deep relaxation.',
    color: '#FF3B30',
    icon: 'timer-outline',
    settings: {
      inhaleTime: 4,
      inhaleHoldTime: 7,
      exhaleTime: 8,
      exhaleHoldTime: 0,
      rounds: 16,
      totalTime: 304
    }
  },
];

export default function BreathProtocols({ navigation }) {
  const { theme } = useTheme();

  const handleProtocolSelect = (protocol) => {
    navigation.navigate('BreathGuide', { 
      settings: protocol.settings,
      presetName: protocol.title 
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Breath Protocols</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Select a breathing technique to begin
      </Text>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {protocols.map((protocol) => (
          <TouchableOpacity
            key={protocol.id}
            style={[styles.card, { backgroundColor: protocol.color }]}
            onPress={() => handleProtocolSelect(protocol)}
          >
            <View style={styles.cardHeader}>
              <Ionicons name={protocol.icon} size={32} color="#FFFFFF" />
              <Text style={styles.cardTitle}>{protocol.title}</Text>
            </View>
            <Text style={styles.cardDescription}>{protocol.description}</Text>
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
    fontSize: Layout.text.xxlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.small,
  },
  subtitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.large,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.large,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: Layout.borderRadius.medium,
    padding: Layout.spacing.large,
    marginBottom: Layout.spacing.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  cardTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.semibold,
    color: '#FFFFFF',
    marginLeft: Layout.spacing.medium,
  },
  cardDescription: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    color: '#FFFFFF',
    opacity: 0.9,
  },
}); 