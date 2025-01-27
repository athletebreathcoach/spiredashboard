'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter,
  serverTimestamp,
  addDoc,
  doc,
  getDoc,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { 
  UserCircleIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  StarIcon
} from '@heroicons/react/24/solid';
import Image from 'next/image';

interface ForumPost {
  id: string;
  text: string | null;
  image?: string;
  isCoachPost: boolean;
  userId: string;
  userEmail: string;
  authorName: string;
  authorId: string;
  channel: string;
  timestamp: Date;
  likes: string[];
  isPinned?: boolean;
  comments?: ForumComment[];
}

interface ForumComment {
  id: string;
  text: string;
  image?: string;
  userId: string;
  userEmail: string;
  authorName: string;
  timestamp: Date;
}

const POSTS_PER_PAGE = 10;

export default function Forums() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCoach, setIsCoach] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState('All');
  const [channels] = useState(['All', 'Training', 'Announcements']);
  const [showComments, setShowComments] = useState<{[key: string]: boolean}>({});
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkIfCoach();
    loadInitialPosts();

    // Set up real-time listener for new posts
    const postsRef = collection(db, 'forum_posts');
    const q = query(postsRef, orderBy('timestamp', 'desc'), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const newPostDoc = snapshot.docs[0];
        const newPostData = newPostDoc.data();
        const newPost: ForumPost = {
          id: newPostDoc.id,
          text: newPostData.text,
          image: newPostData.image,
          isCoachPost: newPostData.isCoachPost,
          userId: newPostData.userId,
          userEmail: newPostData.userEmail,
          authorName: newPostData.authorName,
          authorId: newPostData.authorId,
          channel: newPostData.channel,
          timestamp: newPostData.timestamp?.toDate() || new Date(),
          likes: newPostData.likes || [],
          isPinned: newPostData.isPinned,
          comments: []
        };
        
        setPosts(prevPosts => {
          if (prevPosts.length === 0 || prevPosts[0].id !== newPost.id) {
            return [newPost, ...prevPosts];
          }
          return prevPosts;
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const checkIfCoach = async () => {
    if (!user) return;
    try {
      const coachDoc = await getDoc(doc(db, 'coaches', user.uid));
      setIsCoach(coachDoc.exists());
    } catch (error) {
      console.error('Error checking coach status:', error);
    }
  };

  const loadInitialPosts = async () => {
    setLoading(true);
    try {
      const postsRef = collection(db, 'forum_posts');
      let q;
      
      if (selectedChannel === 'All') {
        q = query(postsRef, orderBy('timestamp', 'desc'), limit(POSTS_PER_PAGE));
      } else {
        q = query(
          postsRef,
          where('channel', '==', selectedChannel),
          orderBy('timestamp', 'desc'),
          limit(POSTS_PER_PAGE)
        );
      }
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const fetchedPosts = await Promise.all(snapshot.docs.map(async doc => {
          const data = doc.data();
          // Load comments for each post
          const commentsRef = collection(db, 'forum_posts', doc.id, 'comments');
          const commentsSnapshot = await getDocs(query(commentsRef, orderBy('timestamp', 'desc')));
          const comments: ForumComment[] = commentsSnapshot.docs.map(commentDoc => {
            const commentData = commentDoc.data();
            return {
              id: commentDoc.id,
              text: commentData.text,
              image: commentData.image,
              userId: commentData.userId,
              userEmail: commentData.userEmail,
              authorName: commentData.authorName,
              timestamp: commentData.timestamp?.toDate() || new Date()
            };
          });
          
          const post: ForumPost = {
            id: doc.id,
            text: data.text,
            image: data.image,
            isCoachPost: data.isCoachPost,
            userId: data.userId,
            userEmail: data.userEmail,
            authorName: data.authorName,
            authorId: data.authorId,
            channel: data.channel,
            timestamp: data.timestamp?.toDate() || new Date(),
            likes: data.likes || [],
            isPinned: data.isPinned,
            comments
          };
          
          return post;
        }));
        setPosts(fetchedPosts);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setPosts([]);
        setLastVisible(null);
      }
      setHasMore(true);
    } catch (error) {
      console.error('Error loading posts:', error);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!hasMore || !lastVisible) return;
    
    try {
      const postsRef = collection(db, 'forum_posts');
      let q;
      
      if (selectedChannel === 'All') {
        q = query(
          postsRef,
          orderBy('timestamp', 'desc'),
          startAfter(lastVisible),
          limit(POSTS_PER_PAGE)
        );
      } else {
        q = query(
          postsRef,
          where('channel', '==', selectedChannel),
          orderBy('timestamp', 'desc'),
          startAfter(lastVisible),
          limit(POSTS_PER_PAGE)
        );
      }
      
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const morePosts = await Promise.all(snapshot.docs.map(async doc => {
          const data = doc.data();
          // Load comments for each post
          const commentsRef = collection(db, 'forum_posts', doc.id, 'comments');
          const commentsSnapshot = await getDocs(query(commentsRef, orderBy('timestamp', 'desc')));
          const comments: ForumComment[] = commentsSnapshot.docs.map(commentDoc => {
            const commentData = commentDoc.data();
            return {
              id: commentDoc.id,
              text: commentData.text,
              image: commentData.image,
              userId: commentData.userId,
              userEmail: commentData.userEmail,
              authorName: commentData.authorName,
              timestamp: commentData.timestamp?.toDate() || new Date()
            };
          });
          
          const post: ForumPost = {
            id: doc.id,
            text: data.text,
            image: data.image,
            isCoachPost: data.isCoachPost,
            userId: data.userId,
            userEmail: data.userEmail,
            authorName: data.authorName,
            authorId: data.authorId,
            channel: data.channel,
            timestamp: data.timestamp?.toDate() || new Date(),
            likes: data.likes || [],
            isPinned: data.isPinned,
            comments
          };
          
          return post;
        }));
        setPosts(prevPosts => [...prevPosts, ...morePosts]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    }
  };

  const createPost = async () => {
    if (!user || !newPost.trim() || submitting) return;

    try {
      setSubmitting(true);
      const postChannel = selectedChannel === 'All' ? 'Training' : selectedChannel;
      
      await addDoc(collection(db, 'forum_posts'), {
        text: newPost.trim(),
        isCoachPost: isCoach,
        userId: user.uid,
        userEmail: user.email,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorId: user.uid,
        channel: postChannel,
        timestamp: serverTimestamp(),
        likes: []
      });

      setNewPost('');
      await loadInitialPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    
    try {
      const postRef = doc(db, 'forum_posts', postId);
      const postDoc = await getDoc(postRef);
      const currentLikes = postDoc.data()?.likes || [];
      
      if (currentLikes.includes(user.uid)) {
        await updateDoc(postRef, {
          likes: currentLikes.filter((id: string) => id !== user.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: [...currentLikes, user.uid]
        });
      }
      
      await loadInitialPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'forum_posts', postId));
      await loadInitialPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const addComment = async (postId: string) => {
    if (!user || !newComment.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      const commentsRef = collection(db, 'forum_posts', postId, 'comments');
      
      await addDoc(commentsRef, {
        text: newComment.trim(),
        userId: user.uid,
        userEmail: user.email,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        timestamp: serverTimestamp()
      });

      setNewComment('');
      await loadInitialPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const togglePin = async (postId: string) => {
    if (!isCoach) return;
    
    try {
      const postRef = doc(db, 'forum_posts', postId);
      const postDoc = await getDoc(postRef);
      const isPinned = postDoc.data()?.isPinned || false;
      
      await updateDoc(postRef, {
        isPinned: !isPinned
      });
      
      await loadInitialPosts();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white">Loading forum...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-4">
          Forums
        </h1>
        <p className="text-lg text-gray-300">
          Join the conversation with coaches and clients
        </p>
      </div>

      {/* Channel Selector */}
      <div className="flex space-x-4 mb-8">
        {channels.map((channel) => (
          <button
            key={channel}
            onClick={() => setSelectedChannel(channel)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedChannel === channel
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {channel}
          </button>
        ))}
      </div>

      {/* New Post Input */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-8">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <UserCircleIcon className="w-10 h-10 text-gray-400" />
          </div>
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Write something..."
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 min-h-[100px]"
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={createPost}
                disabled={!newPost.trim() || submitting}
                className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className={`bg-gray-800/50 border border-gray-700 rounded-lg p-4 ${
              post.isPinned ? 'border-yellow-500/50' : ''
            }`}
          >
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="w-10 h-10 text-gray-400" />
                <div>
                  <p className="font-medium text-white">
                    {post.authorName}
                    {post.isCoachPost && (
                      <span className="ml-2 text-sm text-yellow-500">(Coach)</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-400">
                    {post.timestamp.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isCoach && (
                  <button
                    onClick={() => togglePin(post.id)}
                    className={`p-1 rounded hover:bg-gray-700 transition-colors ${
                      post.isPinned ? 'text-yellow-500' : 'text-gray-400'
                    }`}
                  >
                    <StarIcon className="w-5 h-5" />
                  </button>
                )}
                {(isCoach || post.authorId === user?.uid) && (
                  <button
                    onClick={() => deletePost(post.id)}
                    className="p-1 rounded text-red-500 hover:bg-gray-700 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Post Content */}
            {post.text && (
              <p className="text-white mb-4 whitespace-pre-wrap">{post.text}</p>
            )}
            {post.image && (
              <div className="mb-4 relative aspect-video">
                {post.image.includes('.gif') ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={post.image}
                    alt="Post gif"
                    className="rounded-lg w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <Image
                    src={post.image}
                    alt="Post image"
                    fill
                    className="rounded-lg object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center space-x-4 text-gray-400">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center space-x-1 hover:text-white transition-colors ${
                  post.likes?.includes(user?.uid || '') ? 'text-yellow-500' : ''
                }`}
              >
                <span>{post.likes?.length || 0} likes</span>
              </button>
              <button
                onClick={() => toggleComments(post.id)}
                className="flex items-center space-x-1 hover:text-white transition-colors"
              >
                <ChatBubbleLeftIcon className="w-5 h-5" />
                <span>{post.comments?.length || 0} comments</span>
              </button>
            </div>

            {/* Comments Section */}
            {showComments[post.id] && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                {/* Comment Input */}
                <div className="flex items-start space-x-3 mb-4">
                  <UserCircleIcon className="w-8 h-8 text-gray-400" />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <button
                    onClick={() => addComment(post.id)}
                    disabled={!newComment.trim() || submittingComment}
                    className="bg-yellow-500 text-gray-900 p-2 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {post.comments?.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <UserCircleIcon className="w-8 h-8 text-gray-400" />
                      <div className="flex-1">
                        <div className="bg-gray-900/50 rounded-lg p-3">
                          <p className="font-medium text-white text-sm">
                            {comment.authorName}
                          </p>
                          <p className="text-white">{comment.text}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {comment.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMorePosts}
            className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
} 