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
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { getGuidedSessions } from '../firebase/guidedSessions';

export default function GuidedSessions({ navigation, route }) {
  const { theme } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isSelectionMode = route.params?.mode === 'selection';
  const onSessionSelect = route.params?.onSessionSelect;

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const sessionsData = await getGuidedSessions();
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading guided sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionPress = (session) => {
    if (isSelectionMode && onSessionSelect) {
      onSessionSelect(session);
      navigation.goBack();
    } else {
      navigation.navigate('SessionDetail', { session });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Guided Sessions
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
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
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSessionPress(session)}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="play-circle-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{session.title}</Text>
            </View>
            <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
              {session.description}
            </Text>
            <View style={styles.cardFooter}>
              <View style={styles.durationContainer}>
                <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
                <Text style={[styles.duration, { color: theme.colors.text }]}>{session.duration}</Text>
              </View>
              {isSelectionMode && (
                <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
              )}
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginLeft: Layout.spacing.small,
  },
}); 