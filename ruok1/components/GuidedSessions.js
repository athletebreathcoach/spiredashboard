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
    id: 'relaxation',
    title: 'Relaxation',
    sessions: [
      {
        id: 1,
        title: 'Box Breathing',
        category: 'Relaxation',
        date: 'Dec 9',
        icon: 'square-outline',
        color: '#2C2C2E',
      },
      {
        id: 2,
        title: 'Deep Calm',
        category: 'Relaxation',
        date: 'Dec 9',
        icon: 'water-outline',
        color: '#2C2C2E',
      }
    ]
  },
  {
    id: 'performance',
    title: 'Performance',
    sessions: [
      {
        id: 3,
        title: 'Pre-Workout',
        category: 'Performance',
        date: 'Dec 9',
        icon: 'flame-outline',
        color: '#FF3B30',
      },
      {
        id: 4,
        title: 'Recovery',
        category: 'Performance',
        date: 'Dec 9',
        icon: 'refresh-outline',
        color: '#5856D6',
      }
    ]
  }
]; 

export default function GuidedSessions({ navigation }) {
  const { theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(0);

  const handleSessionPress = (session) => {
    navigation.navigate('SessionDetail', { session });
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
              style={styles.sessionList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sessionListContent}
            >
              {category.sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sessionItem, { backgroundColor: session.color }]}
                  onPress={() => handleSessionPress(session)}
                >
                  <Ionicons 
                    name={session.icon} 
                    size={24} 
                    color="#FFFFFF" 
                    style={styles.sessionIcon}
                  />
                  <View style={styles.sessionContent}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    <View style={styles.sessionDetails}>
                      <Text style={styles.date}>{session.date}</Text>
                      <Text style={styles.category}>#{session.category}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={24} color="#00B5E0" />
                <Text style={[styles.addButtonText, { color: '#00B5E0' }]}>
                  Add {category.title} Session
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
  sessionList: {
    flex: 1,
  },
  sessionListContent: {
    paddingBottom: Layout.spacing.large,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  sessionIcon: {
    marginRight: 12,
    width: 24,
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 17,
    color: '#FFFFFF',
    fontFamily: Typography.fonts.regular,
    marginBottom: 4,
  },
  sessionDetails: {
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