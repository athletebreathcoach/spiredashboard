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

  // Default colors to use when theme isn't ready
  const defaultColors = {
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    primary: '#00B5E0',
    border: '#2C2C2E'
  };

  // Use theme colors if available, otherwise fall back to defaults
  const colors = {
    background: theme?.colors?.background || defaultColors.background,
    surface: theme?.colors?.surface || defaultColors.surface,
    text: theme?.colors?.text || defaultColors.text,
    textSecondary: theme?.colors?.textSecondary || defaultColors.textSecondary,
    primary: theme?.colors?.primary || defaultColors.primary,
    border: theme?.colors?.border || defaultColors.border
  };

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
      style={[styles.historyCard, { backgroundColor: colors.surface }]}
    >
      <View style={styles.historyHeader}>
        <View style={styles.headerLeft}>
          <Ionicons name="barbell" size={24} color={colors.primary} />
          <Text style={[styles.exerciseTitle, { color: colors.text }]}>
            {item.exerciseId}
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formatDate(item.date)}
        </Text>
      </View>
      
      <View style={styles.resultDetails}>
        {Object.entries(item).map(([key, value]) => {
          if (['id', 'exerciseId', 'completedAt', 'date'].includes(key)) return null;
          return (
            <View key={key} style={styles.resultItem}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                {key}:
              </Text>
              <Text style={[styles.resultValue, { color: colors.text }]}>
                {value.toString()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.clientEmail, { color: colors.text }]}>
          {clientEmail}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.historyButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('ClientBreathHistory', { clientId: clientId })}
      >
        <Ionicons name="fitness" size={24} color="#FFFFFF" />
        <Text style={styles.historyButtonText}>View Breathing Exercises</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.historyButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('ClientBreathTestHistory', { clientId: clientId })}
      >
        <Ionicons name="pulse" size={24} color="#FFFFFF" />
        <Text style={styles.historyButtonText}>View Breathing Tests</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Exercise History
      </Text>

      {loading ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Loading...
        </Text>
      ) : exerciseHistory.length > 0 ? (
        <ScrollView style={styles.historyList}>
          {exerciseHistory.map(item => renderExerciseCard(item))}
        </ScrollView>
      ) : (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
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
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Layout.spacing.large,
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    gap: Layout.spacing.small,
  },
  historyButtonText: {
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