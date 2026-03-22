/**
 * Messages Panel - Connection Chat Interface
 */

import { useState, useEffect } from 'react';
import React from 'react';
import { ArrowLeft, MessageCircle, Package, MapPin, Clock, Send, CheckCheck } from 'lucide-react';
import { Post, Connection } from '../types';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getTimeNeededLabel } from '../utils/urgencyCalculator';
import { calculateDistance } from '../utils/matchingEngine';
import { messageService, DatabaseMessage } from '../services/supabase';
import { toast } from 'sonner';

interface MessagesPanelProps {
  posts: Post[];
  currentUserId: string;
  currentUserLocation: { lat: number; lng: number };
  onClose: () => void;
  onViewPost: (postId: string) => void;
}

export default function MessagesPanel({ 
  posts, 
  currentUserId, 
  currentUserLocation,
  onClose,
  onViewPost
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
        otherUserName: post.userId === currentUserId ? conn.connectedUserName : post.userName
      }))
  );

  const [selectedConnection, setSelectedConnection] = useState<typeof myConnections[0] | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Record<string, DatabaseMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});
  const [sendingMessage, setSendingMessage] = useState(false);

  // Load messages for a connection
  const loadMessages = async (connectionId: string) => {
    if (loadingMessages[connectionId]) return;
    
    setLoadingMessages(prev => ({ ...prev, [connectionId]: true }));
    
    try {
      const { data, error } = await messageService.getConnectionMessages(connectionId);
      
      if (error) {
        console.error('Error loading messages:', error);
        return;
      }
      
      setMessages(prev => ({ ...prev, [connectionId]: data || [] }));
      
      // Mark messages as read
      const unreadMessages = data?.filter(msg => 
        !msg.read_at && msg.sender_id !== currentUserId
      ) || [];
      
      for (const msg of unreadMessages) {
        await messageService.markMessageAsRead(msg.id);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  // Load messages when connection is selected
  useEffect(() => {
    if (selectedConnection) {
      loadMessages(selectedConnection.connection.id);
    }
  }, [selectedConnection]);

  const getUnreadCount = (connectionId: string) => {
    const connectionMessages = messages[connectionId] || [];
    return connectionMessages.filter(m => !m.read_at && m.sender_id !== currentUserId).length;
  };

  const totalUnread = myConnections.reduce((sum, conn) => 
    sum + getUnreadCount(conn.connection.id), 0
  );

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
      
      // Add message to local state
      setMessages(prev => ({
        ...prev,
        [selectedConnection.connection.id]: [
          ...(prev[selectedConnection.connection.id] || []),
          data
        ]
      }));
      
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
                    currentUserLocation,
                    item.post.location
                  );
                  
                  return (
                    <button
                      key={item.connection.id}
                      onClick={() => setSelectedConnection(item)}
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
                            ) : item.post.role === 'giver' ? (
                              item.connection.giverConfirmed ? (
                                <span className="text-xs text-gray-500">Waiting for receiver...</span>
                              ) : (
                                <span className="text-xs text-orange-600 font-medium">Needs your confirmation</span>
                              )
                            ) : (
                              item.connection.receiverConfirmed ? (
                                <span className="text-xs text-gray-500">Waiting for giver...</span>
                              ) : (
                                <span className="text-xs text-orange-600 font-medium">Needs your confirmation</span>
                              )
                            )}
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
                (messages[selectedConnection.connection.id] || []).map((msg) => {
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
                })
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