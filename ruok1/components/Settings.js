import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { auth } from '../config/firebase';
import { updatePassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

export default function Settings({ navigation }) {
  const [newPassword, setNewPassword] = useState('');
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

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await updatePassword(auth.currentUser, newPassword);
      Alert.alert('Success', 'Password updated successfully');
      setNewPassword('');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Account Settings
        </Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.text 
          }]}
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleUpdatePassword}
        >
          <Text style={styles.buttonText}>Update Password</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.button, styles.resetButton]}
        onPress={handleResetPassword}
      >
        <Text style={styles.buttonText}>Send Password Reset Email</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={toggleTheme}
      >
        <Text style={styles.buttonText}>
          Switch to {theme.name === 'light' ? 'Dark' : 'Light'} Mode
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  section: {
    marginBottom: Layout.spacing.xlarge,
  },
  sectionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.medium,
    letterSpacing: 0.35,
  },
  input: {
    height: Layout.minTouchSize,
    borderRadius: Layout.borderRadius.small,
    paddingHorizontal: Layout.spacing.medium,
    marginBottom: Layout.spacing.medium,
    fontSize: Layout.text.medium,
    borderWidth: 1,
  },
  button: {
    minHeight: Layout.minTouchSize,
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    alignItems: 'center',
    marginBottom: Layout.spacing.medium,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  resetButton: {
    backgroundColor: '#FF9500',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginTop: Layout.spacing.large,
  },
}); 