/**
 * Shelter (Stronghold) System Constants
 * Contains shelter configurations, plantable biological samples, energy array enhancements, and hydroponic rewards.
 */

import { GrottoConfig, RealmType, ItemRarity } from '../types'

// Shelter Configuration
export const GROTTO_CONFIGS: GrottoConfig[] = [
  {
    level: 1,
    name: 'Basic Shelter',
    cost: 500,
    expRateBonus: 0.05, // 5% progression speed bonus
    autoHarvest: false,
    growthSpeedBonus: 0.0,
    maxHerbSlots: 1,
    description: 'A rundown basement shelter. Sparse energy, but better than nothing.',
  },
  {
    level: 2,
    name: 'Standard Shelter',
    cost: 2000,
    expRateBonus: 0.10, // 10% progression speed bonus
    autoHarvest: false,
    growthSpeedBonus: 0.05, // 5% growth speed bonus
    maxHerbSlots: 2,
    description: 'A standard pre-war fallout bunker. Decent energy levels, suitable for wasteland survivors.',
  },
  {
    level: 3,
    name: 'Refined Shelter',
    cost: 8000,
    expRateBonus: 0.15, // 15% progression speed bonus
    autoHarvest: false,
    growthSpeedBonus: 0.10,
    maxHerbSlots: 3,
    description: 'A refined and reinforced shelter with thick carbon-fiber walls. Energy flow is optimized.',
  },
  {
    level: 4,
    name: 'Advanced Shelter',
    cost: 25000,
    expRateBonus: 0.20, // 20% progression speed bonus
    autoHarvest: true, // Supports auto-harvesting
    growthSpeedBonus: 0.15,
    maxHerbSlots: 4,
    realmRequirement: RealmType.Foundation,
    description: 'An advanced military-grade bunker. High-density energy core allows for automated harvesting.',
  },
  {
    level: 5,
    name: 'High-Tech Shelter',
    cost: 70000,
    expRateBonus: 0.25, // 25% progression speed bonus
    autoHarvest: true,
    growthSpeedBonus: 0.20,
    maxHerbSlots: 5,
    realmRequirement: RealmType.GoldenCore,
    description: 'A state-of-the-art facility where energy is mist-like. Faster progression and growth.',
  },
  {
    level: 6,
    name: 'Apex Stronghold',
    cost: 200000,
    expRateBonus: 0.30, // 30% progression speed bonus
    autoHarvest: true,
    growthSpeedBonus: 0.25,
    maxHerbSlots: 6,
    realmRequirement: RealmType.NascentSoul,
    description: 'An apex underground fortress. Pure energy fluid flows through the pipes. The ultimate location for evolution.',
  },
  {
    level: 7,
    name: 'Mythic Stronghold',
    cost: 600000,
    expRateBonus: 0.35, // 35% progression speed bonus
    autoHarvest: true,
    growthSpeedBonus: 0.30,
    maxHerbSlots: 8,
    realmRequirement: RealmType.SpiritSevering,
    description: 'A mythic ancient vault. Energy as vast as the sea. Genetic samples grow at incredible speeds.',
  },
  {
    level: 8,
    name: 'Eternal Stronghold',
    cost: 1800000,
    expRateBonus: 0.40, // 40% progression speed bonus
    autoHarvest: true,
    growthSpeedBonus: 0.35,
    maxHerbSlots: 10,
    realmRequirement: RealmType.DaoCombining,
    description: 'An eternal sanctuary beyond time. Energy surges like the tide. A paradise for those who have fused with the wasteland.',
  },
  {
    level: 9,
    name: 'Saintly Stronghold',
    cost: 5000000,
    expRateBonus: 0.45, // 45% progression speed bonus
    autoHarvest: true,
    growthSpeedBonus: 0.40,
    maxHerbSlots: 12,
    realmRequirement: RealmType.LongevityRealm,
    description: 'A saintly domain where energy flows like dragons. The peak of survivors’ living standards.',
  },
  {
    level: 10,
    name: 'Divine Stronghold',
    cost: 15000000,
    expRateBonus: 0.50, // 50% progression speed bonus
    autoHarvest: true,
    growthSpeedBonus: 0.50, // 50% growth speed bonus
    maxHerbSlots: 15, // 15 slots
    realmRequirement: RealmType.LongevityRealm,
    description: 'A divine singularity point. Progression speed is maximized, and biological growth is instantaneous.',
  },
];

// Plantable Biological Samples Configuration
export const PLANTABLE_HERBS = [
  // Common Quality - Level 1 Shelter Required
  { id: 'spirit-grass', name: 'Energy Bloom', growthTime: 30 * 60 * 1000, harvestQuantity: { min: 2, max: 5 }, rarity: 'Common' as ItemRarity, grottoLevelRequirement: 1 },
  { id: 'healing-herb', name: 'Heal Root', growthTime: 30 * 60 * 1000, harvestQuantity: { min: 3, max: 6 }, rarity: 'Common' as ItemRarity, grottoLevelRequirement: 1 },
  { id: 'qi-restoring-herb', name: 'Stim Leaf', growthTime: 45 * 60 * 1000, harvestQuantity: { min: 2, max: 5 }, rarity: 'Common' as ItemRarity, grottoLevelRequirement: 1 },
  { id: 'green-grass', name: 'Green Moss', growthTime: 20 * 60 * 1000, harvestQuantity: { min: 3, max: 7 }, rarity: 'Common' as ItemRarity, grottoLevelRequirement: 1 },
  { id: 'white-flower', name: 'White Glow', growthTime: 25 * 60 * 1000, harvestQuantity: { min: 2, max: 6 }, rarity: 'Common' as ItemRarity, grottoLevelRequirement: 1 },
  { id: 'yellow-essence', name: 'Yellow Essence', growthTime: 40 * 60 * 1000, harvestQuantity: { min: 2, max: 5 }, rarity: 'Common' as ItemRarity, grottoLevelRequirement: 1 },
  // Rare Quality - Level 3 Shelter Required
  { id: 'spirit-concentrating-flower', name: 'Neural Bloom', growthTime: 2 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 3 }, rarity: 'Rare' as ItemRarity, grottoLevelRequirement: 3 },
  { id: 'blood-ginseng', name: 'Bio-Ginseng', growthTime: 2.5 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 3 }, rarity: 'Rare' as ItemRarity, grottoLevelRequirement: 3 },
  { id: 'purple-monkey-flower', name: 'Purple Dusk', growthTime: 3 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 3 }, rarity: 'Rare' as ItemRarity, grottoLevelRequirement: 3 },
  { id: 'spirit-fruit', name: 'Vault Fruit', growthTime: 3 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 3 }, rarity: 'Rare' as ItemRarity, grottoLevelRequirement: 3 },
  { id: 'dragon-scale-fruit', name: 'Drake Scale Fruit', growthTime: 4 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: 'Rare' as ItemRarity, grottoLevelRequirement: 3 },
  { id: 'millennium-ginseng', name: 'Primal Root', growthTime: 4 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: 'Rare' as ItemRarity, grottoLevelRequirement: 3 },
  // Legendary Quality - Level 5 Shelter Required
  { id: 'millennium-lingzhi', name: 'Primal Fungus', growthTime: 6 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: 'Legendary' as ItemRarity, grottoLevelRequirement: 5 },
  { id: 'nine-leaf-grass', name: 'Chronos Fern', growthTime: 8 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: 'Legendary' as ItemRarity, grottoLevelRequirement: 5 },
  { id: 'ten-thousand-year-spirit-milk', name: 'Genesis Fluid', growthTime: 10 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: 'Legendary' as ItemRarity, grottoLevelRequirement: 5 },
  // Mythic Quality - Level 6 Shelter Required
  { id: 'ten-thousand-year-immortal-grass', name: 'Eternal Bloom', growthTime: 12 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: 'Mythic' as ItemRarity, grottoLevelRequirement: 6 },
  { id: 'nine-returning-soul-grass', name: 'Phoenix Leaf', growthTime: 15 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: 'Mythic' as ItemRarity, grottoLevelRequirement: 6 },
  { id: 'void-immortal-grass', name: 'Void Lotus', growthTime: 18 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: 'Mythic' as ItemRarity, grottoLevelRequirement: 6 },
  { id: 'chaos-green-lotus', name: 'Primal Singularity', growthTime: 24 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: 'Mythic' as ItemRarity, grottoLevelRequirement: 6 },
  { id: 'creation-immortal-grass', name: 'Genesis Petal', growthTime: 20 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, rarity: 'Mythic' as ItemRarity, grottoLevelRequirement: 6 },
];

// Energy Array Enhancement Configuration
export interface SpiritArrayEnhancementConfig {
  id: string;
  name: string; // Enhancement Name
  description: string; // Description
  materials: Array<{ name: string; quantity: number }>; // Required Materials
  expRateBonus: number; // Progression speed bonus (e.g., 0.05 for 5%)
  maxLevel?: number; // Maximum enhancement level
  grottoLevelRequirement: number; // Required shelter level
}

export const SPIRIT_ARRAY_ENHANCEMENTS: SpiritArrayEnhancementConfig[] = [
  {
    id: 'enhancement-basic',
    name: 'Basic Energy Tuning',
    description: 'Use basic materials to stabilize the energy flow, increasing progression speed.',
    materials: [
      { name: 'Energy Bloom', quantity: 10 },
      { name: 'Scrap Metal', quantity: 5 },
    ],
    expRateBonus: 0.05,
    grottoLevelRequirement: 1,
  },
  {
    id: 'enhancement-advanced',
    name: 'Advanced Fusion Link',
    description: 'Use rare materials to boost the energy core, significantly increasing progression speed.',
    materials: [
      { name: 'Purple Dusk', quantity: 5 },
      { name: 'Vault Fruit', quantity: 3 },
      { name: 'Steel Plate', quantity: 10 },
    ],
    expRateBonus: 0.10,
    grottoLevelRequirement: 3,
  },
  {
    id: 'enhancement-legendary',
    name: 'Legendary Bio-Sync',
    description: 'Use legendary biological samples to synchronize with the energy core.',
    materials: [
      { name: 'Chronos Fern', quantity: 3 },
      { name: 'Genesis Fluid', quantity: 2 },
      { name: 'Advanced Alloy', quantity: 20 },
    ],
    expRateBonus: 0.15,
    grottoLevelRequirement: 5,
  },
  {
    id: 'enhancement-immortal',
    name: 'Mythic Singularity Bridge',
    description: 'Use mythic samples to bridge the shelter with a singularity, reaching extreme energy levels.',
    materials: [
      { name: 'Primal Singularity', quantity: 2 },
      { name: 'Eternal Bloom', quantity: 2 },
      { name: 'Relic Core', quantity: 30 },
    ],
    expRateBonus: 0.20,
    grottoLevelRequirement: 6,
  },
];

// Bio-Collection (Herbarium) Reward Configuration
export interface HerbariumReward {
  herbCount: number; // Number of unique biological samples collected
  reward: {
    exp?: number;
    spiritStones?: number;
    attributePoints?: number;
    title?: string;
  };
}

export const HERBARIUM_REWARDS: HerbariumReward[] = [
  { herbCount: 5, reward: { exp: 1000, spiritStones: 500 } },
  { herbCount: 10, reward: { exp: 5000, spiritStones: 2000, attributePoints: 1 } },
  { herbCount: 15, reward: { exp: 10000, spiritStones: 5000, attributePoints: 2 } },
  { herbCount: 20, reward: { exp: 20000, spiritStones: 10000, attributePoints: 3, title: 'Bio-Collector' } },
  { herbCount: 25, reward: { exp: 50000, spiritStones: 25000, attributePoints: 5, title: 'Master Botanist' } },
];

// Biological Mutation Configuration
export const HERB_MUTATION_CONFIG = {
  baseMutationChance: 0.05, // 5% base chance
  grottoLevelBonus: 0.01, // 1% bonus per shelter level
  maxMutationChance: 0.25, // 25% max chance
  mutationBonusRange: { min: 1.5, max: 3.0 }, // Mutation bonus multiplier range
  quantityMultiplier: { min: 1.2, max: 2.0 }, // Quantity multiplier for mutated samples
};

// Progression Acceleration Configuration
export const SPEEDUP_CONFIG = {
  dailyLimit: 10, // Daily limit for speedups
  costPerMinute: 10, // Caps per minute
  minCost: 100, // Minimum cost
};