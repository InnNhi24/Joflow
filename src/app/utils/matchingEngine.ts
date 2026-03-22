/**
 * JOFLOW MATCHING ENGINE
 * 
 * Algorithm: Score = (Weight_Category × Similarity) + (Weight_Urgency × Level) - (Weight_Distance × Km)
 * 
 * Purpose: When a Receiver posts, instantly highlights top 5 closest Givers with matching items
 * and vice versa for symmetrical matching.
 */

import { Post, MatchScore, MatchWeights, ItemCategory } from '../types';

// Default weights for the matching algorithm
const DEFAULT_WEIGHTS: MatchWeights = {
  category: 100,   // High weight for category match
  urgency: 30,     // Medium weight for urgency
  distance: 5      // Lower weight but still significant
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate category similarity (1.0 for exact match, 0.5 for related, 0 for unrelated)
 */
function calculateCategorySimilarity(
  category1: ItemCategory,
  category2: ItemCategory
): number {
  if (category1 === category2) return 1.0;
  
  // Define related categories with more logical groupings
  const relatedCategories: { [key in ItemCategory]?: ItemCategory[] } = {
    // Food items are related
    rice: ['noodles'],
    noodles: ['rice'],
    
    // Health & survival items are related
    water: ['medicine'],
    medicine: ['water'],
    
    // Personal items are somewhat related
    books: ['clothing'],
    clothing: ['books'],
    
    // You can add more logical relationships here
    // For example: electronics: ['books'], etc.
  };
  
  if (relatedCategories[category1]?.includes(category2)) {
    return 0.5;
  }
  
  return 0; // No match for unrelated categories
}

/**
 * Main matching algorithm
 * Finds and scores potential matches based on category, urgency, and distance
 */
export function findMatches(
  targetPost: Post,
  candidatePosts: Post[],
  weights: MatchWeights = DEFAULT_WEIGHTS,
  maxResults: number = 5
): MatchScore[] {
  const scores: MatchScore[] = candidatePosts
    .filter(post => {
      // Filter out posts that are not the opposite role
      if (targetPost.role === 'giver') {
        return post.role === 'receiver';
      } else {
        return post.role === 'giver';
      }
    })
    .filter(post => {
      // Filter out completed or cancelled posts
      return post.status === 'active';
    })
    .filter(post => {
      // ANTI-SPAM: Filter out posts that already have 5 connections
      return post.connections.length < 5;
    })
    .map(post => {
      const distance = calculateDistance(
        targetPost.location.lat,
        targetPost.location.lng,
        post.location.lat,
        post.location.lng
      );
      
      const categorySimilarity = calculateCategorySimilarity(
        targetPost.category,
        post.category
      );
      
      // Apply the scoring formula
      const score =
        (weights.category * categorySimilarity) +
        (weights.urgency * post.urgency) -
        (weights.distance * distance);
      
      return {
        postId: post.id,
        score,
        distance,
        categorySimilarity,
        urgencyFactor: post.urgency
      };
    })
    .filter(match => {
      // IMPORTANT: Only include matches with category similarity > 0
      // This prevents Rice from matching with Water, Clothing, etc.
      return match.categorySimilarity > 0;
    });
  
  // Sort by score (highest first) and return top matches
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Get nearby posts within a radius (in km)
 * Useful for geographic filtering
 */
export function getPostsWithinRadius(
  centerLat: number,
  centerLng: number,
  posts: Post[],
  radiusKm: number
): Post[] {
  return posts.filter(post => {
    const distance = calculateDistance(
      centerLat,
      centerLng,
      post.location.lat,
      post.location.lng
    );
    return distance <= radiusKm;
  });
}
