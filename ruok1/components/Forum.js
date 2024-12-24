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
        
        // Get comments for this post
        const commentsRef = collection(db, 'forum_posts', document.id, 'comments');
        const commentsQuery = query(commentsRef, orderBy('timestamp', 'desc'));
        const commentsSnapshot = await getDocs(commentsQuery);
        const comments = commentsSnapshot.docs.map(commentDoc => ({
          id: commentDoc.id,
          ...commentDoc.data(),
          timestamp: commentDoc.data().timestamp?.toDate() || new Date(),
        }));
        
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
          timestamp: postData.timestamp?.toDate() || new Date(),
          likes: postData.likes || [],
          comments: comments || []
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

      // Create final posts array with comments included
      const postsData = postsWithCoachIds.map(post => ({
        ...post,
        authorName: post.isCoachPost 
          ? (coachDataMap[post.coachId]?.name || post.authorEmail?.split('@')[0] || 'Unknown Coach')
          : (post.authorEmail?.split('@')[0] || 'Unknown User'),
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
        text: newPost.trim(),
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

  const renderComment = useCallback(({ item, postId }) => {
    const isAuthor = item.userId === auth.currentUser.uid;
    return (
      <View style={styles.commentContainer}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAuthorInfo}>
            <View style={[
              styles.commentAvatar,
              item.isCoach ? styles.coachAvatar : styles.clientAvatar
            ]}>
              <Text style={styles.commentInitials}>
                {(item.userEmail?.split('@')[0] || 'A').substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.commentAuthorName}>
                {item.userEmail?.split('@')[0] || 'Anonymous'}
              </Text>
              <Text style={styles.commentRole}>
                {item.isCoach ? 'Coach' : 'Client'}
              </Text>
            </View>
          </View>
          {isAuthor && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteComment(postId, item.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.commentGif} />
        )}
        {item.text && (
          <Text style={styles.commentText}>{item.text}</Text>
        )}
        <Text style={styles.commentTimestamp}>
          {formatDate(item.timestamp)}
        </Text>
      </View>
    );
  }, [formatDate]);

  const renderPost = useCallback(({ item }) => {
    const isLiked = item.likes?.includes(auth.currentUser.uid);
    const hasComments = item.comments?.length > 0;
    const isCommentsVisible = showComments[item.id];

    return (
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
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.postGif} />
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
                color={isLiked ? "#00B5E0" : "#8E8E93"} 
              />
              {item.likes?.length > 0 && (
                <Text style={styles.likeCount}>{item.likes.length}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.commentButton}
              onPress={() => setShowComments(prev => ({
                ...prev,
                [item.id]: !prev[item.id]
              }))}
            >
              <Ionicons 
                name={hasComments ? "chatbubble" : "chatbubble-outline"} 
                size={20} 
                color="#8E8E93" 
              />
              {hasComments && (
                <Text style={styles.commentCount}>{item.comments.length}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {isCommentsVisible && (
          <View style={styles.commentsSection}>
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
              {renderGiphyButton(true, item.id)}
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
            {item.comments && item.comments.length > 0 ? (
              item.comments.map(comment => (
                <View key={comment.id} style={[styles.commentContainer, { borderBottomColor: theme.colors.border }]}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentAuthorInfo}>
                      <View style={[
                        styles.commentAvatar,
                        { backgroundColor: comment.isCoach ? theme.colors.primary : '#FF9500' }
                      ]}>
                        <Text style={[styles.commentInitials, { color: theme.colors.text }]}>
                          {(comment.userEmail?.split('@')[0] || 'A').substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.commentAuthorName, { color: theme.colors.text }]}>
                          {comment.userEmail?.split('@')[0] || 'Anonymous'}
                        </Text>
                        <Text style={[styles.commentRole, { color: theme.colors.textSecondary }]}>
                          {comment.isCoach ? 'Coach' : 'Client'}
                        </Text>
                      </View>
                    </View>
                    {comment.userId === auth.currentUser.uid && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deleteComment(item.id, comment.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {comment.image && (
                    <Image 
                      source={{ uri: comment.image }} 
                      style={[styles.commentGif, { marginVertical: 8 }]} 
                      resizeMode="cover"
                    />
                  )}
                  {comment.text && (
                    <Text style={[styles.commentText, { color: theme.colors.text }]}>
                      {comment.text}
                    </Text>
                  )}
                  <Text style={[styles.commentTimestamp, { color: theme.colors.textSecondary }]}>
                    {formatDate(comment.timestamp)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noCommentsText}>No comments yet</Text>
            )}
          </View>
        )}
      </View>
    );
  }, [formatDate, isCoach, deletePost, toggleLike, showComments, newComment, submittingComment]);

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

  const openGiphyModal = (isComment = false, postId = null) => {
    setSearchQuery('');  // Reset search query
    setGiphyResults([]); // Reset results
    setIsCommentGiphy(isComment);
    setActivePostId(postId);
    setIsGiphyModalVisible(true);
    // Trigger initial search to show some GIFs
    searchGiphy('trending');
  };

  const renderGiphyButton = (isComment = false, postId = null) => {
    return (
      <TouchableOpacity
        style={styles.giphyButton}
        onPress={() => openGiphyModal(isComment, postId)}
      >
        <Ionicons name="images-outline" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    );
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
                Create Post
              </Text>
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
            </View>
            <View style={styles.modalBody}>
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
              <TextInput
                style={[
                  styles.modalInput,
                  { 
                    height: Math.max(100, inputHeight),
                    color: theme.colors.text
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
              <View style={styles.modalFooter}>
                {renderGiphyButton(false, null)}
              </View>
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
        renderItem={({ item }) => (
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
              <Image source={{ uri: item.image }} style={styles.postGif} />
            )}
            {item.text && (
              <Text style={[styles.postText, { color: theme.colors.text }]}>{item.text}</Text>
            )}
            <View style={[styles.postFooter, { borderTopColor: theme.colors.border }]}>
              <View style={styles.footerActions}>
                <TouchableOpacity 
                  style={styles.likeButton} 
                  onPress={() => toggleLike(item.id)}
                >
                  <LungsIcon 
                    size={24} 
                    color={item.likes?.includes(auth.currentUser.uid) ? theme.colors.primary : theme.colors.textSecondary} 
                  />
                  {item.likes?.length > 0 && (
                    <Text style={[styles.likeCount, { color: theme.colors.textSecondary }]}>
                      {item.likes.length}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.commentButton}
                  onPress={() => setShowComments(prev => ({
                    ...prev,
                    [item.id]: !prev[item.id]
                  }))}
                >
                  <Ionicons 
                    name={item.comments?.length > 0 ? "chatbubble" : "chatbubble-outline"} 
                    size={20} 
                    color={theme.colors.textSecondary} 
                  />
                  {item.comments?.length > 0 && (
                    <Text style={[styles.commentCount, { color: theme.colors.textSecondary }]}>
                      {item.comments.length}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {showComments[item.id] && (
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
                  {renderGiphyButton(true, item.id)}
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
                {item.comments && item.comments.length > 0 ? (
                  item.comments.map(comment => (
                    <View key={comment.id} style={[styles.commentContainer, { borderBottomColor: theme.colors.border }]}>
                      <View style={styles.commentHeader}>
                        <View style={styles.commentAuthorInfo}>
                          <View style={[
                            styles.commentAvatar,
                            { backgroundColor: comment.isCoach ? theme.colors.primary : '#FF9500' }
                          ]}>
                            <Text style={[styles.commentInitials, { color: theme.colors.text }]}>
                              {(comment.userEmail?.split('@')[0] || 'A').substring(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <View>
                            <Text style={[styles.commentAuthorName, { color: theme.colors.text }]}>
                              {comment.userEmail?.split('@')[0] || 'Anonymous'}
                            </Text>
                            <Text style={[styles.commentRole, { color: theme.colors.textSecondary }]}>
                              {comment.isCoach ? 'Coach' : 'Client'}
                            </Text>
                          </View>
                        </View>
                        {comment.userId === auth.currentUser.uid && (
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => deleteComment(item.id, comment.id)}
                          >
                            <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {comment.image && (
                        <Image 
                          source={{ uri: comment.image }} 
                          style={[styles.commentGif, { marginVertical: 8 }]} 
                          resizeMode="cover"
                        />
                      )}
                      {comment.text && (
                        <Text style={[styles.commentText, { color: theme.colors.text }]}>
                          {comment.text}
                        </Text>
                      )}
                      <Text style={[styles.commentTimestamp, { color: theme.colors.textSecondary }]}>
                        {formatDate(comment.timestamp)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.noCommentsText, { color: theme.colors.textSecondary }]}>
                    No comments yet
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
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
    minHeight: 300,
    maxHeight: '80%',
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
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  giphyList: {
    padding: 8,
  },
  gifContainer: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gifImage: {
    width: '100%',
    height: 150,
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
  },
}); 