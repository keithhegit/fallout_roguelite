import {
  AdventureResult,
  AdventureType,
  PlayerStats,
  RealmType,
  RiskLevel,
  ItemRarity,
  ItemType,
  EquipmentSlot,
  BattleState,
  BattleUnit,
  BattleSkill,
  BattleAction,
  PlayerAction,
  Buff,
  Debuff,
  Item,
  PetSkill,
  SectRank,
  CultivationArt,
  FoundationTreasure,
  HeavenEarthEssence,
  HeavenEarthMarrow,
  LongevityRule,
} from '../types';
import {
  REALM_ORDER,
  REALM_DATA,
  DISCOVERABLE_RECIPES,
  CULTIVATION_ARTS,
  CULTIVATION_ART_BATTLE_SKILLS,
  ARTIFACT_BATTLE_SKILLS,
  WEAPON_BATTLE_SKILLS,
  BATTLE_POTIONS,
  SECT_MASTER_CHALLENGE_REQUIREMENTS,
  HEAVEN_EARTH_SOUL_BOSSES,
  FOUNDATION_TREASURES,
  HEAVEN_EARTH_ESSENCES,
  HEAVEN_EARTH_MARROWS,
  LONGEVITY_RULES,
} from '../constants/index';
import { getPlayerTotalStats } from '../utils/statUtils';
import { getRandomEnemyName } from './templateService';
import { logger } from '../utils/logger';
import { getItemsByType } from '../utils/itemConstantsUtils';


const randomId = () => Math.random().toString(36).slice(2, 9);

const ENEMY_NAMES = [
  // Wasteland Creatures
  'Radroach',
  'Mole Rat',
  'Bloatfly',
  'Stingwing',
  'Bloodbug',
  'Radscorpion',
  'Miretlerk',
  'Yao Guai',
  'Deathclaw',
  'Radstag',
  'Brahmin',
  'Mongrel Dog',
  'Mutant Hound',
  'Feral Ghoul',
  'Super Mutant',
  'Cazador',
  'Gecko',
  'Nightstalker',
  'Lakelurk',
  'Mantis',
  'Rad Toads',
  'Fog Crawler',
  'Angler',
  'Gulper',
  'Cave Cricket',
  'Hermit Crab',
  'Rad Rat',
  'Wolf',
  'Gatorclaw',
  'Scorchbeast',

  // Humanoids
  'Raider Scum',
  'Raider Psycho',
  'Raider Waster',
  'Raider Veteran',
  'Gunner Conscript',
  'Gunner Private',
  'Gunner Corporal',
  'Gunner Sergeant',
  'Gunner Lieutenant',
  'Gunner Major',
  'Gunner Colonel',
  'Gunner Brigadier',
  'Brotherhood Initiate',
  'Brotherhood Knight',
  'Brotherhood Paladin',
  'Enclave Soldier',
  'Enclave Officer',
  'Synth Strider',
  'Synth Trooper',
  'Synth Leader',
  'Courser',

  // Robots/Special
  'Protectron',
  'Eyebot',
  'Mr. Gutsy',
  'Mr. Handy',
  'Assaultron',
  'Sentry Bot',
  'Securitron',
  'Robobrain',
  'Liberty Prime Replica',
  'Alien',
  'Zetan',
  'Glowing One',
  'Putrid Glowing One',
  'Bloated Glowing One',
  'Charred Feral Ghoul',
  'Gangrenous Feral Ghoul',
  'Rotting Feral Ghoul',
  'Withered Feral Ghoul',
];

const ENEMY_TITLES = [
  // Creature Titles
  'Rabid',
  'Glowing',
  'Alpha',
  'Matriarch',
  'Savage',
  'Albino',
  'Chameleon',
  'Mythic',
  'Legendary',
  'Enraged',
  'Radioactive',
  'Mutated',
  'Vicious',

  // Humanoid Titles
  'Wasteland Legend',
  'Raider Boss',
  'Gang Leader',
  'Mercenary Commander',
  'Elite',
  'Veteran',
  'Butcher',
  'Survivalist',
  'Scourge',
  'Warlord',
  'Overlord',
  'Master',
  'Champion',

  // Guard Titles
  'Vault Guardian',
  'Bunker Sentinel',
  'Ruins Defender',
  'Relic Keeper',
  'Zone Protector',
  'Gatekeeper',
  'System Defender',
  'Network Guardian',
  'Core Protector',
  'Security Chief',
  'Defense Unit',
  'Sentinel',

  // Other Titles
  'Lost Soul',
  'Wandering Ghost',
  'Cursed One',
  'Fallen Hero',
  'Exiled',
  'Forgotten',
  'Abomination',
];

// Calculate battle difficulty based on risk level
const getBattleDifficulty = (
  adventureType: AdventureType,
  riskLevel?: RiskLevel
): number => {
  if (adventureType === 'secret_realm' && riskLevel) {
    // Adjust difficulty based on risk level for Secret Realms
    const riskMultipliers: Record<string, number> = {
      Low: 0.6,      // Lower difficulty, good for farming
      Medium: 1.0,       // Standard difficulty
      High: 1.5,       // Increased difficulty, more challenging
      Extreme: 2.2, // Significantly increased difficulty, truly "Extremely Dangerous"
    };
    return riskMultipliers[riskLevel] || 1.0;
  }
  // Use fixed difficulty for non-secret realm
  const baseDifficulty: Record<AdventureType, number> = {
    normal: 1,
    lucky: 0.85,
    secret_realm: 1.25,
    sect_challenge: 1.5, // Sect Master challenge difficulty slightly reduced from 2.0 to 1.8
    dao_combining_challenge: 2.0, // Heaven Earth Soul challenge difficulty
  };
  return baseDifficulty[adventureType];
};

const baseBattleChance: Record<AdventureType, number> = {
  normal: 0.25, // Normal adventure base chance reduced to 25%
  lucky: 0.12, // Lucky adventure base chance reduced to 12%
  secret_realm: 0.45, // Secret realm base chance reduced to 45%
  sect_challenge: 1.0, // Challenge always triggers
  dao_combining_challenge: 1.0, // Heaven Earth Soul challenge always triggers
};

// Fisher-Yates shuffle algorithm, used to shuffle array order
const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Improved random selection function, shuffle array first then select, increasing randomness
const pickOne = <T>(list: T[]): T => {
  if (list.length === 0) throw new Error('Cannot pick from empty list');
  // For small arrays, select randomly directly; for large arrays, shuffle first then select
  if (list.length <= 10) {
    return list[Math.floor(Math.random() * list.length)];
  }
  // For large arrays, shuffle first then pick to increase randomness
  const shuffled = shuffle(list);
  return shuffled[Math.floor(Math.random() * shuffled.length)];
};

// Loot item name pool (fetched from constants for consistency)
export const LOOT_ITEMS = {
  // Herbs
  herbs: (() => getItemsByType(ItemType.Herb))(),
  // Chems
  pills: (() => getItemsByType(ItemType.Pill))(),
  // Materials
  materials: (() => getItemsByType(ItemType.Material))(),
  // Weapons
  weapons: (() => getItemsByType(ItemType.Weapon))(),
  // Armors
  armors: (() => getItemsByType(ItemType.Armor))(),
  // Accessories
  accessories: (() => getItemsByType(ItemType.Accessory))(),
  // Rings
  rings: (() => getItemsByType(ItemType.Ring))(),
  // Artifacts
  artifacts: (() => getItemsByType(ItemType.Artifact))(),
};

// Rarity Order (Cached to avoid repeated creation)
const RARITY_ORDER: ItemRarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];

// Generate loot based on enemy strength and type
const generateLoot = (
  enemyStrength: number,
  adventureType: AdventureType,
  playerRealm: RealmType,
  riskLevel?: RiskLevel
): AdventureResult['itemObtained'][] => {
  const lootItems: AdventureResult['itemObtained'][] = [];
  // Track selected items to avoid duplicates (equipment deduped by name + rarity)
  const selectedItems = new Set<string>();
  // Track selected item types to avoid consecutive same types
  const selectedTypes: string[] = [];

  // Determine item count based on enemy strength (1-4 items)
  const numItems =
    enemyStrength < 0.7
      ? 1 // Weak enemy: 1 item
      : enemyStrength < 1.0
        ? 1 + Math.floor(Math.random() * 2) // Normal: 1-2 items
        : 2 + Math.floor(Math.random() * 3); // Strong enemy: 2-4 items

  // Adjust rarity chance based on player realm (higher realm = better items)
  const realmIndex = REALM_ORDER.indexOf(playerRealm);
  // Realm bonus: each realm increases rarity chance, capped to prevent inflation
  // Base bonus: +1% Mythic, +1.5% Legendary, +2.5% Rare per realm
  // High realm (4th realm and above) gets 50% extra bonus
  const isHighRealm = realmIndex >= 3; // Nascent Soul and above
  const realmMultiplier = isHighRealm ? 1.5 : 1.0;
  const realmBonusImmortal = Math.min(0.05, realmIndex * 0.01 * realmMultiplier); // Mythic bonus, max 5%
  const realmBonusLegend = Math.min(0.10, realmIndex * 0.015 * realmMultiplier); // Legendary bonus, max 10%
  const realmBonusRare = Math.min(0.20, realmIndex * 0.025 * realmMultiplier); // Rare bonus, max 20%

  // Determine rarity distribution based on enemy strength and type
  const getRarityChance = (): ItemRarity => {
    const roll = Math.random();
    if (adventureType === 'secret_realm') {
      // Adjust rarity based on risk level
      if (riskLevel === 'Extreme') {
        // Extremely Dangerous: Higher chance for top-tier items
        if (roll < 0.05 + realmBonusImmortal) return 'Mythic';
        if (roll < 0.20 + realmBonusLegend) return 'Legendary';
        if (roll < 0.70 + realmBonusRare) return 'Rare';
        return 'Common';
      } else if (riskLevel === 'High') {
        // High Risk: Higher probability
        if (roll < 0.12 + realmBonusImmortal) return 'Mythic';
        if (roll < 0.4 + realmBonusLegend) return 'Legendary';
        if (roll < 0.75 + realmBonusRare) return 'Rare';
        return 'Common';
      } else if (riskLevel === 'Medium') {
        // Medium Risk: Medium probability
        if (roll < 0.08 + realmBonusImmortal) return 'Mythic';
        if (roll < 0.3 + realmBonusLegend) return 'Legendary';
        if (roll < 0.65 + realmBonusRare) return 'Rare';
        return 'Common';
      } else {
        // Low Risk: Lower probability
        if (roll < 0.05 + realmBonusImmortal) return 'Mythic';
        if (roll < 0.2 + realmBonusLegend) return 'Legendary';
        if (roll < 0.55 + realmBonusRare) return 'Rare';
        return 'Common';
      }
    } else if (adventureType === 'lucky') {
      // Lucky: Medium probability, realm bonus more significant
      if (roll < 0.02 + realmBonusImmortal * 0.8) return 'Mythic'; // Lucky adventure might yield Mythic
      if (roll < 0.05 + realmBonusLegend) return 'Legendary';
      if (roll < 0.25 + realmBonusRare) return 'Rare';
      return 'Common';
    } else {
      // Normal Adventure: Lower probability, but realm bonus significant
      if (roll < 0.01 + realmBonusImmortal * 0.5) return 'Mythic'; // Normal adventure has very low chance for Mythic
      if (roll < 0.05 + realmBonusLegend) return 'Legendary';
      if (roll < 0.2 + realmBonusRare) return 'Rare';
      return 'Common';
    }
  };

  // Max attempts to avoid infinite loop
  const maxAttempts = numItems * 10;
  let attempts = 0;

  while (lootItems.length < numItems && attempts < maxAttempts) {
    attempts++;
    const targetRarity = getRarityChance();

    let itemPool: Array<{
      name: string;
      type: ItemType | string;
      rarity: ItemRarity;
      effect?: Item['effect'];
      permanentEffect?: Item['permanentEffect'];
      equipmentSlot?: EquipmentSlot | string;
    }>;
    let itemType: string;

    // Weighted random selection of item type
    const typeWeights = [
      { type: 'herbs', weight: 25, name: ItemType.Herb },
      { type: 'pills', weight: 25, name: ItemType.Pill },
      { type: 'materials', weight: 15, name: ItemType.Material },
      { type: 'weapons', weight: 6, name: ItemType.Weapon },
      { type: 'armors', weight: 8, name: ItemType.Armor },
      { type: 'accessories', weight: 3, name: ItemType.Accessory },
      { type: 'rings', weight: 3, name: ItemType.Ring },
      { type: 'artifacts', weight: 7, name: ItemType.Artifact },
      { type: 'recipe', weight: 8, name: ItemType.Recipe },
    ];

    // If previous item was equipment, slightly reduce equipment weight (but not too much to keep randomness)
    if (selectedTypes.length > 0 && selectedTypes[selectedTypes.length - 1] !== ItemType.Herb && selectedTypes[selectedTypes.length - 1] !== ItemType.Pill && selectedTypes[selectedTypes.length - 1] !== ItemType.Material) {
      typeWeights.forEach(w => {
        if (['weapons', 'armors', 'accessories', 'rings', 'artifacts'].includes(w.type)) {
          w.weight *= 0.85; // Reduced from 0.7 to 0.85, less restriction, more randomness
        }
      });
    }

    // Calculate total weight
    const totalWeight = typeWeights.reduce((sum, w) => sum + w.weight, 0);
    let randomWeight = Math.random() * totalWeight;

    // Select type based on weight (random)
    let selectedType = typeWeights[0];
    for (const type of typeWeights) {
      randomWeight -= type.weight;
      if (randomWeight <= 0) {
        selectedType = type;
        break;
      }
    }

    itemType = selectedType.name;

    // Set item pool based on selected type, shuffle multiple times
    if (selectedType.type === 'herbs') {
      let pool = [...LOOT_ITEMS.herbs];
      pool = shuffle(pool);
      pool = shuffle(pool); // Second shuffle
      itemPool = pool;
    } else if (selectedType.type === 'pills') {
      let pool = [...LOOT_ITEMS.pills];
      pool = shuffle(pool);
      pool = shuffle(pool);
      itemPool = pool;
    } else if (selectedType.type === 'materials') {
      let pool = [...LOOT_ITEMS.materials];
      pool = shuffle(pool);
      pool = shuffle(pool);
      itemPool = pool;
    } else if (selectedType.type === 'weapons') {
      let pool = [...LOOT_ITEMS.weapons];
      pool = shuffle(pool);
      pool = shuffle(pool);
      itemPool = pool;
    } else if (selectedType.type === 'armors') {
      // Armor: shuffle all armors first, then randomly select slot
      let allArmors = [...LOOT_ITEMS.armors];
      allArmors = shuffle(allArmors);
      allArmors = shuffle(allArmors); // Second shuffle
      const armorSlots = [
        EquipmentSlot.Head,
        EquipmentSlot.Shoulder,
        EquipmentSlot.Chest,
        EquipmentSlot.Gloves,
        EquipmentSlot.Legs,
        EquipmentSlot.Boots,
      ];
      // Shuffle slot order
      const shuffledSlots = shuffle(armorSlots);
      const selectedSlot = shuffledSlots[Math.floor(Math.random() * shuffledSlots.length)];
      const slotFilteredArmors = allArmors.filter((item) => item.equipmentSlot === selectedSlot);
      itemPool = slotFilteredArmors.length > 0 ? slotFilteredArmors : allArmors;
    } else if (selectedType.type === 'accessories') {
      let pool = [...LOOT_ITEMS.accessories];
      pool = shuffle(pool);
      pool = shuffle(pool);
      itemPool = pool;
    } else if (selectedType.type === 'rings') {
      let pool = [...LOOT_ITEMS.rings];
      pool = shuffle(pool);
      pool = shuffle(pool);
      itemPool = pool;
    } else if (selectedType.type === 'artifacts') {
      let pool = [...LOOT_ITEMS.artifacts];
      pool = shuffle(pool);
      pool = shuffle(pool);
      itemPool = pool;
    } else {
      // Recipe
      itemType = ItemType.Recipe;
      itemPool = []; // Recipes don't use standard item pool
    }

    // Special Handling: Recipe
    if (itemType === ItemType.Recipe) {
      // Filter available recipes based on rarity, exclude already selected
      const availableRecipes = DISCOVERABLE_RECIPES.filter((recipe) => {
        const targetIndex = RARITY_ORDER.indexOf(targetRarity);
        const recipeIndex = RARITY_ORDER.indexOf(recipe.result.rarity);
        const recipeKey = `${recipe.name} Recipe-${recipe.result.rarity}`;
        return recipeIndex <= targetIndex && !selectedItems.has(recipeKey);
      });

      if (availableRecipes.length > 0) {
        // Shuffle available recipes multiple times for increased randomness
        let shuffledRecipes = shuffle(availableRecipes);
        shuffledRecipes = shuffle(shuffledRecipes); // Second shuffle
        shuffledRecipes = shuffle(shuffledRecipes); // Third shuffle, ensure complete randomness
        // Use completely random selection to ensure equal probability for each recipe
        const randomIndex = Math.floor(Math.random() * shuffledRecipes.length);
        const selectedRecipe = shuffledRecipes[randomIndex];
        const recipeKey = `${selectedRecipe.name} Recipe-${selectedRecipe.result.rarity}`;
        selectedItems.add(recipeKey);
        selectedTypes.push(itemType);

        const item: AdventureResult['itemObtained'] & { recipeName?: string } =
        {
          name: `${selectedRecipe.name} Recipe`,
          type: ItemType.Recipe,
          description: `An ancient blueprint for crafting [${selectedRecipe.name}]. Use to learn how to craft this item.`,
          rarity: selectedRecipe.result.rarity,
          isEquippable: false,
          recipeName: selectedRecipe.name, // Used in executeAdventureCore to find the corresponding recipe
        };
        lootItems.push(item);
      }
      // If no recipes are available, skip this generation
      continue;
    }

    // Randomly select from items of corresponding rarity, exclude already selected equipment
    let availableItems = itemPool.filter((item) => {
      if (item.rarity !== targetRarity) return false;
      // For equippable items, check if already selected (deduplicate by name + rarity + slot)
      if (item.equipmentSlot !== undefined) {
        const itemKey = `${item.name}-${item.rarity}-${item.equipmentSlot}`;
        return !selectedItems.has(itemKey);
      }
      // For non-equippable items, deduplicate by name + rarity only
      const itemKey = `${item.name}-${item.rarity}`;
      return !selectedItems.has(itemKey);
    });

    // If no items are available after filtering, try to downgrade selection
    if (availableItems.length === 0) {
      const fallbackItems = itemPool.filter((item) => {
        const targetIndex = RARITY_ORDER.indexOf(targetRarity);
        const itemIndex = RARITY_ORDER.indexOf(item.rarity);
        if (itemIndex > targetIndex) return false;

        // Also check if already selected
        if (item.equipmentSlot !== undefined) {
          const itemKey = `${item.name}-${item.rarity}-${item.equipmentSlot}`;
          return !selectedItems.has(itemKey);
        }
        const itemKey = `${item.name}-${item.rarity}`;
        return !selectedItems.has(itemKey);
      });
      availableItems = fallbackItems;
    }

    if (availableItems.length > 0) {
      // Shuffle available items list multiple times for increased randomness
      let shuffledItems = shuffle(availableItems);
      shuffledItems = shuffle(shuffledItems); // Second shuffle
      shuffledItems = shuffle(shuffledItems); // Third shuffle, ensure complete randomness
      // Use completely random selection to ensure equal probability for each item
      const randomIndex = Math.floor(Math.random() * shuffledItems.length);
      const selected = shuffledItems[randomIndex];

      // Mark as selected
      if (selected.equipmentSlot !== undefined) {
        const itemKey = `${selected.name}-${selected.rarity}-${selected.equipmentSlot}`;
        selectedItems.add(itemKey);
      } else {
        const itemKey = `${selected.name}-${selected.rarity}`;
        selectedItems.add(itemKey);
      }
      selectedTypes.push(itemType);

      // Check if it's a Legendary or Mythic equipment, randomly add revive chances
      let reviveChances: number | undefined = undefined;
      const rarity = selected.rarity;

      // Only Legendary/Mythic Weapons and Artifacts have a chance for revive
      if (
        (rarity === 'Legendary' || rarity === 'Mythic') &&
        (itemType === ItemType.Weapon || itemType === ItemType.Artifact)
      ) {
        // Legendary: 6% chance (up from 3%), Mythic: 12% chance (up from 6%)
        const hasRevive =
          rarity === 'Legendary' ? Math.random() < 0.06 : Math.random() < 0.12;

        if (hasRevive) {
          // Random 1-3 revive chances
          reviveChances = Math.floor(Math.random() * 3) + 1;
        }
      }

      const item: AdventureResult['itemObtained'] & { reviveChances?: number } =
      {
        name: selected.name,
        type: itemType,
        description: selected.description || `${selected.name}, looted from the enemy.`,
        rarity: selected.rarity,
        isEquippable: selected.equipmentSlot !== undefined,
        equipmentSlot: selected.equipmentSlot as string | undefined,
        effect: selected.effect, // Stats adjusted in executeAdventureCore based on realm
        permanentEffect: selected.permanentEffect,
        reviveChances: reviveChances,
      };
      lootItems.push(item);
    }
  }

  return lootItems;
};

export interface BattleRoundLog {
  id: string;
  attacker: 'player' | 'enemy';
  damage: number;
  crit: boolean;
  description: string;
  playerHpAfter: number;
  enemyHpAfter: number;
}

export interface BattleReplay {
  id: string;
  adventureType?: AdventureType; // Adventure Type
  bossId?: string | null; // Challenge BOSS ID (for Heaven Earth Soul etc.)
  enemy: {
    name: string;
    title: string;
    realm: RealmType;
    maxHp: number;
    attack: number;
    defense: number;
    speed: number;
    spirit: number; // Enemy Spirit Attribute
    strengthMultiplier?: number; // Enemy Strength Multiplier
  };
  rounds: BattleRoundLog[];
  victory: boolean;
  hpLoss: number;
  playerHpBefore: number;
  playerHpAfter: number;
  summary: string;
  expChange: number;
  spiritChange: number;
}

export interface BattleResolution {
  adventureResult: AdventureResult;
  replay: BattleReplay;
  petSkillCooldowns?: Record<string, number>; // Pet skill cooldowns after battle
}

const clampMin = (value: number, min: number) => (value < min ? min : value);

/**
 * Calculate action count (based on speed difference and spirit difference)
 * @param fasterSpeed Faster unit speed
 * @param slowerSpeed Slower unit speed
 * @param fasterSpirit Faster unit spirit
 * @param slowerSpirit Slower unit spirit
 * @returns Action count (1-5)
 */
const calculateActionCount = (
  fasterSpeed: number,
  slowerSpeed: number,
  fasterSpirit: number,
  slowerSpirit: number
): number => {
  // Ensure speed is valid number, prevent NaN
  const validFasterSpeed = Number(fasterSpeed) || 0;
  const validSlowerSpeed = Number(slowerSpeed) || 1; // Avoid divide by zero, default at least 1
  const validFasterSpirit = Number(fasterSpirit) || 0;
  const validSlowerSpirit = Number(slowerSpirit) || 1; // Avoid divide by zero, default at least 1

  // Calculate combined action power of speed and spirit
  // Speed weight 0.6, Spirit weight 0.4
  const fasterActionPower = validFasterSpeed * 0.6 + validFasterSpirit * 0.4;
  const slowerActionPower = validSlowerSpeed * 0.6 + validSlowerSpirit * 0.4;

  if (fasterActionPower <= slowerActionPower) return 1; // No advantage, only 1 action

  const powerDiff = fasterActionPower - slowerActionPower;
  // Ensure slowerActionPower is at least 1, avoid divide by zero
  const safeSlowerPower = Math.max(1, slowerActionPower);
  const powerRatio = powerDiff / safeSlowerPower; // Power difference ratio

  // Base 1 action + 1 extra action per 50% power advantage
  // e.g. Power 1.5x = 2 actions, 2x = 3 actions, 3x = 4 actions
  const extraActions = Math.floor(powerRatio / 0.5);
  const totalActions = 1 + extraActions;

  // Max 5 actions (avoid being too unbalanced)
  return Math.min(5, Math.max(1, totalActions));
};

const createEnemy = async (
  player: PlayerStats,
  adventureType: AdventureType,
  riskLevel?: RiskLevel,
  realmMinRealm?: RealmType,
  sectMasterId?: string | null,
  huntSectId?: string | null,
  huntLevel?: number,
  bossId?: string // Specified Heaven Earth Soul BOSS ID (for event templates)
): Promise<{
  name: string;
  title: string;
  realm: RealmType;
  attack: number;
  defense: number;
  maxHp: number;
  speed: number;
  spirit: number;
  strengthMultiplier: number;
}> => {
  const currentRealmIndex = REALM_ORDER.indexOf(player.realm);

  // Save selected BOSS for subsequent stat calculation (Heaven Earth Soul challenge)
  let selectedBossForStats: typeof HEAVEN_EARTH_SOUL_BOSSES[string] | null = null;
  if (adventureType === 'dao_combining_challenge') {
    // Heaven Earth Soul challenge: use specified BOSS ID if available, otherwise pick random
    if (bossId && HEAVEN_EARTH_SOUL_BOSSES[bossId]) {
      selectedBossForStats = HEAVEN_EARTH_SOUL_BOSSES[bossId];
    } else {
      const bossIds = Object.keys(HEAVEN_EARTH_SOUL_BOSSES);
      const randomBossId = bossIds[Math.floor(Math.random() * bossIds.length)];
      selectedBossForStats = HEAVEN_EARTH_SOUL_BOSSES[randomBossId] || null;
    }
  }

  // If entering Secret Realm with minimum realm requirement, calculate enemy strength based on it
  let targetRealmIndex: number;
  let realmLevelReduction = 1.0; // Realm suppression multiplier (reduce difficulty if player realm > secret realm requirement)

  if (adventureType === 'secret_realm' && realmMinRealm) {
    const realmMinIndex = REALM_ORDER.indexOf(realmMinRealm);
    // Enemy realm based on secret realm minimum, not player realm
    const realmOffset = 0; // Enemy matches secret realm requirement (changed from +1 to 0 to lower difficulty)
    targetRealmIndex = clampMin(
      Math.min(REALM_ORDER.length - 1, realmMinIndex + realmOffset),
      0
    );

    // If player realm > secret realm requirement, reduce enemy strength (Realm Suppression)
    if (currentRealmIndex > realmMinIndex) {
      const realmDiff = currentRealmIndex - realmMinIndex;
      // Reduce difficulty by 15% per realm difference, max 60% reduction
      realmLevelReduction = Math.max(0.4, 1.0 - realmDiff * 0.15);
    }
  } else if (adventureType === 'sect_challenge') {
    // If Hunt battle, generate enemy based on hunt intensity
    if (huntSectId && huntLevel !== undefined) {
      // Hunt Intensity: 0=Member, 1=Elite, 2=Elder, 3=Leader
      if (huntLevel >= 3) {
        // Leader: 1-2 realms higher than player
        const realmOffset = Math.random() < 0.85 ? 1 : 2;
        targetRealmIndex = clampMin(
          Math.min(REALM_ORDER.length - 1, currentRealmIndex + realmOffset),
          3 // Minimum Nascent Soul
        );
      } else if (huntLevel >= 2) {
        // Elder: Same or 1 realm higher
        const realmOffset = Math.random() < 0.7 ? 0 : 1;
        targetRealmIndex = clampMin(
          Math.min(REALM_ORDER.length - 1, currentRealmIndex + realmOffset),
          currentRealmIndex
        );
      } else if (huntLevel >= 1) {
        // Elite: Same or 1 realm lower
        const realmOffset = Math.random() < 0.6 ? 0 : -1;
        targetRealmIndex = clampMin(
          Math.min(REALM_ORDER.length - 1, currentRealmIndex + realmOffset),
          0
        );
      } else {
        // Member: 1-2 realms lower
        const realmOffset = Math.random() < 0.7 ? -1 : -2;
        targetRealmIndex = clampMin(
          Math.min(REALM_ORDER.length - 1, currentRealmIndex + realmOffset),
          0
        );
      }
    } else {
      // Sect Master Challenge special logic: usually 1 realm higher, rarely 2
      const realmOffset = Math.random() < 0.85 ? 1 : 2; // 85% chance +1 realm, 15% chance +2
      targetRealmIndex = clampMin(
        Math.min(REALM_ORDER.length - 1, currentRealmIndex + realmOffset),
        3 // Minimum Nascent Soul
      );
    }
  } else if (adventureType === 'dao_combining_challenge') {
    // Heaven Earth Soul challenge: fixed at Spirit Severing
    targetRealmIndex = REALM_ORDER.indexOf(RealmType.SpiritSevering);
  } else {
    // Normal/Lucky adventure, standard logic
    const realmOffset =
      adventureType === 'lucky' ? -1 : 0;
    targetRealmIndex = clampMin(
      Math.min(REALM_ORDER.length - 1, currentRealmIndex + realmOffset),
      0
    );
  }

  // Ensure targetRealmIndex is valid to prevent undefined access
  const validTargetRealmIndex = Math.max(0, Math.min(targetRealmIndex, REALM_ORDER.length - 1));
  const realm = REALM_ORDER[validTargetRealmIndex];
  if (!realm) {
    // Fallback to first realm if still invalid
    const fallbackRealm = REALM_ORDER[0];
    if (!fallbackRealm) {
      throw new Error('REALM_ORDER is empty or invalid');
    }
    return {
      name: 'Unknown Enemy',
      title: 'Mysterious',
      realm: fallbackRealm,
      attack: 10,
      defense: 8,
      maxHp: 50,
      speed: 10,
      spirit: 5,
      strengthMultiplier: 1,
    };
  }
  const baseDifficulty = getBattleDifficulty(adventureType, riskLevel);

  // Introduce strength tier system: Weak, Normal, Tough
  // Normal Adventure: 40% Weak, 50% Normal, 10% Tough
  // Lucky Adventure: 60% Weak, 35% Normal, 5% Tough
  // Secret Realm: 20% Weak, 50% Normal, 30% Tough
  const strengthRoll = Math.random();
  let strengthMultiplier = 1;
  let strengthVariance = { min: 0.85, max: 1.2 };

  if (adventureType === 'sect_challenge') {
    // Sect Master balance: narrow variance, challenging but not impossible
    strengthMultiplier = 1.0;
    if (strengthRoll < 0.3) {
      // 30% chance: Weakened state (old injury/meditation)
      strengthVariance = { min: 0.9, max: 1.1 };
    } else if (strengthRoll < 0.8) {
      // 50% chance: Normal state
      strengthVariance = { min: 1.1, max: 1.3 };
    } else {
      // 20% chance: Peak state (breakthrough/enlightenment)
      strengthVariance = { min: 1.3, max: 1.6 };
    }
  } else if (adventureType === 'dao_combining_challenge') {
    // Heaven Earth Soul challenge: multiplier calculated later based on player stats (0.9-3.0x)
    // Set default here, actual multiplier generated dynamically during stat calculation
    strengthMultiplier = 1.0; // Temporary value
    strengthVariance = { min: 1.0, max: 1.0 }; // Determined by RNG, no extra variance
  } else if (adventureType === 'normal') {
    if (strengthRoll < 0.4) {
      // Weak 40%
      strengthMultiplier = 0.6 + Math.random() * 0.2; // 0.6 - 0.8
      strengthVariance = { min: 0.6, max: 0.9 };
    } else if (strengthRoll < 0.9) {
      // Normal 50%
      strengthMultiplier = 0.8 + Math.random() * 0.2; // 0.8 - 1.0
      strengthVariance = { min: 0.75, max: 1.1 };
    } else {
      // Tough 10%
      strengthMultiplier = 1.0 + Math.random() * 0.2; // 1.0 - 1.2
      strengthVariance = { min: 0.9, max: 1.3 };
    }
  } else if (adventureType === 'lucky') {
    if (strengthRoll < 0.6) {
      // Weak 60%
      strengthMultiplier = 0.5 + Math.random() * 0.2; // 0.5 - 0.7
      strengthVariance = { min: 0.5, max: 0.85 };
    } else if (strengthRoll < 0.95) {
      // Normal 35%
      strengthMultiplier = 0.7 + Math.random() * 0.2; // 0.7 - 0.9
      strengthVariance = { min: 0.65, max: 1.0 };
    } else {
      // Tough 5%
      strengthMultiplier = 0.9 + Math.random() * 0.2; // 0.9 - 1.1
      strengthVariance = { min: 0.8, max: 1.2 };
    }
  } else if (adventureType === 'secret_realm') {
    // Secret Realm Adventure: adjust enemy strength distribution based on risk level
    if (riskLevel === 'Extreme') {
      // Extremely Dangerous: 15% Weak, 45% Normal, 40% Tough
      if (strengthRoll < 0.15) {
        strengthMultiplier = 0.85 + Math.random() * 0.15; // 0.85 - 1.0
        strengthVariance = { min: 0.8, max: 1.1 };
      } else if (strengthRoll < 0.6) {
        strengthMultiplier = 1.0 + Math.random() * 0.2; // 1.0 - 1.2
        strengthVariance = { min: 0.9, max: 1.3 };
      } else {
        strengthMultiplier = 1.2 + Math.random() * 0.3; // 1.2 - 1.5
        strengthVariance = { min: 1.1, max: 1.6 }; // Reduced from 1.2-1.8
      }
    } else if (riskLevel === 'High') {
      // High Risk: 20% Weak, 50% Normal, 30% Tough
      if (strengthRoll < 0.2) {
        strengthMultiplier = 0.75 + Math.random() * 0.15; // 0.75 - 0.9
        strengthVariance = { min: 0.7, max: 1.0 };
      } else if (strengthRoll < 0.7) {
        strengthMultiplier = 0.9 + Math.random() * 0.2; // 0.9 - 1.1
        strengthVariance = { min: 0.85, max: 1.2 };
      } else {
        strengthMultiplier = 1.1 + Math.random() * 0.25; // 1.1 - 1.35
        strengthVariance = { min: 1.0, max: 1.5 };
      }
    } else if (riskLevel === 'Medium') {
      // Medium Risk: 30% Weak, 55% Normal, 15% Tough
      if (strengthRoll < 0.3) {
        strengthMultiplier = 0.65 + Math.random() * 0.2; // 0.65 - 0.85
        strengthVariance = { min: 0.6, max: 0.95 };
      } else if (strengthRoll < 0.85) {
        strengthMultiplier = 0.85 + Math.random() * 0.2; // 0.85 - 1.05
        strengthVariance = { min: 0.75, max: 1.15 };
      } else {
        strengthMultiplier = 1.05 + Math.random() * 0.2; // 1.05 - 1.25
        strengthVariance = { min: 0.95, max: 1.3 };
      }
    } else {
      // Low Risk: 40% Weak, 50% Normal, 10% Tough
      if (strengthRoll < 0.4) {
        strengthMultiplier = 0.55 + Math.random() * 0.2; // 0.55 - 0.75
        strengthVariance = { min: 0.5, max: 0.85 };
      } else if (strengthRoll < 0.9) {
        strengthMultiplier = 0.75 + Math.random() * 0.2; // 0.75 - 0.95
        strengthVariance = { min: 0.7, max: 1.05 };
      } else {
        strengthMultiplier = 0.95 + Math.random() * 0.2; // 0.95 - 1.15
        strengthVariance = { min: 0.85, max: 1.2 };
      }
    }
  }

  const variance = () =>
    strengthVariance.min +
    Math.random() * (strengthVariance.max - strengthVariance.min);
  // Apply realm suppression multiplier to final difficulty
  const finalDifficulty =
    baseDifficulty * strengthMultiplier * realmLevelReduction;

  // 15% chance to use AI-generated enemy name; fallback to presets on failure
  let name = pickOne(ENEMY_NAMES);
  let title = pickOne(ENEMY_TITLES);

  if (adventureType === 'sect_challenge') {
    if (huntSectId && huntLevel !== undefined) {
      // Set enemy name and title based on hunt intensity
      if (huntLevel >= 3) {
        name = 'Overseer';
        title = 'Legendary';
      } else if (huntLevel >= 2) {
        name = pickOne(['Head Scribe', 'Paladin Commander', 'Sentinel']);
        title = 'Powerful';
      } else if (huntLevel >= 1) {
        name = pickOne(['Knight', 'Courser', 'Elite Ranger']);
        title = 'Faction';
      } else {
        name = pickOne(['Initiate', 'Scavenger', 'Recruit']);
        title = 'Faction';
      }
    } else {
      name = 'Former Overseer';
      title = 'Legendary';
    }
  } else if (adventureType === 'dao_combining_challenge') {
    // Heaven-Earth Soul challenge: use selected boss
    if (selectedBossForStats) {
      name = selectedBossForStats.name;
      title = 'Anomaly ';
    }
  }

  if (Math.random() < 0.15 && adventureType !== 'sect_challenge' && adventureType !== 'dao_combining_challenge') {
    try {
      // Use template library to generate enemy name
      const generated = getRandomEnemyName(realm, adventureType);
      if (generated.name && generated.title) {
        name = generated.name;
        title = generated.title;
      }
    } catch (e) {
      // Failed to generate from template, use fallback list
      logger.warn('Failed to generate enemy name from template, using preset list:', e);
    }
  }

  // If player realm > secret realm requirement, use secret realm stats as baseline, not player stats
  let basePlayerAttack: number;
  let basePlayerDefense: number;
  let basePlayerMaxHp: number;
  let basePlayerSpeed: number;
  let basePlayerSpirit: number;
  let basePlayerRealmLevel: number;

  if (adventureType === 'secret_realm' && realmMinRealm) {
    const realmMinIndex = REALM_ORDER.indexOf(realmMinRealm);
    if (currentRealmIndex > realmMinIndex) {
      // Use secret realm stats as baseline (simulate reasonable enemy strength in secret realm)
      // Use minimum secret realm stats, adjusted by risk level
      // Ensure REALM_ORDER.length is not 0 to prevent division by zero
      const realmOrderLength = REALM_ORDER.length || 1;
      const realmRatio = realmMinIndex / realmOrderLength;
      basePlayerAttack =
        (Number(player.attack) || 0) * (0.4 + realmRatio * 0.3); // 40%-70%
      basePlayerDefense =
        (Number(player.defense) || 0) * (0.4 + realmRatio * 0.3);
      basePlayerMaxHp =
        (Number(player.maxHp) || 0) * (0.3 + realmRatio * 0.3); // 30%-60%
      basePlayerSpeed =
        (Number(player.speed) || 10) * (0.5 + realmRatio * 0.3);
      basePlayerSpirit =
        (Number(player.spirit) || 0) * (0.4 + realmRatio * 0.3);
      basePlayerRealmLevel = Math.max(
        1,
        player.realmLevel - (currentRealmIndex - realmMinIndex)
      );
    } else {
      // Player realm <= secret realm requirement, use player stats
      basePlayerAttack = player.attack;
      basePlayerDefense = player.defense;
      basePlayerMaxHp = player.maxHp;
      basePlayerSpeed = player.speed || 10;
      basePlayerSpirit = player.spirit || 0;
      basePlayerRealmLevel = player.realmLevel;
    }
  } else {
    // Non-secret realm adventure, use player stats
    basePlayerAttack = player.attack;
    basePlayerDefense = player.defense;
    basePlayerMaxHp = player.maxHp;
    basePlayerSpeed = player.speed || 10;
    basePlayerSpirit = player.spirit || 0;
    basePlayerRealmLevel = player.realmLevel;
  }

  // Balance enemy base stats
  // Heaven Earth Soul challenge: use BOSS base stats directly
  let baseAttack: number;
  let baseDefense: number;
  let baseMaxHp: number;
  let baseSpeed: number;
  let baseSpirit: number;

  if (adventureType === 'dao_combining_challenge' && selectedBossForStats) {
    // Use BOSS base stats
    baseAttack = selectedBossForStats.baseStats.attack;
    baseDefense = selectedBossForStats.baseStats.defense;
    baseMaxHp = selectedBossForStats.baseStats.hp;
    baseSpeed = selectedBossForStats.baseStats.speed;
    baseSpirit = selectedBossForStats.baseStats.spirit;
  } else {
    // Normal enemy: calculated based on player stats (Optimization: reduce coefficient to ensure enemy is not too strong)
    // Attack and defense coefficients reduced from 0.75 to 0.7, realm bonus reduced from 2.5 to 2
    baseAttack = basePlayerAttack * 0.7 + basePlayerRealmLevel * 2;
    baseDefense = basePlayerDefense * 0.7 + basePlayerRealmLevel * 2;
    // Calculate enemy spirit: based on player spirit and realm base spirit
    const realmBaseSpirit = REALM_DATA[realm]?.baseSpirit || 0;
    baseSpirit = basePlayerSpirit * 0.3 + realmBaseSpirit * 0.5 + basePlayerRealmLevel * 1;
    // Enemy HP changed from same as player to 70%-90%, ensuring reasonable battle rounds
    baseMaxHp = basePlayerMaxHp * (0.7 + Math.random() * 0.2);
    baseSpeed = basePlayerSpeed;
  }

  // Heaven Earth Soul Challenge: Dynamically adjust BOSS stats based on player combat power (0.9~3.0x)
  if (adventureType === 'dao_combining_challenge' && selectedBossForStats) {
    // Calculate player combat power (comprehensive attack, defense, HP, etc.)
    const playerCombatPower = basePlayerAttack * 0.4 + basePlayerDefense * 0.3 + basePlayerMaxHp * 0.002 + basePlayerSpeed * 0.15 + basePlayerSpirit * 0.15;

    // Calculate BOSS base combat power (using BOSS base stats)
    const bossBaseCombatPower = baseAttack * 0.4 + baseDefense * 0.3 + baseMaxHp * 0.002 + baseSpeed * 0.15 + baseSpirit * 0.15;

    // Random multiplier: 0.9~1.8x player combat power (narrow range to avoid extreme difficulty)
    const randomMultiplier = 0.9 + Math.random() * 0.9; // 0.9 ~ 1.8

    // Calculate target combat power
    const targetCombatPower = playerCombatPower * randomMultiplier;

    // Calculate ratio coefficient
    const powerRatio = bossBaseCombatPower > 0 ? targetCombatPower / bossBaseCombatPower : randomMultiplier;

    // Adjust BOSS stats proportionally
    const adjustedAttack = Math.round(baseAttack * powerRatio);
    const adjustedDefense = Math.round(baseDefense * powerRatio);
    const adjustedMaxHp = Math.round(baseMaxHp * powerRatio);
    const adjustedSpeed = Math.round(baseSpeed * powerRatio);
    const adjustedSpirit = Math.round(baseSpirit * powerRatio);

    return {
      name,
      title,
      realm,
      attack: adjustedAttack,
      defense: adjustedDefense,
      maxHp: adjustedMaxHp,
      speed: adjustedSpeed,
      spirit: adjustedSpirit,
      strengthMultiplier: randomMultiplier, // Save actual multiplier for reward generation
    };
  }

  // Normal enemy: Dynamically adjust enemy HP based on attack and defense, ensuring enough rounds (at least 3-5)
  // Note: If enemy is normal (not Heaven Earth Soul), baseMaxHp is already set to 70%-90% of player HP
  // Here we only fine-tune based on difficulty and attack ratio
  const baseHpMultiplier = 1.0; // Base multiplier (since baseMaxHp is already adjusted)
  let calculatedHp = Math.round(baseMaxHp * baseHpMultiplier * finalDifficulty);

  // Adjust dynamically based on enemy attack: lower HP if attack is high, higher HP if attack is low
  // Goal: Ensure battle lasts 3-8 rounds
  const attackRatio = baseAttack / Math.max(1, basePlayerAttack);
  if (attackRatio > 1.2) {
    // Enemy attack is strong, reduce HP by 10% to avoid overly long battle
    calculatedHp = Math.round(calculatedHp * 0.9);
  } else if (attackRatio < 0.8) {
    // Enemy attack is weak, increase HP by 10% to ensure challenge
    calculatedHp = Math.round(calculatedHp * 1.1);
  }
  return {
    name,
    title,
    realm,
    attack: Math.max(8, Math.round(baseAttack * variance() * finalDifficulty)),
    defense: Math.max(
      6,
      Math.round(baseDefense * variance() * finalDifficulty)
    ),
    maxHp: Math.max(
      40,
      calculatedHp
    ),
    speed: Math.max(
      6,
      Math.round(
        baseSpeed * (0.7 + Math.random() * 0.3) * strengthMultiplier
      )
    ),
    spirit: Math.max(
      5,
      Math.round(baseSpirit * variance() * finalDifficulty)
    ),
    strengthMultiplier, // Save strength multiplier for reward generation
  };
};

const calcDamage = (attack: number, defense: number) => {
  // Ensure input is valid number, prevent NaN
  const validAttack = Number(attack) || 0;
  const validDefense = Number(defense) || 0;

  // Optimized damage calculation: Use hyperbolic formula, ensure defense returns diminishing but not completely invalid
  // Formula: damage = attack * (1 - defense / (defense + attack * k))
  // Features of this formula:
  // 1. The higher the defense, the more obvious the damage reduction effect, but it will not be completely invalid
  // 2. When defense = 0, damage = attack
  // 3. When defense = attack, damage is about 33% of attack (when k=0.5)
  // 4. When defense is far greater than attack, damage will approach 0, but will not be completely 0
  const k = 0.5; // Adjustment coefficient, control defense return curve
  const denominator = validDefense + validAttack * k;

  // Avoid division by zero
  if (denominator <= 0) {
    return Math.max(1, Math.round(validAttack * (0.9 + Math.random() * 0.2)));
  }

  // Calculate base damage
  const baseDamage = validAttack * (1 - validDefense / denominator);

  // Optimization: Increase minimum damage to 15% of attack, ensure effective damage even with high defense
  const minDamage = validAttack > 0 ? Math.max(1, Math.floor(validAttack * 0.15)) : 0;

  // Random fluctuation range (damage fluctuates within a certain range)
  const baseRandomRange = 0.2; // Base ±10% fluctuation (i.e. 0.9~1.1 times)
  const randomFactor = 0.9 + Math.random() * baseRandomRange; // 0.9~1.1 times
  return Math.round(Math.max(minDamage, baseDamage * randomFactor));
};

// Battle Trigger
export const shouldTriggerBattle = (
  player: PlayerStats,
  adventureType: AdventureType
): boolean => {
  // Challenge type (Sect Master Challenge, Heaven Earth Soul Challenge) always triggers battle
  if (adventureType === 'sect_challenge' || adventureType === 'dao_combining_challenge') {
    return true;
  }

  const base = baseBattleChance[adventureType] ?? 0.2; // Base battle chance
  const realmBonus = REALM_ORDER.indexOf(player.realm) * 0.02; // Realm bonus (increased from 0.015 to 0.02)
  const speedBonus = (player.speed || 0) * 0.0005; // Speed bonus (increased from 0.0004 to 0.0005)
  const luckMitigation = (player.luck || 0) * 0.00015; // Luck mitigation (reduced from 0.0002 to 0.00015, reduce impact)
  const chance = Math.min(0.6, base + realmBonus + speedBonus - luckMitigation); // Keep upper limit moderate
  return Math.random() < Math.max(0.1, chance); // Ensure not too low or too high
  // return true; // Debug battle open
};

export const resolveBattleEncounter = async (
  player: PlayerStats,
  adventureType: AdventureType,
  riskLevel?: RiskLevel,
  realmMinRealm?: RealmType,
  realmName?: string,
  huntSectId?: string | null,
  huntLevel?: number,
  bossId?: string, // Specified Heaven Earth Soul BOSS ID (for event template)
): Promise<BattleResolution> => {
  const enemy = await createEnemy(
    player,
    adventureType,
    riskLevel,
    realmMinRealm,
    undefined,
    huntSectId,
    huntLevel,
    bossId
  );
  const difficulty = getBattleDifficulty(adventureType, riskLevel);
  // Use getPlayerTotalStats to calculate actual max HP (including Golden Core Method, Heart Method bonuses)
  const totalStats = getPlayerTotalStats(player);
  const actualMaxHp = totalStats.maxHp;
  // Ensure initial value is valid number, prevent NaN
  // Adjust HP proportionally: If Art increased max HP, current HP should also increase proportionally
  const baseMaxHp = Number(player.maxHp) || 1; // Avoid division by zero
  const currentHp = Number(player.hp) || 0;
  const hpRatio = baseMaxHp > 0 ? currentHp / baseMaxHp : 0; // Calculate HP ratio
  const initialPlayerHp = Math.floor(actualMaxHp * hpRatio); // Apply proportionally to new max HP
  const initialMaxHp = actualMaxHp;
  let playerHp = Math.max(0, Math.min(initialPlayerHp, initialMaxHp));
  let enemyHp = Number(enemy.maxHp) || 0;
  const rounds: BattleRoundLog[] = [];
  let attacker: 'player' | 'enemy' =
    (player.speed || 0) >= enemy.speed ? 'player' : 'enemy';

  // Get active pet
  const activePet = player.activePetId
    ? player.pets.find((p) => p.id === player.activePetId)
    : null;

  // Initialize pet skill cooldowns (if not yet)
  let petSkillCooldowns: Record<string, number> = {};
  if (activePet && !activePet.skillCooldowns) {
    petSkillCooldowns = {};
  } else if (activePet) {
    petSkillCooldowns = { ...activePet.skillCooldowns };
  }

  while (playerHp > 0 && enemyHp > 0 && rounds.length < 40) {
    const isPlayerTurn = attacker === 'player';
    const damage = calcDamage(
      isPlayerTurn ? player.attack : enemy.attack,
      isPlayerTurn ? enemy.defense : player.defense
    );
    // Ensure speed value is valid number, prevent NaN
    const playerSpeed = Number(player.speed) || 0;
    const enemySpeed = Number(enemy.speed) || 0;
    const speedSum = Math.max(1, playerSpeed + enemySpeed); // Ensure at least 1, avoid division by zero
    const critSpeed = isPlayerTurn ? playerSpeed : enemySpeed;
    // Optimized crit rate calculation: Reduce speed impact on crit rate, cap at 20%
    // Base 10% + Speed bonus max 10% = Max 20% crit rate (Fix: Base crit rate changed to 10%)
    const critChanceBase = 0.10 + (critSpeed / speedSum) * 0.10;
    // Ensure crit rate is within reasonable range (max 20%)
    const validCritChance = Math.max(0, Math.min(0.2, critChanceBase));
    const crit = Math.random() < validCritChance;
    const finalDamage = crit ? Math.round(damage * 1.5) : damage;

    if (isPlayerTurn) {
      enemyHp = Math.max(0, (Number(enemyHp) || 0) - finalDamage);
    } else {
      playerHp = Math.max(0, (Number(playerHp) || 0) - finalDamage);
    }
    rounds.push({
      id: randomId(),
      attacker,
      damage: finalDamage,
      crit,
      description: isPlayerTurn
        ? `You attack with precision, dealing ${finalDamage}${crit ? ' (CRITICAL!)' : ''} damage.`
        : `${enemy.title} ${enemy.name} counterattacks, dealing ${finalDamage}${crit ? ' (CRITICAL!)' : ''} damage.`,
      playerHpAfter: playerHp,
      enemyHpAfter: enemyHp,
    });

    // After player turn, pet can act (extra attack or cast skill)
    if (isPlayerTurn && activePet && enemyHp > 0) {
      // Update skill cooldowns
      Object.keys(petSkillCooldowns).forEach((skillId) => {
        if (petSkillCooldowns[skillId] > 0) {
          petSkillCooldowns[skillId]--;
        }
      });

      // Decide pet action: dynamically adjust skill probability based on affection and level
      // Base probability 30%, +2% per 10 affection, +1% per 10 levels, max 70%
      const baseProbability = 0.3;
      const petAffection = Number(activePet.affection) || 0; // Ensure valid number
      const petLevel = Number(activePet.level) || 0; // Ensure valid number
      const affectionBonus = (petAffection / 100) * 0.2; // Affection bonus, max 20%
      const levelBonus = (petLevel / 100) * 0.1; // Level bonus, max 10%
      const skillProbability = Math.min(0.7, baseProbability + affectionBonus + levelBonus);
      const useSkill = Math.random() < skillProbability;
      let petAction: 'attack' | 'skill' | null = null;
      let usedSkill: PetSkill | null = null;

      if (useSkill && activePet.skills.length > 0) {
        // Find available skills (cooldown is 0 or not set)
        const availableSkills = activePet.skills.filter(
          (skill) => !petSkillCooldowns[skill.id] || petSkillCooldowns[skill.id] <= 0
        );

        if (availableSkills.length > 0) {
          usedSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
          petAction = 'skill';
        } else {
          petAction = 'attack';
        }
      } else {
        petAction = 'attack';
      }

      if (petAction === 'skill' && usedSkill) {
        // Cast skill
        let petDamage = 0;
        let petHeal = 0;
        let petBuff: { attack?: number; defense?: number; hp?: number } | undefined;

        if (usedSkill.effect.damage) {
          // Skill damage: Base damage + Pet attack bonus + Level bonus
          const baseSkillDamage = Number(usedSkill.effect.damage) || 0;
          // Increase attack multiplier based on evolution stage
          const evolutionMultiplier = 1.0 + (Number(activePet.evolutionStage) || 0) * 0.5;
          const attackMultiplier = 1.0 + ((Number(activePet.level) || 0) / 50); // +100% attack per 50 levels
          // Attack bonus increased from 30% to 100%, and apply evolution multiplier
          const baseAttack = Number(activePet.stats?.attack) || 0;
          const attackBonus = Math.floor(baseAttack * evolutionMultiplier * attackMultiplier * 1.0); // 100% attack bonus
          const levelBonus = Math.floor((Number(activePet.level) || 0) * 5); // +5 damage per level (increased from 2)
          const affectionBonus = Math.floor((Number(activePet.affection) || 0) * 0.8); // Affection also boosts skill damage
          const skillDamage = baseSkillDamage + attackBonus + levelBonus + affectionBonus;
          petDamage = calcDamage(skillDamage, enemy.defense);
          enemyHp = Math.max(0, (Number(enemyHp) || 0) - petDamage);
        }

        if (usedSkill.effect.heal) {
          // Heal player
          const baseHeal = Number(usedSkill.effect.heal) || 0;
          const petLevel = Number(activePet.level) || 0;
          const petAffection = Number(activePet.affection) || 0;
          petHeal = Math.floor(
            baseHeal * (1 + petLevel * 0.05) * (1 + petAffection / 200)
          );
          // Calculate actual max HP using getPlayerTotalStats (includes Golden Core method, Mental Arts bonuses, etc.)
  const totalStats = getPlayerTotalStats(player);
          const actualMaxHp = totalStats.maxHp;
          playerHp = Math.max(0, Math.min(actualMaxHp, Math.floor((Number(playerHp) || 0) + petHeal)));
        }

        if (usedSkill.effect.buff) {
          petBuff = usedSkill.effect.buff;
        }

        // Set skill cooldown
        if (usedSkill.cooldown) {
          petSkillCooldowns[usedSkill.id] = usedSkill.cooldown;
        }

        // Build skill description
        let skillDesc = `[${activePet.name}] used [${usedSkill.name}]!`;
        if (petDamage > 0) {
          skillDesc += ` Dealt ${petDamage} damage.`;
        }
        if (petHeal > 0) {
          skillDesc += ` Restored ${petHeal} HP.`;
        }
        if (petBuff) {
          const buffParts: string[] = [];
          if (petBuff.attack) buffParts.push(`ATK+${petBuff.attack}`);
          if (petBuff.defense) buffParts.push(`DEF+${petBuff.defense}`);
          if (petBuff.hp) buffParts.push(`HP+${petBuff.hp}`);
          if (buffParts.length > 0) {
            skillDesc += ` You gained buff: ${buffParts.join(', ')}.`;
          }
        }

        rounds.push({
          id: randomId(),
          attacker: 'player',
          damage: petDamage,
          crit: false,
          description: skillDesc,
          playerHpAfter: playerHp,
          enemyHpAfter: enemyHp,
        });
      } else {
        // Normal attack: Base attack + Attack % bonus + Level bonus + Affection bonus
        const baseAttack = Number(activePet.stats?.attack) || 0;
        // Evolution multiplier (Juvenile 1.0, Mature 1.5, Complete 2.0)
        const evolutionMultiplier = 1.0 + (Number(activePet.evolutionStage) || 0) * 0.5;
        const attackMultiplier = 1.0 + ((Number(activePet.level) || 0) / 50); // +100% attack per 50 levels
        const levelBonus = Math.floor((Number(activePet.level) || 0) * 8); // +8 attack per level
        const affectionBonus = Math.floor((Number(activePet.affection) || 0) * 1.5); // Affection bonus
        // Final attack = (Base * Evo * LevelMultiplier) + LevelBonus + AffectionBonus
        const petAttackDamage = Math.floor(baseAttack * evolutionMultiplier * attackMultiplier) + levelBonus + affectionBonus;
        const petDamage = calcDamage(petAttackDamage, enemy.defense);
        enemyHp = Math.max(0, (Number(enemyHp) || 0) - petDamage);

        rounds.push({
          id: randomId(),
          attacker: 'player',
          damage: petDamage,
          crit: false,
          description: `[${activePet.name}] attacks and deals ${petDamage} damage.`,
          playerHpAfter: playerHp,
          enemyHpAfter: enemyHp,
        });
      }
    }

    if (playerHp <= 0 || enemyHp <= 0) {
      break;
    }

    attacker = attacker === 'player' ? 'enemy' : 'player';
  }

  const victory = enemyHp <= 0 && playerHp > 0;

  // Ensure hpLoss is valid number
  const playerHpBefore = Number(player.hp) || 0;
  const playerHpAfter = Number(playerHp) || 0;
  const hpLoss = Math.max(0, Math.floor(playerHpBefore - playerHpAfter));

  // Adjust reward multiplier based on risk level
  const getRewardMultiplier = (
    riskLevel?: RiskLevel
  ): number => {
    if (!riskLevel) return 1.0;
    const multipliers: Record<string, number> = {
      Low: 1.0,
      Medium: 1.3,
      High: 1.6,
      'Extreme': 2.2,
    };
    return multipliers[riskLevel] || 1.0;
  };

  const rewardMultiplier =
    adventureType === 'secret_realm' ? getRewardMultiplier(riskLevel) : 1.0;

  // Calculate base reward based on Realm (Higher realm = more rewards)
  const realmIndex = REALM_ORDER.indexOf(player.realm);
  // Optimized Realm Multipliers: Consistent with equipment multipliers to prevent stat inflation
  // From [1, 2, 4, 8, 16, 32, 64] to [1, 1.5, 2.5, 4, 6, 10, 16]
  // Max multiplier reduced from 64x to 16x, matching realm stat growth (5x)
  const realmBaseMultipliers = [1, 1.5, 2.5, 4, 6, 10, 16];
  const realmBaseMultiplier = realmBaseMultipliers[realmIndex] || 1;

  // Base Exp = Realm Multiplier * (Base + Level * Factor) * Level Bonus
  const levelMultiplier = 1 + (player.realmLevel - 1) * 0.15; // +15% per level
  const baseExp = Math.round(realmBaseMultiplier * (50 + player.realmLevel * 25) * levelMultiplier);
  const rewardExp = Math.round(baseExp * difficulty * rewardMultiplier);

  // Base Spirit Stones = Realm Multiplier * (Base + Level * Factor) * Level Bonus
  const baseStones = Math.round(realmBaseMultiplier * (15 + player.realmLevel * 5) * levelMultiplier);
  const rewardStones = Math.max(
    10,
    Math.round(baseStones * difficulty * rewardMultiplier)
  );

  const expChange = victory
    ? rewardExp
    : -Math.max(5, Math.round(rewardExp * 0.5));
  const spiritChange = victory
    ? rewardStones
    : -Math.max(2, Math.round(rewardStones * 0.6));

  // If victory, generate loot
  const lootItems: AdventureResult['itemObtained'][] = [];
  if (victory) {
    const loot = generateLoot(
      enemy.strengthMultiplier,
      adventureType,
      player.realm,
      riskLevel
    );
    lootItems.push(...loot);
  }

  // Generate richer battle descriptions (combine with Secret Realm features if available)
  const generateBattleSummary = (
    victory: boolean,
    enemy: { name: string; title: string },
    hpLoss: number,
    hasLoot: boolean,
    realmName?: string
  ): string => {
    // If secret realm name exists, generate secret realm related description
    if (realmName && adventureType === 'secret_realm') {
      const realmContext = `In [${realmName}], `;
      const victoryScenarios = [
        `${realmContext}you fought fiercely against ${enemy.title} ${enemy.name}. Finally, you slew it, but lost ${hpLoss} HP. ${hasLoot ? 'You carefully searched its remains.' : ''}`,
        `${realmContext}you were ambushed by ${enemy.title} ${enemy.name}. After a desperate struggle, you defeated it, consuming ${hpLoss} HP. ${hasLoot ? 'You found loot on the enemy.' : ''}`,
        `${realmContext}you confronted ${enemy.title} ${enemy.name}. You killed it with superior strength, losing ${hpLoss} HP. ${hasLoot ? 'You checked the remains and found a bountiful harvest.' : ''}`,
      ];
      const defeatScenarios = [
        `${realmContext}the battle with ${enemy.title} ${enemy.name} was extremely difficult. The enemy was too strong, and you had to retreat with heavy injuries, losing ${hpLoss} HP.`,
        `${realmContext}you encountered a powerful ${enemy.title} ${enemy.name}. Facing its fierce attacks, you fell into a disadvantage and had to flee, losing ${hpLoss} HP.`,
      ];
      const scenarios = victory ? victoryScenarios : defeatScenarios;
      return scenarios[Math.floor(Math.random() * scenarios.length)];
    }

    // Default description (Non-secret realm)
    const battleScenarios = victory
      ? [
        `After a fierce battle, you finally slew ${enemy.title} ${enemy.name}. Although you lost ${hpLoss} HP, you emerged victorious. ${hasLoot ? 'You searched the remains and found useful items.' : ''}`,
        `You engaged in a life-and-death struggle with ${enemy.title} ${enemy.name}. You defeated it with your skills, but consumed ${hpLoss} HP. ${hasLoot ? 'You looted some spoils from the enemy.' : ''}`,
        `Facing the crazy attacks of ${enemy.title} ${enemy.name}, you defended calmly. After a bitter fight, you found a flaw and killed it in one blow. Although you lost ${hpLoss} HP, the joy of victory made you forget the pain. ${hasLoot ? 'You checked the remains and found a bountiful harvest.' : ''}`,
        `Your battle with ${enemy.title} ${enemy.name} was intense. You killed it with superior strength, but also took damage from its dying counterattack, losing ${hpLoss} HP. ${hasLoot ? 'After the battle, you looted the spoils.' : ''}`,
        `You used your artifact to fight ${enemy.title} ${enemy.name}. After several rounds, you won by a narrow margin, killing it but losing ${hpLoss} HP. ${hasLoot ? 'You found some valuable items on the enemy.' : ''}`,
        `You unleashed your divine powers against ${enemy.title} ${enemy.name}. After trading blows, you seized the opportunity to kill it. Although you lost ${hpLoss} HP, your strength improved in this battle. ${hasLoot ? 'You carefully searched the remains.' : ''}`,
      ]
      : [
        `You fought fiercely with ${enemy.title} ${enemy.name}, but its strength far exceeded your imagination. You resisted with all your might but were still defeated, retreating with heavy injuries and losing ${hpLoss} HP.`,
        `Facing the powerful ${enemy.title} ${enemy.name}, you fought bravely. However, the enemy's attacks were too fierce, and you gradually fell into a disadvantage. Finally, you had to abandon the battle and flee, losing ${hpLoss} HP.`,
        `The battle with ${enemy.title} ${enemy.name} was extremely difficult. Its speed and power exceeded your expectations. You fought hard but could not win. To save your life, you retreated with heavy injuries, losing ${hpLoss} HP.`,
        `You used your artifact to fight ${enemy.title} ${enemy.name}, but its defense was extremely strong. Seeing the situation was bad, you had to abandon the battle and retreat, losing ${hpLoss} HP.`,
        `You used your divine powers against ${enemy.title} ${enemy.name}, but its strength was unfathomable. After a bitter fight, you realized you could not win and chose to retreat, losing ${hpLoss} HP.`,
      ];

    // Randomly select a scenario description
    return battleScenarios[Math.floor(Math.random() * battleScenarios.length)];
  };

  const summary = generateBattleSummary(
    victory,
    enemy,
    hpLoss,
    lootItems.length > 0,
    realmName
  );

  // Ensure hpChange is valid number, prevent NaN
  const hpChange = Math.floor(playerHpAfter - playerHpBefore);

  const adventureResult: AdventureResult = {
    story: summary,
    hpChange,
    expChange,
    spiritStonesChange: spiritChange,
    eventColor: 'danger',
    itemsObtained: lootItems.length > 0 ? lootItems : undefined,
  };

  // Clear skill cooldowns with 0 cooldown (save storage space)
  const finalPetSkillCooldowns: Record<string, number> = {};
  if (activePet) {
    Object.keys(petSkillCooldowns).forEach((skillId) => {
      if (petSkillCooldowns[skillId] > 0) {
        finalPetSkillCooldowns[skillId] = petSkillCooldowns[skillId];
      }
    });
  }

  return {
    adventureResult,
    replay: {
      id: randomId(),
      adventureType,
      bossId: bossId || null,
      enemy,
      rounds,
      victory,
      hpLoss,
      playerHpBefore: playerHpBefore,
      playerHpAfter: playerHpAfter,
      summary,
      expChange,
      spiritChange,
    },
    petSkillCooldowns: Object.keys(finalPetSkillCooldowns).length > 0 ? finalPetSkillCooldowns : undefined,
  };
};

// ==================== Turn-Based Battle System ====================

/**
 * Calculate Battle Rewards
 */
export const calculateBattleRewards = (
  battleState: BattleState,
  player: PlayerStats,
  adventureType?: AdventureType,
  riskLevel?: RiskLevel
): {
  expChange: number;
  spiritChange: number;
  items?: AdventureResult['itemObtained'][];
} => {
  const victory = battleState.enemy.hp <= 0;
  const actualAdventureType = adventureType || battleState.adventureType;
  const actualRiskLevel = riskLevel || battleState.riskLevel;
  const difficulty = getBattleDifficulty(actualAdventureType, actualRiskLevel);

  // Calculate reward multiplier based on enemy strength (stronger enemy, more rewards)
  const enemyStrength = battleState.enemyStrengthMultiplier || 1.0;
  const strengthRewardMultiplier = 0.8 + enemyStrength * 0.4; // 0.8-1.2x (Weak) to 1.2-2.0x (Strong)

  // Adjust reward multiplier based on risk level
  const getRewardMultiplier = (
    riskLevel?: RiskLevel
  ): number => {
    if (!riskLevel) return 1.0;
    const multipliers: Record<string, number> = {
      Low: 1.0,
      Medium: 1.3,
      High: 1.6,
      'Extreme': 2.2,
      'Low': 1.0,
      'Medium': 1.3,
      'High': 1.6,
      'Extreme Danger': 2.2,
    };
    return multipliers[riskLevel] || 1.0;
  };

  const riskRewardMultiplier =
    actualAdventureType === 'secret_realm' ? getRewardMultiplier(actualRiskLevel) : 1.0;

  // Comprehensive reward multiplier
  const totalRewardMultiplier = difficulty * riskRewardMultiplier * strengthRewardMultiplier;

  // Calculate base reward based on Realm (Higher realm = more rewards)
  const realmIndex = REALM_ORDER.indexOf(player.realm);
  // Realm Base Multiplier: Each realm significantly increases reward multiplier (exponential growth)
  const realmBaseMultipliers = [1, 2, 4, 8, 16, 32, 64];
  const realmBaseMultiplier = realmBaseMultipliers[realmIndex] || 1;

  // Base Cultivation = Realm Base Multiplier * (Base Value + Realm Level * Coefficient) * Realm Level Bonus
  const levelMultiplier = 1 + (player.realmLevel - 1) * 0.2; // Increase 20% per level
  const baseExp = Math.round(realmBaseMultiplier * (50 + player.realmLevel * 25) * levelMultiplier);
  const rewardExp = Math.round(baseExp * totalRewardMultiplier);

  // Base Spirit Stones = Realm Base Multiplier * (Base Value + Realm Level * Coefficient) * Realm Level Bonus
  const baseSpiritStones = Math.round(realmBaseMultiplier * (15 + player.realmLevel * 5) * levelMultiplier);
  const rewardStones = Math.max(
    10,
    Math.round(baseSpiritStones * totalRewardMultiplier)
  );

  // Sect Challenge Special Reward (Only for defeating Sect Master)
  if (actualAdventureType === 'sect_challenge') {
    // Check if Sect Master Battle:
    // 1. Hunt battle and huntLevel >= 3 (Defeated Sect Master)
    // 2. Normal challenge and Elder challenges Sect Master
    const isHuntMasterBattle = player.sectId === null &&
      player.sectHuntSectId &&
      player.sectHuntLevel !== undefined &&
      player.sectHuntLevel >= 3;
    const isNormalMasterBattle = player.sectId !== null &&
      player.sectRank === SectRank.Elder;
    const isMasterBattle = isHuntMasterBattle || isNormalMasterBattle;

    if (victory && isMasterBattle) {
      // Defeated Sect Master, give special reward
      return {
        expChange: SECT_MASTER_CHALLENGE_REQUIREMENTS.victoryReward.exp,
        spiritChange: SECT_MASTER_CHALLENGE_REQUIREMENTS.victoryReward.spiritStones,
        items: [
          {
            name: 'Sect Master Token',
            type: ItemType.Material,
            rarity: 'Mythic',
            description: 'Symbol of the Sect Master. With this token, you can command the entire sect.'
          },
          {
            name: 'Sect Vault Key',
            type: ItemType.Material,
            rarity: 'Mythic',
            description: 'Key to open the Sect Vault, containing the accumulation of past Sect Masters.'
          }
        ]
      };
    } else if (!victory && isMasterBattle) {
      // Failed to challenge Sect Master, deduct cultivation base based on constant
      return {
        expChange: -SECT_MASTER_CHALLENGE_REQUIREMENTS.defeatPenalty.expLoss,
        spiritChange: 0,
      };
    }
    // If not Sect Master battle, continue with normal reward calculation logic
  }

  const expChange = victory
    ? rewardExp
    : -Math.max(5, Math.round(rewardExp * 0.5));
  const spiritChange = victory
    ? rewardStones
    : -Math.max(2, Math.round(rewardStones * 0.6));

  // If victory, generate item rewards
  let items: AdventureResult['itemObtained'][] | undefined = undefined;
  if (victory) {
    items = generateLoot(
      enemyStrength,
      actualAdventureType,
      player.realm,
      actualRiskLevel
    );
  }

  return { expChange, spiritChange, items };
};

/**
 * Initialize Turn-Based Battle
 */
export const initializeTurnBasedBattle = async (
  player: PlayerStats,
  adventureType: AdventureType,
  riskLevel?: RiskLevel,
  realmMinRealm?: RealmType,
  sectMasterId?: string | null,
  bossId?: string // Specified Heaven Earth Soul BOSS ID (for event template)
): Promise<BattleState> => {
  // Create enemy (if hunt battle, get hunt params from player object)
  const huntSectId = adventureType === 'sect_challenge' && player.sectId === null ? player.sectHuntSectId : undefined;
  const huntLevel = adventureType === 'sect_challenge' && player.sectId === null ? player.sectHuntLevel : undefined;
  const enemyData = await createEnemy(player, adventureType, riskLevel, realmMinRealm, sectMasterId, huntSectId, huntLevel, bossId);

  // Create player battle unit
  const playerUnit = createBattleUnitFromPlayer(player);

  // Create enemy battle unit
  const enemyUnit: BattleUnit = {
    id: 'enemy',
    name: enemyData.name,
    realm: enemyData.realm,
    hp: enemyData.maxHp,
    maxHp: enemyData.maxHp,
    attack: enemyData.attack,
    defense: enemyData.defense,
    speed: enemyData.speed,
    spirit: enemyData.spirit, // Use spirit attribute from enemy data
    buffs: [],
    debuffs: [],
    skills: [], // Enemy skills (can be added later)
    cooldowns: {},
    // Enemy MP also calculated based on attributes
    mana: Math.floor(enemyData.attack * 0.3 + enemyData.maxHp * 0.05),
    maxMana: Math.floor(enemyData.attack * 0.3 + enemyData.maxHp * 0.05),
    isDefending: false,
  };

  // Get active pet
  const activePet = player.activePetId
    ? player.pets.find((p) => p.id === player.activePetId)
    : null;

  // Initialize pet skill cooldowns
  let petSkillCooldowns: Record<string, number> = {};
  if (activePet) {
    if (activePet.skillCooldowns) {
      petSkillCooldowns = { ...activePet.skillCooldowns };
    } else {
      petSkillCooldowns = {};
    }
  }

  // Determine turn order
  const playerFirst = (playerUnit.speed || 0) >= enemyUnit.speed;

  const playerMaxActions = calculateActionCount(
    playerUnit.speed,
    enemyUnit.speed,
    playerUnit.spirit,
    enemyUnit.spirit
  );
  const enemyMaxActions = calculateActionCount(
    enemyUnit.speed,
    playerUnit.speed,
    enemyUnit.spirit,
    playerUnit.spirit
  );

  // Initialize battle history
  const initialHistory: BattleAction[] = [];

  // If player spirit is higher than opponent, add intimidate hint
  if (playerUnit.spirit > enemyUnit.spirit) {
    const spiritDiff = playerUnit.spirit - enemyUnit.spirit;
    const spiritRatio = spiritDiff / enemyUnit.spirit;
    // If spirit advantage exceeds 20%, add intimidate log
    if (spiritRatio >= 0.2) {
      const intimidateAction: BattleAction = {
        id: randomId(),
        round: 1,
        turn: 'player',
        actor: 'player',
        actionType: 'attack',
        result: {},
        description: `✨ Your perception far exceeds the opponent! They are intimidated!`,
      };
      initialHistory.push(intimidateAction);
    }
  }

  return {
    id: randomId(),
    round: 1,
    turn: playerFirst ? 'player' : 'enemy',
    player: playerUnit,
    enemy: enemyUnit,
    history: initialHistory,
    isPlayerTurn: playerFirst,
    waitingForPlayerAction: playerFirst,
    playerInventory: player.inventory, // Save player inventory
    playerActionsRemaining: playerFirst ? playerMaxActions : 0,
    enemyActionsRemaining: playerFirst ? 0 : enemyMaxActions,
    playerMaxActions,
    enemyMaxActions,
    enemyStrengthMultiplier: enemyData.strengthMultiplier, // Save enemy strength multiplier
    adventureType, // Save adventure type
    riskLevel, // Save risk level
    activePet, // Save active pet
    petSkillCooldowns, // Save pet skill cooldowns
  };
};

/**
 * Generate default skill for Arts without configured skills
 */
function generateDefaultSkillForArt(art: CultivationArt): BattleSkill | null {
  // Generate different skills based on Art type and grade
  const gradeMultipliers: Record<string, number> = {
    'C': 1.0,
    'B': 1.5,
    'A': 2.5,
    'S': 4.0,
  };
  const multiplier = gradeMultipliers[art.grade] || 1.0;

  // Determine skill type based on Art type
  if (art.type === 'body') {
    // Body Art -> Attack Skill
    const baseDamage = Math.round(30 * multiplier);
    const damageMultiplier = 0.8 + (multiplier - 1) * 0.3;

    return {
      id: `skill-${art.id}`,
      name: art.name,
      description: `Unleash ${art.name}, dealing damage to the enemy.`,
      type: 'attack',
      source: 'cultivation_art',
      sourceId: art.id,
      effects: [],
      cost: { mana: Math.round(20 * multiplier) },
      cooldown: 0,
      maxCooldown: Math.max(2, Math.round(multiplier)),
      target: 'enemy',
      damage: {
        base: baseDamage,
        multiplier: damageMultiplier,
        type: 'physical',
        critChance: 0.1 + (multiplier - 1) * 0.05,
        critMultiplier: 1.5 + (multiplier - 1) * 0.2,
      },
    };
  } else if (art.type === 'mental') {
    // Mental Art -> Skill type determined by effect
    if (art.effects?.expRate) {
      // If has exp rate bonus, generate Buff skill (boost attributes)
      return {
        id: `skill-${art.id}`,
        name: art.name,
        description: `Activate ${art.name}, boosting own attributes.`,
        type: 'buff',
        source: 'cultivation_art',
        sourceId: art.id,
        effects: [
          {
            type: 'buff',
            target: 'self',
            buff: {
              id: `${art.id}-buff`,
              name: art.name,
              type: 'attack',
              value: 0.1 * multiplier, // 10% * grade multiplier
              duration: 3,
              source: art.id,
              description: `Attack increased by ${Math.round(10 * multiplier)}%`,
            },
          },
        ],
        cost: { mana: Math.round(25 * multiplier) },
        cooldown: 0,
        maxCooldown: Math.max(3, Math.round(multiplier * 1.5)),
        target: 'self',
      };
    } else {
      // Other Mental Arts -> Magical Attack
      const baseDamage = Math.round(40 * multiplier);
      const damageMultiplier = 1.0 + (multiplier - 1) * 0.4;

      return {
        id: `skill-${art.id}`,
        name: art.name,
        description: `Cast ${art.name}, dealing magical damage to the enemy.`,
        type: 'attack',
        source: 'cultivation_art',
        sourceId: art.id,
        effects: [],
        cost: { mana: Math.round(30 * multiplier) },
        cooldown: 0,
        maxCooldown: Math.max(2, Math.round(multiplier)),
        target: 'enemy',
        damage: {
          base: baseDamage,
          multiplier: damageMultiplier,
          type: 'magical',
          critChance: 0.15 + (multiplier - 1) * 0.05,
          critMultiplier: 2.0 + (multiplier - 1) * 0.3,
        },
      };
    }
  }

  return null;
}

/**
 * Create battle unit from player data
 */
export function createPlayerUnit(player: PlayerStats): BattleUnit {
  // Get total stats including Mental Art bonuses
  const totalStats = getPlayerTotalStats(player);

  const equippedItems = getEquippedItems(player);
  const totalAttack = totalStats.attack;
  const totalDefense = totalStats.defense;
  const totalSpirit = totalStats.spirit;
  const totalSpeed = totalStats.speed;

  // Note: player.attack etc. already include equipment bonuses
  // getPlayerTotalStats also includes Mental Art bonuses
  // So no need to iterate equippedItems to add stats here, otherwise it will double count

  // Collect all available skills
  const skills: BattleSkill[] = [];

  // Optimization: Pre-build Art map to avoid repeated lookups in loop
  const artsMap = new Map(
    CULTIVATION_ARTS.map(art => [art.id, art])
  );

  // 1. Cultivation Art Skills
  player.cultivationArts.forEach((artId) => {
    const artSkills = CULTIVATION_ART_BATTLE_SKILLS[artId];
    if (artSkills) {
      // If Art has configured skills, use them
      skills.push(...artSkills.map((s) => ({ ...s, cooldown: 0 })));
    } else {
      // If Art has no configured skills, auto-generate default skill
      const art = artsMap.get(artId);
      if (art) {
        const defaultSkill = generateDefaultSkillForArt(art);
        if (defaultSkill) {
          skills.push({ ...defaultSkill, cooldown: 0 });
        }
      }
    }
  });

  // 2. Artifact/Weapon Skills
  // Optimization: Pre-build skill lookup map to avoid repeated Object.values() calls
  const artifactSkillsBySourceId = new Map<string, BattleSkill[]>();
  const weaponSkillsBySourceId = new Map<string, BattleSkill[]>();

  // Build sourceId to skills map (for fallback lookup)
  Object.entries(ARTIFACT_BATTLE_SKILLS).forEach(([key, skillArray]) => {
    // Support direct lookup by key
    artifactSkillsBySourceId.set(key, skillArray);
    // Build sourceId to skills map
    skillArray.forEach((skill) => {
      if (skill.sourceId && !artifactSkillsBySourceId.has(skill.sourceId)) {
        artifactSkillsBySourceId.set(skill.sourceId, skillArray);
      }
    });
  });

  Object.entries(WEAPON_BATTLE_SKILLS).forEach(([key, skillArray]) => {
    // Support direct lookup by key
    weaponSkillsBySourceId.set(key, skillArray);
    // Build sourceId to skills map
    skillArray.forEach((skill) => {
      if (skill.sourceId && !weaponSkillsBySourceId.has(skill.sourceId)) {
        weaponSkillsBySourceId.set(skill.sourceId, skillArray);
      }
    });
  });

  equippedItems.forEach((item) => {
    // Prioritize item's own battleSkills
    if (item.battleSkills && item.battleSkills.length > 0) {
      skills.push(...item.battleSkills.map((s) => ({ ...s, cooldown: 0 })));
    } else {
      // If not, try to get from config
      if (item.type === ItemType.Artifact) {
        // Optimization: Try direct lookup by item.id first, then by sourceId
        const artifactSkills = ARTIFACT_BATTLE_SKILLS[item.id] ||
          artifactSkillsBySourceId.get(item.id);
        if (artifactSkills) {
          skills.push(...artifactSkills.map((s) => ({ ...s, cooldown: 0 })));
        }
      } else if (item.type === ItemType.Weapon) {
        const weaponSkills = WEAPON_BATTLE_SKILLS[item.id] ||
          weaponSkillsBySourceId.get(item.id);
        if (weaponSkills) {
          skills.push(...weaponSkills.map((s) => ({ ...s, cooldown: 0 })));
        }
      }
    }
  });

  // Apply passive effects (Mental Arts)
  const buffs: Buff[] = [];
  if (player.activeArtId) {
    const activeArt = artsMap.get(player.activeArtId);
    if (activeArt && activeArt.type === 'mental') {
      const artSkills = CULTIVATION_ART_BATTLE_SKILLS[player.activeArtId];
      if (artSkills) {
        artSkills.forEach((skill) => {
          if (skill.type === 'buff' && skill.effects) {
            skill.effects.forEach((effect) => {
              if (effect.type === 'buff' && effect.buff) {
                buffs.push(effect.buff);
              }
            });
          }
        });
      }
    }
  }

  // Calculate Mana based on Realm
  // Mana = Base + Realm Bonus + Spirit Bonus
  const realmIndex = REALM_ORDER.indexOf(player.realm);
  const baseMana = 50; // Base Mana
  const realmManaBonus = realmIndex * 50 + (player.realmLevel - 1) * 10; // Realm Bonus
  const spiritManaBonus = Math.floor(totalSpirit * 0.5); // Spirit Bonus (50% of Spirit)
  const maxMana = baseMana + realmManaBonus + spiritManaBonus;
  const currentMana = maxMana; // Full Mana at start

  // Adjust HP proportionally: if max HP increased, current HP should increase proportionally
  const baseMaxHp = Number(player.maxHp) || 1; // Avoid divide by zero
  const currentHp = Number(player.hp) || 0;
  const hpRatio = baseMaxHp > 0 ? currentHp / baseMaxHp : 0; // Calculate HP ratio
  const adjustedHp = Math.floor(totalStats.maxHp * hpRatio); // Apply ratio to new max HP

  return {
    id: 'player',
    name: player.name,
    realm: player.realm,
    hp: Math.min(adjustedHp, totalStats.maxHp), // Use adjusted HP
    maxHp: totalStats.maxHp, // Use actual max HP (including bonuses)
    attack: totalAttack,
    defense: totalDefense,
    speed: totalSpeed,
    spirit: totalSpirit,
    buffs,
    debuffs: [],
    skills,
    cooldowns: {},
    mana: currentMana,
    maxMana: maxMana,
    isDefending: false,
  };
}

/**
 * Get list of equipped items
 */
function getEquippedItems(player: PlayerStats): Item[] {
  const equipped: Item[] = [];
  Object.values(player.equippedItems).forEach((itemId) => {
    if (itemId) {
      const item = player.inventory.find((i) => i.id === itemId);
      if (item) {
        equipped.push(item);
      }
    }
  });
  return equipped;
}

/**
 * Execute Player Action
 */
export function executePlayerAction(
  battleState: BattleState,
  action: PlayerAction
): BattleState {
  if (!battleState.waitingForPlayerAction || battleState.playerActionsRemaining <= 0) {
    throw new Error('Not player turn or no actions remaining');
  }

  let newState = { ...battleState };
  let actionResult: BattleAction | null = null;

  switch (action.type) {
    case 'attack':
      actionResult = executeNormalAttack(newState, 'player', 'enemy');
      break;
    case 'skill':
      actionResult = executeSkill(newState, 'player', action.skillId, 'enemy');
      break;
    case 'item':
      actionResult = executeItem(newState, action.itemId);
      break;
    case 'advancedItem':
      actionResult = executeAdvancedItem(newState, action.itemType, action.itemId);
      break;
    case 'defend':
      actionResult = executeDefend(newState, 'player');
      break;
    case 'flee':
      actionResult = executeFlee(newState);
      // If flee success, end battle immediately
      if (actionResult.description.includes('Success') || actionResult.description.includes('success')) {
        return newState;
      }
      break;
  }

  if (actionResult) {
    newState.history.push(actionResult);
    newState = updateBattleStateAfterAction(newState, actionResult);
  }

  // Decrease remaining actions
  newState.playerActionsRemaining -= 1;

  // After player action, Pet can act (if enemy still alive)
  if (newState.activePet && newState.enemy.hp > 0) {
    // Update Pet skill cooldowns
    const petSkillCooldowns = newState.petSkillCooldowns || {};
    const newPetSkillCooldowns: Record<string, number> = {};
    Object.keys(petSkillCooldowns).forEach((skillId) => {
      if (petSkillCooldowns[skillId] > 0) {
        newPetSkillCooldowns[skillId] = petSkillCooldowns[skillId] - 1;
      }
    });
    newState.petSkillCooldowns = newPetSkillCooldowns;

    const petAction = executePetAction(newState);
    if (petAction) {
      newState.history.push(petAction);
      newState = updateBattleStateAfterAction(newState, petAction);
    }
  }

  // If actions remaining, continue player turn; otherwise switch to enemy turn
  if (newState.playerActionsRemaining > 0) {
    // Continue player turn
    newState.waitingForPlayerAction = true;
    newState.turn = 'player';
  } else {
    // Player turn end, switch to enemy turn
    newState.waitingForPlayerAction = false;
    newState.turn = 'enemy';
    newState.enemyActionsRemaining = newState.enemyMaxActions;
  }

  return newState;
}

/**
 * Execute Enemy Turn (AI)
 */
export function executeEnemyTurn(battleState: BattleState): BattleState {
  if (battleState.waitingForPlayerAction || battleState.enemyActionsRemaining <= 0) {
    throw new Error('Not enemy turn or no actions remaining');
  }

  let newState = { ...battleState };
  const enemy = newState.enemy;
  
  // Simple AI: 70% Normal Attack, 20% Skill (if available), 10% Defend
  const actionRoll = Math.random();
  let actionResult: BattleAction | null = null;

  if (actionRoll < 0.7) {
    // Normal Attack
    actionResult = executeNormalAttack(newState, 'enemy', 'player');
  } else if (actionRoll < 0.9 && enemy.skills.length > 0) {
    // Use Skill (Randomly select an available skill)
    const availableSkills = enemy.skills.filter(
      (s) => (enemy.cooldowns[s.id] || 0) === 0 && (!s.cost.mana || (enemy.mana || 0) >= s.cost.mana)
    );
    if (availableSkills.length > 0) {
      const skill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
      actionResult = executeSkill(newState, 'enemy', skill.id, 'player');
    } else {
      actionResult = executeNormalAttack(newState, 'enemy', 'player');
    }
  } else {
    // Defend
    actionResult = executeDefend(newState, 'enemy');
  }

  if (actionResult) {
    newState.history.push(actionResult);
    newState = updateBattleStateAfterAction(newState, actionResult);
  }

  // Decrease remaining actions
  newState.enemyActionsRemaining -= 1;

  // After enemy turn, update Pet skill cooldowns (if exists)
  if (newState.activePet && newState.petSkillCooldowns) {
    const petSkillCooldowns = newState.petSkillCooldowns;
    const updatedCooldowns: Record<string, number> = {};
    Object.keys(petSkillCooldowns).forEach((skillId) => {
      if (petSkillCooldowns[skillId] > 0) {
        updatedCooldowns[skillId] = petSkillCooldowns[skillId] - 1;
      }
    });
    newState.petSkillCooldowns = updatedCooldowns;
  }

  // If actions remaining, continue enemy turn; otherwise switch to player turn
  if (newState.enemyActionsRemaining > 0) {
    // Continue enemy turn, can act again
    newState.waitingForPlayerAction = false;
    newState.turn = 'enemy';
    // Recursively execute next enemy action
    return executeEnemyTurn(newState);
  } else {
    // Enemy turn end, switch to player turn
    newState.waitingForPlayerAction = true;
    newState.turn = 'player';
    newState.round += 1;
    // Recalculate and reset player action count (Speed and Spirit may change due to Buff/Debuff)
    newState.playerMaxActions = calculateActionCount(
      newState.player.speed,
      newState.enemy.speed,
      newState.player.spirit,
      newState.enemy.spirit
    );
    newState.enemyMaxActions = calculateActionCount(
      newState.enemy.speed,
      newState.player.speed,
      newState.enemy.spirit,
      newState.player.spirit
    );
    newState.playerActionsRemaining = newState.playerMaxActions;

    // If player action count is 0 (too slow), switch back to enemy turn immediately
    if (newState.playerActionsRemaining <= 0) {
      newState.waitingForPlayerAction = false;
      newState.turn = 'enemy';
      newState.enemyActionsRemaining = newState.enemyMaxActions;
      // Recursively execute enemy turn
      return executeEnemyTurn(newState);
    }
  }

  return newState;
}

/**
 * Execute Normal Attack
 */
function executeNormalAttack(
  battleState: BattleState,
  attackerId: 'player' | 'enemy',
  targetId: 'player' | 'enemy'
): BattleAction {
  const attacker = attackerId === 'player' ? battleState.player : battleState.enemy;
  const target = targetId === 'player' ? battleState.player : battleState.enemy;

  // Calculate base damage
  const baseDamage = calcDamage(attacker.attack, target.defense);

  // Calculate Crit (Optimization: Unified crit calculation, set cap)
  let critChance = 0.10; // Base crit chance 10%
  // Calculate speed bonus based on speed diff (consistent with auto battle)
  const attackerSpeed = Number(attacker.speed) || 0;
  const targetSpeed = Number(target.speed) || 0;
  const speedSum = Math.max(1, attackerSpeed + targetSpeed);
  const speedBonus = (attackerSpeed / speedSum) * 0.10; // Max speed bonus 10%
  critChance += speedBonus;
  // Apply Buff/Debuff
  attacker.buffs.forEach((buff) => {
    if (buff.type === 'crit') {
      critChance += buff.value;
    }
  });
  // Cap crit chance at 20% (unless exceeded by Buff)
  critChance = Math.min(0.2, Math.max(0, critChance));
  const isCrit = Math.random() < critChance;
  // Calculate crit multiplier (Base 1.5x + buff)
  let critMultiplier = 1.5;
  attacker.buffs.forEach((buff) => {
    if (buff.critDamage && buff.critDamage > 0) {
      critMultiplier += buff.critDamage;
    }
  });
  const finalDamage = isCrit ? Math.round(baseDamage * critMultiplier) : baseDamage;

  // Check Dodge
  let isDodged = false;
  if (target.buffs.some(buff => buff.dodge && buff.dodge > 0)) {
    const maxDodge = Math.max(...target.buffs
      .filter(buff => buff.dodge && buff.dodge > 0)
      .map(buff => buff.dodge!));
    isDodged = Math.random() < maxDodge;
  }

  if (isDodged) {
    return {
      id: randomId(),
      round: battleState.round,
      turn: attackerId,
      actor: attackerId,
      actionType: 'attack',
      target: targetId,
      result: {
        miss: true,
      },
      description:
        attackerId === 'player'
          ? `You attacked, but ${target.name} dodged!`
          : `${attacker.name} attacked, but you dodged!`,
    };
  }

  // Apply Defense (Optimization: Dynamic damage reduction based on attack/defense ratio)
  let actualDamage = finalDamage;

  // Check if attacker has Ignore Defense buff
  const hasIgnoreDefense = attacker.buffs.some(buff => buff.ignoreDefense);

  if (target.isDefending && !hasIgnoreDefense) {
    // Base reduction 50%. If attack >> defense, reduction decreases
    const attackDefenseRatio = attacker.attack / Math.max(1, target.defense);
    let defenseReduction = 0.5; // Base reduction 50%

    // If Attack > 2x Defense, reduction -> 40%
    if (attackDefenseRatio > 2.0) {
      defenseReduction = 0.4;
    }
    // If Attack > 3x Defense, reduction -> 35%
    else if (attackDefenseRatio > 3.0) {
      defenseReduction = 0.35;
    }
    // If Defense > Attack, reduction -> 60%
    else if (attackDefenseRatio < 1.0) {
      defenseReduction = 0.6;
    }

    actualDamage = Math.round(actualDamage * (1 - defenseReduction));
  } else if (hasIgnoreDefense) {
    // Ignore Defense, deal full damage
    actualDamage = finalDamage;
  }

  // Apply Damage Reduction Buff
  if (target.buffs.some(buff => buff.damageReduction && buff.damageReduction > 0)) {
    const maxReduction = Math.max(...target.buffs
      .filter(buff => buff.damageReduction && buff.damageReduction > 0)
      .map(buff => buff.damageReduction!));
    actualDamage = Math.round(actualDamage * (1 - maxReduction));
  }

  // Update target HP (ensure integer)
  target.hp = Math.max(0, Math.floor(target.hp - actualDamage));

  // Handle Reflect Damage (if target has reflectDamage buff)
  let reflectedDamage = 0;
  if (actualDamage > 0 && target.buffs.some(buff => buff.reflectDamage && buff.reflectDamage > 0)) {
    // Find max reflect ratio
    const maxReflectRatio = Math.max(...target.buffs
      .filter(buff => buff.reflectDamage && buff.reflectDamage > 0)
      .map(buff => buff.reflectDamage!));

    if (maxReflectRatio > 0) {
      reflectedDamage = Math.floor(actualDamage * maxReflectRatio);
      attacker.hp = Math.max(0, Math.floor(attacker.hp - reflectedDamage));
    }
  }

  // Build description
  let description = '';
  if (attackerId === 'player') {
    description = `You attacked, dealing ${actualDamage}${isCrit ? ' (CRIT)' : ''} damage.`;
    if (reflectedDamage > 0) {
      description += ` ${target.name}'s reflection dealt ${reflectedDamage} damage to you!`;
    }
  } else {
    description = `${attacker.name} attacked, dealing ${actualDamage}${isCrit ? ' (CRIT)' : ''} damage.`;
    if (reflectedDamage > 0) {
      description += ` Your reflection dealt ${reflectedDamage} damage to ${attacker.name}!`;
    }
  }

  return {
    id: randomId(),
    round: battleState.round,
    turn: attackerId,
    actor: attackerId,
    actionType: 'attack',
    target: targetId,
    result: {
      damage: actualDamage,
      crit: isCrit,
      reflectedDamage: reflectedDamage > 0 ? reflectedDamage : undefined,
    },
    description,
  };
}

/**
 * Execute Skill
 */
function executeSkill(
  battleState: BattleState,
  casterId: 'player' | 'enemy',
  skillId: string,
  targetId: 'player' | 'enemy'
): BattleAction {
  const caster = casterId === 'player' ? battleState.player : battleState.enemy;
  const target = targetId === 'player' ? battleState.player : battleState.enemy;

  const skill = caster.skills.find((s) => s.id === skillId);
  if (!skill) {
    throw new Error(`Skill ${skillId} not found`);
  }

  // Check Cooldown
  if ((caster.cooldowns[skillId] || 0) > 0) {
    throw new Error(`Skill ${skillId} is on cooldown`);
  }

  // Check Cost
  if (skill.cost.mana && (caster.mana || 0) < skill.cost.mana) {
    throw new Error(`Insufficient Mana! Need ${skill.cost.mana} Mana, currently have ${caster.mana || 0}.`);
  }

  // Consume Resources
  if (skill.cost.mana) {
    caster.mana = (caster.mana || 0) - skill.cost.mana;
  }

  // Execute Skill Effects
  let damage = 0;
  let heal = 0;
  let reflectedDamage = 0;
  const buffs: Buff[] = [];
  const debuffs: Debuff[] = [];

  // Damage Calculation (Use unified calcDamage function to ensure consistency with normal attack)
  if (skill.damage) {
    const base = skill.damage.base;
    const multiplier = skill.damage.multiplier;
    const statValue =
      skill.damage.type === 'magical' ? caster.spirit : caster.attack;
    // Calculate skill base attack (for damage calculation)
    const skillAttack = base + statValue * multiplier;

    // Select defense attribute based on damage type
    const targetDefense = skill.damage.type === 'magical' ? target.spirit : target.defense;

    // Use unified damage calculation function
    const baseDamage = calcDamage(skillAttack, targetDefense);

    // Calculate Crit
    let critChance = skill.damage.critChance || 0;
    // Apply Buffs
    caster.buffs.forEach((buff) => {
      if (buff.type === 'crit') {
        critChance += buff.value;
      }
    });
    const isCrit = Math.random() < critChance;

    // Calculate Crit Damage Multiplier (Base 1.5x or skill specified, plus buff bonus)
    let critMultiplier = skill.damage.critMultiplier || 1.5;
    caster.buffs.forEach((buff) => {
      if (buff.critDamage && buff.critDamage > 0) {
        critMultiplier += buff.critDamage;
      }
    });

    // Calculate Base Damage (including Crit)
    damage = isCrit
      ? Math.round(baseDamage * critMultiplier)
      : Math.round(baseDamage);

    // Add random damage variance (0.9-1.1x)
    const randomMultiplier = 0.9 + Math.random() * 0.2; // Random between 0.9-1.1
    damage = Math.round(damage * randomMultiplier);

    // Apply Defense (Preserve special handling logic for skill damage)
    if (skill.damage.type === 'physical') {
      // Physical Damage: If damage > target defense, deal damage; otherwise deal small penetration damage
      if (damage > target.defense) {
        damage = damage - target.defense * 0.5; // Normal reduction
      } else {
        // Damage < Defense, deal small penetration damage
        damage = Math.max(1, Math.round(damage * 0.1));
      }
    } else {
      // Magical Damage: If damage > target spirit, deal damage; otherwise deal small penetration damage
      // Apply Magic Defense Buff
      let effectiveSpirit = target.spirit;
      if (target.buffs.some(buff => buff.magicDefense && buff.magicDefense > 0)) {
        const maxMagicDefense = Math.max(...target.buffs
          .filter(buff => buff.magicDefense && buff.magicDefense > 0)
          .map(buff => buff.magicDefense!));
        effectiveSpirit = Math.floor(target.spirit * (1 + maxMagicDefense));
      }

      if (damage > effectiveSpirit) {
        damage = damage - effectiveSpirit * 0.3; // Normal reduction
      } else {
        // Damage < Spirit, deal small penetration damage
        damage = Math.max(1, Math.round(damage * 0.1));
      }
    }

    // Ensure damage at least 1 (unless fully immune)
    damage = Math.max(1, Math.round(damage));

    // Check Dodge
    let isDodged = false;
    if (target.buffs.some(buff => buff.dodge && buff.dodge > 0)) {
      const maxDodge = Math.max(...target.buffs
        .filter(buff => buff.dodge && buff.dodge > 0)
        .map(buff => buff.dodge!));
      isDodged = Math.random() < maxDodge;
    }

    if (isDodged) {
      return {
        id: randomId(),
        round: battleState.round,
        turn: casterId,
        actor: casterId,
        actionType: 'skill',
        skillId,
        target: targetId,
        result: {
          miss: true,
          manaCost: skill.cost.mana,
        },
        description: generateSkillDescription(skill, caster, target, 0, 0) + ` but was dodged by ${target.name}!`,
      };
    }

    // Check if attacker has Ignore Defense buff
    const hasIgnoreDefense = caster.buffs.some(buff => buff.ignoreDefense);

    // Apply Defense State Reduction (Optimization: Consistent with normal attack, dynamic reduction)
    if (target.isDefending && !hasIgnoreDefense) {
      // Base reduction 50%, if attack >> defense, reduction decreases
      const skillAttackValue = skill.damage.type === 'magical' ? caster.spirit : caster.attack;
      const targetDefenseValue = skill.damage.type === 'magical' ? target.spirit : target.defense;
      const attackDefenseRatio = skillAttackValue / Math.max(1, targetDefenseValue);
      let defenseReduction = 0.5; // Base reduction 50%

      // If Attack > 2x Defense, reduction -> 40%
      if (attackDefenseRatio > 2.0) {
        defenseReduction = 0.4;
      }
      // If Attack > 3x Defense, reduction -> 35%
      else if (attackDefenseRatio > 3.0) {
        defenseReduction = 0.35;
      }
      // If Defense > Attack, reduction -> 60%
      else if (attackDefenseRatio < 1.0) {
        defenseReduction = 0.6;
      }

      damage = Math.round(damage * (1 - defenseReduction));
    } else if (hasIgnoreDefense) {
      // Ignore Defense, deal full damage
      // damage = damage;
    }

    // Apply Damage Reduction Buff
    if (target.buffs.some(buff => buff.damageReduction && buff.damageReduction > 0)) {
      const maxReduction = Math.max(...target.buffs
        .filter(buff => buff.damageReduction && buff.damageReduction > 0)
        .map(buff => buff.damageReduction!));
      damage = Math.round(damage * (1 - maxReduction));
    }

    target.hp = Math.max(0, Math.floor(target.hp - damage));

    // Handle Reflect Damage (if target has reflectDamage buff)
    if (damage > 0 && target.buffs.some(buff => buff.reflectDamage && buff.reflectDamage > 0)) {
      // Find max reflect ratio
      const maxReflectRatio = Math.max(...target.buffs
        .filter(buff => buff.reflectDamage && buff.reflectDamage > 0)
        .map(buff => buff.reflectDamage!));

      if (maxReflectRatio > 0) {
        reflectedDamage = Math.floor(damage * maxReflectRatio);
        caster.hp = Math.max(0, Math.floor(caster.hp - reflectedDamage));
      }
    }
  }

  // Heal Calculation
  if (skill.heal) {
    const base = skill.heal.base;
    const multiplier = skill.heal.multiplier;
    heal = Math.floor(base + caster.maxHp * multiplier);
    caster.hp = Math.min(caster.maxHp, Math.floor(caster.hp + heal));
  }

  // Apply Skill Effects
  skill.effects.forEach((effect) => {
    if (effect.type === 'buff' && effect.buff) {
      const targetUnit = effect.target === 'self' ? caster : target;
      targetUnit.buffs.push({ ...effect.buff });
    }
    if (effect.type === 'debuff' && effect.debuff) {
      const targetUnit = effect.target === 'enemy' ? target : caster;
      // Check Immunity
      const hasImmunity = targetUnit.buffs.some(buff => buff.immunity);
      if (!hasImmunity) {
        targetUnit.debuffs.push({ ...effect.debuff });
      }
    }
  });

  // Set Cooldown
  caster.cooldowns[skillId] = skill.maxCooldown;

  // Generate Description (with reflect info)
  let description = generateSkillDescription(skill, caster, target, damage, heal);
  if (reflectedDamage > 0) {
    if (casterId === 'enemy') {
      description += ` Your reflection dealt ${reflectedDamage} damage to ${caster.name}!`;
    } else {
      description += ` ${target.name}'s reflection dealt ${reflectedDamage} damage to you!`;
    }
  }

  return {
    id: randomId(),
    round: battleState.round,
    turn: casterId,
    actor: casterId,
    actionType: 'skill',
    skillId,
    target: targetId,
    result: {
      damage,
      heal,
      buffs,
      debuffs,
      manaCost: skill.cost.mana,
      reflectedDamage: reflectedDamage > 0 ? reflectedDamage : undefined,
    },
    description,
  };
}

/**
 * Execute Use Advanced Item
 */
function executeAdvancedItem(
  battleState: BattleState,
  itemType: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule',
  itemId: string
): BattleAction {
  const player = battleState.player;
  const enemy = battleState.enemy;

  // Get Advanced Item by Type
  let advancedItem: FoundationTreasure | HeavenEarthEssence | HeavenEarthMarrow | LongevityRule | null = null;
  switch (itemType) {
    case 'foundationTreasure':
      advancedItem = FOUNDATION_TREASURES[itemId];
      break;
    case 'heavenEarthEssence':
      advancedItem = HEAVEN_EARTH_ESSENCES[itemId];
      break;
    case 'heavenEarthMarrow':
      advancedItem = HEAVEN_EARTH_MARROWS[itemId];
      break;
    case 'longevityRule':
      advancedItem = LONGEVITY_RULES[itemId];
      break;
  }

  if (!advancedItem || !advancedItem.battleEffect) {
    throw new Error(`Advanced item ${itemId} not found or has no battle effect`);
  }

  const effect = advancedItem.battleEffect;
  let damage = 0;
  let heal = 0;
  const buffs: Buff[] = [];
  const debuffs: Debuff[] = [];
  let description = '';

  // Check Cooldown (Use cooldown record in battleState)
  const cooldownKey = `advanced_${itemType}_${itemId}`;
  if ((battleState.player.cooldowns[cooldownKey] || 0) > 0) {
    throw new Error(`${advancedItem.name} is on cooldown`);
  }

  // Check Cost
  if (effect.cost.lifespan) {
    // Lifespan cost handled after battle, only recorded here
    // Should be deducted from playerStats after battle
  }
  if (effect.cost.maxHp) {
    const maxHpCost = typeof effect.cost.maxHp === 'number' && effect.cost.maxHp < 1
      ? Math.floor(player.maxHp * effect.cost.maxHp)
      : (effect.cost.maxHp || 0);
    player.maxHp = Math.max(1, player.maxHp - maxHpCost);
    player.hp = Math.min(player.hp, player.maxHp); // Adjust current HP not to exceed Max HP
  }
  if (effect.cost.hp) {
    player.hp = Math.max(1, player.hp - effect.cost.hp);
  }
  if (effect.cost.spirit) {
    player.mana = Math.max(0, (player.mana || 0) - effect.cost.spirit);
  }

  // Apply Effects
  if (effect.type === 'damage' && effect.effect.damage) {
    const dmg = effect.effect.damage;
    let baseDamage = 0;

    if (dmg.base) {
      baseDamage = dmg.base;
    }
    if (dmg.multiplier) {
      baseDamage += player.attack * dmg.multiplier;
    }
    if (dmg.percentOfMaxHp) {
      baseDamage += player.maxHp * dmg.percentOfMaxHp;
    }
    if (dmg.percentOfLifespan) {
      // Lifespan % Damage (Need from playerStats, simplified here)
      baseDamage += player.maxHp * dmg.percentOfLifespan * 0.1; // Simplified: Use 10% of Max HP to represent Lifespan
    }

    // Apply Demon Damage Multiplier (If enemy is Demon type)
    const isDemon = enemy.name.includes('Demon') || enemy.name.includes('Evil') || enemy.name.includes('Ghost') ||
      enemy.name.includes('Monster') || enemy.name.includes('Wraith') || enemy.name.includes('Vile') ||
      enemy.name.includes('Ghoul') || enemy.name.includes('Mutant') || enemy.name.includes('Glowing') ||
      enemy.name.includes('Abomination') || enemy.name.includes('Cursed');
    if (dmg.demonMultiplier && isDemon) {
      baseDamage = Math.floor(baseDamage * dmg.demonMultiplier);
    }

    // Calculate Final Damage
    if (dmg.ignoreDefense) {
      // Support % Ignore Defense (0-1 number) or Full Ignore (true)
      const ignoreRatio = typeof dmg.ignoreDefense === 'number' ? dmg.ignoreDefense : 1;
      const effectiveDefense = enemy.defense * (1 - ignoreRatio);
      damage = Math.floor(Math.max(1, baseDamage - effectiveDefense * 0.5));
    } else {
      damage = Math.floor(Math.max(1, baseDamage - enemy.defense * 0.5));
    }

    // Apply Guaranteed Crit
    let isCrit = false;
    if (dmg.guaranteedCrit) {
      isCrit = true;
      damage = Math.floor(damage * 1.5); // Base Crit Multiplier 1.5
    }

    enemy.hp = Math.max(0, enemy.hp - damage);
    description = `${effect.name}! Dealt ${damage}${isCrit ? ' (Crit)' : ''} damage to ${enemy.name}!`;
  }

  if (effect.type === 'heal' && effect.effect.heal) {
    const healEffect = effect.effect.heal;
    if (healEffect.base) {
      heal = healEffect.base;
    }
    if (healEffect.percentOfMaxHp) {
      heal += Math.floor(player.maxHp * healEffect.percentOfMaxHp);
    }
    player.hp = Math.min(player.maxHp, player.hp + heal);
    description = `${effect.name}! Restored ${heal} HP!`;
  }

  if (effect.type === 'buff' && effect.effect.buff) {
    const buffEffect = effect.effect.buff;
    const buff: Buff = {
      id: `advanced_${itemId}_${Date.now()}`,
      name: effect.name,
      type: 'custom',
      value: 0,
      duration: buffEffect.duration || 3,
      source: advancedItem.name,
      description: effect.description,
    };

    if (buffEffect.attack) {
      player.attack = Math.floor(player.attack * (1 + buffEffect.attack));
    }
    if (buffEffect.defense) {
      player.defense = Math.floor(player.defense * (1 + buffEffect.defense));
    }
    if (buffEffect.speed) {
      player.speed = Math.floor(player.speed * (1 + buffEffect.speed));
    }
    if (buffEffect.critChance) {
      // Crit Chance Bonus recorded via buff
      buff.type = 'crit';
      buff.value = buffEffect.critChance;
    }
    if (buffEffect.critDamage) {
      // Crit Damage Bonus
      buff.critDamage = buffEffect.critDamage;
    }
    if (buffEffect.reflectDamage) {
      // Reflect Damage Ratio
      buff.reflectDamage = buffEffect.reflectDamage;
    }
    if (buffEffect.spirit) {
      // Spirit Bonus
      player.spirit = Math.floor(player.spirit * (1 + buffEffect.spirit));
    }
    if (buffEffect.physique) {
      // Physique Bonus (Physique affects Defense and HP)
      player.defense = Math.floor(player.defense * (1 + buffEffect.physique * 0.5));
      player.maxHp = Math.floor(player.maxHp * (1 + buffEffect.physique * 0.3));
      player.hp = Math.min(player.maxHp, Math.floor(player.hp * (1 + buffEffect.physique * 0.3)));
    }
    if (buffEffect.maxHp) {
      // Max HP Bonus
      const oldMaxHp = player.maxHp;
      player.maxHp = Math.floor(player.maxHp * (1 + buffEffect.maxHp));
      // Increase Current HP proportionally
      const hpRatio = player.hp / oldMaxHp;
      player.hp = Math.floor(player.maxHp * hpRatio);
    }
    if (buffEffect.revive) {
      // Revive Mark
      buff.revive = buffEffect.revive;
    }
    if (buffEffect.dodge !== undefined) {
      // Dodge Rate Bonus
      buff.dodge = buffEffect.dodge;
    }
    if (buffEffect.ignoreDefense) {
      // Attack Ignore Defense
      buff.ignoreDefense = buffEffect.ignoreDefense;
    }
    if (buffEffect.regen) {
      // Regen per turn
      buff.regen = buffEffect.regen;
    }
    if (buffEffect.damageReduction) {
      // Damage Reduction
      buff.damageReduction = buffEffect.damageReduction;
    }
    if (buffEffect.immunity) {
      // Immunity to all Debuffs
      buff.immunity = buffEffect.immunity;
    }
    if (buffEffect.cleanse) {
      // Cleanse all Debuffs
      player.debuffs = [];
    }
    if (buffEffect.magicDefense) {
      // Magic Defense Bonus (Affects Spirit Defense)
      buff.magicDefense = buffEffect.magicDefense;
    }

    player.buffs.push(buff);
    buffs.push(buff);
    description = `${effect.name}! Gained powerful buff effects!`;
  }

  if (effect.type === 'debuff' && effect.effect.debuff) {
    const debuffEffect = effect.effect.debuff;
    const debuff: Debuff = {
      id: `advanced_${itemId}_debuff_${Date.now()}`,
      name: effect.name,
      type: 'weakness',
      value: 0,
      duration: debuffEffect.duration || 3,
      source: advancedItem.name,
      description: effect.description,
    };

    if (debuffEffect.attack) {
      enemy.attack = Math.floor(enemy.attack * (1 - debuffEffect.attack));
    }
    if (debuffEffect.defense) {
      enemy.defense = Math.floor(enemy.defense * (1 - debuffEffect.defense));
    }
    if (debuffEffect.speed) {
      enemy.speed = Math.floor(enemy.speed * (1 + debuffEffect.speed)); // speed is negative (reduction), so use addition (to reduce)
    }
    if (debuffEffect.spirit) {
      enemy.spirit = Math.floor(enemy.spirit * (1 + debuffEffect.spirit)); // spirit is negative (reduction), so use addition
    }
    if (debuffEffect.hp) {
      // DoT (Negative value means loss)
      debuff.type = 'poison'; // Use poison type for DoT
      debuff.value = debuffEffect.hp; // Store percentage value
    }

    // Check Immunity
    const hasImmunity = enemy.buffs.some(buff => buff.immunity);
    if (!hasImmunity) {
      enemy.debuffs.push(debuff);
      debuffs.push(debuff);
      description = `${effect.name}! ${enemy.name} was weakened!`;
    } else {
      description = `${effect.name}! But ${enemy.name} is immune to debuffs!`;
    }
  }

  // Set Cooldown
  if (effect.cooldown) {
    battleState.player.cooldowns[cooldownKey] = effect.cooldown;
  }

  return {
    id: randomId(),
    round: battleState.round,
    turn: 'player',
    actor: 'player',
    actionType: 'skill', // Use skill type, as advanced item effect is similar to skill
    result: {
      damage,
      heal,
      buffs,
      debuffs,
    },
    description,
  };
}

/**
 * Execute Use Item
 */
function executeItem(battleState: BattleState, itemId: string): BattleAction {
  const player = battleState.player;

  // Find item in player inventory
  const item = battleState.playerInventory.find((i) => i.id === itemId);
  if (!item) {
    throw new Error(`Item ${itemId} not found in inventory`);
  }

  // Find potion config (match by item name)
  const potionConfig = Object.values(BATTLE_POTIONS).find(
    (p) => p.name === item.name
  );
  if (!potionConfig) {
    throw new Error(`Potion config for ${item.name} not found`);
  }

  let heal = 0;
  
  if (potionConfig.type === 'heal' && potionConfig.effect.heal) {
    heal = Math.floor(potionConfig.effect.heal);
    player.hp = Math.min(player.maxHp, Math.floor(player.hp + heal));
  }

  if (potionConfig.type === 'buff' && potionConfig.effect.buffs) {
    potionConfig.effect.buffs.forEach((buff) => {
      player.buffs.push({ ...buff });
    });
  }

  // Consume item (decrease quantity)
  const itemIndex = battleState.playerInventory.findIndex((i) => i.id === itemId);
  if (itemIndex >= 0) {
    battleState.playerInventory[itemIndex] = {
      ...battleState.playerInventory[itemIndex],
      quantity: battleState.playerInventory[itemIndex].quantity - 1,
    };
  }

  return {
    id: randomId(),
    round: battleState.round,
    turn: 'player',
    actor: 'player',
    actionType: 'item',
    itemId,
    result: {
      heal,
      buffs: potionConfig.effect.buffs || [],
    },
    description: `You used ${potionConfig.name}, ${heal > 0 ? `recovered ${heal} HP.` : 'gained buffs.'}`,
  };
}

/**
 * Execute Defend
 */
function executeDefend(
  battleState: BattleState,
  unitId: 'player' | 'enemy'
): BattleAction {
  const unit = unitId === 'player' ? battleState.player : battleState.enemy;
  unit.isDefending = true;

  return {
    id: randomId(),
    round: battleState.round,
    turn: unitId,
    actor: unitId,
    actionType: 'defend',
    result: {},
    description:
      unitId === 'player'
        ? 'You entered defensive stance, taking 50% less damage next turn.'
        : `${unit.name} entered defensive stance.`,
  };
}

/**
 * Execute Flee
 */
function executeFlee(battleState: BattleState): BattleAction {
  // Flee success rate based on speed difference
  const playerSpeed = Number(battleState.player.speed) || 0;
  const enemySpeed = Number(battleState.enemy.speed) || 0;
  const speedDiff = playerSpeed - enemySpeed;
  const fleeChance = 0.3 + Math.min(0.5, speedDiff / 100);
  const success = Math.random() < Math.max(0, Math.min(1, fleeChance)); // Ensure probability is between 0-1

  return {
    id: randomId(),
    round: battleState.round,
    turn: 'player',
    actor: 'player',
    actionType: 'flee',
    result: {},
    description: success
      ? 'You successfully fled the battle.'
      : 'You tried to flee, but were intercepted by the enemy.',
  };
}

/**
 * Update Battle State (Handle ongoing effects, cooldowns, etc.)
 */
function updateBattleStateAfterAction(
  battleState: BattleState,
  _action: BattleAction
): BattleState {
  // Deep copy player and enemy state to ensure immutability
  const newState: BattleState = {
    ...battleState,
    player: {
      ...battleState.player,
      buffs: battleState.player.buffs.map(b => ({ ...b })),
      debuffs: battleState.player.debuffs.map(d => ({ ...d })),
      cooldowns: { ...battleState.player.cooldowns },
    },
    enemy: {
      ...battleState.enemy,
      buffs: battleState.enemy.buffs.map(b => ({ ...b })),
      debuffs: battleState.enemy.debuffs.map(d => ({ ...d })),
      cooldowns: { ...battleState.enemy.cooldowns },
    },
  };

  // Handle Ongoing Effects
  [newState.player, newState.enemy].forEach((unit) => {
    // Handle Debuffs (DoT)
    unit.debuffs = unit.debuffs
      .map((debuff) => {
        if (debuff.type === 'poison' || debuff.type === 'burn') {
          // If % HP loss (value is negative percentage)
          if (debuff.value < 0 && debuff.value > -1) {
            const hpLoss = Math.floor(unit.maxHp * Math.abs(debuff.value));
            unit.hp = Math.max(0, Math.floor(unit.hp - hpLoss));
          } else {
            // Fixed value HP loss
            const debuffValue = Math.floor(debuff.value);
            unit.hp = Math.max(0, Math.floor(unit.hp - debuffValue));
          }
        }
        return { ...debuff, duration: debuff.duration - 1 };
      })
      .filter((debuff) => debuff.duration > 0);

    // Handle Buffs (HoT, etc.)
    unit.buffs = unit.buffs
      .map((buff) => {
        if (buff.type === 'heal' && buff.duration > 0) {
          const healValue = Math.floor(buff.value);
          unit.hp = Math.min(unit.maxHp, Math.floor(unit.hp + healValue));
        }
        // Handle Regen
        if (buff.regen && buff.regen > 0 && buff.duration > 0) {
          const regenValue = Math.floor(unit.maxHp * buff.regen);
          unit.hp = Math.min(unit.maxHp, Math.floor(unit.hp + regenValue));
        }
        return { ...buff, duration: buff.duration === -1 ? -1 : buff.duration - 1 };
      })
      .filter((buff) => buff.duration === -1 || buff.duration > 0);

    // Update Cooldowns
    Object.keys(unit.cooldowns).forEach((skillId) => {
      if (unit.cooldowns[skillId] > 0) {
        unit.cooldowns[skillId] -= 1;
      }
    });

    // Reset Defense State
    unit.isDefending = false;
  });

  return newState;
}

/**
 * Check Battle End
 */
export function checkBattleEnd(battleState: BattleState): boolean {
  return battleState.player.hp <= 0 || battleState.enemy.hp <= 0;
}

/**
 * Generate Skill Description
 */
function generateSkillDescription(
  skill: BattleSkill,
  caster: BattleUnit,
  target: BattleUnit,
  damage: number,
  heal: number
): string {
  if (damage > 0) {
    return `You used [${skill.name}], dealing ${damage} damage to ${target.name}.`;
  }
  if (heal > 0) {
    return `You used [${skill.name}], restoring ${heal} HP.`;
  }
  return `You used [${skill.name}].`;
}

/**
 * Execute Pet Action
 */
function executePetAction(battleState: BattleState): BattleAction | null {
  if (!battleState.activePet || battleState.enemy.hp <= 0) {
    return null;
  }

  const activePet = battleState.activePet;
  const petSkillCooldowns = battleState.petSkillCooldowns || {};

  // Determine Pet Action: Dynamically adjust skill chance based on affection and level
  // Base chance 30%, +2% per 10 affection, +1% per 10 levels, max 70%
  const baseProbability = 0.3;
  const petAffection = Number(activePet.affection) || 0; // Ensure valid number
  const petLevel = Number(activePet.level) || 0; // Ensure valid number
  const affectionBonus = (petAffection / 100) * 0.2; // Affection bonus, max 20%
  const levelBonus = (petLevel / 100) * 0.1; // Level bonus, max 10%
  const skillProbability = Math.min(0.7, baseProbability + affectionBonus + levelBonus);
  const useSkill = Math.random() < skillProbability;
  let petAction: 'attack' | 'skill' | null = null;
  let usedSkill: PetSkill | null = null;

  if (useSkill && activePet.skills.length > 0) {
    // Find available skills (cooldown is 0 or unset)
    const availableSkills = activePet.skills.filter(
      (skill) => !petSkillCooldowns[skill.id] || petSkillCooldowns[skill.id] <= 0
    );

    if (availableSkills.length > 0) {
      usedSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
      petAction = 'skill';
    } else {
      petAction = 'attack';
    }
  } else {
    petAction = 'attack';
  }

  if (petAction === 'skill' && usedSkill) {
    // Cast Skill
    let petDamage = 0;
    let petHeal = 0;
    let petBuff: { attack?: number; defense?: number; hp?: number } | undefined;

    if (usedSkill.effect.damage) {
      // Skill Damage: Base Damage + Pet Attack Bonus + Level Bonus
      const baseSkillDamage = Number(usedSkill.effect.damage) || 0;
      // Increase attack multiplier based on evolution stage
      const evolutionStage = Number(activePet.evolutionStage) || 0;
      const petLevel = Number(activePet.level) || 0;
      const petAffection = Number(activePet.affection) || 0;
      const petAttack = Number(activePet.stats?.attack) || 0;
      const evolutionMultiplier = 1.0 + evolutionStage * 0.5;
      const attackMultiplier = 1.0 + (petLevel / 50); // +100% Attack per 50 levels
      // Attack bonus increased from 30% to 100%, applying evolution multiplier
      const attackBonus = Math.floor(petAttack * evolutionMultiplier * attackMultiplier * 1.0); // 100% Attack Bonus
      const levelBonus = Math.floor(petLevel * 5); // +5 Damage per level (increased from 2)
      const affectionBonus = Math.floor(petAffection * 0.8); // Affection also boosts skill damage
      const skillDamage = baseSkillDamage + attackBonus + levelBonus + affectionBonus;
      petDamage = calcDamage(skillDamage, battleState.enemy.defense);
      battleState.enemy.hp = Math.max(0, Math.floor((Number(battleState.enemy.hp) || 0) - petDamage));
    }

    if (usedSkill.effect.heal) {
      // Heal Player
      const baseHeal = Number(usedSkill.effect.heal) || 0;
      const petLevel = Number(activePet.level) || 0;
      const petAffection = Number(activePet.affection) || 0;
      petHeal = Math.floor(
        baseHeal * (1 + petLevel * 0.05) * (1 + petAffection / 200)
      );
      const maxHp = Number(battleState.player.maxHp) || 0;
      const currentHp = Number(battleState.player.hp) || 0;
      battleState.player.hp = Math.min(maxHp, Math.floor(currentHp + petHeal));
    }

    if (usedSkill.effect.buff) {
      petBuff = usedSkill.effect.buff;
      // Apply Buff to Player
      if (petBuff.attack) {
        battleState.player.buffs.push({
          id: randomId(),
          name: `${activePet.name}'s Attack Buff`,
          type: 'attack',
          value: petBuff.attack,
          duration: 3, // Default 3 turns
          source: `pet_${activePet.id}`,
        });
      }
      if (petBuff.defense) {
        battleState.player.buffs.push({
          id: randomId(),
          name: `${activePet.name}'s Defense Buff`,
          type: 'defense',
          value: petBuff.defense,
          duration: 3,
          source: `pet_${activePet.id}`,
        });
      }
      if (petBuff.hp) {
        const hpBuff = Math.floor(petBuff.hp);
        battleState.player.maxHp = Math.floor(battleState.player.maxHp + hpBuff);
        battleState.player.hp = Math.floor(battleState.player.hp + hpBuff);
      }
    }

    // Set Skill Cooldown
    if (usedSkill.cooldown) {
      const updatedCooldowns = { ...petSkillCooldowns };
      updatedCooldowns[usedSkill.id] = usedSkill.cooldown;
      battleState.petSkillCooldowns = updatedCooldowns;
    }

    // Build Skill Description
    let skillDesc = `[${activePet.name}] cast [${usedSkill.name}]!`;
    if (petDamage > 0) {
      skillDesc += ` dealing ${petDamage} damage to enemy.`;
    }
    if (petHeal > 0) {
      skillDesc += ` restoring ${petHeal} HP to you.`;
    }
    if (petBuff) {
      const buffParts: string[] = [];
      if (petBuff.attack) buffParts.push(`Attack +${petBuff.attack}`);
      if (petBuff.defense) buffParts.push(`Defense +${petBuff.defense}`);
      if (petBuff.hp) buffParts.push(`HP +${petBuff.hp}`);
      if (buffParts.length > 0) {
        skillDesc += ` You gained buffs: ${buffParts.join(', ')}.`;
      }
    }

    return {
      id: randomId(),
      round: battleState.round,
      turn: 'player',
      actor: 'player',
      actionType: 'skill',
      skillId: usedSkill.id,
      target: 'enemy',
      result: {
        damage: petDamage,
        heal: petHeal,
        buffs: petBuff ? [
          ...(petBuff.attack ? [{
            id: randomId(),
            name: `${activePet.name}'s Attack Buff`,
            type: 'attack' as const,
            value: petBuff.attack,
            duration: 3,
            source: `pet_${activePet.id}`,
          }] : []),
          ...(petBuff.defense ? [{
            id: randomId(),
            name: `${activePet.name}'s Defense Buff`,
            type: 'defense' as const,
            value: petBuff.defense,
            duration: 3,
            source: `pet_${activePet.id}`,
          }] : []),
        ] : [],
      },
      description: skillDesc,
    };
  } else {
    // Normal Attack: Base Attack + Attack % Bonus + Level Bonus + Affection Bonus
    const baseAttack = Number(activePet.stats?.attack) || 0;
    // Increase attack multiplier based on evolution stage (Infant 1.0, Mature 1.5, Perfect 2.0)
    const evolutionStage = Number(activePet.evolutionStage) || 0;
    const petLevel = Number(activePet.level) || 0;
    const petAffection = Number(activePet.affection) || 0;
    const evolutionMultiplier = 1.0 + evolutionStage * 0.5;
    const attackMultiplier = 1.0 + (petLevel / 50); // +100% Attack per 50 levels
    const levelBonus = Math.floor(petLevel * 8); // +8 Damage per level (increased from 3)
    const affectionBonus = Math.floor(petAffection * 1.5); // Affection bonus (increased from 0.5 to 1.5)
    // Final Attack = (Base * Evo * Level Multi) + Level Bonus + Affection Bonus
    const petAttackDamage = Math.floor(baseAttack * evolutionMultiplier * attackMultiplier) + levelBonus + affectionBonus;
    const petDamage = calcDamage(petAttackDamage, battleState.enemy.defense);
    battleState.enemy.hp = Math.max(0, Math.floor((Number(battleState.enemy.hp) || 0) - petDamage));

    return {
      id: randomId(),
      round: battleState.round,
      turn: 'player',
      actor: 'player',
      actionType: 'attack',
      target: 'enemy',
      result: {
        damage: petDamage,
      },
      description: `[${activePet.name}] followed up with an attack, dealing ${petDamage} damage.`,
    };
  }
}
