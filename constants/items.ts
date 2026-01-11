/**
 * Item System Constants
 */

import { Item, ItemType, Recipe, ItemRarity, EquipmentSlot } from '../types';

export const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
  Common: 1,
  Rare: 1.5,
  Legendary: 2.5,
  Mythic: 6.0,
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
    name: 'Glowing Fungus',
    type: ItemType.Herb,
    description: 'A neon-green mushroom. Essential for synthesizing RadAway.',
    quantity: 5,
    rarity: 'Common',
  },
  {
    id: 'mutfruit',
    name: 'Mutfruit',
    type: ItemType.Herb,
    description: 'A sweet, mutated fruit. A staple of the wasteland diet.',
    quantity: 1,
    rarity: 'Common',
  },
  {
    id: 'bloodleaf',
    name: 'Bloodleaf',
    type: ItemType.Herb,
    description: 'Red leaves found near water. Used in healing salves.',
    quantity: 1,
    rarity: 'Common',
  },
  {
    id: 'hubflower',
    name: 'Hubflower',
    type: ItemType.Herb,
    description: 'A purple flower used to synthesize psychoactive chems.',
    quantity: 1,
    rarity: 'Common',
  },
  {
    id: 'brain-fungus',
    name: 'Brain Fungus',
    type: ItemType.Herb,
    description: 'A fungus that resembles a human brain. Increases intelligence when consumed.',
    quantity: 1,
    rarity: 'Common',
  },
  {
    id: 'mutated-fern',
    name: 'Mutated Fern',
    type: ItemType.Herb,
    description: 'A hardy fern that has adapted to high radiation levels.',
    quantity: 1,
    rarity: 'Rare',
  },
  {
    id: 'glowing-blood',
    name: 'Glowing Blood',
    type: ItemType.Material,
    description: 'Radioactive blood from a glowing creature.',
    quantity: 1,
    rarity: 'Rare',
  },
  {
    id: 'xander-root',
    name: 'Xander Root',
    type: ItemType.Herb,
    description: 'A root vegetable found in the wasteland. Used in various remedies.',
    quantity: 1,
    rarity: 'Common',
  },
  {
    id: 'ash-rose',
    name: 'Ash Rose',
    type: ItemType.Herb,
    description: 'A resilient flower that grows in volcanic ash.',
    quantity: 1,
    rarity: 'Rare',
  },
  {
    id: 'thistle',
    name: 'Thistle',
    type: ItemType.Herb,
    description: 'A spiky plant that can survive in harsh conditions.',
    quantity: 1,
    rarity: 'Rare',
  },
  {
    id: 'quantum-leaf',
    name: 'Quantum Leaf',
    type: ItemType.Herb,
    description: 'A leaf that shimmers with quantum energy.',
    quantity: 1,
    rarity: 'Legendary',
  },
  {
    id: 'cave-fungus',
    name: 'Cave Fungus',
    type: ItemType.Herb,
    description: 'Fungus found in deep, damp caves. Potent medicinal properties.',
    quantity: 1,
    rarity: 'Legendary',
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
    ingredients: [{ name: 'Glowing Fungus', qty: 3 }],
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
      { name: 'Bloodleaf', qty: 3 },
      { name: 'Glowing Fungus', qty: 1 },
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
      { name: 'Brain Fungus', qty: 2 },
      { name: 'Mutfruit', qty: 1 },
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
      { name: 'Xander Root', qty: 2 },
      { name: 'Nuclear Material', qty: 1 },
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
      { name: 'Thistle', qty: 3 },
      { name: 'Refined Nuclear Material', qty: 2 },
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
      { name: 'FEV Sample', qty: 1 },
      { name: 'Quantum Leaf', qty: 1 },
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
      { name: 'Xander Root', qty: 2 },
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
      { name: 'Nirvana Root', qty: 1 },
      { name: 'Cave Fungus', qty: 2 },
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
      { name: 'FEV Sample', qty: 2 },
      { name: 'Quantum Leaf', qty: 2 },
      { name: 'Thistle', qty: 3 },
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
      { name: 'Mutfruit', qty: 3 },
      { name: 'Brain Fungus', qty: 2 },
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
      { name: 'Ash Rose', qty: 3 },
      { name: 'Bio-Fruit', qty: 3 },
      { name: 'Refined Nuclear Material', qty: 2 },
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
      { name: 'Glowing Blood', qty: 3 },
      { name: 'Mutated Fern', qty: 3 },
      { name: 'Hubflower', qty: 2 },
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

// Additional pill recipes obtainable through experience (these will not be displayed in the initial alchemy panel and need to be unlocked by using recipe items)
export const DISCOVERABLE_RECIPES: Recipe[] = [
  {
    name: 'Survival Protocol',
    cost: 1500,
    ingredients: [
      { name: 'Cave Fungus', qty: 2 },
      { name: 'Brain Fungus', qty: 3 },
    ],
    result: {
      name: 'Survival Protocol',
      type: ItemType.Pill,
      description: 'Greatly increases survival odds. Grants massive experience.',
      rarity: 'Legendary',
      effect: { exp: 5000 },
      permanentEffect: { maxHp: 100, defense: 20 },
    },
  },
  {
    name: 'Clarity Shot',
    cost: 150,
    ingredients: [
      { name: 'Brain Fungus', qty: 3 },
      { name: 'Glowing Fungus', qty: 2 },
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
      { name: 'Bloodleaf', qty: 3 },
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
      { name: 'Cave Fungus', qty: 1 },
      { name: 'Nuclear Material', qty: 2 },
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
      { name: 'Nirvana Root', qty: 1 },
      { name: 'Refined Nuclear Material', qty: 3 },
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
      { name: 'FEV Sample', qty: 2 },
      { name: 'Quantum Leaf', qty: 2 },
      { name: 'Thistle', qty: 5 },
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
      { name: 'Cave Fungus', qty: 2 },
      { name: 'Nuclear Material', qty: 3 },
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
      { name: 'Nirvana Root', qty: 1 },
      { name: 'Cave Fungus', qty: 2 },
      { name: 'Refined Nuclear Material', qty: 2 },
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
      { name: 'FEV Sample', qty: 1 },
      { name: 'Quantum Leaf', qty: 2 },
      { name: 'Thistle', qty: 3 },
      { name: 'Refined Nuclear Material', qty: 3 },
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
    name: 'Nuclear Material',
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
    name: 'Irradiated Ore',
    type: ItemType.Material,
    description: 'A stone that glows with an eerie light, helpful for evolution.',
    quantity: 1,
    rarity: 'Rare',
  },
  {
    id: 'star-fragment',
    name: 'Meteorite Chunk',
    type: ItemType.Material,
    description: 'A fragment of a fallen star, vibrating with mysterious energy.',
    quantity: 1,
    rarity: 'Rare',
  },
  {
    id: 'dragon-scale',
    name: 'Deathclaw Hide',
    type: ItemType.Material,
    description: 'A thick, near-indestructible scale from a prime mutant.',
    quantity: 1,
    rarity: 'Legendary',
  },
  {
    id: 'phoenix-feather',
    name: 'Scorchbeast Wing',
    type: ItemType.Material,
    description: 'A wing membrane that never stops smoldering.',
    quantity: 1,
    rarity: 'Legendary',
  },
  {
    id: 'qilin-horn',
    name: 'Behemoth Bone',
    type: ItemType.Material,
    description: 'A bone from a legendary wasteland beast.',
    quantity: 1,
    rarity: 'Legendary',
  },
  {
    id: 'fairy-fruit',
    name: 'Nirvana Root',
    type: ItemType.Material,
    description: 'A rare root that grew in a high-radiation zone.',
    quantity: 1,
    rarity: 'Rare',
  },
  {
    id: 'heaven-earth-treasure',
    name: 'G.E.C.K. Component',
    type: ItemType.Material,
    description: 'A pre-war relic of immense value and power.',
    quantity: 1,
    rarity: 'Legendary',
  },
  {
    id: 'divine-beast-essence',
    name: 'Cryptid Essence',
    type: ItemType.Material,
    description: 'Concentrated power from an apex mutant.',
    quantity: 1,
    rarity: 'Legendary',
  },
  {
    id: 'chaos-stone',
    name: 'Plasma Core',
    type: ItemType.Material,
    description: 'A glowing core from the heart of the chaos zone.',
    quantity: 1,
    rarity: 'Mythic',
  },
  {
    id: 'dao-fragment',
    name: 'Encrypted Holotape',
    type: ItemType.Material,
    description: 'A piece of a master control unit, containing advanced logic.',
    quantity: 1,
    rarity: 'Mythic',
  },
  {
    id: 'fairy-essence',
    name: 'Pure Isotope',
    type: ItemType.Material,
    description: 'The purest form of energy found in the wasteland.',
    quantity: 1,
    rarity: 'Mythic',
  },
  {
    id: 'creation-liquid',
    name: 'FEV Sample',
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
