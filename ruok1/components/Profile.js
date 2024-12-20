import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { collection, getDocs } from 'firebase/firestore';

export default function Profile({ navigation }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={80} color={theme.colors.primary} />
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {auth.currentUser?.displayName || 'User'}
        </Text>
      </View>
      
      <View style={styles.headerContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Breath History
        </Text>
        <Ionicons 
          name="time-outline" 
          size={24} 
          color={theme.colors.textSecondary}
          style={styles.historyIcon}
          onPress={() => navigation.navigate('BreathHistory')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  email: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.xlarge,
    textAlign: 'center',
  },
  statsTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.medium,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: Layout.spacing.medium,
    marginBottom: Layout.spacing.large,
  },
  metricCard: {
    flex: 1,
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: Layout.text.xxlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.tiny,
  },
  metricLabel: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    textAlign: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  sectionTitle: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginRight: Layout.spacing.small,
  },
  historyIcon: {
    marginTop: 2, // Small adjustment to align with text
  },
}); 