import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import Forum from './Forum';
import Chat from './Chat';

export default function Community() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('Forum');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Forum':
        return <Forum />;
      case 'Chat':
        return <Chat />;
      default:
        return <Forum />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.tabBar, theme?.colors?.background && { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'Forum' && styles.activeTab,
            { borderBottomColor: activeTab === 'Forum' ? theme?.colors?.primary : 'transparent' }
          ]}
          onPress={() => setActiveTab('Forum')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'Forum' ? theme?.colors?.primary : theme?.colors?.textSecondary }
            ]}
          >
            Forum
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'Chat' && styles.activeTab,
            { borderBottomColor: activeTab === 'Chat' ? theme?.colors?.primary : 'transparent' }
          ]}
          onPress={() => setActiveTab('Chat')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'Chat' ? theme?.colors?.primary : theme?.colors?.textSecondary }
            ]}
          >
            Chat
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {renderTabContent()}
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