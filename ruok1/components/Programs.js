import React, { useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

const { width } = Dimensions.get('window');

const programs = [
  {
    id: 1,
    title: 'Beginner Program',
    category: 'Foundation',
    description: 'Start your breathing journey',
    duration: '4 weeks',
    icon: 'leaf-outline',
    color: '#4A90E2',
  },
  {
    id: 2,
    title: 'Performance',
    category: 'Advanced',
    description: 'Enhance athletic performance',
    duration: '8 weeks',
    icon: 'flash-outline',
    color: '#FF9500',
  },
  {
    id: 3,
    title: 'Stress Relief',
    category: 'Wellness',
    description: 'Manage stress and anxiety',
    duration: '6 weeks',
    icon: 'water-outline',
    color: '#FF3B30',
  },
  {
    id: 4,
    title: 'Sleep Better',
    category: 'Recovery',
    description: 'Improve sleep quality',
    duration: '4 weeks',
    icon: 'moon-outline',
    color: '#5856D6',
  },
];

export default function Programs({ navigation }) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const pan = useRef(new Animated.Value(0)).current;
  const tabPosition = useMemo(() => new Animated.Value(0), []);

  const tabs = [
    { id: 'programs', title: 'Programs', icon: 'calendar-outline' },
    { id: 'sessions', title: 'Sessions', icon: 'time-outline' },
    { id: 'sections', title: 'Sections', icon: 'layers-outline' },
  ];

  React.useEffect(() => {
    Animated.timing(tabPosition, {
      toValue: -width * activeTab,
      duration: 0,
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabPosition]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      if (
        (activeTab === 0 && gesture.dx > 0) ||
        (activeTab === 2 && gesture.dx < 0)
      ) {
        return;
      }
      pan.setValue(gesture.dx);
    },
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) > width * 0.2) {
        const newTab = gesture.dx > 0 ? activeTab - 1 : activeTab + 1;
        if (newTab >= 0 && newTab <= 2) {
          Animated.spring(pan, {
            toValue: gesture.dx > 0 ? width : -width,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start(() => {
            pan.setValue(0);
            setActiveTab(newTab);
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      } else {
        Animated.spring(pan, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      }
    },
  });

  const renderProgramCards = () => (
    <ScrollView 
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {programs.map((program) => (
        <TouchableOpacity
          key={program.id}
          style={[styles.card, { backgroundColor: program.color }]}
          onPress={() => navigation.navigate('Program', { screen: 'ProgramDetail', params: { program } })}
        >
          <View style={styles.cardHeader}>
            <Ionicons name={program.icon} size={24} color="#FFFFFF" />
            <Text style={styles.cardTitle}>{program.title}</Text>
          </View>
          <Text style={styles.cardDescription}>{program.description}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardCategory}>#{program.category}</Text>
            <View style={styles.durationContainer}>
              <Ionicons name="time-outline" size={16} color="#FFFFFF" />
              <Text style={styles.duration}>{program.duration}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderSessions = () => (
    <View style={styles.comingSoon}>
      <Ionicons name="time-outline" size={48} color={theme.colors.textSecondary} />
      <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>
        Sessions Coming Soon
      </Text>
    </View>
  );

  const renderSections = () => (
    <View style={styles.comingSoon}>
      <Ionicons name="layers-outline" size={48} color={theme.colors.textSecondary} />
      <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>
        Sections Coming Soon
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === index && styles.activeTab,
              activeTab === index && { borderBottomColor: theme.colors.primary }
            ]}
            onPress={() => setActiveTab(index)}
          >
            <Ionicons
              name={tab.icon}
              size={24}
              color={activeTab === index ? theme.colors.primary : theme.colors.textSecondary}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeTab === index && { color: theme.colors.primary }
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Area */}
      <Animated.View 
        style={[
          styles.content,
          {
            flexDirection: 'row',
            width: width * 3,
            transform: [{ translateX: Animated.add(pan, tabPosition) }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={{ width }}>
          {renderProgramCards()}
        </View>
        <View style={{ width }}>
          {renderSessions()}
        </View>
        <View style={{ width }}>
          {renderSections()}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabText: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.large,
  },
  card: {
    padding: Layout.spacing.large,
    borderRadius: Layout.borderRadius.large,
    marginBottom: Layout.spacing.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  cardTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    color: '#FFFFFF',
    marginLeft: Layout.spacing.medium,
  },
  cardDescription: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    color: '#FFFFFF',
    marginBottom: Layout.spacing.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCategory: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  duration: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    color: '#FFFFFF',
    marginLeft: Layout.spacing.small,
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.large,
  },
  comingSoonText: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    marginTop: Layout.spacing.medium,
  },
}); 