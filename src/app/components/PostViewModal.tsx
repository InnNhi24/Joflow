/**
 * Beautiful Post View Modal - Modern card design with enhanced UX
 */

import React from 'react';
import { X, MapPin, Clock, Package, Users, Check, XCircle, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Post } from '../types';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getTimeNeededLabel } from '../utils/urgencyCalculator';

interface PostViewModalProps {
  isOpen: boolean;
  post: Post | null;
  currentUserId: string;
  onClose: () => void;
  onConnect?: (postId: string) => void;
  onConfirm?: (postId: string, connectionId: string) => void;
  onCancel?: (postId: string, connectionId: string) => void;
  connectionMessages?: Record<string, any[]>; // Messages for each connection
  // Navigation props
  allPosts?: Post[]; // All available posts for navigation
  onNavigate?: (post: Post) => void; // Callback when navigating to another post
}

export default function PostViewModal({ 
  isOpen, 
  post, 
  currentUserId, 
  onClose, 
  onConnect, 
  onConfirm, 
  onCancel, 
  connectionMessages,
  allPosts = [],
  onNavigate
}: PostViewModalProps) {
  if (!isOpen || !post) return null;

  const CategoryIcon = getCategoryIcon(post.category);
  const isMyPost = post.userId === currentUserId;
  
  // Check if current user is connected to this post
  // For post owner: check if there are any connections
  // For other users: check if they are in the connections list
  const myConnection = isMyPost 
    ? post.connections[0] // Post owner sees the first connection (if any)
    : post.connections.find(conn => conn.connectedUserId === currentUserId);
  const isConnected = !!myConnection;
  
  // Check if there are messages in this connection
  const hasMessages = myConnection && connectionMessages && connectionMessages[myConnection.id] && connectionMessages[myConnection.id].length > 0;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Beautiful Header with Gradient */}
        <div className={`relative p-6 text-white overflow-hidden ${
          post.role === 'giver' 
            ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700' 
            : 'bg-gradient-to-br from-red-500 via-red-600 to-pink-700'
        }`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <CategoryIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">{post.item}</h3>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium capitalize">
                    {post.role}
                  </span>
                  <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium capitalize">
                    {post.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-2xl transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Compact Content */}
        <div className="p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {/* Key Information - Compact Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-gray-600">QTY</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{post.quantity}</p>
            </div>
            
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-semibold text-gray-600">TIME</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{getTimeNeededLabel(post.timeNeeded)}</p>
            </div>

            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-gray-600">CONN</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{post.connections.length}</p>
            </div>
          </div>

          {/* Location - Compact */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Location</span>
            </div>
            <p className="text-sm text-gray-900 font-medium">
              {post.location.address || `${post.location.lat.toFixed(4)}, ${post.location.lng.toFixed(4)}`}
            </p>
          </div>

          {/* User Info - Compact */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {post.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{post.userName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {!isMyPost && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  <MessageCircle className="w-3 h-3" />
                  {isConnected ? 'Connected' : 'Connect'}
                </div>
              )}
            </div>
          </div>

          {/* Notes - Compact */}
          {post.notes && (
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Notes</span>
              </div>
              <p className="text-sm text-gray-900">{post.notes}</p>
            </div>
          )}

          {/* Status - Compact */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</span>
              </div>
              
              <div className="flex items-center gap-2">
                {post.status === 'active' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Active
                  </span>
                )}
                {post.status === 'confirmed' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    <Check className="w-3 h-3" />
                    Confirmed
                  </span>
                )}
                {post.status === 'completed' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                    <Check className="w-3 h-3" />
                    Completed
                  </span>
                )}
                {post.status === 'cancelled' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                    <XCircle className="w-3 h-3" />
                    Cancelled
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Beautiful Footer with Action Buttons */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white p-6">
          {/* Show connection actions if user is connected OR if it's not their post */}
          {(isConnected || !isMyPost) && (
            <div className="space-y-2">
              {/* Connection Actions */}
              {!isConnected ? (
                // Show Connect button if not connected - Smaller
                <div className="flex gap-2">
                  <button
                    onClick={() => onConnect && onConnect(post.id)}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Connect & Chat
                  </button>
                  <button
                    onClick={onClose}
                    className="px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-sm font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Close
                  </button>
                </div>
              ) : (
                // Show different content based on whether messages have been exchanged
                <div className="space-y-2">
                  {myConnection && (() => {
                    // ALWAYS show confirm/cancel buttons when connected (removed hasMessages check)
                    // FIXED: Correct logic to determine user's role in connection
                    // Post owner is always the original role (giver/receiver)
                    // Connected user takes the opposite role
                    const isPostOwner = post.userId === currentUserId;
                    const userIsGiver = isPostOwner 
                      ? post.role === 'giver'  // Post owner keeps original role
                      : post.role === 'receiver'; // Connected user takes opposite role
                    
                    const needsMyConfirmation = userIsGiver 
                      ? !myConnection.giverConfirmed 
                      : !myConnection.receiverConfirmed;
                    
                    const isFullyConfirmed = myConnection.giverConfirmed && myConnection.receiverConfirmed;

                    return (
                      <>
                        {/* Connection Status - Compact */}
                        <div className="text-center p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                          <p className="text-xs text-gray-600 mb-1">Connection Status</p>
                          {isFullyConfirmed ? (
                            <div className="flex items-center justify-center gap-1 text-green-700 font-bold text-sm">
                              <Check className="w-4 h-4" />
                              <span>Both confirmed - Deal completed!</span>
                            </div>
                          ) : needsMyConfirmation ? (
                            <div className="flex items-center justify-center gap-1 text-orange-700 font-bold text-sm">
                              <Clock className="w-4 h-4" />
                              <span>Needs your confirmation</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-blue-700 font-bold text-sm">
                              <Clock className="w-4 h-4" />
                              <span>Waiting for {post.userName}</span>
                            </div>
                          )}
                          {hasMessages && (
                            <p className="text-xs text-gray-500 mt-1">
                              💬 {connectionMessages && myConnection && connectionMessages[myConnection.id] ? connectionMessages[myConnection.id].length : 0} messages exchanged
                            </p>
                          )}
                        </div>

                        {/* Action Buttons - Smaller */}
                        <div className="flex gap-2">
                          {/* Always show Confirm button if not fully confirmed */}
                          {!isFullyConfirmed && onConfirm && (
                            <button
                              onClick={() => onConfirm(post.id, myConnection.id)}
                              className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              {needsMyConfirmation ? 'Confirm Deal' : 'Confirm Again'}
                            </button>
                          )}
                          {/* Always show Cancel button */}
                          {onCancel && (
                            <button
                              onClick={() => onCancel(post.id, myConnection.id)}
                              className="px-3 py-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-sm font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={onClose}
                            className="px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-sm font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            Close
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
          
          {/* For post owner with no connections - just close button */}
          {isMyPost && !isConnected && (
            <button
              onClick={onClose}
              className="w-full px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-sm font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Close
            </button>
          )}

        </div>
      </div>
    </div>
  );
}