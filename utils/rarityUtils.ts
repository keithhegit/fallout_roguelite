/**
 * Rarity Utility Functions
 * Manage all rarity-related styles and utility functions centrally to avoid duplication across components
 */

import { ItemRarity } from '../types';

/**
 * Get rarity text color class
 */
export const getRarityTextColor = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case 'Rare':
      return 'text-emerald-400';
    case 'Legendary':
      return 'text-amber-400';
    case 'Mythic':
      return 'text-red-500';
    default:
      return 'text-stone-400';
  }
};

/**
 * Get rarity name style class (for item names, includes hover effect)
 */
export const getRarityNameClasses = (rarity: ItemRarity | undefined): string => {
  const base = 'font-bold transition-colors duration-300 cursor-default ';
  switch (rarity) {
    case 'Rare':
      return base + 'text-stone-400 hover:text-emerald-400 hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.45)]';
    case 'Legendary':
      return base + 'text-stone-400 hover:text-amber-400 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.45)]';
    case 'Mythic':
      return (
        base +
        'text-stone-400 hover:text-red-500 hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.45)]'
      );
    default:
      return base + 'text-stone-400 hover:text-stone-200';
  }
};

/**
 * Get rarity border style class
 */
export const getRarityBorder = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case 'Rare':
      return 'border-emerald-500';
    case 'Legendary':
      return 'border-amber-500';
    case 'Mythic':
      return 'border-red-600';
    default:
      return 'border-stone-600';
  }
};

/**
 * Get rarity background and border style class (for cards/panels)
 */
export const getRarityColor = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case 'Rare':
      return 'border-emerald-500 bg-emerald-950/20';
    case 'Legendary':
      return 'border-amber-500 bg-amber-950/20';
    case 'Mythic':
      return 'border-red-600 bg-red-950/20';
    default:
      return 'border-stone-600 bg-stone-900/40';
  }
};

/**
 * Get rarity badge style class (for tags)
 */
export const getRarityBadge = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case 'Rare':
      return 'bg-emerald-950/30 text-emerald-400 border-emerald-500/50';
    case 'Legendary':
      return 'bg-amber-950/30 text-amber-400 border-amber-500/50';
    case 'Mythic':
      return 'bg-red-950/30 text-red-500 border-red-600/50';
    default:
      return 'bg-stone-950/40 text-stone-400 border-stone-600/50';
  }
};

/**
 * Get rarity glow style class
 */
export const getRarityGlow = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case 'Rare':
      return 'shadow-[0_0_10px_rgba(16,185,129,0.2)]';
    case 'Legendary':
      return 'shadow-[0_0_15px_rgba(245,158,11,0.2)]';
    case 'Mythic':
      return 'shadow-[0_0_20px_rgba(239,68,68,0.3)]';
    default:
      return 'shadow-none';
  }
};

/**
 * Get rarity sort weight
 */
export const getRarityOrder = (rarity: ItemRarity | undefined): number => {
  const rarityOrder: Record<ItemRarity, number> = {
    Mythic: 5,
    Legendary: 4,
    Rare: 3,
    Common: 2,
  };
  return rarityOrder[rarity || 'Common'];
};

/**
 * Get rarity display name
 */
export const getRarityDisplayName = (rarity: ItemRarity | undefined): string => {
  return rarity || 'Common';
};

/**
 * Rarity alias map (compatible with English and aliases)
 */
const rarityAliasMap: Record<string, ItemRarity> = {
  rare: 'Rare',
  common: 'Common',
  normal: 'Common',
  legend: 'Legendary',
  legendary: 'Legendary',
  mythic: 'Mythic',
  immortal: 'Mythic',
};

/**
 * Normalize rarity value (convert English/alias to standard English)
 * Used for unified display, compatible with potential English rarity returns
 */
export const normalizeRarityValue = (rarity?: ItemRarity | string): ItemRarity => {
  if (!rarity) return 'Common';
  const key = String(rarity).toLowerCase();
  // Check if it's one of the English keys (case insensitive)
  if (rarityAliasMap[key]) return rarityAliasMap[key];

  return rarity as ItemRarity;
};
