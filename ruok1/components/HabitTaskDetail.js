import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { db, auth } from '../config/firebase';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function HabitTaskDetail({ navigation, route }) {
  const theme = useTheme();
  const { item } = route.params;

  const handleComplete = async () => {
    try {
      const collectionName = item.type === 'habit' ? 'habitHistory' : 'taskHistory';
      const historyRef = collection(db, 'users', auth.currentUser.uid, collectionName);
      
      await addDoc(historyRef, {
        itemId: item.id,
        title: item.title,
        type: item.type,
        categoryId: item.categoryId,
        completedAt: serverTimestamp(),
        metrics: item.metrics
      });

      Alert.alert(
        "Success",
        `${item.type === 'habit' ? 'Habit' : 'Task'} marked as complete!`,
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error marking as complete:', error);
      Alert.alert('Error', 'Failed to mark as complete. Please try again.');
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return '';
    // Handle Firebase timestamp objects
    if (value && typeof value === 'object' && value.seconds) {
      const date = new Date(value.seconds * 1000);
      return date.toLocaleString();
    }
    // Handle boolean values
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    // Handle all other values
    return value.toString();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {item.type === 'habit' ? 'Habit' : 'Task'} Details
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.titleContainer}>
            <Ionicons name={item.icon} size={32} color={theme.colors.primary} />
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {item.title}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {item.description}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Details</Text>
            
            {item.type === 'habit' ? (
              <>
                <View style={styles.detailRow}>
                  <Ionicons name="repeat" size={20} color={theme.colors.primary} />
                  <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Frequency:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
                    {item.frequency}
                  </Text>
                </View>
                {Object.entries(item.metrics || {}).map(([key, value]) => (
                  <View key={key} style={styles.detailRow}>
                    <Ionicons name="stats-chart" size={20} color={theme.colors.primary} />
                    <Text style={[styles.detailLabel, { color: theme.colors.text }]}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
                      {formatValue(value)}
                    </Text>
                  </View>
                ))}
              </>
            ) : (
              <>
                <View style={styles.detailRow}>
                  <Ionicons name="flag" size={20} color={theme.colors.primary} />
                  <Text style={[styles.detailLabel, { color: theme.colors.text }]}>Priority:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
                    {item.priority}
                  </Text>
                </View>
                {Object.entries(item.metrics || {}).map(([key, value]) => (
                  <View key={key} style={styles.detailRow}>
                    <Ionicons name="stats-chart" size={20} color={theme.colors.primary} />
                    <Text style={[styles.detailLabel, { color: theme.colors.text }]}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
                      {formatValue(value)}
                    </Text>
                  </View>
                ))}
              </>
            )}

            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleComplete}
            >
              <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.background} />
              <Text style={[styles.completeButtonText, { color: theme.colors.background }]}>
                Mark as Complete
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Category</Text>
            <View style={styles.detailRow}>
              <Ionicons name="folder" size={20} color={theme.colors.primary} />
              <Text style={[styles.categoryText, { color: theme.colors.textSecondary }]}>
                {item.categoryId}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.medium,
    height: 60,
    marginTop: 44,
  },
  backButton: {
    padding: Layout.spacing.small,
    marginRight: Layout.spacing.small,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    marginLeft: Layout.spacing.medium,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.large,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.large,
  },
  title: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginLeft: Layout.spacing.medium,
  },
  card: {
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.large,
  },
  sectionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.medium,
  },
  description: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    lineHeight: Layout.text.medium * 1.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  detailLabel: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginLeft: Layout.spacing.medium,
    marginRight: Layout.spacing.small,
  },
  detailValue: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
  categoryText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginLeft: Layout.spacing.medium,
    textTransform: 'capitalize',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginTop: Layout.spacing.large,
  },
  completeButtonText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.semibold,
    marginLeft: Layout.spacing.small,
  },
}); 