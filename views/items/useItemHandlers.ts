import React from 'react';
import { PlayerStats, Item, Pet, ItemType, ItemRarity, RealmType } from '../../types';
import { PET_TEMPLATES, DISCOVERABLE_RECIPES, getRandomPetName, REALM_ORDER,} from '../../constants/index';
import { uid } from '../../utils/gameUtils';
import { showConfirm } from '../../utils/toastUtils';
import { LOOT_ITEMS } from '../../services/battleService';
import { compareItemEffects } from '../../utils/objectUtils';
import { getPlayerTotalStats } from '../../utils/statUtils';

interface UseItemHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
  onOpenTreasureVault?: () => void; // Callback to open Sect Vault modal
}

/**
 * Helper function: Apply single item effect
 * Extract core logic for reuse, reduce duplication in handleUseItem and handleBatchUseItems
 */
const applyItemEffect = (
  prev: PlayerStats,
  item: Item,
  options: {
    addLog: (message: string, type?: string) => void;
    setItemActionLog?: (log: { text: string; type: string } | null) => void;
    isBatch?: boolean;
  }
): PlayerStats => {
  const { addLog, setItemActionLog, isBatch = false } = options;

  // Clone base data
  const newStats = { ...prev };
  const newInv = prev.inventory
    .map((i) => {
      if (i.id === item.id) return { ...i, quantity: i.quantity - 1 };
      return i;
    })
    .filter((i) => i.quantity > 0);
  const newPets = [...prev.pets];
  const effectLogs: string[] = [];

  // 1. Handle Inheritance Stone (Special Item) - Inheritance path feature removed, only increases inheritance level
  const isInheritanceStone = item.name === 'Inheritance Stone';
  if (isInheritanceStone) {
    addLog(`✨ Used Inheritance Stone. Inheritance Level +1!`, 'special');
    return {
      ...newStats,
      inventory: newInv,
      pets: newPets,
      inheritanceLevel: (prev.inheritanceLevel || 0) + 1,
    };
  }

  // 2. Handle Spirit Pet Egg hatching
  const isPetEgg =
    item.name.includes('Egg') ||
    item.name.toLowerCase().includes('egg') ||
    item.name.includes('Spirit Beast Egg') ||
    item.name.includes('Spirit Pet Egg') ||
    (item.description &&
      (item.description.includes('Hatch') ||
        item.description.includes('Spirit Pet') ||
        item.description.includes('Spirit Beast') ||
        item.description.includes('Pet')));

  if (isPetEgg) {
    const availablePets = PET_TEMPLATES.filter((t) => {
      if (item.rarity === 'Common') return t.rarity === 'Common' || t.rarity === 'Rare';
      if (item.rarity === 'Rare') return t.rarity === 'Rare' || t.rarity === 'Legendary';
      if (item.rarity === 'Legendary') return t.rarity === 'Legendary' || t.rarity === 'Mythic';
      if (item.rarity === 'Mythic') return t.rarity === 'Mythic';
      return true;
    });

    if (availablePets.length > 0) {
      const randomTemplate = availablePets[Math.floor(Math.random() * availablePets.length)];
      const newPet: Pet = {
        id: uid(),
        name: getRandomPetName(randomTemplate),
        species: randomTemplate.species,
        level: 1,
        exp: 0,
        maxExp: 60,
        rarity: randomTemplate.rarity,
        stats: { ...randomTemplate.baseStats },
        skills: [...randomTemplate.skills],
        evolutionStage: 0,
        affection: 50,
      };
      newPets.push(newPet);
      const logMsg = `✨ Hatched Spirit Pet [${newPet.name}]!`;
      effectLogs.push(logMsg);
      if (!isBatch) {
        addLog(`🎉 Successfully hatched ${item.name} and obtained Spirit Pet [${newPet.name}]!`, 'special');
      }
    } else {
      const logMsg = 'But nothing seems to have hatched...';
      effectLogs.push(logMsg);
      if (!isBatch) addLog(`You tried to hatch ${item.name}, but nothing happened...`, 'normal');
    }
  }

  // 3. Handle temporary effects
  if (item.effect?.hp) {
    // Use actual max HP (including Golden Core method bonus, etc.) as limit
    const totalStats = getPlayerTotalStats(newStats);
    const actualMaxHp = totalStats.maxHp;
    newStats.hp = Math.min(actualMaxHp, newStats.hp + item.effect.hp);
    effectLogs.push(`Recovered ${item.effect.hp} HP.`);
  }
  if (item.effect?.exp) {
    newStats.exp += item.effect.exp;
    effectLogs.push(`Gained ${item.effect.exp} Exp.`);
  }
  if (item.effect?.lifespan) {
    const currentLifespan = newStats.lifespan ?? newStats.maxLifespan ?? 100;
    const maxLifespan = newStats.maxLifespan ?? 100;
    const lifespanIncrease = item.effect.lifespan;

    // Fix: Normal effect lifespan increase should not exceed current limit
    const nextLifespan = Math.min(maxLifespan, currentLifespan + lifespanIncrease);

    // Ensure lifespan doesn't decrease due to normal effects (unless increase is negative, but usually positive)
    newStats.lifespan = Math.max(newStats.lifespan ?? 0, nextLifespan);
    effectLogs.push(`Lifespan increased by ${lifespanIncrease} years.`);
  }

  // 4. Handle permanent effects (Equipment types shouldn't have permanent effects, only consumables like pills)
  if (item.permanentEffect && !item.isEquippable) {
    const permLogs: string[] = [];
    const pe = item.permanentEffect;
    if (pe.attack) { newStats.attack += pe.attack; permLogs.push(`Permanent Attack +${pe.attack}`); }
    if (pe.defense) { newStats.defense += pe.defense; permLogs.push(`Permanent Defense +${pe.defense}`); }
    if (pe.spirit) { newStats.spirit += pe.spirit; permLogs.push(`Permanent Spirit +${pe.spirit}`); }
    if (pe.physique) { newStats.physique += pe.physique; permLogs.push(`Permanent Physique +${pe.physique}`); }
    if (pe.speed) { newStats.speed += pe.speed; permLogs.push(`Permanent Speed +${pe.speed}`); }
    if (pe.maxHp) {
      newStats.maxHp += pe.maxHp;
      newStats.hp += pe.maxHp;
      permLogs.push(`Permanent Max HP +${pe.maxHp}`);
    }
    if (pe.maxLifespan) {
      newStats.maxLifespan = (newStats.maxLifespan ?? 100) + pe.maxLifespan;
      newStats.lifespan = Math.min(
        newStats.maxLifespan,
        (newStats.lifespan ?? newStats.maxLifespan ?? 100) + pe.maxLifespan
      );
      permLogs.push(`Permanent Max Lifespan +${pe.maxLifespan} Years`);
    }
    if (pe.spiritualRoots) {
      const rootNames: Record<string, string> = { metal: 'Metal', wood: 'Wood', water: 'Water', fire: 'Fire', earth: 'Earth' };
      const rootChanges: string[] = [];
      // Ensure spiritualRoots object exists and is initialized
      if (!newStats.spiritualRoots) {
        newStats.spiritualRoots = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 };
      } else {
        newStats.spiritualRoots = { ...newStats.spiritualRoots };
      }

      if (Object.values(pe.spiritualRoots).every(v => v === 0 || v === undefined || v === null)) {
        const rootTypes: Array<keyof typeof rootNames> = ['metal', 'wood', 'water', 'fire', 'earth'];
        const randomRoot = rootTypes[Math.floor(Math.random() * rootTypes.length)];
        newStats.spiritualRoots[randomRoot] = Math.min(100, (newStats.spiritualRoots[randomRoot] || 0) + 5);
        rootChanges.push(`${rootNames[randomRoot]} Root +5`);
      } else {
        Object.entries(pe.spiritualRoots).forEach(([key, value]) => {
          // Handle undefined, null, and 0 cases
          const numValue = value ?? 0;
          if (numValue > 0) {
            const rootKey = key as keyof typeof newStats.spiritualRoots;
            const currentValue = newStats.spiritualRoots[rootKey] || 0;
            newStats.spiritualRoots[rootKey] = Math.min(100, currentValue + numValue);
            rootChanges.push(`${rootNames[key]} Root +${numValue}`);
          }
        });
      }
      if (rootChanges.length > 0) permLogs.push(`Spiritual Root Improvement: ${rootChanges.join(', ')}`);
    }
    if (permLogs.length > 0) effectLogs.push(`✨ ${permLogs.join(', ')}`);
  }

  // 4. Handle Material Pack (Use to obtain several pills of corresponding rarity)
  const isMaterialPack = item.name.includes('Material Pack');
  if (isMaterialPack) {
    // Determine rarity of pills to generate based on pack rarity
    const packRarity = item.rarity || 'Common';
    let targetRarity: ItemRarity = 'Common';

    // Pack rarity corresponds to generated pill rarity
    if (packRarity === 'Mythic') {
      targetRarity = 'Mythic';
    } else if (packRarity === 'Legendary') {
      targetRarity = 'Legendary';
    } else if (packRarity === 'Rare') {
      targetRarity = 'Rare';
    } else {
      targetRarity = 'Common';
    }

    // Filter from pills of corresponding rarity
    const allPills = LOOT_ITEMS.pills;
    let availablePills: Array<{
      name: string;
      type: ItemType;
      rarity: ItemRarity;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      effect?: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      permanentEffect?: any;
      description?: string;
    }> = allPills.filter(p => p.rarity === targetRarity);

    // If no pills of corresponding rarity found, downgrade search
    if (availablePills.length === 0 && targetRarity !== 'Common') {
      availablePills = allPills.filter(p => p.rarity === 'Common');
    }

    // If still none, get from herbs (herbs can also be pill materials)
    if (availablePills.length === 0) {
      const allHerbs = LOOT_ITEMS.herbs;
      availablePills = allHerbs.filter(h => h.rarity === targetRarity || targetRarity === 'Common').map(h => ({
        name: h.name,
        type: ItemType.Pill, // Force set to Pill type, as material pack should generate pills
        rarity: h.rarity,
        effect: h.effect,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        permanentEffect: (h as any).permanentEffect,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        description: (h as any).description,
      }));
    }

    // If still empty, use default pill
    if (availablePills.length === 0) {
      // Create a default pill as backup
      availablePills = [{
        name: 'Qi Gathering Pill',
        type: ItemType.Pill,
        rarity: 'Common' as ItemRarity,
        effect: { exp: 50 },
        permanentEffect: { spirit: 1 },
        description: 'Basic Qi Gathering Pill, restores a small amount of Exp.',
      }];
    }

    // Generate 3-6 random pills
    const pillCount = 3 + Math.floor(Math.random() * 4); // 3-6
    const obtainedPills: Item[] = [];
    const pillNames = new Set<string>();

    for (let i = 0; i < pillCount && availablePills.length > 0; i++) {
      const randomPill = availablePills[Math.floor(Math.random() * availablePills.length)];
      const pillName = randomPill.name;

      // Avoid duplicates (allow small amount of duplicates if pill pool is not large enough)
      if (!pillNames.has(pillName) || pillNames.size >= availablePills.length) {
        pillNames.add(pillName);
        const quantity = 1 + Math.floor(Math.random() * 3); // 1-3 per pill
        obtainedPills.push({
          id: uid(),
          name: pillName,
          type: ItemType.Pill, // Force set to Pill type to ensure correct type
          description: randomPill.description || `${pillName}, obtained from Material Pack.`,
          quantity,
          rarity: randomPill.rarity,
          effect: randomPill.effect,
          permanentEffect: randomPill.permanentEffect,
        });
      }
    }

    // Add obtained pills to inventory
    obtainedPills.forEach(pill => {
      // Check if same pill exists in inventory (match by name, type, rarity, effect)
      // Use optimized deep compare function instead of JSON.stringify for better performance
      const existingIndex = newInv.findIndex(
        i => i.name === pill.name &&
        i.type === pill.type &&
        i.rarity === pill.rarity &&
        compareItemEffects(i.effect, pill.effect, i.permanentEffect, pill.permanentEffect)
      );

      if (existingIndex >= 0) {
        newInv[existingIndex].quantity += pill.quantity;
      } else {
        newInv.push(pill);
      }
    });

    if (obtainedPills.length > 0) {
      const pillList = obtainedPills.map(p => `${p.name} x${p.quantity}`).join(', ');
      effectLogs.push(`✨ Obtained: ${pillList}`);
      if (!isBatch) {
        addLog(`You opened ${item.name} and obtained: ${pillList}`, 'gain');
      }
    } else {
      if (!isBatch) {
        addLog(`You opened ${item.name}, but it seems empty...`, 'normal');
      }
    }
  }

  // 5. Handle Recipe use
  if (item.type === ItemType.Recipe) {
    let recipeName = item.recipeData?.name || item.name.replace(/ Recipe$/, '');
    if (!item.recipeData) {
      const matched = DISCOVERABLE_RECIPES.find(r => r.name === recipeName);
      if (matched) recipeName = matched.name;
    }

    if (recipeName) {
      newStats.unlockedRecipes = [...(newStats.unlockedRecipes || [])];
      if (newStats.unlockedRecipes.includes(recipeName)) {
        if (!isBatch) addLog(`You have already learned the recipe for [${recipeName}].`, 'normal');
      } else {
        const recipeExists = DISCOVERABLE_RECIPES.some(r => r.name === recipeName);
        if (!recipeExists) {
          if (!isBatch) addLog(`Recipe for [${recipeName}] does not exist, cannot learn.`, 'danger');
        } else {
          newStats.unlockedRecipes.push(recipeName);
          const stats = { ...(newStats.statistics || { killCount: 0, meditateCount: 0, adventureCount: 0, equipCount: 0, petCount: 0, recipeCount: 0, artCount: 0, breakthroughCount: 0, secretRealmCount: 0 }) };
          newStats.statistics = { ...stats, recipeCount: newStats.unlockedRecipes.length };
          effectLogs.push(`✨ Learned recipe for [${recipeName}]!`);
          if (!isBatch) {
            addLog(`You studied [${item.name}] and learned the recipe for [${recipeName}]!`, 'special');
          }
        }
      }
    } else if (!isBatch) {
      addLog(`Cannot identify recipe name from [${item.name}].`, 'danger');
    }
  }

  // 5. Show use log (Not pet egg or recipe)
  if (!isPetEgg && item.type !== ItemType.Recipe) {
    if (item.type === ItemType.Pill || effectLogs.length > 0) {
      const logMessage = effectLogs.length > 0
        ? `You used ${item.name}. ${effectLogs.join(' ')}`
        : `You used ${item.name}.`;

      if (!isBatch) addLog(logMessage, 'gain');
      if (setItemActionLog) setItemActionLog({ text: logMessage, type: 'gain' });
    }
  } else if (item.type === ItemType.Recipe && effectLogs.length > 0) {
    const logMessage = effectLogs[0];
    if (setItemActionLog) setItemActionLog({ text: logMessage, type: 'special' });
  }

  return { ...newStats, inventory: newInv, pets: newPets };
};

/**
 * Organize inventory logic
 */
const organizeInventory = (player: PlayerStats): Item[] => {
  const inventory = [...player.inventory];
  const equippedIds = new Set(Object.values(player.equippedItems).filter(Boolean) as string[]);

  // 1. Merge stackable items
  const mergedInventory: Item[] = [];
  const stackMap = new Map<string, Item>();

  for (const item of inventory) {
    // Equipped items are not merged, kept directly
    if (equippedIds.has(item.id)) {
      mergedInventory.push(item);
      continue;
    }

    // Generate unique identifier to check stackability
    const itemKey = `${item.name}-${item.type}-${item.rarity || 'Common'}-${item.level || 0}-${JSON.stringify(item.effect || {})}-${JSON.stringify(item.permanentEffect || {})}`;

    // Only non-equipment items (Herbs, Pills, Materials, Recipes, etc.) are automatically merged
    const isStackable =
      item.type === ItemType.Herb ||
      item.type === ItemType.Pill ||
      item.type === ItemType.Material ||
      item.type === ItemType.Recipe;

    if (isStackable) {
      if (stackMap.has(itemKey)) {
        const existingItem = stackMap.get(itemKey)!;
        existingItem.quantity += item.quantity;
      } else {
        const newItem = { ...item };
        stackMap.set(itemKey, newItem);
        mergedInventory.push(newItem);
      }
    } else {
      // Equipment or non-stackable items added directly
      mergedInventory.push(item);
    }
  }

  // 2. Sorting logic
  const typeOrder: Record<string, number> = {
    [ItemType.Weapon]: 1,
    [ItemType.Armor]: 2,
    [ItemType.Artifact]: 3,
    [ItemType.Accessory]: 4,
    [ItemType.Ring]: 5,
    [ItemType.Pill]: 6,
    [ItemType.Herb]: 7,
    [ItemType.Material]: 8,
    [ItemType.AdvancedItem]: 9, // Advanced Item
    [ItemType.Recipe]: 10,
  };

  const rarityOrder: Record<string, number> = {
    'Mythic': 1,
    'Legendary': 2,
    'Rare': 3,
    'Common': 4,
  };

  return mergedInventory.sort((a, b) => {
    // Equipped first
    const aEquipped = equippedIds.has(a.id);
    const bEquipped = equippedIds.has(b.id);
    if (aEquipped !== bEquipped) return aEquipped ? -1 : 1;

    // Sort by type
    const aType = typeOrder[a.type] || 99;
    const bType = typeOrder[b.type] || 99;
    if (aType !== bType) return aType - bType;

    // Sort by rarity
    const aRarity = rarityOrder[a.rarity || 'Common'] || 99;
    const bRarity = rarityOrder[b.rarity || 'Common'] || 99;
    if (aRarity !== bRarity) return aRarity - bRarity; // Mythic(1) < Common(4), so aRarity - bRarity is negative, a comes first

    // Sort by level (High to Low)
    const aLevel = a.level || 0;
    const bLevel = b.level || 0;
    if (aLevel !== bLevel) return bLevel - aLevel;

    // Sort by name
    return a.name.localeCompare(b.name, 'en-US');
  });
};

/**
 * Item Handler Hooks
 */
export function useItemHandlers({
  player,
  setPlayer,
  addLog,
  setItemActionLog,
  onOpenTreasureVault,
}: UseItemHandlersProps) {
  const handleUseItem = (item: Item) => {
    // Check if it is Sect Vault Key
    const isTreasureVaultKey = item.name === 'Sect Vault Key';

    if (isTreasureVaultKey) {
      // Sect Leader can reuse key, key is not consumed
      addLog('You used the Sect Vault Key and opened the Sect Vault!', 'special');

      // Open Sect Vault modal
      if (onOpenTreasureVault) {
        onOpenTreasureVault();
      }
      return;
    }

    // Check realm requirement
    if (item.minRealm) {
      const currentRealmIndex = REALM_ORDER.indexOf(player.realm);
      const requiredRealmIndex = REALM_ORDER.indexOf(item.minRealm);
      if (currentRealmIndex < requiredRealmIndex) {
        addLog(`Realm insufficient! Requires [${item.minRealm}] to use this item.`, 'danger');
        return;
      }
    }

    // Other items used normally
    setPlayer((prev) => applyItemEffect(prev, item, { addLog, setItemActionLog }));
  };

  const handleOrganizeInventory = () => {
    setPlayer((prev) => {
      const newInventory = organizeInventory(prev);
      addLog('Inventory organized.', 'gain');
      return { ...prev, inventory: newInventory };
    });
  };

  const handleDiscardItem = (item: Item) => {
    showConfirm(
      `Are you sure you want to discard ${item.name} x${item.quantity}?`,
      'Confirm Discard',
      () => {
        setPlayer((prev) => {
          const isEquipped = Object.values(prev.equippedItems).includes(item.id);
          if (isEquipped) {
            addLog('Cannot discard equipped items! Unequip first.', 'danger');
            return prev;
          }
          const newInv = prev.inventory.filter((i) => i.id !== item.id);
          addLog(`You discarded ${item.name} x${item.quantity}.`, 'normal');
          return { ...prev, inventory: newInv };
        });
      }
    );
  };

  const handleBatchUseItems = (itemIds: string[]) => {
    if (itemIds.length === 0) return;

    setPlayer((prev) => {
      let currentPlayer = prev;
      itemIds.forEach((itemId) => {
        const item = currentPlayer.inventory.find((i) => i.id === itemId);
        if (item) {
          currentPlayer = applyItemEffect(currentPlayer, item, {
            addLog,
            setItemActionLog,
            isBatch: true
          });
        }
      });
      return currentPlayer;
    });

    if (itemIds.length > 0) {
      addLog(`Batch used ${itemIds.length} items.`, 'gain');
    }
  };

  const handleRefineAdvancedItem = (item: Item) => {
    if (item.type !== ItemType.AdvancedItem || !item.advancedItemType || !item.advancedItemId) {
      addLog('This is not an Advanced Item!', 'danger');
      return;
    }

    const currentRealmIndex = REALM_ORDER.indexOf(player.realm);
    let requiredRealm: RealmType | null = null;
    let canRefine = false;
    let warningMessage = '';

    if (item.advancedItemType === 'foundationTreasure') {
      requiredRealm = RealmType.QiRefining;
      canRefine = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.QiRefining);
      warningMessage = 'Warning: Refining Foundation Treasure requires Qi Refining realm!';
    } else if (item.advancedItemType === 'heavenEarthEssence') {
      requiredRealm = RealmType.GoldenCore;
      canRefine = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.GoldenCore);
      warningMessage = 'Warning: Refining Heaven Earth Essence requires Golden Core realm!';
    } else if (item.advancedItemType === 'heavenEarthMarrow') {
      requiredRealm = RealmType.NascentSoul;
      canRefine = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.NascentSoul);
      warningMessage = 'Warning: Refining Heaven Earth Marrow requires Nascent Soul realm!';
    } else if (item.advancedItemType === 'longevityRule') {
      requiredRealm = RealmType.DaoCombining;
      canRefine = currentRealmIndex >= REALM_ORDER.indexOf(RealmType.DaoCombining);
      warningMessage = 'Warning: Refining Law of Longevity requires Dao Combining realm!';
    }

    if (!canRefine) {
      addLog(warningMessage, 'danger');
      return;
    }

    // Check if already owned
    if (item.advancedItemType === 'foundationTreasure' && player.foundationTreasure) {
      addLog('You already have a Foundation Treasure!', 'danger');
      return;
    }
    if (item.advancedItemType === 'heavenEarthEssence' && player.heavenEarthEssence) {
      addLog('You already have Heaven Earth Essence!', 'danger');
      return;
    }
    if (item.advancedItemType === 'heavenEarthMarrow' && player.heavenEarthMarrow) {
      addLog('You already have Heaven Earth Marrow!', 'danger');
      return;
    }
    if (item.advancedItemType === 'longevityRule' && item.advancedItemId) {
      if ((player.longevityRules || []).includes(item.advancedItemId)) {
        addLog('You already have this Law!', 'danger');
        return;
      }
      const maxRules = player.maxLongevityRules || 3;
      if ((player.longevityRules || []).length >= maxRules) {
        addLog('You have reached the maximum number of Laws!', 'danger');
        return;
      }
    }

    // Execute refining
    setPlayer((prev) => {
      const newInventory = prev.inventory
        .map((i) => {
          if (i.id === item.id) {
            return { ...i, quantity: i.quantity - 1 };
          }
          return i;
        })
        .filter((i) => i.quantity > 0);

      let newFoundationTreasure = prev.foundationTreasure;
      let newHeavenEarthEssence = prev.heavenEarthEssence;
      let newHeavenEarthMarrow = prev.heavenEarthMarrow;
      const newLongevityRules = [...(prev.longevityRules || [])];
      let marrowRefiningProgress = prev.marrowRefiningProgress;
      let marrowRefiningSpeed = prev.marrowRefiningSpeed;

      if (item.advancedItemType === 'foundationTreasure') {
        newFoundationTreasure = item.advancedItemId;
        const successMessage = `✨ Successfully refined Foundation Treasure [${item.name}]!`;
        addLog(successMessage, 'special');
        if (setItemActionLog) {
          setItemActionLog({ text: successMessage, type: 'special' });
        }
      } else if (item.advancedItemType === 'heavenEarthEssence') {
        newHeavenEarthEssence = item.advancedItemId;
        const successMessage = `✨ Successfully refined Heaven Earth Essence [${item.name}]!`;
        addLog(successMessage, 'special');
        if (setItemActionLog) {
          setItemActionLog({ text: successMessage, type: 'special' });
        }
      } else if (item.advancedItemType === 'heavenEarthMarrow') {
        newHeavenEarthMarrow = item.advancedItemId;
        marrowRefiningProgress = 0;
        marrowRefiningSpeed = 1.0;
        const successMessage = `✨ Successfully refined Heaven Earth Marrow [${item.name}]!`;
        addLog(successMessage, 'special');
        if (setItemActionLog) {
          setItemActionLog({ text: successMessage, type: 'special' });
        }
      } else if (item.advancedItemType === 'longevityRule' && item.advancedItemId) {
        newLongevityRules.push(item.advancedItemId);
        const successMessage = `✨ Successfully refined Law of Longevity [${item.name}]!`;
        addLog(successMessage, 'special');
        if (setItemActionLog) {
          setItemActionLog({ text: successMessage, type: 'special' });
        }
      }

      return {
        ...prev,
        inventory: newInventory,
        foundationTreasure: newFoundationTreasure,
        heavenEarthEssence: newHeavenEarthEssence,
        heavenEarthMarrow: newHeavenEarthMarrow,
        longevityRules: newLongevityRules,
        marrowRefiningProgress,
        marrowRefiningSpeed,
      };
    });
  };

  return {
    handleUseItem,
    handleOrganizeInventory,
    handleDiscardItem,
    handleBatchUseItems,
    handleRefineAdvancedItem,
  };
}
