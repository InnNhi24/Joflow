/**
 * Category Icon Mapping
 * Modern line icons for each item category
 */

import { Package, Droplet, UtensilsCrossed, BookOpen, Shirt, Pill, MoreHorizontal } from 'lucide-react';
import { ItemCategory } from '../types';

export const CategoryIcons: Record<ItemCategory, React.ComponentType<{ className?: string }>> = {
  rice: UtensilsCrossed,
  water: Droplet,
  noodles: UtensilsCrossed,
  books: BookOpen,
  clothing: Shirt,
  medicine: Pill,
  other: MoreHorizontal
};

export function getCategoryIcon(category: ItemCategory) {
  return CategoryIcons[category] || Package;
}
