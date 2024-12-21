import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { addProgramDayItem, getProgramDayItems } from '../firebase/programs';
import { auth } from '../config/firebase';

export default function ProgramDayEdit({ route, navigation }) {
  const { theme } = useTheme();
  const { program, day, date, type } = route.params;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        if (!program?.id || (!day && !date)) {
          setItems([]);
          return;
        }

        const dayItems = await getProgramDayItems(auth.currentUser.uid, program.id, {
          type: type || 'weekly',
          day: day || null,
          date: date || null
        });
        setItems(dayItems || []);
      } catch (error) {
        console.error('Error loading items:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [program?.id, day, date, type]);

  const categories = [
    {
      id: 'sessions',
      title: 'Sessions',
      icon: 'calendar-outline',
      description: 'Add complete training sessions',
    },
    {
      id: 'sections',
      title: 'Sections',
      icon: 'layers-outline',
      description: 'Add grouped exercises and protocols',
    },
    {
      id: 'breathingTests',
      title: 'Breathing Tests',
      icon: 'fitness-outline',
      description: 'Add breathing assessments',
    },
    {
      id: 'exercises',
      title: 'Exercises',
      icon: 'barbell-outline',
      description: 'Add individual exercises',
    },
    {
      id: 'breathProtocols',
      title: 'Breath Protocols',
      icon: 'pulse-outline',
      description: 'Add breathing protocols',
    },
    {
      id: 'habitsTasks',
      title: 'Habits & Tasks',
      icon: 'checkmark-circle-outline',
      description: 'Add habits and tasks',
    },
    {
      id: 'guidedSessions',
      title: 'Guided Sessions',
      icon: 'play-circle-outline',
      description: 'Add guided workout sessions',
    },
  ];

  const handleCategoryPress = (category) => {
    const screens = {
      sessions: 'Programs',
      sections: 'Programs',
      breathingTests: 'BreathingTests',
      exercises: 'Exercises',
      breathProtocols: 'Breath Protocols',
      habitsTasks: 'HabitsTasks',
      guidedSessions: 'GuidedSessions',
    };

    if (!program?.id || (!day && !date)) {
      console.error('Missing required program or date data');
      return;
    }

    navigation.navigate(screens[category.id], {
      selectionMode: true,
      programId: program.id,
      dayData: {
        type: type || 'weekly',
        day: day || null,
        date: date || null
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {type === 'weekly' ? day : new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Add items to this day
        </Text>
      </View>

      <View style={styles.content}>
        {/* Selected Items Section */}
        {items.length > 0 && (
          <View style={styles.selectedItemsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Selected Items
            </Text>
            <ScrollView style={styles.selectedItems}>
              {items.map((item, index) => (
                <View key={index} style={[styles.selectedItemCard, { backgroundColor: '#2C2C2E' }]}>
                  <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{item.title}</Text>
                  <Text style={[styles.itemType, { color: theme.colors.textSecondary }]}>{item.type}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Add Items
          </Text>
          <ScrollView style={styles.categoriesList}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: '#2C2C2E' }]}
                onPress={() => handleCategoryPress(category)}
              >
                <Ionicons 
                  name={category.icon} 
                  size={24} 
                  color="#00B5E0" 
                  style={styles.categoryIcon}
                />
                <View style={styles.categoryContent}>
                  <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
                    {category.title}
                  </Text>
                  <Text style={[styles.categoryDescription, { color: theme.colors.textSecondary }]}>
                    {category.description}
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={24} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Layout.spacing.large,
  },
  title: {
    fontSize: 28,
    fontFamily: Typography.fonts.bold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.large,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    marginBottom: Layout.spacing.medium,
  },
  selectedItemsSection: {
    maxHeight: '40%',
  },
  selectedItems: {
    marginBottom: Layout.spacing.large,
  },
  selectedItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  itemTitle: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
  },
  itemType: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
  },
  categoriesSection: {
    flex: 1,
  },
  categoriesList: {
    flex: 1,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  categoryIcon: {
    marginRight: Layout.spacing.medium,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 17,
    fontFamily: Typography.fonts.medium,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
  },
}); 