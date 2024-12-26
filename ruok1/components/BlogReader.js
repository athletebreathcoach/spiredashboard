import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

export default function BlogReader({ route, navigation }) {
  const { blog } = route.params;
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Blog
        </Text>
      </View>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {blog.title}
        </Text>
        <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
          {blog.date} • {blog.readTime}
        </Text>
        <Text style={[styles.body, { color: theme.colors.text }]}>
          {blog.content}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: Layout.spacing.medium,
  },
  headerTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
  },
  content: {
    flex: 1,
    padding: Layout.spacing.large,
  },
  title: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.medium,
  },
  date: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
    marginBottom: Layout.spacing.large,
  },
  body: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    lineHeight: Layout.text.medium * 1.6,
  },
}); 