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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LungsIcon from './LungsIcon';
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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

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

  const addComment = async (postId) => {
    if (!newComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      const commentsRef = collection(doc(db, 'forum_posts', postId), 'comments');
      await addDoc(commentsRef, {
        text: newComment.trim(),
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        isCoach: isCoach,
        timestamp: serverTimestamp(),
      });

      setNewComment('');
      // Automatically show comments after adding one
      setShowComments(prev => ({
        ...prev,
        [postId]: true
      }));
      await loadPosts(); // Reload to get new comments
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
        <Text style={styles.commentText}>{item.text}</Text>
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
        <Text style={styles.postText}>{item.text}</Text>
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
                style={styles.commentTextInput}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Write a comment..."
                placeholderTextColor="#8E8E93"
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.commentSubmitButton,
                  { opacity: newComment.trim() && !submittingComment ? 1 : 0.5 }
                ]}
                onPress={() => addComment(item.id)}
                disabled={!newComment.trim() || submittingComment}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {item.comments && item.comments.length > 0 ? (
              item.comments.map(comment => (
                <View key={comment.id}>
                  {renderComment({ item: comment, postId: item.id })}
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
    setInputHeight(100);
  };

  const handlePost = async () => {
    await createPost();
    closePostModal();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B5E0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.compactPostInput}
        onPress={openPostModal}
      >
        <View style={styles.compactInputRow}>
          <View style={[
            styles.coachAvatar,
            !isCoach && styles.clientAvatar,
            styles.smallAvatar
          ]}>
            <Text style={styles.coachInitials}>
              {(auth.currentUser.email?.split('@')[0] || 'A').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.placeholderText}>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={closePostModal}
              >
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.postButton,
                  { opacity: newPost.trim() && !submitting ? 1 : 0.5 }
                ]}
                onPress={handlePost}
                disabled={!newPost.trim() || submitting}
              >
                <Text style={styles.postButtonText}>
                  {submitting ? 'Posting...' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.userInfo}>
                <View style={[
                  styles.coachAvatar,
                  !isCoach && styles.clientAvatar
                ]}>
                  <Text style={styles.coachInitials}>
                    {(auth.currentUser.email?.split('@')[0] || 'A').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.userName}>
                  {auth.currentUser.email?.split('@')[0] || 'Anonymous'}
                </Text>
              </View>
              <TextInput
                style={[styles.modalInput, { height: Math.max(100, inputHeight) }]}
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
                autoFocus
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  postFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 5,
  },
  likeCount: {
    color: '#8E8E93',
    fontSize: 14,
  },
  compactPostInput: {
    backgroundColor: '#1C1C1E',
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
    color: '#FFFFFF',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000000',
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
    borderBottomColor: '#2C2C2E',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  modalInput: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  commentContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  commentAuthorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentRole: {
    color: '#8E8E93',
    fontSize: 12,
  },
  commentText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTimestamp: {
    color: '#8E8E93',
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
    color: '#8E8E93',
    fontSize: 14,
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 100,
    minHeight: 40,
  },
  commentSubmitButton: {
    backgroundColor: '#00B5E0',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCommentsText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
}); 