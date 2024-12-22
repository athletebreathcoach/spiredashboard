import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import {
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

// Debounce helper
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default function Forum() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inputHeight, setInputHeight] = useState(100);

  useEffect(() => {
    checkIfCoach();
    
    // Set up real-time listener for posts
    const postsRef = collection(db, 'forum_posts');
    const q = query(postsRef, orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      loadPosts();
    }, (error) => {
      console.error('Error listening to posts:', error);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const checkIfCoach = async () => {
    try {
      const coachDoc = await getDoc(doc(db, 'coaches', auth.currentUser.uid));
      setIsCoach(coachDoc.exists());
    } catch (error) {
      console.error('Error checking coach status:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const postsRef = collection(db, 'forum_posts');
      const q = query(postsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      // First pass: collect all unique coach IDs
      const coachIds = new Set();
      const postsWithCoachIds = [];
      
      for (const document of snapshot.docs) {
        const postData = document.data();
        
        // Extract coachId based on different formats
        let coachId = null;
        let isCoachPost = false;
        
        if (postData.coachId) {
          coachId = postData.coachId;
          isCoachPost = true;
        } else if (postData.coachRef?._key?.path?.segments) {
          coachId = postData.coachRef._key.path.segments.slice(-1)[0];
          isCoachPost = true;
        } else if (postData.isCoach && postData.userId) {
          coachId = postData.userId;
          isCoachPost = true;
        }

        if (isCoachPost && coachId) {
          coachIds.add(coachId);
        }

        postsWithCoachIds.push({
          id: document.id,
          coachId,
          isCoachPost,
          text: postData.text,
          authorEmail: postData.coachEmail || postData.userEmail,
          authorId: coachId || postData.userId,
          timestamp: postData.timestamp,
          likes: postData.likes || []
        });
      }

      // Fetch all coach data in parallel
      const coachPromises = Array.from(coachIds).map(id => 
        getDoc(doc(db, 'coaches', id))
      );
      const coachDocs = await Promise.all(coachPromises);
      
      // Create a map of coach data
      const coachDataMap = {};
      coachDocs.forEach((doc, index) => {
        const id = Array.from(coachIds)[index];
        coachDataMap[id] = doc.exists() ? doc.data() : null;
      });

      // Create final posts array
      const postsData = postsWithCoachIds.map(post => ({
        id: post.id,
        text: post.text,
        isCoachPost: post.isCoachPost,
        authorId: post.authorId,
        authorName: post.isCoachPost 
          ? (coachDataMap[post.coachId]?.name || post.authorEmail?.split('@')[0] || 'Unknown Coach')
          : (post.authorEmail?.split('@')[0] || 'Unknown User'),
        timestamp: post.timestamp?.toDate?.() || new Date(),
        likes: post.likes
      }));
      
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced text change handler
  const debouncedTextChange = useMemo(
    () => debounce((text) => {
      setNewPost(text);
    }, 100),
    []
  );

  const handleTextChange = useCallback((text) => {
    // Update the input value immediately for UI responsiveness
    setNewPost(text);
    // Debounce the actual state update
    debouncedTextChange(text);
  }, [debouncedTextChange]);

  const createPost = async () => {
    if (!newPost.trim() || submitting) return;

    const postText = newPost.trim();
    const tempId = Date.now().toString();
    const optimisticPost = {
      id: tempId,
      text: postText,
      isCoachPost: isCoach,
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.email.split('@')[0],
      timestamp: new Date(),
      likes: []
    };

    try {
      setSubmitting(true);
      // Add optimistic post
      setPosts(prevPosts => [optimisticPost, ...prevPosts]);
      setNewPost('');

      // Actually create the post
      const postsRef = collection(db, 'forum_posts');
      await addDoc(postsRef, {
        text: postText,
        isCoachPost: isCoach,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        ...(isCoach && {
          coachId: auth.currentUser.uid,
          coachEmail: auth.currentUser.email,
        }),
        timestamp: serverTimestamp(),
      });

      // Reload posts quietly in the background
      await loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      // Remove optimistic post on error
      setPosts(prevPosts => prevPosts.filter(post => post.id !== tempId));
      setNewPost(postText); // Restore the post text
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = useCallback((date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }, []);

  const deletePost = async (postId) => {
    try {
      // Optimistically remove the post from the UI
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'forum_posts', postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      // If deletion fails, reload posts to restore state
      loadPosts();
    }
  };

  const renderPost = useCallback(({ item }) => (
    <View style={[
      styles.postContainer,
      item.isCoachPost && styles.coachPostContainer
    ]}>
      <View style={styles.postHeader}>
        <View style={styles.coachInfo}>
          <View style={[
            styles.coachAvatar,
            !item.isCoachPost && styles.clientAvatar
          ]}>
            <Text style={styles.coachInitials}>
              {(item.authorName || 'Anonymous').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.coachName}>{item.authorName || 'Anonymous'}</Text>
            <Text style={styles.roleText}>
              {item.isCoachPost ? 'Coach' : 'Client'}
            </Text>
          </View>
        </View>
        <View style={styles.postActions}>
          <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
          {((isCoach && item.authorId === auth.currentUser.uid) || 
            (!isCoach && item.authorId === auth.currentUser.uid)) && (
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => deletePost(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.postText}>{item.text}</Text>
    </View>
  ), [formatDate, isCoach, deletePost]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B5E0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.createPostContainer}>
        <TextInput
          style={[styles.input, { height: Math.max(100, inputHeight) }]}
          value={newPost}
          onChangeText={handleTextChange}
          onContentSizeChange={(event) => {
            setInputHeight(event.nativeEvent.contentSize.height);
          }}
          placeholder={isCoach 
            ? "Share an update with your clients..."
            : "Share your thoughts..."}
          placeholderTextColor="#8E8E93"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.postButton, 
            { opacity: newPost.trim() && !submitting ? 1 : 0.5 }
          ]}
          onPress={createPost}
          disabled={!newPost.trim() || submitting}
        >
          <Text style={styles.postButtonText}>
            {submitting ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.postsList}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={5}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  createPostContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: '#00B5E0',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  postsList: {
    padding: 16,
  },
  postContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  coachInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00B5E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  coachInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  coachName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    color: '#8E8E93',
    fontSize: 14,
    marginRight: 5,
  },
  postText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteButton: {
    padding: 5,
  },
  coachPostContainer: {
    borderLeftWidth: 3,
    borderLeftColor: '#00B5E0',
  },
  clientAvatar: {
    backgroundColor: '#FF9500',
  },
  roleText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
}); 