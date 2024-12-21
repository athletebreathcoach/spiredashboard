import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { auth, db } from '../config/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';

export default function ClientHistory({ route, navigation }) {
  const { theme } = useTheme();
  const { clientId } = route.params;
  const [loading, setLoading] = useState(true);
  const [clientEmail, setClientEmail] = useState('');
  const [exerciseHistory, setExerciseHistory] = useState([]);

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      console.log('Loading history for client:', clientId);

      // Get client's email
      const userDoc = await getDoc(doc(db, 'users', clientId));
      if (userDoc.exists()) {
        setClientEmail(userDoc.data().email);
      }
      
      // Get exercise results
      const exerciseRef = collection(db, 'users', clientId, 'exerciseResults');
      const exerciseQuery = query(exerciseRef, orderBy('completedAt', 'desc'));
      const exerciseSnapshot = await getDocs(exerciseQuery);
      
      const exerciseData = exerciseSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().completedAt?.toDate?.() || new Date(doc.data().completedAt)
      }));
      setExerciseHistory(exerciseData);

    } catch (error) {
      console.error('Error loading client history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderExerciseCard = (item) => (
    <View
      key={item.id}
      style={[styles.historyCard, { backgroundColor: '#2C2C2E' }]}
    >
      <View style={styles.historyHeader}>
        <View style={styles.headerLeft}>
          <Ionicons name="barbell" size={24} color={theme.colors.primary} />
          <Text style={[styles.exerciseTitle, { color: theme.colors.text }]}>
            {item.exerciseId}
          </Text>
        </View>
        <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
          {formatDate(item.date)}
        </Text>
      </View>
      
      <View style={styles.resultDetails}>
        {Object.entries(item).map(([key, value]) => {
          if (['id', 'exerciseId', 'completedAt', 'date'].includes(key)) return null;
          return (
            <View key={key} style={styles.resultItem}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>
                {key}:
              </Text>
              <Text style={[styles.resultValue, { color: theme.colors.text }]}>
                {value.toString()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.clientEmail, { color: theme.colors.text }]}>
          {clientEmail}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.breathingButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('ClientBreathHistory', { clientId: clientId })}
      >
        <Ionicons name="fitness" size={24} color="#FFFFFF" />
        <Text style={styles.breathingButtonText}>View Breathing History</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Exercise History
      </Text>

      {loading ? (
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          Loading...
        </Text>
      ) : exerciseHistory.length > 0 ? (
        <ScrollView style={styles.historyList}>
          {exerciseHistory.map(item => renderExerciseCard(item))}
        </ScrollView>
      ) : (
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          No exercise history yet
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Layout.spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  clientEmail: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
  },
  breathingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Layout.spacing.large,
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    gap: Layout.spacing.small,
  },
  breathingButtonText: {
    color: '#FFFFFF',
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  sectionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.semibold,
    marginHorizontal: Layout.spacing.large,
    marginBottom: Layout.spacing.medium,
  },
  message: {
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
    textAlign: 'center',
    marginTop: Layout.spacing.xlarge,
  },
  historyList: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  historyCard: {
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.small,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.small,
  },
  exerciseTitle: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  date: {
    fontSize: 13,
    fontFamily: Typography.fonts.regular,
  },
  resultDetails: {
    marginTop: Layout.spacing.small,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultLabel: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
    marginRight: Layout.spacing.small,
    textTransform: 'capitalize',
  },
  resultValue: {
    fontSize: 15,
    fontFamily: Typography.fonts.medium,
  },
}); 