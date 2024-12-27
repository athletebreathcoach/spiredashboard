import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  ActivityIndicator 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

export default function GuidedSessions({ navigation }) {
  const theme = useTheme();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuidedSessions();
  }, []);

  const fetchGuidedSessions = async () => {
    try {
      const sessionsRef = collection(db, 'guidedSessions');
      const q = query(sessionsRef, orderBy('title'));
      const snapshot = await getDocs(q);
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching guided sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration) => {
    return `${duration} min`;
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
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Guided Sessions
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Follow along with expert-led breathing sessions
      </Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sessions.map((session) => (
          <TouchableOpacity
            key={session.id}
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => navigation.navigate('GuidedSessionDetail', { session })}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Ionicons 
                  name="play-circle-outline" 
                  size={24} 
                  color={theme.colors.primary} 
                  style={styles.cardIcon}
                />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                  {session.title}
                </Text>
              </View>
              <Text 
                style={[styles.cardDescription, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {session.description}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.typeContainer}>
                  <Text style={[styles.typeText, { color: theme.colors.text }]}>
                    {session.type}
                  </Text>
                </View>
                <View style={styles.durationContainer}>
                  <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.duration, { color: theme.colors.textSecondary }]}>
                    {formatDuration(session.duration)}
                  </Text>
                </View>
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
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.medium,
    overflow: 'hidden',
  },
  cardContent: {
    padding: Layout.spacing.large,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  cardIcon: {
    marginRight: Layout.spacing.medium,
  },
  cardTitle: {
    flex: 1,
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
  },
  cardDescription: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.medium,
    lineHeight: Layout.text.medium * 1.4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeContainer: {
    backgroundColor: 'rgba(0, 181, 224, 0.1)',
    paddingHorizontal: Layout.spacing.medium,
    paddingVertical: Layout.spacing.small,
    borderRadius: Layout.borderRadius.small,
  },
  typeText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
    marginLeft: Layout.spacing.small,
  },
}); 