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
      const q = query(
        sessionsRef,
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const sessionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      sessionsData.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = () => {
    navigation.navigate('ActivitySelector');
  };

  const handleSessionPress = (session) => {
    navigation.navigate('SessionDetail', { session });
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (session.description && session.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        {filteredSessions.map(session => (
          <TouchableOpacity
            key={session.id}
            style={[styles.sessionCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSessionPress(session)}
          >
            <View style={styles.sessionContent}>
              <Text style={[styles.sessionTitle, { color: theme.colors.text }]}>
                {session.title}
              </Text>
              {session.description && (
                <Text 
                  style={[styles.sessionDescription, { color: theme.colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {session.description}
                </Text>
              )}
              <View style={styles.sessionFooter}>
                <Text style={[styles.itemCount, { color: theme.colors.textSecondary }]}>
                  {session.items?.length || 0} items
                </Text>
                <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
                  {new Date(session.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateSession}
      >
        <Ionicons name="add" size={24} color="#fff" />
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
    right: Layout.spacing.medium,
    bottom: Layout.spacing.medium,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 