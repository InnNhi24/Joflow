/**
 * My Posts Panel - Manage User's Own Posts
 */

import { useState } from 'react';
import { ArrowLeft, FileText, Edit2, Trash2, Eye, Users, CheckCheck, Clock, MapPin, Package, Search, Loader2 } from 'lucide-react';
import { Post, ItemCategory, TimeNeeded } from '../types';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getTimeNeededLabel, calculateUrgency } from '../utils/urgencyCalculator';
import { geocodeAddress } from '../utils/geolocation';
import ConfirmModal from './ConfirmModal';

interface MyPostsPanelProps {
  posts: Post[];
  currentUserId: string;
  currentUserLocation: { lat: number; lng: number };
  onClose: () => void;
  onEditPost: (postId: string, updates: {
    item: string;
    quantity: number;
    timeNeeded: TimeNeeded;
    notes: string;
    location?: { lat: number; lng: number; address?: string };
  }) => void;
  onDeletePost: (postId: string) => void;
  onViewPost: (post: Post) => void;
}

export default function MyPostsPanel({
  posts,
  currentUserId,
  currentUserLocation,
  onClose,
  onEditPost,
  onDeletePost,
  onViewPost
}: MyPostsPanelProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    item: '',
    quantity: 1,
    timeNeeded: '24hours' as TimeNeeded,
    notes: '',
    useCurrentLocation: true,
    manualAddress: '',
    geocodedLocation: null as { lat: number; lng: number; address?: string } | null
  });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'warning' | 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Get only current user's posts
  const myPosts = posts.filter(p => p.userId === currentUserId);
  
  const activePosts = myPosts.filter(p => p.status === 'active');
  const confirmedPosts = myPosts.filter(p => p.status === 'confirmed');
  const otherPosts = myPosts.filter(p => p.status !== 'active' && p.status !== 'confirmed');

  const handleEdit = (post: Post) => {
    setSelectedPost(post);
    setEditForm({
      item: post.item,
      quantity: post.quantity,
      timeNeeded: post.timeNeeded,
      notes: post.notes || '',
      useCurrentLocation: true,
      manualAddress: post.location.address || '',
      geocodedLocation: post.location.address ? {
        lat: post.location.lat,
        lng: post.location.lng,
        address: post.location.address
      } : null
    });
    setIsEditing(true);
    setGeocodingError('');
  };

  const handleGeocodeAddress = async () => {
    if (!editForm.manualAddress.trim()) {
      setGeocodingError('Please enter an address');
      return;
    }

    setIsGeocoding(true);
    setGeocodingError('');
    
    try {
      const result = await geocodeAddress(editForm.manualAddress);
      
      if (result) {
        // Validate coordinates are reasonable
        if (Math.abs(result.lat) < 0.001 && Math.abs(result.lng) < 0.001) {
          setGeocodingError('Invalid coordinates returned. Please try a more specific address.');
          setEditForm({ ...editForm, geocodedLocation: null });
          return;
        }
        
        setEditForm({ 
          ...editForm, 
          geocodedLocation: { 
            lat: result.lat, 
            lng: result.lng, 
            address: result.address 
          } 
        });
        setGeocodingError('');
      } else {
        setGeocodingError('Address not found. Please try a more specific address.');
        setEditForm({ ...editForm, geocodedLocation: null });
      }
    } catch (error) {
      setGeocodingError('Failed to find address. Please check your internet connection.');
      setEditForm({ ...editForm, geocodedLocation: null });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSaveEdit = () => {
    if (!selectedPost) return;
    
    // Validate manual location if not using current location
    if (!editForm.useCurrentLocation && !editForm.geocodedLocation) {
      setConfirmModal({
        isOpen: true,
        title: 'Missing Location',
        message: 'Please search for an address first, or choose to keep the current location.',
        onConfirm: () => {
          setConfirmModal({ ...confirmModal, isOpen: false });
        },
        type: 'warning'
      });
      return;
    }
    
    const updates = {
      item: editForm.item,
      quantity: editForm.quantity,
      timeNeeded: editForm.timeNeeded,
      notes: editForm.notes,
      location: editForm.useCurrentLocation 
        ? undefined // Keep current location
        : editForm.geocodedLocation || undefined
    };
    
    onEditPost(selectedPost.id, updates);
    setIsEditing(false);
    setSelectedPost(null);
  };

  const handleDelete = (post: Post) => {
    if (post.connections.length > 0) {
      setConfirmModal({
        isOpen: true,
        title: 'Delete Post with Connections?',
        message: `This post has ${post.connections.length} active connection(s). Deleting this post will also remove all connections.\n\nAre you sure you want to continue?`,
        onConfirm: () => {
          onDeletePost(post.id);
          setConfirmModal({ ...confirmModal, isOpen: false });
        },
        type: 'danger'
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Delete Post?',
        message: 'Are you sure you want to delete this post? This action cannot be undone.',
        onConfirm: () => {
          onDeletePost(post.id);
          setConfirmModal({ ...confirmModal, isOpen: false });
        },
        type: 'danger'
      });
    }
  };

  const getStatusBadge = (post: Post) => {
    switch (post.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Active
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
            <CheckCheck className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
            Cancelled
          </span>
        );
    }
  };

  const getUrgencyColor = (urgency: number) => {
    if (urgency >= 4) return 'bg-red-100 text-red-700 border-red-200';
    if (urgency === 3) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (urgency === 2) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Map</span>
          </button>
          
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">My Posts</h2>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
              {myPosts.length}
            </span>
          </div>
          
          <div className="w-24"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {myPosts.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-16">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
            <p className="text-gray-500 mb-6">Create your first post to start connecting with others</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#1261A6] text-white rounded-lg hover:bg-[#126DA6] transition-colors"
            >
              Create Post
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Active Posts */}
            {activePosts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Active Posts ({activePosts.length})
                </h3>
                <div className="space-y-3">
                  {activePosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onView={onViewPost}
                      getStatusBadge={getStatusBadge}
                      getUrgencyColor={getUrgencyColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed Posts */}
            {confirmedPosts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-blue-600" />
                  Confirmed Posts ({confirmedPosts.length})
                </h3>
                <div className="space-y-3">
                  {confirmedPosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onView={onViewPost}
                      getStatusBadge={getStatusBadge}
                      getUrgencyColor={getUrgencyColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Posts */}
            {otherPosts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Past Posts ({otherPosts.length})
                </h3>
                <div className="space-y-3">
                  {otherPosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onView={onViewPost}
                      getStatusBadge={getStatusBadge}
                      getUrgencyColor={getUrgencyColor}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && selectedPost && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsEditing(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1261A6] to-[#0f4f85] text-white p-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                Edit Post
              </h3>
              <p className="text-blue-100 mt-1">Update your post details and location</p>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Description
                </label>
                <input
                  type="text"
                  value={editForm.item}
                  onChange={(e) => setEditForm({ ...editForm, item: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1261A6] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1261A6] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Needed
                </label>
                <select
                  value={editForm.timeNeeded}
                  onChange={(e) => setEditForm({ ...editForm, timeNeeded: e.target.value as TimeNeeded })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1261A6] focus:border-transparent"
                >
                  <option value="1hour">Within 1 hour ⚡ (Critical)</option>
                  <option value="6hours">Within 6 hours 🔥 (High)</option>
                  <option value="24hours">Within 24 hours ⏰ (Moderate)</option>
                  <option value="3days">Within 3 days 📅 (Low)</option>
                  <option value="1week">Within 1 week 📆 (Minimal)</option>
                </select>
              </div>

              {/* Location Section */}
              <div className="border border-gray-200 rounded-xl p-4">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={editForm.useCurrentLocation}
                    onChange={(e) => setEditForm({ ...editForm, useCurrentLocation: e.target.checked })}
                    className="w-4 h-4 accent-[#1261A6]"
                  />
                  <MapPin className="w-4 h-4 text-[#1261A6]" />
                  <span className="text-sm font-medium text-gray-700">Keep current location</span>
                </label>
                
                {/* Current Location Display */}
                {selectedPost && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Current Location:</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedPost.location.address || `${selectedPost.location.lat.toFixed(4)}, ${selectedPost.location.lng.toFixed(4)}`}
                    </p>
                  </div>
                )}
              </div>

              {!editForm.useCurrentLocation && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter New Address
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editForm.manualAddress}
                        onChange={(e) => {
                          setEditForm({ ...editForm, manualAddress: e.target.value });
                          setGeocodingError('');
                          setEditForm({ ...editForm, manualAddress: e.target.value, geocodedLocation: null });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleGeocodeAddress();
                          }
                        }}
                        placeholder="e.g., 123 Nguyen Hue Street, District 1, Ho Chi Minh City"
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1261A6] focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleGeocodeAddress}
                        disabled={isGeocoding || !editForm.manualAddress.trim()}
                        className="px-4 py-3 bg-[#1261A6] text-white rounded-xl hover:bg-[#0f4f85] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {isGeocoding ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                        {isGeocoding ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                    
                    {/* Error Message */}
                    {geocodingError && (
                      <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                        ⚠️ {geocodingError}
                      </p>
                    )}
                    
                    {/* Success Message */}
                    {editForm.geocodedLocation && !geocodingError && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 font-medium flex items-center gap-1">
                          ✅ Address found successfully!
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Coordinates: {editForm.geocodedLocation.lat.toFixed(4)}, {editForm.geocodedLocation.lng.toFixed(4)}
                        </p>
                        {editForm.geocodedLocation.address && (
                          <p className="text-xs text-green-600 mt-1">
                            {editForm.geocodedLocation.address}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Helper Text */}
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Try to be specific: include street number, district, and city for best results
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1261A6] focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 flex gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#1261A6] to-[#0f4f85] text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
}

// Post Card Component
function PostCard({
  post,
  onEdit,
  onDelete,
  onView,
  getStatusBadge,
  getUrgencyColor
}: {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  onView: (post: Post) => void;
  getStatusBadge: (post: Post) => JSX.Element;
  getUrgencyColor: (urgency: number) => string;
}) {
  const CategoryIcon = getCategoryIcon(post.category);
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${
          post.role === 'giver' ? 'bg-blue-500' : 'bg-red-500'
        }`}>
          <CategoryIcon className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">{post.item}</h4>
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge(post)}
                <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getUrgencyColor(post.urgency)}`}>
                  {getTimeNeededLabel(post.timeNeeded)}
                </span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              <span>{post.quantity}x</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{post.connections.length} connections</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Notes */}
          {post.notes && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.notes}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onView(post)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            
            {post.status === 'active' && (
              <button
                onClick={() => onEdit(post)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
            
            <button
              onClick={() => onDelete(post)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
