import { Item, ItemType, ItemRarity, EquipmentSlot, RealmType } from '../types';
import { RARITY_MULTIPLIERS, REALM_ORDER, REALM_DATA } from '../constants/index';
import { getItemFromConstants } from './itemConstantsUtils';

// Shared equipment stats configuration (unified management to avoid duplication)
// Adjust attribute fluctuation range, narrow the gap, make equipment attributes more stable
export const EQUIPMENT_RARITY_PERCENTAGES: Record<ItemRarity, { min: number; max: number }> = {
  Common: { min: 0.25, max: 0.40 },
  Rare: { min: 0.50, max: 0.80 },
  Legendary: { min: 0.90, max: 1.40 },
  Mythic: { min: 1.50, max: 2.20 },
};

export const EQUIPMENT_MIN_STATS: Record<ItemRarity, { attack: number; defense: number; hp: number; spirit: number; physique: number; speed: number }> = {
  Common: { attack: 50, defense: 50, hp: 50, spirit: 50, physique: 50, speed: 50 },
  Rare: { attack: 200, defense: 200, hp: 200, spirit: 200, physique: 200, speed: 200 },
  Legendary: { attack: 400, defense: 400, hp: 400, spirit: 400, physique: 400, speed: 400 },
  Mythic: { attack: 1000, defense: 1000, hp: 1000, spirit: 1000, physique: 1000, speed: 1000 },
  // Compatibility with Chinese keys
  普通: { attack: 50, defense: 50, hp: 50, spirit: 50, physique: 50, speed: 50 },
  稀有: { attack: 200, defense: 200, hp: 200, spirit: 200, physique: 200, speed: 200 },
  传说: { attack: 400, defense: 400, hp: 400, spirit: 400, physique: 400, speed: 400 },
  仙品: { attack: 1000, defense: 1000, hp: 1000, spirit: 1000, physique: 1000, speed: 1000 },
};

// Define item effect type (keep consistent with Item interface)
type ItemEffect = NonNullable<Item['effect']>;
type ItemPermanentEffect = NonNullable<Item['permanentEffect']>;

// Normalize common type aliases to English
export const normalizeTypeHint = (type?: ItemType | string): ItemType | undefined => {
  if (!type) return undefined;
  const t = String(type).toLowerCase();
  const map: Record<string, ItemType> = {
    "armor": ItemType.Armor,
    "protective": ItemType.Armor,
    "vest": ItemType.Armor,
    "suit": ItemType.Armor,
    "gear": ItemType.Armor,
    "relic": ItemType.Artifact,
    "artifact": ItemType.Artifact,
    "ancient": ItemType.Artifact,
    "pre-war": ItemType.Artifact,
    "weapon": ItemType.Weapon,
    "gun": ItemType.Weapon,
    "blade": ItemType.Weapon,
    "chem": ItemType.Pill,
    "drug": ItemType.Pill,
    "pill": ItemType.Pill,
    "potion": ItemType.Pill,
    "elixir": ItemType.Pill,
    "stimpak": ItemType.Pill,
    "herb": ItemType.Herb,
    "plant": ItemType.Herb,
    "material": ItemType.Material,
    "junk": ItemType.Material,
    "accessory": ItemType.Accessory,
    "trinket": ItemType.Accessory,
    "ring": ItemType.Ring,
    "band": ItemType.Ring,
    "recipe": ItemType.Recipe,
    "blueprint": ItemType.Recipe,
    "schematic": ItemType.Recipe,
  };
  return map[t] || (Object.values(ItemType).includes(type as ItemType) ? (type as ItemType) : undefined);
};

// Normalize labels for display
export const normalizeTypeLabel = (type: ItemType | string, item?: {
  advancedItemType?: string;
  equipmentSlot?: EquipmentSlot;
  name?: string;
  description?: string;
}): string => {
  if (!type) return 'Unknown';
  const t = String(type).toLowerCase();

  if (t === 'advanceditem' || type === ItemType.AdvancedItem) {
    if (item?.advancedItemType) {
      const typeMap: Record<string, string> = {
        foundationTreasure: 'Pre-War Artifact',
        heavenEarthEssence: 'Nuclear Essence',
        heavenEarthMarrow: 'Quantum Marrow',
        longevityRule: 'Wasteland Rule',
      };
      return typeMap[item.advancedItemType] || 'Advanced Tech';
    }
    return 'Advanced Tech';
  }

  if (t === 'armor' || type === ItemType.Armor) {
    if (item?.equipmentSlot) {
      return item.equipmentSlot;
    }

    if (item?.name && item?.description) {
      const inferred = inferItemTypeAndSlot(
        item.name,
        ItemType.Armor,
        item.description,
        true
      );
      if (inferred.equipmentSlot) {
        return inferred.equipmentSlot;
      }
    }

    return 'Armor';
  }

  const map: Record<string, string> = {
    herb: 'Plant',
    pill: 'Chem',
    material: 'Material',
    artifact: 'Relic',
    weapon: 'Weapon',
    armor: 'Armor',
    accessory: 'Accessory',
    ring: 'Ring',
    recipe: 'Blueprint',
    advanceditem: 'Advanced Tech',
  };
  return map[t] || (type as string);
};

// Stable slot selection: Items with the same name will always fall into the same slot in any process
const stablePickSlot = (name: string, slots: EquipmentSlot[]) => {
  const hash = Array.from(name).reduce((acc, ch) => ((acc * 31 + ch.charCodeAt(0)) >>> 0) & 0xffffffff, 0);
  return slots[hash % slots.length];
};

// Known item effect mapping table (consistent with constant pool)
// Note: These values must be exactly consistent with definitions in constants.ts
export const KNOWN_ITEM_EFFECTS: Record<
  string,
  { effect?: ItemEffect; permanentEffect?: ItemPermanentEffect }
> = {
  // Plants - from INITIAL_ITEMS and combat rewards
  'Blood-Stanching Grass': { effect: { hp: 20 } },
  'Qi-Gathering Grass': {},
  'Refining Herb': { effect: { hp: 30 } },
  'Concentrated Petal': { effect: { hp: 50, spirit: 5 } },
  'Blood Ginseng': { effect: { hp: 80 } },
  'Millennial Mushroom': {
    effect: { hp: 150 },
    permanentEffect: { maxHp: 40, spirit: 20, physique: 15, maxLifespan: 30 },
  },
  'Celestial Herb': {
    effect: { hp: 300 },
    permanentEffect: { maxHp: 100, spirit: 100, physique: 80, speed: 50, maxLifespan: 200 },
  },
  // Chems - from BLUEPRINTS
  'Healing Pill': { effect: { hp: 50 } },
  'Qi-Gathering Pill': { effect: { exp: 50 } },
  'Fortifying Pill': { permanentEffect: { physique: 20 } },
  'Focusing Pill': { permanentEffect: { spirit: 20 } },
  'Foundation-Building Pill': {
    effect: { exp: 500 },
    permanentEffect: { spirit: 30, physique: 30, maxHp: 100 },
  },
  'Breakthrough Pill': {
    effect: { exp: 10000 },
    permanentEffect: { spirit: 50, physique: 50, attack: 30, defense: 30 },
  },
  'Celestial Elixir': {
    effect: { exp: 2000, spirit: 50, physique: 50 },
    permanentEffect: { maxLifespan: 300, spirit: 300, attack: 300, defense: 300, physique: 300, speed: 300 },
  },
};

/**
 * Adjust pill effects based on rarity
 * Ensure significant differences in pill effects for different rarities
 */
export const adjustPillEffectByRarity = (
  effect: ItemEffect | undefined,
  permanentEffect: ItemPermanentEffect | undefined,
  rarity: ItemRarity
): { effect?: ItemEffect; permanentEffect?: ItemPermanentEffect } => {
  const multiplier = RARITY_MULTIPLIERS[rarity] || 1;

  // If rarity is Common, return directly
  if (rarity === 'Common' || multiplier === 1) {
    return { effect, permanentEffect };
  }

  const adjustedEffect: ItemEffect = {};
  const adjustedPermanentEffect: ItemPermanentEffect = {};

  // Adjust temporary effects (effect)
  if (effect) {
    if (effect.exp !== undefined) {
      adjustedEffect.exp = Math.floor(effect.exp * multiplier);
    }
    if (effect.hp !== undefined) {
      adjustedEffect.hp = Math.floor(effect.hp * multiplier);
    }
    if (effect.attack !== undefined) {
      adjustedEffect.attack = Math.floor(effect.attack * multiplier);
    }
    if (effect.defense !== undefined) {
      adjustedEffect.defense = Math.floor(effect.defense * multiplier);
    }
    if (effect.spirit !== undefined) {
      adjustedEffect.spirit = Math.floor(effect.spirit * multiplier);
    }
    if (effect.physique !== undefined) {
      adjustedEffect.physique = Math.floor(effect.physique * multiplier);
    }
    if (effect.speed !== undefined) {
      adjustedEffect.speed = Math.floor(effect.speed * multiplier);
    }
    if (effect.lifespan !== undefined) {
      adjustedEffect.lifespan = Math.floor(effect.lifespan * multiplier);
    }
  }

  // Adjust permanent effects (permanentEffect)
  if (permanentEffect) {
    if (permanentEffect.attack !== undefined) {
      adjustedPermanentEffect.attack = Math.floor(permanentEffect.attack * multiplier);
    }
    if (permanentEffect.defense !== undefined) {
      adjustedPermanentEffect.defense = Math.floor(permanentEffect.defense * multiplier);
    }
    if (permanentEffect.spirit !== undefined) {
      adjustedPermanentEffect.spirit = Math.floor(permanentEffect.spirit * multiplier);
    }
    if (permanentEffect.physique !== undefined) {
      adjustedPermanentEffect.physique = Math.floor(permanentEffect.physique * multiplier);
    }
    if (permanentEffect.speed !== undefined) {
      adjustedPermanentEffect.speed = Math.floor(permanentEffect.speed * multiplier);
    }
    if (permanentEffect.maxHp !== undefined) {
      adjustedPermanentEffect.maxHp = Math.floor(permanentEffect.maxHp * multiplier);
    }
    if (permanentEffect.maxLifespan !== undefined) {
      adjustedPermanentEffect.maxLifespan = Math.floor(permanentEffect.maxLifespan * multiplier);
    }
    if (permanentEffect.spiritualRoots) {
      adjustedPermanentEffect.spiritualRoots = {};
      Object.entries(permanentEffect.spiritualRoots).forEach(([key, value]) => {
        if (value !== undefined) {
          adjustedPermanentEffect.spiritualRoots![key as keyof typeof permanentEffect.spiritualRoots] =
            Math.floor(value * multiplier);
        }
      });
    }
  }

  return {
    effect: Object.keys(adjustedEffect).length > 0 ? adjustedEffect : effect,
    permanentEffect: Object.keys(adjustedPermanentEffect).length > 0 ? adjustedPermanentEffect : permanentEffect,
  };
};

// Normalize item effects to ensure known items' effects match descriptions
// Use original properties from constant pool completely, without any adjustment
export const normalizeItemEffect = (
  itemName: string,
  aiEffect?: ItemEffect,
  aiPermanentEffect?: ItemPermanentEffect,
  _itemType?: ItemType,
  _rarity?: ItemRarity
) => {
  // Prioritize getting item definition from constant pool (if exists, use directly, no adjustment)
  const itemFromConstants = getItemFromConstants(itemName);
  if (itemFromConstants) {
    // If item definition exists in constant pool, prioritize using effects from constant pool
    // If effect or permanentEffect in constant pool is undefined or empty object, use passed value
    // If passed value is also undefined, return undefined (do not return empty object)
    const constantsEffect = itemFromConstants.effect;
    const constantsPermanentEffect = itemFromConstants.permanentEffect;

    // Check if effect in constant pool is valid (not undefined and not empty object)
    const hasValidConstantsEffect = constantsEffect !== undefined &&
      constantsEffect !== null &&
      Object.keys(constantsEffect || {}).length > 0;

    // Check if permanentEffect in constant pool is valid (not undefined and not empty object)
    const hasValidConstantsPermanentEffect = constantsPermanentEffect !== undefined &&
      constantsPermanentEffect !== null &&
      Object.keys(constantsPermanentEffect || {}).length > 0;

    return {
      effect: hasValidConstantsEffect
        ? constantsEffect
        : aiEffect,
      permanentEffect: hasValidConstantsPermanentEffect
        ? constantsPermanentEffect
        : aiPermanentEffect,
    };
  }

  const knownItem = KNOWN_ITEM_EFFECTS[itemName];
  if (knownItem) {
    // If item is in known list, use predefined effects
    // If not defined in known list, use passed value
    return {
      effect: knownItem.effect !== undefined
        ? knownItem.effect
        : aiEffect,
      permanentEffect: knownItem.permanentEffect !== undefined
        ? knownItem.permanentEffect
        : aiPermanentEffect,
    };
  }

  // Use provided effects directly without any adjustment
  return {
    effect: aiEffect,
    permanentEffect: aiPermanentEffect,
  };
};

// Infer item type and equipment slot based on item name and description
export const inferItemTypeAndSlot = (
  name: string,
  currentType: ItemType,
  description: string,
  currentIsEquippable?: boolean
): {
  type: ItemType;
  isEquippable: boolean;
  equipmentSlot?: EquipmentSlot;
} => {
  const nameLower = name.toLowerCase();
  const descLower = description.toLowerCase();
  const combined = nameLower + descLower;

  const weaponKeywords =
    /Sword|Blade|Spear|Axe|Mace|Whip|Club|Bat|Spear|Bow|Crossbow|Dagger|Pistol|Rifle|Shotgun|Gatling|Laser|Plasma|Power Fist/;

  const rules: Array<{
    match: RegExp;
    exclude?: RegExp;
    type: ItemType;
    isEquippable: boolean;
    slot?: EquipmentSlot | EquipmentSlot[];
  }> = [
      { match: weaponKeywords, type: ItemType.Weapon, isEquippable: true, slot: EquipmentSlot.Weapon },
      {
        match: /Helmet|Cap|Hat|Hood|Mask|Circlet|Headgear|Head/,
        type: ItemType.Armor,
        isEquippable: true,
        slot: EquipmentSlot.Head,
      },
      {
        match: /Shoulder|Pauldrons|Cape|Cloak|Shoulderpads/,
        type: ItemType.Armor,
        isEquippable: true,
        slot: EquipmentSlot.Shoulder,
      },
      {
        match: /Ring|Band|Signet/,
        type: ItemType.Ring,
        isEquippable: true,
        slot: [EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4],
      },
      {
        match: /Necklace|Amulet|Bracelet|Pendant|Charm|Talisman|Badge/,
        exclude: /Gloves|Gauntlets|Artifact|Relic|Device/,
        type: ItemType.Accessory,
        isEquippable: true,
        slot: [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2],
      },
      {
        match: /Gloves|Gauntlets|Mittens|Handwear|Hands/,
        exclude: /Bracelet|Amulet/,
        type: ItemType.Armor,
        isEquippable: true,
        slot: EquipmentSlot.Gloves,
      },
      {
        match: /Boots|Shoes|Greaves|Footwear|Feet/,
        type: ItemType.Armor,
        isEquippable: true,
        slot: EquipmentSlot.Boots,
      },
      {
        match: /Pants|Leggings|Legguards|Trousers|Legs/,
        type: ItemType.Armor,
        isEquippable: true,
        slot: EquipmentSlot.Legs,
      },
      {
        match: /Plant|Flower|Fruit|Leaf|Root|Stem|Berry|Stalk|Herb|Bush/,
        exclude: /Chem|Pill|Stim|Stimpak|Drug|Liquid/,
        type: ItemType.Herb,
        isEquippable: false,
      },
      {
        match: /Blueprint|Schematic|Recipe|Manual|Instruction|Diagram/,
        type: ItemType.Recipe,
        isEquippable: false,
      },
      {
        match: /Chem|Pill|Stimpak|Stim|Drug|Injection|Syringe|Medicine|Elixir|Serum/,
        exclude: /Blueprint|Schematic|Recipe/,
        type: ItemType.Pill,
        isEquippable: false,
      },
      {
        match: /Material|Scrap|Electronic|Part|Component|Ore|Crystal|Metal|Plastic|Fiber|Adhesive/,
        type: ItemType.Material,
        isEquippable: false,
      },
      {
        match: /Outfit|Rig|Armor|Suit|Vest|Chest|Cuirass|Platemail|Uniform|Jumpsuit|Robes|Armor|Torso/,
        exclude: /Plant|Herb|Blueprint/,
        type: ItemType.Armor,
        isEquippable: true,
        slot: EquipmentSlot.Chest,
      },
      {
        match: /Relic|Artifact|Device|Gadget|Technology|Pre-War|Scanner|Holotape|Dyna-Disk|Core|Capacitor|Module/,
        exclude: weaponKeywords,
        type: ItemType.Artifact,
        isEquippable: true,
        slot: [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2],
      },
    ];

  // If current type is already a clear equipment type, prioritize keeping type, only infer slot
  const normalized = normalizeTypeHint(currentType) || currentType;
  const isKnownEquipmentType = [
    ItemType.Weapon,
    ItemType.Armor,
    ItemType.Artifact,
    ItemType.Ring,
    ItemType.Accessory,
  ].includes(normalized as ItemType);

  // If current type is clear equipment type, and isEquippable is true, prioritize keeping type
  if (isKnownEquipmentType && (currentIsEquippable || normalized === ItemType.Artifact || normalized === ItemType.Weapon || normalized === ItemType.Armor || normalized === ItemType.Ring || normalized === ItemType.Accessory)) {
    // Only infer slot, do not change type
    switch (normalized) {
      case ItemType.Weapon:
        return { type: ItemType.Weapon, isEquippable: true, equipmentSlot: EquipmentSlot.Weapon };
      case ItemType.Armor:
        // Try to infer specific part
        for (const rule of rules) {
          if (rule.type === ItemType.Armor && rule.slot && rule.match.test(combined)) {
            if (!rule.exclude || !rule.exclude.test(combined)) {
              const slot = Array.isArray(rule.slot) ? stablePickSlot(nameLower, rule.slot) : rule.slot;
              return { type: ItemType.Armor, isEquippable: true, equipmentSlot: slot };
            }
          }
        }
        return { type: ItemType.Armor, isEquippable: true, equipmentSlot: EquipmentSlot.Chest };
      case ItemType.Artifact:
        return {
          type: ItemType.Artifact,
          isEquippable: true,
          equipmentSlot: stablePickSlot(nameLower, [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2]),
        };
      case ItemType.Ring:
        return {
          type: ItemType.Ring,
          isEquippable: true,
          equipmentSlot: stablePickSlot(nameLower, [EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4]),
        };
      case ItemType.Accessory:
        return {
          type: ItemType.Accessory,
          isEquippable: true,
          equipmentSlot: stablePickSlot(nameLower, [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2]),
        };
    }
  }

  // Prioritized matching rules (only used when type is unclear)
  for (const rule of rules) {
    if (rule.exclude && rule.exclude.test(combined)) continue;
    if (rule.match.test(combined)) {
      const slot = Array.isArray(rule.slot) ? stablePickSlot(nameLower, rule.slot) : rule.slot;
      return {
        type: rule.type,
        isEquippable: rule.isEquippable,
        equipmentSlot: rule.isEquippable ? slot : undefined,
      };
    }
  }

  // Use normalized type hint as fallback (if none of the above logic matched)
  if (currentIsEquippable || isKnownEquipmentType) {
    switch (normalized) {
      case ItemType.Weapon:
        return { type: ItemType.Weapon, isEquippable: true, equipmentSlot: EquipmentSlot.Weapon };
      case ItemType.Armor:
        return { type: ItemType.Armor, isEquippable: true, equipmentSlot: EquipmentSlot.Chest };
      case ItemType.Artifact:
        return {
          type: ItemType.Artifact,
          isEquippable: true,
          equipmentSlot: stablePickSlot(nameLower, [EquipmentSlot.Artifact1, EquipmentSlot.Artifact2]),
        };
      case ItemType.Ring:
        return {
          type: ItemType.Ring,
          isEquippable: true,
          equipmentSlot: stablePickSlot(nameLower, [EquipmentSlot.Ring1, EquipmentSlot.Ring2, EquipmentSlot.Ring3, EquipmentSlot.Ring4]),
        };
      case ItemType.Accessory:
        return {
          type: ItemType.Accessory,
          isEquippable: true,
          equipmentSlot: stablePickSlot(nameLower, [EquipmentSlot.Accessory1, EquipmentSlot.Accessory2]),
        };
      default:
        break;
    }
  }

  const fallbackType = (normalized || currentType || ItemType.Material) as ItemType;

  return {
    type: fallbackType,
    isEquippable: currentIsEquippable || false,
  };
};

/**
 * Get equipment stat base multiplier based on realm
 * Used to balance equipment stats across different realms, ensuring equipment matches player realm
 */
export const getRealmEquipmentMultiplier = (realm: RealmType, realmLevel: number): number => {
  const realmIndex = REALM_ORDER.indexOf(realm);
  // If realm index is invalid, use default (QiRefining, index 0)
  const validRealmIndex = realmIndex >= 0 ? realmIndex : 0;
  // Optimized base multipliers: reduce growth rate, prevent stat inflation
  // Changed from [1, 2, 4, 6, 10, 16, 32] to [1, 1.5, 2.5, 4, 6, 10, 16]
  // Max multiplier reduced from 32x to 16x, better matching realm attribute growth (5x)
  const realmBaseMultipliers = [1, 1.5, 2.5, 4, 6, 10, 16];
  const realmBaseMultiplier = realmBaseMultipliers[validRealmIndex] || 1;
  // Realm level bonus: 8% per level (further reduced growth)
  const levelMultiplier = 1 + (realmLevel - 1) * 0.08;
  return realmBaseMultiplier * levelMultiplier;
};

/**
 * Adjust equipment stats based on realm
 * Ensure equipment stats match player's current realm, avoiding too high or too low stats
 * Calculate reasonable equipment stat range based on rarity and realm base stats
 */
export const adjustEquipmentStatsByRealm = (
  effect: Item['effect'],
  realm: RealmType,
  realmLevel: number,
  rarity: ItemRarity = 'Common'
): Item['effect'] | undefined => {
  if (!effect) return effect;

  const realmIndex = REALM_ORDER.indexOf(realm);
  // Get current realm base stats as reference
  const realmData = REALM_DATA[realm];
  // If realm data doesn't exist, use QiRefining as default
  if (!realmData) {
    const defaultRealmData = REALM_DATA[RealmType.QiRefining];
    if (!defaultRealmData) {
      // If even default is missing, return original effect (prevent crash)
      return effect;
    }
    return adjustEquipmentStatsByRealm(effect, RealmType.QiRefining, realmLevel, rarity);
  }
  const baseAttack = realmData.baseAttack;
  const baseDefense = realmData.baseDefense;
  const baseMaxHp = realmData.baseMaxHp;
  const baseSpirit = realmData.baseSpirit;
  const basePhysique = realmData.basePhysique;
  const baseSpeed = realmData.baseSpeed;

  // Use shared equipment stats config
  const percentage = EQUIPMENT_RARITY_PERCENTAGES[rarity] || EQUIPMENT_RARITY_PERCENTAGES['Common'];
  // Use median as baseline
  const targetPercentage = (percentage.min + percentage.max) / 2;

  // Realm level bonus: 5% per level
  const levelMultiplier = 1 + (realmLevel - 1) * 0.05;

  // Optimized realm exponential growth multiplier: consistent with equipment multiplier function, prevent stat inflation
  // Changed from [1, 2, 4, 8, 16, 32, 64] to [1, 1.5, 2.5, 4, 6, 10, 16]
  // Max multiplier reduced from 64x to 16x, better matching realm attribute growth (5x)
  const realmBaseMultipliers = [1, 1.5, 2.5, 4, 6, 10, 16];
  const realmMultiplier = realmBaseMultipliers[realmIndex] || 1;

  const adjusted: Item['effect'] = {};

  // Attribute mapping table, reduce duplicate code
  const attributeMap: Array<{
    key: keyof Item['effect'];
    baseValue: number;
  }> = [
      { key: 'attack', baseValue: baseAttack },
      { key: 'defense', baseValue: baseDefense },
      { key: 'hp', baseValue: baseMaxHp },
      { key: 'spirit', baseValue: baseSpirit },
      { key: 'physique', baseValue: basePhysique },
      { key: 'speed', baseValue: baseSpeed },
    ];

  // Get minimum stat guarantee for this rarity
  const minStats = EQUIPMENT_MIN_STATS[rarity] || EQUIPMENT_MIN_STATS['Common'];

  // Process all attributes uniformly
  attributeMap.forEach(({ key, baseValue }) => {
    const value = effect[key];
    if (value !== undefined && typeof value === 'number') {
      // Target value = Base Stat * Rarity % * Realm Level Bonus * Realm Multiplier
      const targetValue = Math.floor(baseValue * targetPercentage * levelMultiplier * realmMultiplier);
      const maxValue = Math.floor(baseValue * percentage.max * levelMultiplier * realmMultiplier);

      // Calculate adjusted stat value
      let adjustedValue = value * realmMultiplier;

      // Ensure equipment stat reaches at least 80% of target value
      adjustedValue = Math.max(adjustedValue, targetValue * 0.8);

      // Apply rarity guarantee: ensure high quality equipment has corresponding minimum stats
      // This is especially important when low realm players get high quality equipment
      const minStatValue = minStats[key as keyof typeof minStats];
      if (minStatValue !== undefined) {
        adjustedValue = Math.max(adjustedValue, minStatValue);
      }

      // Max not exceeding max value
      adjusted[key] = Math.min(adjustedValue, maxValue);
    }
  });
  if (effect.exp !== undefined) {
    adjusted.exp = effect.exp; // exp not affected by realm adjustment
  }
  if (effect.lifespan !== undefined) {
    adjusted.lifespan = effect.lifespan; // Lifespan not affected by realm adjustment
  }

  return adjusted;
};

/**
 * Adjust item stats based on realm (generic function, applies to all item types)
 * For equipment, use specialized adjustEquipmentStatsByRealm
 * For other items (Pills, Herbs, etc.), adjust by multiplier based on realm
 */
export const adjustItemStatsByRealm = (
  effect: Item['effect'],
  permanentEffect: Item['permanentEffect'],
  realm: RealmType,
  realmLevel: number,
  itemType: ItemType,
  rarity: ItemRarity = 'Common'
): { effect?: Item['effect']; permanentEffect?: Item['permanentEffect'] } => {
  // Equipment types use specialized adjustment function
  const isEquipment = itemType === ItemType.Weapon ||
    itemType === ItemType.Armor ||
    itemType === ItemType.Accessory ||
    itemType === ItemType.Ring ||
    itemType === ItemType.Artifact;

  if (isEquipment && effect) {
    const adjustedEffect = adjustEquipmentStatsByRealm(effect, realm, realmLevel, rarity);
    return { effect: adjustedEffect, permanentEffect: undefined };
  }

  // Non-equipment items: adjust by multiplier based on realm
  const realmIndex = REALM_ORDER.indexOf(realm);
  // Optimized realm multipliers: consistent with equipment adjustment, prevent stat inflation
  // Changed from [1, 2, 4, 8, 16, 20, 25] to [1, 1.5, 2.5, 4, 6, 10, 16]
  const realmBaseMultipliers = [1, 1.5, 2.5, 4, 6, 10, 16];
  const realmMultiplier = realmBaseMultipliers[realmIndex] || 1;
  // Reduce level bonus: from 10% to 8%, consistent with equipment adjustment
  const levelMultiplier = 1 + (realmLevel - 1) * 0.08;
  const totalMultiplier = realmMultiplier * levelMultiplier;

  const adjustedEffect: Item['effect'] = {};
  const adjustedPermanentEffect: Item['permanentEffect'] = {};

  // Adjust temporary effects
  if (effect) {
    if (effect.attack !== undefined) adjustedEffect.attack = Math.floor(effect.attack * totalMultiplier);
    if (effect.defense !== undefined) adjustedEffect.defense = Math.floor(effect.defense * totalMultiplier);
    if (effect.hp !== undefined) adjustedEffect.hp = Math.floor(effect.hp * totalMultiplier);
    if (effect.spirit !== undefined) adjustedEffect.spirit = Math.floor(effect.spirit * totalMultiplier);
    if (effect.physique !== undefined) adjustedEffect.physique = Math.floor(effect.physique * totalMultiplier);
    if (effect.speed !== undefined) adjustedEffect.speed = Math.floor(effect.speed * totalMultiplier);
    if (effect.exp !== undefined) adjustedEffect.exp = Math.floor(effect.exp * totalMultiplier);
    // Lifespan not affected by realm adjustment
    if (effect.lifespan !== undefined) adjustedEffect.lifespan = effect.lifespan;
  }

  // Adjust permanent effects
  if (permanentEffect) {
    if (permanentEffect.attack !== undefined) adjustedPermanentEffect.attack = Math.floor(permanentEffect.attack * totalMultiplier);
    if (permanentEffect.defense !== undefined) adjustedPermanentEffect.defense = Math.floor(permanentEffect.defense * totalMultiplier);
    if (permanentEffect.spirit !== undefined) adjustedPermanentEffect.spirit = Math.floor(permanentEffect.spirit * totalMultiplier);
    if (permanentEffect.physique !== undefined) adjustedPermanentEffect.physique = Math.floor(permanentEffect.physique * totalMultiplier);
    if (permanentEffect.speed !== undefined) adjustedPermanentEffect.speed = Math.floor(permanentEffect.speed * totalMultiplier);
    if (permanentEffect.maxHp !== undefined) adjustedPermanentEffect.maxHp = Math.floor(permanentEffect.maxHp * totalMultiplier);
    // Max lifespan not affected by realm adjustment
    if (permanentEffect.maxLifespan !== undefined) adjustedPermanentEffect.maxLifespan = permanentEffect.maxLifespan;

    if (permanentEffect.spiritualRoots) {
      adjustedPermanentEffect.spiritualRoots = {};
      const roots = permanentEffect.spiritualRoots;
      if (roots.metal !== undefined) adjustedPermanentEffect.spiritualRoots.metal = Math.floor(roots.metal * totalMultiplier);
      if (roots.wood !== undefined) adjustedPermanentEffect.spiritualRoots.wood = Math.floor(roots.wood * totalMultiplier);
      if (roots.water !== undefined) adjustedPermanentEffect.spiritualRoots.water = Math.floor(roots.water * totalMultiplier);
      if (roots.fire !== undefined) adjustedPermanentEffect.spiritualRoots.fire = Math.floor(roots.fire * totalMultiplier);
      if (roots.earth !== undefined) adjustedPermanentEffect.spiritualRoots.earth = Math.floor(roots.earth * totalMultiplier);
    }
  }

  return {
    effect: Object.keys(adjustedEffect).length > 0 ? adjustedEffect : effect,
    permanentEffect: Object.keys(adjustedPermanentEffect).length > 0 ? adjustedPermanentEffect : permanentEffect,
  };
};

/**
 * Helper to calculate item stats
 * Note: Equipment stats already consider rarity, so RARITY_MULTIPLIERS is not applied here
 * Only applies Natal Artifact extra bonus
 */
export const getItemStats = (item: Item, isNatal: boolean = false) => {
  // Natal Artifact extra 50% bonus
  const natalMultiplier = isNatal ? 1.5 : 1;

  return {
    attack: item.effect?.attack
      ? Math.floor(item.effect.attack * natalMultiplier)
      : 0,
    defense: item.effect?.defense
      ? Math.floor(item.effect.defense * natalMultiplier)
      : 0,
    hp: item.effect?.hp
      ? Math.floor(item.effect.hp * natalMultiplier)
      : 0,
    exp: item.effect?.exp || 0, // exp not affected by multiplier
    spirit: item.effect?.spirit
      ? Math.floor(item.effect.spirit * natalMultiplier)
      : 0,
    physique: item.effect?.physique
      ? Math.floor(item.effect.physique * natalMultiplier)
      : 0,
    speed: item.effect?.speed
      ? Math.floor(item.effect.speed * natalMultiplier)
      : 0,
  };
};


// Generate attribute preview text
export const generateAttributePreview = (effect: Item['effect']): string => {
  if (!effect) return '';
  const attrs: string[] = [];
  if (effect.attack) attrs.push(`ATK+${effect.attack}`);
  if (effect.defense) attrs.push(`DEF+${effect.defense}`);
  if (effect.hp) attrs.push(`HP+${effect.hp}`);
  if (effect.spirit) attrs.push(`PER+${effect.spirit}`);
  if (effect.physique) attrs.push(`END+${effect.physique}`);
  if (effect.speed) attrs.push(`AGI+${effect.speed}`);
  if (effect.exp) attrs.push(`XP+${effect.exp}`);
  if (effect.lifespan) attrs.push(`DAYS+${effect.lifespan}`);
  return attrs.length > 0 ? ` [${attrs.join(' ')}]` : '';
};

// Calculate item sell price
export const calculateItemSellPrice = (item: Item): number => {
  const rarity = item.rarity || 'Common';
  const level = item.level || 0;

  // Base price (based on rarity)
  const basePrices: Record<ItemRarity, number> = {
    Common: 10,
    Rare: 50,
    Legendary: 300,
    Mythic: 2000,
    普通: 10,
    稀有: 50,
    传说: 300,
    仙品: 2000,
  };
  // Ensure basePrice has default value, prevent undefined
  const basePrice = basePrices[rarity] || 10;

  // Calculate attribute value
  let attributeValue = 0;
  // Ensure rarityMultiplier has default value, prevent undefined
  const rarityMultiplier = RARITY_MULTIPLIERS[rarity] || 1;

  // Temporary effect value (effect)
  if (item.effect) {
    const effect = item.effect;
    attributeValue += (effect.attack || 0) * 2; // Attack worth 2 spirit stones per point
    attributeValue += (effect.defense || 0) * 1.5; // Defense worth 1.5 spirit stones per point
    attributeValue += (effect.hp || 0) * 0.5; // HP worth 0.5 spirit stones per point
    attributeValue += (effect.spirit || 0) * 1.5; // Spirit worth 1.5 spirit stones per point
    attributeValue += (effect.physique || 0) * 1.5; // Physique worth 1.5 spirit stones per point
    attributeValue += (effect.speed || 0) * 2; // Speed worth 2 spirit stones per point
    attributeValue += (effect.exp || 0) * 0.1; // EXP worth 0.1 spirit stones per point (temporary effect)
  }

  // Permanent effect value (permanentEffect, more valuable)
  if (item.permanentEffect) {
    const permEffect = item.permanentEffect;
    attributeValue += (permEffect.attack || 0) * 10; // Permanent Attack worth 10 spirit stones per point
    attributeValue += (permEffect.defense || 0) * 8; // Permanent Defense worth 8 spirit stones per point
    attributeValue += (permEffect.maxHp || 0) * 3; // Permanent Max HP worth 3 spirit stones per point
    attributeValue += (permEffect.spirit || 0) * 8; // Permanent Spirit worth 8 spirit stones per point
    attributeValue += (permEffect.physique || 0) * 8; // Permanent Physique worth 8 spirit stones per point
    attributeValue += (permEffect.speed || 0) * 10; // Permanent Speed worth 10 spirit stones per point
  }

  // Apply rarity multiplier to attribute value (ensure not NaN)
  attributeValue = Math.floor((attributeValue || 0) * (rarityMultiplier || 1));

  // Equipment type item extra value bonus
  let equipmentBonus = 0;
  if (item.isEquippable) {
    // Equipment items have different base values based on type
    switch (item.type) {
      case ItemType.Weapon:
        equipmentBonus = (basePrice || 0) * 1.5; // Weapon extra 50% value
        break;
      case ItemType.Armor:
        equipmentBonus = (basePrice || 0) * 1.2; // Armor extra 20% value
        break;
      case ItemType.Artifact:
        equipmentBonus = (basePrice || 0) * 2; // Artifact extra 100% value
        break;
      case ItemType.Ring:
      case ItemType.Accessory:
        equipmentBonus = (basePrice || 0) * 1.3; // Ring and Accessory extra 30% value
        break;
    }
  }

  // Enhancement level bonus (20% value per level)
  const levelMultiplier = 1 + (level || 0) * 0.2;

  // Calculate final price (ensure all values are numbers)
  const totalValue =
    ((basePrice || 0) + (attributeValue || 0) + (equipmentBonus || 0)) * (levelMultiplier || 1);

  // Adjust based on item type (Consumables have lower value)
  let typeMultiplier = 1;
  if (item.type === ItemType.Herb || item.type === ItemType.Pill) {
    typeMultiplier = 0.5; // Consumables value halved
  } else if (item.type === ItemType.Material) {
    typeMultiplier = 0.3; // Materials value lower
  }

  // Final price (integer, minimum 1, ensure not NaN)
  const finalPrice = Math.max(1, Math.floor((totalValue || 0) * (typeMultiplier || 1)));
  // If calculation result is still NaN, return default value
  return isNaN(finalPrice) ? 1 : finalPrice;
};
