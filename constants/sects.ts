/**
 * Faction (Community) System Constants
 */

import { RealmType, SectRank, SecretRealm, Item, ItemType } from '../types';

export type SectGrade = 'S' | 'A' | 'B' | 'C'; // S is highest, C is lowest

export interface SectInfo {
  id: string;
  name: string;
  description: string;
  reqRealm: RealmType;
  grade: SectGrade; // Faction Grade
  exitCost?: {
    // Cost to safely exit the faction
    spiritStones?: number;
    items?: { name: string; quantity: number }[];
  };
}

export const SECTS: SectInfo[] = [
  {
    id: 'sect-minutemen',
    name: 'Minutemen',
    description: 'A community-focused militia dedicated to protecting settlements. Provides resource production bonuses.',
    reqRealm: RealmType.QiRefining,
    grade: 'C',
    exitCost: {
      spiritStones: 200,
      items: [{ name: 'Scrap Metal', quantity: 5 }],
    },
  },
  {
    id: 'sect-railroad',
    name: 'The Railroad',
    description: 'An underground organization specializing in covert operations. Provides stealth and critical hit bonuses.',
    reqRealm: RealmType.QiRefining,
    grade: 'B',
    exitCost: {
      spiritStones: 500,
      items: [{ name: 'Stealth Boy', quantity: 2 }],
    },
  },
  {
    id: 'sect-brotherhood',
    name: 'Brotherhood of Steel',
    description: 'A military order dedicated to recovering pre-war technology. Provides Power Armor and heavy weapons bonuses.',
    reqRealm: RealmType.Foundation,
    grade: 'A',
    exitCost: {
      spiritStones: 2000,
      items: [{ name: 'Fusion Core', quantity: 5 }],
    },
  },
  {
    id: 'sect-institute',
    name: 'The Institute',
    description: 'Advanced scientists pursuing perfection through synth technology. Provides intelligence and energy weapon bonuses.',
    reqRealm: RealmType.GoldenCore,
    grade: 'A',
    exitCost: {
      spiritStones: 5000,
      items: [{ name: 'Synth Component', quantity: 10 }],
    },
  },
  {
    id: 'sect-enclave',
    name: 'The Enclave',
    description: 'The remnants of the pre-war US government. An elite, pure-human supremacist faction with unmatched firepower.',
    reqRealm: RealmType.NascentSoul,
    grade: 'S',
    exitCost: {
      spiritStones: 50000,
      items: [{ name: 'Enclave Keycard', quantity: 1 }],
    },
  },
];


// Faction Leader Challenge Requirements & Rewards
export const SECT_MASTER_CHALLENGE_REQUIREMENTS = {
  minRealm: RealmType.NascentSoul, // Evolved state required
  minContribution: 10000, // 10000 faction contribution
  challengeCost: {
    spiritStones: 50000, // 50000 caps required
  },
  victoryReward: {
    exp: 50000, // 50000 exp
    spiritStones: 100000, // 100000 caps
  },
  defeatPenalty: {
    expLoss: 10000,
    contributionLoss: 2000,
    hpLossPercent: 0.3,
  },
};

// Faction Promotion Base Rewards
export const SECT_PROMOTION_BASE_REWARDS: Record<SectRank, {
  exp: number;
  spiritStones: number;
  contribution: number;
}> = {
  [SectRank.Outer]: {
    exp: 0,
    spiritStones: 0,
    contribution: 0,
  },
  [SectRank.Inner]: {
    exp: 100,
    spiritStones: 50,
    contribution: 100,
  },
  [SectRank.Core]: {
    exp: 500,
    spiritStones: 200,
    contribution: 500,
  },
  [SectRank.Elder]: {
    exp: 2000,
    spiritStones: 1000,
    contribution: 2000,
  },
  [SectRank.Leader]: {
    exp: 10000,
    spiritStones: 50000,
    contribution: 5000,
  },
};

// Faction Special Rewards (by Faction ID and Rank)
export const SECT_SPECIAL_REWARDS: Record<string, Partial<Record<SectRank, {
  items: Array<{ name: string; quantity: number }>;
}>>> = {
  // Special rewards can be added here for specific factions
  // Example:
  // 'sect-cloud': {
  //   [SectRank.Leader]: {
  //     items: [{ name: 'Haven Heritage', quantity: 1 }],
  //   },
  // },
};

// Faction Rank Promotion Requirements
export const SECT_RANK_REQUIREMENTS: Record<SectRank, {
  contribution: number;
  realmIndex: number;
}> = {
  [SectRank.Outer]: {
    contribution: 0, // Initial rank, no requirements
    realmIndex: 0, // Scavenger
  },
  [SectRank.Inner]: {
    contribution: 100, // Requires 100 contribution
    realmIndex: 0, // Scavenger
  },
  [SectRank.Core]: {
    contribution: 500, // Requires 500 contribution
    realmIndex: 1, // Wastelander
  },
  [SectRank.Elder]: {
    contribution: 2000, // Requires 2000 contribution
    realmIndex: 2, // Mutant/Elite
  },
  [SectRank.Leader]: {
    contribution: 10000, // Requires 10000 contribution (via challenge)
    realmIndex: 3, // Evolved/Master
  },
};

// Faction Rank Display Data
export const SECT_RANK_DATA: Record<SectRank, {
  title: string;
  description?: string;
}> = {
  [SectRank.Outer]: {
    title: 'Recruit',
    description: 'The entry-level rank in the faction.',
  },
  [SectRank.Inner]: {
    title: 'Soldier',
    description: 'A formal member of the organization.',
  },
  [SectRank.Core]: {
    title: 'Elite',
    description: 'A highly trusted member with special privileges.',
  },
  [SectRank.Elder]: {
    title: 'Officer',
    description: 'Part of the high-level management of the faction.',
  },
  [SectRank.Leader]: {
    title: 'Overseer',
    description: 'The absolute head of the faction.',
  },
};

export const SECT_SHOP_ITEMS: {
  name: string;
  cost: number;
  item: Omit<Item, 'id'>;
}[] = [
    {
      name: 'Reinforcement Kit',
      cost: 10,
      item: {
        name: 'Reinforcement Kit',
        type: ItemType.Material,
        description: 'Basic materials used to strengthen equipment.',
        quantity: 1,
        rarity: 'Common',
      },
    },
    {
      name: 'Energy Drink',
      cost: 20,
      item: {
        name: 'Energy Drink',
        type: ItemType.Pill,
        description: 'Greatly increases progression speed for a short duration.',
        quantity: 1,
        rarity: 'Common',
        effect: { exp: 50 },
      },
    },
    {
      name: 'Mutant Flower',
      cost: 50,
      item: {
        name: 'Mutant Flower',
        type: ItemType.Herb,
        description: 'A rare flower found in contaminated valleys, used for bone-refining.',
        quantity: 1,
        rarity: 'Rare',
      },
    },
    {
      name: 'Bone-Hardener',
      cost: 100,
      item: {
        name: 'Bone-Hardener',
        type: ItemType.Pill,
        description: 'Strengthens the physical form, slightly increasing maximum HP.',
        quantity: 1,
        rarity: 'Rare',
        effect: { hp: 50 },
      },
    },
    {
      name: 'Evolution Catalyst',
      cost: 1000,
      item: {
        name: 'Evolution Catalyst',
        type: ItemType.Pill,
        description: 'Increases the success rate of breakthrough to the next survival tier.',
        quantity: 1,
        rarity: 'Legendary',
        effect: { exp: 500 },
      },
    },
    {
      name: 'High-Grade Core',
      cost: 500,
      item: {
        name: 'High-Grade Core',
        type: ItemType.Material,
        description: 'A powerful core from a rare mutant beast, filled with energy.',
        quantity: 1,
        rarity: 'Rare',
      },
    },
  ];
