/**
 * Minimalist Dashboard - Clean Split View
 */

import { useState, useEffect, useMemo } from 'react';
import { Plus, MessageSquare, MapPin, FileText } from 'lucide-react';
import MapView from '../components/MapView';
import SidebarList from '../components/SidebarList';
import PostModal from '../components/PostModal';
import PostViewModal from '../components/PostViewModal';
import MessagesPanel from '../components/MessagesPanel';
import MyPostsPanel from '../components/MyPostsPanel';
import UserAccountDropdown from '../components/UserAccountDropdown';
import ConfirmModal from '../components/ConfirmModal';
import AITestPanel from '../components/AITestPanel';
import { Post, Connection, ItemCategory, UserRole, TimeNeeded } from '../types';
import { findAIMatches } from '../utils/aiMatchingEngine';
import { calculateUrgency } from '../utils/urgencyCalculator';
import { postService, connectionService, messageService, DatabaseConnection, supabase } from '../services/supabase';
import type { DatabaseUser } from '../services/supabase';
import { toast } from 'sonner';
import { UserProfile } from '../components/OnboardingFlow';

interface DashboardProps {
  userRole: UserRole;
  userProfile: Omit<UserProfile, 'password'>;
  onUpdateProfile: (profile: Omit<UserProfile, 'password'>) => void;
  onLogout: () => void;
  currentUser: DatabaseUser;
}

export default function Dashboard({ userRole, userProfile, onUpdateProfile, onLogout, currentUser }: DashboardProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isMyPostsOpen, setIsMyPostsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewPost, setViewPost] = useState<Post | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const POSTS_PER_PAGE = 50;
  const [showAITestPanel, setShowAITestPanel] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'warning' | 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Calculate unread messages count
  // State for unread messages count
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Load unread messages count with real-time updates
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const { data } = await messageService.getUnreadMessagesCount(currentUser.id);
        setUnreadMessagesCount(data || 0);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    loadUnreadCount();
    
    // Set up real-time subscription for messages
    const messagesSubscription = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Reload unread count when messages change
          loadUnreadCount();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [currentUser.id]);

  // Load posts from Supabase on component mount
  useEffect(() => {
    loadPosts();
    
    // Set up real-time subscriptions
    const postsSubscription = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('Post change:', payload);
          // Reload posts when any post changes
          loadPosts();
        }
      )
      .subscribe();

    const connectionsSubscription = supabase
      .channel('connections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections'
        },
        (payload) => {
          console.log('Connection change:', payload);
          // Reload posts when connections change
          loadPosts();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(postsSubscription);
      supabase.removeChannel(connectionsSubscription);
    };
  }, [currentUser]);

  const loadPosts = async (page = 0, append = false) => {
    if (!append) setIsLoading(true);
    
    try {
      // Load posts from other users (for connecting) with pagination
      const { data: otherPosts, error: otherError } = await postService.getPostsInRadius(
        currentUser.location_lat,
        currentUser.location_lng,
        50, // 50km radius
        currentUser.id, // exclude current user's posts from the list
        page,
        POSTS_PER_PAGE
      );

      // Load current user's own posts (always load all user's posts)
      const { data: myPosts, error: myError } = await postService.getUserPosts(currentUser.id);

      if (otherError) {
        console.error('Error loading other posts:', otherError);
        toast.error('Failed to load posts from others');
      }

      if (myError) {
        console.error('Error loading my posts:', myError);
        toast.error('Failed to load your posts');
      }

      // Combine both arrays
      const newOtherPosts = otherPosts || [];
      const allMyPosts = myPosts || [];
      
      // Check if we have more posts to load
      setHasMorePosts(newOtherPosts.length === POSTS_PER_PAGE);

      if (newOtherPosts.length > 0 || allMyPosts.length > 0) {
        // Convert database posts to frontend Post format
        const convertedOtherPosts: Post[] = newOtherPosts.map((dbPost: any) => ({
          id: dbPost.id,
          userId: dbPost.user_id,
          userName: dbPost.users?.name || 'Unknown User',
          role: dbPost.role,
          category: dbPost.category,
          item: dbPost.item,
          quantity: dbPost.quantity,
          urgency: dbPost.urgency,
          timeNeeded: dbPost.time_needed,
          notes: dbPost.notes || '',
          location: {
            lat: dbPost.location_lat,
            lng: dbPost.location_lng,
            address: dbPost.location_address
          },
          status: dbPost.status,
          createdAt: new Date(dbPost.created_at),
          connections: dbPost.connections?.map((conn: any) => ({
            id: conn.id,
            postId: conn.post_id,
            connectedUserId: conn.connected_user_id,
            connectedUserName: 'Connected User',
            giverConfirmed: conn.giver_confirmed,
            receiverConfirmed: conn.receiver_confirmed,
            createdAt: new Date(conn.created_at),
            chatActive: conn.chat_active || true
          })) || []
        }));

        const convertedMyPosts: Post[] = allMyPosts.map((dbPost: any) => ({
          id: dbPost.id,
          userId: dbPost.user_id,
          userName: currentUser.name,
          role: dbPost.role,
          category: dbPost.category,
          item: dbPost.item,
          quantity: dbPost.quantity,
          urgency: dbPost.urgency,
          timeNeeded: dbPost.time_needed,
          notes: dbPost.notes || '',
          location: {
            lat: dbPost.location_lat,
            lng: dbPost.location_lng,
            address: dbPost.location_address
          },
          status: dbPost.status,
          createdAt: new Date(dbPost.created_at),
          connections: dbPost.connections?.map((conn: any) => ({
            id: conn.id,
            postId: conn.post_id,
            connectedUserId: conn.connected_user_id,
            connectedUserName: 'Connected User',
            giverConfirmed: conn.giver_confirmed,
            receiverConfirmed: conn.receiver_confirmed,
            createdAt: new Date(conn.created_at),
            chatActive: conn.chat_active || true
          })) || []
        }));

        if (append) {
          // Append new posts to existing ones
          setPosts(prev => [...prev, ...convertedOtherPosts]);
        } else {
          // Replace all posts
          setPosts([...convertedMyPosts, ...convertedOtherPosts]);
        }
      } else if (!append) {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      if (!append) setIsLoading(false);
    }
  };

  const loadMorePosts = () => {
    if (hasMorePosts && !isLoading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadPosts(nextPage, true);
    }
  };

  // Filter posts for matching algorithm - only show opposite role
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // If user is a giver, show only receivers (for matching)
      // If user is a receiver, show only givers (for matching)
      return post.role !== userRole;
    });
  }, [posts, userRole]);

  // All posts for map display (including user's own posts)
  const filteredPostsForMap = useMemo(() => {
    return posts.filter(post => post.status === 'active');
  }, [posts]);

  const highlightedPostIds = useMemo(() => {
    const userPosts = posts.filter(p => p.userId === currentUser.id && p.status === 'active');
    if (userPosts.length === 0) return [];
    
    const latestUserPost = userPosts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    
    const candidatePosts = filteredPosts;
    
    // Use AI-powered matching instead of basic matching
    const aiMatches = findAIMatches(latestUserPost, candidatePosts);
    return aiMatches.map(m => m.postId);
  }, [posts, filteredPosts, currentUser.id]);

  // Calculate AI match scores for sorting
  const matchScores = useMemo(() => {
    const userPosts = posts.filter(p => p.userId === currentUser.id && p.status === 'active');
    if (userPosts.length === 0) return {};
    
    const latestUserPost = userPosts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    
    const candidatePosts = filteredPosts;
    const aiMatches = findAIMatches(latestUserPost, candidatePosts);
    
    const scores: { [postId: string]: number } = {};
    aiMatches.forEach(match => {
      scores[match.postId] = match.score;
    });
    
    return scores;
  }, [posts, filteredPosts, currentUser.id]);

  const handleCreatePost = async (postData: {
    category: ItemCategory;
    item: string;
    quantity: number;
    timeNeeded: TimeNeeded;
    notes: string;
    useCurrentLocation: boolean;
    manualLocation?: { lat: number; lng: number };
  }) => {
    try {
      const location = postData.useCurrentLocation 
        ? { lat: currentUser.location_lat, lng: currentUser.location_lng }
        : postData.manualLocation || { lat: currentUser.location_lat, lng: currentUser.location_lng };

      const { data, error } = await postService.createPost({
        userId: currentUser.id,
        role: userRole,
        category: postData.category,
        item: postData.item,
        quantity: postData.quantity,
        urgency: calculateUrgency(postData.timeNeeded),
        timeNeeded: postData.timeNeeded,
        notes: postData.notes,
        location: {
          lat: location.lat,
          lng: location.lng,
          address: currentUser.location_name
        }
      });

      if (error) {
        console.error('Error creating post:', error);
        toast.error('Failed to create post');
        return;
      }

      if (data) {
        // Convert database post to frontend format and add to local state
        const newPost: Post = {
          id: data.id,
          userId: data.user_id,
          userName: currentUser.name,
          role: data.role,
          category: data.category,
          item: data.item,
          quantity: data.quantity,
          urgency: data.urgency,
          timeNeeded: data.time_needed,
          notes: data.notes || '',
          location: {
            lat: data.location_lat,
            lng: data.location_lng,
            address: data.location_address
          },
          status: data.status,
          createdAt: new Date(data.created_at),
          connections: []
        };

        // Add to local state for immediate UI update
        setPosts(prev => [...prev, newPost]);
        setIsModalOpen(false);
        toast.success('Post created successfully');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleConnect = async (postId: string) => {
    try {
      const { data, error } = await connectionService.createConnection(postId, currentUser.id);
      
      if (error) {
        toast.error('Failed to connect');
        return;
      }

      // Update local state
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          if (post.connections.length >= 5) {
            toast.error('Maximum connections reached');
            return post;
          }
          
          if (post.connections.some(c => c.connectedUserId === currentUser.id)) {
            toast.error('Already connected');
            return post;
          }
          
          const newConnection: Connection = {
            id: data.id,
            postId: post.id,
            connectedUserId: currentUser.id,
            connectedUserName: currentUser.name,
            giverConfirmed: false,
            receiverConfirmed: false,
            createdAt: new Date(data.created_at),
            chatActive: true
          };
          
          toast.success('Connected successfully');
          
          return {
            ...post,
            connections: [...post.connections, newConnection]
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error connecting:', error);
      toast.error('Failed to connect');
    }
  };

  const handleConfirm = async (postId: string, connectionId: string) => {
    try {
      // Find the connection and post
      const post = posts.find(p => p.id === postId);
      const connection = post?.connections.find(c => c.id === connectionId);
      
      if (!connection || !post) {
        toast.error('Connection not found');
        return;
      }

      // FIXED: Determine current user's role in the connection
      const isPostOwner = post.userId === currentUser.id;
      const userIsGiver = (post.role === 'giver' && isPostOwner) || (post.role === 'receiver' && !isPostOwner);
      
      const updates: Partial<DatabaseConnection> = {};
      
      if (userIsGiver) {
        updates.giver_confirmed = true;
      } else {
        updates.receiver_confirmed = true;
      }

      // Update in database
      const { data, error } = await connectionService.updateConnection(connectionId, updates);
      
      if (error) {
        toast.error('Failed to confirm connection');
        return;
      }

      // Update local state
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const updatedConnections = post.connections.map(conn => {
            if (conn.id === connectionId) {
              const updated = { 
                ...conn, 
                giverConfirmed: data.giver_confirmed,
                receiverConfirmed: data.receiver_confirmed
              };
              
              if (updated.giverConfirmed && updated.receiverConfirmed) {
                toast.success('Both parties confirmed');
                // Update post status to confirmed immediately with proper error handling
                postService.updatePost(postId, { status: 'confirmed' }).then(({ error }) => {
                  if (error) {
                    console.error('Failed to update post status:', error);
                    toast.error('Failed to update post status');
                  } else {
                    setPosts(p => p.map(po => 
                      po.id === postId ? { ...po, status: 'confirmed' as const } : po
                    ));
                  }
                }).catch(error => {
                  console.error('Failed to update post status:', error);
                  toast.error('Failed to update post status');
                });
              } else {
                toast.success('Confirmed');
              }
              
              return updated;
            }
            return conn;
          });
          
          return { ...post, connections: updatedConnections };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error confirming connection:', error);
      toast.error('Failed to confirm connection');
    }
  };

  const handleCancel = async (postId: string, connectionId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      const connection = post?.connections.find(c => c.id === connectionId);
      
      if (!connection || !post) {
        toast.error('Connection not found');
        return;
      }
      
      const wasConfirmed = connection && post &&
        ((post.role === 'giver' && connection.giverConfirmed) || 
         (post.role === 'receiver' && connection.receiverConfirmed));
      
      // Delete connection from database
      const { error } = await connectionService.deleteConnection(connectionId);
      
      if (error) {
        toast.error('Failed to cancel connection');
        return;
      }

      // Update local state
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            connections: p.connections.filter(c => c.id !== connectionId)
          };
        }
        return p;
      }));
      
      if (wasConfirmed && post?.status === 'confirmed') {
        // Immediate post completion dialog
        setConfirmModal({
          isOpen: true,
          title: 'Post Completed',
          message: 'This post has been completed successfully!\n\nWould you like to re-list this post to help more people, or mark it as finished?',
          confirmText: 'Re-list Post',
          cancelText: 'Mark as Finished',
          onConfirm: async () => {
            try {
              const { error } = await postService.updatePost(postId, { status: 'active' });
              if (error) {
                toast.error('Failed to re-list post');
                return;
              }
              setPosts(prev => prev.map(p => 
                p.id === postId ? { ...p, status: 'active' as const } : p
              ));
              toast.success('Post re-listed');
            } catch (error) {
              toast.error('Failed to re-list post');
            }
            setConfirmModal({ ...confirmModal, isOpen: false });
          },
          onCancel: async () => {
            try {
              const { error } = await postService.updatePost(postId, { status: 'cancelled' });
              if (error) {
                toast.error('Failed to mark post as finished');
                return;
              }
              setPosts(prev => prev.map(p => 
                p.id === postId ? { ...p, status: 'cancelled' as const } : p
              ));
              toast.info('Post marked as finished');
            } catch (error) {
              toast.error('Failed to mark post as finished');
            }
            setConfirmModal({ ...confirmModal, isOpen: false });
          },
          type: 'info'
        });
      } else {
        toast.info('Connection cancelled');
      }
    } catch (error) {
      console.error('Error cancelling connection:', error);
      toast.error('Failed to cancel connection');
    }
  };

  const handleSidebarPostClick = () => {
    // Post click handled by sidebar itself now
  };
  
  const handleMarkerClick = () => {
    // Post click handled by map itself now
  };

  const handleEditPost = (postId: string, updates: {
    item: string;
    quantity: number;
    timeNeeded: TimeNeeded;
    notes: string;
    location?: { lat: number; lng: number; address?: string };
  }) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const updatedPost = {
          ...post,
          item: updates.item,
          quantity: updates.quantity,
          timeNeeded: updates.timeNeeded,
          urgency: calculateUrgency(updates.timeNeeded),
          notes: updates.notes
        };
        
        // Update location if provided
        if (updates.location) {
          updatedPost.location = {
            lat: updates.location.lat,
            lng: updates.location.lng,
            address: updates.location.address
          };
        }
        
        return updatedPost;
      }
      return post;
    }));
    toast.success('Post updated successfully');
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    toast.success('Post deleted');
  };
  
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#D5E7F2] via-white to-[#73C6D9]/20">
      {/* Premium Glass Nav */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-lg shadow-[#126DA6]/5 relative z-[9999]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1261A6] to-[#126DA6] bg-clip-text text-transparent">JOFLOW</h1>
            <span className="hidden sm:inline text-sm text-gray-600 font-medium">Join the Flow</span>
            
            {/* Premium Role Badge */}
            <div className={`ml-2 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border-2 ${
              userRole === 'giver' 
                ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' 
                : 'bg-red-500/10 text-red-700 border-red-500/30'
            }`}>
              {userRole === 'giver' ? '🎁 Giver Mode' : '🙏 Receiver Mode'}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Premium Icon Buttons */}
            <button
              onClick={() => setShowAITestPanel(!showAITestPanel)}
              className="flex items-center justify-center p-2.5 text-gray-600 hover:bg-white/50 rounded-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm"
              title="AI Test Panel"
            >
              <span className="text-lg">🤖</span>
            </button>
            
            <button
              onClick={() => setIsMyPostsOpen(true)}
              className="flex items-center justify-center p-2.5 text-gray-600 hover:bg-white/50 rounded-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm"
              title="My Posts"
            >
              <FileText className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setIsMessagesOpen(true)}
              className="flex items-center justify-center p-2.5 text-gray-600 hover:bg-white/50 rounded-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm relative"
              title="Messages"
            >
              <MessageSquare className="w-5 h-5" />
              {/* Premium Unread Badge - Only show if there are unread messages */}
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/40">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
            
            {/* Premium New Post Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center p-2.5 bg-gradient-to-r from-[#2A95BF] to-[#126DA6] text-white rounded-2xl transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-[#126DA6]/40 shadow-md"
              title="New Post"
            >
              <Plus className="w-5 h-5" />
            </button>
            
            <UserAccountDropdown
              userProfile={userProfile}
              onEditProfile={onUpdateProfile}
              onLogout={onLogout}
            />
          </div>
        </div>
      </nav>

      {/* Main - Full Screen Map with Floating Overlay */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#D5E7F2] via-white to-[#73C6D9]/20">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-[#126DA6]/10 border border-white/60 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#126DA6] to-[#2A95BF] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Posts...</h3>
              <p className="text-gray-600">Finding aid opportunities near you</p>
            </div>
          </div>
        ) : (
          <>
            {/* Full Screen Map Background */}
            <MapView
              posts={filteredPostsForMap.filter(p => p.role !== userRole)}
              center={{ lat: currentUser.location_lat, lng: currentUser.location_lng }}
              currentUserId={currentUser.id}
              userRole={userRole}
              onConnect={handleConnect}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              highlightedPostIds={highlightedPostIds}
              onMarkerClick={handleMarkerClick}
              userLocationName={currentUser.location_name}
            />
            
            {/* Premium Dropdown List (Toggle) */}
            <SidebarList
              posts={filteredPosts.filter(p => p.status === 'active')}
              currentUserLocation={{ lat: currentUser.location_lat, lng: currentUser.location_lng }}
              currentUserId={currentUser.id}
              allPosts={posts}
              onPostClick={handleSidebarPostClick}
              highlightedPostIds={highlightedPostIds}
              matchScores={matchScores}
            />

            {/* Empty State Overlay - Show when no posts */}
            {posts.length === 0 && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-[#126DA6]/10 border border-white/60 text-center max-w-md mx-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#126DA6] to-[#2A95BF] rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to JOFLOW!</h3>
                  <p className="text-gray-600 mb-2">
                    Create your first post to start connecting with the community
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    📍 Your location: {currentUser.location_name}
                  </p>
                  <div className="text-sm text-gray-500">
                    <p>🎁 Share what you have</p>
                    <p>🙏 Find support</p>
                    <p>🤝 Connect with people</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Load More Button */}
        {hasMorePosts && !isLoading && posts.length > 0 && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-[9998]">
            <button
              onClick={loadMorePosts}
              className="px-6 py-3 bg-white/90 backdrop-blur-sm text-[#1261A6] font-semibold rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 border border-[#1261A6]/20"
            >
              Load More Posts ({POSTS_PER_PAGE} more)
            </button>
          </div>
        )}
      </div>

      <PostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePost}
        userRole={userRole}
      />
      
      {/* Messages Panel */}
      {isMessagesOpen && (
        <MessagesPanel
          posts={posts}
          currentUserId={currentUser.id}
          currentUserLocation={{ lat: currentUser.location_lat, lng: currentUser.location_lng }}
          onClose={() => setIsMessagesOpen(false)}
          onViewPost={(postId) => {
            const post = posts.find(p => p.id === postId);
            if (post) {
              setViewPost(post);
              setIsMessagesOpen(false);
            }
          }}
        />
      )}

      {/* My Posts Panel */}
      {isMyPostsOpen && (
        <MyPostsPanel
          posts={posts}
          currentUserId={currentUser.id}
          currentUserLocation={{ lat: currentUser.location_lat, lng: currentUser.location_lng }}
          onClose={() => setIsMyPostsOpen(false)}
          onEditPost={handleEditPost}
          onDeletePost={handleDeletePost}
          onViewPost={(post) => {
            setViewPost(post);
            setIsMyPostsOpen(false);
          }}
        />
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-gray-600">
          <span>Active: {posts.filter(p => p.status === 'active').length}</span>
          <span>Yours: {posts.filter(p => p.userId === currentUser.id).length}</span>
        </div>
        {highlightedPostIds.length > 0 && (
          <span className="text-[#1261A6] font-medium">
            {highlightedPostIds.length} matches
          </span>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText || 'Confirm'}
        cancelText={confirmModal.cancelText || 'Cancel'}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel || (() => setConfirmModal({ ...confirmModal, isOpen: false }))}
      />

      {/* Post View Modal */}
      <PostViewModal
        isOpen={!!viewPost}
        post={viewPost}
        currentUserId={currentUser.id}
        onClose={() => setViewPost(null)}
        onConnect={handleConnect}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* AI Test Panel */}
      {showAITestPanel && <AITestPanel />}
    </div>
  );
}