/**
 * Item System Constants
 */

import { Item, ItemType, Recipe, ItemRarity, EquipmentSlot } from '../types';

export const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
  Common: 1,
  Rare: 1.5,
  Legendary: 2.5,
  Mythic: 6.0,
  普通: 1,
  稀有: 1.5,
  传说: 2.5,
  仙品: 6.0,
};

// Initial survival kit
export const INITIAL_ITEMS: Item[] = [
  {
    id: 'refining-stone',
    name: 'Scrap Metal',
    type: ItemType.Material,
    description: 'A pieces of sturdy metal scrap. The basic material for upgrading your gear.',
    quantity: 10,
    rarity: 'Common',
  },
  {
    id: 'healing-herb',
    name: 'Dirty Bandage',
    type: ItemType.Herb,
    description: 'A rough bandage for stop bleeding and recovering health.',
    quantity: 2,
    rarity: 'Common',
    effect: { hp: 20 },
  },
  {
    id: 'spirit-gathering-grass',
    name: 'Energy Bloom',
    type: ItemType.Herb,
    description: 'A biological plant that synthesizes energy from the air. Essential for various tech blueprints.',
    quantity: 5,
    rarity: 'Common',
  },
  {
    id: 'iron-sword',
    name: 'Rusty Pipe',
    type: ItemType.Weapon,
    description: 'A heavy metal pipe with some rust on it. It’s better than nothing.',
    quantity: 1,
    rarity: 'Common',
    level: 0,
    isEquippable: true,
    equipmentSlot: EquipmentSlot.Weapon,
    effect: { attack: 15 },
  },
  {
    id: 'cloth-robe',
    name: 'Scavenger Rags',
    type: ItemType.Armor,
    description: 'Basic protection for early days in the wasteland. Provides minimal defense.',
    quantity: 1,
    rarity: 'Common',
    level: 0,
    isEquippable: true,
    equipmentSlot: EquipmentSlot.Chest,
    effect: { defense: 3, hp: 10 },
  },
];

export const PILL_RECIPES: Recipe[] = [
  {
    name: 'Mentats',
    cost: 10,
    ingredients: [{ name: 'Energy Bloom', qty: 3 }],
    result: {
      name: 'Mentats',
      type: ItemType.Pill,
      description: 'Pre-war intelligence booster. Increases perception and accelerates learning.',
      rarity: 'Common',
      effect: { exp: 150 },
    },
  },
  {
    name: 'Stimpak',
    cost: 20,
    ingredients: [
      { name: 'Heal Root', qty: 3 },
      { name: 'Energy Bloom', qty: 1 },
    ],
    result: {
      name: 'Stimpak',
      type: ItemType.Pill,
      description: 'The standard medical solution of the wasteland. Instantly restores health.',
      rarity: 'Rare',
      effect: { hp: 200 },
    },
  },
  {
    name: 'Buffout',
    cost: 100,
    ingredients: [
      { name: 'Neural Bloom', qty: 2 },
      { name: 'Vault Fruit', qty: 1 },
    ],
    result: {
      name: 'Buffout',
      type: ItemType.Pill,
      description: 'A powerful steroid that permanently increases strength and endurance.',
      rarity: 'Rare',
      permanentEffect: { maxHp: 50 },
    },
  },
  {
    name: 'Psycho',
    cost: 500,
    ingredients: [
      { name: 'Primal Root', qty: 2 },
      { name: 'Mutant Core', qty: 1 },
    ],
    result: {
      name: 'Psycho',
      type: ItemType.Pill,
      description: 'A combat drug that unleashes primal fury. Massively boosts damage and aggression.',
      rarity: 'Legendary',
      effect: { exp: 500 },
      permanentEffect: { spirit: 30, physique: 30, maxHp: 100 },
    },
  },
  {
    name: 'Titan Blood Serum',
    cost: 2000,
    ingredients: [
      { name: 'Drake Scale Fruit', qty: 3 },
      { name: 'Apex Mutant Core', qty: 2 },
    ],
    result: {
      name: 'Titan Blood Serum',
      type: ItemType.Pill,
      description: 'Infused with the essence of a titan, this serum grants massive health and endurance.',
      rarity: 'Legendary',
      permanentEffect: { maxHp: 500, physique: 50 },
    },
  },
  {
    name: 'Apex Fusion Shot',
    cost: 5000,
    ingredients: [
      { name: 'Genesis Fluid', qty: 1 },
      { name: 'Chronos Fern', qty: 1 },
    ],
    result: {
      name: 'Apex Fusion Shot',
      type: ItemType.Pill,
      description: 'A legendary substance that pushes the human body to its absolute limits, granting massive permanent boosts.',
      rarity: 'Mythic',
      effect: { exp: 50000 },
      permanentEffect: { maxLifespan: 1000, spirit: 1000, attack: 1000, defense: 1000, physique: 1000, speed: 1000 },
    },
  },
  {
    name: 'Life Extender',
    cost: 300,
    ingredients: [
      { name: 'Primal Root', qty: 2 },
      { name: 'Bio-Ginseng', qty: 3 },
    ],
    result: {
      name: 'Life Extender',
      type: ItemType.Pill,
      description: 'A chemical compound that repairs cellular damage, extending survival days by 10.',
      rarity: 'Rare',
      effect: { lifespan: 10 },
    },
  },
  {
    name: 'Eternity Serum',
    cost: 1500,
    ingredients: [
      { name: 'Eternal Bloom', qty: 1 },
      { name: 'Primal Fungus', qty: 2 },
    ],
    result: {
      name: 'Eternity Serum',
      type: ItemType.Pill,
      description: 'A rare serum that resets biological aging, granting 50 extra survival days.',
      rarity: 'Legendary',
      permanentEffect: { maxLifespan: 50 },
    },
  },
  {
    name: 'Immortal Compound',
    cost: 8000,
    ingredients: [
      { name: 'Genesis Fluid', qty: 2 },
      { name: 'Chronos Fern', qty: 2 },
      { name: 'Drake Scale Fruit', qty: 3 },
    ],
    result: {
      name: 'Immortal Compound',
      type: ItemType.Pill,
      description: 'The ultimate survival drug. Grants massive lifespan increases and slows cellular decay.',
      rarity: 'Mythic',
      effect: { lifespan: 200 },
      permanentEffect: { maxLifespan: 500 },
    },
  },
  {
    name: 'Purification Shot',
    cost: 400,
    ingredients: [
      { name: 'Vault Fruit', qty: 3 },
      { name: 'Neural Bloom', qty: 2 },
    ],
    result: {
      name: 'Purification Shot',
      type: ItemType.Pill,
      description: 'Purifies the bloodstream, permanently increasing all elemental resistances.',
      rarity: 'Rare',
      permanentEffect: {
        spiritualRoots: {
          metal: 5,
          wood: 5,
          water: 5,
          fire: 5,
          earth: 5,
        },
      },
    },
  },
  {
    name: 'Elemental Balance Shot',
    cost: 2500,
    ingredients: [
      { name: 'Ancient Root', qty: 3 },
      { name: 'Bio-Fruit', qty: 3 },
      { name: 'Apex Mutant Core', qty: 2 },
    ],
    result: {
      name: 'Elemental Balance Shot',
      type: ItemType.Pill,
      description: 'Perfectly balances the body’s internal systems, improving overall efficiency.',
      rarity: 'Legendary',
      permanentEffect: {
        spiritualRoots: {
          metal: 3,
          wood: 3,
          water: 3,
          fire: 3,
          earth: 3,
        },
      },
    },
  },
  {
    name: 'Nova Core Serum',
    cost: 10000,
    ingredients: [
      { name: 'Primal Ichor', qty: 3 },
      { name: 'Nine-Leaf Flora', qty: 3 },
      { name: 'Pristine Flora', qty: 2 },
    ],
    result: {
      name: 'Nova Core Serum',
      type: ItemType.Pill,
      description: 'A mythic serum that aligns all internal systems to peak performance.',
      rarity: 'Mythic',
      permanentEffect: {
        spiritualRoots: {
          metal: 10,
          wood: 10,
          water: 10,
          fire: 10,
          earth: 10,
        },
      },
    },
  },
];

// 可通过历练获得的额外丹方（这些不会在初始炼丹面板中显示，需要通过使用丹方物品解锁）
export const DISCOVERABLE_RECIPES: Recipe[] = [
  {
    name: 'Clarity Shot',
    cost: 150,
    ingredients: [
      { name: 'Neural Bloom', qty: 3 },
      { name: 'Energy Bloom', qty: 2 },
    ],
    result: {
      name: 'Clarity Shot',
      type: ItemType.Pill,
      description: 'Improves focus and perception. Permanently increases perception attribute.',
      rarity: 'Rare',
      permanentEffect: { spirit: 20 },
    },
  },
  {
    name: 'Hardening Serum',
    cost: 200,
    ingredients: [
      { name: 'Bio-Ginseng', qty: 2 },
      { name: 'Heal Root', qty: 3 },
    ],
    result: {
      name: 'Hardening Serum',
      type: ItemType.Pill,
      description: 'Strengthens the body. Permanently increases endurance attribute.',
      rarity: 'Rare',
      permanentEffect: { physique: 20 },
    },
  },
  {
    name: 'Breakthrough Cocktail',
    cost: 800,
    ingredients: [
      { name: 'Primal Fungus', qty: 1 },
      { name: 'Mutant Core', qty: 2 },
    ],
    result: {
      name: 'Breakthrough Cocktail',
      type: ItemType.Pill,
      description: 'A cocktail that assists in breaking through survival tiers, granting massive exp and stats.',
      rarity: 'Legendary',
      effect: { exp: 10000 },
      permanentEffect: { spirit: 50, physique: 50, attack: 30, defense: 30 },
    },
  },
  {
    name: 'Apex Serum',
    cost: 3000,
    ingredients: [
      { name: 'Eternal Bloom', qty: 1 },
      { name: 'Apex Mutant Core', qty: 3 },
    ],
    result: {
      name: 'Apex Serum',
      type: ItemType.Pill,
      description: 'A serum that grants a massive boost to all survival attributes.',
      rarity: 'Legendary',
      effect: { exp: 2000, spirit: 50, physique: 50 },
      permanentEffect: { maxLifespan: 300, spirit: 300, attack: 300, defense: 300, physique: 300, speed: 300 },
    },
  },
  {
    name: 'T-Cell Serum',
    cost: 10000,
    ingredients: [
      { name: 'Genesis Fluid', qty: 2 },
      { name: 'Chronos Fern', qty: 2 },
      { name: 'Drake Scale Fruit', qty: 5 },
    ],
    result: {
      name: 'T-Cell Serum',
      type: ItemType.Pill,
      description: 'A top-tier serum that grants incredible growth to all survival attributes.',
      rarity: 'Mythic',
      effect: {
        exp: 10000,
      },
      permanentEffect: { maxLifespan: 500, spirit: 500, attack: 500, defense: 500, physique: 500, speed: 500 },
    },
  },
  {
    name: 'Concentrated Core',
    cost: 3000,
    ingredients: [
      { name: 'Primal Fungus', qty: 2 },
      { name: 'Mutant Core', qty: 3 },
    ],
    result: {
      name: 'Concentrated Core',
      type: ItemType.Pill,
      description: 'Assists in evolving to the Mutant tier. Grants massive exp and perception.',
      rarity: 'Rare',
      effect: { exp: 30000, spirit: 20 },
      permanentEffect: { spirit: 50, maxHp: 200 },
    },
  },
  {
    name: 'Soul Link Serum',
    cost: 4000,
    ingredients: [
      { name: 'Eternal Bloom', qty: 1 },
      { name: 'Primal Fungus', qty: 2 },
      { name: 'Apex Mutant Core', qty: 2 },
    ],
    result: {
      name: 'Soul Link Serum',
      type: ItemType.Pill,
      description: 'Permanently links neural pathways, greatly increasing perception and health.',
      rarity: 'Legendary',
      effect: { exp: 10000, spirit: 50, hp: 300 },
      permanentEffect: { spirit: 100, maxHp: 300, attack: 50 },
    },
  },
  {
    name: 'Phoenix Protocol',
    cost: 6000,
    ingredients: [
      { name: 'Genesis Fluid', qty: 1 },
      { name: 'Chronos Fern', qty: 2 },
      { name: 'Drake Scale Fruit', qty: 3 },
      { name: 'Apex Mutant Core', qty: 3 },
    ],
    result: {
      name: 'Phoenix Protocol',
      type: ItemType.Pill,
      description: 'A protocol that mimics the regeneration of a phoenix, granting incredible survival boosts.',
      rarity: 'Legendary',
      effect: { hp: 800, exp: 1500, attack: 30 },
      permanentEffect: { maxHp: 400, attack: 100, defense: 100, spirit: 80, physique: 80, speed: 50 },
    },
  },
];

// Unified Pill Pool: Merges all pill recipes for use in other modules
export const ALL_PILL_RECIPES = [...PILL_RECIPES, ...DISCOVERABLE_RECIPES];

// Retrieves a pill definition by name
export const getPillDefinition = (pillName: string): Recipe['result'] | null => {
  const recipe = ALL_PILL_RECIPES.find(r => r.result.name === pillName);
  return recipe ? recipe.result : null;
};

// Common Pill Quick Access
export const COMMON_PILLS = {
  EnergyCell: () => getPillDefinition('Energy Cell'),
  RejuvenationShot: () => getPillDefinition('Rejuvenation Shot'),
  HealShot: () => getPillDefinition('Heal Shot'),
  GenModShot: () => getPillDefinition('Gen-Mod Shot'),
  SurvivalProtocol: () => getPillDefinition('Survival Protocol'),
  TitanBloodSerum: () => getPillDefinition('Titan Blood Serum'),
  ApexFusionShot: () => getPillDefinition('Apex Fusion Shot'),
  LifeExtender: () => getPillDefinition('Life Extender'),
  EternitySerum: () => getPillDefinition('Eternity Serum'),
  ImmortalCompound: () => getPillDefinition('Immortal Compound'),
  PurificationShot: () => getPillDefinition('Purification Shot'),
  ElementalBalanceShot: () => getPillDefinition('Elemental Balance Shot'),
  NovaCoreSerum: () => getPillDefinition('Nova Core Serum'),
  ClarityShot: () => getPillDefinition('Clarity Shot'),
  HardeningSerum: () => getPillDefinition('Hardening Serum'),
  BreakthroughCocktail: () => getPillDefinition('Breakthrough Cocktail'),
  ApexSerum: () => getPillDefinition('Apex Serum'),
  TCellSerum: () => getPillDefinition('T-Cell Serum'),
};

// Mutant Pet Evolution Materials
export const PET_EVOLUTION_MATERIALS_ITEMS: Item[] = [
  // Note: Energy Bloom is already defined in INITIAL_ITEMS as an herb
  {
    id: 'monster-core',
    name: 'Mutant Core',
    type: ItemType.Material,
    description: 'A core found within mutant creatures, containing raw power.',
    quantity: 1,
    rarity: 'Common',
  },
  {
    id: 'spirit-beast-blood',
    name: 'Mutant Blood',
    type: ItemType.Material,
    description: 'Concentrated mutant blood, containing immense vitality.',
    quantity: 1,
    rarity: 'Rare',
  },
  {
    id: 'moonlight-stone',
    name: 'Glow Stone',
    type: ItemType.Material,
    description: 'A stone that glows with an eerie light, helpful for evolution.',
    quantity: 1,
    rarity: 'Rare',
  },
  {
    id: 'star-fragment',
    name: 'Meteor Fragment',
    type: ItemType.Material,
    description: 'A fragment of a fallen star, vibrating with mysterious energy.',
    quantity: 1,
    rarity: 'Rare',
  },
  {
    id: 'dragon-scale',
    name: 'Tough Scale',
    type: ItemType.Material,
    description: 'A thick, near-indestructible scale from a prime mutant.',
    quantity: 1,
    rarity: 'Legendary',
  },
  {
    id: 'phoenix-feather',
    name: 'Fiery Feather',
    type: ItemType.Material,
    description: 'A feather that never stops smoldering.',
    quantity: 1,
    rarity: 'Legendary',
  },
  {
    id: 'qilin-horn',
    name: 'Mythic Horn',
    type: ItemType.Material,
    description: 'A horn from a legendary wasteland beast.',
    quantity: 1,
    rarity: 'Legendary',
  },
  {
    id: 'fairy-fruit',
    name: 'Mutant Fruit',
    type: ItemType.Material,
    description: 'A rare fruit that grew in a high-radiation zone.',
    quantity: 1,
    rarity: 'Rare',
  },
  {
    id: 'heaven-earth-treasure',
    name: 'Rare Relic',
    type: ItemType.Material,
    description: 'A pre-war relic of immense value and power.',
    quantity: 1,
    rarity: 'Legendary',
  },
  {
    id: 'divine-beast-essence',
    name: 'Essence of Power',
    type: ItemType.Material,
    description: 'Concentrated power from an apex mutant.',
    quantity: 1,
    rarity: 'Legendary',
  },
  {
    id: 'chaos-stone',
    name: 'Chaos Core',
    type: ItemType.Material,
    description: 'A glowing core from the heart of the chaos zone.',
    quantity: 1,
    rarity: 'Mythic',
  },
  {
    id: 'dao-fragment',
    name: 'Code Fragment',
    type: ItemType.Material,
    description: 'A piece of a master control unit, containing advanced logic.',
    quantity: 1,
    rarity: 'Mythic',
  },
  {
    id: 'fairy-essence',
    name: 'Pure Essence',
    type: ItemType.Material,
    description: 'The purest form of energy found in the wasteland.',
    quantity: 1,
    rarity: 'Mythic',
  },
  {
    id: 'creation-liquid',
    name: 'Origin Fluid',
    type: ItemType.Material,
    description: 'A mysterious fluid that can reshape organic matter.',
    quantity: 1,
    rarity: 'Mythic',
  },
];

// Upgrade Constants
export const UPGRADE_MATERIAL_NAME = 'Scrap Metal';
export const UPGRADE_STONE_NAME = 'Hardener';
export const BASE_UPGRADE_COST_STONES = 50;
export const BASE_UPGRADE_COST_MATS = 2;
export const UPGRADE_STONE_SUCCESS_BONUS = 0.1; // Each hardener increases success rate by 10%

// Returns percentage increase (0.1 = 10%)
export const getUpgradeMultiplier = (rarity: ItemRarity = 'Common') => {
  switch (rarity) {
    case 'Common':
      return 0.1;
    case 'Rare':
      return 0.15;
    case 'Legendary':
      return 0.2;
    case 'Mythic':
      return 0.25;
    default:
      return 0.1;
  }
};
