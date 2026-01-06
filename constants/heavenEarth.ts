/**
 * Primal Sentinel System Constants
 * Contains data for Primal Sentinel BOSSes and Fusion Tier challenge configurations.
 */

import { HeavenEarthSoulBoss, RealmType } from '../types';

// ==================== Fusion Tier Challenge System ====================

// Primal Sentinel Boss Data
export const HEAVEN_EARTH_SOUL_BOSSES: Record<string, HeavenEarthSoulBoss> = {
  'boss_001': {
    id: 'boss_001',
    name: 'Solar Sentinel',
    description: 'A powerful guardian condensed from the purest thermal energy in the wasteland.',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 50000,
      defense: 30000,
      hp: 300000,
      spirit: 25000,
      physique: 20000,
      speed: 800
    },
    difficulty: 'easy',
    strengthMultiplier: 1.2,
    specialSkills: [
      {
        id: 'skill_001',
        name: 'Solar Flare',
        description: 'Releases pure thermal energy, dealing massive damage to the enemy.',
        type: 'attack',
        source: 'innate',
        sourceId: 'boss_001',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.3
          }
        ],
        cost: { mana: 1000 },
        cooldown: 0,
        maxCooldown: 3,
        target: 'enemy',
        damage: {
          base: 5000,
          multiplier: 2.0,
          type: 'magical', // Mental/Thermal in wasteland context
          critChance: 0.2,
          critMultiplier: 1.8
        }
      }
    ],
    rewards: {
      exp: 500000,
      spiritStones: 100000,
      items: ['item_001', 'item_002'],
      daoCombiningUnlocked: true
    }
  },
  'boss_002': {
    id: 'boss_002',
    name: 'Vault Sentinel',
    description: 'A formidable entity formed from the geothermal corruption deep within pre-war vaults.',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 60000,
      defense: 35000,
      hp: 400000,
      spirit: 30000,
      physique: 25000,
      speed: 700
    },
    difficulty: 'normal',
    strengthMultiplier: 1.5,
    specialSkills: [
      {
        id: 'skill_002',
        name: 'Toxic Miasma',
        description: 'Summons toxic winds to erode the enemy, dealing persistent damage.',
        type: 'debuff',
        source: 'innate',
        sourceId: 'boss_002',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.2
          },
          {
            type: 'debuff',
            target: 'enemy',
            value: 0.1,
            duration: 3,
            debuffId: 'poison'
          }
        ],
        cost: { mana: 1200 },
        cooldown: 0,
        maxCooldown: 4,
        target: 'enemy',
        damage: {
          base: 4000,
          multiplier: 1.8,
          type: 'magical',
          critChance: 0.15,
          critMultiplier: 2.0
        }
      }
    ],
    rewards: {
      exp: 800000,
      spiritStones: 150000,
      items: ['item_003', 'item_004'],
      daoCombiningUnlocked: true
    }
  },
  'boss_003': {
    id: 'boss_003',
    name: 'Binary Sentinel',
    description: 'A perfect embodiment of symmetry, balancing energy and matter in a bio-mechanical shell.',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 80000,
      defense: 45000,
      hp: 600000,
      spirit: 40000,
      physique: 35000,
      speed: 900
    },
    difficulty: 'hard',
    strengthMultiplier: 2.0,
    specialSkills: [
      {
        id: 'skill_003',
        name: 'Binary Cycle',
        description: 'Alternates between energy and physical phases, dealing dual damage.',
        type: 'attack',
        source: 'innate',
        sourceId: 'boss_003',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.4
          },
          {
            type: 'buff',
            target: 'self',
            value: 0.2,
            duration: 2,
            buffId: 'attack_boost'
          }
        ],
        cost: { mana: 1500 },
        cooldown: 0,
        maxCooldown: 5,
        target: 'enemy',
        damage: {
          base: 7000,
          multiplier: 2.2,
          type: 'magical',
          critChance: 0.25,
          critMultiplier: 2.2
        }
      }
    ],
    rewards: {
      exp: 1200000,
      spiritStones: 250000,
      items: ['item_005', 'item_006'],
      daoCombiningUnlocked: true
    }
  },
  'boss_004': {
    id: 'boss_004',
    name: 'Chaos Sentinel',
    description: 'A terrifying void entity condensed from pure entropic energy.',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 100000,
      defense: 60000,
      hp: 800000,
      spirit: 50000,
      physique: 45000,
      speed: 1000
    },
    difficulty: 'extreme',
    strengthMultiplier: 3.0,
    specialSkills: [
      {
        id: 'skill_004',
        name: 'Chaos Burst',
        description: 'Releases entropic energy, dealing devastating damage.',
        type: 'attack',
        source: 'innate',
        sourceId: 'boss_004',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.6
          },
          {
            type: 'debuff',
            target: 'enemy',
            value: 0.3,
            duration: 2,
            debuffId: 'defense_down'
          }
        ],
        cost: { mana: 2000 },
        cooldown: 0,
        maxCooldown: 6,
        target: 'enemy',
        damage: {
          base: 10000,
          multiplier: 2.5,
          type: 'magical',
          critChance: 0.3,
          critMultiplier: 2.5
        }
      }
    ],
    rewards: {
      exp: 2000000,
      spiritStones: 500000,
      items: ['item_007', 'item_008'],
      daoCombiningUnlocked: true
    }
  },
  'boss_005': {
    id: 'boss_005',
    name: 'Orbital Sentinel',
    description: 'An advanced guardian coordinating energy from high-orbit satellite relays.',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 120000,
      defense: 70000,
      hp: 1000000,
      spirit: 60000,
      physique: 50000,
      speed: 1100
    },
    difficulty: 'extreme',
    strengthMultiplier: 3.5,
    specialSkills: [
      {
        id: 'skill_005',
        name: 'Orbital Strike',
        description: 'Coordinates orbital energy to deal persistent damage and reduce target speed.',
        type: 'debuff',
        source: 'innate',
        sourceId: 'boss_005',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.5
          },
          {
            type: 'debuff',
            target: 'enemy',
            value: 0.25,
            duration: 3,
            debuffId: 'speed_down'
          }
        ],
        cost: { mana: 2500 },
        cooldown: 0,
        maxCooldown: 5,
        target: 'enemy',
        damage: {
          base: 12000,
          multiplier: 2.8,
          type: 'magical',
          critChance: 0.35,
          critMultiplier: 2.8
        }
      }
    ],
    rewards: {
      exp: 2500000,
      spiritStones: 600000,
      items: ['item_009', 'item_010'],
      daoCombiningUnlocked: true
    }
  },
  'boss_006': {
    id: 'boss_006',
    name: 'Storm Sentinel',
    description: 'A massive entity harnessing high-voltage ionic storms to enforce its rule.',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 90000,
      defense: 55000,
      hp: 700000,
      spirit: 45000,
      physique: 40000,
      speed: 1200
    },
    difficulty: 'hard',
    strengthMultiplier: 2.5,
    specialSkills: [
      {
        id: 'skill_006',
        name: 'Ion Surge',
        description: 'Unleashes a massive ionic surge, dealing damage with a high chance of paralysis.',
        type: 'attack',
        source: 'innate',
        sourceId: 'boss_006',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.55
          },
          {
            type: 'debuff',
            target: 'enemy',
            value: 0.15,
            duration: 2,
            debuffId: 'stun'
          }
        ],
        cost: { mana: 1800 },
        cooldown: 0,
        maxCooldown: 4,
        target: 'enemy',
        damage: {
          base: 9000,
          multiplier: 2.4,
          type: 'magical',
          critChance: 0.3,
          critMultiplier: 2.6
        }
      }
    ],
    rewards: {
      exp: 1500000,
      spiritStones: 350000,
      items: ['item_011', 'item_012'],
      daoCombiningUnlocked: true
    }
  },
  'boss_007': {
    id: 'boss_007',
    name: 'Cryo Sentinel',
    description: 'A frozen titan born from industrial liquid nitrogen leaks in polar research facilities.',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 85000,
      defense: 65000,
      hp: 900000,
      spirit: 48000,
      physique: 42000,
      speed: 750
    },
    difficulty: 'hard',
    strengthMultiplier: 2.6,
    specialSkills: [
      {
        id: 'skill_007',
        name: 'Absolute Zero',
        description: 'Releases ultimate cold energy, dealing damage and significantly reducing action speed.',
        type: 'debuff',
        source: 'innate',
        sourceId: 'boss_007',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.4
          },
          {
            type: 'debuff',
            target: 'enemy',
            value: 0.4,
            duration: 4,
            debuffId: 'speed_down'
          }
        ],
        cost: { mana: 1600 },
        cooldown: 0,
        maxCooldown: 5,
        target: 'enemy',
        damage: {
          base: 8000,
          multiplier: 2.2,
          type: 'magical',
          critChance: 0.25,
          critMultiplier: 2.4
        }
      }
    ],
    rewards: {
      exp: 1800000,
      spiritStones: 400000,
      items: ['item_013', 'item_014'],
      daoCombiningUnlocked: true
    }
  },
  'boss_008': {
    id: 'boss_008',
    name: 'Magma Sentinel',
    description: 'A colossal entity fueled by geothermal magma, enforcing the laws of fire.',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 110000,
      defense: 50000,
      hp: 750000,
      spirit: 55000,
      physique: 48000,
      speed: 950
    },
    difficulty: 'extreme',
    strengthMultiplier: 3.2,
    specialSkills: [
      {
        id: 'skill_008',
        name: 'Magma Eruption',
        description: 'Triggers a geothermal eruption, dealing devastating thermal damage.',
        type: 'attack',
        source: 'innate',
        sourceId: 'boss_008',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.65
          },
          {
            type: 'debuff',
            target: 'enemy',
            value: 0.2,
            duration: 3,
            debuffId: 'burn'
          }
        ],
        cost: { mana: 2200 },
        cooldown: 0,
        maxCooldown: 4,
        target: 'enemy',
        damage: {
          base: 11000,
          multiplier: 2.7,
          type: 'magical',
          critChance: 0.32,
          critMultiplier: 2.7
        }
      }
    ],
    rewards: {
      exp: 2200000,
      spiritStones: 550000,
      items: ['item_015', 'item_016'],
      daoCombiningUnlocked: true
    }
  },
  'boss_009': {
    id: 'boss_009',
    name: 'Cyclone Sentinel',
    description: 'A guardian integrated with high-speed wind turbines, enforcing the laws of the storm.',
    realm: RealmType.SpiritSevering,
    baseStats: {
      attack: 95000,
      defense: 58000,
      hp: 850000,
      spirit: 52000,
      physique: 46000,
      speed: 1300
    },
    difficulty: 'extreme',
    strengthMultiplier: 3.1,
    specialSkills: [
      {
        id: 'skill_009',
        name: 'Hurricane Roar',
        description: 'Summons a localized storm, dealing sequential damage and boosting own speed.',
        type: 'attack',
        source: 'innate',
        sourceId: 'boss_009',
        effects: [
          {
            type: 'damage',
            target: 'enemy',
            value: 0.5
          },
          {
            type: 'buff',
            target: 'self',
            value: 0.3,
            duration: 3,
            buffId: 'speed_boost'
          }
        ],
        cost: { mana: 2000 },
        cooldown: 0,
        maxCooldown: 4,
        target: 'enemy',
        damage: {
          base: 9500,
          multiplier: 2.5,
          type: 'magical',
          critChance: 0.28,
          critMultiplier: 2.6
        }
      }
    ],
    rewards: {
      exp: 2100000,
      spiritStones: 520000,
      items: ['item_017', 'item_018'],
      daoCombiningUnlocked: true
    }
  }
};

// Fusion Challenge Configuration
export const DAO_COMBINING_CHALLENGE_CONFIG = {
  requiredRealm: RealmType.SpiritSevering,
  requiredRealmLevel: 9,
  maxBossAttempts: 3,
  bossStrengthMultiplierRange: [0.9, 1.8],
  unlockCondition: {
    mustHaveHeavenEarthMarrow: true,
    mustBeMaxLevel: true,
    mustHaveHighStats: true
  }
};

// ==================== Absolute Limit Configurations ====================
// Prevents infinite stat growth ensuring game balance.

/**
 * Max allocatable attribute points per survival tier.
 * Prevents attribute points from accumulating excessively.
 */
export const MAX_ATTRIBUTE_POINTS_PER_REALM: Record<RealmType, number> = {
  [RealmType.QiRefining]: 5,      // Scavenger: 5 points
  [RealmType.Foundation]: 10,     // Wastelander: 10 points
  [RealmType.GoldenCore]: 20,     // Elite: 20 points
  [RealmType.NascentSoul]: 30,    // Master: 30 points
  [RealmType.SpiritSevering]: 40, // Grandmaster: 40 points
  [RealmType.DaoCombining]: 50,   // Fusion: 50 points
  [RealmType.LongevityRealm]: 60, // Eternal: 60 points
};

/**
 * Max Genetic Aptitude values.
 * Prevents aptitude growth from causing skill scaling issues.
 */
export const MAX_SPIRITUAL_ROOT_VALUE = 100;

/**
 * Max Equipment Enhancement level.
 * Prevents equipment scaling from breaking balance.
 */
export const MAX_EQUIPMENT_LEVEL = 20;

/**
 * Max Item Stack capacity.
 * Prevents inventory overflow issues.
 */
export const MAX_ITEM_QUANTITY = 9999;

/**
 * Combat Turn Limit.
 * Prevents infinite combat loops.
 */
export const MAX_BATTLE_ROUNDS = 100;

/**
 * Item Sale Price Limit.
 * Prevents price overflows in extreme scenarios.
 */
export const MAX_ITEM_SELL_PRICE = 10000000; // 10 million caps/stones
