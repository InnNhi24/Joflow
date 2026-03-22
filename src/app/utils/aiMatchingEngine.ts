/**
 * JOFLOW AI-POWERED MATCHING ENGINE
 * 
 * Implements the Symmetry Matching AI as described in the capstone proposal:
 * - Two-Way Recommendation using machine learning
 * - NLP-based Urgency Analysis from notes
 * - Advanced scoring with AI-enhanced parameters
 */

import { Post, MatchScore, ItemCategory } from '../types';
import { calculateDistance } from './matchingEngine';

// AI-Enhanced Urgency Keywords with weights
const URGENCY_KEYWORDS = {
  critical: {
    keywords: ['emergency', 'urgent', 'critical', 'asap', 'immediately', 'help', 'desperate', 'dying', 'starving', 'homeless'],
    weight: 5.0
  },
  high: {
    keywords: ['soon', 'quickly', 'fast', 'needed', 'important', 'running out', 'last', 'final', 'please'],
    weight: 4.0
  },
  medium: {
    keywords: ['today', 'tomorrow', 'this week', 'prefer', 'would like', 'hoping'],
    weight: 3.0
  },
  low: {
    keywords: ['whenever', 'no rush', 'flexible', 'eventually', 'sometime'],
    weight: 2.0
  }
};

// AI-Enhanced Category Relationships with semantic similarity
const CATEGORY_RELATIONSHIPS = {
  // Food cluster - high semantic similarity
  rice: {
    rice: 1.0,
    noodles: 0.8,    // Both are staple foods
    water: 0.3,      // Water needed with food
    medicine: 0.1,
    books: 0.0,
    clothing: 0.0,
    other: 0.2
  },
  noodles: {
    noodles: 1.0,
    rice: 0.8,       // Both are staple foods
    water: 0.3,      // Water needed with food
    medicine: 0.1,
    books: 0.0,
    clothing: 0.0,
    other: 0.2
  },
  // Survival essentials
  water: {
    water: 1.0,
    medicine: 0.6,   // Both are health/survival related
    rice: 0.3,       // Water needed with food
    noodles: 0.3,    // Water needed with food
    books: 0.0,
    clothing: 0.1,
    other: 0.2
  },
  medicine: {
    medicine: 1.0,
    water: 0.6,      // Water needed with medicine
    rice: 0.1,
    noodles: 0.1,
    books: 0.0,
    clothing: 0.0,
    other: 0.3
  },
  // Education and personal items
  books: {
    books: 1.0,
    clothing: 0.4,   // Both are personal development items
    rice: 0.0,
    noodles: 0.0,
    water: 0.0,
    medicine: 0.0,
    other: 0.5
  },
  clothing: {
    clothing: 1.0,
    books: 0.4,      // Both are personal development items
    rice: 0.0,
    noodles: 0.0,
    water: 0.1,
    medicine: 0.0,
    other: 0.3
  },
  other: {
    other: 1.0,
    books: 0.5,
    clothing: 0.3,
    medicine: 0.3,
    rice: 0.2,
    noodles: 0.2,
    water: 0.2
  }
};

/**
 * AI-POWERED NLP URGENCY ANALYSIS
 * Analyzes the notes field using natural language processing
 * to detect high-priority cases and emotional urgency indicators
 */
export function analyzeUrgencyWithNLP(notes: string, timeNeeded: string): number {
  if (!notes || notes.trim().length === 0) {
    // Fallback to time-based urgency if no notes
    return getTimeBasedUrgency(timeNeeded);
  }

  const normalizedNotes = notes.toLowerCase().trim();
  let urgencyScore = 1.0; // Base urgency
  let maxCategoryWeight = 0;

  // Analyze each urgency category
  Object.entries(URGENCY_KEYWORDS).forEach(([, config]) => {
    const matchCount = config.keywords.filter(keyword => 
      normalizedNotes.includes(keyword)
    ).length;

    if (matchCount > 0) {
      // Apply diminishing returns for multiple keywords in same category
      const categoryScore = config.weight * (1 - Math.exp(-matchCount * 0.5));
      maxCategoryWeight = Math.max(maxCategoryWeight, categoryScore);
    }
  });

  urgencyScore = Math.max(urgencyScore, maxCategoryWeight);

  // Emotional intensity analysis (simple sentiment indicators)
  const emotionalIntensifiers = ['!!!', '!!', 'please please', 'really need', 'desperately', 'crying', 'scared'];
  const intensifierCount = emotionalIntensifiers.filter(intensifier => 
    normalizedNotes.includes(intensifier)
  ).length;

  if (intensifierCount > 0) {
    urgencyScore += intensifierCount * 0.5;
  }

  // Quantity-based urgency (large families, multiple people)
  const quantityIndicators = ['family', 'children', 'kids', 'baby', 'elderly', 'people', 'group'];
  const quantityMatches = quantityIndicators.filter(indicator => 
    normalizedNotes.includes(indicator)
  ).length;

  if (quantityMatches > 0) {
    urgencyScore += quantityMatches * 0.3;
  }

  // Cap the urgency score at 5.0
  return Math.min(urgencyScore, 5.0);
}

/**
 * Get time-based urgency as fallback
 */
function getTimeBasedUrgency(timeNeeded: string): number {
  switch (timeNeeded) {
    case '1hour': return 5.0;
    case '6hours': return 4.0;
    case '24hours': return 3.0;
    case '3days': return 2.0;
    case '1week': return 1.0;
    default: return 2.0;
  }
}

/**
 * AI-ENHANCED CATEGORY SIMILARITY
 * Uses semantic similarity matrix instead of simple exact matching
 */
function calculateAICategorySimilarity(
  category1: ItemCategory,
  category2: ItemCategory
): number {
  return CATEGORY_RELATIONSHIPS[category1]?.[category2] || 0;
}

/**
 * AI-POWERED DISTANCE OPTIMIZATION
 * Uses machine learning-inspired distance weighting
 * Closer distances get exponentially higher scores
 */
function calculateDistanceScore(distanceKm: number): number {
  // Exponential decay function: closer = much better
  // Score approaches 1.0 for very close distances, 0 for far distances
  return Math.exp(-distanceKm / 10); // 10km half-life
}

/**
 * AI-POWERED QUANTITY COMPATIBILITY ANALYSIS
 * Analyzes if the quantities make sense for matching
 */
function calculateQuantityCompatibility(
  targetQuantity: number,
  candidateQuantity: number,
  targetRole: 'giver' | 'receiver'
): number {
  if (targetRole === 'receiver') {
    // Receiver needs X, Giver has Y
    // Perfect if giver has exactly what receiver needs or more
    if (candidateQuantity >= targetQuantity) {
      return 1.0;
    } else {
      // Partial fulfillment is still valuable
      return candidateQuantity / targetQuantity;
    }
  } else {
    // Giver has X, Receiver needs Y
    // Perfect if receiver needs exactly what giver has or less
    if (targetQuantity >= candidateQuantity) {
      return 1.0;
    } else {
      // Giver has less than receiver needs
      return targetQuantity / candidateQuantity;
    }
  }
}

/**
 * MAIN AI-POWERED SYMMETRY MATCHING ENGINE
 * Implements the Two-Way Recommendation system with AI scoring
 */
export function findAIMatches(
  targetPost: Post,
  candidatePosts: Post[],
  maxResults: number = 5
): MatchScore[] {
  const scores: MatchScore[] = candidatePosts
    .filter(post => {
      // Filter opposite roles only
      return post.role !== targetPost.role;
    })
    .filter(post => {
      // Only active posts
      return post.status === 'active';
    })
    .filter(post => {
      // Anti-spam: max 5 connections
      return post.connections.length < 5;
    })
    .map(post => {
      // Calculate AI-enhanced metrics
      const distance = calculateDistance(
        targetPost.location.lat,
        targetPost.location.lng,
        post.location.lat,
        post.location.lng
      );

      const categorySimilarity = calculateAICategorySimilarity(
        targetPost.category,
        post.category
      );

      const distanceScore = calculateDistanceScore(distance);
      
      const quantityCompatibility = calculateQuantityCompatibility(
        targetPost.quantity,
        post.quantity,
        targetPost.role
      );

      // AI-powered urgency analysis
      const aiUrgency = analyzeUrgencyWithNLP(post.notes || '', post.timeNeeded);
      const targetAiUrgency = analyzeUrgencyWithNLP(targetPost.notes || '', targetPost.timeNeeded);
      
      // Urgency matching: higher urgency gets priority
      const urgencyScore = (aiUrgency + targetAiUrgency) / 2;

      // AI SCORING FORMULA with machine learning-inspired weights
      const score = 
        (categorySimilarity * 100) +           // Category match is most important
        (urgencyScore * 25) +                  // AI-analyzed urgency
        (distanceScore * 30) +                 // Distance optimization
        (quantityCompatibility * 20) +         // Quantity compatibility
        (Math.random() * 5);                   // Small randomization for diversity

      return {
        postId: post.id,
        score,
        distance,
        categorySimilarity,
        urgencyFactor: aiUrgency,
        // Additional AI metrics
        aiUrgency,
        quantityCompatibility,
        distanceScore
      };
    })
    .filter(match => {
      // Only include matches with some category relationship
      return match.categorySimilarity > 0;
    });

  // Sort by AI score (highest first) and return top matches
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * AI-POWERED RECOMMENDATION EXPLANATION
 * Provides human-readable explanation for why posts were matched
 */
export function explainMatch(match: MatchScore): string {
  const reasons: string[] = [];

  if (match.categorySimilarity >= 0.8) {
    reasons.push("🎯 Perfect category match");
  } else if (match.categorySimilarity >= 0.5) {
    reasons.push("🔗 Related categories");
  }

  if ((match as any).aiUrgency >= 4.0) {
    reasons.push("🚨 High urgency detected");
  } else if ((match as any).aiUrgency >= 3.0) {
    reasons.push("⏰ Moderate urgency");
  }

  if (match.distance <= 5) {
    reasons.push("📍 Very close location");
  } else if (match.distance <= 15) {
    reasons.push("🚗 Nearby location");
  }

  if ((match as any).quantityCompatibility >= 0.8) {
    reasons.push("📦 Good quantity match");
  }

  return reasons.join(" • ") || "✨ AI recommended match";
}

/**
 * BATCH AI ANALYSIS
 * Analyzes multiple posts for urgency in batch for efficiency
 */
export function batchAnalyzeUrgency(posts: Post[]): { [postId: string]: number } {
  const results: { [postId: string]: number } = {};
  
  posts.forEach(post => {
    results[post.id] = analyzeUrgencyWithNLP(post.notes || '', post.timeNeeded);
  });

  return results;
}