import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions,
  Alert
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const VIDEO_HEIGHT = width * 9/16; // 16:9 aspect ratio

export default function GuidedSessionDetail({ navigation, route }) {
  const theme = useTheme();
  const { session } = route.params;
  const [playing, setPlaying] = useState(false);

  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      setPlaying(false);
      Alert.alert("Video has finished playing!");
    }
  }, []);

  const getYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeVideoId(session.videoUrl);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
          Guided Session
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.videoContainer}>
          <YoutubePlayer
            height={VIDEO_HEIGHT}
            play={playing}
            videoId={videoId}
            onChangeState={onStateChange}
          />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {session.title}
          </Text>

          <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {session.duration} min
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Duration
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="fitness-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {session.type}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Type
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="speedometer-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {session.intensity}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Intensity
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            About this session
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {session.description}
          </Text>
        </View>
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
    paddingHorizontal: Layout.spacing.medium,
    height: 60,
    marginTop: 40,
  },
  backButton: {
    padding: Layout.spacing.small,
    marginRight: Layout.spacing.small,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: Typography.fonts.semibold,
    textAlign: 'center',
    marginRight: Layout.spacing.xlarge,
  },
  scrollView: {
    flex: 1,
  },
  videoContainer: {
    width: width,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  content: {
    padding: Layout.spacing.large,
  },
  title: {
    fontSize: Layout.text.xlarge,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.large,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: Layout.borderRadius.large,
    padding: Layout.spacing.large,
    marginBottom: Layout.spacing.large,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    marginHorizontal: Layout.spacing.large,
  },
  statValue: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    marginVertical: Layout.spacing.small,
  },
  statLabel: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
  sectionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.bold,
    marginBottom: Layout.spacing.medium,
  },
  description: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    lineHeight: Layout.text.medium * 1.5,
    marginBottom: Layout.spacing.large,
  },
}); 