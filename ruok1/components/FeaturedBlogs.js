import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_MARGIN = 10;

// Recent blogs from athletebreathcoaching.com/blog/
const blogs = [
  {
    id: 1,
    title: 'Box Breathing',
    excerpt: 'Box breathing may be one of the most discussed types of breath work, but what exactly is it? Box breathing is simply a designated breathing...',
    date: 'February 2, 2021',
    readTime: '1 min read',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    content: `Box breathing may be one of the most discussed types of breath work, but what exactly is it? Box breathing is simply a designated breathing pattern that follows a square. Inhale for a count, hold for the same count, exhale for the same count, and hold for the same count. The most common count is 4 seconds for each portion making the entire cycle 16 seconds long.

Box breathing is a great way to calm down and focus. It is used by Navy SEALs, first responders, and athletes to manage stress and anxiety. The equal counts help to balance the autonomic nervous system and bring you into a state of calm alertness.

The key to box breathing is to keep the counts equal and to breathe smoothly without forcing or straining. Start with a count that is comfortable for you, even if it's just 2 or 3 seconds, and gradually work your way up to longer counts as your breathing capacity improves.`
  },
  {
    id: 2,
    title: 'Just 5:00!!!',
    excerpt: 'I am amazed every time I do this with one of my athletes. This week I coached four different athletes through a breathing session to...',
    date: 'October 22, 2021',
    readTime: '1 min read',
    image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    content: `I am amazed every time I do this with one of my athletes. This week I coached four different athletes through a breathing session to help them recover from their workouts. Each one of them was able to get their heart rate down to resting levels in just 5:00!

The key is to focus on the exhale and to make it longer than the inhale. This activates the parasympathetic nervous system, which is responsible for rest and recovery. By extending the exhale, we can quickly bring down heart rate and begin the recovery process.

This simple technique can be used after any workout, competition, or stressful situation to help your body recover and prepare for the next challenge.`
  },
  {
    id: 3,
    title: 'The Easiest Breath Practice to Boost Fitness',
    excerpt: 'One of the easiest ways to increase your overall fitness is by making yourself accustomed to a slight hunger for more air. There are many...',
    date: 'November 15, 2021',
    readTime: '1 min read',
    image: 'https://images.unsplash.com/photo-1499988921418-b7df40ff03f9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    content: `One of the easiest ways to increase your overall fitness is by making yourself accustomed to a slight hunger for more air. There are many ways to do this but the easiest is to simply breathe through your nose during exercise.

Nasal breathing creates a natural resistance to airflow, which helps to strengthen the respiratory muscles and improve oxygen uptake. It also helps to filter, warm, and humidify the air before it reaches your lungs.

Start by incorporating nasal breathing into your warm-ups and cool-downs, then gradually work your way up to using it during your workouts. You may need to reduce the intensity at first, but as your breathing capacity improves, you'll be able to maintain your normal workout intensity while breathing through your nose.`
  },
  {
    id: 4,
    title: 'The Easy Way to Conquer Flexibility with Mobility',
    excerpt: 'Last post we discussed why mobility trumps flexibility for athletic performance. All sports demand that you be strong at your end ranges of motion...',
    date: 'October 12, 2021',
    readTime: '1 min read',
    image: 'https://images.unsplash.com/photo-1516528387618-afa90b13e000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    content: `Last post we discussed why mobility trumps flexibility for athletic performance. All sports demand that you be strong at your end ranges of motion. It is not enough to simply be able to get into a position.

The key to developing mobility is to combine breathing with movement. By focusing on your breath while moving through ranges of motion, you can help your nervous system feel safe in these positions and develop the strength and control needed for athletic performance.

Practice moving slowly and smoothly through your ranges of motion while maintaining steady, controlled breathing. This will help you develop true mobility that translates to better performance in your sport.`
  },
  {
    id: 5,
    title: 'Inherited Breathing for Performance (Nature)',
    excerpt: 'Recently I had an eye-opening, well really a nose-opening, experience. For years I\'ve practiced nasal breathing, even during exercise...',
    date: 'January 10, 2023',
    readTime: '2 min read',
    image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    content: `Recently I had an eye-opening, well really a nose-opening, experience. For years I've practiced nasal breathing, even during exercise. However, I never tried any devices or techniques to specifically open my nasal passages.

After experimenting with different nasal breathing techniques and devices, I discovered that some people naturally have wider nasal passages that make nasal breathing during exercise easier. This genetic advantage can be significant, but it doesn't mean those with narrower passages can't improve their nasal breathing capacity.

Through consistent practice and proper technique, anyone can improve their nasal breathing ability and experience the benefits of this natural breathing pattern. The key is to start gradually and be patient with the process as your body adapts to this new way of breathing.`
  }
];

export default function FeaturedBlogs() {
  const theme = useTheme();
  const navigation = useNavigation();

  const handleBlogPress = (blog) => {
    navigation.navigate('BlogReader', { blog });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Recent Blogs
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {blogs.map((blog) => (
          <TouchableOpacity
            key={blog.id}
            style={[styles.blogCard, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleBlogPress(blog)}
          >
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: blog.image }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={[styles.readTimeContainer, { backgroundColor: theme.colors.surface + 'CC' }]}>
                <Ionicons name="time-outline" size={14} color={theme.colors.primary} />
                <Text style={[styles.readTime, { color: theme.colors.primary }]}>
                  {blog.readTime}
                </Text>
              </View>
            </View>
            <View style={styles.textContainer}>
              <Text 
                style={[styles.blogTitle, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {blog.title}
              </Text>
              <Text 
                style={[styles.blogExcerpt, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {blog.excerpt}
              </Text>
              <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
                {blog.date}
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
  sectionTitle: {
    fontSize: Layout.text.large,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.medium,
    paddingHorizontal: Layout.spacing.large,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.large,
  },
  blogCard: {
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
  readTimeContainer: {
    position: 'absolute',
    right: Layout.spacing.medium,
    bottom: Layout.spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.small,
    paddingHorizontal: Layout.spacing.medium,
    borderRadius: 20,
  },
  readTime: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.medium,
    marginLeft: Layout.spacing.small,
  },
  textContainer: {
    padding: Layout.spacing.medium,
  },
  blogTitle: {
    fontSize: Layout.text.medium,
    fontFamily: Typography.fonts.medium,
    marginBottom: Layout.spacing.small,
  },
  blogExcerpt: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
    lineHeight: Layout.text.small * 1.4,
    marginBottom: Layout.spacing.small,
  },
  date: {
    fontSize: Layout.text.small,
    fontFamily: Typography.fonts.regular,
  },
}); 