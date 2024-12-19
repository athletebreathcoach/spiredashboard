import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { auth } from '../config/firebase';
import { updatePassword, sendPasswordResetEmail, signOut } from 'firebase/auth';

export default function Settings({ navigation }) {
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
      console.error(error);
    }
  };

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      Alert.alert(
        'Success',
        'Password reset email sent. Please check your inbox.'
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const sections = [
    {
      title: '',
      items: [
        { 
          icon: 'person-circle-outline', 
          label: 'Account',
          value: auth.currentUser?.email,
          onPress: () => {} 
        },
        { 
          icon: 'key-outline', 
          label: 'Reset Password',
          onPress: handleResetPassword
        },
        { 
          icon: 'log-out-outline', 
          label: 'Logout',
          onPress: handleLogout
        },
      ]
    },
    {
      title: 'PERSONALIZATION',
      items: [
        { 
          icon: 'color-palette-outline', 
          label: 'Theme',
          value: theme.name === 'dark' ? 'Dark' : 'Light',
          onPress: toggleTheme
        },
        { 
          icon: 'notifications-outline', 
          label: 'Notifications',
          onPress: () => {} 
        },
      ]
    },
    {
      title: 'BREATHING',
      items: [
        { 
          icon: 'fitness-outline', 
          label: 'Default Protocol',
          value: 'Box Breathing',
          onPress: () => {} 
        },
        { 
          icon: 'timer-outline', 
          label: 'Session Reminders',
          onPress: () => {} 
        },
        { 
          icon: 'trending-up-outline', 
          label: 'Goals',
          onPress: () => {} 
        },
      ]
    },
    {
      title: 'ABOUT',
      items: [
        { 
          icon: 'information-circle-outline', 
          label: 'Version',
          value: '1.0.0',
          onPress: () => {} 
        },
        { 
          icon: 'shield-checkmark-outline', 
          label: 'Privacy Policy',
          onPress: () => {} 
        },
        { 
          icon: 'document-text-outline', 
          label: 'Terms of Service',
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