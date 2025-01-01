import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_MARGIN = 10;

const featuredProtocolTitles = ['Recovery Breath', 'Balanced Breath'];

const defaultImages = {
  'Recovery Breath': 'https://images.unsplash.com/photo-1499988921418-b7df40ff03f9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
  'Balanced Breath': 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
};

export default function FeaturedProtocols({ navigation }) {
  const theme = useTheme();
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProtocols();
  }, []);

  const loadFeaturedProtocols = async () => {
    try {
      const protocolsRef = collection(db, 'breathProtocols');
      const q = query(protocolsRef, where('title', 'in', featuredProtocolTitles));
      const snapshot = await getDocs(q);
      
      const protocolsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        image: defaultImages[doc.data().title]
      }));
      
      setProtocols(protocolsData);
    } catch (error) {
      console.error('Error loading featured protocols:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProtocolPress = (protocol) => {
    const breathGuideParams = {
      settings: {
        inhaleTime: protocol.pattern.inhale,
        inhaleHoldTime: protocol.pattern.inHold,
        exhaleTime: protocol.pattern.exhale,
        exhaleHoldTime: protocol.pattern.exHold,
        rounds: protocol.rounds,
        totalTime: parseInt(protocol.duration)
      },
      presetName: protocol.title
    };
    navigation.navigate('BreathGuide', breathGuideParams);
  };

  const handleBreathGuide = () => {
    const defaultSettings = {
      inhaleTime: 4,
      inhaleHoldTime: 4,
      exhaleTime: 4,
      exhaleHoldTime: 4,
      rounds: 3,
      totalTime: 48
    };
    navigation.navigate('BreathGuide', { settings: defaultSettings });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
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