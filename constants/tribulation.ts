/**
 * Radiation Storm (Breakthrough Surge) System Constants
 * Contains storm configurations, breakthrough stages, and death probability calculations.
 */

import { RealmType, ItemRarity, EquipmentSlot, Item } from '../types';

// ==================== Radiation Storm System Configuration ====================

// Radiation Storm Level Configuration
export const TRIBULATION_CONFIG: Record<RealmType, {
  requiresTribulation: boolean; // Whether a storm surge is required for breakthrough
  tribulationLevel: 'Elite Storm' | 'Master Storm' | 'Grandmaster Storm' | 'Fusion Storm' | 'Eternal Storm' | null;
  baseDeathProbability: number; // Base death probability (0-1)
  description: string; // Description of the storm surge
}> = {
  [RealmType.QiRefining]: {
    requiresTribulation: false,
    tribulationLevel: null,
    baseDeathProbability: 0,
    description: 'Scavengers do not face storm surges.'
  },
  [RealmType.Foundation]: {
    requiresTribulation: false,
    tribulationLevel: null,
    baseDeathProbability: 0,
    description: 'Wastelanders do not face storm surges.'
  },
  [RealmType.GoldenCore]: {
    requiresTribulation: true,
    tribulationLevel: 'Elite Storm',
    baseDeathProbability: 0.30,
    description: 'The elite mutation is reaching its peak. A massive radiation storm is approaching! Survive the surge or face collapse!'
  },
  [RealmType.NascentSoul]: {
    requiresTribulation: true,
    tribulationLevel: 'Master Storm',
    baseDeathProbability: 0.45,
    description: 'The master evolution is imminent. The mutation surge is here! This storm is far more lethal than the previous one!'
  },
  [RealmType.SpiritSevering]: {
    requiresTribulation: true,
    tribulationLevel: 'Grandmaster Storm',
    baseDeathProbability: 0.60,
    description: 'The apex of evolution! The wasteland itself rejects you! Without an ultimate artifact, you will not survive this surge!'
  },
  [RealmType.DaoCombining]: {
    requiresTribulation: true,
    tribulationLevel: 'Fusion Storm',
    baseDeathProbability: 0.70,
    description: 'The fusion of genetic data is near! Genetic fusion surge! This is the ultimate trial of the primal sentinel!'
  },
  [RealmType.LongevityRealm]: {
    requiresTribulation: true,
    tribulationLevel: 'Eternal Storm',
    baseDeathProbability: 0.85,
    description: 'The eternal transcendence! Defying the laws of biological decay! Five stages of mutation doom, one chance in ten to live!'
  },
};

// Equipment Rarity Bonus (for storm calculations)
export const TRIBULATION_RARITY_BONUS: Record<ItemRarity, number> = {
  'Common': 0,
  'Rare': 0.03,
  'Legendary': 0.06,
  'Mythic': 0.12,
};

// Natal Relic Extra Bonus
export const NATAL_ARTIFACT_BONUS = 0.03;

// Radiation Storm Stage Configuration
export const TRIBULATION_STAGES = [
  { stage: 'Stabilizing', description: 'You are stabilizing your biological core, preparing for the storm surge...', delay: 1000 },
  { stage: 'First Wave', description: 'Black clouds gather, the first wave of radiation strikes!', delay: 2000 },
  { stage: 'Second Wave', description: 'The atmosphere churns, the second wave surge is even more violent!', delay: 2000 },
  { stage: 'The Final Surge', description: 'Biological reality warps, the final surge carrier descends with entropic havoc!', delay: 2000 },
  { stage: 'Breakthrough Success', description: 'The surge dissipates, the storm is over! You have successfully evolved!', delay: 0 },
  { stage: 'Breakthrough Failure', description: 'The storm surge was too strong. Your biological data has collapsed into entropy...', delay: 0 },
];

/**
 * Calculates the probability of death during a storm surge breakthrough.
 */
export const calculateTribulationDeathProbability = (
  realm: RealmType,
  totalStats: {
    attack: number;
    defense: number;
    spirit: number;
    physique: number;
    speed: number;
    maxHp: number;
  },
  equipmentQualityScore: number,
  hasNatalArtifact: boolean
): number => {
  // Get base death probability
  const config = TRIBULATION_CONFIG[realm];
  let deathProbability = config.baseDeathProbability;

  // Calculate comprehensive stat score (to reduce death probability)
  // Normalization: Based on Elite (GoldenCore) level stats
  const normalizedStats = (
    (totalStats.attack + totalStats.defense + totalStats.spirit +
      totalStats.physique + totalStats.speed + totalStats.maxHp / 10) / 6
  );

  // Stat Bonus: Every 800 comprehensive stats reduce death risk by 1%, max 15%.
  const attributeBonus = Math.min(normalizedStats / 800 * 0.01, 0.15);
  deathProbability -= attributeBonus;

  // Equipment Bonus
  deathProbability -= equipmentQualityScore;

  // Natal Relic Bonus
  if (hasNatalArtifact) {
    deathProbability -= NATAL_ARTIFACT_BONUS;
  }

  // Ensure death probability is within reasonable bounds (Min 10% to preserve challenge)
  deathProbability = Math.max(0.10, Math.min(0.95, deathProbability));

  return deathProbability;
};

/**
 * Calculates the equipment quality score (reduction in death probability).
 */
export const calculateEquipmentQualityScore = (
  equippedItems: Partial<Record<EquipmentSlot, string>>,
  inventory: Item[]
): number => {
  let qualityScore = 0;

  Object.values(equippedItems).forEach((itemId) => {
    const item = inventory.find((i) => i.id === itemId);
    if (item && item.rarity) {
      qualityScore += TRIBULATION_RARITY_BONUS[item.rarity] || 0;
    }
  });

  return qualityScore;
};