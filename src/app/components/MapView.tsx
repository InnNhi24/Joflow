/**
 * Interactive Map View with Leaflet Integration
 */

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Post, UserRole } from '../types';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getTimeNeededLabel } from '../utils/urgencyCalculator';
import { calculateDistance } from '../utils/matchingEngine';
import { createPulsingMarker, MARKER_COLORS } from './PulsingMarker';
import { formatLocationName, formatDistance } from '../utils/locationFormatter';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  posts: Post[];
  center: { lat: number; lng: number };
  currentUserId: string;
  userRole: UserRole;
  onConnect: (postId: string) => void;
  onConfirm: (postId: string, connectionId: string) => void;
  onCancel: (postId: string, connectionId: string) => void;
  highlightedPostIds?: string[];
  hoveredPostId?: string | null;
  onMarkerClick?: (post: Post) => void;
  userLocationName?: string;
  allPosts?: Post[];
}

type MarkerFilter = 'all' | 'opposite-role' | 'matches';

// Custom marker icons with beautiful design
const createCustomIcon = (color: string, isHighlighted: boolean = false, postCount: number = 1) => {
  const size = isHighlighted ? 40 : 32;
  const pulseColor = color.replace('#', '');
  
  return L.divIcon({
    html: `
      <div class="marker-container" style="
        width: ${size}px;
        height: ${size}px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Pulse animation for highlighted markers -->
        ${isHighlighted ? `
          <div class="marker-pulse" style="
            position: absolute;
            width: ${size + 20}px;
            height: ${size + 20}px;
            border-radius: 50%;
            background: ${color}20;
            animation: marker-pulse 2s infinite;
          "></div>
        ` : ''}
        
        <!-- Main marker -->
        <div class="marker-main" style="
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${size > 35 ? '12px' : '10px'};
          font-weight: bold;
          color: white;
          position: relative;
          transition: all 0.3s ease;
          cursor: pointer;
        ">
          ${postCount}
          
          <!-- Highlight star -->
          ${isHighlighted ? `
            <div style="
              position: absolute;
              top: -6px;
              right: -6px;
              width: 16px;
              height: 16px;
              background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
              border-radius: 50%;
              border: 2px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            ">⭐</div>
          ` : ''}
        </div>
      </div>
      
      <style>
        @keyframes marker-pulse {
          0% { 
            transform: scale(0.8);
            opacity: 1;
          }
          50% { 
            transform: scale(1.2);
            opacity: 0.3;
          }
          100% { 
            transform: scale(0.8);
            opacity: 1;
          }
        }
        
        .marker-main:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2), 0 3px 6px rgba(0,0,0,0.15);
        }
      </style>
    `,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};
// Component to handle map updates
function MapUpdater({ center, hoveredPostId, posts }: { 
  center: { lat: number; lng: number }; 
  hoveredPostId: string | null;
  posts: Post[];
}) {
  const map = useMap();
  
  useEffect(() => {
    if (hoveredPostId) {
      const post = posts.find(p => p.id === hoveredPostId);
      if (post) {
        map.setView([post.location.lat, post.location.lng], map.getZoom(), {
          animate: true,
          duration: 0.5
        });
      }
    }
  }, [hoveredPostId, posts, map]);
  
  return null;
}

// PopupContent component for navigation between posts
function PopupContent({ 
  post, 
  isHighlighted, 
  distance, 
  userConnection, 
  canConnect, 
  allPosts, 
  onConnect, 
  onConfirm, 
  onCancel,
  onNavigate,
  currentUserId
}: {
  post: Post;
  isHighlighted: boolean;
  distance: number;
  userConnection: any;
  canConnect: boolean;
  allPosts: Post[];
  onConnect: (postId: string) => void;
  onConfirm: (postId: string, connectionId: string) => void;
  onCancel: (postId: string, connectionId: string) => void;
  onNavigate: (postId: string) => void;
  currentUserId: string;
}) {
  const CategoryIcon = getCategoryIcon(post.category);
  
  // Navigation logic - now works with posts at same location
  const currentIndex = allPosts.findIndex(p => p.id === post.id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allPosts.length - 1;
  const previousPost = hasPrevious ? allPosts[currentIndex - 1] : null;
  const nextPost = hasNext ? allPosts[currentIndex + 1] : null;
  return (
    <div className="p-0 min-w-[280px] bg-white rounded-2xl overflow-hidden shadow-xl relative">
      {/* Navigation Buttons - Only show if multiple posts */}
      {allPosts.length > 1 && hasPrevious && (
        <button
          onClick={() => previousPost && onNavigate(previousPost.id)}
          className="absolute left-[-50px] top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center border border-gray-200"
          title="Previous post"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
      )}
      
      {allPosts.length > 1 && hasNext && (
        <button
          onClick={() => nextPost && onNavigate(nextPost.id)}
          className="absolute right-[-50px] top-1/2 transform -translate-y-1/2 z-10 w-10 h-10 bg-white/95 backdrop-blur-sm hover:bg-white text-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center border border-gray-200"
          title="Next post"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      )}

      {/* Header with gradient background */}
      <div className={`px-4 py-3 ${
        post.role === 'giver' 
          ? 'bg-gradient-to-r from-[#1261A6] to-[#2A95BF]' 
          : 'bg-gradient-to-r from-red-500 to-red-600'
      } text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {post.role === 'giver' ? '🤝 Giver' : '🙏 Receiver'}
            </span>
            {isHighlighted && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                ⭐ Top Match
              </span>
            )}
            {allPosts.length > 1 && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                {currentIndex + 1}/{allPosts.length}
              </span>
            )}
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={`w-1.5 h-6 rounded-full ${
                  i < post.urgency ? 'bg-white/90' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {/* User Info */}
        <div className="mb-4">
          <h3 className="font-bold text-gray-900 text-lg">{post.userName}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
            <span className="flex items-center gap-1">
              📍 {formatDistance(distance)}
            </span>
            <span className="flex items-center gap-1">
              ⏱️ {getTimeNeededLabel(post.timeNeeded)}
            </span>
          </div>
        </div>
        
        {/* Item Info with beautiful card */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4 border border-gray-200">
          <div className="flex items-start gap-3">
            <div className={`p-3 rounded-xl ${
              post.role === 'giver' 
                ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700' 
                : 'bg-gradient-to-br from-red-100 to-red-200 text-red-700'
            } shadow-sm`}>
              <CategoryIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 capitalize font-medium mb-1">{post.category}</p>
              <p className="font-bold text-gray-900 text-base mb-1">{post.item}</p>
              <p className="text-sm text-gray-600">Quantity: <span className="font-semibold">{post.quantity}</span></p>
            </div>
          </div>
        </div>
        
        {/* Notes */}
        {post.notes && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 text-sm">💬</span>
              <p className="text-sm text-amber-800 leading-relaxed">{post.notes}</p>
            </div>
          </div>
        )}
        
        {/* Connection Status */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <span className="text-sm text-gray-600">Connections</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < post.connections.length ? 'bg-green-400' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {post.connections.length}/5
            </span>
          </div>
        </div>
        
        {/* Actions */}
        {userConnection ? (
          <div className="space-y-3">
            <div className="text-center p-3 rounded-xl bg-green-50 border border-green-200">
              <div className="text-sm font-semibold text-green-700 mb-2">
                ✅ Connected Successfully
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2 rounded-lg text-center font-medium ${
                  (post.role === 'giver' ? userConnection.giverConfirmed : userConnection.receiverConfirmed)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  You: {(post.role === 'giver' ? userConnection.giverConfirmed : userConnection.receiverConfirmed) ? '✅' : '⏳'}
                </div>
                <div className={`p-2 rounded-lg text-center font-medium ${
                  (post.role === 'giver' ? userConnection.receiverConfirmed : userConnection.giverConfirmed)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  Them: {(post.role === 'giver' ? userConnection.receiverConfirmed : userConnection.giverConfirmed) ? '✅' : '⏳'}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {!(post.role === 'giver' ? userConnection.receiverConfirmed : userConnection.giverConfirmed) && (
                <button
                  onClick={() => onConfirm(post.id, userConnection.id)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  ✅ Confirm
                </button>
              )}
              <button
                onClick={() => onCancel(post.id, userConnection.id)}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        ) : canConnect ? (
          <button
            onClick={() => onConnect(post.id)}
            className={`w-full px-4 py-3 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${
              post.role === 'giver'
                ? 'bg-gradient-to-r from-[#1261A6] to-[#2A95BF] hover:from-[#0f4f85] hover:to-[#1e7a9a]'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }`}
          >
            🤝 Connect Now
          </button>
        ) : post.userId === currentUserId ? (
          <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-sm font-medium text-blue-700">📝 Your Post</span>
          </div>
        ) : (
          <div className="text-center p-3 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-sm text-gray-500">🚫 Max connections reached</span>
          </div>
        )}
      </div>
    </div>
  );
}
export default function MapView({ 
  posts, 
  center, 
  currentUserId,
  userRole,
  onConnect,
  onConfirm,
  onCancel,
  highlightedPostIds = [],
  hoveredPostId,
  onMarkerClick,
  userLocationName,
  allPosts = []
}: MapViewProps) {
  const [markerFilter, setMarkerFilter] = useState<MarkerFilter>('all');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentPopupPostId, setCurrentPopupPostId] = useState<string | null>(null);

  // Filter posts based on marker filter
  const visiblePosts = posts.filter(post => {
    if (markerFilter === 'all') return true;
    if (markerFilter === 'opposite-role') return post.role !== userRole;
    if (markerFilter === 'matches') return highlightedPostIds.includes(post.id);
    return true;
  });
  
  // Determine opposite role for legend
  const oppositeRole = userRole === 'giver' ? 'receiver' : 'giver';
  
  // Current user marker icon with beautiful design
  const currentUserIcon = L.divIcon({
    html: `
      <div class="current-user-marker" style="
        width: 36px;
        height: 36px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Animated ring -->
        <div style="
          position: absolute;
          width: 36px;
          height: 36px;
          border: 3px solid #10b981;
          border-radius: 50%;
          animation: user-pulse 3s infinite;
          opacity: 0.6;
        "></div>
        
        <!-- Main marker -->
        <div style="
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3), 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: bold;
          color: white;
          position: relative;
        ">
          YOU
        </div>
      </div>
      
      <style>
        @keyframes user-pulse {
          0% { 
            transform: scale(0.8);
            opacity: 0.8;
          }
          50% { 
            transform: scale(1.3);
            opacity: 0.2;
          }
          100% { 
            transform: scale(0.8);
            opacity: 0.8;
          }
        }
      </style>
    `,
    className: 'current-user-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  return (
    <div className="h-full w-full relative">
      {/* Loading overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#D5E7F2] via-white to-[#73C6D9]/20 flex items-center justify-center z-[2000]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#126DA6]/20 border-t-[#126DA6] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#126DA6] font-semibold">Loading beautiful map...</p>
          </div>
        </div>
      )}
      
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
        whenReady={() => setIsMapLoaded(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <MapUpdater center={center} hoveredPostId={hoveredPostId || null} posts={posts} />
        
        {/* Current User Marker */}
        <Marker
          position={[center.lat, center.lng]}
          icon={currentUserIcon}
        >
          <Popup>
            <div className="text-center p-2">
              <div className="font-semibold text-green-600 mb-2 flex items-center justify-center gap-2">
                📍 Your Location
              </div>
              <div className="text-sm text-gray-600">
                {formatLocationName(userLocationName)}
              </div>
            </div>
          </Popup>
        </Marker>
        
        {/* Post Markers */}
        {(() => {
          // Group posts by location (same lat/lng)
          const groupedPosts = visiblePosts.reduce((groups, post) => {
            const locationKey = `${post.location.lat.toFixed(6)},${post.location.lng.toFixed(6)}`;
            if (!groups[locationKey]) {
              groups[locationKey] = [];
            }
            groups[locationKey].push(post);
            return groups;
          }, {} as Record<string, Post[]>);

          // Render one marker per location group
          return Object.entries(groupedPosts).map(([locationKey, postsAtLocation]) => {
            const firstPost = postsAtLocation[0];
            const postCount = postsAtLocation.length;
            const hasHighlighted = postsAtLocation.some(p => highlightedPostIds.includes(p.id));
            const isHovered = postsAtLocation.some(p => hoveredPostId === p.id);
            
            // Determine color based on role priority (highlighted > giver > receiver)
            const color = hasHighlighted 
              ? MARKER_COLORS.highlighted
              : postsAtLocation.some(p => p.role === 'giver')
                ? MARKER_COLORS.giver
                : MARKER_COLORS.receiver;
            
            // Use pulsing marker for highlighted posts, regular for others
            const markerIcon = hasHighlighted 
              ? createPulsingMarker(color, true)
              : createCustomIcon(color, false, postCount);
            
            const CategoryIcon = getCategoryIcon(firstPost.category);
            const distance = calculateDistance(
              center.lat,
              center.lng,
              firstPost.location.lat,
              firstPost.location.lng
            );
            
            const userConnection = firstPost.connections.find(c => c.connectedUserId === currentUserId);
            const canConnect = firstPost.connections.length < 5 && !userConnection && firstPost.userId !== currentUserId;
            
            return (
              <Marker
                key={locationKey}
                position={[firstPost.location.lat, firstPost.location.lng]}
                icon={markerIcon}
                eventHandlers={{
                  click: () => {
                    setCurrentPopupPostId(firstPost.id);
                    onMarkerClick?.(firstPost);
                  },
                }}
              >
                <Popup maxWidth={320} className="custom-popup">
                  <PopupContent 
                    post={firstPost}
                    isHighlighted={hasHighlighted}
                    distance={distance}
                    userConnection={userConnection}
                    canConnect={canConnect}
                    allPosts={postsAtLocation}
                    onConnect={onConnect}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    onNavigate={setCurrentPopupPostId}
                    currentUserId={currentUserId}
                  />
                </Popup>
              </Marker>
            );
          });
        })()}
      </MapContainer>
      
      {/* Legend - Bottom Right with beautiful design */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-white/60 z-[1000] min-w-[180px]">
        <div className="space-y-3">
          <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
            🗺️ Map Legend
          </div>
          
          {/* Show All */}
          <button
            onClick={() => setMarkerFilter('all')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ${
              markerFilter === 'all' 
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 shadow-sm' 
                : 'hover:bg-gray-50 border-2 border-transparent'
            }`}
          >
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#1261A6] to-[#2A95BF] shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-sm" />
            </div>
            <span className="text-sm font-medium text-gray-700">Show All</span>
          </button>
          
          {/* Opposite Role */}
          <button
            onClick={() => setMarkerFilter('opposite-role')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ${
              markerFilter === 'opposite-role' 
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 shadow-sm' 
                : 'hover:bg-gray-50 border-2 border-transparent'
            }`}
          >
            <div className={`w-4 h-4 rounded-full shadow-sm ${
              oppositeRole === 'giver' 
                ? 'bg-gradient-to-br from-[#1261A6] to-[#2A95BF]' 
                : 'bg-gradient-to-br from-red-500 to-red-600'
            }`} />
            <span className="text-sm font-medium text-gray-700">
              {oppositeRole === 'giver' ? '🤝 Givers' : '🙏 Receivers'}
            </span>
          </button>
          
          {/* Matches */}
          <button
            onClick={() => setMarkerFilter('matches')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ${
              markerFilter === 'matches' 
                ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-200 shadow-sm' 
                : 'hover:bg-gray-50 border-2 border-transparent'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-sm" />
            <span className="text-sm font-medium text-gray-700">
              ⭐ Matches ({highlightedPostIds.length})
            </span>
          </button>
          
          {/* You */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-200 px-3">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-sm animate-pulse" />
            <span className="text-sm font-medium text-gray-700">📍 You</span>
          </div>
        </div>
      </div>
      
      {/* Zoom Controls with beautiful design */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 z-[1000] overflow-hidden">
        <button
          onClick={() => {
            const map = (window as any).leafletMap;
            if (map) map.zoomIn();
          }}
          className="block w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 border-b border-gray-200 transition-all duration-300 font-bold text-lg"
        >
          +
        </button>
        <button
          onClick={() => {
            const map = (window as any).leafletMap;
            if (map) map.zoomOut();
          }}
          className="block w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all duration-300 font-bold text-lg"
        >
          −
        </button>
      </div>
    </div>
  );
}