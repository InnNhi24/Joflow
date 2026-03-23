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
import { Post, Connection, ItemCategory, UserRole, TimeNeeded } from '../types';
import { findAIMatches } from '../utils/aiMatchingEngine';
import { calculateUrgency } from '../utils/urgencyCalculator';
import { calculateDistance } from '../utils/matchingEngine';
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
  const [connectionMessages, setConnectionMessages] = useState<Record<string, any[]>>({});
  const [newPostsCount, setNewPostsCount] = useState(0); // Track new posts for notification
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null); // For map navigation
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

  // State for unread messages count (managed by MessagesPanel)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  
  // State for auto-selecting connection after connect
  const [autoSelectConnectionId, setAutoSelectConnectionId] = useState<string | null>(null);
  
  // DISABLED: Don't load unread count from database - let MessagesPanel handle it
  /*
  // Load unread messages count with real-time updates
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout;
    
    const loadUnreadCount = async () => {
      try {
        console.log('🔄 Loading unread count for user:', currentUser.id);
        const { data } = await messageService.getUnreadMessagesCount(currentUser.id);
        console.log('📈 Unread count result:', data);
        setUnreadMessagesCount(data || 0);
      } catch (error) {
        console.error('❌ Error loading unread count:', error);
      }
    };

    const debouncedLoadUnreadCount = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(loadUnreadCount, 500);
    };

    loadUnreadCount();
    
    // Also load unread count every 30 seconds to ensure accuracy
    const intervalId = setInterval(loadUnreadCount, 30000);
    
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
        (payload) => {
          console.log('Messages real-time change:', payload);
          // Force refresh unread count immediately when new message arrives
          loadUnreadCount();
        }
      )
      .subscribe();
    
    return () => {
      clearTimeout(refreshTimeout);
      clearInterval(intervalId);
      supabase.removeChannel(messagesSubscription);
    };
  }, [currentUser.id]);
  */

  // Load unread count only when MessagesPanel is not open
  useEffect(() => {
    if (!isMessagesOpen) {
      // Load unread count from database when MessagesPanel is closed
      const loadUnreadCount = async () => {
        try {
          console.log('🔄 Loading unread count from database (MessagesPanel closed)');
          const { data } = await messageService.getUnreadMessagesCount(currentUser.id);
          console.log('📈 Database unread count result:', data);
          setUnreadMessagesCount(data || 0);
        } catch (error) {
          console.error('❌ Error loading unread count:', error);
        }
      };

      loadUnreadCount();
      
      // Set up real-time subscription for new messages when MessagesPanel is closed
      const messagesSubscription = supabase
        .channel('messages-changes-dashboard')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            console.log('📨 New message received (MessagesPanel closed):', payload);
            // Reload unread count when new message arrives
            loadUnreadCount();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(messagesSubscription);
      };
    }
  }, [isMessagesOpen, currentUser.id]);

  // Load posts from Supabase on component mount
  useEffect(() => {
    loadPosts();
    
    // Set up real-time subscriptions with better handling
    console.log('🔄 Setting up real-time subscriptions...');
    
    const postsSubscription = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('🆕 New post created:', payload.new);
          const newPost = payload.new as any;
          
          // Convert database post to frontend format
          const convertedPost: Post = {
            id: newPost.id,
            userId: newPost.user_id,
            userName: 'New User', // Will be updated when we get user info
            role: newPost.role,
            category: newPost.category,
            item: newPost.item,
            quantity: newPost.quantity,
            urgency: newPost.urgency,
            timeNeeded: newPost.time_needed,
            notes: newPost.notes || '',
            location: {
              lat: newPost.location_lat,
              lng: newPost.location_lng,
              address: newPost.location_address
            },
            status: newPost.status,
            createdAt: new Date(newPost.created_at),
            connections: []
          };
          
          // Add to posts array if not already exists
          setPosts(prev => {
            const exists = prev.some(p => p.id === convertedPost.id);
            if (!exists) {
              console.log('➕ Adding new post to state:', convertedPost.item);
              setNewPostsCount(count => count + 1); // Increment new posts counter
              return [...prev, convertedPost];
            }
            return prev;
          });
          
          // Show toast notification for new posts from others
          if (newPost.user_id !== currentUser.id) {
            toast.success(`🆕 New ${newPost.role} post: ${newPost.item}`, {
              duration: 4000,
              action: {
                label: 'View',
                onClick: () => {
                  const post = posts.find(p => p.id === newPost.id);
                  if (post) setViewPost(post);
                }
              }
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('📝 Post updated:', payload.new);
          const updatedPost = payload.new as any;
          
          // Update existing post in state
          setPosts(prev => prev.map(post => {
            if (post.id === updatedPost.id) {
              const updated = {
                ...post,
                item: updatedPost.item,
                quantity: updatedPost.quantity,
                urgency: updatedPost.urgency,
                timeNeeded: updatedPost.time_needed,
                notes: updatedPost.notes || '',
                status: updatedPost.status,
                location: {
                  lat: updatedPost.location_lat,
                  lng: updatedPost.location_lng,
                  address: updatedPost.location_address
                }
              };
              
              // Show toast for location changes
              if (post.location.lat !== updatedPost.location_lat || 
                  post.location.lng !== updatedPost.location_lng) {
                toast.success(`📍 ${updatedPost.item} moved to new location!`, {
                  duration: 4000,
                  action: {
                    label: 'View on Map',
                    onClick: () => {
                      // Navigate to updated location on map
                      setViewPost(updated);
                      setHoveredPostId(updatedPost.id);
                      setTimeout(() => setHoveredPostId(null), 3000);
                    }
                  }
                });
              }
              
              return updated;
            }
            return post;
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('🗑️ Post deleted:', payload.old);
          const deletedPost = payload.old as any;
          
          // Remove from posts array
          setPosts(prev => prev.filter(post => post.id !== deletedPost.id));
          toast.info('A post was removed');
        }
      )
      .subscribe((status) => {
        console.log('📡 Posts subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to posts changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to posts changes');
        }
      });

    const connectionsSubscription = supabase
      .channel('connections-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'connections'
        },
        (payload) => {
          console.log('🤝 New connection created:', payload.new);
          // Reload posts to get updated connection info
          loadPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'connections'
        },
        (payload) => {
          console.log('📝 Connection updated:', payload.new);
          // Reload posts to get updated connection info
          loadPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'connections'
        },
        (payload) => {
          console.log('🗑️ Connection deleted:', payload.old);
          // Reload posts to get updated connection info
          loadPosts();
        }
      )
      .subscribe((status) => {
        console.log('📡 Connections subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to connections changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to connections changes');
        }
      });

    // Cleanup subscriptions
    return () => {
      console.log('🧹 Cleaning up real-time subscriptions');
      supabase.removeChannel(postsSubscription);
      supabase.removeChannel(connectionsSubscription);
    };
  }, [currentUser]);
  const loadPosts = async (page = 0, append = false) => {
    console.log('🔄 Loading posts - page:', page, 'append:', append);
    console.log('👤 Current user:', { 
      id: currentUser.id, 
      name: currentUser.name,
      location: { 
        lat: currentUser.location_lat, 
        lng: currentUser.location_lng,
        name: currentUser.location_name 
      } 
    });
    
    // Check if user location is in Vietnam
    const isInVietnam = currentUser.location_lat >= 8.0 && currentUser.location_lat <= 24.0 && 
                       currentUser.location_lng >= 102.0 && currentUser.location_lng <= 110.0;
    console.log('🇻🇳 User location in Vietnam?', isInVietnam);
    
    if (!append) setIsLoading(true);
    
    try {
      // Load posts from other users (for connecting) with pagination
      const { data: otherPosts, error: otherError } = await postService.getPostsInRadius(
        currentUser.location_lat,
        currentUser.location_lng,
        999999, // No radius limit - show all posts in Vietnam
        currentUser.id, // exclude current user's posts from the list
        page,
        POSTS_PER_PAGE
      );

      // Load current user's own posts (always load all user's posts)
      const { data: myPosts, error: myError } = await postService.getUserPosts(currentUser.id);

      console.log('📊 Query results:');
      console.log('  - Other posts:', otherPosts?.length || 0);
      console.log('  - My posts:', myPosts?.length || 0);

      if (otherError) {
        console.error('❌ Error loading other posts:', otherError);
        toast.error('Failed to load posts from others');
      }

      if (myError) {
        console.error('❌ Error loading my posts:', myError);
        toast.error('Failed to load your posts');
      }

      // Combine both arrays
      const newOtherPosts = otherPosts || [];
      const allMyPosts = myPosts || [];
      
      console.log('📋 Raw posts from database:');
      console.log('  - Other posts:', newOtherPosts.map(p => ({ 
        id: p.id, 
        item: p.item, 
        location: { lat: p.location_lat, lng: p.location_lng },
        distance: calculateDistance(currentUser.location_lat, currentUser.location_lng, p.location_lat, p.location_lng).toFixed(2) + 'km'
      })));
      console.log('  - My posts:', allMyPosts.map(p => ({ 
        id: p.id, 
        item: p.item, 
        location: { lat: p.location_lat, lng: p.location_lng },
        distance: calculateDistance(currentUser.location_lat, currentUser.location_lng, p.location_lat, p.location_lng).toFixed(2) + 'km'
      })));
      
      // Test distance to Da Nang (16.0544, 108.2022)
      const distanceToDaNang = calculateDistance(currentUser.location_lat, currentUser.location_lng, 16.0544, 108.2022);
      console.log('📏 Distance to Da Nang (16.0544, 108.2022):', distanceToDaNang.toFixed(2), 'km');
      
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
            connectedUserName: conn.users?.name || 'Connected User',
            giverConfirmed: conn.giver_confirmed,
            receiverConfirmed: conn.receiver_confirmed,
            createdAt: new Date(conn.created_at),
            chatActive: conn.chat_active || true,
            users: conn.users
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
            connectedUserName: conn.users?.name || 'Connected User',
            giverConfirmed: conn.giver_confirmed,
            receiverConfirmed: conn.receiver_confirmed,
            createdAt: new Date(conn.created_at),
            chatActive: conn.chat_active || true,
            users: conn.users
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
    console.log('🔍 Filtering posts for matching algorithm');
    console.log('📊 Total posts:', posts.length);
    console.log('👤 User role:', userRole);
    
    const filtered = posts.filter(post => {
      // If user is a giver, show only receivers (for matching)
      // If user is a receiver, show only givers (for matching)
      const shouldShow = post.role !== userRole;
      console.log(`📝 Post "${post.item}" (${post.role}) - Show: ${shouldShow}`);
      return shouldShow;
    });
    
    console.log('✅ Filtered posts for matching:', filtered.length);
    return filtered;
  }, [posts, userRole]);

  // All posts for map display (including user's own posts)
  const filteredPostsForMap = useMemo(() => {
    console.log('🗺️ Filtering posts for map display');
    const filtered = posts.filter(post => post.status === 'active');
    console.log('📍 Active posts for map:', filtered.length);
    console.log('📋 Map posts:', filtered.map(p => ({ id: p.id, item: p.item, role: p.role, status: p.status })));
    return filtered;
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

  // Load messages when viewing a post
  useEffect(() => {
    if (viewPost) {
      const myConnection = viewPost.connections.find(conn => conn.connectedUserId === currentUser.id);
      if (myConnection) {
        loadConnectionMessages(myConnection.id);
      }
    }
  }, [viewPost, currentUser.id]);
  const handleCreatePost = async (postData: {
    category: ItemCategory;
    item: string;
    quantity: number;
    timeNeeded: TimeNeeded;
    notes: string;
    useCurrentLocation: boolean;
    manualLocation?: { lat: number; lng: number };
  }) => {
    console.log('🆕 Creating new post:', postData);
    console.log('👤 Current user location:', { lat: currentUser.location_lat, lng: currentUser.location_lng, name: currentUser.location_name });
    
    try {
      const location = postData.useCurrentLocation 
        ? { lat: currentUser.location_lat, lng: currentUser.location_lng }
        : postData.manualLocation || { lat: currentUser.location_lat, lng: currentUser.location_lng };

      console.log('📍 Using location for post:', location);

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
        console.error('❌ Error creating post:', error);
        toast.error('Failed to create post');
        return;
      }

      if (data) {
        console.log('✅ Post created successfully in database:', data);
        
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

        console.log('📝 Adding post to local state:', newPost);
        
        // Add to local state for immediate UI update
        setPosts(prev => {
          const updated = [...prev, newPost];
          console.log('📊 Updated posts array length:', updated.length);
          return updated;
        });
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
          
          toast.success('Connected successfully! Opening messages...');
          
          // Auto-open Messages Panel after successful connection
          setTimeout(() => {
            setAutoSelectConnectionId(data.id); // Set connection to auto-select
            setIsMessagesOpen(true);
          }, 1000); // Small delay to let user see the success message
          
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
  const loadConnectionMessages = async (connectionId: string) => {
    try {
      const { data, error } = await messageService.getConnectionMessages(connectionId);
      if (!error && data) {
        setConnectionMessages(prev => ({
          ...prev,
          [connectionId]: data
        }));
      }
    } catch (error) {
      console.error('Error loading connection messages:', error);
    }
  };

  const handleSidebarPostClick = (post: Post) => {
    setViewPost(post);
  };
  
  const handleMarkerClick = () => {
    // Post click handled by map itself now
  };

  const handleEditPost = async (postId: string, updates: {
    item: string;
    quantity: number;
    timeNeeded: TimeNeeded;
    notes: string;
    location?: { lat: number; lng: number; address?: string };
  }) => {
    console.log('📝 Editing post:', postId, updates);
    
    try {
      // Update in database first
      const dbUpdates: any = {
        item: updates.item,
        quantity: updates.quantity,
        time_needed: updates.timeNeeded,
        urgency: calculateUrgency(updates.timeNeeded),
        notes: updates.notes
      };
      
      // Add location updates if provided
      if (updates.location) {
        dbUpdates.location_lat = updates.location.lat;
        dbUpdates.location_lng = updates.location.lng;
        dbUpdates.location_address = updates.location.address;
        console.log('📍 Updating location:', updates.location);
      }
      
      const { data, error } = await postService.updatePost(postId, dbUpdates);
      
      if (error) {
        console.error('❌ Error updating post in database:', error);
        toast.error('Failed to update post');
        return;
      }
      
      console.log('✅ Post updated in database:', data);
      
      // Update local state
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
      
      // Show special toast for location changes
      if (updates.location) {
        setTimeout(() => {
          toast.success('📍 Location updated on map!', {
            duration: 3000,
            action: {
              label: 'View',
              onClick: () => {
                const updatedPost = posts.find(p => p.id === postId);
                if (updatedPost) {
                  setViewPost(updatedPost);
                  setHoveredPostId(postId); // Trigger map navigation
                  setTimeout(() => setHoveredPostId(null), 2000); // Clear after 2s
                }
              }
            }
          });
        }, 1000);
      }
      
    } catch (error) {
      console.error('💥 Exception updating post:', error);
      toast.error('Failed to update post');
    }
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
            
            {/* New Posts Notification */}
            {newPostsCount > 0 && (
              <button
                onClick={() => {
                  setNewPostsCount(0); // Reset counter when clicked
                  // Scroll to top to see new posts
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl animate-pulse"
                title={`${newPostsCount} new posts available`}
              >
                <span className="text-sm font-bold">🆕 {newPostsCount}</span>
              </button>
            )}
            
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
              hoveredPostId={hoveredPostId}
              onMarkerClick={handleMarkerClick}
              userLocationName={currentUser.location_name}
              allPosts={filteredPostsForMap.filter(p => p.role !== userRole)}
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
              className="px-6 py-3 bg-white/90 backdrop-blur-sm text-[#1261A6] font-semibold rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300"
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
          onClose={() => {
            setIsMessagesOpen(false);
            setAutoSelectConnectionId(null); // Clear auto-select when closing
            // Don't force refresh - let real-time handle it
          }}
          onViewPost={(postId) => {
            const post = posts.find(p => p.id === postId);
            if (post) {
              setViewPost(post);
              setIsMessagesOpen(false);
            }
          }}
          onUnreadCountChange={(count) => {
            console.log('📊 Unread count changed from MessagesPanel:', count);
            setUnreadMessagesCount(count);
          }}
          autoSelectConnectionId={autoSelectConnectionId}
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

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
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
        connectionMessages={connectionMessages}
      />
    </div>
  );
}