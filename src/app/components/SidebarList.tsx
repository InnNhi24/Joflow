/**
 * Dropdown List with Filters (from Menu Button)
 */

import { useState, useMemo } from 'react';
import { Menu, Search, SlidersHorizontal, MapPin, Flame, X, Grid3x3, Clock, Users, Star } from 'lucide-react';
import { Post } from '../types';
import { calculateDistance } from '../utils/matchingEngine';
import { getCategoryIcon } from '../utils/categoryIcons';
import { getTimeNeededLabel } from '../utils/urgencyCalculator';

interface SidebarListProps {
  posts: Post[];
  currentUserLocation: { lat: number; lng: number };
  currentUserId: string;
  allPosts: Post[]; // Need all posts to calculate category relevance
  onPostClick: (post: Post) => void;
  highlightedPostIds: string[];
  matchScores?: { [postId: string]: number }; // Add match scores
}

type SortOption = 'distance' | 'urgency' | 'category';

export default function SidebarList({
  posts,
  currentUserLocation,
  currentUserId,
  allPosts,
  onPostClick,
  highlightedPostIds,
  matchScores = {}
}: SidebarListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('distance');

  // Calculate user's relevant categories
  const userRelevantCategories = useMemo(() => {
    const categories = new Set<string>();
    
    // Guard against undefined allPosts
    if (!allPosts || allPosts.length === 0) {
      return categories;
    }
    
    allPosts.forEach(post => {
      // Categories user has posted
      if (post.userId === currentUserId) {
        categories.add(post.category);
      }
      
      // Categories user has connections with
      if (post.connections.some(conn => conn.connectedUserId === currentUserId)) {
        categories.add(post.category);
      }
    });
    
    return categories;
  }, [allPosts, currentUserId]);

  // Calculate distances for all posts
  const postsWithDistance = useMemo(() => {
    return posts.map(post => ({
      ...post,
      distance: calculateDistance(
        currentUserLocation.lat,
        currentUserLocation.lng,
        post.location.lat,
        post.location.lng
      )
    }));
  }, [posts, currentUserLocation]);

  // Filter by search
  const filteredPosts = useMemo(() => {
    return postsWithDistance.filter(post => {
      const searchLower = searchTerm.toLowerCase();
      return (
        post.userName.toLowerCase().includes(searchLower) ||
        post.item.toLowerCase().includes(searchLower) ||
        post.category.toLowerCase().includes(searchLower) ||
        post.notes?.toLowerCase().includes(searchLower)
      );
    });
  }, [postsWithDistance, searchTerm]);

  // Sort posts - prioritize matches first, then by selected sort option
  const sortedPosts = useMemo(() => {
    const sorted = [...filteredPosts];
    
    // Check if we have any matches
    const hasMatches = Object.keys(matchScores).length > 0;
    
    if (hasMatches) {
      // If we have matches, sort by match score first, then by selected option as tiebreaker
      return sorted.sort((a, b) => {
        const aScore = matchScores[a.id] || 0;
        const bScore = matchScores[b.id] || 0;
        
        // If both have match scores or both don't have match scores
        if ((aScore > 0 && bScore > 0) || (aScore === 0 && bScore === 0)) {
          // If both are matches, sort by match score (higher first)
          if (aScore > 0 && bScore > 0) {
            if (aScore !== bScore) return bScore - aScore;
          }
          
          // Apply secondary sorting by selected option
          switch (sortBy) {
            case 'distance':
              return a.distance - b.distance;
            case 'urgency':
              return b.urgency - a.urgency;
            case 'category':
              const aRelevant = userRelevantCategories.has(a.category);
              const bRelevant = userRelevantCategories.has(b.category);
              if (aRelevant && !bRelevant) return -1;
              if (!aRelevant && bRelevant) return 1;
              return a.category.localeCompare(b.category);
            default:
              return a.distance - b.distance;
          }
        }
        
        // One has match score, one doesn't - matches always come first
        if (aScore > 0 && bScore === 0) return -1;
        if (aScore === 0 && bScore > 0) return 1;
        
        return 0;
      });
    } else {
      // No matches, use normal sorting
      switch (sortBy) {
        case 'distance':
          return sorted.sort((a, b) => a.distance - b.distance);
        case 'urgency':
          return sorted.sort((a, b) => b.urgency - a.urgency);
        case 'category':
          return sorted.sort((a, b) => {
            const aRelevant = userRelevantCategories.has(a.category);
            const bRelevant = userRelevantCategories.has(b.category);
            
            if (aRelevant && !bRelevant) return -1;
            if (!aRelevant && bRelevant) return 1;
            
            return a.category.localeCompare(b.category);
          });
        default:
          return sorted;
      }
    }
  }, [filteredPosts, sortBy, userRelevantCategories, matchScores]);

  return (
    <>
      {/* Premium Glass Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-4 left-4 z-[9998] bg-white/70 backdrop-blur-xl shadow-xl shadow-[#126DA6]/10 rounded-2xl p-3 hover:bg-white/90 transition-all duration-300 hover:scale-110 border border-white/60"
        title="Toggle Posts List"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Dropdown List */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[9997]" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Premium Glassmorphism Dropdown Panel */}
          <div className="absolute top-20 left-4 z-[9998] bg-white/40 backdrop-blur-xl shadow-2xl shadow-[#126DA6]/10 rounded-3xl w-96 max-h-[75vh] flex flex-col border border-white/60">
            {/* Premium Header */}
            <div className="p-5 border-b border-white/40 space-y-3 flex-shrink-0 bg-gradient-to-br from-white/30 to-transparent">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <Grid3x3 className="w-5 h-5 text-[#126DA6]" />
                  Nearby Posts
                </h3>
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-full transition-all duration-300 hover:scale-105 border border-white/40"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Sort</span>
                </button>
              </div>

              {/* Premium Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#126DA6] transition-colors" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white/60 backdrop-blur-sm border-2 border-white/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#126DA6]/30 focus:border-[#126DA6]/50 text-sm transition-all duration-300"
                />
              </div>
              
              {/* Active Sort Indicator */}
              {sortBy !== 'distance' && (
                <div className="flex items-center justify-between text-xs bg-blue-500/10 backdrop-blur-sm text-blue-700 px-3 py-2 rounded-2xl border border-blue-500/20">
                  <span className="font-semibold">
                    Sorted by: <span className="capitalize">{sortBy}</span>
                  </span>
                  <button
                    onClick={() => setSortBy('distance')}
                    className="hover:text-blue-900 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              
              {/* Match Priority Indicator */}
              {Object.keys(matchScores).length > 0 && (
                <div className="flex items-center justify-between text-xs bg-yellow-500/10 backdrop-blur-sm text-yellow-700 px-3 py-2 rounded-2xl border border-yellow-500/20">
                  <span className="font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Matches prioritized
                  </span>
                  <span className="text-yellow-600 text-xs">Auto-sorted</span>
                </div>
              )}
              
              {/* Count Badge */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span className="font-semibold">{sortedPosts.length}</span>
                <span className="text-gray-500">available</span>
              </div>
            </div>

            {/* Scrollable List with Premium Scrollbar */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {sortedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white/60">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-sm font-semibold">No posts found</p>
                  <p className="text-gray-500 text-xs mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                sortedPosts.map(post => (
                  <GlassPostCard
                    key={post.id}
                    post={post}
                    distance={post.distance}
                    onClick={() => {
                      onPostClick(post);
                      setIsOpen(false);
                    }}
                    isHighlighted={highlightedPostIds.includes(post.id)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
      
      {/* Filter/Sort Popup */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40" onClick={() => setIsFilterOpen(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Sort By</h3>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Sort Options */}
            <div className="space-y-2">
              <SortOption
                icon={MapPin}
                label="Distance"
                description="Closest to furthest"
                active={sortBy === 'distance'}
                onClick={() => {
                  setSortBy('distance');
                  setIsFilterOpen(false);
                }}
              />
              <SortOption
                icon={Flame}
                label="Urgency"
                description="Most urgent first"
                active={sortBy === 'urgency'}
                onClick={() => {
                  setSortBy('urgency');
                  setIsFilterOpen(false);
                }}
              />
              <SortOption
                icon={Grid3x3}
                label="Category"
                description="Relevant items first"
                active={sortBy === 'category'}
                onClick={() => {
                  setSortBy('category');
                  setIsFilterOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Sort Option Component
interface SortOptionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}

function SortOption({ icon: Icon, label, description, active, onClick }: SortOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
        active 
          ? 'bg-[#1261A6] text-white shadow-md' 
          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
      }`}
    >
      <div className={`p-2 rounded-lg ${active ? 'bg-white/20' : 'bg-white'}`}>
        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-[#1261A6]'}`} />
      </div>
      <div className="flex-1 text-left">
        <div className="font-medium text-sm">{label}</div>
        <div className={`text-xs ${active ? 'text-white/80' : 'text-gray-500'}`}>
          {description}
        </div>
      </div>
      {active && (
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      )}
    </button>
  );
}

// Premium Glassmorphism Post Card
interface GlassPostCardProps {
  post: Post & { distance: number };
  distance: number;
  onClick: () => void;
  isHighlighted: boolean;
}

function GlassPostCard({ post, distance, onClick, isHighlighted }: GlassPostCardProps) {
  const CategoryIcon = getCategoryIcon(post.category);
  
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white/60 backdrop-blur-md border-2 rounded-3xl p-4 cursor-pointer transition-all duration-300 group ${
        isHighlighted
          ? 'border-yellow-400/60 shadow-lg shadow-yellow-400/20 bg-yellow-50/60'
          : 'border-white/60 hover:border-[#126DA6]/50 hover:shadow-xl hover:shadow-[#126DA6]/10 hover:scale-[1.02]'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm border ${
              post.role === 'giver'
                ? 'bg-blue-500/20 text-blue-700 border-blue-500/30'
                : 'bg-red-500/20 text-red-700 border-red-500/30'
            }`}>
              {post.role === 'giver' ? '🎁 Giver' : '🙏 Receiver'}
            </span>
            {isHighlighted && (
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-400/30 backdrop-blur-sm text-yellow-700 border border-yellow-400/40">
                ⭐ Match
              </span>
            )}
          </div>
          <h4 className="font-bold text-gray-900 text-base">{post.userName}</h4>
        </div>

        {/* Urgency Indicator */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`w-1.5 h-7 rounded-full transition-all ${
                i < post.urgency 
                  ? 'bg-gradient-to-t from-orange-400 to-orange-500 shadow-sm shadow-orange-400/50' 
                  : 'bg-gray-200/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Item Info */}
      <div className="flex items-center gap-3 mb-3 p-3 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/60">
        <div className="p-2 rounded-xl bg-gradient-to-br from-[#126DA6]/10 to-[#2A95BF]/10">
          <CategoryIcon className="w-5 h-5 text-[#126DA6]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-600 capitalize font-semibold">{post.category}</p>
          <p className="text-sm font-bold text-gray-900 truncate">{post.item}</p>
        </div>
        <div className="px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-full border border-white/60">
          <span className="text-sm font-bold text-gray-700">×{post.quantity}</span>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-gray-600 font-semibold">
          <MapPin className="w-3.5 h-3.5" />
          <span>{distance.toFixed(1)} km</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600 font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>{getTimeAgo(post.createdAt)}</span>
        </div>
      </div>
      
      {/* Connections Bar */}
      <div className="mt-3 pt-3 border-t border-white/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
          <Users className="w-3.5 h-3.5" />
          <span>{post.connections.length}/5</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`w-5 h-1.5 rounded-full ${
                i < post.connections.length 
                  ? 'bg-gradient-to-r from-[#126DA6] to-[#2A95BF]' 
                  : 'bg-gray-200/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Notes Preview */}
      {post.notes && (
        <div className="mt-3 p-2 bg-white/40 backdrop-blur-sm rounded-xl border border-white/60">
          <p className="text-xs text-gray-600 line-clamp-2 italic">
            "{post.notes}"
          </p>
        </div>
      )}
    </div>
  );
}