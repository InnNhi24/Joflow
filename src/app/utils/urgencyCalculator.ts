/**
 * Urgency Calculator
 * Auto-calculates urgency score (1-5) based on time needed
 */

import { TimeNeeded } from '../types';

export function calculateUrgency(timeNeeded: TimeNeeded): number {
  const urgencyMap: Record<TimeNeeded, number> = {
    '1hour': 5,    // Critical - need ASAP
    '6hours': 4,   // High urgency
    '24hours': 3,  // Moderate urgency
    '3days': 2,    // Low urgency
    '1week': 1     // Minimal urgency
  };
  
  return urgencyMap[timeNeeded];
}

export function getTimeNeededLabel(timeNeeded: TimeNeeded): string {
  const labelMap: Record<TimeNeeded, string> = {
    '1hour': 'Within 1 hour ⚡',
    '6hours': 'Within 6 hours 🔥',
    '24hours': 'Within 24 hours ⏰',
    '3days': 'Within 3 days 📅',
    '1week': 'Within 1 week 📆'
  };
  
  return labelMap[timeNeeded];
}
