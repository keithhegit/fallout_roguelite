import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  RotateCcw,
  Plus,
  Minus,
  Package,
  Sparkles,
  BookOpen,
  Award,
  Building2,
  Trophy,
  Heart,
  FlaskConical,
  Scroll,
  Power,
  Skull,
  Search,
} from 'lucide-react';
import {
  PlayerStats,
  RealmType,
  Item,
  ItemType,
  EquipmentSlot,
  ItemRarity,
  Talent,
  Title,
  CultivationArt,
  PetTemplate,
  Recipe,
  SectRank,
  Pet,
  AdventureResult,
} from '../types';
import {
  REALM_DATA,
  REALM_ORDER,
  TALENTS,
  TITLES,
  CULTIVATION_ARTS,
  PET_TEMPLATES,
  ACHIEVEMENTS,
  PILL_RECIPES,
  DISCOVERABLE_RECIPES,
  INITIAL_ITEMS,
  SECTS,
  EQUIPMENT_TEMPLATES,
  LOTTERY_PRIZES,
  SECT_SHOP_ITEMS,
  getPillDefinition,
  FOUNDATION_TREASURES,
  HEAVEN_EARTH_ESSENCES,
  HEAVEN_EARTH_MARROWS,
  LONGEVITY_RULES,
} from '../constants/index';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { LOOT_ITEMS } from '../services/battleService';
import { showSuccess, showError, showInfo, showConfirm } from '../utils/toastUtils';
import { getRarityTextColor } from '../utils/rarityUtils';
import { ASSETS } from '../constants/assets';

// Generate unique ID
const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onUpdatePlayer: (updates: Partial<PlayerStats>) => void;
  onTriggerDeath?: () => void; // Trigger death test
  onTriggerReputationEvent?: (event: AdventureResult['reputationEvent']) => void; // Trigger reputation event
  onChallengeDaoCombining?: () => void; // Challenge Heaven-Earth Soul
}

const DebugModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onUpdatePlayer,
  onTriggerDeath,
  onTriggerReputationEvent,
  onChallengeDaoCombining,
}) => {
  const [localPlayer, setLocalPlayer] = useState<PlayerStats>(player);
  const [activeTab, setActiveTab] = useState<
    | 'equipment'
    | 'talent'
    | 'title'
    | 'cultivation'
    | 'sect'
    | 'achievement'
    | 'pet'
    | 'item'
    | 'recipe'
    | 'death'
    | 'inheritance'
    | 'reputation'
    | 'breakthrough'
  >('equipment');

  // Sync localPlayer when player updates
  useEffect(() => {
    setLocalPlayer(player);
  }, [player]);
  const [equipmentFilter, setEquipmentFilter] = useState<ItemRarity | 'all'>(
    'all'
  );
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState<string>('');
  const [itemFilter, setItemFilter] = useState<ItemType | 'all'>('all');
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  // Merge all equipment (including set items from LOOT_ITEMS)
  const allEquipmentTemplates = useMemo(() => {
    const equipmentFromLoot: Array<{
      name: string;
      type: ItemType;
      rarity: ItemRarity;
      slot: EquipmentSlot;
      effect?: any;
      description?: string;
    }> = [];

    // Extract from weapon pool
    if (LOOT_ITEMS.weapons) {
      LOOT_ITEMS.weapons.forEach((weapon) => {
        equipmentFromLoot.push({
          name: weapon.name,
          type: weapon.type,
          rarity: weapon.rarity,
          slot: weapon.equipmentSlot as EquipmentSlot,
          effect: weapon.effect,
          description: `${weapon.name}, ${weapon.rarity} Quality Equipment`,
        });
      });
    }

    // Extract from armor pool
    if (LOOT_ITEMS.armors) {
      LOOT_ITEMS.armors.forEach((armor) => {
        equipmentFromLoot.push({
          name: armor.name,
          type: armor.type,
          rarity: armor.rarity,
          slot: armor.equipmentSlot as EquipmentSlot,
          effect: armor.effect,
          description: `${armor.name}, ${armor.rarity} Quality Equipment`,
        });
      });
    }

    // Extract from accessory pool
    if (LOOT_ITEMS.accessories) {
      LOOT_ITEMS.accessories.forEach((accessory) => {
        equipmentFromLoot.push({
          name: accessory.name,
          type: accessory.type,
          rarity: accessory.rarity,
          slot: accessory.equipmentSlot as EquipmentSlot,
          effect: accessory.effect,
          description: `${accessory.name}, ${accessory.rarity} Quality Equipment`,
        });
      });
    }

    // Extract from ring pool
    if (LOOT_ITEMS.rings) {
      LOOT_ITEMS.rings.forEach((ring) => {
        equipmentFromLoot.push({
          name: ring.name,
          type: ring.type,
          rarity: ring.rarity,
          slot: ring.equipmentSlot as EquipmentSlot,
          effect: ring.effect,
          description: `${ring.name}, ${ring.rarity} Quality Equipment`,
        });
      });
    }

    // Extract from artifact pool
    if (LOOT_ITEMS.artifacts) {
      LOOT_ITEMS.artifacts.forEach((artifact) => {
        equipmentFromLoot.push({
          name: artifact.name,
          type: artifact.type,
          rarity: artifact.rarity,
          slot: artifact.equipmentSlot as EquipmentSlot,
          effect: artifact.effect,
          description: `${artifact.name}, ${artifact.rarity} Quality Equipment`,
        });
      });
    }

    // Merge and deduplicate (by name, keep first)
    const allEquipment = [
      ...EQUIPMENT_TEMPLATES.map(eq => ({
        name: eq.name,
        type: eq.type,
        rarity: eq.rarity,
        slot: eq.slot,
        effect: eq.effect,
        description: eq.description,
      })),
      ...equipmentFromLoot
    ];
    const equipmentMap = new Map<string, typeof allEquipment[0]>();
    allEquipment.forEach((eq) => {
      if (!equipmentMap.has(eq.name)) {
        equipmentMap.set(eq.name, eq);
      }
    });

    return Array.from(equipmentMap.values());
  }, []);

  // Filter equipment (by rarity and search keywords)
  const filteredEquipment = useMemo(() => {
    let equipment = allEquipmentTemplates;

    // Filter by rarity first
    if (equipmentFilter !== 'all') {
      equipment = equipment.filter((eq) => eq.rarity === equipmentFilter);
    }

    // Filter by search keywords next
    if (equipmentSearchQuery.trim()) {
      const query = equipmentSearchQuery.trim().toLowerCase();
      equipment = equipment.filter((eq) => {
        const nameMatch = eq.name.toLowerCase().includes(query);
        const descMatch = (eq.description || '').toLowerCase().includes(query);
        const slotMatch = eq.slot.toLowerCase().includes(query);
        const rarityMatch = eq.rarity.toLowerCase().includes(query);
        return nameMatch || descMatch || slotMatch || rarityMatch;
      });
    }

    return equipment;
  }, [equipmentFilter, equipmentSearchQuery, allEquipmentTemplates]);

  // Merge all item lists
  const allItems = useMemo(() => {
    const items: Array<{
      name: string;
      type: ItemType;
      description: string;
      rarity?: ItemRarity;
      effect?: any;
      permanentEffect?: any;
      isEquippable?: boolean;
      equipmentSlot?: EquipmentSlot;
      level?: number;
    }> = [];
    const itemNames = new Set<string>(); // For deduplication

    // From initial items
    INITIAL_ITEMS.forEach((item) => {
      if (!itemNames.has(item.name)) {
        itemNames.add(item.name);
        items.push({
          name: item.name,
          type: item.type as ItemType,
          description: item.description,
          rarity: item.rarity,
          effect: item.effect,
          permanentEffect: item.permanentEffect,
          isEquippable: item.isEquippable,
          equipmentSlot: item.equipmentSlot,
          level: item.level,
        });
      }
    });

    // From pill recipes (prioritize definition in constants)
    [...PILL_RECIPES, ...DISCOVERABLE_RECIPES].forEach((recipe) => {
      if (!itemNames.has(recipe.result.name)) {
        itemNames.add(recipe.result.name);
        items.push({
          name: recipe.result.name,
          type: recipe.result.type,
          description: recipe.result.description,
          rarity: recipe.result.rarity,
          effect: recipe.result.effect,
          permanentEffect: recipe.result.permanentEffect,
        });
      }
    });

    // Extract items from lottery prizes (if pill, prioritize definition in constants)
    LOTTERY_PRIZES.forEach((prize) => {
      if (prize.type === 'item' && prize.value.item) {
        const item = prize.value.item;
        // If pill, prioritize getting full definition from constants
        if (item.type === ItemType.Pill) {
          const pillDef = getPillDefinition(item.name);
          if (pillDef && !itemNames.has(item.name)) {
            itemNames.add(item.name);
            items.push({
              name: pillDef.name,
              type: pillDef.type,
              description: pillDef.description,
              rarity: pillDef.rarity,
              effect: pillDef.effect,
              permanentEffect: pillDef.permanentEffect,
            });
            return; // Already got from constants, skip original definition
          }
        }
        // Non-pill or undefined in constants, use original definition
        if (!itemNames.has(item.name)) {
          itemNames.add(item.name);
          items.push({
            name: item.name,
            type: item.type === 'Material' ? ItemType.Material : item.type,
            description: item.description,
            rarity: item.rarity,
            effect: item.effect,
            permanentEffect: item.permanentEffect,
            isEquippable: item.isEquippable,
            equipmentSlot: item.equipmentSlot,
            level: item.level,
          });
        }
      }
    });

    // From sect shop items
    SECT_SHOP_ITEMS.forEach((shopItem) => {
      if (!itemNames.has(shopItem.item.name)) {
        itemNames.add(shopItem.item.name);
        items.push({
          name: shopItem.item.name,
          type: shopItem.item.type as ItemType,
          description: shopItem.item.description,
          rarity: shopItem.item.rarity,
          effect: shopItem.item.effect,
          permanentEffect: shopItem.item.permanentEffect,
          isEquippable: shopItem.item.isEquippable,
          equipmentSlot: shopItem.item.equipmentSlot,
          level: shopItem.item.level,
        });
      }
    });

    // Extract herbs from LOOT_ITEMS
    LOOT_ITEMS.herbs.forEach((herb) => {
      if (!itemNames.has(herb.name)) {
        itemNames.add(herb.name);
        items.push({
          name: herb.name,
          type: herb.type,
          description: `Rare Herb: ${herb.name}`,
          rarity: herb.rarity,
          effect: herb.effect,
          permanentEffect: (herb as any).permanentEffect,
        });
      }
    });

    // Extract materials from LOOT_ITEMS
    LOOT_ITEMS.materials.forEach((material) => {
      if (!itemNames.has(material.name)) {
        itemNames.add(material.name);
        items.push({
          name: material.name,
          type: material.type,
          description: `Crafting Material: ${material.name}`,
          rarity: material.rarity,
          permanentEffect: (material as any).permanentEffect,
        });
      }
    });

    // Generate recipe items from discoverable recipes
    DISCOVERABLE_RECIPES.forEach((recipe) => {
      const recipeItemName = `${recipe.name} Recipe`;
      if (!itemNames.has(recipeItemName)) {
        itemNames.add(recipeItemName);
        items.push({
          name: recipeItemName,
          type: ItemType.Recipe,
          description: `Ancient recipe recording the method for crafting [${recipe.name}]. Use to learn how to craft this pill.`,
          rarity: recipe.result.rarity,
        });
      }
    });

    // Add material packs
    const materialPacks = [
      { name: 'Mythic Material Pack', rarity: 'Mythic' as ItemRarity, description: 'A pack containing various Mythic quality materials.' },
      { name: 'Legendary Material Pack', rarity: 'Legendary' as ItemRarity, description: 'A pack containing various Legendary quality materials.' },
      { name: 'Rare Material Pack', rarity: 'Rare' as ItemRarity, description: 'A pack containing various Rare quality materials.' },
      { name: 'Common Material Pack', rarity: 'Common' as ItemRarity, description: 'A pack containing various Common quality materials.' },
    ];
    materialPacks.forEach((pack) => {
      if (!itemNames.has(pack.name)) {
        itemNames.add(pack.name);
        items.push({
          name: pack.name,
          type: ItemType.Material,
          description: pack.description,
          rarity: pack.rarity,
        });
      }
    });

    // Add Sect Treasury Key
    if (!itemNames.has('Sect Treasury Key')) {
      itemNames.add('Sect Treasury Key');
      items.push({
        name: 'Sect Treasury Key',
        type: ItemType.Material,
        description: 'Key to the Sect Treasury, containing accumulations of past leaders.',
        rarity: 'Mythic' as ItemRarity,
      });
    }

    return items;
  }, []);

  // Filter items (by type and search query)
  const filteredItems = useMemo(() => {
    let items = allItems;

    // Filter by type first
    if (itemFilter !== 'all') {
      items = items.filter((item) => item.type === itemFilter);
    }

    // Filter by search query next
    if (itemSearchQuery.trim()) {
      const query = itemSearchQuery.trim().toLowerCase();
      items = items.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(query);
        const descMatch = item.description.toLowerCase().includes(query);
        const typeMatch = item.type.toLowerCase().includes(query);
        const rarityMatch = item.rarity?.toLowerCase().includes(query);
        return nameMatch || descMatch || typeMatch || rarityMatch;
      });
    }

    return items;
  }, [allItems, itemFilter, itemSearchQuery]);

  if (!isOpen) return null;

  // Check if player is valid, do not render if invalid
  if (!player || !localPlayer) {
    return null;
  }

  // Remove handleSave, as all changes take effect immediately

  const handleReset = () => {
    setLocalPlayer(player);
  };

  const updateField = <K extends keyof PlayerStats>(
    field: K,
    value: PlayerStats[K]
  ) => {
    const updated = { ...localPlayer, [field]: value };
    setLocalPlayer(updated);
    // Call outside state update callback to avoid updating parent during render
    onUpdatePlayer({ [field]: value });
  };

  const adjustNumber = (
    field: keyof PlayerStats,
    delta: number,
    min: number = 0
  ) => {
    const current = localPlayer[field] as number;
    const newValue = Math.max(min, current + delta);
    const updated = { ...localPlayer, [field]: newValue };
    setLocalPlayer(updated);
    // Call outside state update callback to avoid updating parent during render
    onUpdatePlayer({ [field]: newValue });
  };

  const handleRealmChange = (newRealm: RealmType) => {
    const realmData = REALM_DATA[newRealm];
    const updated = {
      ...localPlayer,
      realm: newRealm,
      // If realm decreases, adjust stats
      maxHp: Math.max(localPlayer.maxHp, realmData.baseMaxHp),
      hp: Math.min(localPlayer.hp, Math.max(localPlayer.maxHp, realmData.baseMaxHp)),
      attack: Math.max(localPlayer.attack, realmData.baseAttack),
      defense: Math.max(localPlayer.defense, realmData.baseDefense),
      spirit: Math.max(localPlayer.spirit, realmData.baseSpirit),
      physique: Math.max(localPlayer.physique, realmData.basePhysique),
      speed: Math.max(localPlayer.speed, realmData.baseSpeed),
    };
    setLocalPlayer(updated);
    // Call outside state update callback to avoid updating parent during render
    onUpdatePlayer({
      realm: updated.realm,
      maxHp: updated.maxHp,
      hp: updated.hp,
      attack: updated.attack,
      defense: updated.defense,
      spirit: updated.spirit,
      physique: updated.physique,
      speed: updated.speed,
    });
  };

  const handleRealmLevelChange = (newLevel: number) => {
    const clampedLevel = Math.max(1, Math.min(9, newLevel));
    const updated = { ...localPlayer, realmLevel: clampedLevel };
    setLocalPlayer(updated);
    // Call outside state update callback to avoid updating parent during render
    onUpdatePlayer({ realmLevel: clampedLevel });
  };

  // Add equipment to inventory
  const handleAddEquipment = (template: (typeof EQUIPMENT_TEMPLATES)[0]) => {
    const newItem: Item = {
      id: uid(),
      name: template.name,
      type: template.type,
      description: (template as any).description || `${template.name}'s Equipment`,
      quantity: 1,
      rarity: template.rarity,
      level: 0,
      isEquippable: true,
      equipmentSlot: template.slot,
      effect: template.effect,
    };

    const updated = {
      ...localPlayer,
      inventory: [...localPlayer.inventory, newItem],
    };
    setLocalPlayer(updated);
    // Call outside state update callback to avoid updating parent during render
    onUpdatePlayer({
      inventory: updated.inventory,
    });
    showSuccess(`Added Equipment: ${template.name}`);
  };

  // Select Talent
  const handleSelectTalent = (talent: Talent) => {
    const oldTalent = TALENTS.find((t) => t.id === localPlayer.talentId);
    const newTalent = talent;

    // Calculate stat changes
    const attackChange =
      (newTalent.effects.attack || 0) - (oldTalent?.effects.attack || 0);
    const defenseChange =
      (newTalent.effects.defense || 0) - (oldTalent?.effects.defense || 0);
    const hpChange = (newTalent.effects.hp || 0) - (oldTalent?.effects.hp || 0);
    const spiritChange =
      (newTalent.effects.spirit || 0) - (oldTalent?.effects.spirit || 0);
    const physiqueChange =
      (newTalent.effects.physique || 0) - (oldTalent?.effects.physique || 0);
    const speedChange =
      (newTalent.effects.speed || 0) - (oldTalent?.effects.speed || 0);
    const luckChange =
      (newTalent.effects.luck || 0) - (oldTalent?.effects.luck || 0);

    const updatedPlayer = {
      ...localPlayer,
      talentId: talent.id,
      attack: localPlayer.attack + attackChange,
      defense: localPlayer.defense + defenseChange,
      maxHp: localPlayer.maxHp + hpChange,
      hp: localPlayer.hp + hpChange,
      spirit: localPlayer.spirit + spiritChange,
      physique: localPlayer.physique + physiqueChange,
      speed: localPlayer.speed + speedChange,
      luck: localPlayer.luck + luckChange,
    };
    setLocalPlayer(updatedPlayer);
    // Update real player state immediately
    onUpdatePlayer({
      talentId: talent.id,
      attack: updatedPlayer.attack,
      defense: updatedPlayer.defense,
      maxHp: updatedPlayer.maxHp,
      hp: updatedPlayer.hp,
      spirit: updatedPlayer.spirit,
      physique: updatedPlayer.physique,
      speed: updatedPlayer.speed,
      luck: updatedPlayer.luck,
    });
    showSuccess(`Selected Talent: ${talent.name}`);
  };

  // Get Rarity Color
  // Use unified utility to get rarity color (with border)
  const getRarityColor = (rarity: ItemRarity) => {
    const baseColor = getRarityTextColor(rarity);
    switch (rarity) {
      case 'Common':
        return `${baseColor} border-stone-600`;
      case 'Rare':
        return `${baseColor} border-blue-600`;
      case 'Legendary':
        return `${baseColor} border-purple-600`;
      case 'Mythic':
        return `${baseColor} border-yellow-600`;
      default:
        return `${baseColor} border-stone-600`;
    }
  };

  // Get Rarity Background Color
  const getRarityBgColor = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'Common':
        return 'bg-stone-800/50';
      case 'Rare':
        return 'bg-blue-900/20';
      case 'Legendary':
        return 'bg-purple-900/20';
      case 'Mythic':
        return 'bg-yellow-900/20';
      default:
        return 'bg-stone-800/50';
    }
  };

  // Select Title
  const handleSelectTitle = (title: Title) => {
    const oldTitle = TITLES.find((t) => t.id === localPlayer.titleId);
    const newTitle = title;

    // Calculate stat changes
    const attackChange =
      (newTitle.effects.attack || 0) - (oldTitle?.effects.attack || 0);
    const defenseChange =
      (newTitle.effects.defense || 0) - (oldTitle?.effects.defense || 0);
    const hpChange = (newTitle.effects.hp || 0) - (oldTitle?.effects.hp || 0);

    const updatedPlayer = {
      ...localPlayer,
      titleId: title.id,
      attack: localPlayer.attack + attackChange,
      defense: localPlayer.defense + defenseChange,
      maxHp: localPlayer.maxHp + hpChange,
      hp: localPlayer.hp + hpChange,
    };
    setLocalPlayer(updatedPlayer);
    // Update real player state immediately
    onUpdatePlayer({
      titleId: title.id,
      attack: updatedPlayer.attack,
      defense: updatedPlayer.defense,
      maxHp: updatedPlayer.maxHp,
      hp: updatedPlayer.hp,
    });
    showSuccess(`Selected Title: ${title.name}`);
  };

  // Unlock Title
  const handleUnlockTitle = (title: Title) => {
    if ((localPlayer.unlockedTitles || []).includes(title.id)) {
      showInfo('Title already unlocked');
      return;
    }
    const updated = {
      ...localPlayer,
      unlockedTitles: [...(localPlayer.unlockedTitles || []), title.id],
    };
    setLocalPlayer(updated);
    onUpdatePlayer({
      unlockedTitles: updated.unlockedTitles,
    });
    showSuccess(`Unlocked Title: ${title.name}`);
  };


  // Learn Cultivation Art
  const handleLearnCultivationArt = (art: CultivationArt) => {
    if (localPlayer.cultivationArts.includes(art.id)) {
      showError('Protocol already learned');
      return; // Already learned
    }
    const updated = {
      ...localPlayer,
      cultivationArts: [...localPlayer.cultivationArts, art.id],
    };
    setLocalPlayer(updated);
    // Call outside state update callback to avoid updating parent during render
    onUpdatePlayer({
      cultivationArts: updated.cultivationArts,
    });
    showSuccess(`Learned Protocol: ${art.name}`);
  };

  // Join Faction
  const handleJoinSect = (sectId: string) => {
    const sect = SECTS.find((s) => s.id === sectId);
    setLocalPlayer((prev) => {
      const updated = {
        ...prev,
        sectId: sectId,
        sectRank: SectRank.Outer,
        sectContribution: 0,
      };
      // Update real player state immediately
      onUpdatePlayer({
        sectId: sectId,
        sectRank: SectRank.Outer,
        sectContribution: 0,
      });
      return updated;
    });
    showSuccess(`Joined Faction: ${sect?.name || sectId}`);
  };

  // Complete Achievement
  const handleCompleteAchievement = (achievementId: string) => {
    if (localPlayer.achievements.includes(achievementId)) {
      showError('Achievement already completed');
      return; // Already completed
    }
    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    const updated = {
      ...localPlayer,
      achievements: [...localPlayer.achievements, achievementId],
    };
    setLocalPlayer(updated);
    // Call outside state update callback to avoid updating parent during render
    onUpdatePlayer({
      achievements: updated.achievements,
    });
    showSuccess(`Completed Achievement: ${achievement?.name || achievementId}`);
  };

  // Add Pet
  const handleAddPet = (template: PetTemplate) => {
    const newPet = {
      id: uid(),
      name: template.name,
      species: template.species,
      level: 1,
      exp: 0,
      maxExp: 100,
      rarity: template.rarity,
      stats: { ...template.baseStats },
      skills: template.skills,
      evolutionStage: 0,
      affection: 50,
    };

    const updated = {
      ...localPlayer,
      pets: [...localPlayer.pets, newPet],
    };
    setLocalPlayer(updated);
    // Call outside state update callback to avoid updating parent during render
    onUpdatePlayer({
      pets: updated.pets,
    });
    showSuccess(`Added Pet: ${template.name}`);
  };

  // Add Item
  const handleAddItem = (itemTemplate: Partial<Item> | Recipe['result'], quantity: number = 1) => {
    // Check if itemTemplate is valid
    if (!itemTemplate || !itemTemplate.name) {
      showError('Invalid Item Template');
      return;
    }

    const isEquipment = (itemTemplate as any).isEquippable && (itemTemplate as any).equipmentSlot;
    const isRecipe = itemTemplate.type === ItemType.Recipe;

    setLocalPlayer((prev) => {
      const newInv = [...prev.inventory];
      const existingIdx = newInv.findIndex((i) => i.name === itemTemplate.name);
      let successMessage = '';

      if (existingIdx >= 0 && !isEquipment && !isRecipe) {
        // Non-equipment, non-recipe items can stack
        newInv[existingIdx] = {
          ...newInv[existingIdx],
          quantity: newInv[existingIdx].quantity + quantity,
        };
        successMessage = `Added Item: ${itemTemplate.name} x${quantity} (Current: ${newInv[existingIdx].quantity})`;
      } else {
        // Equipment, recipes, or new items take a separate slot
        const itemsToAdd = isEquipment ? quantity : 1;
        const addQuantity = isEquipment ? 1 : quantity;

        for (let i = 0; i < itemsToAdd; i++) {
          // Handle recipe: need to add recipeData
          let recipeData: Recipe | undefined = undefined;
          if (isRecipe) {
            // Infer recipe name from item name (e.g., "Pill Name Recipe" -> "Pill Name")
            const recipeName = (itemTemplate.name || '').replace(/ Recipe$/, '');
            // Find corresponding recipe in DISCOVERABLE_RECIPES
            const matchedRecipe = DISCOVERABLE_RECIPES.find(
              (recipe) => recipe.name === recipeName
            );
            if (matchedRecipe) {
              recipeData = matchedRecipe;
            }
          }

          const newItem: Item = {
            id: uid(),
            name: itemTemplate.name || 'Unknown Item',
            type: itemTemplate.type || ItemType.Material,
            description: itemTemplate.description || '',
            quantity: addQuantity,
            rarity: itemTemplate.rarity || 'Common',
            level: (itemTemplate as any).level ?? 0,
            isEquippable: (itemTemplate as any).isEquippable,
            equipmentSlot: (itemTemplate as any).equipmentSlot,
            effect: itemTemplate.effect,
            permanentEffect: (itemTemplate as any).permanentEffect,
            recipeData: recipeData,
          };
          newInv.push(newItem);
        }
        successMessage = `Added Item: ${itemTemplate.name} x${quantity}`;
      }

      // Use setTimeout to delay call, avoiding update parent during render
      setTimeout(() => {
        onUpdatePlayer({
          inventory: newInv,
        });
        if (successMessage) {
          showSuccess(successMessage);
        }
      }, 0);

      return {
        ...prev,
        inventory: newInv,
      };
    });
  };

  // Unlock Recipe
  const handleUnlockRecipe = (recipeName: string) => {
    if (localPlayer.unlockedRecipes.includes(recipeName)) {
      showError('Recipe already unlocked');
      return; // Already unlocked
    }
    const updated = {
      ...localPlayer,
      unlockedRecipes: [...localPlayer.unlockedRecipes, recipeName],
    };
    setLocalPlayer(updated);
    // Call outside state update callback to avoid updating parent during render
    onUpdatePlayer({
      unlockedRecipes: updated.unlockedRecipes,
    });
    showSuccess(`Unlocked Recipe: ${recipeName}`);
  };

  // Disable Debug Mode
  const handleDisableDebugMode = () => {
    showConfirm(
      'Are you sure you want to disable Debug Mode? You will need to click the Game Title 5 times to re-enable it.',
      'Confirm Disable',
      () => {
        localStorage.removeItem(STORAGE_KEYS.DEBUG_MODE);
        // Reload page to apply changes
        window.location.reload();
      }
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 crt-screen"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 w-full max-w-5xl h-[90vh] rounded-none border border-stone-800 shadow-2xl relative overflow-hidden flex flex-col font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Texture Layer */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
          style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
        />
        
        {/* CRT Visual Layers */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
        <div className="crt-noise"></div>
        <div className="crt-vignette"></div>

        <div className="bg-stone-950/50 border-b border-stone-800 p-4 md:p-6 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-900 border border-stone-800 flex items-center justify-center text-red-500 shadow-inner relative group overflow-hidden">
              <div 
                className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
              />
              <Power size={24} className="relative z-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-200 tracking-[0.2em] uppercase">DEBUG_TERMINAL</h2>
              <p className="text-[10px] text-stone-600 tracking-widest uppercase">OVERRIDE_MODE // SYSTEM_ADMIN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-stone-600 hover:text-red-500 hover:bg-red-950/10 transition-all border border-stone-800 hover:border-red-900/50 relative group overflow-hidden"
            aria-label="ABORT"
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <X size={24} className="relative z-10" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-8 relative z-10">
          {/* Global Search */}
          <div className="bg-stone-900/50 border border-stone-700 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-stone-400" />
              <input
                type="text"
                placeholder="Global search all content..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="flex-1 bg-stone-800 border border-stone-700 rounded px-3 py-2 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-red-500"
              />
              {globalSearchQuery && (
                <button
                  onClick={() => setGlobalSearchQuery('')}
                  className="text-stone-400 hover:text-stone-200 px-2"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Warning Alert */}
          <div className="bg-red-900/30 border border-red-700 rounded p-3 text-sm text-red-200">
            ⚠️ Debug Mode: Modifying data may cause game anomalies, please proceed with caution!
          </div>

          {/* Basic Info */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              Basic Info
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Player Name
                </label>
                <input
                  type="text"
                  value={localPlayer.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 min-h-[44px] touch-manipulation"
                />
              </div>
            </div>
          </div>

          {/* Realm and Level */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              Realm & Level
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Realm
                </label>
                <select
                  value={localPlayer.realm}
                  onChange={(e) =>
                    handleRealmChange(e.target.value as RealmType)
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 min-h-[44px] touch-manipulation"
                >
                  {REALM_ORDER.map((realm) => (
                    <option key={realm} value={realm}>
                      {realm}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Realm Level (1-9)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleRealmLevelChange(localPlayer.realmLevel - 1)
                    }
                    className="bg-stone-700 active:bg-stone-600 text-stone-200 rounded px-3 py-2 min-w-[50px] md:min-w-[60px] min-h-[44px] flex items-center justify-center touch-manipulation shrink-0"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={localPlayer.realmLevel}
                    onChange={(e) =>
                      handleRealmLevelChange(parseInt(e.target.value) || 1)
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 text-center min-h-[44px] touch-manipulation w-0"
                  />
                  <button
                    onClick={() =>
                      handleRealmLevelChange(localPlayer.realmLevel + 1)
                    }
                    className="bg-stone-700 active:bg-stone-600 text-stone-200 rounded px-3 py-2 min-w-[50px] md:min-w-[60px] min-h-[44px] flex items-center justify-center touch-manipulation shrink-0"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Experience
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('exp', -1000)}
                    className="bg-stone-700 active:bg-stone-600 text-stone-200 rounded px-3 py-2 text-xs min-w-[50px] md:min-w-[60px] min-h-[44px] flex items-center justify-center touch-manipulation shrink-0"
                  >
                    -1K
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.exp}
                    onChange={(e) =>
                      updateField(
                        'exp',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 min-h-[44px] touch-manipulation w-0"
                  />
                  <button
                    onClick={() => adjustNumber('exp', 1000)}
                    className="bg-stone-700 active:bg-stone-600 text-stone-200 rounded px-3 py-2 text-xs min-w-[50px] md:min-w-[60px] min-h-[44px] flex items-center justify-center touch-manipulation shrink-0"
                  >
                    +1K
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Max Experience
                </label>
                <input
                  type="number"
                  min="1"
                  value={localPlayer.maxExp}
                  onChange={(e) =>
                    updateField(
                      'maxExp',
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 min-h-[44px] touch-manipulation"
                />
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              Attributes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'hp', label: 'HP', maxKey: 'maxHp' },
                { key: 'maxHp', label: 'Max HP' },
                { key: 'attack', label: 'Attack' },
                { key: 'defense', label: 'Defense' },
                { key: 'spirit', label: 'Spirit' },
                { key: 'physique', label: 'Physique' },
                { key: 'speed', label: 'Speed' },
                { key: 'luck', label: 'Luck' },
                { key: 'lifespan', label: 'Lifespan', maxKey: 'maxLifespan' },
                { key: 'maxLifespan', label: 'Max Lifespan' },
              ].map(({ key, label, maxKey }) => {
                const value = localPlayer[key as keyof PlayerStats] as number;
                const maxValue = maxKey
                  ? (localPlayer[maxKey as keyof PlayerStats] as number)
                  : undefined;
                return (
                  <div key={key}>
                    <label className="block text-sm text-stone-400 mb-1">
                      {label}
                      {maxValue !== undefined && ` (Max: ${maxValue})`}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newValue = maxValue !== undefined
                            ? Math.max(0, Math.min(maxValue, value - 100))
                            : Math.max(0, value - 100);
                          updateField(key as keyof PlayerStats, newValue);
                        }}
                        className="bg-stone-700 active:bg-stone-600 text-stone-200 rounded px-3 py-2 text-xs min-w-[50px] md:min-w-[60px] min-h-[44px] flex items-center justify-center touch-manipulation shrink-0"
                      >
                        -100
                      </button>
                      <input
                        type="number"
                        min={maxValue !== undefined ? 0 : undefined}
                        max={maxValue}
                        value={value}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 0;
                          const clampedValue =
                            maxValue !== undefined
                              ? Math.max(0, Math.min(maxValue, newValue))
                              : Math.max(0, newValue);
                          updateField(key as keyof PlayerStats, clampedValue);
                        }}
                        className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 min-h-[44px] touch-manipulation w-0"
                      />
                      <button
                        onClick={() => {
                          const newValue = maxValue !== undefined
                            ? Math.max(0, Math.min(maxValue, value + 100))
                            : Math.max(0, value + 100);
                          updateField(key as keyof PlayerStats, newValue);
                        }}
                        className="bg-stone-700 active:bg-stone-600 text-stone-200 rounded px-3 py-2 text-xs min-w-[50px] md:min-w-[60px] min-h-[44px] flex items-center justify-center touch-manipulation shrink-0"
                      >
                        +100
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              Resources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Spirit Stones
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('spiritStones', -1000)}
                    className="bg-stone-700 active:bg-stone-600 text-stone-200 rounded px-3 py-2 text-xs min-w-[50px] md:min-w-[60px] min-h-[44px] flex items-center justify-center touch-manipulation shrink-0"
                  >
                    -1K
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.spiritStones}
                    onChange={(e) =>
                      updateField(
                        'spiritStones',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 min-h-[44px] touch-manipulation w-0"
                  />
                  <button
                    onClick={() => adjustNumber('spiritStones', 1000)}
                    className="bg-stone-700 active:bg-stone-600 text-stone-200 rounded px-3 py-2 text-xs min-w-[50px] md:min-w-[60px] min-h-[44px] flex items-center justify-center touch-manipulation shrink-0"
                  >
                    +1K
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Lottery Tickets
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('lotteryTickets', -10)}
                    className="bg-stone-700 active:bg-stone-600 text-stone-200 rounded px-3 py-2 text-xs min-w-[50px] md:min-w-[60px] min-h-[44px] flex items-center justify-center touch-manipulation shrink-0"
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.lotteryTickets}
                    onChange={(e) =>
                      updateField(
                        'lotteryTickets',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 min-h-[44px] touch-manipulation w-0"
                  />
                  <button
                    onClick={() => adjustNumber('lotteryTickets', 10)}
                    className="bg-stone-700 active:bg-stone-600 text-stone-200 rounded px-3 py-2 text-xs min-w-[50px] md:min-w-[60px] min-h-[44px] flex items-center justify-center touch-manipulation shrink-0"
                  >
                    +10
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Attribute Points
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('attributePoints', -10)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={localPlayer.attributePoints}
                    onChange={(e) =>
                      updateField(
                        'attributePoints',
                        Math.max(0, parseInt(e.target.value) || 0)
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('attributePoints', 10)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +10
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-1">
                  Inheritance Level
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustNumber('inheritanceLevel', -1, 0)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    -1
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={localPlayer.inheritanceLevel}
                    onChange={(e) =>
                      updateField(
                        'inheritanceLevel',
                        Math.max(0, Math.min(4, parseInt(e.target.value) || 0))
                      )
                    }
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                  />
                  <button
                    onClick={() => adjustNumber('inheritanceLevel', 1, 0)}
                    className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                  >
                    +1
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="font-bold text-stone-200 mb-3 border-b border-stone-700 pb-2">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  onUpdatePlayer({...localPlayer, hp: localPlayer.maxHp});
                }}
                className="bg-green-700 hover:bg-green-600 text-white rounded px-3 py-2 text-sm"
              >
                Full HP
              </button>
              <button
                onClick={() => {
                  onUpdatePlayer({ ...localPlayer, exp: localPlayer.maxExp - 1});
                }}
                className="bg-blue-700 hover:bg-blue-600 text-white rounded px-3 py-2 text-sm"
              >
                Exp to Level Up - 1
              </button>
              <button
                onClick={() => {
                  onUpdatePlayer({...localPlayer, spiritStones: 999999});
                }}
                className="bg-yellow-700 hover:bg-yellow-600 text-white rounded px-3 py-2 text-sm"
              >
                Spirit Stones 999K
              </button>
              <button
                onClick={() => {
                  onUpdatePlayer({...localPlayer, lotteryTickets: 999});
                }}
                className="bg-purple-700 hover:bg-purple-600 text-white rounded px-3 py-2 text-sm"
              >
                Lottery Tickets 999
              </button>
            </div>
          </div>

          {/* Game Content */}
          <div>
            <div className="mb-3 border-b border-stone-700 pb-2">
              <h3 className="font-bold text-stone-200 mb-2">Game Content</h3>
              {/* Row 1: Main Features */}
              <div className="flex gap-2 flex-wrap mb-2 justify-start">
                <button
                  onClick={() => setActiveTab('equipment')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'equipment'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                      : 'bg-stone-700/80 text-stone-300 hover:bg-stone-600 hover:shadow-md'
                  }`}
                  title="Equipment"
                >
                  <Package size={14} className="inline mr-1" />
                  Equipment
                </button>
                <button
                  onClick={() => setActiveTab('item')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'item'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                      : 'bg-stone-700/80 text-stone-300 hover:bg-stone-600 hover:shadow-md'
                  }`}
                  title="Items"
                >
                  <FlaskConical size={14} className="inline mr-1" />
                  Items
                </button>
                <button
                  onClick={() => setActiveTab('recipe')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'recipe'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                      : 'bg-stone-700/80 text-stone-300 hover:bg-stone-600 hover:shadow-md'
                  }`}
                  title="Recipes"
                >
                  <Scroll size={14} className="inline mr-1" />
                  Recipes
                </button>
                <button
                  onClick={() => setActiveTab('cultivation')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'cultivation'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                      : 'bg-stone-700/80 text-stone-300 hover:bg-stone-600 hover:shadow-md'
                  }`}
                  title="Cultivation"
                >
                  <BookOpen size={14} className="inline mr-1" />
                  Cultivation
                </button>
                <button
                  onClick={() => setActiveTab('breakthrough')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'breakthrough'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                      : 'bg-stone-700/80 text-stone-300 hover:bg-stone-600 hover:shadow-md'
                  }`}
                  title="Breakthrough"
                >
                  <Power size={14} className="inline mr-1" />
                  Breakthrough
                </button>
              </div>
              {/* Row 2: Character Related */}
              <div className="flex gap-2 flex-wrap mb-2 justify-start">
                <button
                  onClick={() => setActiveTab('talent')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'talent'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                      : 'bg-stone-700/80 text-stone-300 hover:bg-stone-600 hover:shadow-md'
                  }`}
                  title="Talents"
                >
                  <Sparkles size={14} className="inline mr-1" />
                  Talents
                </button>
                <button
                  onClick={() => setActiveTab('title')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'title'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                      : 'bg-stone-700/80 text-stone-300 hover:bg-stone-600 hover:shadow-md'
                  }`}
                  title="Titles"
                >
                  <Award size={14} className="inline mr-1" />
                  Titles
                </button>
                <button
                  onClick={() => setActiveTab('inheritance')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'inheritance'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                      : 'bg-stone-700/80 text-stone-300 hover:bg-stone-600 hover:shadow-md'
                  }`}
                  title="Inheritance"
                >
                  <Sparkles size={14} className="inline mr-1" />
                  Inheritance
                </button>
              </div>
              {/* Row 3: Other Features */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab('sect')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'sect'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                      : 'bg-stone-700/80 text-stone-300 hover:bg-stone-600 hover:shadow-md'
                  }`}
                  title="Sect"
                >
                  <Building2 size={14} className="inline mr-1" />
                  Sect
                </button>
                <button
                  onClick={() => setActiveTab('pet')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'pet'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                      : 'bg-stone-700/80 text-stone-300 hover:bg-stone-600 hover:shadow-md'
                  }`}
                  title="Pets"
                >
                  <Heart size={14} className="inline mr-1" />
                  Pets
                </button>
                <button
                  onClick={() => setActiveTab('achievement')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'achievement'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                      : 'bg-stone-700/80 text-stone-300 hover:bg-stone-600 hover:shadow-md'
                  }`}
                  title="Achievements"
                >
                  <Trophy size={14} className="inline mr-1" />
                  Achievements
                </button>
                <button
                  onClick={() => setActiveTab('reputation')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'reputation'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                      : 'bg-stone-700/80 text-stone-300 hover:bg-stone-600 hover:shadow-md'
                  }`}
                  title="Reputation"
                >
                  <Award size={14} className="inline mr-1" />
                  Reputation
                </button>
                <button
                  onClick={() => setActiveTab('death')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === 'death'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50'
                      : 'bg-stone-700/80 text-stone-300 hover:bg-stone-600 hover:shadow-md'
                  }`}
                  title="Death Test"
                >
                  <Skull size={14} className="inline mr-1" />
                  Death Test
                </button>
              </div>
            </div>

            {/* Equipment Selection */}
            {activeTab === 'equipment' && (
              <div>
                {/* Search Box */}
                <div className="mb-3">
                  <input
                    type="text"
                    value={equipmentSearchQuery}
                    onChange={(e) => setEquipmentSearchQuery(e.target.value)}
                    placeholder="Search equipment name, description, slot or rarity..."
                    className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                </div>

                {/* Rarity Filter */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  {(['all', 'Common', 'Rare', 'Legendary', 'Mythic'] as const).map(
                    (rarity) => (
                      <button
                        key={rarity}
                        onClick={() => setEquipmentFilter(rarity as any)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      equipmentFilter === rarity
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-500/50'
                        : 'bg-stone-700/80 text-stone-300 hover:bg-stone-600 hover:shadow-sm'
                    }`}
                      >
                        {rarity === 'all' ? 'All' : rarity}
                      </button>
                    )
                  )}
                </div>

                {/* Search Result Count */}
                {equipmentSearchQuery.trim() && (
                  <div className="text-sm text-stone-400 mb-3">
                    Found {filteredEquipment.length} matching equipment
                  </div>
                )}

                {/* Equipment Card List */}
                <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96">
                  {filteredEquipment.map((equipment, index) => (
                    <div
                      key={`${equipment.name}-${index}`}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${getRarityColor(
                        equipment.rarity
                      )} ${getRarityBgColor(equipment.rarity)}`}
                      onClick={() => handleAddEquipment(equipment)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-sm">{equipment.name}</h4>
                        <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                          {equipment.rarity}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mb-2">
                        {(equipment as any).description || equipment.name}
                      </p>
                      <div className="text-xs space-y-1">
                        <div className="text-stone-300">
                          <span className="text-stone-500">Slot:</span>
                          {equipment.slot}
                        </div>
                        {equipment.effect && (
                          <div className="text-stone-300">
                            <span className="text-stone-500">Effect:</span>
                            {Object.entries(equipment.effect)
                              .map(([key, value]) => {
                                const keyMap: Record<string, string> = {
                                  attack: 'Attack',
                                  defense: 'Defense',
                                  hp: 'HP',
                                  spirit: 'Spirit',
                                  physique: 'Physique',
                                  speed: 'Speed',
                                  exp: 'Exp',
                                };
                                return `${keyMap[key] || key}+${value}`;
                              })
                              .join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        className="mt-2 w-full bg-red-700 hover:bg-red-600 text-white text-xs py-1 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddEquipment(equipment);
                        }}
                      >
                        Add to Inventory
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Talent Selection */}
            {activeTab === 'talent' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  Current Talent:
                  <span className="text-stone-200 ml-2">
                    {TALENTS.find((t) => t.id === localPlayer.talentId)?.name ||
                      'None'}
                  </span>
                </div>
                <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96">
                  {TALENTS.map((talent) => {
                    const isSelected = localPlayer.talentId === talent.id;
                    return (
                      <div
                        key={talent.id}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                          isSelected
                            ? 'border-red-500 bg-red-900/20'
                            : getRarityColor(talent.rarity)
                        } ${getRarityBgColor(talent.rarity)}`}
                        onClick={() => handleSelectTalent(talent)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">{talent.name}</h4>
                          <div className="flex items-center gap-1">
                            {isSelected && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-700 text-white">
                                Selected
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                              {talent.rarity}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 mb-2">
                          {talent.description}
                        </p>
                        {Object.keys(talent.effects).length > 0 && (
                          <div className="text-xs text-stone-300">
                            <span className="text-stone-500">Effect:</span>
                            {Object.entries(talent.effects)
                              .map(([key, value]) => {
                                const keyMap: Record<string, string> = {
                                  attack: 'Attack',
                                  defense: 'Defense',
                                  hp: 'HP',
                                  spirit: 'Spirit',
                                  physique: 'Physique',
                                  speed: 'Speed',
                                  expRate: 'Cultivation Rate',
                                  luck: 'Luck',
                                };
                                if (key === 'expRate') {
                                  return `${keyMap[key] || key}+${(value * 100).toFixed(0)}%`;
                                }
                                return `${keyMap[key] || key}+${value}`;
                              })
                              .join(', ')}
                          </div>
                        )}
                        <button
                          className={`mt-2 w-full text-xs py-1 rounded transition-colors ${
                            isSelected
                              ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                              : 'bg-red-700 hover:bg-red-600 text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSelected) {
                              handleSelectTalent(talent);
                            }
                          }}
                          disabled={isSelected}
                        >
                          {isSelected ? 'Selected' : 'Select Talent'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Title Selection */}
            {activeTab === 'title' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  Current Title:
                  <span className="text-stone-200 ml-2">
                    {TITLES.find((t) => t.id === localPlayer.titleId)?.name ||
                      'None'}
                  </span>
                </div>
                <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96">
                  {TITLES.map((title) => {
                    const isSelected = localPlayer.titleId === title.id;
                    return (
                      <div
                        key={title.id}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                          isSelected
                            ? 'border-red-500 bg-red-900/20'
                            : 'border-stone-600 bg-stone-800/50'
                        }`}
                        onClick={() => handleSelectTitle(title)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">{title.name}</h4>
                          {isSelected && (
                            <span className="text-xs px-2 py-0.5 rounded bg-red-700 text-white">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 mb-2">
                          {title.description}
                        </p>
                        <div className="text-xs text-stone-300 mb-2">
                          <span className="text-stone-500">Requirement:</span>
                          {title.requirement}
                        </div>
                        {Object.keys(title.effects).length > 0 && (
                          <div className="text-xs text-stone-300">
                            <span className="text-stone-500">Effect:</span>
                            {Object.entries(title.effects)
                              .map(([key, value]) => {
                                const keyMap: Record<string, string> = {
                                  attack: 'Attack',
                                  defense: 'Defense',
                                  hp: 'HP',
                                  spirit: 'Spirit',
                                  physique: 'Physique',
                                  speed: 'Speed',
                                  expRate: 'Cultivation Rate',
                                };
                                if (key === 'expRate') {
                                  return `${keyMap[key] || key}+${(value * 100).toFixed(0)}%`;
                                }
                                return `${keyMap[key] || key}+${value}`;
                              })
                              .join(', ')}
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <button
                            className={`flex-1 text-xs py-1 rounded transition-colors ${
                              isSelected
                                ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                                : 'bg-red-700 hover:bg-red-600 text-white'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isSelected) {
                                handleSelectTitle(title);
                              }
                            }}
                            disabled={isSelected}
                          >
                            {isSelected ? 'Selected' : 'Select Title'}
                          </button>
                          <button
                            className={`flex-1 text-xs py-1 rounded transition-colors ${
                              (localPlayer.unlockedTitles || []).includes(title.id)
                                ? 'bg-green-700 hover:bg-green-600 text-white'
                                : 'bg-blue-700 hover:bg-blue-600 text-white'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlockTitle(title);
                            }}
                          >
                            {(localPlayer.unlockedTitles || []).includes(title.id) ? 'Unlocked' : 'Unlock Title'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cultivation Selection */}
            {activeTab === 'cultivation' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  Learned Arts: {localPlayer.cultivationArts.length}
                </div>
                <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96">
                  {CULTIVATION_ARTS.map((art) => {
                    const isLearned = localPlayer.cultivationArts.includes(
                      art.id
                    );
                    const isActive = localPlayer.activeArtId === art.id;
                    return (
                      <div
                        key={art.id}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                          isActive
                            ? 'border-red-500 bg-red-900/20'
                            : isLearned
                              ? 'border-green-500 bg-green-900/20'
                              : 'border-stone-600 bg-stone-800/50'
                        }`}
                        onClick={() => {
                          if (!isLearned) {
                            handleLearnCultivationArt(art);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">{art.name}</h4>
                          <div className="flex items-center gap-1">
                            {isActive && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-700 text-white">
                                Active
                              </span>
                            )}
                            {isLearned && !isActive && (
                              <span className="text-xs px-2 py-0.5 rounded bg-green-700 text-white">
                                Learned
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                              {art.type === 'mental' ? 'Mental' : 'Physical'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 mb-2">
                          {art.description}
                        </p>
                        <div className="text-xs text-stone-300 mb-2">
                          <span className="text-stone-500">Realm Req:</span>
                          {art.realmRequirement}
                        </div>
                        {Object.keys(art.effects).length > 0 && (
                          <div className="text-xs text-stone-300">
                            <span className="text-stone-500">Effect:</span>
                            {Object.entries(art.effects)
                              .map(([key, value]) => {
                                const keyMap: Record<string, string> = {
                                  attack: 'Attack',
                                  defense: 'Defense',
                                  hp: 'HP',
                                  spirit: 'Spirit',
                                  physique: 'Physique',
                                  speed: 'Speed',
                                  expRate: 'Cultivation Rate',
                                };
                                if (key === 'expRate') {
                                  return `${keyMap[key] || key}+${(value * 100).toFixed(0)}%`;
                                }
                                return `${keyMap[key] || key}+${value}`;
                              })
                              .join(', ')}
                          </div>
                        )}
                        <button
                          className={`mt-2 w-full text-xs py-1 rounded transition-colors ${
                            isLearned
                              ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                              : 'bg-red-700 hover:bg-red-600 text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isLearned) {
                              handleLearnCultivationArt(art);
                            }
                          }}
                          disabled={isLearned}
                        >
                          {isLearned ? 'Learned' : 'Learn Art'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sect Selection */}
            {activeTab === 'sect' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  Current Sect:
                  <span className="text-stone-200 ml-2">
                    {localPlayer.sectId
                      ? SECTS.find((s) => s.id === localPlayer.sectId)?.name ||
                        'Unknown'
                      : 'None'}
                  </span>
                  {localPlayer.sectId && (
                    <span className="text-stone-200 ml-2">
                      ({localPlayer.sectRank})
                    </span>
                  )}
                </div>
                {localPlayer.sectId && (
                  <div className="mb-4 p-3 bg-stone-800/50 rounded border border-stone-700">
                    <label className="block text-sm text-stone-400 mb-2">
                      Sect Contribution
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustNumber('sectContribution', -1000)}
                        className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                      >
                        -1K
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={localPlayer.sectContribution}
                        onChange={(e) =>
                          updateField(
                            'sectContribution',
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        }
                        className="flex-1 bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                      />
                      <button
                        onClick={() => adjustNumber('sectContribution', 1000)}
                        className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                      >
                        +1K
                      </button>
                    </div>
                  </div>
                )}
                <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96">
                  {SECTS.map((sect) => {
                    const isJoined = localPlayer.sectId === sect.id;
                    return (
                      <div
                        key={sect.id}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                          isJoined
                            ? 'border-red-500 bg-red-900/20'
                            : 'border-stone-600 bg-stone-800/50'
                        }`}
                        onClick={() => {
                          if (!isJoined) {
                            handleJoinSect(sect.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">{sect.name}</h4>
                          <div className="flex items-center gap-1">
                            {isJoined && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-700 text-white">
                                Joined
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                              {sect.grade} Level
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 mb-2">
                          {sect.description}
                        </p>
                        <div className="text-xs text-stone-300">
                          <span className="text-stone-500">Realm Req:</span>
                          {sect.reqRealm}
                        </div>
                        <button
                          className={`mt-2 w-full text-xs py-1 rounded transition-colors ${
                            isJoined
                              ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                              : 'bg-red-700 hover:bg-red-600 text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isJoined) {
                              handleJoinSect(sect.id);
                            }
                          }}
                          disabled={isJoined}
                        >
                          {isJoined ? 'Joined' : 'Join Sect'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Achievement Selection */}
            {activeTab === 'achievement' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  Completed Achievements: {localPlayer.achievements.length} /{' '}
                  {ACHIEVEMENTS.length}
                </div>
                <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96">
                  {ACHIEVEMENTS.map((achievement) => {
                    const isCompleted = localPlayer.achievements.includes(
                      achievement.id
                    );
                    return (
                      <div
                        key={achievement.id}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                          isCompleted
                            ? 'border-green-500 bg-green-900/20'
                            : getRarityColor(achievement.rarity)
                        } ${getRarityBgColor(achievement.rarity)}`}
                        onClick={() => {
                          if (!isCompleted) {
                            handleCompleteAchievement(achievement.id);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">
                            {achievement.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            {isCompleted && (
                              <span className="text-xs px-2 py-0.5 rounded bg-green-700 text-white">
                                Completed
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                              {achievement.rarity}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 mb-2">
                          {achievement.description}
                        </p>
                        <div className="text-xs text-stone-300 mb-2">
                          <span className="text-stone-500">Requirement:</span>
                          {achievement.requirement.type === 'realm'
                            ? `Reach ${achievement.requirement.target}`
                            : achievement.requirement.type === 'kill'
                              ? `Defeat ${achievement.requirement.value} enemies`
                              : achievement.requirement.type === 'collect'
                                ? `Collect ${achievement.requirement.value} items`
                                : achievement.requirement.type === 'meditate'
                                  ? `Meditate ${achievement.requirement.value} times`
                                  : achievement.requirement.type === 'adventure'
                                    ? `Adventure ${achievement.requirement.value} times`
                                    : achievement.requirement.type === 'equip'
                                      ? `Equip ${achievement.requirement.value} items`
                                      : achievement.requirement.type === 'pet'
                                        ? `Obtain ${achievement.requirement.value} pets`
                                        : achievement.requirement.type ===
                                            'recipe'
                                          ? `Unlock ${achievement.requirement.value} recipes`
                                          : achievement.requirement.type ===
                                              'art'
                                            ? `Learn ${achievement.requirement.value} arts`
                                            : achievement.requirement.type ===
                                                'breakthrough'
                                              ? `Breakthrough ${achievement.requirement.value} times`
                                              : achievement.requirement.type ===
                                                  'secret_realm'
                                                ? `Enter secret realm ${achievement.requirement.value} times`
                                                : achievement.requirement
                                                      .type === 'lottery'
                                                  ? `Lottery ${achievement.requirement.value} times`
                                                  : `${achievement.requirement.type} ${achievement.requirement.value}`}
                        </div>
                        {achievement.reward && (
                          <div className="text-xs text-stone-300">
                            <span className="text-stone-500">Reward:</span>
                            {[
                              achievement.reward.exp &&
                                `Exp+${achievement.reward.exp}`,
                              achievement.reward.spiritStones &&
                                `Spirit Stones+${achievement.reward.spiritStones}`,
                              achievement.reward.titleId && 'Title',
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                        <button
                          className={`mt-2 w-full text-xs py-1 rounded transition-colors ${
                            isCompleted
                              ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                              : 'bg-red-700 hover:bg-red-600 text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isCompleted) {
                              handleCompleteAchievement(achievement.id);
                            }
                          }}
                          disabled={isCompleted}
                        >
                          {isCompleted ? 'Completed' : 'Complete'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pet Selection */}
            {activeTab === 'pet' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  Owned Pets: {localPlayer.pets.length}
                </div>

                {/* Current Pets */}
                {localPlayer.pets.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-bold text-stone-200 mb-2 border-b border-stone-700 pb-1">
                      Current Pets
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {localPlayer.pets.map((pet) => (
                        <div
                          key={pet.id}
                          className="border border-stone-700 rounded-lg p-3 bg-stone-800/50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h5 className="font-bold text-sm text-stone-200">
                                {pet.name}
                              </h5>
                              <p className="text-xs text-stone-400">
                                {pet.species} | Lv.{pet.level} | Affection:{' '}
                                {pet.affection}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setEditingPetId(pet.id);
                                setEditingPet({ ...pet });
                              }}
                              className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded"
                            >
                              Edit
                            </button>
                          </div>
                          <div className="text-xs text-stone-300">
                            Atk: {Math.floor(pet.stats.attack)} | Def: {Math.floor(pet.stats.defense)}{' '}
                            | HP: {Math.floor(pet.stats.hp)} | Spd: {Math.floor(pet.stats.speed)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Edit Pet Modal */}
                {editingPet && editingPetId && (
                  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-stone-800 border border-stone-700 rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-y-auto">
                      <h3 className="font-bold text-stone-200 mb-4">
                        Edit Pet: {editingPet.name}
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            Level
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editingPet.level}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                level: Math.max(
                                  1,
                                  parseInt(e.target.value) || 1
                                ),
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            Experience
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editingPet.exp}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                exp: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            Max Experience
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editingPet.maxExp}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                maxExp: Math.max(
                                  1,
                                  parseInt(e.target.value) || 1
                                ),
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            Affection (0-100)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editingPet.affection}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                affection: Math.max(
                                  0,
                                  Math.min(100, parseInt(e.target.value) || 0)
                                ),
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            Evolution Stage (0-2)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="2"
                            value={editingPet.evolutionStage}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                evolutionStage: Math.max(
                                  0,
                                  Math.min(2, parseInt(e.target.value) || 0)
                                ),
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            Attack
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editingPet.stats.attack}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                stats: {
                                  ...editingPet.stats,
                                  attack: Math.max(
                                    0,
                                    parseInt(e.target.value) || 0
                                  ),
                                },
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            Defense
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editingPet.stats.defense}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                stats: {
                                  ...editingPet.stats,
                                  defense: Math.max(
                                    0,
                                    parseInt(e.target.value) || 0
                                  ),
                                },
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            HP
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editingPet.stats.hp}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                stats: {
                                  ...editingPet.stats,
                                  hp: Math.max(
                                    0,
                                    parseInt(e.target.value) || 0
                                  ),
                                },
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">
                            Speed
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editingPet.stats.speed}
                            onChange={(e) =>
                              setEditingPet({
                                ...editingPet,
                                stats: {
                                  ...editingPet.stats,
                                  speed: Math.max(
                                    0,
                                    parseInt(e.target.value) || 0
                                  ),
                                },
                              })
                            }
                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            if (!editingPet) return;
                            const updatedPets = localPlayer.pets.map((p) =>
                              p.id === editingPetId ? editingPet : p
                            );
                            const updated = {
                              ...localPlayer,
                              pets: updatedPets,
                            };
                            setLocalPlayer(updated);
                            // Call outside state update callback to avoid updating parent during render
                            onUpdatePlayer({
                              pets: updatedPets,
                            });
                            setEditingPet(null);
                            setEditingPetId(null);
                            showSuccess('Pet stats updated');
                          }}
                          className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingPet(null);
                            setEditingPetId(null);
                          }}
                          className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 py-2 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add New Pet */}
                <div className="mt-4">
                  <h4 className="font-bold text-stone-200 mb-2 border-b border-stone-700 pb-1">
                    Add New Pet
                  </h4>
                  <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96">
                    {PET_TEMPLATES.map((template) => {
                      const hasPet = localPlayer.pets.some(
                        (p) => p.species === template.species
                      );
                      return (
                        <div
                          key={template.id}
                          className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${getRarityColor(
                            template.rarity
                          )} ${getRarityBgColor(template.rarity)}`}
                          onClick={() => handleAddPet(template)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-sm">
                              {template.name}
                            </h4>
                            <div className="flex items-center gap-1">
                              {hasPet && (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-700 text-white">
                                  Owned
                                </span>
                              )}
                              <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                                {template.rarity}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-stone-400 mb-2">
                            {template.description}
                          </p>
                          <div className="text-xs text-stone-300 mb-2">
                            <span className="text-stone-500">Species:</span>
                            {template.species}
                          </div>
                          <div className="text-xs text-stone-300">
                            <span className="text-stone-500">Base Stats:</span>
                            Atk {template.baseStats.attack} Def
                            {template.baseStats.defense} HP
                            {template.baseStats.hp} Spd
                            {template.baseStats.speed}
                          </div>
                          <button
                            className="mt-2 w-full bg-red-700 hover:bg-red-600 text-white text-xs py-1 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddPet(template);
                            }}
                          >
                            Add Pet
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Item Selection */}
            {activeTab === 'item' && (
              <div>
                {/* Search Box */}
                <div className="mb-3">
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder="Search item name, description, type or rarity..."
                    className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                </div>

                {/* Item Type Filter */}
                <div className="flex gap-2 mb-3 flex-wrap">
                  {(['all', ...Object.values(ItemType)] as const).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => setItemFilter(type)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          itemFilter === type
                            ? 'bg-red-700 text-white'
                            : 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                        }`}
                      >
                        {type === 'all' ? 'All' : type}
                      </button>
                    )
                  )}
                </div>

                {/* Search Result Count */}
                {itemSearchQuery.trim() && (
                  <div className="text-sm text-stone-400 mb-3">
                    Found {filteredItems.length} matching items
                  </div>
                )}

                {/* Item Card List */}
                <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96">
                  {filteredItems.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                        item.rarity
                          ? getRarityColor(item.rarity)
                          : 'border-stone-600'
                      } ${
                        item.rarity
                          ? getRarityBgColor(item.rarity)
                          : 'bg-stone-800/50'
                      }`}
                      onClick={() => handleAddItem(item)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        {item.rarity && (
                          <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                            {item.rarity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mb-2">
                        {item.description}
                      </p>
                      <div className="text-xs text-stone-300 mb-1">
                        <span className="text-stone-500">Type:</span>
                        {item.type}
                      </div>
                      {item.effect && (
                        <div className="text-xs text-stone-300 mb-1">
                          <span className="text-stone-500">Effect:</span>
                          {Object.entries(item.effect)
                            .map(([key, value]) => {
                              const keyMap: Record<string, string> = {
                                attack: 'Attack',
                                defense: 'Defense',
                                hp: 'HP',
                                spirit: 'Spirit',
                                physique: 'Physique',
                                speed: 'Speed',
                                exp: 'Exp',
                                lifespan: 'Lifespan',
                              };
                              return `${keyMap[key] || key}+${value}`;
                            })
                            .join(', ')}
                        </div>
                      )}
                      {item.permanentEffect && (
                        <div className="text-xs text-yellow-300 mb-1">
                          <span className="text-stone-500">Permanent Effect:</span>
                          {Object.entries(item.permanentEffect)
                            .map(([key, value]) => {
                              const keyMap: Record<string, string> = {
                                attack: 'Attack',
                                defense: 'Defense',
                                maxHp: 'Max HP',
                                maxLifespan: 'Max Lifespan',
                                spirit: 'Spirit',
                                physique: 'Physique',
                                speed: 'Speed',
                              };

                              // Special handling for spiritualRoots object
                              if (key === 'spiritualRoots' && typeof value === 'object' && value !== null) {
                                const roots = value as Record<string, number>;
                                const rootNames: Record<string, string> = {
                                  metal: 'Metal',
                                  wood: 'Wood',
                                  water: 'Water',
                                  fire: 'Fire',
                                  earth: 'Earth',
                                };
                                const rootEntries = Object.entries(roots)
                                  .filter(([_, val]) => val > 0)
                                  .map(([rootKey, val]) => `${rootNames[rootKey] || rootKey} Spirit Root+${val}`)
                                  .join(', ');
                                return rootEntries || 'Spirit Root Increase';
                              }

                              return `${keyMap[key] || key}+${value}`;
                            })
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                      {item.isEquippable && (
                        <div className="text-xs text-blue-300 mb-1">
                          <span className="text-stone-500">Equippable:</span>
                          {item.equipmentSlot || 'Unknown Slot'}
                        </div>
                      )}
                      <div className="mt-2 flex gap-2">
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={itemQuantities[item.name || ''] || 1}
                          onChange={(e) => {
                            const value = Math.max(1, Math.min(999, parseInt(e.target.value) || 1));
                            setItemQuantities((prev) => ({
                              ...prev,
                              [item.name || '']: value,
                            }));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-16 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-stone-200 text-center"
                          placeholder="1"
                        />
                        <button
                          className="flex-1 bg-red-700 hover:bg-red-600 text-white text-xs py-1 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            const quantity = itemQuantities[item.name || ''] || 1;
                            handleAddItem(item, quantity);
                          }}
                        >
                          Add to Inv
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recipe Selection */}
            {activeTab === 'recipe' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  Unlocked Recipes: {localPlayer.unlockedRecipes.length}
                </div>
                <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96">
                  {[...PILL_RECIPES, ...DISCOVERABLE_RECIPES].map((recipe) => {
                    const isUnlocked = localPlayer.unlockedRecipes.includes(
                      recipe.name
                    );
                    return (
                      <div
                        key={recipe.name}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                          isUnlocked
                            ? 'border-green-500 bg-green-900/20'
                            : getRarityColor(recipe.result.rarity)
                        } ${getRarityBgColor(recipe.result.rarity)}`}
                        onClick={() => {
                          if (!isUnlocked) {
                            handleUnlockRecipe(recipe.name);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-sm">{recipe.name}</h4>
                          <div className="flex items-center gap-1">
                            {isUnlocked && (
                              <span className="text-xs px-2 py-0.5 rounded bg-green-700 text-white">
                                Unlocked
                              </span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                              {recipe.result.rarity}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 mb-2">
                          {recipe.result.description}
                        </p>
                        <div className="text-xs text-stone-300 mb-2">
                          <span className="text-stone-500">Ingredients:</span>
                          {recipe.ingredients
                            .map((ing) => `${ing.name}x${ing.qty}`)
                            .join(', ')}
                        </div>
                        <div className="text-xs text-stone-300 mb-2">
                          <span className="text-stone-500">Cost:</span>
                          {recipe.cost} Spirit Stones
                        </div>
                        {recipe.result.effect && (
                          <div className="text-xs text-stone-300">
                            <span className="text-stone-500">Effect:</span>
                            {Object.entries(recipe.result.effect)
                              .map(([key, value]) => {
                                const keyMap: Record<string, string> = {
                                  attack: 'Attack',
                                  defense: 'Defense',
                                  hp: 'HP',
                                  spirit: 'Spirit',
                                  physique: 'Physique',
                                  speed: 'Speed',
                                  exp: 'Exp',
                                };
                                return `${keyMap[key] || key}+${value}`;
                              })
                              .join(', ')}
                          </div>
                        )}
                        <button
                          className={`mt-2 w-full text-xs py-1 rounded transition-colors ${
                            isUnlocked
                              ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                              : 'bg-red-700 hover:bg-red-600 text-white'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isUnlocked) {
                              handleUnlockRecipe(recipe.name);
                            }
                          }}
                          disabled={isUnlocked}
                        >
                          {isUnlocked ? 'Unlocked' : 'Unlock Recipe'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Inheritance System */}
            {activeTab === 'inheritance' && (
              <div>
                <div className="text-sm text-stone-400 mb-3">
                  Inheritance System: Set inheritance path, level, exp and skills
                </div>

                {/* Inheritance Level */}
                <div className="mb-4">
                  <h3 className="font-bold text-stone-200 mb-2">Inheritance Level</h3>
                  <div>
                    <label className="text-sm text-stone-400">Inheritance Level (0-4)</label>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => adjustNumber('inheritanceLevel', -1, 0)}
                        className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        className="flex-1 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-stone-200 text-sm"
                        value={localPlayer.inheritanceLevel || 0}
                        onChange={(e) =>
                          updateField(
                            'inheritanceLevel',
                            Math.max(0, Math.min(4, parseInt(e.target.value) || 0))
                          )
                        }
                      />
                      <button
                        onClick={() => adjustNumber('inheritanceLevel', 1, 0)}
                        className="bg-stone-700 hover:bg-stone-600 text-stone-200 rounded px-2 py-1 text-xs"
                      >
                        +1
                      </button>
                    </div>
                    <p className="text-xs text-stone-500 mt-1">
                      Inheritance Level can only be obtained through adventure, used for realm breakthrough
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Death Test */}
            {activeTab === 'death' && (
              <div>
                <div className="bg-red-900/30 border border-red-700 rounded p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Skull size={20} className="text-red-400" />
                    <h3 className="font-bold text-red-400">Death Test</h3>
                  </div>
                  <p className="text-sm text-stone-300 mb-2">
                    This function is used to test death mechanics and penalties in different difficulty modes.
                  </p>
                  <p className="text-xs text-stone-400">
                    Current HP: {localPlayer.hp} / {localPlayer.maxHp}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Quick Set HP */}
                  <div>
                    <h4 className="font-semibold text-stone-200 mb-2">
                      Quick Set HP
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          onUpdatePlayer({ hp: 0 });
                          showInfo('HP set to 0, death check triggered');
                        }}
                        className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
                      >
                        Set to 0 (Immediate Death)
                      </button>
                      <button
                        onClick={() => {
                          onUpdatePlayer({ hp: 1 });
                          showInfo('HP set to 1');
                        }}
                        className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded transition-colors"
                      >
                        Set to 1 (Near Death)
                      </button>
                      <button
                        onClick={() => {
                          const halfHp = Math.floor(localPlayer.maxHp * 0.5);
                          onUpdatePlayer({ hp: halfHp });
                          showInfo(`HP set to ${halfHp} (50%)`);
                        }}
                        className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded transition-colors"
                      >
                        Set to 50%
                      </button>
                      <button
                        onClick={() => {
                          onUpdatePlayer({ hp: localPlayer.maxHp });
                          showInfo('HP set to max');
                        }}
                        className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded transition-colors"
                      >
                        Full HP
                      </button>
                    </div>
                  </div>

                  {/* Trigger Death */}
                  <div>
                    <h4 className="font-semibold text-stone-200 mb-2">
                      Trigger Death
                    </h4>
                    <div className="bg-stone-800/50 border border-stone-700 rounded p-4">
                      <p className="text-sm text-stone-300 mb-4">
                        Directly trigger death mechanism to test death handling in different difficulty modes:
                      </p>
                      <button
                        onClick={() => {
                          showConfirm(
                            'Are you sure you want to trigger death? This will execute death penalties based on current difficulty.',
                            'Confirm Trigger',
                            () => {
                              // Set HP to 0 first
                              onUpdatePlayer({ hp: 0 });
                              // Then trigger death callback
                              if (onTriggerDeath) {
                                setTimeout(() => {
                                  onTriggerDeath();
                                }, 100);
                              } else {
                                showError('Death test callback not configured');
                              }
                            }
                          );
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:via-red-500 hover:to-red-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <Skull size={20} />
                        Trigger Death Test
                      </button>
                      <p className="text-xs text-stone-400 mt-2">
                        *
                        Note: This will immediately trigger death mechanism and execute penalties
                      </p>
                    </div>
                  </div>

                  {/* Current Difficulty Mode */}
                  <div>
                    <h4 className="font-semibold text-stone-200 mb-2">
                      Current Difficulty Mode
                    </h4>
                    <div className="bg-stone-800/50 border border-stone-700 rounded p-3">
                      <p className="text-sm text-stone-300">
                        <span className="text-stone-400">Difficulty:</span>
                        <span className="font-semibold ml-2">
                          {(() => {
                            try {
                              const settings = JSON.parse(
                                localStorage.getItem(STORAGE_KEYS.SETTINGS) ||
                                  '{}'
                              );
                              const difficulty =
                                settings.difficulty || 'normal';
                              if (difficulty === 'easy') {
                                return (
                                  <span className="text-green-400">
                                    Easy Mode
                                  </span>
                                );
                              } else if (difficulty === 'normal') {
                                return (
                                  <span className="text-yellow-400">
                                    Normal Mode
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="text-red-400">Hard Mode</span>
                                );
                              }
                            } catch {
                              return (
                                <span className="text-yellow-400">
                                  Normal Mode
                                </span>
                              );
                            }
                          })()}
                        </span>
                      </p>
                      <div className="mt-2 text-xs text-stone-400 space-y-1">
                        <p>• Easy Mode: No death penalty, immediate revive</p>
                        <p>• Normal Mode: Death drops some stats (10-20%) and equipment (1-3 items)</p>
                        <p>• Hard Mode: Death deletes save file</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reputation Event Debug */}
            {activeTab === 'breakthrough' && (
              <div>
                <div className="bg-purple-900/30 border border-purple-700 rounded p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Power size={20} className="text-purple-400" />
                    <h3 className="text-lg font-bold text-purple-400">
                      Breakthrough Item Management
                    </h3>
                  </div>
                  <p className="text-xs text-stone-400">
                    Manage items and conditions required for realm breakthrough
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Foundation Treasure */}
                  <div>
                    <h4 className="font-semibold text-stone-200 mb-3 flex items-center gap-2">
                      <span className="text-green-400">Foundation Treasure</span>
                      {localPlayer.foundationTreasure && (
                        <span className="text-xs text-green-400">
                          (Owned: {FOUNDATION_TREASURES[localPlayer.foundationTreasure]?.name || localPlayer.foundationTreasure})
                        </span>
                      )}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {Object.values(FOUNDATION_TREASURES)
                        .filter((treasure) => {
                          if (!globalSearchQuery.trim()) return true;
                          const query = globalSearchQuery.toLowerCase();
                          return (
                            treasure.name.toLowerCase().includes(query) ||
                            treasure.description.toLowerCase().includes(query) ||
                            treasure.rarity.toLowerCase().includes(query) ||
                            treasure.id.toLowerCase().includes(query)
                          );
                        })
                        .map((treasure) => (
                        <div
                          key={treasure.id}
                          className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                            localPlayer.foundationTreasure === treasure.id
                              ? 'border-green-500 bg-green-900/20'
                              : `${getRarityColor(treasure.rarity)} ${getRarityBgColor(treasure.rarity)}`
                          }`}
                          onClick={() => {
                            // Add to inventory
                            const newItem: Item = {
                              id: uid(),
                              name: treasure.name,
                              type: ItemType.AdvancedItem,
                              description: treasure.description,
                              quantity: 1,
                              rarity: treasure.rarity,
                              advancedItemType: 'foundationTreasure',
                              advancedItemId: treasure.id,
                            };
                            const updated = {
                              ...localPlayer,
                              inventory: [...localPlayer.inventory, newItem],
                            };
                            setLocalPlayer(updated);
                            onUpdatePlayer({ inventory: updated.inventory });
                            showSuccess(`Added Foundation Treasure to inventory: ${treasure.name}`);
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-bold text-sm text-stone-200">
                              {treasure.name}
                            </h5>
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                              {treasure.rarity}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mb-2">
                            {treasure.description}
                          </p>
                          <div className="text-xs text-stone-500">
                            {Object.entries(treasure.effects)
                              .filter(([_, value]) => value !== undefined && typeof value === 'number')
                              .map(([key, value]) => `${key.replace('Bonus', '')}+${value}`)
                              .join(', ')}
                          </div>
                        </div>
                        ))}
                    </div>
                    {localPlayer.foundationTreasure && (
                      <button
                        onClick={() => {
                          updateField('foundationTreasure', undefined);
                          showInfo('Foundation Treasure cleared');
                        }}
                        className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-sm rounded"
                      >
                        Clear Foundation Treasure
                      </button>
                    )}
                  </div>

                  {/* Heaven-Earth Essence */}
                  <div>
                    <h4 className="font-semibold text-stone-200 mb-3 flex items-center gap-2">
                      <span className="text-blue-400">Heaven-Earth Essence</span>
                      {localPlayer.heavenEarthEssence && (
                        <span className="text-xs text-blue-400">
                          (Owned: {HEAVEN_EARTH_ESSENCES[localPlayer.heavenEarthEssence]?.name || localPlayer.heavenEarthEssence})
                        </span>
                      )}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {Object.values(HEAVEN_EARTH_ESSENCES)
                        .filter((essence) => {
                          if (!globalSearchQuery.trim()) return true;
                          const query = globalSearchQuery.toLowerCase();
                          return (
                            essence.name.toLowerCase().includes(query) ||
                            essence.description.toLowerCase().includes(query) ||
                            essence.rarity.toLowerCase().includes(query) ||
                            String(essence.quality).toLowerCase().includes(query) ||
                            essence.id.toLowerCase().includes(query)
                          );
                        })
                        .map((essence) => (
                        <div
                          key={essence.id}
                          className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                            localPlayer.heavenEarthEssence === essence.id
                              ? 'border-blue-500 bg-blue-900/20'
                              : `${getRarityColor(essence.rarity)} ${getRarityBgColor(essence.rarity)}`
                          }`}
                          onClick={() => {
                            // Add to inventory
                            const newItem: Item = {
                              id: uid(),
                              name: essence.name,
                              type: ItemType.AdvancedItem,
                              description: essence.description,
                              quantity: 1,
                              rarity: essence.rarity,
                              advancedItemType: 'heavenEarthEssence',
                              advancedItemId: essence.id,
                            };
                            const updated = {
                              ...localPlayer,
                              inventory: [...localPlayer.inventory, newItem],
                            };
                            setLocalPlayer(updated);
                            onUpdatePlayer({ inventory: updated.inventory });
                            showSuccess(`Added Heaven-Earth Essence to inventory: ${essence.name}`);
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-bold text-sm text-stone-200">
                              {essence.name}
                            </h5>
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                              {essence.rarity}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mb-2">
                            {essence.description}
                          </p>
                          <div className="text-xs text-stone-500">
                            Quality: {essence.quality} |{' '}
                            {Object.entries(essence.effects)
                              .filter(([key, value]) => key !== 'specialEffect' && value !== undefined && typeof value === 'number')
                              .map(([key, value]) => `${key.replace('Bonus', '')}+${value}`)
                              .join(', ')}
                          </div>
                        </div>
                        ))}
                    </div>
                    {localPlayer.heavenEarthEssence && (
                      <button
                        onClick={() => {
                          updateField('heavenEarthEssence', undefined);
                          showInfo('Heaven-Earth Essence cleared');
                        }}
                        className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-sm rounded"
                      >
                        Clear Heaven-Earth Essence
                      </button>
                    )}
                  </div>

                  {/* Heaven-Earth Marrow */}
                  <div>
                    <h4 className="font-semibold text-stone-200 mb-3 flex items-center gap-2">
                      <span className="text-yellow-400">Heaven-Earth Marrow</span>
                      {localPlayer.heavenEarthMarrow && (
                        <span className="text-xs text-yellow-400">
                          (Owned: {HEAVEN_EARTH_MARROWS[localPlayer.heavenEarthMarrow]?.name || localPlayer.heavenEarthMarrow}, Refining Progress: {localPlayer.marrowRefiningProgress || 0}%)
                        </span>
                      )}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {Object.values(HEAVEN_EARTH_MARROWS)
                        .filter((marrow) => {
                          if (!globalSearchQuery.trim()) return true;
                          const query = globalSearchQuery.toLowerCase();
                          return (
                            marrow.name.toLowerCase().includes(query) ||
                            marrow.description.toLowerCase().includes(query) ||
                            marrow.rarity.toLowerCase().includes(query) ||
                            String(marrow.quality).toLowerCase().includes(query) ||
                            marrow.id.toLowerCase().includes(query)
                          );
                        })
                        .map((marrow) => (
                        <div
                          key={marrow.id}
                          className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                            localPlayer.heavenEarthMarrow === marrow.id
                              ? 'border-yellow-500 bg-yellow-900/20'
                              : `${getRarityColor(marrow.rarity)} ${getRarityBgColor(marrow.rarity)}`
                          }`}
                          onClick={() => {
                            // Add to inventory
                            const newItem: Item = {
                              id: uid(),
                              name: marrow.name,
                              type: ItemType.AdvancedItem,
                              description: marrow.description,
                              quantity: 1,
                              rarity: marrow.rarity,
                              advancedItemType: 'heavenEarthMarrow',
                              advancedItemId: marrow.id,
                            };
                            const updated = {
                              ...localPlayer,
                              inventory: [...localPlayer.inventory, newItem],
                            };
                            setLocalPlayer(updated);
                            onUpdatePlayer({ inventory: updated.inventory });
                            showSuccess(`Added Heaven-Earth Marrow to inventory: ${marrow.name}`);
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-bold text-sm text-stone-200">
                              {marrow.name}
                            </h5>
                            <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                              {marrow.rarity}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mb-2">
                            {marrow.description}
                          </p>
                          <div className="text-xs text-stone-500">
                            Quality: {marrow.quality} | Refining Time: {marrow.refiningTime} Days |{' '}
                            {Object.entries(marrow.effects)
                              .filter(([key, value]) => key !== 'specialEffect' && value !== undefined && typeof value === 'number')
                              .map(([key, value]) => `${key.replace('Bonus', '')}+${value}`)
                              .join(', ')}
                          </div>
                        </div>
                        ))}
                    </div>
                    {localPlayer.heavenEarthMarrow && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-stone-300">Refining Progress:</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={localPlayer.marrowRefiningProgress || 0}
                            onChange={(e) => {
                              const progress = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                              updateField('marrowRefiningProgress', progress);
                            }}
                            className="w-20 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-sm text-stone-200"
                          />
                          <span className="text-sm text-stone-400">%</span>
                        </div>
                        <button
                          onClick={() => {
                            updateField('heavenEarthMarrow', undefined);
                            updateField('marrowRefiningProgress', 0);
                            showInfo('Heaven-Earth Marrow cleared');
                          }}
                          className="px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-sm rounded"
                        >
                          Clear Heaven-Earth Marrow
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dao Combining Challenge */}
                  <div>
                    <h4 className="font-semibold text-stone-200 mb-3 flex items-center gap-2">
                      <span className="text-orange-400">Dao Combining Challenge</span>
                      {localPlayer.daoCombiningChallenged && (
                        <span className="text-xs text-green-400">(Completed)</span>
                      )}
                    </h4>
                    <div className="bg-stone-800/50 border border-stone-700 rounded p-4">
                      <p className="text-sm text-stone-300 mb-3">
                        Dao Combining realm requires challenging Heaven-Earth Soul to breakthrough
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {onChallengeDaoCombining && (
                          <button
                            onClick={() => {
                              onChallengeDaoCombining();
                              showSuccess('Starting challenge against Heaven-Earth Soul...');
                            }}
                            className="px-4 py-2 rounded text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white transition-colors"
                          >
                            ⚔️ Challenge Heaven-Earth Soul
                          </button>
                        )}
                        <button
                          onClick={() => {
                            updateField('daoCombiningChallenged', !localPlayer.daoCombiningChallenged);
                            showSuccess(
                              localPlayer.daoCombiningChallenged
                                ? 'Dao Combining challenge marker cancelled'
                                : 'Marked Dao Combining challenge as completed'
                            );
                          }}
                          className={`px-4 py-2 rounded text-sm font-semibold ${
                            localPlayer.daoCombiningChallenged
                              ? 'bg-green-700 hover:bg-green-600 text-white'
                              : 'bg-stone-700 hover:bg-stone-600 text-stone-300'
                          }`}
                        >
                          {localPlayer.daoCombiningChallenged ? 'Challenge Completed' : 'Mark as Completed'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Power of Rules */}
                  <div>
                    <h4 className="font-semibold text-stone-200 mb-3 flex items-center gap-2">
                      <span className="text-purple-400">Power of Rules</span>
                      <span className="text-xs text-stone-400">
                        (Owned: {localPlayer.longevityRules?.length || 0})
                      </span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {Object.values(LONGEVITY_RULES)
                        .filter((rule) => {
                          if (!globalSearchQuery.trim()) return true;
                          const query = globalSearchQuery.toLowerCase();
                          return (
                            rule.name.toLowerCase().includes(query) ||
                            rule.description.toLowerCase().includes(query) ||
                            rule.id.toLowerCase().includes(query) ||
                            String(rule.power).includes(query)
                          );
                        })
                        .map((rule) => {
                        const hasRule = localPlayer.longevityRules?.includes(rule.id) || false;
                        return (
                          <div
                            key={rule.id}
                            className={`border-2 rounded-lg p-3 cursor-pointer transition-all hover:scale-105 ${
                              hasRule
                                ? 'border-purple-500 bg-purple-900/20'
                                : `${getRarityColor('Mythic')} ${getRarityBgColor('Mythic')}`
                            }`}
                            onClick={() => {
                              // Add to inventory
                              const newItem: Item = {
                                id: uid(),
                                name: rule.name,
                                type: ItemType.AdvancedItem,
                                description: rule.description,
                                quantity: 1,
                                rarity: 'Mythic',
                                advancedItemType: 'longevityRule',
                                advancedItemId: rule.id,
                              };
                              const updated = {
                                ...localPlayer,
                                inventory: [...localPlayer.inventory, newItem],
                              };
                              setLocalPlayer(updated);
                              onUpdatePlayer({ inventory: updated.inventory });
                              showSuccess(`Added Power of Rule to inventory: ${rule.name}`);
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-bold text-sm text-stone-200">
                                {rule.name}
                              </h5>
                              <span className="text-xs px-2 py-0.5 rounded bg-stone-700">
                                Power: {rule.power}
                              </span>
                            </div>
                            <p className="text-xs text-stone-400 mb-2">
                              {rule.description}
                            </p>
                            <div className="text-xs text-stone-500">
                              {Object.entries(rule.effects)
                                .filter(([key, value]) => key !== 'specialEffect' && value !== undefined && typeof value === 'number')
                                .map(([key, value]) => `${key.replace('Percent', '')}+${((value as number) * 100).toFixed(0)}%`)
                                .join(', ')}
                            </div>
                          </div>
                        );
                        })}
                    </div>
                    {localPlayer.longevityRules && localPlayer.longevityRules.length > 0 && (
                      <button
                        onClick={() => {
                          updateField('longevityRules', []);
                          showInfo('All Power of Rules cleared');
                        }}
                        className="mt-2 px-3 py-1 bg-red-700 hover:bg-red-600 text-white text-sm rounded"
                      >
                        Clear All Power of Rules
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reputation' && (
              <div>
                <div className="bg-yellow-900/30 border border-yellow-700 rounded p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={20} className="text-yellow-400" />
                    <h3 className="text-lg font-bold text-yellow-400">
                      Reputation Event Debug
                    </h3>
                  </div>
                  <p className="text-sm text-stone-300 mb-2">
                    Current Reputation: <span className="font-semibold text-yellow-400">{localPlayer.reputation || 0}</span>
                  </p>
                  <p className="text-xs text-stone-400">
                    Can trigger different types of reputation events to test modal functionality
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Preset Reputation Events */}
                  <div>
                    <h4 className="font-semibold text-stone-200 mb-2">
                      Preset Reputation Events
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Positive Event - Help Villagers */}
                      <button
                        onClick={() => {
                          if (onTriggerReputationEvent) {
                            onTriggerReputationEvent({
                              title: 'Helping Others',
                              description: 'You encountered a group of villagers being besieged by monsters during your adventure. You decided to help them and repelled the monsters. The villagers are grateful to you.',
                              choices: [
                                {
                                  text: 'Accept villagers\' thanks and take some gifts',
                                  reputationChange: 10,
                                  description: 'You accepted the villagers\' gifts, and your reputation increased.',
                                  spiritStonesChange: 50,
                                },
                                {
                                  text: 'Refuse gifts, only wish for their safety',
                                  reputationChange: 20,
                                  description: 'Your kindness made the villagers admire you even more, reputation greatly increased.',
                                },
                                {
                                  text: 'Ask villagers for more information',
                                  reputationChange: 5,
                                  description: 'You got some useful information from the villagers.',
                                  expChange: 20,
                                },
                              ],
                            });
                            showSuccess('Triggered Reputation Event: Helping Others');
                          } else {
                            showError('Reputation event callback not configured');
                          }
                        }}
                        className="p-4 bg-stone-800/50 border border-stone-700 rounded hover:border-yellow-500 transition-colors text-left"
                      >
                        <div className="font-semibold text-stone-200 mb-1">
                          Helping Others
                        </div>
                        <div className="text-xs text-stone-400">
                          Help villagers repel monsters, gain reputation
                        </div>
                      </button>

                      {/* Positive Event - Sect Mission */}
                      <button
                        onClick={() => {
                          if (onTriggerReputationEvent) {
                            onTriggerReputationEvent({
                              title: 'Sect Mission',
                              description: 'You received a mission from the Sect to collect spirit herbs in a dangerous area. This is a good opportunity to increase your reputation.',
                              choices: [
                                {
                                  text: 'Accept mission, go immediately',
                                  reputationChange: 15,
                                  description: 'You successfully completed the mission and gained recognition from the Sect.',
                                  expChange: 30,
                                  hpChange: -20,
                                },
                                {
                                  text: 'Consider carefully, ask for more reward',
                                  reputationChange: 8,
                                  description: 'You got extra rewards, but reputation increased less.',
                                  spiritStonesChange: 100,
                                },
                                {
                                  text: 'Refuse mission',
                                  reputationChange: -5,
                                  description: 'You refused the mission, reputation slightly decreased.',
                                },
                              ],
                            });
                            showSuccess('Triggered Reputation Event: Sect Mission');
                          } else {
                            showError('Reputation event callback not configured');
                          }
                        }}
                        className="p-4 bg-stone-800/50 border border-stone-700 rounded hover:border-yellow-500 transition-colors text-left"
                      >
                        <div className="font-semibold text-stone-200 mb-1">
                          Sect Mission
                        </div>
                        <div className="text-xs text-stone-400">
                          Complete Sect mission, increase reputation
                        </div>
                      </button>

                      {/* Negative Event - Moral Choice */}
                      <button
                        onClick={() => {
                          if (onTriggerReputationEvent) {
                            onTriggerReputationEvent({
                              title: 'Moral Choice',
                              description: 'You found an injured evil cultivator asking for your help. Helping him might bring some benefits, but it will also affect your reputation.',
                              choices: [
                                {
                                  text: 'Help evil cultivator, get his treasures',
                                  reputationChange: -15,
                                  description: 'You helped the evil cultivator, although you got treasures, your reputation decreased.',
                                  spiritStonesChange: 200,
                                  hpChange: -10,
                                },
                                {
                                  text: 'Refuse to help, but don\'t hurt him either',
                                  reputationChange: 0,
                                  description: 'You remained neutral, reputation unaffected.',
                                },
                                {
                                  text: 'Eliminate evil for the people, defeat him',
                                  reputationChange: 25,
                                  description: 'You eliminated evil for the people, reputation greatly increased!',
                                  expChange: 50,
                                  hpChange: -30,
                                },
                              ],
                            });
                            showSuccess('Triggered Reputation Event: Moral Choice');
                          } else {
                            showError('Reputation event callback not configured');
                          }
                        }}
                        className="p-4 bg-stone-800/50 border border-stone-700 rounded hover:border-yellow-500 transition-colors text-left"
                      >
                        <div className="font-semibold text-stone-200 mb-1">
                          Moral Choice
                        </div>
                        <div className="text-xs text-stone-400">
                          Face evil cultivator, make your choice
                        </div>
                      </button>

                      {/* Complex Event - Secret Realm Discovery */}
                      <button
                        onClick={() => {
                          if (onTriggerReputationEvent) {
                            onTriggerReputationEvent({
                              title: 'Secret Realm Discovery',
                              description: 'You discovered a hidden secret realm entrance during your adventure. This discovery might change your destiny, but also requires important choices.',
                              choices: [
                                {
                                  text: 'Explore alone',
                                  reputationChange: 5,
                                  description: 'You explored the secret realm alone and gained some harvest.',
                                  expChange: 100,
                                  hpChange: -50,
                                },
                                {
                                  text: 'Inform Sect about secret realm',
                                  reputationChange: 30,
                                  description: 'Your contribution impressed the Sect, reputation greatly increased!',
                                  spiritStonesChange: 150,
                                },
                                {
                                  text: 'Share with friends',
                                  reputationChange: 15,
                                  description: 'You explored with friends, gained friendship and reputation.',
                                  expChange: 60,
                                  hpChange: -25,
                                },
                              ],
                            });
                            showSuccess('Triggered Reputation Event: Secret Realm Discovery');
                          } else {
                            showError('Reputation event callback not configured');
                          }
                        }}
                        className="p-4 bg-stone-800/50 border border-stone-700 rounded hover:border-yellow-500 transition-colors text-left"
                      >
                        <div className="font-semibold text-stone-200 mb-1">
                          Secret Realm Discovery
                        </div>
                        <div className="text-xs text-stone-400">
                          Discover secret realm, make important choices
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Custom Reputation Event */}
                  <div>
                    <h4 className="font-semibold text-stone-200 mb-2">
                      Quick Test
                    </h4>
                    <div className="bg-stone-800/50 border border-stone-700 rounded p-4">
                      <p className="text-sm text-stone-300 mb-4">
                        Quickly test different types of reputation changes:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            if (onTriggerReputationEvent) {
                              onTriggerReputationEvent({
                                title: 'Test: Major Rep Increase',
                                description: 'This is a test event for major reputation increase.',
                                choices: [
                                  {
                                    text: 'Choice 1: +50 Reputation',
                                    reputationChange: 50,
                                    description: 'Reputation greatly increased!',
                                  },
                                ],
                              });
                              showSuccess('Triggered Test Event: Major Rep Increase');
                            } else {
                              showError('Reputation event callback not configured');
                            }
                          }}
                          className="px-3 py-2 bg-green-700 hover:bg-green-600 text-white rounded text-sm"
                        >
                          +50 Rep
                        </button>
                        <button
                          onClick={() => {
                            if (onTriggerReputationEvent) {
                              onTriggerReputationEvent({
                                title: 'Test: Medium Rep Increase',
                                description: 'This is a test event for medium reputation increase.',
                                choices: [
                                  {
                                    text: 'Choice 1: +20 Reputation',
                                    reputationChange: 20,
                                    description: 'Reputation increased!',
                                  },
                                ],
                              });
                              showSuccess('Triggered Test Event: Medium Rep Increase');
                            } else {
                              showError('Reputation event callback not configured');
                            }
                          }}
                          className="px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded text-sm"
                        >
                          +20 Rep
                        </button>
                        <button
                          onClick={() => {
                            if (onTriggerReputationEvent) {
                              onTriggerReputationEvent({
                                title: 'Test: Rep Decrease',
                                description: 'This is a test event for reputation decrease.',
                                choices: [
                                  {
                                    text: 'Choice 1: -20 Reputation',
                                    reputationChange: -20,
                                    description: 'Reputation decreased.',
                                  },
                                ],
                              });
                              showSuccess('Triggered Test Event: Rep Decrease');
                            } else {
                              showError('Reputation event callback not configured');
                            }
                          }}
                          className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded text-sm"
                        >
                          -20 Rep
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 border-t border-stone-800 p-4 md:p-6 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shrink-0 relative z-10">
          <button
            onClick={handleDisableDebugMode}
            className="h-12 px-6 bg-red-950/20 hover:bg-red-950/40 text-red-500 border border-red-900/50 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs font-bold relative group overflow-hidden"
            title="TERMINATE_DEBUG_PROTOCOL"
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <Power size={18} className="relative z-10" />
            <span className="relative z-10">TERMINATE_DEBUG</span>
          </button>
          <button
            onClick={handleReset}
            className="h-12 px-6 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs font-bold relative group overflow-hidden"
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <RotateCcw size={18} className="relative z-10" />
            <span className="relative z-10">REVERT_ALL</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugModal;
