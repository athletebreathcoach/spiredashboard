import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export default function Sessions({ navigation, searchQuery = '' }) {
  const theme = useTheme();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const sessionsRef = collection(db, 'sessions');
      const userId = auth.currentUser?.uid;
      
      if (!userId) {
        console.error('No user ID found');
        setSessions([]);
        return;
      }

      const q = query(
        sessionsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = () => {
    console.log('Creating new session...');
    navigation.navigate('ActivitySelector', { 
      type: 'session',
      multiSelect: true
    });
  };

  const handleSessionPress = (session) => {
    navigation.navigate('SessionDetail', { session });
  };

  const filteredSessions = sessions.filter(session =>
    session.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSession = (session) => {
    return (
      <TouchableOpacity
        key={session.id}
        style={[styles.sessionCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => navigation.navigate('SessionDetail', { session })}
      >
        <View style={styles.sessionContent}>
          <View style={styles.sessionIcon}>
            <Ionicons name="barbell-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.sessionInfo}>
            <Text style={[styles.sessionTitle, { color: theme.colors.text }]}>
              {session.title}
            </Text>
            {session.description && (
              <Text style={[styles.sessionDescription, { color: theme.colors.textSecondary }]}>
                {session.description}
              </Text>
            )}
          </View>
          <View style={styles.sessionActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('SessionDetail', { 
                session,
                isScheduling: true
              })}
            >
              <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {filteredSessions.map(session => renderSession(session))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateSession}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: Layout.spacing.medium,
  },
  sessionCard: {
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.medium,
    overflow: 'hidden',
  },
  sessionContent: {
    padding: Layout.spacing.large,
  },
  sessionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.small,
  },
  sessionDescription: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.medium,
    lineHeight: Layout.text.medium * 1.4,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
  },
  date: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  fab: {
    position: 'absolute',
    right: Layout.spacing.large,
    bottom: Layout.spacing.large,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sessionIcon: {
    marginRight: Layout.spacing.medium,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: Layout.spacing.small,
  },
}); 