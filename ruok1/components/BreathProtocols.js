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
const CARD_MARGIN = Layout.spacing.medium;
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

export default function BreathProtocols({ route, navigation }) {
  const { selectionMode, onSelect } = route.params || {};
  const { theme } = useTheme();

  const handleProtocolPress = (protocol) => {
    if (selectionMode && onSelect) {
      onSelect(protocol);
    } else {
      navigation.navigate('BreathGuide', { 
        settings: protocol.settings,
        presetName: protocol.title
      });
    }
  };

  return (
    <View style={[styles.container, theme?.colors?.background && { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, theme?.colors?.text && { color: theme.colors.text }]}>
        Breathing Protocols
      </Text>
      <Text style={[styles.subtitle, theme?.colors?.textSecondary && { color: theme.colors.textSecondary }]}>
        Choose a protocol to begin your breathing practice
      </Text>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {protocols.map((protocol) => (
          <TouchableOpacity
            key={protocol.id}
            style={[styles.card, { backgroundColor: protocol.color }]}
            onPress={() => handleProtocolPress(protocol)}
          >
            <View style={styles.cardHeader}>
              <Ionicons name={protocol.icon} size={24} color="#FFFFFF" />
              <Text style={styles.cardTitle}>{protocol.title}</Text>
            </View>
            <Text style={styles.cardDescription}>{protocol.description}</Text>
            
            <View style={styles.cardDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                <Text style={styles.detailText}>
                  {protocol.settings.totalTime}s
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="repeat-outline" size={16} color="#FFFFFF" />
                <Text style={styles.detailText}>
                  {protocol.settings.rounds} rounds
                </Text>
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
  scrollView: {
    flex: 1,
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
    marginBottom: Layout.spacing.medium,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: Layout.spacing.large,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.small,
  },
  detailText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    color: '#FFFFFF',
  },
}); 