import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import Forum from './Forum';

export default function Community() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.tabBar, theme?.colors?.background && { backgroundColor: theme.colors.background }]}>
        <View style={[styles.tab, styles.activeTab, { borderBottomColor: theme?.colors?.primary }]}>
          <Text style={[styles.tabText, { color: theme?.colors?.primary }]}>
            Forum
          </Text>
        </View>
      </View>
      <View style={styles.content}>
        <Forum />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  content: {
    flex: 1,
  },
}); 