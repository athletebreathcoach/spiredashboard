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
  StarIcon,
  GifIcon
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import { GiphyFetch } from '@giphy/js-fetch-api';

interface ForumPost {
  id: string;
  text: string | null;
  image?: string;
  isCoachPost: boolean;
  userId: string;
  userEmail: string;
  authorName: string;
  authorId: string;
  forumId: string;
  forumName: string;
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

interface Forum {
  id: string;
  name: string;
}

interface GiphyResult {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
    };
    fixed_height_small: {
      url: string;
    };
  };
}

const POSTS_PER_PAGE = 10;

// Initialize Giphy API with proper error handling
const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || '');

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
  const [forums, setForums] = useState<{id: string, name: string}[]>([]);
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [giphyResults, setGiphyResults] = useState<GiphyResult[]>([]);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkIfCoach();
    loadForums();
  }, []);

  useEffect(() => {
    loadInitialPosts();
  }, [selectedChannel]);

  useEffect(() => {
    if (forums.length > 0) {
      loadInitialPosts();
    }
  }, [forums, selectedChannel]);

  useEffect(() => {
    if (selectedForum) {
      console.log('Selected forum changed to:', selectedForum);
      loadInitialPosts();
    }
  }, [selectedForum, selectedChannel]);

  useEffect(() => {
    if (!user || !selectedForum) return;
    loadInitialPosts();

    // Set up real-time listener for new posts
    const postsRef = collection(db, 'forums', selectedForum.id, 'posts');
    let q = query(
      postsRef,
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
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
          forumId: selectedForum.id,
          forumName: forums.find(f => f.id === selectedForum.id)?.name || '',
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
  }, [user, selectedForum]);

  const checkIfCoach = async () => {
    if (!user) return;
    try {
      const coachDoc = await getDoc(doc(db, 'coaches', user.uid));
      setIsCoach(coachDoc.exists());
    } catch (error) {
      console.error('Error checking coach status:', error);
    }
  };

  const loadForums = async () => {
    try {
      const forumsRef = collection(db, 'forums');
      const snapshot = await getDocs(forumsRef);
      const fetchedForums = snapshot.docs
        .filter(doc => {
          const name = doc.data().name;
          return name === '8 Week Breath Training' || name === 'Athlete Forum';
        })
        .map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));

      setForums(fetchedForums);
      
      // Select the first forum by default if none is selected
      if (fetchedForums.length > 0 && !selectedForum) {
        setSelectedForum(fetchedForums[0]);
      }
    } catch (error) {
      console.error('Error loading forums:', error);
      setError('Failed to load forums');
    }
  };

  const loadInitialPosts = async () => {
    if (!selectedForum) return;
    setLoading(true);
    try {
      console.log('Loading posts for forum:', selectedForum.id);
      const postsRef = collection(db, 'forums', selectedForum.id, 'posts');
      let q;
      
      if (selectedChannel === 'All') {
        q = query(
          postsRef,
          orderBy('timestamp', 'desc'),
          limit(POSTS_PER_PAGE)
        );
      } else {
        q = query(
          postsRef,
          where('channel', '==', selectedChannel),
          orderBy('timestamp', 'desc'),
          limit(POSTS_PER_PAGE)
        );
      }
      
      const snapshot = await getDocs(q);
      console.log('Query snapshot empty?', snapshot.empty);
      console.log('Number of posts found:', snapshot.docs.length);
      
      if (!snapshot.empty) {
        const fetchedPosts = await Promise.all(snapshot.docs.map(async doc => {
          const data = doc.data();
          console.log('Post data:', data);
          const commentsRef = collection(db, 'forums', selectedForum.id, 'posts', doc.id, 'comments');
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
          
          return {
            id: doc.id,
            text: data.text,
            image: data.image,
            isCoachPost: data.isCoachPost,
            userId: data.userId,
            userEmail: data.userEmail,
            authorName: data.authorName,
            authorId: data.authorId,
            forumId: selectedForum.id,
            forumName: forums.find(f => f.id === selectedForum.id)?.name || '',
            channel: data.channel,
            timestamp: data.timestamp?.toDate() || new Date(),
            likes: data.likes || [],
            isPinned: data.isPinned,
            comments
          };
        }));
        console.log('Processed posts:', fetchedPosts);
        setPosts(fetchedPosts);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(true);
      } else {
        console.log('No posts found for this forum');
        setPosts([]);
        setLastVisible(null);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!hasMore || !lastVisible || !selectedForum) return;
    
    try {
      const postsRef = collection(db, 'forums', selectedForum.id, 'posts');
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
          const commentsRef = collection(db, 'forums', selectedForum.id, 'posts', doc.id, 'comments');
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
          
          return {
            id: doc.id,
            text: data.text,
            image: data.image,
            isCoachPost: data.isCoachPost,
            userId: data.userId,
            userEmail: data.userEmail,
            authorName: data.authorName,
            authorId: data.authorId,
            forumId: selectedForum.id,
            forumName: forums.find(f => f.id === selectedForum.id)?.name || '',
            channel: data.channel,
            timestamp: data.timestamp?.toDate() || new Date(),
            likes: data.likes || [],
            isPinned: data.isPinned,
            comments
          };
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

  // Add Giphy search function with proper typing
  const searchGiphy = async (query: string) => {
    try {
      if (!process.env.NEXT_PUBLIC_GIPHY_API_KEY) {
        console.error('Giphy API key is not configured');
        return;
      }

      console.log('Searching Giphy with query:', query);
      if (!query) {
        console.log('Fetching trending GIFs...');
        const { data } = await gf.trending({ limit: 20 });
        console.log('Trending GIFs response:', data);
        setGiphyResults(data as unknown as GiphyResult[]);
      } else {
        console.log('Searching for GIFs...');
        const { data } = await gf.search(query, { limit: 20 });
        console.log('Search GIFs response:', data);
        setGiphyResults(data as unknown as GiphyResult[]);
      }
    } catch (error) {
      console.error('Error searching Giphy:', error);
      setGiphyResults([]);
    }
  };

  // Modify createPost to handle null user safely
  const createPost = async () => {
    if (!user || (!newPost.trim() && !selectedGif) || submitting || !selectedForum) return;

    try {
      setSubmitting(true);
      const postChannel = selectedChannel === 'All' ? 'Training' : selectedChannel;
      
      const postData = {
        text: newPost.trim(),
        image: selectedGif,
        isCoachPost: isCoach,
        userId: user.uid,
        userEmail: user.email || '',
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorId: user.uid,
        channel: postChannel,
        timestamp: serverTimestamp(),
        likes: []
      };
      
      await addDoc(collection(db, 'forums', selectedForum.id, 'posts'), postData);

      setNewPost('');
      setSelectedGif(null);
      setShowGifPicker(false);
      await loadInitialPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user || !selectedForum) return;
    
    try {
      const postRef = doc(db, 'forums', selectedForum.id, 'posts', postId);
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
    if (!selectedForum) return;
    try {
      await deleteDoc(doc(db, 'forums', selectedForum.id, 'posts', postId));
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
    if (!user || !newComment.trim() || submittingComment || !selectedForum) return;

    try {
      setSubmittingComment(true);
      const commentsRef = collection(db, 'forums', selectedForum.id, 'posts', postId, 'comments');
      
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
    if (!isCoach || !selectedForum) return;
    
    try {
      const postRef = doc(db, 'forums', selectedForum.id, 'posts', postId);
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

  // Load trending GIFs when GIF picker opens
  useEffect(() => {
    if (showGifPicker) {
      searchGiphy('');
    }
  }, [showGifPicker]);

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
    <div className="h-full flex flex-col">
      {/* Top Navigation */}
      <div className="flex flex-col mb-6 bg-gray-800/50 p-4 rounded-lg">
        <div className="flex items-center space-x-4 mb-4">
          <UserCircleIcon className="w-10 h-10 text-gray-400" />
          <div className="flex-1">
            <input
              type="text"
              placeholder="Share what's going on"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
            />
            {selectedGif && (
              <div className="relative mt-2 w-32 h-32">
                <img
                  src={selectedGif}
                  alt="Selected GIF"
                  className="rounded-lg object-cover w-full h-full"
                />
                <button
                  onClick={() => setSelectedGif(null)}
                  className="absolute top-1 right-1 bg-gray-900/80 text-white p-1 rounded-full hover:bg-gray-800"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center relative">
          <button
            onClick={() => setShowGifPicker(!showGifPicker)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <GifIcon className="w-6 h-6" />
          </button>
          <button
            onClick={createPost}
            disabled={(!newPost.trim() && !selectedGif) || submitting || !selectedForum}
            className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Post
          </button>
          
          {/* GIF Picker Modal */}
          {showGifPicker && (
            <div className="absolute left-0 top-full mt-2 p-4 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 w-[350px]">
              <div className="flex justify-between items-center mb-4">
                <input
                  type="text"
                  placeholder="Search GIFs..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchGiphy(e.target.value);
                  }}
                  className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <button
                  onClick={() => setShowGifPicker(false)}
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-[480px] overflow-y-auto">
                {giphyResults.map((gif: any) => (
                  <div
                    key={gif.id}
                    className="cursor-pointer hover:opacity-80 transition-opacity aspect-square"
                    onClick={() => {
                      setSelectedGif(gif.images.fixed_height.url);
                      setShowGifPicker(false);
                    }}
                  >
                    <img
                      src={gif.images.fixed_height_small.url}
                      alt={gif.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 space-x-6">
        {/* Left Sidebar */}
        <div className="w-64 space-y-6">
          {/* Forum Selector */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h2 className="text-white font-medium mb-4">Forums</h2>
            <div className="space-y-2">
              {forums.map((forum) => (
                <button
                  key={forum.id}
                  onClick={() => setSelectedForum(forum)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedForum?.id === forum.id
                      ? 'bg-yellow-500 text-gray-900'
                      : 'text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  {forum.name}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Selector */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h2 className="text-white font-medium mb-4">Channels</h2>
            <div className="space-y-2">
              {channels.map((channel) => (
                <button
                  key={channel}
                  onClick={() => setSelectedChannel(channel)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedChannel === channel
                      ? 'bg-yellow-500 text-gray-900'
                      : 'text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <UserCircleIcon className="w-10 h-10 text-gray-400" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-white">
                        {post.authorName}
                      </p>
                      {post.isCoachPost && (
                        <span className="text-sm text-yellow-500">(Coach)</span>
                      )}
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-400">
                        {post.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{post.forumName}</p>
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
              <div className="relative">
                {post.text && (
                  <div className={`text-white mb-4 whitespace-pre-wrap ${post.image?.toLowerCase().endsWith('.gif') ? 'pr-24' : ''}`}>
                    {post.text}
                  </div>
                )}
                {post.image && !post.image.toLowerCase().endsWith('.gif') && (
                  <div className="mb-4 w-full">
                    <div className="relative aspect-video">
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
                    </div>
                  </div>
                )}
                {post.image && post.image.toLowerCase().endsWith('.gif') && (
                  <div className="absolute top-0 right-0 w-14 h-14 rounded-lg overflow-hidden">
                    <img
                      src={post.image}
                      alt="Post gif"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Post Stats */}
              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <div className="flex items-center space-x-4">
                  <span>{post.likes?.length || 0} likes</span>
                  <span>{post.comments?.length || 0} comments</span>
                </div>
              </div>

              {/* Post Actions */}
              <div className="flex items-center space-x-4 pt-3 border-t border-gray-700">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-700/50 transition-colors ${
                    post.likes?.includes(user?.uid || '') ? 'text-yellow-500' : 'text-gray-400'
                  }`}
                >
                  <span>Like</span>
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors"
                >
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  <span>Comment</span>
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

        {/* Right Sidebar - Meetups */}
        <div className="w-72">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium">Meetups</h2>
              <button className="text-gray-400 hover:text-white">
                View all →
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">FEB 7</div>
                  <div className="text-xs text-gray-500">First time</div>
                </div>
                <h3 className="text-white font-medium mb-1">UIHUT - Crunchbase Company Profile</h3>
                <p className="text-sm text-gray-400">UIHUT • Austin, Texas, USA</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">FEB 3</div>
                  <div className="text-xs text-gray-500">Part time</div>
                </div>
                <h3 className="text-white font-medium mb-1">Design Meetups USA | Dribbble</h3>
                <p className="text-sm text-gray-400">Dribbble • Austin, Texas, USA</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 