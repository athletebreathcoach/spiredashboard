import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_MARGIN = 10;

const protocols = [
  {
    id: 1,
    title: 'Box Breathing',
    description: 'Equal inhale, hold, exhale, and hold pattern',
    image: 'https://images.unsplash.com/photo-1516528387618-afa90b13e000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 2,
    title: 'Recovery Breathing',
    description: 'Slow, deep breaths for stress relief',
    image: 'https://images.unsplash.com/photo-1499988921418-b7df40ff03f9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: 3,
    title: 'Balanced Breath',
    description: 'Harmonious inhale and exhale cycle',
    image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
  }
];

export default function FeaturedProtocols({ navigation }) {
  const theme = useTheme();

  const handleProtocolPress = (protocol) => {
    // To be implemented later
    console.log('Protocol pressed:', protocol.title);
  };

  const handleBreathGuide = () => {
    navigation.navigate('BreathGuide');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Featured Protocols
        </Text>
        <TouchableOpacity 
          style={[styles.breathGuideButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleBreathGuide}
        >
          <Ionicons name="pulse" size={20} color={theme.colors.background} style={styles.buttonIcon} />
          <Text style={[styles.breathGuideText, { color: theme.colors.background }]}>
            Breath Guide
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {protocols.map((protocol) => (
          <TouchableOpacity
            key={protocol.id}
            style={[styles.protocolCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleProtocolPress(protocol)}
          >
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: protocol.image }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={[styles.iconOverlay, { backgroundColor: theme.colors.surface + 'CC' }]}>
                <Ionicons name="pulse" size={24} color={theme.colors.primary} />
              </View>
            </View>
            <View style={styles.textContainer}>
              <Text 
                style={[styles.protocolTitle, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {protocol.title}
              </Text>
              <Text 
                style={[styles.protocolDescription, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {protocol.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.large,
  },
  headerContainer: {
    paddingHorizontal: Layout.spacing.large,
    marginBottom: Layout.spacing.medium,
  },
  sectionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.small,
  },
  breathGuideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.medium,
    borderRadius: Layout.borderRadius.medium,
    marginTop: Layout.spacing.small,
  },
  buttonIcon: {
    marginRight: Layout.spacing.small,
  },
  breathGuideText: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.large,
  },
  protocolCard: {
    width: CARD_WIDTH,
    marginRight: CARD_MARGIN,
    borderRadius: Layout.borderRadius.large,
    overflow: 'hidden',
  },
  imageContainer: {
    height: CARD_WIDTH * 0.5625, // 16:9 aspect ratio
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  iconOverlay: {
    position: 'absolute',
    right: Layout.spacing.medium,
    bottom: Layout.spacing.medium,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    padding: Layout.spacing.medium,
  },
  protocolTitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.small,
  },
  protocolDescription: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
    lineHeight: Layout.text.small * 1.4,
  },
}); 