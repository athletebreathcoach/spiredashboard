import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

export default function Settings({ navigation }) {
  const { theme } = useTheme();

  const sections = [
    {
      title: '',
      items: [
        { 
          icon: 'person-circle-outline', 
          label: 'Account',
          onPress: () => {} 
        },
        { 
          icon: 'settings-outline', 
          label: 'General',
          onPress: () => {} 
        },
        { 
          icon: 'calendar-outline', 
          label: 'Calendar',
          onPress: () => {} 
        },
      ]
    },
    {
      title: 'PERSONALIZATION',
      items: [
        { 
          icon: 'color-palette-outline', 
          label: 'Theme',
          value: 'Dark',
          onPress: () => {} 
        },
        { 
          icon: 'apps-outline', 
          label: 'App Icon',
          value: 'Default',
          onPress: () => {} 
        },
        { 
          icon: 'menu-outline', 
          label: 'Navigation',
          onPress: () => {} 
        },
        { 
          icon: 'add-circle-outline', 
          label: 'Quick Add',
          onPress: () => {} 
        },
      ]
    },
    {
      title: 'PRODUCTIVITY',
      items: [
        { 
          icon: 'trending-up-outline', 
          label: 'Productivity',
          onPress: () => {} 
        },
        { 
          icon: 'alarm-outline', 
          label: 'Reminders',
          onPress: () => {} 
        },
        { 
          icon: 'notifications-outline', 
          label: 'Notifications',
          onPress: () => {} 
        },
      ]
    }
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      {sections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          {section.title && (
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              {section.title}
            </Text>
          )}
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.item,
                  itemIndex < section.items.length - 1 && styles.itemBorder,
                  { borderBottomColor: 'rgba(255,255,255,0.1)' }
                ]}
                onPress={item.onPress}
              >
                <View style={styles.itemLeft}>
                  <Ionicons 
                    name={item.icon} 
                    size={22} 
                    color={theme.colors.primary}
                    style={styles.itemIcon} 
                  />
                  <Text style={[styles.itemLabel, { color: theme.colors.text }]}>
                    {item.label}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  {item.value && (
                    <Text style={[styles.itemValue, { color: theme.colors.textSecondary }]}>
                      {item.value}
                    </Text>
                  )}
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={theme.colors.textSecondary}
                    style={styles.chevron}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: Layout.spacing.medium,
    paddingHorizontal: Layout.spacing.medium,
  },
  sectionTitle: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.small,
    marginLeft: Layout.spacing.small,
  },
  card: {
    borderRadius: Layout.borderRadius.large,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.medium,
    paddingHorizontal: Layout.spacing.large,
  },
  itemBorder: {
    borderBottomWidth: 0.5,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: Layout.spacing.medium,
  },
  itemLabel: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.regular,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemValue: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    marginRight: Layout.spacing.small,
  },
  chevron: {
    marginLeft: Layout.spacing.tiny,
  }
}); 