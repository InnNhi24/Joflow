/**
 * Supabase Configuration and Services
 * Real-time database for JOFLOW Vietnam
 */

import { createClient } from '@supabase/supabase-js'
import { Post, Connection, UserRole, ItemCategory, TimeNeeded, PostStatus } from '../types'

// Supabase configuration with validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file:\n' +
    '- VITE_SUPABASE_URL=your_supabase_project_url\n' +
    '- VITE_SUPABASE_ANON_KEY=your_supabase_anon_key'
  );
}

if (supabaseUrl === 'your_supabase_url_here' || supabaseAnonKey === 'your_supabase_anon_key_here') {
  throw new Error(
    'Please update your Supabase environment variables in .env.local with actual values'
  );
}

// Create Supabase client - real database connection
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface DatabaseUser {
  id: string
  name: string
  phone: string
  email?: string
  location_lat: number
  location_lng: number
  location_name: string
  role?: UserRole // Add role field
  created_at: string
  updated_at: string
}

export interface DatabasePost {
  id: string
  user_id: string
  role: UserRole
  category: ItemCategory
  item: string
  quantity: number
  urgency: number
  time_needed: TimeNeeded
  notes?: string
  location_lat: number
  location_lng: number
  location_address?: string
  status: PostStatus
  created_at: string
  updated_at: string
}

export interface DatabaseConnection {
  id: string
  post_id: string
  connected_user_id: string
  giver_confirmed: boolean
  receiver_confirmed: boolean
  chat_active: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseMessage {
  id: string
  connection_id: string
  sender_id: string
  message: string
  message_type: 'text' | 'image' | 'location' | 'system'
  read_at?: string
  created_at: string
}

/**
 * Database Schema for JOFLOW Vietnam
 * 
 * Tables to create in Supabase:
 * 
 * 1. users
 *    - id: uuid (primary key)
 *    - name: text
 *    - phone: text
 *    - email: text (optional)
 *    - location_lat: float8
 *    - location_lng: float8
 *    - location_name: text
 *    - created_at: timestamp
 *    - updated_at: timestamp
 * 
 * 2. posts
 *    - id: uuid (primary key)
 *    - user_id: uuid (foreign key to users)
 *    - role: text ('giver' | 'receiver')
 *    - category: text
 *    - item: text
 *    - quantity: integer
 *    - urgency: integer (1-5)
 *    - time_needed: text
 *    - notes: text (optional)
 *    - location_lat: float8
 *    - location_lng: float8
 *    - location_address: text (optional)
 *    - status: text ('active' | 'confirmed' | 'completed' | 'cancelled')
 *    - created_at: timestamp
 *    - updated_at: timestamp
 * 
 * 3. connections
 *    - id: uuid (primary key)
 *    - post_id: uuid (foreign key to posts)
 *    - connected_user_id: uuid (foreign key to users)
 *    - giver_confirmed: boolean
 *    - receiver_confirmed: boolean
 *    - chat_active: boolean
 *    - created_at: timestamp
 *    - updated_at: timestamp
 * 
 * 4. messages (for future chat feature)
 *    - id: uuid (primary key)
 *    - connection_id: uuid (foreign key to connections)
 *    - sender_id: uuid (foreign key to users)
 *    - message: text
 *    - created_at: timestamp
 */

/**
 * Environment Variables needed:
 * 
 * Create .env file in project root:
 * REACT_APP_SUPABASE_URL=your_supabase_project_url
 * REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
 */

/**
 * Row Level Security (RLS) Policies for Supabase:
 * 
 * Users table:
 * - Users can read all user profiles (for displaying names)
 * - Users can only update their own profile
 * 
 * Posts table:
 * - All users can read active posts
 * - Users can only create/update/delete their own posts
 * 
 * Connections table:
 * - Users can read connections for posts they're involved in
 * - Users can create connections to any active post
 * - Users can only update connections they're part of
 * 
 * Messages table:
 * - Users can only read/write messages in connections they're part of
 */

// User Services
export const userService = {
  async createUser(userData: {
    name: string
    phone: string
    email?: string
    location: { lat: number; lng: number; name: string }
  }) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
          location_lat: userData.location.lat,
          location_lng: userData.location.lng,
          location_name: userData.location.name
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating user:', error)
      return { data: null, error }
    }
  },

  async getUserById(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user:', error)
      return { data: null, error }
    }
  },

  async updateUser(userId: string, updates: Partial<DatabaseUser>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating user:', error)
      return { data: null, error }
    }
  },

  async updateUserRole(userId: string, role: UserRole) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating user role:', error)
      return { data: null, error }
    }
  }
}

// Post Services
export const postService = {
  async createPost(postData: {
    userId: string
    role: UserRole
    category: ItemCategory
    item: string
    quantity: number
    urgency: number
    timeNeeded: TimeNeeded
    notes?: string
    location: { lat: number; lng: number; address?: string }
  }) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: postData.userId,
          role: postData.role,
          category: postData.category,
          item: postData.item,
          quantity: postData.quantity,
          urgency: postData.urgency,
          time_needed: postData.timeNeeded,
          notes: postData.notes,
          location_lat: postData.location.lat,
          location_lng: postData.location.lng,
          location_address: postData.location.address,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating post:', error)
      return { data: null, error }
    }
  },

  async getPostsInRadius(
    centerLat: number,
    centerLng: number,
    radiusKm: number = 50,
    excludeUserId?: string,
    page: number = 0,
    limit: number = 50
  ) {
    console.log('🔍 getPostsInRadius called with:', { centerLat, centerLng, radiusKm, excludeUserId, page, limit });
    
    // LOAD ALL POSTS - No radius filtering for Vietnam-wide coverage
    console.log('🌍 Loading ALL posts (no radius limit) for Vietnam-wide coverage');
    
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey(name),
          connections(
            *,
            users!connections_connected_user_id_fkey(name)
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (excludeUserId) {
        query = query.neq('user_id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log('📊 ALL posts query returned:', data?.length || 0, 'posts');
      console.log('📋 Posts details:', data?.map(p => ({ 
        id: p.id, 
        item: p.item, 
        user: p.users?.name,
        location: { lat: p.location_lat, lng: p.location_lng },
        status: p.status
      })));

      return { data, error: null };
    } catch (error) {
      console.error('❌ Error in all-posts query:', error);
      return { data: null, error };
    }
  },

  async getPostsInRadiusFallback(
    centerLat: number,
    centerLng: number,
    radiusKm: number = 50,
    excludeUserId?: string,
    page: number = 0,
    limit: number = 50
  ) {
    console.log('🔄 Using fallback method for posts in radius');
    
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          users!posts_user_id_fkey(name),
          connections(
            *,
            users!connections_connected_user_id_fkey(name)
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (excludeUserId) {
        query = query.neq('user_id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log('📊 Fallback query returned:', data?.length || 0, 'posts');

      // Filter by radius (JavaScript fallback)
      const filteredData = data?.filter(post => {
        const distance = calculateDistance(
          centerLat,
          centerLng,
          post.location_lat,
          post.location_lng
        );
        console.log(`📍 Post "${post.item}" distance: ${distance.toFixed(2)}km (limit: ${radiusKm}km)`);
        return distance <= radiusKm;
      });

      console.log('✅ Fallback filtered results:', filteredData?.length || 0, 'posts within radius');
      return { data: filteredData, error: null };
    } catch (error) {
      console.error('❌ Error fetching posts (fallback):', error);
      return { data: null, error };
    }
  },

  async getUserPosts(userId: string) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          connections(
            *,
            users!connections_connected_user_id_fkey(name)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user posts:', error)
      return { data: null, error }
    }
  },

  async updatePost(postId: string, updates: Partial<DatabasePost>) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating post:', error)
      return { data: null, error }
    }
  },

  async deletePost(postId: string) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting post:', error)
      return { error }
    }
  }
}

// Connection Services
export const connectionService = {
  async createConnection(postId: string, connectedUserId: string) {
    try {
      const { data, error } = await supabase
        .from('connections')
        .insert({
          post_id: postId,
          connected_user_id: connectedUserId,
          giver_confirmed: false,
          receiver_confirmed: false,
          chat_active: true
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error creating connection:', error)
      return { data: null, error }
    }
  },

  async updateConnection(connectionId: string, updates: Partial<DatabaseConnection>) {
    try {
      const { data, error } = await supabase
        .from('connections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', connectionId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error updating connection:', error)
      return { data: null, error }
    }
  },

  async deleteConnection(connectionId: string) {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error deleting connection:', error)
      return { error }
    }
  }
}

// Message Services
export const messageService = {
  async sendMessage(connectionId: string, senderId: string, message: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          connection_id: connectionId,
          sender_id: senderId,
          message: message,
          message_type: 'text'
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error sending message:', error)
      return { data: null, error }
    }
  },

  async getConnectionMessages(connectionId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error fetching messages:', error)
      return { data: null, error }
    }
  },

  async markMessageAsRead(messageId: string) {
    try {
      console.log('Marking message as read:', messageId);
      const { data, error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()

      if (error) {
        console.error('Error marking message as read:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('No message found to mark as read (might already be read):', messageId);
        return { data: null, error: null }
      }
      
      console.log('Message marked as read successfully:', data[0]);
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Error marking message as read:', error)
      return { data: null, error }
    }
  },

  async markAllMessagesAsRead(connectionId: string, userId: string) {
    try {
      console.log('🔄 Marking all messages as read for connection:', connectionId, 'user:', userId);
      
      // Check current user authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ No authenticated user:', userError);
        return { data: null, error: 'No authenticated user' };
      }
      console.log('👤 Current authenticated user:', user.id);
      
      // First, let's see what messages we're trying to update
      const { data: messagesToUpdate, error: selectError } = await supabase
        .from('messages')
        .select('id, message, read_at, sender_id, connection_id')
        .eq('connection_id', connectionId)
        .neq('sender_id', userId)
        .is('read_at', null);
      
      if (selectError) {
        console.error('❌ Error selecting messages to update:', selectError);
        throw selectError;
      }
      
      console.log('📋 Messages to mark as read:', messagesToUpdate?.length || 0, messagesToUpdate);
      
      if (!messagesToUpdate || messagesToUpdate.length === 0) {
        console.log('✅ No messages to mark as read');
        return { data: [], error: null };
      }

      // Try to update messages one by one for better error tracking
      const updateResults = [];
      for (const message of messagesToUpdate) {
        console.log(`🔄 Updating message ${message.id}...`);
        const { data: updateData, error: updateError } = await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('id', message.id)
          .select();
        
        if (updateError) {
          console.error(`❌ Error updating message ${message.id}:`, updateError);
          return { data: null, error: updateError };
        }
        
        if (updateData && updateData.length > 0) {
          console.log(`✅ Successfully updated message ${message.id}`);
          updateResults.push(updateData[0]);
        } else {
          console.warn(`⚠️ No data returned for message ${message.id} update`);
        }
      }
      
      console.log('✅ Successfully marked all messages as read:', updateResults.length, 'messages updated');
      console.log('📊 Updated messages:', updateResults);
      return { data: updateResults, error: null };
    } catch (error) {
      console.error('💥 Exception in markAllMessagesAsRead:', error);
      return { data: null, error };
    }
  },

  async getUnreadMessagesCount(userId: string) {
    try {
      console.log('Getting unread count for user:', userId);
      
      // Get connections where user is directly connected
      const { data: directConnections, error: directError } = await supabase
        .from('connections')
        .select('id')
        .eq('connected_user_id', userId)

      if (directError) throw directError
      console.log('Direct connections:', directConnections);

      // Get connections where user owns the post
      const { data: ownedPosts, error: postsError } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId)

      if (postsError) throw postsError
      console.log('Owned posts:', ownedPosts);

      if (ownedPosts && ownedPosts.length > 0) {
        const postIds = ownedPosts.map(p => p.id)
        const { data: ownedConnections, error: ownedError } = await supabase
          .from('connections')
          .select('id')
          .in('post_id', postIds)

        if (ownedError) throw ownedError
        console.log('Owned connections:', ownedConnections);

        // Combine all connection IDs
        const allConnections = [
          ...(directConnections || []),
          ...(ownedConnections || [])
        ]
        console.log('All connections:', allConnections);

        if (allConnections.length === 0) {
          console.log('No connections found, returning 0');
          return { data: 0, error: null }
        }

        const connectionIds = allConnections.map(c => c.id)
        console.log('Connection IDs:', connectionIds);

        // Count unread messages in those connections
        const { data, error } = await supabase
          .from('messages')
          .select('id')
          .is('read_at', null)
          .neq('sender_id', userId)
          .in('connection_id', connectionIds)

        if (error) throw error
        console.log('Unread messages query result:', data);
        console.log('📋 Unread messages details:', data?.map(m => ({ 
          id: m.id, 
          connection_id: m.connection_id, 
          sender_id: m.sender_id
        })));
        const count = data?.length || 0;
        console.log('📊 Final unread count from database:', count);
        return { data: count, error: null }
      } else {
        // Only direct connections
        if (!directConnections || directConnections.length === 0) {
          console.log('No direct connections found, returning 0');
          return { data: 0, error: null }
        }

        const connectionIds = directConnections.map(c => c.id)
        console.log('Direct connection IDs only:', connectionIds);

        // Count unread messages in those connections
        const { data, error } = await supabase
          .from('messages')
          .select('id')
          .is('read_at', null)
          .neq('sender_id', userId)
          .in('connection_id', connectionIds)

        if (error) throw error
        console.log('Unread messages query result (direct only):', data);
        const count = data?.length || 0;
        console.log('Final unread count (direct only):', count);
        return { data: count, error: null }
      }
    } catch (error) {
      console.error('Error getting unread messages count:', error)
      return { data: 0, error }
    }
  }
}

// Real-time Subscriptions
export const subscriptionService = {
  subscribeToPostsInArea(
    centerLat: number,
    centerLng: number,
    radiusKm: number,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        callback
      )
      .subscribe()
  },

  subscribeToUserConnections(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('user-connections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
          filter: `connected_user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}

// Utility function for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}