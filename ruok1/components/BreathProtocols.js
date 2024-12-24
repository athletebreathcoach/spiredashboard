import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useTheme } from '../theme/ThemeContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function BreathProtocols({ navigation, route }) {
  const theme = useTheme();
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const isSelectionMode = route.params?.mode === 'selection';
  const onProtocolSelect = route.params?.onProtocolSelect;

  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = async () => {
    try {
      const protocolsRef = collection(db, 'breathProtocols');
      const snapshot = await getDocs(protocolsRef);
      const protocolsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProtocols(protocolsData);
    } catch (error) {
      console.error('Error loading breath protocols:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProtocolPress = (protocol) => {
    if (!isSelectionMode) {
      const breathGuideParams = {
        settings: {
          inhaleTime: protocol.pattern.inhale,
          inhaleHoldTime: protocol.pattern.inHold,
          exhaleTime: protocol.pattern.exhale,
          exhaleHoldTime: protocol.pattern.exHold,
          rounds: protocol.rounds,
          totalTime: parseInt(protocol.duration)
        },
        presetName: protocol.title
      };
      navigation.navigate('BreathGuide', breathGuideParams);
    }
  };

  const handleAddPress = (protocol) => {
    if (isSelectionMode && onProtocolSelect) {
      onProtocolSelect(protocol);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isSelectionMode ? 'Add Breath Protocol' : 'Breath Protocols'}
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {protocols.map((protocol) => (
          <TouchableOpacity
            key={protocol.id}
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleProtocolPress(protocol)}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Ionicons name="pulse-outline" size={24} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{protocol.title}</Text>
              </View>
              <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
                {protocol.description}
              </Text>
              <View style={styles.cardDetails}>
                <Text style={[styles.cardDetail, { color: theme.colors.textSecondary }]}>
                  Duration: {protocol.duration}
                </Text>
                <Text style={[styles.cardDetail, { color: theme.colors.textSecondary }]}>
                  {protocol.rounds} rounds
                </Text>
              </View>
            </View>

            {isSelectionMode && (
              <View style={styles.addButtonContainer}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddPress(protocol)}
                >
                  <Ionicons name="add-circle" size={32} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            )}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  cardTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    marginLeft: Layout.spacing.medium,
  },
  cardDescription: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.medium,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.medium,
  },
  cardDetail: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
  },
  addButtonContainer: {
    marginLeft: Layout.spacing.medium,
    justifyContent: 'center',
  },
  addButton: {
    padding: Layout.spacing.small,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.medium,
    height: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Layout.spacing.small,
    marginRight: Layout.spacing.small,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
  },
}); 