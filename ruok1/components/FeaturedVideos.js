import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import YoutubePlayer from 'react-native-youtube-iframe';

const { width, height } = Dimensions.get('window');
const VIDEO_WIDTH = width * 0.8;
const VIDEO_MARGIN = 10;

// Helper function to get video ID from YouTube URL
const getYouTubeVideoId = (url) => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : false;
};

const featuredVideos = [
  {
    id: 1,
    title: 'Breath - Five Minutes Can Change Your Life',
    url: 'https://www.youtube.com/watch?v=cBasrVhWpUI'
  },
  {
    id: 2,
    title: 'Breathing Exercises & Techniques',
    url: 'https://www.youtube.com/watch?v=LeUT39JtBBw',
  },
  {
    id: 3,
    title: 'Breathing Exercise for Stress Relief',
    url: 'https://www.youtube.com/watch?v=O6Ny9BsdCD0',
  }
].map(video => ({
  ...video,
  videoId: getYouTubeVideoId(video.url),
  thumbnailUrl: video.customThumbnail || `https://img.youtube.com/vi/${getYouTubeVideoId(video.url)}/hqdefault.jpg`
}));

export default function FeaturedVideos() {
  const theme = useTheme();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playing, setPlaying] = useState(false);

  const handleVideoPress = (video) => {
    setSelectedVideo(video);
    setPlaying(true);
  };

  const onClose = () => {
    setPlaying(false);
    setSelectedVideo(null);
  };

  const onStateChange = useCallback((state) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Featured Videos
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {featuredVideos.map((video) => (
          <TouchableOpacity
            key={video.id}
            style={[styles.videoCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleVideoPress(video)}
          >
            <View style={styles.thumbnailContainer}>
              <Image 
                source={{ uri: video.thumbnailUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <View style={[styles.playButton, { backgroundColor: theme.colors.surface + 'CC' }]}>
                <Ionicons name="play" size={24} color={theme.colors.primary} />
              </View>
            </View>
            <Text 
              style={[styles.videoTitle, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {video.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={!!selectedVideo}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background + 'F5' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text 
                style={[styles.modalTitle, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {selectedVideo?.title}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            {selectedVideo && (
              <View style={styles.playerContainer}>
                <YoutubePlayer
                  height={width * 0.5625}
                  play={playing}
                  videoId={selectedVideo.videoId}
                  onChangeState={onStateChange}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.large,
  },
  sectionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.medium,
    paddingHorizontal: Layout.spacing.large,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.large,
  },
  videoCard: {
    width: VIDEO_WIDTH,
    marginRight: VIDEO_MARGIN,
    borderRadius: Layout.borderRadius.large,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    height: VIDEO_WIDTH * 0.5625, // 16:9 aspect ratio
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    right: Layout.spacing.medium,
    bottom: Layout.spacing.medium,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.regular,
    padding: Layout.spacing.medium,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    borderRadius: Layout.borderRadius.large,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.medium,
    borderBottomWidth: 1,
  },
  modalTitle: {
    flex: 1,
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginRight: Layout.spacing.medium,
  },
  closeButton: {
    padding: Layout.spacing.small,
  },
  playerContainer: {
    width: '100%',
    backgroundColor: '#000',
  },
}); 