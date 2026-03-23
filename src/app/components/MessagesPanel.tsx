/**
 * Messages Panel - Connection Chat Interface
 */

import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { ArrowLeft, MessageCircle, Package, MapPin, Clock, Send, CheckCheck } from 'lucide-react';
import { Post, Connection } from '../types';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getTimeNeededLabel } from '../utils/urgencyCalculator';
import { calculateDistance } from '../utils/matchingEngine';
import { messageService, DatabaseMessage, supabase } from '../services/supabase';
import { toast } from 'sonner';

interface MessagesPanelProps {
  posts: Post[];
  currentUserId: string;
  currentUserLocation: { lat: number; lng: number };
  onClose: () => void;
  onViewPost: (postId: string) => void;
  onUnreadCountChange?: (count: number) => void;
  autoSelectConnectionId?: string | null;
}

export default function MessagesPanel({ 
  posts, 
  currentUserId, 
  currentUserLocation,
  onClose,
  onViewPost,
  onUnreadCountChange,
  autoSelectConnectionId
}: MessagesPanelProps) {
  // Get all connections involving current user
  const myConnections = posts.flatMap(post => 
    post.connections
      .filter(conn => 
        post.userId === currentUserId || 
        conn.connectedUserId === currentUserId
      )
      .map(conn => ({
        post,
        connection: conn,
        otherUserId: post.userId === currentUserId ? conn.connectedUserId : post.userId,
        otherUserName: post.userId === currentUserId 
          ? (conn.users?.name || 'Connected User')
          : post.userName
      }))
  );

  const [selectedConnection, setSelectedConnection] = useState<typeof myConnections[0] | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Record<string, DatabaseMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages for a connection
  const loadMessages = async (connectionId: string) => {
    if (loadingMessages[connectionId]) {
      console.log(`⏳ Already loading messages for connection: ${connectionId}`);
      return;
    }
    
    console.log(`🔄 Starting to load messages for connection: ${connectionId}`);
    setLoadingMessages(prev => ({ ...prev, [connectionId]: true }));
    
    try {
      const { data, error } = await messageService.getConnectionMessages(connectionId);
      
      if (error) {
        console.error('❌ Error loading messages:', error);
        return;
      }
      
      console.log(`📨 Loaded ${data?.length || 0} messages for connection ${connectionId}:`, data);
      setMessages(prev => ({ ...prev, [connectionId]: data || [] }));
      
      // DON'T mark messages as read when loading - only when actually viewing
      const unreadMessages = data?.filter(msg => 
        !msg.read_at && msg.sender_id !== currentUserId
      ) || [];
      
      console.log(`📊 Connection ${connectionId}: Total messages: ${data?.length || 0}, Unread: ${unreadMessages.length}`);
      
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    } finally {
      setLoadingMessages(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  // Load messages when connection is selected
  useEffect(() => {
    if (selectedConnection) {
      // Only load if we don't have messages for this connection yet
      if (!messages[selectedConnection.connection.id] || messages[selectedConnection.connection.id].length === 0) {
        console.log('📥 Loading messages for newly selected connection:', selectedConnection.connection.id);
        loadMessages(selectedConnection.connection.id);
      } else {
        console.log('✅ Messages already loaded for connection:', selectedConnection.connection.id, 'Count:', messages[selectedConnection.connection.id].length);
      }
    }
  }, [selectedConnection]);

  // Auto-select connection when specified
  useEffect(() => {
    if (autoSelectConnectionId && myConnections.length > 0) {
      const connectionToSelect = myConnections.find(conn => conn.connection.id === autoSelectConnectionId);
      if (connectionToSelect) {
        console.log('🎯 Auto-selecting connection:', autoSelectConnectionId);
        setSelectedConnection(connectionToSelect);
      }
    }
  }, [autoSelectConnectionId, myConnections.length]);

  // Load messages for all connections on mount to get unread counts
  useEffect(() => {
    console.log('🚀 Loading messages for all connections on mount');
    console.log('📋 My connections:', myConnections.map(c => ({ id: c.connection.id, otherUser: c.otherUserName })));
    
    if (myConnections.length > 0) {
      myConnections.forEach(conn => {
        console.log(`📥 Loading messages for connection: ${conn.connection.id}`);
        loadMessages(conn.connection.id);
      });
    } else {
      console.log('❌ No connections found to load messages for');
    }
  }, [myConnections.length]); // Only run when connections change

  // Mark messages as read when viewing a conversation (with delay)
  useEffect(() => {
    if (selectedConnection && messages[selectedConnection.connection.id]) {
      const connectionMessages = messages[selectedConnection.connection.id];
      const unreadMessages = connectionMessages.filter(msg => 
        !msg.read_at && msg.sender_id !== currentUserId
      );
      
      console.log('📖 Viewing conversation:', selectedConnection.connection.id, 'Unread count:', unreadMessages.length);
      console.log('📋 Unread messages:', unreadMessages.map(m => ({ id: m.id, read_at: m.read_at, sender_id: m.sender_id })));
      
      if (unreadMessages.length > 0) {
        // Add delay before marking as read (user needs time to actually read)
        const markAsReadTimer = setTimeout(async () => {
          console.log('⏰ Marking messages as read after viewing delay');
          console.log('🔍 About to call markAllMessagesAsRead with:', {
            connectionId: selectedConnection.connection.id,
            userId: currentUserId,
            unreadCount: unreadMessages.length
          });
          
          try {
            const result = await messageService.markAllMessagesAsRead(selectedConnection.connection.id, currentUserId);
            console.log('📊 markAllMessagesAsRead result:', result);
            
            if (!result.error) {
              console.log('✅ Successfully marked messages as read, affected:', result.data?.length || 0);
              // Update local state for all unread messages
              setMessages(prev => {
                const updatedMessages = prev[selectedConnection.connection.id].map(m =>
                  !m.read_at && m.sender_id !== currentUserId 
                    ? { ...m, read_at: new Date().toISOString() } 
                    : m
                );
                console.log('🔄 Local state updated, new messages:', updatedMessages.filter(m => !m.read_at && m.sender_id !== currentUserId).length, 'unread');
                
                // Force re-calculation of unread count after state update
                setTimeout(() => {
                  const newUnreadCount = myConnections.reduce((sum, conn) => {
                    const connMessages = (conn.connection.id === selectedConnection.connection.id ? updatedMessages : prev[conn.connection.id]) || [];
                    return sum + connMessages.filter(m => !m.read_at && m.sender_id !== currentUserId).length;
                  }, 0);
                  console.log('🔢 Recalculated total unread after mark as read:', newUnreadCount);
                  if (onUnreadCountChange) {
                    onUnreadCountChange(newUnreadCount);
                  }
                }, 100);
                
                return {
                  ...prev,
                  [selectedConnection.connection.id]: updatedMessages
                };
              });
            } else {
              console.error('❌ Failed to mark messages as read:', result.error);
            }
          } catch (error) {
            console.error('💥 Exception in markAllMessagesAsRead:', error);
          }
        }, 2000); // 2 second delay to actually read messages

        return () => {
          console.log('🧹 Cleaning up mark as read timer');
          clearTimeout(markAsReadTimer);
        };
      }
    }
  }, [selectedConnection?.connection.id, currentUserId]); // Remove messages dependency to avoid re-running

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedConnection) return;

    const connectionId = selectedConnection.connection.id;
    
    console.log('Setting up real-time subscription for connection:', connectionId);
    
    // Subscribe to new messages for this connection
    const messagesSubscription = supabase
      .channel(`messages-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('🆕 New message received via real-time:', payload.new);
          const newMessage = payload.new as DatabaseMessage;
          
          // Only handle messages for this connection
          if (newMessage.connection_id === connectionId) {
            // Add new message to local state (avoid duplicates)
            setMessages(prev => {
              const existingMessages = prev[connectionId] || [];
              const messageExists = existingMessages.some(msg => msg.id === newMessage.id);
              
              if (!messageExists) {
                console.log('➕ Adding new message to local state:', newMessage.id);
                return {
                  ...prev,
                  [connectionId]: [...existingMessages, newMessage]
                };
              }
              console.log('⚠️ Message already exists, skipping:', newMessage.id);
              return prev;
            });

            // Mark as read if not from current user
            if (newMessage.sender_id !== currentUserId) {
              // Auto-mark as read if this conversation is currently selected
              if (selectedConnection && newMessage.connection_id === selectedConnection.connection.id) {
                setTimeout(async () => {
                  console.log('📖 Auto-marking new message as read:', newMessage.id);
                  const { error } = await messageService.markMessageAsRead(newMessage.id);
                  if (!error) {
                    // Update local state
                    setMessages(prev => ({
                      ...prev,
                      [newMessage.connection_id]: prev[newMessage.connection_id].map(m =>
                        m.id === newMessage.id ? { ...m, read_at: new Date().toISOString() } : m
                      )
                    }));
                    console.log('✅ New message auto-marked as read');
                  }
                }, 500); // Small delay to ensure message is displayed first
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('🔄 Message updated via real-time:', payload.new);
          const updatedMessage = payload.new as DatabaseMessage;
          
          // Only handle messages for this connection
          if (updatedMessage.connection_id === connectionId) {
            console.log('📝 Updating message in local state:', updatedMessage.id, 'read_at:', updatedMessage.read_at);
            // Update message in local state
            setMessages(prev => ({
              ...prev,
              [connectionId]: (prev[connectionId] || []).map(msg =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log('Messages subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to messages for connection:', connectionId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to messages for connection:', connectionId);
        }
      });

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [selectedConnection, currentUserId]); // Added selectedConnection dependency

  // Real-time subscription for all messages (for unread count)
  useEffect(() => {
    if (myConnections.length === 0) return;

    const connectionIds = myConnections.map(conn => conn.connection.id);
    
    console.log('Setting up global messages subscription for connections:', connectionIds);
    
    // Subscribe to all messages for unread count updates (only if no specific connection selected)
    if (selectedConnection) return; // Skip global subscription when specific connection is selected
    
    const allMessagesSubscription = supabase
      .channel('all-messages-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('New message for unread count:', payload.new);
          const newMessage = payload.new as DatabaseMessage;
          
          // Only handle messages for our connections
          if (connectionIds.includes(newMessage.connection_id)) {
            console.log('Message is for one of our connections:', newMessage.connection_id);
            // Add to messages state if not already there
            setMessages(prev => {
              const connectionMessages = prev[newMessage.connection_id] || [];
              const messageExists = connectionMessages.some(msg => msg.id === newMessage.id);
              
              if (!messageExists) {
                console.log('Adding message to global state:', newMessage);
                return {
                  ...prev,
                  [newMessage.connection_id]: [...connectionMessages, newMessage]
                };
              }
              console.log('Message already exists in global state, skipping:', newMessage.id);
              return prev;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const updatedMessage = payload.new as DatabaseMessage;
          
          // Only handle messages for our connections
          if (connectionIds.includes(updatedMessage.connection_id)) {
            setMessages(prev => ({
              ...prev,
              [updatedMessage.connection_id]: (prev[updatedMessage.connection_id] || []).map(msg =>
                msg.id === updatedMessage.id ? updatedMessage : msg
              )
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log('All messages subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to all messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to all messages');
        }
      });

    return () => {
      supabase.removeChannel(allMessagesSubscription);
    };
  }, [myConnections, selectedConnection, currentUserId]); // Added selectedConnection dependency

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedConnection]);

  const getUnreadCount = (connectionId: string) => {
    const connectionMessages = messages[connectionId] || [];
    const unreadMessages = connectionMessages.filter(m => !m.read_at && m.sender_id !== currentUserId);
    console.log(`🔍 Connection ${connectionId}: Total: ${connectionMessages.length}, Unread: ${unreadMessages.length}`);
    if (unreadMessages.length > 0) {
      console.log('📋 Unread messages details:', unreadMessages.map(m => ({ 
        id: m.id, 
        read_at: m.read_at, 
        sender_id: m.sender_id,
        message: m.message.substring(0, 20) + '...'
      })));
    }
    return unreadMessages.length;
  };

  const totalUnread = myConnections.reduce((sum, conn) => 
    sum + getUnreadCount(conn.connection.id), 0
  );
  
  console.log(`📊 Total unread messages: ${totalUnread}`);

  // Notify Dashboard when unread count changes
  useEffect(() => {
    if (onUnreadCountChange) {
      console.log('📤 Notifying Dashboard of unread count change:', totalUnread);
      onUnreadCountChange(totalUnread);
    }
  }, [totalUnread, onUnreadCountChange]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConnection || sendingMessage) return;
    
    setSendingMessage(true);
    
    try {
      const { data, error } = await messageService.sendMessage(
        selectedConnection.connection.id,
        currentUserId,
        messageText.trim()
      );
      
      if (error) {
        toast.error('Failed to send message');
        return;
      }
      
      // Add message to local state immediately for better UX
      if (data) {
        setMessages(prev => ({
          ...prev,
          [selectedConnection.connection.id]: [
            ...(prev[selectedConnection.connection.id] || []),
            data
          ]
        }));
      }
      
      setMessageText('');
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Map</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-96 border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="text-sm font-semibold text-gray-900">
              Active Conversations ({myConnections.length})
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {myConnections.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No conversations yet</p>
                <p className="text-gray-400 text-xs mt-1">Connect with others to start chatting</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {myConnections.map((item) => {
                  const unread = getUnreadCount(item.connection.id);
                  const CategoryIcon = getCategoryIcon(item.post.category);
                  const distance = calculateDistance(
                    currentUserLocation.lat,
                    currentUserLocation.lng,
                    item.post.location.lat,
                    item.post.location.lng
                  );
                  
                  return (
                    <button
                      key={item.connection.id}
                      onClick={() => {
                        console.log('🖱️ Selecting connection:', item.connection.id);
                        setSelectedConnection(item);
                        
                        // DON'T mark as read immediately - only when actually viewing messages
                        // The useEffect below will handle marking as read when viewing conversation
                      }}
                      className={`w-full p-4 text-left hover:bg-white transition-colors ${
                        selectedConnection?.connection.id === item.connection.id 
                          ? 'bg-white border-l-4 border-[#1261A6]' 
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                          item.post.role === 'giver' ? 'bg-blue-500' : 'bg-red-500'
                        }`}>
                          <CategoryIcon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {item.otherUserName}
                            </h4>
                            {unread > 0 && (
                              <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                                {unread}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 truncate mb-1">
                            {item.post.item}
                          </p>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{distance.toFixed(1)} km away</span>
                          </div>
                          
                          {/* Connection status */}
                          <div className="flex items-center gap-2 mt-2">
                            {item.connection.giverConfirmed && item.connection.receiverConfirmed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                <CheckCheck className="w-3 h-3" />
                                Both Confirmed
                              </span>
                            ) : (() => {
                              // Determine user's role in this connection
                              const isPostOwner = item.post.userId === currentUserId;
                              const userIsGiver = isPostOwner 
                                ? item.post.role === 'giver'  // Post owner keeps original role
                                : item.post.role === 'receiver'; // Connected user takes opposite role
                              
                              const myConfirmed = userIsGiver ? item.connection.giverConfirmed : item.connection.receiverConfirmed;
                              const theirConfirmed = userIsGiver ? item.connection.receiverConfirmed : item.connection.giverConfirmed;
                              
                              if (theirConfirmed && !myConfirmed) {
                                // Other person confirmed, waiting for me
                                return <span className="text-xs text-orange-600 font-medium">Needs your confirmation</span>;
                              } else if (myConfirmed && !theirConfirmed) {
                                // I confirmed, waiting for them
                                return <span className="text-xs text-gray-500">Waiting for {item.otherUserName}...</span>;
                              } else {
                                // Neither confirmed yet
                                return <span className="text-xs text-gray-500">Connected - Start chatting</span>;
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConnection ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    selectedConnection.post.role === 'giver' ? 'bg-blue-500' : 'bg-red-500'
                  }`}>
                    {React.createElement(getCategoryIcon(selectedConnection.post.category), { className: 'w-5 h-5' })}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedConnection.otherUserName}</h3>
                    <p className="text-sm text-gray-600">{selectedConnection.post.item}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => onViewPost(selectedConnection.post.id)}
                  className="px-3 py-1.5 text-sm text-[#1261A6] hover:bg-blue-50 rounded-lg transition-colors"
                >
                  View Post
                </button>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {loadingMessages[selectedConnection.connection.id] ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-[#1261A6] border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-gray-500 text-sm">Loading messages...</p>
                </div>
              ) : (messages[selectedConnection.connection.id] || []).length > 0 ? (
                <>
                  {(messages[selectedConnection.connection.id] || []).map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md ${isMe ? 'bg-[#1261A6] text-white' : 'bg-white border border-gray-200 text-gray-900'} rounded-2xl px-4 py-2.5 shadow-sm`}>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No messages yet</p>
                  <p className="text-gray-400 text-xs mt-1">Start the conversation!</p>
                </div>
              )}
            </div>
            
            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !sendingMessage && handleSendMessage()}
                  placeholder="Type a message..."
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1261A6] focus:border-transparent disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendingMessage}
                  className="px-4 py-2.5 bg-[#1261A6] text-white rounded-lg hover:bg-[#126DA6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {sendingMessage ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}