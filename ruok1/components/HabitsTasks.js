import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width;

const categories = [
  {
    id: 'daily',
    title: 'Daily Habits',
    items: [
      {
        id: 1,
        title: 'Morning Breath Work',
        category: 'Daily',
        date: 'Dec 9',
        icon: 'sunny-outline',
        color: '#2C2C2E',
      },
      {
        id: 2,
        title: 'Evening Wind Down',
        category: 'Daily',
        date: 'Dec 9',
        icon: 'moon-outline',
        color: '#2C2C2E',
      }
    ]
  },
  {
    id: 'weekly',
    title: 'Weekly Goals',
    items: [
      {
        id: 3,
        title: 'Breath Testing',
        category: 'Weekly',
        date: 'Dec 9',
        icon: 'checkmark-circle-outline',
        color: '#FF3B30',
      },
      {
        id: 4,
        title: 'Progress Review',
        category: 'Weekly',
        date: 'Dec 9',
        icon: 'analytics-outline',
        color: '#5856D6',
      }
    ]
  }
]; 

export default function HabitsTasks({ navigation }) {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);

  const handleItemPress = (item) => {
    navigation.navigate('TaskDetail', { item });
  };

  const handleScroll = (event) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentPage(page);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        horizontal
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={COLUMN_WIDTH}
        snapToAlignment="center"
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {categories.map((category) => (
          <View key={category.id} style={styles.column}>
            <Text style={styles.columnTitle}>{category.title}</Text>
            
            <ScrollView 
              style={styles.itemList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.itemListContent}
            >
              {category.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, { backgroundColor: item.color }]}
                  onPress={() => handleItemPress(item)}
                >
                  <Ionicons 
                    name={item.icon} 
                    size={24} 
                    color="#00B5E0" 
                    style={styles.itemIcon}
                  />
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <View style={styles.itemDetails}>
                      <Text style={styles.date}>{item.date}</Text>
                      <Text style={styles.category}>#{item.category}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={24} color="#00B5E0" />
                <Text style={[styles.addButtonText, { color: '#00B5E0' }]}>
                  Add {category.title}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pageIndicator}>
        {categories.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: currentPage === index ? '#00B5E0' : '#48484A',
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  horizontalScroll: {
    flex: 1,
  },
  column: {
    width: COLUMN_WIDTH,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  columnTitle: {
    fontSize: 28,
    fontFamily: Typography.fonts.semibold,
    color: '#FFFFFF',
    marginVertical: 20,
  },
  itemList: {
    flex: 1,
  },
  itemListContent: {
    paddingBottom: Layout.spacing.large,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemIcon: {
    marginRight: 12,
    width: 24,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    color: '#FFFFFF',
    fontFamily: Typography.fonts.regular,
    marginBottom: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 15,
    color: '#FFFFFF',
    marginRight: 8,
    fontFamily: Typography.fonts.regular,
  },
  category: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.8,
    fontFamily: Typography.fonts.regular,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  addButtonText: {
    fontSize: 17,
    marginLeft: 8,
    fontFamily: Typography.fonts.regular,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(28, 28, 30, 0.7)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
}); 