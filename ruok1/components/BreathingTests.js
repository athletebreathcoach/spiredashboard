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
    id: 'baseline',
    title: 'Baseline Tests',
    tests: [
      {
        id: 1,
        title: 'CO2 Tolerance',
        category: 'Baseline',
        date: 'Dec 9',
        icon: 'timer-outline',
        color: '#2C2C2E',
      },
      {
        id: 2,
        title: 'O2 Advantage Test',
        category: 'Baseline',
        date: 'Dec 9',
        icon: 'pulse-outline',
        color: '#2C2C2E',
      }
    ]
  },
  {
    id: 'performance',
    title: 'Performance Tests',
    tests: [
      {
        id: 3,
        title: 'Recovery Rate',
        category: 'Performance',
        date: 'Dec 9',
        icon: 'trending-up-outline',
        color: '#FF3B30',
      },
      {
        id: 4,
        title: 'Breath Hold Time',
        category: 'Performance',
        date: 'Dec 9',
        icon: 'stopwatch-outline',
        color: '#5856D6',
      }
    ]
  }
]; 

export default function BreathingTests({ navigation }) {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);

  const handleTestPress = (test) => {
    navigation.navigate('TestDetail', { test });
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
              style={styles.testList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.testListContent}
            >
              {category.tests.map((test) => (
                <TouchableOpacity
                  key={test.id}
                  style={[styles.testItem, { backgroundColor: test.color }]}
                  onPress={() => handleTestPress(test)}
                >
                  <Ionicons 
                    name={test.icon} 
                    size={24} 
                    color="#FFFFFF" 
                    style={styles.testIcon}
                  />
                  <View style={styles.testContent}>
                    <Text style={styles.testTitle}>{test.title}</Text>
                    <View style={styles.testDetails}>
                      <Text style={styles.date}>{test.date}</Text>
                      <Text style={styles.category}>#{test.category}</Text>
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
  testList: {
    flex: 1,
  },
  testListContent: {
    paddingBottom: Layout.spacing.large,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  testIcon: {
    marginRight: 12,
    width: 24,
  },
  testContent: {
    flex: 1,
  },
  testTitle: {
    fontSize: 17,
    color: '#FFFFFF',
    fontFamily: Typography.fonts.regular,
    marginBottom: 4,
  },
  testDetails: {
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