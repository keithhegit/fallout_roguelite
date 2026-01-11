/**
 * Item Generation Utility Functions
 * Support generating items based on type, rarity, and count
 */

import { Item, ItemType, ItemRarity, EquipmentSlot, LotteryPrize } from '../types';
import { ITEM_TEMPLATES, getItemTemplatesByType, getItemTemplatesByRarity, getItemTemplatesByTypeAndRarity } from '../constants/itemTemplates';
import { uid } from './gameUtils';

/**
 * Item Generation Options
 */
interface GenerateItemsOptions {
  type?: ItemType; // Item type, select from all types if not specified
  rarity?: ItemRarity; // Rarity, random by weight if not specified
  count: number; // Number of items to generate
  allowDuplicates?: boolean; // Whether to allow duplicates
  realm?: 'QiRefining' | 'Foundation' | 'GoldenCore' | 'NascentSoul' | 'SpiritSevering' | 'DaoCombining' | 'LongevityRealm'; // Realm, used for adjusting stats
  realmLevel?: number; // Realm level, used for adjusting stats
}

/**
 * Get weight by rarity
 */
function getRarityWeight(rarity: ItemRarity): number {
  const weights: Record<ItemRarity, number> = {
    Common: 40,
    Rare: 30,
    Legendary: 20,
    Mythic: 10,
  };
  return weights[rarity] || 0;
}

/**
 * Randomly select rarity based on weight
 */
function randomRarityByWeight(): ItemRarity {
  const rarities: ItemRarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];
  const totalWeight = rarities.reduce((sum, rarity) => sum + getRarityWeight(rarity), 0);

  let random = Math.random() * totalWeight;
  for (const rarity of rarities) {
    random -= getRarityWeight(rarity);
    if (random <= 0) {
      return rarity;
    }
  }

  return 'Common';
}

/**
 * Adjust item stats based on realm
 * Optimization: Reduce multiplier growth, consistent with equipment adjustment, prevent stat inflation
 */
function adjustStatsByRealm(
  effect: Item['effect'],
  permanentEffect: Item['permanentEffect'],
  realm: string,
  realmLevel: number = 1
): { effect?: Item['effect']; permanentEffect?: Item['permanentEffect'] } {
  // Optimized realm multipliers: consistent with equipment adjustment
  // Changed from [1, 2, 4, 8, 16, 32, 64] to [1, 1.5, 2.5, 4, 6, 10, 16]
  const realmMultipliers: Record<string, number> = {
    QiRefining: 1,
    Foundation: 1.5,
    GoldenCore: 2.5,
    NascentSoul: 4,
    SpiritSevering: 6,
    DaoCombining: 10,
    LongevityRealm: 16,
  };

  const realmMultiplier = realmMultipliers[realm] || 1;
  // Reduce level bonus: from 10% to 8%, consistent with equipment adjustment
  const levelMultiplier = 1 + (realmLevel - 1) * 0.08;
  const totalMultiplier = realmMultiplier * levelMultiplier;

  const adjusted: Item['effect'] = {};
  const adjustedPermanent: Item['permanentEffect'] = {};

  // Adjust temporary effects
  if (effect) {
    if (effect.attack) adjusted.attack = Math.floor(effect.attack * totalMultiplier);
    if (effect.defense) adjusted.defense = Math.floor(effect.defense * totalMultiplier);
    if (effect.hp) adjusted.hp = Math.floor(effect.hp * totalMultiplier);
    if (effect.spirit) adjusted.spirit = Math.floor(effect.spirit * totalMultiplier);
    if (effect.physique) adjusted.physique = Math.floor(effect.physique * totalMultiplier);
    if (effect.speed) adjusted.speed = Math.floor(effect.speed * totalMultiplier);
    if (effect.exp) adjusted.exp = Math.floor(effect.exp * totalMultiplier);
    if (effect.lifespan) adjusted.lifespan = effect.lifespan; // Lifespan not affected by realm adjustment
  }

  // Adjust permanent effects
  if (permanentEffect) {
    if (permanentEffect.attack) adjustedPermanent.attack = Math.floor(permanentEffect.attack * totalMultiplier);
    if (permanentEffect.defense) adjustedPermanent.defense = Math.floor(permanentEffect.defense * totalMultiplier);
    if (permanentEffect.spirit) adjustedPermanent.spirit = Math.floor(permanentEffect.spirit * totalMultiplier);
    if (permanentEffect.physique) adjustedPermanent.physique = Math.floor(permanentEffect.physique * totalMultiplier);
    if (permanentEffect.speed) adjustedPermanent.speed = Math.floor(permanentEffect.speed * totalMultiplier);
    if (permanentEffect.maxHp) adjustedPermanent.maxHp = Math.floor(permanentEffect.maxHp * totalMultiplier);
    if (permanentEffect.maxLifespan) adjustedPermanent.maxLifespan = permanentEffect.maxLifespan; // Max lifespan not affected by realm adjustment

    if (permanentEffect.spiritualRoots) {
      adjustedPermanent.spiritualRoots = {};
      const roots = permanentEffect.spiritualRoots;
      if (roots.metal) adjustedPermanent.spiritualRoots.metal = Math.floor(roots.metal * totalMultiplier);
      if (roots.wood) adjustedPermanent.spiritualRoots.wood = Math.floor(roots.wood * totalMultiplier);
      if (roots.water) adjustedPermanent.spiritualRoots.water = Math.floor(roots.water * totalMultiplier);
      if (roots.fire) adjustedPermanent.spiritualRoots.fire = Math.floor(roots.fire * totalMultiplier);
      if (roots.earth) adjustedPermanent.spiritualRoots.earth = Math.floor(roots.earth * totalMultiplier);
    }
  }

  return {
    effect: Object.keys(adjusted).length > 0 ? adjusted : effect,
    permanentEffect: Object.keys(adjustedPermanent).length > 0 ? adjustedPermanent : permanentEffect,
  };
}

/**
 * Generate Items
 * @param options Generation options
 * @returns Generated items array
 */
export function generateItems(options: GenerateItemsOptions): Item[] {
  const { type, rarity, count, allowDuplicates = true, realm, realmLevel = 1 } = options;

  // Get available item templates
  let availableTemplates = ITEM_TEMPLATES;

  if (type && rarity) {
    // Specify type and rarity
    availableTemplates = getItemTemplatesByTypeAndRarity(type, rarity);
  } else if (type) {
    // Only specify type
    availableTemplates = getItemTemplatesByType(type);
  } else if (rarity) {
    // Only specify rarity
    availableTemplates = getItemTemplatesByRarity(rarity);
  }

  // If no template found, return empty array
  if (availableTemplates.length === 0) {
    return [];
  }

  const generatedItems: Item[] = [];
  const usedIds = new Set<string>();
  const maxAttempts = count * 10; // Prevent infinite loop
  let attempts = 0;

  while (generatedItems.length < count && attempts < maxAttempts) {
    attempts++;

    // Randomly select a template
    const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];

    // If duplicates not allowed, check if already used
    if (!allowDuplicates && usedIds.has(template.id)) {
      continue;
    }

    // Deep copy template
    const item: Item = JSON.parse(JSON.stringify(template));

    // Generate new unique ID (use uid function to ensure uniqueness, not dependent on template id)
    item.id = uid();

    // If rarity not specified, randomly select based on weight
    if (!rarity) {
      item.rarity = randomRarityByWeight();
    }

    // Adjust stats based on realm
    if (realm) {
      const adjusted = adjustStatsByRealm(item.effect, item.permanentEffect, realm, realmLevel);
      item.effect = adjusted.effect;
      item.permanentEffect = adjusted.permanentEffect;
    }

    generatedItems.push(item);
    usedIds.add(template.id);
  }

  return generatedItems;
}

/**
 * Generate single item
 * @param options Generation config
 * @returns Generated item, or null if failed
 */
export function generateItem(options: Omit<GenerateItemsOptions, 'count'>): Item | null {
  const items = generateItems({ ...options, count: 1 });
  return items.length > 0 ? items[0] : null;
}

/**
 * Generate lottery prizes
 * @param options Generation config
 * @returns Generated lottery prizes array
 */
export function generateLotteryPrizes(options: Omit<GenerateItemsOptions, 'count'>): LotteryPrize[] {
  const item = generateItem(options);

  if (!item) {
    return [];
  }

  const weight = getRarityWeight(item.rarity);

  return [{
    id: `lottery-prize-${item.id}`,
    name: item.name,
    type: 'item',
    rarity: item.rarity,
    weight,
    value: {
      item,
    },
  }];
}

/**
 * Generate specified number of items for each type
 * @param types Item types array
 * @param rarity Rarity
 * @param count Count per type
 * @returns Generated items array
 */
export function generateItemsByTypes(
  types: ItemType[],
  rarity: ItemRarity,
  count: number
): Item[] {
  const items: Item[] = [];

  types.forEach(type => {
    const typeItems = generateItems({
      type,
      rarity,
      count,
      allowDuplicates: false,
    });
    items.push(...typeItems);
  });

  return items;
}

/**
 * Generate all rarity equipments
 * @param count Count per rarity
 * @returns Generated equipments array
 */
export function generateAllRarityEquipments(count: number = 10): Item[] {
  const rarities: ItemRarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];
  const types: ItemType[] = [ItemType.Weapon, ItemType.Armor, ItemType.Accessory, ItemType.Ring, ItemType.Artifact];

  const items: Item[] = [];

  types.forEach(type => {
    rarities.forEach(rarity => {
      const rarityItems = generateItems({
        type,
        rarity,
        count,
        allowDuplicates: false,
      });
      items.push(...rarityItems);
    });
  });

  return items;
}

/**
 * Generate all rarity pills
 * @param count Count per rarity
 * @returns Generated pills array
 */
export function generateAllRarityPills(count: number = 10): Item[] {
  const rarities: ItemRarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];

  const items: Item[] = [];

  rarities.forEach(rarity => {
    const rarityItems = generateItems({
      type: ItemType.Pill,
      rarity,
      count,
      allowDuplicates: false,
    });
    items.push(...rarityItems);
  });

  return items;
}

/**
 * Generate all rarity herbs
 * @param count Count per rarity
 * @returns Generated herbs array
 */
export function generateAllRarityHerbs(count: number = 10): Item[] {
  const rarities: ItemRarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];

  const items: Item[] = [];

  rarities.forEach(rarity => {
    const rarityItems = generateItems({
      type: ItemType.Herb,
      rarity,
      count,
      allowDuplicates: false,
    });
    items.push(...rarityItems);
  });

  return items;
}

/**
 * Generate all rarity materials
 * @param count Count per rarity
 * @returns Generated materials array
 */
export function generateAllRarityMaterials(count: number = 10): Item[] {
  const rarities: ItemRarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];

  const items: Item[] = [];

  rarities.forEach(rarity => {
    const rarityItems = generateItems({
      type: ItemType.Material,
      rarity,
      count,
      allowDuplicates: false,
    });
    items.push(...rarityItems);
  });

  return items;
}

/**
 * Generate all types of items (Equipment, Pills, Herbs, Materials)
 * @param count Count per type and rarity
 * @returns Generated items array
 */
export function generateAllItems(count: number = 10): Item[] {
  return [
    ...generateAllRarityEquipments(count),
    ...generateAllRarityPills(count),
    ...generateAllRarityHerbs(count),
    ...generateAllRarityMaterials(count),
  ];
}
