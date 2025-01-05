import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LungsIcon from './LungsIcon';
import { useTheme } from '../theme/ThemeContext';
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
  updateDoc,
  collectionGroup,
  limit,
  startAfter,
} from 'firebase/firestore';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';
import { GiphyFetch } from '@giphy/js-fetch-api';

// Initialize Giphy API
const gf = new GiphyFetch('bjb9eQhsXLSG4kh6h6wlDtImisFJW6lP');

// Debounce helper
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default function Forum() {
  const theme = useTheme();
  const [posts, setPosts] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const POSTS_PER_PAGE = 10;
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inputHeight, setInputHeight] = useState(100);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  // New state for GIF functionality
  const [isGiphyModalVisible, setIsGiphyModalVisible] = useState(false);
  const [giphyResults, setGiphyResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCommentGiphy, setIsCommentGiphy] = useState(false);
  const [activePostId, setActivePostId] = useState(null);
  const [selectedGif, setSelectedGif] = useState(null);
  const [showGifSelector, setShowGifSelector] = useState(false);

  useEffect(() => {
    checkIfCoach();
    loadInitialPosts();
    
    // Set up real-time listener for new posts only
    const postsRef = collection(db, 'forum_posts');
    const q = query(postsRef, orderBy('timestamp', 'desc'), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const newPostDoc = snapshot.docs[0];
        const newPostData = newPostDoc.data();
        const newPost = {
          id: newPostDoc.id,
          ...newPostData,
          timestamp: newPostData.timestamp?.toDate() || new Date()
        };
        
        // Only update if it's actually a new post
        setPosts(prevPosts => {
          if (prevPosts.length === 0 || prevPosts[0].id !== newPost.id) {
            return [newPost, ...prevPosts];
          }
          return prevPosts;
        });
      }
    }, (error) => {
      console.error('Error listening to posts:', error);
    });

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

  const loadInitialPosts = async () => {
    setLoading(true);
    try {
      const postsRef = collection(db, 'forum_posts');
      const q = query(postsRef, orderBy('timestamp', 'desc'), limit(POSTS_PER_PAGE));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const fetchedPosts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          };
        });
        setPosts(fetchedPosts);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMore || !lastVisible) return;
    
    setIsLoadingMore(true);
    try {
      const postsRef = collection(db, 'forum_posts');
      const q = query(
        postsRef,
        orderBy('timestamp', 'desc'),
        startAfter(lastVisible),
        limit(POSTS_PER_PAGE)
      );
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const morePosts = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          };
        });
        setPosts(prevPosts => [...prevPosts, ...morePosts]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
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

  const searchGiphy = async (query) => {
    try {
      const { data } = await gf.search(query, { limit: 20 });
      setGiphyResults(data);
    } catch (error) {
      console.error('Error searching Giphy:', error);
    }
  };

  const handleGiphySelect = (gif) => {
    if (isCommentGiphy && activePostId) {
      // For comments, send the GIF immediately
      addComment(activePostId, gif.images.original.url);
      setIsGiphyModalVisible(false);
      setSearchQuery('');
      setGiphyResults([]);
    } else {
      // For posts, just set the selected GIF
      setSelectedGif(gif.images.original.url);
      setIsGiphyModalVisible(false);
      setSearchQuery('');
      setGiphyResults([]);
    }
  };

  const createPost = async () => {
    if ((!newPost.trim() && !selectedGif) || submitting) return;

    const tempId = Date.now().toString();
    const optimisticPost = {
      id: tempId,
      text: newPost.trim(),
      image: selectedGif,
      isCoachPost: isCoach,
      authorId: auth.currentUser.uid,
      authorName: auth.currentUser.email.split('@')[0],
      timestamp: new Date(),
      likes: []
    };

    try {
      setSubmitting(true);
      setPosts(prevPosts => [optimisticPost, ...prevPosts]);
      setNewPost('');
      setSelectedGif(null);

      const postsRef = collection(db, 'forum_posts');
      await addDoc(postsRef, {
        text: newPost.trim() || null,
        image: selectedGif,
        isCoachPost: isCoach,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        ...(isCoach && {
          coachId: auth.currentUser.uid,
          coachEmail: auth.currentUser.email,
        }),
        timestamp: serverTimestamp(),
      });

      await loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      setPosts(prevPosts => prevPosts.filter(post => post.id !== tempId));
      setNewPost(newPost.trim());
      setSelectedGif(selectedGif);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = useCallback((date) => {
    if (!date) return '';
    
    // Convert Firebase Timestamp to Date if needed
    const dateObj = date instanceof Date ? date : date?.toDate?.();
    if (!dateObj) return '';
    
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return dateObj.toLocaleDateString([], { weekday: 'long' });
    }
    return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
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

  const toggleLike = async (postId) => {
    try {
      const postRef = doc(db, 'forum_posts', postId);
      const postDoc = await getDoc(postRef);
      const currentLikes = postDoc.data().likes || [];
      const userId = auth.currentUser.uid;

      // Optimistically update UI
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          const newLikes = currentLikes.includes(userId)
            ? currentLikes.filter(id => id !== userId)
            : [...currentLikes, userId];
          return { ...post, likes: newLikes };
        }
        return post;
      }));

      // Update in Firestore
      if (currentLikes.includes(userId)) {
        // Unlike
        await updateDoc(postRef, {
          likes: currentLikes.filter(id => id !== userId)
        });
      } else {
        // Like
        await updateDoc(postRef, {
          likes: [...currentLikes, userId]
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // If error occurs, refresh posts to restore correct state
      loadPosts();
    }
  };

  const addComment = async (postId, gifUrl = null) => {
    if ((!newComment.trim() && !gifUrl) || submittingComment) return;

    try {
      setSubmittingComment(true);
      const commentsRef = collection(doc(db, 'forum_posts', postId), 'comments');
      await addDoc(commentsRef, {
        text: newComment.trim() || null,
        image: gifUrl,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        isCoach: isCoach,
        timestamp: serverTimestamp(),
      });

      setNewComment('');
      setSearchQuery('');
      setGiphyResults([]);
      setShowComments(prev => ({
        ...prev,
        [postId]: true
      }));
      await loadPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const deleteComment = async (postId, commentId) => {
    try {
      const commentRef = doc(db, 'forum_posts', postId, 'comments', commentId);
      await deleteDoc(commentRef);
      await loadPosts(); // Reload to update comments
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const loadCommentsForPost = async (postId) => {
    try {
      const commentsRef = collection(db, 'forum_posts', postId, 'comments');
      const commentsQuery = query(commentsRef, orderBy('timestamp', 'desc'));
      const commentsSnapshot = await getDocs(commentsQuery);
      
      const comments = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }));
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, comments } 
            : post
        )
      );
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const toggleComments = async (postId) => {
    // If comments are not loaded yet, load them
    const post = posts.find(p => p.id === postId);
    if (!post.comments && !showComments[postId]) {
      await loadCommentsForPost(postId);
    }
    
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Memoize the comment rendering
  const renderComment = useCallback(({ item, postId }) => {
    return (
      <View style={[styles.commentContainer, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAuthorInfo}>
            <View style={[
              styles.commentAvatar,
              { backgroundColor: item.isCoach ? theme.colors.primary : '#FF9500' }
            ]}>
              <Text style={[styles.commentInitials, { color: theme.colors.text }]}>
                {(item.userEmail?.split('@')[0] || 'A').substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[styles.commentAuthorName, { color: theme.colors.text }]}>
                {item.userEmail?.split('@')[0] || 'Anonymous'}
              </Text>
              <Text style={[styles.commentRole, { color: theme.colors.textSecondary }]}>
                {item.isCoach ? 'Coach' : 'Client'}
              </Text>
            </View>
          </View>
          {item.userId === auth.currentUser.uid && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteComment(postId, item.id)}
            >
              <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
        {item.image && (
          <Image 
            source={{ uri: item.image }} 
            style={[styles.commentGif, { marginVertical: 8 }]} 
            resizeMode="cover"
          />
        )}
        {item.text && (
          <Text style={[styles.commentText, { color: theme.colors.text }]}>
            {item.text}
          </Text>
        )}
        <Text style={[styles.commentTimestamp, { color: theme.colors.textSecondary }]}>
          {formatDate(item.timestamp)}
        </Text>
      </View>
    );
  }, [theme, auth.currentUser.uid, formatDate, deleteComment]);

  // Update the renderPost function to use the new comment system
  const renderPost = useCallback(({ item }) => {
    const isLiked = item.likes?.includes(auth.currentUser.uid);
    const hasComments = item.comments?.length > 0;
    const isCommentsVisible = showComments[item.id];
    
    return (
      <View style={[
        styles.postContainer,
        { backgroundColor: theme.colors.surface },
        item.isCoachPost && [
          styles.coachPostContainer,
          { borderLeftColor: theme.colors.primary }
        ]
      ]}>
        <View style={styles.postHeader}>
          <View style={styles.coachInfo}>
            <View style={[
              styles.coachAvatar,
              !item.isCoachPost && styles.clientAvatar,
              { backgroundColor: item.isCoachPost ? theme.colors.primary : '#FF9500' }
            ]}>
              <Text style={[styles.coachInitials, { color: theme.colors.text }]}>
                {(item.authorName || 'Anonymous').substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[styles.coachName, { color: theme.colors.text }]}>
                {item.authorName || 'Anonymous'}
              </Text>
              <Text style={[styles.roleText, { color: theme.colors.textSecondary }]}>
                {item.isCoachPost ? 'Coach' : 'Client'}
              </Text>
            </View>
          </View>
          <View style={styles.postActions}>
            <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
              {formatDate(item.timestamp)}
            </Text>
            {((isCoach && item.authorId === auth.currentUser.uid) || 
              (!isCoach && item.authorId === auth.currentUser.uid)) && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deletePost(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {item.image && (
          <Image 
            source={{ uri: item.image }} 
            style={styles.postGif}
            resizeMode="cover"
          />
        )}
        {item.text && (
          <Text style={[styles.postText, { color: theme.colors.text }]}>{item.text}</Text>
        )}
        <View style={styles.postFooter}>
          <View style={styles.footerActions}>
            <TouchableOpacity 
              style={styles.likeButton} 
              onPress={() => toggleLike(item.id)}
            >
              <LungsIcon 
                size={24} 
                color={isLiked ? theme.colors.primary : theme.colors.textSecondary} 
              />
              {item.likes?.length > 0 && (
                <Text style={[styles.likeCount, { color: theme.colors.textSecondary }]}>
                  {item.likes.length}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.commentButton}
              onPress={() => toggleComments(item.id)}
            >
              <Ionicons 
                name={hasComments ? "chatbubble" : "chatbubble-outline"} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
              {hasComments && (
                <Text style={[styles.commentCount, { color: theme.colors.textSecondary }]}>
                  {item.comments.length}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {isCommentsVisible && (
          <View style={[styles.commentsSection, { borderTopColor: theme.colors.border }]}>
            <View style={styles.commentInput}>
              <TextInput
                style={[
                  styles.commentTextInput,
                  { 
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text
                  }
                ]}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write a comment..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.commentSubmitButton,
                  { 
                    backgroundColor: theme.colors.primary,
                    opacity: newComment.trim() && !submittingComment ? 1 : 0.5 
                  }
                ]}
                onPress={() => addComment(item.id)}
                disabled={!newComment.trim() || submittingComment}
              >
                <Ionicons name="send" size={20} color={theme.colors.background} />
              </TouchableOpacity>
            </View>
            
            {item.comments ? (
              <FlatList
                data={item.comments}
                renderItem={({ item: comment }) => renderComment({ item: comment, postId: item.id })}
                keyExtractor={comment => comment.id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <Text style={[styles.noCommentsText, { color: theme.colors.textSecondary }]}>
                    No comments yet
                  </Text>
                }
              />
            ) : (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ padding: 16 }} />
            )}
          </View>
        )}
      </View>
    );
  }, [theme, showComments, auth.currentUser.uid, toggleLike, toggleComments, renderComment]);

  const openPostModal = () => {
    setIsModalVisible(true);
  };

  const closePostModal = () => {
    setIsModalVisible(false);
    setNewPost('');
    setSelectedGif(null);
    setInputHeight(100);
  };

  const handlePost = async () => {
    await createPost();
    closePostModal();
  };

  const openGiphyModal = async (isComment = false, postId = null) => {
    console.log('Opening Giphy modal...');
    setSearchQuery('');  // Reset search query
    setGiphyResults([]); // Reset results
    setIsCommentGiphy(isComment);
    setActivePostId(postId);
    setIsGiphyModalVisible(true);
    console.log('isGiphyModalVisible set to true');
    
    // Load trending GIFs immediately
    try {
      const { data } = await gf.trending({ limit: 20 });
      console.log('Loaded trending GIFs:', data.length);
      setGiphyResults(data);
    } catch (error) {
      console.error('Error loading trending GIFs:', error);
    }
  };

  const renderGiphyButton = (isComment = false, postId = null) => {
    return (
      <TouchableOpacity
        style={styles.giphyButton}
        onPress={() => {
          if (isComment) {
            openGiphyModal(isComment, postId);
          } else {
            setShowGifSelector(true);
            loadTrendingGifs();
          }
        }}
      >
        <Ionicons name="images-outline" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    );
  };

  const loadTrendingGifs = async () => {
    try {
      const { data } = await gf.trending({ limit: 20 });
      setGiphyResults(data);
    } catch (error) {
      console.error('Error loading trending GIFs:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity 
        style={[styles.compactPostInput, { backgroundColor: theme.colors.surface }]}
        onPress={openPostModal}
      >
        <View style={styles.compactInputRow}>
          <View style={[
            styles.coachAvatar,
            !isCoach && styles.clientAvatar,
            styles.smallAvatar,
            { backgroundColor: isCoach ? theme.colors.primary : '#FF9500' }
          ]}>
            <Text style={[styles.coachInitials, { color: theme.colors.text }]}>
              {(auth.currentUser.email?.split('@')[0] || 'A').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
            Write something
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closePostModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={closePostModal}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {showGifSelector ? 'Select a GIF' : 'Create Post'}
              </Text>
              <View style={styles.headerActions}>
                {!showGifSelector && (
                  <>
                    {renderGiphyButton(false, null)}
                    <TouchableOpacity
                      style={[
                        styles.postButton,
                        { 
                          backgroundColor: theme.colors.primary,
                          opacity: (newPost.trim() || selectedGif) && !submitting ? 1 : 0.5,
                        }
                      ]}
                      onPress={handlePost}
                      disabled={(!newPost.trim() && !selectedGif) || submitting}
                    >
                      <Text style={[styles.postButtonText, { color: theme.colors.background }]}>
                        {submitting ? 'Posting...' : 'Post'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
                {showGifSelector && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowGifSelector(false)}
                  >
                    <Text style={[styles.postButtonText, { color: theme.colors.text }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.modalBody}>
              {!showGifSelector ? (
                <>
                  <View style={styles.userInfo}>
                    <View style={[
                      styles.coachAvatar,
                      !isCoach && styles.clientAvatar,
                      { backgroundColor: isCoach ? theme.colors.primary : '#FF9500' }
                    ]}>
                      <Text style={[styles.coachInitials, { color: theme.colors.text }]}>
                        {(auth.currentUser.email?.split('@')[0] || 'A').substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.userName, { color: theme.colors.text }]}>
                      {auth.currentUser.email?.split('@')[0] || 'Anonymous'}
                    </Text>
                  </View>
                  {selectedGif && (
                    <View style={styles.selectedGifContainer}>
                      <Image source={{ uri: selectedGif }} style={styles.selectedGif} />
                      <TouchableOpacity
                        style={styles.removeGifButton}
                        onPress={() => setSelectedGif(null)}
                      >
                        <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.postInputContainer}>
                    <TextInput
                      style={[
                        styles.modalInput,
                        { 
                          height: Math.max(100, inputHeight),
                          color: theme.colors.text,
                          flex: 1
                        }
                      ]}
                      value={newPost}
                      onChangeText={handleTextChange}
                      onContentSizeChange={(event) => {
                        setInputHeight(event.nativeEvent.contentSize.height);
                      }}
                      placeholder={isCoach 
                        ? "Share an update with your clients..."
                        : "Share your thoughts..."}
                      placeholderTextColor={theme.colors.textSecondary}
                      multiline
                      maxLength={1000}
                      autoFocus
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.searchContainer}>
                    <TextInput
                      style={[styles.searchInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                      placeholder="Search GIFs..."
                      placeholderTextColor={theme.colors.textSecondary}
                      value={searchQuery}
                      onChangeText={(text) => {
                        setSearchQuery(text);
                        if (text.trim()) {
                          searchGiphy(text);
                        }
                      }}
                    />
                  </View>
                  <FlatList
                    data={giphyResults}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.gifContainer}
                        onPress={() => {
                          setSelectedGif(item.images.original.url);
                          setShowGifSelector(false);
                        }}
                      >
                        <Image
                          source={{ uri: item.images.fixed_height.url }}
                          style={styles.gifImage}
                        />
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.giphyList}
                  />
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isGiphyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsGiphyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsGiphyModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select a GIF
              </Text>
              <View style={styles.headerRight} />
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={[styles.searchInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                placeholder="Search GIFs..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.trim()) {
                    searchGiphy(text);
                  }
                }}
              />
            </View>
            <FlatList
              data={giphyResults}
              keyExtractor={(item) => item.id}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.gifContainer}
                  onPress={() => handleGiphySelect(item)}
                >
                  <Image
                    source={{ uri: item.images.fixed_height.url }}
                    style={styles.gifImage}
                  />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.giphyList}
            />
          </View>
        </View>
      </Modal>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (
          isLoadingMore ? (
            <ActivityIndicator 
              size="small" 
              color={theme.colors.primary}
              style={{ padding: 16 }}
            />
          ) : null
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPostContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  postButton: {
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  postsList: {
    padding: 16,
  },
  postContainer: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  coachInitials: {
    fontSize: 16,
    fontWeight: '600',
  },
  coachName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 14,
    marginRight: 5,
  },
  postText: {
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
  },
  clientAvatar: {
    backgroundColor: '#FF9500',
  },
  roleText: {
    fontSize: 12,
    marginTop: 2,
  },
  postFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 5,
  },
  likeCount: {
    fontSize: 14,
  },
  compactPostInput: {
    borderRadius: 25,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
  },
  compactInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  placeholderText: {
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 16,
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  modalInput: {
    fontSize: 16,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  commentContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentInitials: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentRole: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTimestamp: {
    fontSize: 12,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 5,
  },
  commentCount: {
    fontSize: 14,
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  commentTextInput: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
    fontSize: 14,
    maxHeight: 100,
    minHeight: 40,
  },
  commentSubmitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  giphyButton: {
    padding: 8,
    alignSelf: 'center',
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedGifContainer: {
    marginVertical: 10,
    position: 'relative',
  },
  selectedGif: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeGifButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  postGif: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  commentGif: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 8,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  giphyList: {
    padding: 8,
    flexGrow: 1,
  },
  gifContainer: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    height: 180,
  },
  gifImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  postButton: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  postInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
}); 