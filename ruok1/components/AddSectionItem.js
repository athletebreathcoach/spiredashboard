import React, { useState } from 'react';
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

const categories = [
  {
    title: 'Breathing Tests',
    icon: 'fitness-outline',
    items: [
      { id: 'bt1', title: 'CO2 Tolerance Test', duration: '5 min' },
      { id: 'bt2', title: 'O2 Advantage Test', duration: '5 min' },
    ]
  },
  {
    title: 'Exercises',
    icon: 'barbell-outline',
    items: [
      { id: 'ex1', title: 'Running', duration: '20 min' },
      { id: 'ex2', title: 'Air Squats', duration: '10 min' },
    ]
  },
  {
    title: 'Breathing Protocols',
    icon: 'pulse-outline',
    items: [
      { id: 'bp1', title: 'Box Breathing', duration: '10 min' },
      { id: 'bp2', title: 'Recovery Protocol', duration: '15 min' },
    ]
  }
];

export default function AddSectionItem({ navigation, route }) {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleSelectItem = (item) => {
    // Add the item to the section and go back
    if (route.params?.onAddItem) {
      route.params.onAddItem({
        ...item,
        type: selectedCategory.title,
        icon: selectedCategory.icon
      });
    }
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {!selectedCategory ? (
        // Show categories
        <ScrollView>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.title}
              style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => setSelectedCategory(category)}
            >
              <Ionicons name={category.icon} size={24} color={theme.colors.primary} />
              <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
                {category.title}
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        // Show items for selected category
        <View>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => setSelectedCategory(null)}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
            <Text style={[styles.backButtonText, { color: theme.colors.text }]}>
              Back to Categories
            </Text>
          </TouchableOpacity>
          <ScrollView>
            {selectedCategory.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => handleSelectItem(item)}
              >
                <View style={styles.itemContent}>
                  <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.itemDescription, { color: theme.colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
                <Ionicons 
                  name="add-circle-outline" 
                  size={24} 
                  color={theme.colors.primary} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
    marginLeft: Layout.spacing.medium,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.large,
  },
  backButtonText: {
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
    marginLeft: Layout.spacing.small,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontFamily: Typography.fonts.regular,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 15,
    fontFamily: Typography.fonts.regular,
  },
}); 