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
import { getHabits, getTasks } from '../firebase/habits';

export default function HabitsTasks({ navigation, route }) {
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const isSelectionMode = route.params?.mode === 'selection';
  const onItemSelect = route.params?.onItemSelect;
  const selectedDate = route.params?.selectedDate;
  const itemType = route.params?.itemType || 'habit'; // 'habit' or 'task'

  useEffect(() => {
    loadItems();
  }, [itemType]);

  const loadItems = async () => {
    try {
      const itemsData = itemType === 'habit' ? await getHabits() : await getTasks();
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item) => {
    if (!isSelectionMode) {
      navigation.navigate('HabitTaskDetail', { item });
    }
  };

  const handleAddPress = async (item) => {
    if (isSelectionMode && onItemSelect) {
      try {
        await onItemSelect(item);
        navigation.goBack();
      } catch (error) {
        console.error('Error in handleAddPress:', error);
      }
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
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {isSelectionMode ? `Add ${itemType === 'habit' ? 'Habit' : 'Task'}` : 'Habits & Tasks'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        {isSelectionMode 
          ? `Select a ${itemType} to add to schedule` 
          : 'Build consistent practices and complete tasks'}
      </Text>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleItemPress(item)}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Ionicons name={item.icon} size={24} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.title}</Text>
              </View>
              <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
                {item.description}
              </Text>
              {item.type === 'task' && (
                <Text style={[styles.cardPriority, { color: theme.colors.primary }]}>
                  Priority: {item.priority}
                </Text>
              )}
            </View>

            {isSelectionMode && (
              <View style={styles.addButtonContainer}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddPress(item)}
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
    marginBottom: Layout.spacing.small,
  },
  cardPriority: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  addButtonContainer: {
    marginLeft: Layout.spacing.medium,
    justifyContent: 'center',
  },
  addButton: {
    padding: Layout.spacing.small,
  },
}); 