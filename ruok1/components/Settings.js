import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { useTheme, THEME_MODES, THEME_VARIANTS } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { auth } from '../config/firebase';
import { updatePassword, sendPasswordResetEmail, signOut } from 'firebase/auth';

export default function Settings({ navigation }) {
  const theme = useTheme();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const isAuthenticated = auth.currentUser != null;

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

  const handleThemeSelect = (mode, variant) => {
    theme.setTheme(mode, variant);
    setShowThemeModal(false);
  };

  const getThemeModeName = (mode) => {
    switch (mode) {
      case THEME_MODES.SYSTEM:
        return 'System';
      case THEME_MODES.LIGHT:
        return 'Light';
      case THEME_MODES.DARK:
        return 'Dark';
      default:
        return mode;
    }
  };

  const getThemeVariantName = (variant) => {
    switch (variant) {
      case THEME_VARIANTS.DEFAULT:
        return 'Default';
      case THEME_VARIANTS.PURPLE:
        return 'Purple';
      case THEME_VARIANTS.FOREST:
        return 'Forest';
      case THEME_VARIANTS.TENNESSEE:
        return 'Tennessee';
      default:
        return variant;
    }
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
          value: `${getThemeVariantName(theme.themeVariant)} - ${getThemeModeName(theme.themeMode)}`,
          onPress: () => setShowThemeModal(true)
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

  const ThemeOption = ({ label, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        { backgroundColor: theme.colors.surface },
        isSelected && { borderColor: theme.colors.primary, borderWidth: 2 }
      ]}
      onPress={onPress}
    >
      <Text style={[styles.themeOptionText, { color: theme.colors.text }]}>{label}</Text>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
      </TouchableOpacity>
      <ScrollView 
        style={styles.scrollView}
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
                    { borderBottomColor: theme.colors.border }
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

      <Modal
        visible={showThemeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Choose Theme</Text>
              <TouchableOpacity
                onPress={() => setShowThemeModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.themeSection}>
                <Text style={[styles.themeSectionTitle, { color: theme.colors.textSecondary }]}>
                  APPEARANCE
                </Text>
                <ThemeOption
                  label="System"
                  isSelected={theme.themeMode === THEME_MODES.SYSTEM}
                  onPress={() => handleThemeSelect(THEME_MODES.SYSTEM, theme.themeVariant)}
                />
                <ThemeOption
                  label="Light"
                  isSelected={theme.themeMode === THEME_MODES.LIGHT}
                  onPress={() => handleThemeSelect(THEME_MODES.LIGHT, theme.themeVariant)}
                />
                <ThemeOption
                  label="Dark"
                  isSelected={theme.themeMode === THEME_MODES.DARK}
                  onPress={() => handleThemeSelect(THEME_MODES.DARK, theme.themeVariant)}
                />
              </View>
              <View style={styles.themeSection}>
                <Text style={[styles.themeSectionTitle, { color: theme.colors.textSecondary }]}>
                  COLOR SCHEME
                </Text>
                <ThemeOption
                  label="Default"
                  isSelected={theme.themeVariant === THEME_VARIANTS.DEFAULT}
                  onPress={() => handleThemeSelect(theme.themeMode, THEME_VARIANTS.DEFAULT)}
                />
                <ThemeOption
                  label="Purple"
                  isSelected={theme.themeVariant === THEME_VARIANTS.PURPLE}
                  onPress={() => handleThemeSelect(theme.themeMode, THEME_VARIANTS.PURPLE)}
                />
                <ThemeOption
                  label="Forest"
                  isSelected={theme.themeVariant === THEME_VARIANTS.FOREST}
                  onPress={() => handleThemeSelect(theme.themeMode, THEME_VARIANTS.FOREST)}
                />
                <ThemeOption
                  label="Tennessee"
                  isSelected={theme.themeVariant === THEME_VARIANTS.TENNESSEE}
                  onPress={() => handleThemeSelect(theme.themeMode, THEME_VARIANTS.TENNESSEE)}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Layout.borderRadius.large,
    borderTopRightRadius: Layout.borderRadius.large,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.large,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
  },
  closeButton: {
    padding: Layout.spacing.small,
  },
  modalBody: {
    padding: Layout.spacing.large,
  },
  themeSection: {
    marginBottom: Layout.spacing.large,
  },
  themeSectionTitle: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.medium,
  },
  themeOptions: {
    gap: Layout.spacing.small,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginBottom: Layout.spacing.small,
  },
  themeOptionText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
  },
}); 