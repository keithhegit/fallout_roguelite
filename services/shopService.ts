import { ShopItem, ShopType, ItemType, ItemRarity, EquipmentSlot, RealmType } from '../types';
import { REALM_ORDER, getPillDefinition, FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS } from '../constants/index';
import { uid } from '../utils/gameUtils';
import { getItemFromConstants } from '../utils/itemConstantsUtils';
import { ITEM_TEMPLATES } from '../constants/itemTemplates';
import { generateItems } from '../utils/itemGenerator';

/**
 * Get item from constants and add shop pricing information
 */
function createShopItemFromConstants(
  itemName: string,
  price: number,
  sellPrice: number,
  minRealm?: RealmType
): Omit<ShopItem, 'id'> {
  const itemFromConstants = getItemFromConstants(itemName);
  if (!itemFromConstants) {
    throw new Error(`Item ${itemName} not found in constants`);
  }
  return {
    name: itemFromConstants.name,
    type: itemFromConstants.type,
    description: itemFromConstants.description,
    rarity: itemFromConstants.rarity,
    price,
    sellPrice,
    effect: itemFromConstants.effect,
    permanentEffect: itemFromConstants.permanentEffect,
    isEquippable: itemFromConstants.isEquippable,
    equipmentSlot: itemFromConstants.equipmentSlot as EquipmentSlot | undefined,
    minRealm,
  };
}

// Shop Item Templates (all items retrieved from constants)
const SHOP_ITEM_TEMPLATES: Record<ShopType, Array<Omit<ShopItem, 'id'>>> = {
  [ShopType.Village]: [
    createShopItemFromConstants('Dirty Bandage', 10, 3),
    createShopItemFromConstants('Scrap Metal', 15, 5),
    (() => {
      const item = createShopItemFromConstants('Mentats', 30, 10);
      return item;
    })(),
    createShopItemFromConstants('Rusty Pipe', 50, 15), // Use name from constants
    // Stimpak might not be in base constants (recipe result), check if exists
    ...(getItemFromConstants('Stimpak') ? [createShopItemFromConstants('Stimpak', 20, 7)] : []),
  ],
  [ShopType.City]: [
    // Only add items existing in constants
    ...(getItemFromConstants('Energy Bloom') ? [createShopItemFromConstants('Energy Bloom', 80, 25)] : []),
    ...(getItemFromConstants('Buffout') ? [createShopItemFromConstants('Buffout', 150, 50)] : []),
    // Hardened Sword might not be in constants if not generated, skip if missing
    ...(getItemFromConstants('Hardened Sword') ? [createShopItemFromConstants('Hardened Sword', 200, 60)] : []),
    ...(getItemFromConstants('Clarity Shot') ? [createShopItemFromConstants('Clarity Shot', 120, 40)] : []),
    ...(getItemFromConstants('Hardening Serum') ? [createShopItemFromConstants('Hardening Serum', 120, 40)] : []),
    // Scrap Metal for upgrades
    ...(getItemFromConstants('Scrap Metal') ? [createShopItemFromConstants('Scrap Metal', 50, 15)] : []),
  ],
  [ShopType.Sect]: [
    ...(getItemFromConstants('Concentrated Core') ? [createShopItemFromConstants('Concentrated Core', 1000, 300)] : []),
    // Mutant Core
    ...(getItemFromConstants('Mutant Core') ? [createShopItemFromConstants('Mutant Core', 500, 150)] : []),
    ...(getItemFromConstants('Clarity Shot') ? [createShopItemFromConstants('Clarity Shot', 200, 60)] : []),
    ...(getItemFromConstants('Hardening Serum') ? [createShopItemFromConstants('Hardening Serum', 200, 60)] : []),
  ],
  [ShopType.BlackMarket]: [], // 黑市物品从高级物品池中随机生成
  [ShopType.LimitedTime]: [], // 限时商店物品从所有物品池中随机生成，带折扣
  [ShopType.Reputation]: [], // 声望商店物品需要声望值解锁
};

// Premium Item Templates (small chance to appear on refresh, also used by Black Market)
// Only contains items present in constants, special items (like "Overseer's Peacekeeper") can remain hardcoded
const PREMIUM_ITEM_TEMPLATES: Array<Omit<ShopItem, 'id'>> = [
  // Get items from constants
  ...(getItemFromConstants('Bio-Ginseng') ? [createShopItemFromConstants('Bio-Ginseng', 2000, 600)] : []),
  ...(getItemFromConstants('Plasma Sword') ? [createShopItemFromConstants('Plasma Sword', 5000, 1500, RealmType.QiRefining)] : []),
  ...(getItemFromConstants('Apex Fusion Shot') ? [createShopItemFromConstants('Apex Fusion Shot', 3000, 900)] : []),
  ...(getItemFromConstants('Titan Armor') ? [createShopItemFromConstants('Titan Armor', 4000, 1200, RealmType.QiRefining)] : []),
  ...(getItemFromConstants('Pristine Flora') ? [createShopItemFromConstants('Pristine Flora', 10000, 3000)] : []),
  ...(getItemFromConstants('Nova Core Serum') ? [createShopItemFromConstants('Nova Core Serum', 15000, 4500)] : []),
  // Special Items (Hardcoded)
  {
    name: "Overseer's Peacekeeper",
    type: ItemType.Weapon,
    description: "The personal sidearm of a legendary Vault Overseer. It has seen better days, but the internal mechanisms are pristine (and modified).",
    rarity: 'Mythic' as ItemRarity,
    price: 999999,
    sellPrice: 999999,
    isEquippable: true,
    equipmentSlot: EquipmentSlot.Weapon,
    effect: { attack: 100000, physique: 100000, spirit: 100000, hp: 100000, speed: 100000 },
    reviveChances: 5,
    minRealm: RealmType.QiRefining,
  },
].filter(Boolean); // Filter out undefined

// Reputation Shop Templates
// Only include items from constants
const REPUTATION_SHOP_TEMPLATES: Array<Omit<ShopItem, 'id'>> = [
  ...(getItemFromConstants('Code Fragment') ? [createShopItemFromConstants('Code Fragment', 50000, 50000)] : []),
  ...(getItemFromConstants('Origin Fluid') ? [createShopItemFromConstants('Origin Fluid', 20000, 6000)] : []),
  ...(getItemFromConstants('Titan Blood Serum') ? [createShopItemFromConstants('Titan Blood Serum', 30000, 9000)] : []),
  ...(getItemFromConstants('Fiery Feather') ? [createShopItemFromConstants('Fiery Feather', 30000, 9000)] : []),
  ...(getItemFromConstants('Chaos Core') ? [createShopItemFromConstants('Chaos Core', 30000, 9000)] : []),
].filter(Boolean); // Filter out undefined

// 从 ITEM_TEMPLATES 生成商店物品模板
const GENERATED_SHOP_ITEMS: Array<Omit<ShopItem, 'id'>> = [];
const itemTypes: ItemType[] = [ItemType.Weapon, ItemType.Armor, ItemType.Accessory, ItemType.Ring, ItemType.Artifact, ItemType.Pill, ItemType.Herb, ItemType.Material];
const rarities: ItemRarity[] = ['Common', 'Rare', 'Legendary', 'Mythic'];

// Generate items names for each type and rarity
itemTypes.forEach(type => {
  rarities.forEach(rarity => {
    const items = generateItems({
      type,
      rarity,
      count: 5, // Generate 5 items for each type and rarity for the shop
      allowDuplicates: false,
    });

    items.forEach(item => {
      // Set price based on rarity
      let price = 100;
      let sellPrice = 30;
      let minRealm: RealmType | undefined;

      switch (rarity) {
        case 'Common':
          price = 50 + Math.floor(Math.random() * 100);
          sellPrice = Math.floor(price * 0.3);
          break;
        case 'Rare':
          price = 200 + Math.floor(Math.random() * 300);
          sellPrice = Math.floor(price * 0.3);
          minRealm = RealmType.QiRefining;
          break;
        case 'Legendary':
          price = 1000 + Math.floor(Math.random() * 2000);
          sellPrice = Math.floor(price * 0.25);
          minRealm = RealmType.Foundation;
          break;
        case 'Mythic':
          price = 5000 + Math.floor(Math.random() * 10000);
          sellPrice = Math.floor(price * 0.2);
          minRealm = RealmType.GoldenCore;
          break;
      }

      // Adjust price based on item type
      if (type === ItemType.Weapon || type === ItemType.Armor) {
        price = Math.floor(price * 1.5);
        sellPrice = Math.floor(price * 0.3);
      } else if (type === ItemType.Artifact) {
        price = Math.floor(price * 2);
        sellPrice = Math.floor(price * 0.25);
      }

      GENERATED_SHOP_ITEMS.push({
        name: item.name,
        type: item.type as ItemType,
        description: item.description,
        rarity: item.rarity,
        price,
        sellPrice,
        effect: item.effect,
        permanentEffect: item.permanentEffect,
        isEquippable: item.isEquippable,
        equipmentSlot: item.equipmentSlot as EquipmentSlot | undefined,
        minRealm,
      });
    });
  });
});

/**
 * Generate Shop Items
 * @param shopType Shop Type
 * @param playerRealm Player Realm
 * @param includePremium Whether to include premium items (small chance on refresh)
 * @returns Generated shop item list
 */
export function generateShopItems(
  shopType: ShopType,
  playerRealm: RealmType,
  includePremium: boolean = false
): ShopItem[] {
  const playerRealmIndex = REALM_ORDER.indexOf(playerRealm);
  const items: ShopItem[] = [];
  const usedNames = new Set<string>();

  // Black Market: Only generates premium items, 3-5 items, higher rarity, may include advanced items
  if (shopType === ShopType.BlackMarket) {
    // Check if premium item templates are empty
    if (PREMIUM_ITEM_TEMPLATES.length === 0) {
      return items; // Return empty array if no templates available
    }

    const itemCount = 3 + Math.floor(Math.random() * 3); // 3-5个
    let advancedItemAdded = false; // Prevent duplicate advanced items

    // 70% chance for premium items, 30% chance for Legendary/Mythic items
    for (let i = 0; i < itemCount; i++) {
      let template: Omit<ShopItem, 'id'> | undefined;

      // 15% chance for advanced items (max one per Black Market refresh)
      if (!advancedItemAdded && Math.random() < 0.15) {
        const currentRealmIndex = playerRealmIndex;

        // Select advanced item based on realm
        if (currentRealmIndex <= REALM_ORDER.indexOf(RealmType.Foundation)) {
          // Foundation Treasures
          const treasures = Object.values(FOUNDATION_TREASURES);
          if (treasures.length > 0) {
            const selected = treasures[Math.floor(Math.random() * treasures.length)];
            template = {
              name: selected.name,
              type: ItemType.Material,
              description: selected.description,
              rarity: selected.rarity as ItemRarity,
              price: 200000 + Math.floor(Math.random() * 200000), // 200k-400k Spirit Stones (4x price)
              sellPrice: 60000,
              isAdvancedItem: true,
              advancedItemType: 'foundationTreasure',
              minRealm: RealmType.QiRefining,
            };
            advancedItemAdded = true;
          }
        } else if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.GoldenCore) &&
          currentRealmIndex <= REALM_ORDER.indexOf(RealmType.NascentSoul)) {
          // Heaven Earth Essences
          const essences = Object.values(HEAVEN_EARTH_ESSENCES);
          if (essences.length > 0) {
            const selected = essences[Math.floor(Math.random() * essences.length)];
            template = {
              name: selected.name,
              type: ItemType.Material,
              description: selected.description,
              rarity: selected.rarity as ItemRarity,
              price: 800000 + Math.floor(Math.random() * 800000), // 800k-1.6m Spirit Stones (4x price)
              sellPrice: 240000,
              isAdvancedItem: true,
              advancedItemType: 'heavenEarthEssence',
              minRealm: RealmType.GoldenCore,
            };
            advancedItemAdded = true;
          }
        } else if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.SpiritSevering)) {
          // Heaven Earth Marrows
          const marrows = Object.values(HEAVEN_EARTH_MARROWS);
          if (marrows.length > 0) {
            const selected = marrows[Math.floor(Math.random() * marrows.length)];
            template = {
              name: selected.name,
              type: ItemType.Material,
              description: selected.description,
              rarity: selected.rarity as ItemRarity,
              price: 2000000 + Math.floor(Math.random() * 2000000), // 2m-4m Spirit Stones (4x price)
              sellPrice: 600000,
              isAdvancedItem: true,
              advancedItemType: 'heavenEarthMarrow',
              minRealm: RealmType.SpiritSevering,
            };
            advancedItemAdded = true;
          }
        }
      }

      // If no advanced item selected, choose from normal item pool
      if (!template) {
        if (Math.random() < 0.3) {
          // 30% chance to choose from premium item pool
          template = PREMIUM_ITEM_TEMPLATES[
            Math.floor(Math.random() * PREMIUM_ITEM_TEMPLATES.length)
          ];
        } else {
          // 70% chance to choose Rare/Legendary items from all shop pools
          const allTemplates = [
            ...SHOP_ITEM_TEMPLATES[ShopType.Village],
            ...SHOP_ITEM_TEMPLATES[ShopType.City],
            ...SHOP_ITEM_TEMPLATES[ShopType.Sect],
          ].filter(t => t && (t.rarity === 'Rare' || t.rarity === 'Legendary'));

          if (allTemplates.length === 0) {
            template = PREMIUM_ITEM_TEMPLATES[
              Math.floor(Math.random() * PREMIUM_ITEM_TEMPLATES.length)
            ];
          } else {
            template = allTemplates[Math.floor(Math.random() * allTemplates.length)];
          }
        }
      }

      // Ensure template exists
      if (!template) {
        continue;
      }

      // Check realm requirements
      if (!template.minRealm ||
        playerRealmIndex >= REALM_ORDER.indexOf(template.minRealm)) {
        items.push({
          ...template,
          id: `shop-blackmarket-${uid()}`,
        });
      }
    }
    return items;
  }

  // Limited Time Shop: Randomly select from all item pools, 5-7 items
  if (shopType === ShopType.LimitedTime) {
    const itemCount = 5 + Math.floor(Math.random() * 3); // 5-7 items
    const allTemplates = [
      ...SHOP_ITEM_TEMPLATES[ShopType.Village],
      ...SHOP_ITEM_TEMPLATES[ShopType.City],
      ...SHOP_ITEM_TEMPLATES[ShopType.Sect],
      ...PREMIUM_ITEM_TEMPLATES,
      ...GENERATED_SHOP_ITEMS, // Add generated items
    ].filter(Boolean); // Filter out undefined items

    // Check if template array is empty
    if (allTemplates.length === 0) {
      return items; // Return empty array if no templates available
    }

    for (let i = 0; i < itemCount; i++) {
      // If all items used, break early
      if (usedNames.size >= allTemplates.length) {
        break;
      }

      let attempts = 0;
      let template = allTemplates[Math.floor(Math.random() * allTemplates.length)];

      // Ensure template exists
      if (!template) {
        continue;
      }

      while (template && usedNames.has(template.name) && attempts < 20 && usedNames.size < allTemplates.length) {
        template = allTemplates[Math.floor(Math.random() * allTemplates.length)];
        attempts++;
      }

      // Re-check if template exists
      if (!template) {
        continue;
      }

      usedNames.add(template.name);

      // Check realm requirements
      if (!template.minRealm ||
        playerRealmIndex >= REALM_ORDER.indexOf(template.minRealm)) {
        items.push({
          ...template,
          id: `shop-limited-${uid()}`,
        });
      }
    }
    return items;
  }

  // Reputation Shop: Generate from Reputation Shop templates
  if (shopType === ShopType.Reputation) {
    // Merge Reputation Shop templates and generated items
    const allTemplates = [
      ...REPUTATION_SHOP_TEMPLATES,
      ...GENERATED_SHOP_ITEMS.filter(item => item.rarity === 'Legendary' || item.rarity === 'Mythic'),
    ];

    // Check if template array is empty
    if (allTemplates.length === 0) {
      return items; // Return empty array if no templates available
    }

    const itemCount = 4 + Math.floor(Math.random() * 3); // 4-6 items

    for (let i = 0; i < itemCount; i++) {
      // If all items used, break early
      if (usedNames.size >= allTemplates.length) {
        break;
      }

      let attempts = 0;
      let template = allTemplates[Math.floor(Math.random() * allTemplates.length)];

      // Ensure template exists
      if (!template) {
        continue;
      }

      while (template && usedNames.has(template.name) && attempts < 10 && usedNames.size < allTemplates.length) {
        template = allTemplates[Math.floor(Math.random() * allTemplates.length)];
        attempts++;
      }

      // Re-check if template exists
      if (!template) {
        continue;
      }

      usedNames.add(template.name);

      // Check realm requirements
      if (!template.minRealm ||
        playerRealmIndex >= REALM_ORDER.indexOf(template.minRealm)) {
        items.push({
          ...template,
          id: `shop-reputation-${uid()}`,
        });
      }
    }
    return items;
  }

  // Regular Shops (Village, City, Sect)
  const templates = SHOP_ITEM_TEMPLATES[shopType].filter(Boolean); // Filter out undefined items

  // Check if template array is empty
  if (templates.length === 0) {
    return items; // Return empty array if no templates available
  }

  const baseCount = shopType === ShopType.Village ? 3 : shopType === ShopType.City ? 4 : 5;
  const maxCount = shopType === ShopType.Village ? 5 : shopType === ShopType.City ? 6 : 7;
  const itemCount = baseCount + Math.floor(Math.random() * (maxCount - baseCount + 1));

  // Generate base items
  for (let i = 0; i < itemCount; i++) {
    // If all items used, break early
    if (usedNames.size >= templates.length) {
      break;
    }

    let attempts = 0;
    let template = templates[Math.floor(Math.random() * templates.length)];

    // Ensure template exists
    if (!template) {
      continue;
    }

    // Avoid duplicates, max 10 attempts
    while (template && usedNames.has(template.name) && attempts < 10 && usedNames.size < templates.length) {
      template = templates[Math.floor(Math.random() * templates.length)];
      attempts++;
    }

    // Re-check if template exists
    if (!template) {
      continue;
    }

    usedNames.add(template.name);

    // Check realm requirements
    if (template.minRealm) {
      const templateRealmIndex = REALM_ORDER.indexOf(template.minRealm);
      if (playerRealmIndex < templateRealmIndex) {
        continue; // Skip items with insufficient realm
      }
    }

    items.push({
      ...template,
      id: `shop-${shopType}-${uid()}`,
    });
  }

  // If premium items enabled and random success (10% chance), add one premium item
  if (includePremium && Math.random() < 0.1 && PREMIUM_ITEM_TEMPLATES.length > 0) {
    const premiumTemplate = PREMIUM_ITEM_TEMPLATES[
      Math.floor(Math.random() * PREMIUM_ITEM_TEMPLATES.length)
    ];

    // Ensure premiumTemplate exists
    if (premiumTemplate) {
      // Check realm requirements
      if (!premiumTemplate.minRealm ||
        playerRealmIndex >= REALM_ORDER.indexOf(premiumTemplate.minRealm)) {
        items.push({
          ...premiumTemplate,
          id: `shop-premium-${uid()}`,
        });
      }
    }
  }

  return items;
}
