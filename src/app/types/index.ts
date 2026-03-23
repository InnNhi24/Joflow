/**
 * JOFLOW Type Definitions
 * Core data structures for the geospatial relief ecosystem
 */

export type UserRole = 'giver' | 'receiver';

export type PostStatus = 'active' | 'confirmed' | 'completed' | 'cancelled';

export type ItemCategory = 'rice' | 'water' | 'noodles' | 'books' | 'clothing' | 'medicine' | 'other';

export type TimeNeeded = '1hour' | '6hours' | '24hours' | '3days' | '1week';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  location: Location;
  avatar?: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  category: ItemCategory;
  item: string;
  quantity: number;
  urgency: number; // 1-5 scale, auto-calculated from timeNeeded
  timeNeeded: TimeNeeded; // User-selected deadline
  notes?: string;
  location: Location;
  status: PostStatus;
  createdAt: Date;
  connections: Connection[];
}

export interface Connection {
  id: string;
  postId: string;
  connectedUserId: string;
  connectedUserName: string;
  giverConfirmed: boolean;
  receiverConfirmed: boolean;
  createdAt: Date;
  chatActive: boolean;
  users?: {
    name: string;
  };
}

export interface MatchScore {
  postId: string;
  score: number;
  distance: number;
  categorySimilarity: number;
  urgencyFactor: number;
  // AI-enhanced fields
  aiUrgency?: number;
  quantityCompatibility?: number;
  distanceScore?: number;
}

export interface MatchWeights {
  category: number;
  urgency: number;
  distance: number;
}