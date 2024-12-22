import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
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
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import Layout from '../constants/Layout';
import Typography from '../constants/Typography';

export default function Forum() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCoach, setIsCoach] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);

  useEffect(() => {
    checkIfCoach();
    loadPosts();
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
      
      const postsData = [];
      for (const doc of snapshot.docs) {
        const postData = doc.data();
        const coachDoc = await getDoc(postData.coachRef);
        const coachData = coachDoc.data();
        
        // Get comments for this post
        const commentsRef = collection(db, 'forum_posts', doc.id, 'comments');
        const commentsQuery = query(commentsRef, orderBy('timestamp', 'desc'));
        const commentsSnapshot = await getDocs(commentsQuery);
        const comments = commentsSnapshot.docs.map(commentDoc => ({
          id: commentDoc.id,
          ...commentDoc.data(),
          timestamp: commentDoc.data().timestamp?.toDate(),
        }));
        
        postsData.push({
          id: doc.id,
          ...postData,
          coachName: coachData.name || coachData.email.split('@')[0],
          timestamp: postData.timestamp?.toDate(),
          comments: comments,
          likes: postData.likes || [],
        });
      }
      
      setPosts(postsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading posts:', error);
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.trim() || !isCoach) return;

    try {
      const postsRef = collection(db, 'forum_posts');
      const coachRef = doc(db, 'coaches', auth.currentUser.uid);
      
      await addDoc(postsRef, {
        text: newPost.trim(),
        coachRef: coachRef,
        timestamp: serverTimestamp(),
      });

      setNewPost('');
      loadPosts(); // Reload posts after creating a new one
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleLike = async (postId) => {
    try {
      const postRef = doc(db, 'forum_posts', postId);
      const postDoc = await getDoc(postRef);
      const likes = postDoc.data().likes || [];
      const userId = auth.currentUser.uid;

      if (likes.includes(userId)) {
        await updateDoc(postRef, {
          likes: arrayRemove(userId)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(userId)
        });
      }

      loadPosts(); // Reload to update likes
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    try {
      const commentsRef = collection(db, 'forum_posts', selectedPost.id, 'comments');
      await addDoc(commentsRef, {
        text: newComment.trim(),
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        timestamp: serverTimestamp(),
      });

      setNewComment('');
      setShowCommentModal(false);
      loadPosts(); // Reload to show new comment
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const formatDate = (date) => {
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
  };

  const renderComment = ({ item }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.commentAuthor}>
        {item.userEmail.split('@')[0]}
      </Text>
      <Text style={styles.commentText}>{item.text}</Text>
      <Text style={styles.commentTime}>
        {formatDate(item.timestamp)}
      </Text>
    </View>
  );

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.coachInfo}>
          <View style={styles.coachAvatar}>
            <Text style={styles.coachInitials}>
              {item.coachName.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.coachName}>{item.coachName}</Text>
        </View>
        <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
      </View>
      <Text style={styles.postText}>{item.text}</Text>
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons 
            name={item.likes?.includes(auth.currentUser.uid) ? "heart" : "heart-outline"} 
            size={24} 
            color={item.likes?.includes(auth.currentUser.uid) ? "#00B5E0" : "#8E8E93"} 
          />
          <Text style={styles.actionText}>
            {item.likes?.length || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            setSelectedPost(item);
            setShowCommentModal(true);
          }}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#8E8E93" />
          <Text style={styles.actionText}>
            {item.comments?.length || 0}
          </Text>
        </TouchableOpacity>
      </View>

      {item.comments?.length > 0 && (
        <View style={styles.commentsSection}>
          {item.comments.slice(0, 2).map(comment => renderComment({ item: comment }))}
          {item.comments.length > 2 && (
            <TouchableOpacity 
              onPress={() => {
                setSelectedPost(item);
                setShowCommentModal(true);
              }}
            >
              <Text style={styles.viewMoreText}>
                View all {item.comments.length} comments
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B5E0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isCoach && (
        <View style={styles.createPostContainer}>
          <TextInput
            style={styles.input}
            value={newPost}
            onChangeText={setNewPost}
            placeholder="Share an update with your clients..."
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.postButton, { opacity: newPost.trim() ? 1 : 0.5 }]}
            onPress={createPost}
            disabled={!newPost.trim()}
          >
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.postsList}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showCommentModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowCommentModal(false);
                  setSelectedPost(null);
                  setNewComment('');
                }}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={selectedPost?.comments || []}
              renderItem={renderComment}
              keyExtractor={item => item.id}
              style={styles.commentsList}
            />

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
                placeholderTextColor="#8E8E93"
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, { opacity: newComment.trim() ? 1 : 0.5 }]}
                onPress={addComment}
                disabled={!newComment.trim()}
              >
                <Ionicons name="send" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  postText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  postActions: {
    flexDirection: 'row',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    color: '#8E8E93',
    fontSize: 14,
    marginLeft: 4,
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  commentContainer: {
    marginVertical: 8,
  },
  commentAuthor: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 4,
  },
  commentTime: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  viewMoreText: {
    color: '#00B5E0',
    fontSize: 14,
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '50%',
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
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  commentsList: {
    padding: 16,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00B5E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 