import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { auth } from '../config/firebase';
import { updatePassword, sendPasswordResetEmail, signOut, signInWithEmailAndPassword } from 'firebase/auth';

export default function Settings({ navigation }) {
  const theme = useTheme();
  const isAuthenticated = auth.currentUser != null;

  // Default colors to use when theme isn't ready
  const defaultColors = {
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    primary: '#00B5E0'
  };

  // Use theme colors if available, otherwise fall back to defaults
  const colors = {
    background: theme?.colors?.background || defaultColors.background,
    surface: theme?.colors?.surface || defaultColors.surface,
    text: theme?.colors?.text || defaultColors.text,
    textSecondary: theme?.colors?.textSecondary || defaultColors.textSecondary,
    primary: theme?.colors?.primary || defaultColors.primary
  };

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

  const handleLogin = () => {
    navigation.navigate('Login', { fromSettings: true });
  };

  const sections = [
    {
      title: '',
      items: isAuthenticated ? [
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
      ] : [
        {
          icon: 'log-in-outline',
          label: 'Sign In',
          onPress: handleLogin
        }
      ]
    },
    {
      title: 'PERSONALIZATION',
      items: [
        { 
          icon: 'color-palette-outline', 
          label: 'Theme',
          value: theme?.name === 'dark' ? 'Dark' : 'Light',
          onPress: theme?.toggleTheme
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={28} color={colors.primary} />
      </TouchableOpacity>
      <ScrollView 
        style={styles.scrollView}
        contentInsetAdjustmentBehavior="automatic"
      >
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            {section.title && (
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>
                {section.title}
              </Text>
            )}
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
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
                      color={colors.primary}
                      style={styles.itemIcon} 
                    />
                    <Text style={[styles.itemLabel, { color: colors.text }]}>
                      {item.label}
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    {item.value && (
                      <Text style={[styles.itemValue, { color: colors.textSecondary }]}>
                        {item.value}
                      </Text>
                    )}
                    <Ionicons 
                      name="chevron-forward" 
                      size={20} 
                      color={colors.textSecondary}
                      style={styles.chevron}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: Layout.spacing.medium,
    marginTop: Layout.spacing.small,
  },
  scrollView: {
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
    fontSize: Layout.text.medium,
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
    marginLeft: Layout.spacing.small,
  },
}); 