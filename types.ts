export enum RealmType {
  QiRefining = 'Scavenger',
  Foundation = 'Wastelander',
  GoldenCore = 'Mutant',
  NascentSoul = 'Evolved',
  SpiritSevering = 'Apex',
  DaoCombining = 'Transcendent',
  LongevityRealm = 'Immortal',
}

export type ArtGrade = 'S' | 'A' | 'B' | 'C'; // Rank: Super, Advanced, Basic, Common

export interface CultivationArt {
  id: string;
  name: string;
  type: 'mental' | 'body'; // Mental (Protocol) for Exp rate, Body (Augmentation) for permanent stats
  description: string;
  grade: ArtGrade; // Protocol Grade
  realmRequirement: RealmType;
  cost: number;
  sectId?: string | null; // Faction ID, null means universal protocol
  spiritualRoot?: 'metal' | 'wood' | 'water' | 'fire' | 'earth'; // Corresponding attribute type (optional)
  isHeavenEarthSoulArt?: boolean; // Is Heaven Earth Soul Protocol
  bossId?: string; // Corresponding Heaven Earth Soul Boss ID
  attributeRequirements?: {
    // Attribute requirements
    attack?: number;
    defense?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
  };
  effects: {
    attack?: number;
    defense?: number;
    hp?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    expRate?: number; // e.g., 0.1 for +10% exp from meditation
    // Percentage effect (Protocol usage, 0.15 means 15% increase)
    attackPercent?: number;
    defensePercent?: number;
    hpPercent?: number;
    spiritPercent?: number;
    physiquePercent?: number;
    speedPercent?: number;
  };
}

export enum ItemType {
  Herb = 'Plant',
  Pill = 'Chem',
  Material = 'Material',
  Artifact = 'Relic',
  Weapon = 'Weapon',
  Armor = 'Armor',
  Accessory = 'Accessory',
  Ring = 'Ring',
  Recipe = 'Blueprint',
  AdvancedItem = 'Advanced Tech',
}

export type ItemRarity =
  | 'Common'
  | 'Rare'
  | 'Legendary'
  | 'Mythic';

export type RiskLevel =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Extreme';

// Equipment Slot Enum
export enum EquipmentSlot {
  Head = 'Head',
  Shoulder = 'Shoulder',
  Chest = 'Chest',
  Gloves = 'Gloves',
  Legs = 'Legs',
  Boots = 'Boots',
  Ring1 = 'Ring 1',
  Ring2 = 'Ring 2',
  Ring3 = 'Ring 3',
  Ring4 = 'Ring 4',
  Accessory1 = 'Accessory 1',
  Accessory2 = 'Accessory 2',
  Artifact1 = 'Relic 1',
  Artifact2 = 'Relic 2',
  Weapon = 'Weapon',
}

export interface Item {
  id: string;
  name: string;
  type: ItemType | 'Material';
  description: string;
  quantity: number;
  rarity?: ItemRarity; // Defaults to 'Common' if undefined
  level?: number; // Upgrade level, defaults to 0
  isEquippable?: boolean;
  equipmentSlot?: EquipmentSlot; // Equipment Slot
  isNatal?: boolean; // Is Natal Artifact
  recipeData?: Recipe; // Recipe data (only used when type is Recipe)
  reviveChances?: number; // Revive chances (1-3), only available for Legendary/Mythic gear
  battleSkills?: BattleSkill[]; // Combat skills (Artifact/Weapon)
  advancedItemType?: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule'; // Advanced item type (only used when type is AdvancedItem)
  advancedItemId?: string; // Advanced item ID (for refining)
  effect?: {
    hp?: number;
    exp?: number;
    attack?: number;
    defense?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    lifespan?: number; // Increase lifespan
  };
  permanentEffect?: {
    // Permanently increased stats (permanently added after using item)
    attack?: number;
    defense?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    maxHp?: number;
    maxLifespan?: number; // Increase max lifespan
    spiritualRoots?: {
      // Improve spiritual roots
      metal?: number;
      wood?: number;
      water?: number;
      fire?: number;
      earth?: number;
    };
  };
}


import { SectRank as SectRankValue } from './constants/ranks';

export const SectRank = SectRankValue;
export type SectRank = typeof SectRankValue[keyof typeof SectRankValue];

export interface SecretRealm {
  id: string;
  name: string;
  description: string;
  minRealm: RealmType;
  cost: number; // Spirit stones to enter
  riskLevel: RiskLevel;
  drops: string[]; // Description of potential drops
  banner?: string; // Banner image URL
  thumbnail?: string; // Thumbnail image URL
}

// Character system extension
export interface Talent {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  effects: {
    attack?: number;
    defense?: number;
    hp?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    expRate?: number;
    luck?: number; // Luck value, affects random encounters and drops
  };
}

export interface Title {
  id: string;
  name: string;
  description: string;
  requirement: string;
  category?: 'cultivation' | 'combat' | 'exploration' | 'collection' | 'special'; // Title category
  rarity?: ItemRarity; // Title rarity
  setGroup?: string; // Set group name (e.g., "warrior", "scholar", etc.), titles in the same group can trigger set effects
  effects: {
    attack?: number;
    defense?: number;
    hp?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    expRate?: number;
    luck?: number;
  };
}

// Title Set Effect
export interface TitleSetEffect {
  setName: string; // Set name
  titles: string[]; // List of title IDs to wear
  effects: {
    attack?: number;
    defense?: number;
    hp?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    expRate?: number;
    luck?: number;
  };
  description: string; // Set effect description
}

export interface PlayerStats {
  id?: string;
  name: string;
  realm: RealmType;
  realmLevel: number; // 1-9
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  attack: number; // Attack
  defense: number; // Defense
  spirit: number; // Spirit (Affects spell power and perception)
  physique: number; // Physique (Affects HP max and physical resistance)
  speed: number; // Speed (Affects turn order and dodge)
  spiritStones: number;
  inventory: Item[];
  cultivationArts: string[]; // IDs of learned arts
  unlockedArts: string[]; // IDs of unlocked arts (obtained through adventures, can be learned)
  activeArtId: string | null; // ID of the currently active Mental Art
  equippedItems: Partial<Record<EquipmentSlot, string>>; // Mapping: Slot -> Item ID
  sectId: string | null;
  sectRank: SectRank;
  sectContribution: number;
  currentSectInfo?: {
    // Current faction info (for randomly generated factions)
    id: string;
    name: string;
    exitCost?: {
      spiritStones?: number;
      items?: { name: string; quantity: number }[];
    };
  };
  betrayedSects: string[]; // List of betrayed faction IDs
  sectHuntEndTime: number | null; // Faction hunt end timestamp (ms), null means not hunted
  sectHuntLevel: number; // Hunt intensity level (0=Candidate, 1=Member, 2=Elite, 3=Leader), increases after killing enemy
  sectHuntSectId: string | null; // ID of the faction hunting the player
  sectHuntSectName: string | null; // Name of the faction hunting the player
  sectMasterId: string | null; // Current faction leader ID (if player is leader, it's player's ID)
  // Character system extensions
  talentId: string | null; // Talent ID (randomly generated at start, cannot be modified later)
  titleId: string | null; // Current equipped title ID
  unlockedTitles: string[]; // List of unlocked title IDs
  attributePoints: number; // Allocatable attribute points
  luck: number; // Luck value
  // Achievement system
  achievements: string[]; // Completed achievement IDs
  // Pet system
  pets: Pet[]; // Owned pets
  activePetId: string | null; // Current active pet ID
  // Lottery system
  lotteryTickets: number; // Lottery tickets
  lotteryCount: number; // Cumulative lottery count (for pity)
  // Inheritance system (Only boundary breakthrough function kept)
  inheritanceLevel: number; // Inheritance level (0-4, each inheritance can break through 1-4 realms)
  // Daily task system
  dailyTaskCount: Record<string, number>; // Record daily completion count by task ID, max 3 times per task per day
  lastTaskResetDate: string; // Date of last task reset (YYYY-MM-DD)
  lastCompletedTaskType?: string; // Last completed task type (for streak bonus)
  // Achievement system extension
  viewedAchievements: string[]; // Viewed achievement IDs (for badge display)
  // Natal Artifact system
  natalArtifactId: string | null; // Natal Artifact ID
  // Recipe system
  unlockedRecipes: string[]; // List of unlocked recipe names
  // Meditation HP regen boost
  meditationHpRegenMultiplier: number; // Meditation HP regen multiplier (default 1.0, increases during meditation)
  meditationBoostEndTime: number | null; // Meditation boost end timestamp (ms)
  // Achievement stats system
  statistics: {
    killCount: number; // Kill count
    meditateCount: number; // Meditation count
    adventureCount: number; // Adventure count
    equipCount: number; // Equipment count
    petCount: number; // Pet count
    recipeCount: number; // Recipe count
    artCount: number; // Protocol count
    breakthroughCount: number; // Breakthrough count
    secretRealmCount: number; // Secret realm entry count
    alchemyCount?: number; // Chem synthesis count
  };
  // Lifespan system
  lifespan: number; // Current lifespan
  maxLifespan: number; // Max lifespan
  // Spiritual Root system
  spiritualRoots: {
    metal: number; // Metal (0-100)
    wood: number; // Wood (0-100)
    water: number; // Water (0-100)
    fire: number; // Fire (0-100)
    earth: number; // Earth (0-100)
  };
  // Daily Quest system
  dailyQuests: DailyQuest[]; // Current daily quests
  dailyQuestProgress: Record<string, number>; // Task ID -> Progress
  dailyQuestCompleted: string[]; // Today's completed task IDs
  lastDailyQuestResetDate: string; // Last daily quest reset date (YYYY-MM-DD)
  gameDays: number; // In-game days
  playTime: number; // Total play time (ms)

  // New Cultivation system fields
  foundationTreasure?: string; // Foundation treasure ID
  goldenCoreMethodCount?: number; // Golden Core methods
  heavenEarthEssence?: string; // Heaven Earth Essence ID
  heavenEarthMarrow?: string; // Heaven Earth Marrow ID
  marrowRefiningProgress?: number; // Refining progress (0-100)
  marrowRefiningSpeed?: number; // Refining speed (per day)
  daoCombiningChallenged?: boolean; // Whether Heaven Earth Soul boss challenged
  longevityRules?: string[]; // Longevity rules list
  maxLongevityRules?: number; // Max longevity rules (default 3)
  // Reputation system
  reputation: number; // Reputation (for unlocking shops, etc.)
  // Grotto system
  grotto: {
    level: number; // Base level (0 means not owned, 1-10)
    expRateBonus: number; // Reactor XP bonus (0-1, e.g., 0.2 for 20%)
    autoHarvest: boolean; // Auto-gather toggle
    growthSpeedBonus: number; // Growth rate bonus (0-0.5, e.g., 0.2 for 20% reduction)
    plantedHerbs: Array<{
      herbId: string; // Plant ID
      herbName: string; // Plant Name
      plantTime: number; // Plant timestamp
      harvestTime: number; // Gather timestamp
      quantity: number; // Gather quantity
      isMutated?: boolean; // Is mutated
      mutationBonus?: number; // Mutation bonus (1.5-3.0)
    }>; // Planted supplies list
    lastHarvestTime: number | null; // Last gather time (for auto-gather calculation)
    spiritArrayEnhancement: number; // Reactor spec bonus (extra XP rate, 0-1)
    herbarium: string[]; // Collected supply index (names)
    dailySpeedupCount: number; // Daily speedup count
    lastSpeedupResetDate: string; // Last speedup reset date (YYYY-MM-DD)
  };
  // Faction Vault system
  sectTreasureVault?: {
    items: Item[]; // Items in vault
    takenItemIds: string[]; // Taken item IDs
  };
}

// Foundation Treasure interface
export interface FoundationTreasure {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  effects: {
    hpBonus?: number;
    attackBonus?: number;
    defenseBonus?: number;
    spiritBonus?: number;
    physiqueBonus?: number;
    speedBonus?: number;
    specialEffect?: string;
  };
  requiredLevel?: number;
  battleEffect?: AdvancedItemBattleEffect; // Combat effect
}

// Heaven Earth Essence interface
export interface HeavenEarthEssence {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  quality: number; // Quality (1-100)
  effects: {
    hpBonus?: number;
    attackBonus?: number;
    defenseBonus?: number;
    spiritBonus?: number;
    physiqueBonus?: number;
    speedBonus?: number;
    specialEffect?: string;
  };
  battleEffect?: AdvancedItemBattleEffect; // Combat effect
}

// Heaven Earth Marrow interface
export interface HeavenEarthMarrow {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  quality: number; // Quality (1-100)
  refiningTime: number; // Base refining time (days)
  effects: {
    hpBonus?: number;
    attackBonus?: number;
    defenseBonus?: number;
    spiritBonus?: number;
    physiqueBonus?: number;
    speedBonus?: number;
    specialEffect?: string;
  };
  battleEffect?: AdvancedItemBattleEffect; // Combat effect
}

// Longevity Rule interface
export interface LongevityRule {
  id: string;
  name: string;
  description: string;
  power: number; // Rule power (1-100)
  effects: {
    hpPercent?: number;
    attackPercent?: number;
    defensePercent?: number;
    spiritPercent?: number;
    physiquePercent?: number;
    speedPercent?: number;
    specialEffect?: string;
  };
  battleEffect?: AdvancedItemBattleEffect; // Combat effect
}

// Advanced item battle effect type
export interface AdvancedItemBattleEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'special';
  name: string; // Effect name
  description: string; // Effect description
  cost: {
    lifespan?: number; // Consumes lifespan (years)
    maxHp?: number; // Consumes max HP
    hp?: number; // Consumes current HP
    spirit?: number; // Consumes spirit
  };
  effect: {
    // Damage effect
    damage?: {
      base?: number; // Base damage
      multiplier?: number; // Damage multiplier (based on attack)
      percentOfMaxHp?: number; // Percentage damage based on max HP
      percentOfLifespan?: number; // Percentage damage based on lifespan
      ignoreDefense?: number | boolean; // Ignore defense ratio (0-1, or true for total ignore)
      guaranteedCrit?: boolean; // Guaranteed critical hit
      guaranteedHit?: boolean; // Guaranteed hit (ignore dodge)
      demonMultiplier?: number; // Damage multiplier against demons
    };
    // Healing effect
    heal?: {
      base?: number; // Base healing
      percentOfMaxHp?: number; // Percentage healing based on max HP
    };
    // Buff effect
    buff?: {
      attack?: number; // Attack bonus
      defense?: number; // Defense bonus
      speed?: number; // Speed bonus
      critChance?: number; // Critical hit chance bonus
      critDamage?: number; // Critical hit damage bonus
      reflectDamage?: number; // Reflected damage ratio
      spirit?: number; // Spirit bonus
      physique?: number; // Physique bonus
      maxHp?: number; // Max HP bonus (percentage)
      revive?: number; // Revive marker (1 means has revive)
      dodge?: number; // Dodge rate bonus
      ignoreDefense?: boolean; // Attack ignores defense
      regen?: number; // Percentage of max HP restored per turn
      damageReduction?: number; // Damage reduction ratio
      immunity?: boolean; // Immune to all negative statuses
      cleanse?: boolean; // Cleanse all negative statuses
      magicDefense?: number; // Magic defense bonus
      duration?: number; // Duration in turns
    };
    // Debuff effect (on enemy)
    debuff?: {
      attack?: number; // Reduce attack (negative value indicates reduction)
      defense?: number; // Reduce defense (negative value indicates reduction)
      speed?: number; // Reduce speed (negative value indicates reduction)
      spirit?: number; // Reduce spirit (negative value indicates reduction)
      hp?: number; // Percentage of max HP lost per turn (negative value indicates loss)
      duration?: number; // Duration in turns
    };
    // Special effects
    special?: {
      type: 'instant_kill' | 'stun' | 'silence' | 'reflect' | 'absorb';
      value?: number; // Effect value
      chance?: number; // Trigger chance (0-1)
    };
  };
  cooldown?: number; // Cooldown turns (in-battle)
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'normal' | 'gain' | 'danger' | 'special';
  timestamp: number;
}

export type AdventureType = 'normal' | 'lucky' | 'secret_realm' | 'sect_challenge' | 'dao_combining_challenge';

export interface AdventureItemData {
  name: string;
  type: string; // "Herb" | "Material" | "Magic Treasure" | "Weapon" | "Armor" | "Accessory" | "Ring" | "Advanced Item"
  description: string;
  rarity?: string;
  isEquippable?: boolean;
  equipmentSlot?: string; // "Head" | "Shoulder" | "Chest" | "Gloves" | "Pants" | "Shoes" | "Ring1-4" | "Accessory1-2" | "Magic Treasure1-2" | "Weapon"
  level?: number;
  advancedItemType?: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule'; // Advanced item type (only used when type is "Advanced Item")
  advancedItemId?: string; // Advanced item ID (for refining)
  recipeName?: string; // For recipe items
  reviveChances?: number; // For legendary/mythic items
  effect?: {
    attack?: number;
    defense?: number;
    hp?: number;
    exp?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    lifespan?: number;
  };
  permanentEffect?: {
    // Permanently increased attributes
    attack?: number;
    defense?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    maxHp?: number;
    maxLifespan?: number;
    spiritualRoots?: {
      metal?: number;
      wood?: number;
      water?: number;
      fire?: number;
      earth?: number;
    };
  };
}

export interface AdventureResult {
  story: string;
  hpChange: number;
  expChange: number;
  spiritStonesChange: number;
  lotteryTicketsChange?: number; // Lottery tickets change
  inheritanceLevelChange?: number; // Inheritance level change (1-4, indicates the number of realms that can be broken through)
  lifespanChange?: number; // Lifespan change (positive for increase, negative for decrease)
  reputationChange?: number; // Reputation change (positive for increase, negative for decrease)
  reputationEvent?: {
    // Reputation event (requires player choice)
    title: string; // Event title
    description: string; // Event description
    text?: string; // Compatibility field: AI occasionally returns text instead of title/description
    choices: Array<{
      text: string; // Choice text
      reputationChange: number; // Reputation change
      description?: string; // Description after choice
      hpChange?: number; // Potential HP change
      expChange?: number; // Potential EXP change
      spiritStonesChange?: number; // Potential spirit stones change
    }>;
  };
  attributeReduction?: {
    // Attribute reduction (when encountering traps, evil cultivators, or other dangerous events)
    attack?: number;
    defense?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    maxHp?: number;
  };
  spiritualRootsChange?: {
    // Spiritual roots change
    metal?: number;
    wood?: number;
    water?: number;
    fire?: number;
    earth?: number;
  };
  triggerSecretRealm?: boolean; // Whether to trigger a random secret realm
  longevityRuleObtained?: string; // Obtained rule power ID
  heavenEarthSoulEncounter?: string; // Encountered Heaven Earth Soul BOSS ID
  adventureType?: AdventureType; // Adventure type (used to determine if combat needs to be triggered, etc.)
  itemObtained?: AdventureItemData;
  itemsObtained?: Array<AdventureItemData>;

  petObtained?: string; // Obtained pet template ID (e.g., "pet-spirit-fox")

  petOpportunity?: {
    // Pet Opportunity
    type: 'evolution' | 'level' | 'stats' | 'exp'; // Opportunity type
    petId?: string; // Affected pet ID (optional, random if empty)
    levelGain?: number;
    expGain?: number;
    statsBoost?: {
      attack?: number;
      defense?: number;
      hp?: number;
      speed?: number;
    };
  };

  eventColor?: 'normal' | 'gain' | 'danger' | 'special';
  isLucky?: boolean; // Added isLucky field
}

export interface Recipe {
  name: string;
  cost: number;
  ingredients: { name: string; qty: number }[];
  result: {
    name: string;
    type: ItemType;
    description: string;
    rarity: ItemRarity;
    effect?: {
      hp?: number;
      exp?: number;
      attack?: number;
      defense?: number;
      spirit?: number;
      physique?: number;
      speed?: number;
      lifespan?: number;
    };
    permanentEffect?: {
      attack?: number;
      defense?: number;
      spirit?: number;
      physique?: number;
      speed?: number;
      maxHp?: number;
      maxLifespan?: number;
      spiritualRoots?: {
        metal?: number;
        wood?: number;
        water?: number;
        fire?: number;
        earth?: number;
      };
    };
  };
}

// Encounter system
export interface EncounterEvent {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  triggerChance: number; // Trigger chance (0-1)
  minRealm?: RealmType; // Minimum realm requirement
  rewards: {
    exp?: number;
    spiritStones?: number;
    items?: { name: string; rarity: ItemRarity; quantity?: number }[];
    hpChange?: number;
  };
  requirements?: {
    minLuck?: number;
    sectId?: string;
  };
}

// Exploration system
export interface ExplorationLocation {
  id: string;
  name: string;
  description: string;
  minRealm: RealmType;
  cost: number; // Entry cost
  riskLevel: RiskLevel;
  eventTypes: AdventureType[];
  specialEncounters?: string[]; // List of special encounter IDs
}

// Achievement system
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'cultivation' | 'combat' | 'exploration' | 'collection' | 'special';
  requirement: {
    type: string; // 'realm' | 'level' | 'kill' | 'collect' | 'custom'
    value: number;
    target?: string; // Target name (e.g., item name, realm name, etc.)
  };
  reward: {
    exp?: number;
    spiritStones?: number;
    items?: Item[];
    titleId?: string;
  };
  rarity: ItemRarity;
}

// Pet system
export interface Pet {
  id: string;
  name: string;
  species: string; // Species
  level: number;
  exp: number;
  maxExp: number;
  rarity: ItemRarity;
  image?: string; // Pet image (Emoji)
  stats: {
    attack: number;
    defense: number;
    hp: number;
    speed: number; // Speed, affects turn order in combat
  };
  skills: PetSkill[];
  evolutionStage: number; // Evolution stage 0-2 (0=Juvenile, 1=Mature, 2=Complete)
  affection: number; // Affection 0-100
  skillCooldowns?: Record<string, number>; // Skill cooldown tracking
}

export interface PetSkill {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'defense' | 'support' | 'passive' | 'debuff' | 'buff';
  effect: {
    damage?: number;
    heal?: number;
    buff?: { attack?: number; defense?: number; hp?: number; speed?: number };
  };
  cooldown?: number;
}

export interface PetTemplate {
  id: string;
  name: string;
  nameVariants?: string[]; // Name variants, used to generate diverse random names
  species: string;
  description: string;
  rarity: ItemRarity;
  image: string; // Initial form (Juvenile)
  stageImages?: {
    stage1?: string; // Mature form image
    stage2?: string; // Complete form image
  };
  baseStats: {
    attack: number;
    defense: number;
    hp: number;
    speed: number;
  };
  skills: PetSkill[]; // Initial skills (Juvenile)
  stageSkills?: {
    stage1?: PetSkill[]; // New skill set for Mature form
    stage2?: PetSkill[]; // New skill set for Complete form
  };
  evolutionRequirements?: {
    // Juvenile -> Mature (evolutionStage 0 -> 1)
    stage1?: {
      level: number;
      items?: { name: string; quantity: number }[];
    };
    // Mature -> Complete (evolutionStage 1 -> 2)
    stage2?: {
      level: number;
      items?: { name: string; quantity: number }[];
    };
    // Compatibility (use this if stage1/stage2 not provided)
    level?: number;
    items?: { name: string; quantity: number }[];
  };
  // Evolved names (optional, uses original name if not provided)
  evolutionNames?: {
    stage1?: string; // Mature name
    stage2?: string; // Complete name
  };
}

// Lottery system
export interface LotteryPrize {
  id: string;
  name: string;
  type: 'item' | 'spiritStones' | 'exp' | 'pet' | 'ticket';
  rarity: ItemRarity;
  weight: number; // Weight, higher is easier to pull
  value: {
    item?: Partial<Item>;
    spiritStones?: number;
    exp?: number;
    petId?: string;
    tickets?: number;
  };
}

// Difficulty Mode
export type DifficultyMode = 'easy' | 'normal' | 'hard';

// Settings system
export interface KeyboardShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number; // 0-100
  musicVolume: number; // 0-100
  autoSave: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  language: 'zh' | 'en';
  difficulty: DifficultyMode; // Game difficulty mode
  keyboardShortcuts?: Record<string, KeyboardShortcutConfig>; // Custom keyboard shortcuts, key is actionId
}

// Shop system
export enum ShopType {
  Village = 'Village',
  City = 'City',
  Sect = 'Faction',
  BlackMarket = 'Black Market', // Black market shop
  LimitedTime = 'Daily Special', // Limited time shop (daily deals)
  Reputation = 'Reputation Shop', // Reputation shop
}

export interface ShopItem {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  rarity: ItemRarity;
  price: number; // Purchase price
  sellPrice: number; // Sell price (usually 30-50% of purchase price)
  effect?: {
    hp?: number;
    exp?: number;
    attack?: number;
    defense?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
  };
  permanentEffect?: {
    attack?: number;
    defense?: number;
    spirit?: number;
    physique?: number;
    speed?: number;
    maxLifespan?: number;
  };
  equipmentSlot?: EquipmentSlot;
  isEquippable?: boolean;
  minRealm?: RealmType; // Minimum realm requirement
  reviveChances?: number; // Revive chances (1-3), only available for Legendary/Mythic gear
  isAdvancedItem?: boolean; // Marked as advanced item
  advancedItemType?: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule'; // Advanced item type
}

export interface Shop {
  id: string;
  name: string;
  type: ShopType;
  description: string;
  items: ShopItem[];
  refreshCost?: number; // Refresh cost (for special shops like Black Market)
  refreshCooldown?: number; // Refresh cooldown (ms)
  lastRefreshTime?: number; // Last refresh timestamp
  discount?: number; // Discount (0-1, for limited time shops)
  reputationRequired?: number; // Required reputation (for reputation shops)
}

// ==================== Turn-Based Battle System Types ====================

// Status effects
export interface Buff {
  id: string;
  name: string;
  type: 'attack' | 'defense' | 'speed' | 'heal' | 'crit' | 'shield' | 'custom';
  value: number; // Numeric or percentage bonus
  duration: number; // Remaining turns, -1 for permanent (during battle)
  source: string; // Source (Protocol, Chem, Skill, etc.)
  description?: string;
  reflectDamage?: number; // Reflected damage ratio (0-1)
  critDamage?: number; // Critical damage bonus
  revive?: number; // Revive marker (1 means has revive)
  dodge?: number; // Dodge rate bonus (0-1)
  ignoreDefense?: boolean; // Attack ignores defense
  regen?: number; // Percentage of max HP restored per turn
  damageReduction?: number; // Damage reduction ratio (0-1)
  immunity?: boolean; // Immune to all negative statuses
  magicDefense?: number; // Magic defense bonus
}

export interface Debuff {
  id: string;
  name: string;
  type: 'poison' | 'burn' | 'freeze' | 'stun' | 'weakness' | 'armor_break' | 'custom';
  value: number;
  duration: number;
  source: string;
  description?: string;
}

// Skill Effect
export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'status';
  target: 'self' | 'enemy' | 'both';
  value?: number;
  duration?: number;
  buffId?: string;
  debuffId?: string;
  buff?: Buff;
  debuff?: Debuff;
}

// Battle Skills
export interface BattleSkill {
  id: string;
  name: string;
  description: string;
  type: 'attack' | 'defense' | 'heal' | 'buff' | 'debuff' | 'special';
  source: 'cultivation_art' | 'artifact' | 'weapon' | 'potion' | 'innate';
  sourceId: string; // Source ID (Protocol ID, Relic ID, etc.)
  effects: SkillEffect[];
  cost: {
    mana?: number; // Spirit cost
    energy?: number; // Energy cost
    hp?: number; // HP cost (self-harm skills)
  };
  cooldown: number; // Current cooldown turns
  maxCooldown: number; // Max cooldown turns
  conditions?: {
    minHp?: number; // Minimum HP percentage (0-1)
    requireBuff?: string; // Requires specific Buff ID
    requireDebuff?: string; // Requires specific Debuff ID
  };
  target: 'self' | 'enemy' | 'both';
  damage?: {
    base: number; // Base damage
    multiplier: number; // Damage multiplier (based on attack or spirit)
    type: 'physical' | 'magical'; // Physical/Magical damage
    critChance?: number; // Critical hit chance (0-1)
    critMultiplier?: number; // Critical hit multiplier
  };
  heal?: {
    base: number; // Base healing
    multiplier: number; // Healing multiplier (percentage of max HP)
  };
}

// Battle Unit
export interface BattleUnit {
  id: string;
  name: string;
  realm: RealmType;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  spirit: number; // Spirit (affects magical damage)
  buffs: Buff[];
  debuffs: Debuff[];
  skills: BattleSkill[]; // Available skills list
  cooldowns: Record<string, number>; // Skill cooldowns (Skill ID -> Remaining turns)
  mana?: number; // Spirit (optional, for skill costs)
  maxMana?: number; // Max spirit
  energy?: number; // Energy (optional, for special skills)
  maxEnergy?: number; // Max energy
  isDefending?: boolean; // Whether in defending state
}

// Battle Action
export interface BattleAction {
  id: string;
  round: number;
  turn: 'player' | 'enemy';
  actor: string; // Actor ID
  actionType: 'attack' | 'skill' | 'item' | 'defend' | 'flee';
  skillId?: string; // Used skill ID
  itemId?: string; // Used item ID
  target?: string; // Target ID
  result: {
    damage?: number;
    heal?: number;
    buffs?: Buff[];
    debuffs?: Debuff[];
    crit?: boolean;
    miss?: boolean;
    blocked?: boolean;
    manaCost?: number;
    reflectedDamage?: number; // Reflected damage value
  };
  description: string; // Action description text
}

// Battle Result
export interface BattleResult {
  victory: boolean;
  hpLoss: number;
  playerHpBefore: number;
  playerHpAfter: number;
  expChange: number;
  spiritChange: number;
  summary: string;
  adventureType?: AdventureType; // Added adventure type
}

// Battle State
export interface BattleState {
  id: string;
  round: number; // Current round number
  turn: 'player' | 'enemy'; // Current turn side
  player: BattleUnit;
  enemy: BattleUnit;
  history: BattleAction[]; // Battle history
  result?: BattleResult; // Battle result
  isPlayerTurn: boolean; // Is player turn (for UI control)
  waitingForPlayerAction: boolean; // Waiting for player action
  playerInventory: Item[]; // Player inventory (for using items)
  // Action count system
  playerActionsRemaining: number; // Player actions remaining
  enemyActionsRemaining: number; // Enemy actions remaining
  playerMaxActions: number; // Player max actions this round
  enemyMaxActions: number; // Enemy max actions this round
  // Battle information
  enemyStrengthMultiplier?: number; // Enemy strength multiplier (for reward calculation)
  adventureType: AdventureType; // Adventure type
  riskLevel?: RiskLevel; // Risk level
  // Pet system
  activePet?: Pet | null; // Active pet
  petSkillCooldowns?: Record<string, number>; // Pet skill cooldowns
}

// Player Action Selection
export type PlayerAction =
  | { type: 'attack' }
  | { type: 'skill'; skillId: string }
  | { type: 'item'; itemId: string }
  | { type: 'advancedItem'; itemType: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule'; itemId: string }
  | { type: 'defend' }
  | { type: 'flee' };

// Available Battle Chems
export interface BattlePotion {
  itemId: string;
  name: string;
  type: 'heal' | 'buff' | 'debuff_removal';
  effect: {
    heal?: number;
    buffs?: Buff[];
    removeDebuffs?: string[]; // List of removed Debuff IDs
  };
  cooldown?: number; // Cooldown after use (prevent spam)
  itemType: ItemType; // Item Type
}

// Daily Quest Type
export type DailyQuestType =
  | 'meditate' // Meditate
  | 'adventure' // Adventure
  | 'breakthrough' // Breakthrough
  | 'alchemy' // Alchemy
  | 'equip' // Equip
  | 'pet' // Pet
  | 'sect' // Faction
  | 'realm' // Secret Realm
  | 'kill' // Defeat Enemy (AI Generated)
  | 'collect' // Collect Item (AI Generated)
  | 'learn' // Learn Protocol (AI Generated)
  | 'other'; // Other Creative Quest (AI Generated)

// Daily Quest
export interface DailyQuest {
  id: string;
  type: DailyQuestType;
  name: string;
  description: string;
  target: number; // Target Quantity
  progress: number; // Current Progress
  reward: {
    exp?: number; // Exp Reward
    spiritStones?: number; // Spirit Stone Reward
    lotteryTickets?: number; // Lottery Ticket Reward
    items?: Array<{ name: string; quantity: number }>; // Item Reward
  };
  rarity: ItemRarity; // Quest Rarity (Affects Rewards)
  completed: boolean; // Is Completed
}

// Grotto Configuration
export interface GrottoConfig {
  level: number; // Grotto Level
  name: string; // Grotto Name
  cost: number; // Purchase/Upgrade Cost (Spirit Stones)
  expRateBonus: number; // Reactor XP Rate Bonus
  autoHarvest: boolean; // Supports Auto-Harvest (High level grotto only)
  growthSpeedBonus: number; // Growth Speed Bonus (Reduces growth time, 0-0.5)
  maxHerbSlots: number; // Max Planting Slots
  realmRequirement?: RealmType; // Realm Requirement (Optional)
  description: string; // Description
}

// ==================== Tribulation System Types ====================

// Tribulation Level
export type TribulationLevel = 'Elite Storm' | 'Master Storm' | 'Grandmaster Storm' | 'Fusion Storm' | 'Eternal Storm';

// Tribulation Stage
export type TribulationStage =
  | 'Stabilizing'
  | 'First Wave'
  | 'Second Wave'
  | 'The Final Surge'
  | 'Breakthrough Success'
  | 'Breakthrough Failure';

// Tribulation State
export interface TribulationState {
  isOpen: boolean; // Is Tribulation Modal Open
  targetRealm: RealmType; // Target Realm (Realm after breakthrough)
  tribulationLevel: TribulationLevel; // Tribulation Level
  stage: TribulationStage; // Current Stage
  deathProbability: number; // Death Probability (0-1)
  attributeBonus: number; // Attribute Bonus (Reduces death probability)
  equipmentBonus: number; // Equipment Bonus (Reduces death probability)
  totalStats: {
    attack: number;
    defense: number;
    spirit: number;
    physique: number;
    speed: number;
    maxHp: number;
  }; // Total Stats (For display)
  equipmentQualityScore: number; // Equipment Quality Score
  isCleared: boolean; // Is Cleared
}

// Tribulation Result
export interface TribulationResult {
  success: boolean; // Success
  deathProbability: number; // Final Death Probability
  roll: number; // Random Value
  hpLoss?: number; // HP Loss (If success)
  description: string; // Description
}

// ==================== Dao Combining Challenge System Types ====================

// Heaven Earth Soul Boss Interface
export interface HeavenEarthSoulBoss {
  id: string;
  name: string;
  description: string;
  realm: RealmType;
  baseStats: {
    attack: number;
    defense: number;
    hp: number;
    spirit: number;
    physique: number;
    speed: number;
  };
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme'; // Difficulty Level
  strengthMultiplier: number; // Strength Multiplier (0.9-3.0)
  specialSkills: BattleSkill[]; // Special Skills
  rewards: {
    exp: number;
    spiritStones: number;
    items?: string[]; // Reward Item IDs
    daoCombiningUnlocked?: boolean; // Unlocks Dao Combining
  };
}

// Dao Combining Challenge State
export interface DaoCombiningChallengeState {
  isOpen: boolean; // Is Challenge Open
  bossId: string | null; // Current Boss ID
  bossStrengthMultiplier: number; // Boss Strength Multiplier
  battleResult: BattleResult | null; // Battle Result
}
