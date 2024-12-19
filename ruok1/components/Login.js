import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  const handleLogin = async () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      setIsLoading(true);
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log('Logged in with:', response.user.email);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      setIsLoading(true);
      const response = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, 'users', response.user.uid), {
        email: response.user.email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        breathingExercises: [],
        preferences: {
          notifications: true,
          theme: 'light'
        }
      });

      console.log('Account created with:', response.user.email);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.loginContainer}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Welcome to BreathWork
        </Text>
        
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.text
          }]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!isLoading}
        />
        
        <TextInput
          style={[styles.input, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.text
          }]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />
        
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.signUpButton, isLoading && styles.buttonDisabled]} 
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    width: '100%',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.xlarge,
  },
  input: {
    width: '100%',
    height: Layout.minTouchSize,
    borderWidth: 1,
    borderRadius: Layout.borderRadius.medium,
    paddingHorizontal: Layout.spacing.medium,
    marginBottom: Layout.spacing.medium,
    fontFamily: Typography.fonts.regular,
    fontSize: Layout.text.medium,
  },
  button: {
    width: '100%',
    minHeight: Layout.minTouchSize,
    borderRadius: Layout.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Layout.spacing.medium,
  },
  buttonText: {
    fontFamily: Typography.fonts.medium,
    fontSize: Layout.text.large,
    letterSpacing: 0.35,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  signUpButton: {
    backgroundColor: '#34C759',
    marginTop: 10,
  },
}); 