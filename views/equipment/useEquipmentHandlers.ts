import React from 'react';
import {
  PlayerStats,
  Item,
  ItemType,
  EquipmentSlot,
  ItemRarity,
  RealmType,
} from '../../types';
import { getItemStats } from '../../utils/itemUtils';
import { getPlayerTotalStats } from '../../utils/statUtils';
import {
  UPGRADE_MATERIAL_NAME,
  UPGRADE_STONE_NAME,
  UPGRADE_STONE_SUCCESS_BONUS,
  getUpgradeMultiplier,
  RARITY_MULTIPLIERS,
  REALM_ORDER,
} from '../../constants/index';
import { findEmptyEquipmentSlot, getEquipmentSlotLabel } from '../../utils/equipmentUtils';

interface UseEquipmentHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

/**
 * Equipment Handlers
 * Includes equipping, unequipping, refining natal artifact, unrefining natal artifact, opening upgrade UI, upgrading item
 * @param player Player data
 * @param setPlayer Set player data
 * @param addLog Add log
 * @returns handleEquipItem Equip item
 * @returns handleUnequipItem Unequip item
 * @returns handleRefineNatalArtifact Refine natal artifact
 * @returns handleUnrefineNatalArtifact Unrefine natal artifact
 * @returns handleOpenUpgrade Open upgrade UI
 * @returns handleUpgradeItem Upgrade item
 */
export function useEquipmentHandlers({
  player,
  setPlayer,
  addLog,
  setItemActionLog,
}: UseEquipmentHandlersProps) {
  const handleEquipItem = (item: Item, slot: EquipmentSlot) => {
    // Defensive check: Ensure slot is not null or undefined
    if (!slot) {
      addLog('Invalid equipment slot!', 'danger');
      return;
    }

    // Rings, accessories, and artifacts can be equipped without equipmentSlot (slot determined by type)
    const isRing = item.type === ItemType.Ring;
    const isAccessory = item.type === ItemType.Accessory;
    const isArtifact = item.type === ItemType.Artifact;

    // Other equipment types require equipmentSlot
    if (!isRing && !isAccessory && !isArtifact && !item.equipmentSlot) {
      addLog('This item cannot be equipped!', 'danger');
      return;
    }

    setPlayer((prev) => {
      // Check if item is in inventory
      const itemInInventory = prev.inventory.find((i) => i.id === item.id);
      if (!itemInInventory) {
        addLog('This item is not in your inventory!', 'danger');
        return prev;
      }

      // For rings, accessories, artifacts, find empty slot first
      // Only replace using passed slot if all slots are full
      let targetSlot = slot;
      if (isRing || isAccessory || isArtifact) {
        const emptySlot = findEmptyEquipmentSlot(item, prev.equippedItems);
        if (emptySlot) {
          // Check if found slot is truly empty
          const equippedItemId = prev.equippedItems[emptySlot];
          if (equippedItemId === undefined || equippedItemId === null || equippedItemId === '') {
            // Found empty slot, use it
            targetSlot = emptySlot;
          }
          // If slot occupied, all slots are full, replace using passed slot
          // targetSlot is already slot, no modification needed
        }
        // If emptySlot is null, item type cannot be equipped, but this should have been filtered
      }

      if (isRing) {
        const ringSlots = [
          EquipmentSlot.Ring1,
          EquipmentSlot.Ring2,
          EquipmentSlot.Ring3,
          EquipmentSlot.Ring4,
        ];
        if (!ringSlots.includes(targetSlot)) {
          addLog('Rings can only be equipped in ring slots!', 'danger');
          return prev;
        }
      } else if (isAccessory) {
        const accessorySlots = [
          EquipmentSlot.Accessory1,
          EquipmentSlot.Accessory2,
        ];
        if (!accessorySlots.includes(targetSlot)) {
          addLog('Accessories can only be equipped in accessory slots!', 'danger');
          return prev;
        }
      } else if (isArtifact) {
        const artifactSlots = [
          EquipmentSlot.Artifact1,
          EquipmentSlot.Artifact2,
        ];
        if (!artifactSlots.includes(targetSlot)) {
          addLog('Artifacts can only be equipped in artifact slots!', 'danger');
          return prev;
        }
      } else {
        // Other equipment types require exact match
        if (item.equipmentSlot !== targetSlot) {
          addLog('Equipment slot mismatch!', 'danger');
          return prev;
        }
      }

      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;
      const newEquippedItems = { ...prev.equippedItems };

      // Check equipment in current slot (use targetSlot instead of slot)
      const currentEquippedId = prev.equippedItems[targetSlot];

      // If item already equipped in same slot, do nothing
      if (currentEquippedId === item.id) {
        return prev;
      }

      // 0. If item already equipped in another slot, unequip from old slot first
      let oldSlot: EquipmentSlot | null = null;
      for (const [equippedSlot, equippedItemId] of Object.entries(
        prev.equippedItems
      )) {
        if (equippedItemId === item.id && equippedSlot !== targetSlot) {
          oldSlot = equippedSlot as EquipmentSlot;
          // Remove equipment ID from old slot
          delete newEquippedItems[oldSlot];
          // Subtract stats from old slot (if item equipped, stats already added, so subtract first)
          const isNatal = item.id === prev.natalArtifactId;
          const oldStats = getItemStats(item, isNatal);
          newAttack -= oldStats.attack;
          newDefense -= oldStats.defense;
          newMaxHp -= oldStats.hp;
          newSpirit -= oldStats.spirit;
          newPhysique -= oldStats.physique;
          newSpeed -= oldStats.speed;
          break;
        }
      }

      // 1. Remove stats from currently equipped item in this slot if any
      // Only subtract old stats if current slot has different item and it's not moved from another slot
      if (currentEquippedId && currentEquippedId !== item.id && !oldSlot) {
        const currentEquipped = prev.inventory.find(
          (i) => i.id === currentEquippedId
        );
        if (currentEquipped) {
          const isNatal = currentEquipped.id === prev.natalArtifactId;
          const stats = getItemStats(currentEquipped, isNatal);
          newAttack -= stats.attack;
          newDefense -= stats.defense;
          newMaxHp -= stats.hp;
          newSpirit -= stats.spirit;
          newPhysique -= stats.physique;
          newSpeed -= stats.speed;
        }
      }

      // 2. Add stats from new item
      // If item moved from another slot, old stats subtracted, now add stats to new slot
      // If slot was empty or had other item, add new item stats
      const isNatal = item.id === prev.natalArtifactId;
      const newStats = getItemStats(item, isNatal);
      newAttack += newStats.attack;
      newDefense += newStats.defense;
      newMaxHp += newStats.hp;
      newSpirit += newStats.spirit;
      newPhysique += newStats.physique;
      newSpeed += newStats.speed;

      // 3. Update equipped items (use targetSlot)
      newEquippedItems[targetSlot] = item.id;

      if (oldSlot) {
        const oldSlotLabel = getEquipmentSlotLabel(oldSlot);
        const targetSlotLabel = getEquipmentSlotLabel(targetSlot);
        const logMessage = `You moved ${item.name} from ${oldSlotLabel} to ${targetSlotLabel}.`;
        addLog(logMessage, 'normal');
        if (setItemActionLog) {
          setItemActionLog({ text: logMessage, type: 'normal' });
          // Delayed clearing handled automatically by useDelayedState in App.tsx
        }
      } else {
        const targetSlotLabel = getEquipmentSlotLabel(targetSlot);
        const logMessage = `You equipped ${item.name} to ${targetSlotLabel}. Power increased.`;
        addLog(logMessage, 'normal');
        if (setItemActionLog) {
          setItemActionLog({ text: logMessage, type: 'normal' });
          // Delayed clearing handled automatically by useDelayedState in App.tsx
        }
      }


      // Update statistics (only increment for new equipment)
      const playerStats = prev.statistics || {
        killCount: 0,
        meditateCount: 0,
        adventureCount: 0,
        equipCount: 0,
        petCount: 0,
        recipeCount: 0,
        artCount: 0,
        breakthroughCount: 0,
        secretRealmCount: 0,
      };
      let updatedStatistics = { ...playerStats };
      // If not previously equipped in this slot, or moved from another slot, increment count
      // Check using targetSlot
      const wasEquippedInTargetSlot = prev.equippedItems[targetSlot] === item.id;
      if (!wasEquippedInTargetSlot) {
        if (!oldSlot) {
          // New equipment, not moved
          updatedStatistics.equipCount += 1;
        }
      }

      // Calculate actual max HP (including cultivation art bonus, etc.) as limit
      const tempPlayer = { ...prev, maxHp: newMaxHp };
      const totalStats = getPlayerTotalStats(tempPlayer);
      const actualMaxHp = totalStats.maxHp;

      return {
        ...prev,
        equippedItems: newEquippedItems,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: Math.min(prev.hp, actualMaxHp), // Use actual max HP as limit
        spirit: newSpirit,
        physique: newPhysique,
        speed: Math.max(0, newSpeed),
        statistics: updatedStatistics,
      };
    });
  };

  const handleUnequipItem = (slot: EquipmentSlot) => {
    setPlayer((prev) => {
      const currentEquippedId = prev.equippedItems[slot];
      if (!currentEquippedId) {
        addLog('No equipment in this slot!', 'danger');
        return prev;
      }

      const item = prev.inventory.find((i) => i.id === currentEquippedId);
      if (!item) return prev;

      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      const isNatal = item.id === prev.natalArtifactId;
      const stats = getItemStats(item, isNatal);
      newAttack -= stats.attack;
      newDefense -= stats.defense;
      newMaxHp -= stats.hp;
      newSpirit -= stats.spirit;
      newPhysique -= stats.physique;
      newSpeed -= stats.speed;

      const newEquippedItems = { ...prev.equippedItems };
      delete newEquippedItems[slot];

      // Ensure max HP is at least 1
      const finalMaxHp = Math.max(1, newMaxHp);

      // Calculate actual max HP (including cultivation art bonus, etc.) as limit
      // Use updated equippedItems for calculation to ensure accuracy
      const tempPlayer = { ...prev, maxHp: finalMaxHp, equippedItems: newEquippedItems };
      const totalStats = getPlayerTotalStats(tempPlayer);
      const actualMaxHp = Math.max(1, totalStats.maxHp); // Ensure actual max HP is at least 1

      addLog(`You unequipped ${item.name}.`, 'normal');

      // Calculate new HP: Cannot exceed new max HP, ensure at least 1 (avoid death)
      // If current HP > new max HP, limit to new max HP
      // If current HP might cause death (<=0), keep at least 1 HP
      const newHp = Math.max(1, Math.min(actualMaxHp, prev.hp));

      return {
        ...prev,
        equippedItems: newEquippedItems,
        attack: newAttack,
        defense: newDefense,
        maxHp: finalMaxHp,
        hp: newHp,
        spirit: newSpirit,
        physique: newPhysique,
        speed: Math.max(0, newSpeed),
      };
    });
  };

  const handleRefineNatalArtifact = (item: Item) => {
    if (item.type !== ItemType.Artifact) {
      addLog('Only Artifacts can be refined into a Natal Artifact!', 'danger');
      return;
    }

    if (item.isNatal) {
      addLog('This Artifact is already your Natal Artifact!', 'normal');
      return;
    }

    // Check realm requirement: must be Golden Core or higher
    const realmIndex = REALM_ORDER.indexOf(player.realm);
    const goldenCoreIndex = REALM_ORDER.indexOf(RealmType.GoldenCore);
    if (realmIndex < goldenCoreIndex) {
      addLog('Refining a Natal Artifact requires Golden Core realm!', 'danger');
      return;
    }

    setPlayer((prev) => {
      if (prev.natalArtifactId) {
        const currentNatal = prev.inventory.find(
          (i) => i.id === prev.natalArtifactId
        );
        if (currentNatal) {
          addLog(
            `You already have a Natal Artifact [${currentNatal.name}]. Unrefine it first.`,
            'danger'
          );
          return prev;
        }
      }

      // Consume Max HP
      const rarity = (item.rarity as ItemRarity) || 'Common';
      const hpCostMap: Record<ItemRarity, number> = {
        Common: 50,
        Rare: 100,
        Legendary: 200,
        Mythic: 500,
      };
      const hpCost = hpCostMap[rarity];

      if (prev.maxHp <= hpCost) {
        addLog(`Insufficient Max HP! Refining requires ${hpCost} Max HP.`, 'danger');
        return prev;
      }

      // Update item, mark as Natal
      const newInventory = prev.inventory.map((i) => {
        if (i.id === item.id) {
          return { ...i, isNatal: true };
        }
        if (i.id === prev.natalArtifactId) {
          return { ...i, isNatal: false };
        }
        return i;
      });

      const newMaxHp = prev.maxHp - hpCost;

      // Calculate actual max HP
      const tempPlayer = { ...prev, maxHp: newMaxHp };
      const totalStats = getPlayerTotalStats(tempPlayer);
      const actualMaxHp = totalStats.maxHp;
      const newHp = Math.min(prev.hp, actualMaxHp);

      // If Natal Artifact is equipped, recalculate stats
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      const isEquipped = Object.values(prev.equippedItems).includes(item.id);
      if (isEquipped) {
        const oldStats = getItemStats(item, false);
        const newStats = getItemStats(item, true);
        newAttack = newAttack - oldStats.attack + newStats.attack;
        newDefense = newDefense - oldStats.defense + newStats.defense;
        newSpirit = newSpirit - oldStats.spirit + newStats.spirit;
        newPhysique = newPhysique - oldStats.physique + newStats.physique;
        newSpeed = newSpeed - oldStats.speed + newStats.speed;
      }

      addLog(
        `You sacrificed ${hpCost} Max HP to refine [${item.name}] as your Natal Artifact!`,
        'special'
      );
      addLog(`The Natal Artifact is bound to your life. Stats bonus increased by 50%!`, 'special');

      return {
        ...prev,
        inventory: newInventory,
        natalArtifactId: item.id,
        maxHp: newMaxHp,
        hp: newHp,
        attack: newAttack,
        defense: newDefense,
        spirit: newSpirit,
        physique: newPhysique,
        speed: Math.max(0, newSpeed),
      };
    });
  };

  const handleUnrefineNatalArtifact = () => {
    setPlayer((prev) => {
      if (!prev.natalArtifactId) {
        addLog('You do not have a Natal Artifact!', 'danger');
        return prev;
      }

      const natalItem = prev.inventory.find(
        (i) => i.id === prev.natalArtifactId
      );
      if (!natalItem) {
        addLog('Natal Artifact not found!', 'danger');
        return prev;
      }

      const newInventory = prev.inventory.map((i) => {
        if (i.id === prev.natalArtifactId) {
          return { ...i, isNatal: false };
        }
        return i;
      });

      // If Natal Artifact is equipped, recalculate stats (remove bonus)
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      const isEquipped = Object.values(prev.equippedItems).includes(
        prev.natalArtifactId
      );
      if (isEquipped) {
        const oldStats = getItemStats(natalItem, true);
        const newStats = getItemStats(natalItem, false);
        newAttack = newAttack - oldStats.attack + newStats.attack;
        newDefense = newDefense - oldStats.defense + newStats.defense;
        newSpirit = newSpirit - oldStats.spirit + newStats.spirit;
        newPhysique = newPhysique - oldStats.physique + newStats.physique;
        newSpeed = newSpeed - oldStats.speed + newStats.speed;
      }

      addLog('You have unrefined your Natal Artifact.', 'normal');

      return {
        ...prev,
        inventory: newInventory,
        natalArtifactId: null,
        attack: newAttack,
        defense: newDefense,
        spirit: newSpirit,
        physique: newPhysique,
        speed: Math.max(0, newSpeed),
      };
    });
  };

  const handleOpenUpgrade = (item: Item) => {
    return item; // This function is mainly for setting state, actual logic is in the caller
  };

  const handleUpgradeItem = async (
    item: Item,
    costStones: number,
    costMats: number,
    upgradeStones: number = 0
  ): Promise<'success' | 'failure' | 'error'> => {
    return new Promise((resolve) => {
      setPlayer((prev) => {
      const matsItem = prev.inventory.find(
        (i) => i.name === UPGRADE_MATERIAL_NAME
      );
      const upgradeStoneItem = prev.inventory.find(
        (i) => i.name === UPGRADE_STONE_NAME
      );

      // Check Spirit Stones and materials
      if (
        prev.spiritStones < costStones ||
        !matsItem ||
        matsItem.quantity < costMats
      ) {
        resolve('error');
        return prev;
      }

      // Check Upgrade Stones only if used
      if (
        upgradeStones > 0 &&
        (!upgradeStoneItem || upgradeStoneItem.quantity < upgradeStones)
      ) {
        resolve('error');
        return prev;
      }

      // Calculate success rate
      const currentLevel = item.level || 0;
      const rarity = item.rarity || 'Common';
      const rarityMult = RARITY_MULTIPLIERS[rarity];
      const baseSuccessRate = Math.max(
        0.1,
        1 - currentLevel * 0.1 - (rarityMult - 1) * 0.15
      );
      const successRate = Math.min(
        1,
        baseSuccessRate + upgradeStones * UPGRADE_STONE_SUCCESS_BONUS
      );

      // Determine success
      const isSuccess = Math.random() < successRate;

      // Consume materials
      const newInventory = prev.inventory
        .map((i) => {
          if (i.name === UPGRADE_MATERIAL_NAME) {
            return { ...i, quantity: i.quantity - costMats };
          }
          if (i.name === UPGRADE_STONE_NAME && upgradeStones > 0) {
            return { ...i, quantity: i.quantity - upgradeStones };
          }
          return i;
        })
        .filter((i) => i.quantity > 0);

      // Consume spirit stones (consumed regardless of success/failure)
      const newSpiritStones = prev.spiritStones - costStones;

      if (!isSuccess) {
        addLog(`Refinement failed! ${item.name} quality did not improve, materials consumed.`, 'danger');
        resolve('failure');
        return {
          ...prev,
          spiritStones: newSpiritStones,
          inventory: newInventory,
        };
      }

      // Success: Improve stats
      const growthRate = getUpgradeMultiplier(rarity);
      const getNextStat = (val: number) => Math.floor(val * (1 + growthRate));

      const newEffect = {
        ...item.effect,
        attack: item.effect?.attack
          ? getNextStat(item.effect.attack)
          : undefined,
        defense: item.effect?.defense
          ? getNextStat(item.effect.defense)
          : undefined,
        hp: item.effect?.hp ? getNextStat(item.effect.hp) : undefined,
        spirit: item.effect?.spirit
          ? getNextStat(item.effect.spirit)
          : undefined,
        physique: item.effect?.physique
          ? getNextStat(item.effect.physique)
          : undefined,
        speed: item.effect?.speed ? getNextStat(item.effect.speed) : undefined,
      };

      const finalInventory = newInventory.map((i) => {
        if (i.id === item.id) {
          return {
            ...i,
            level: (i.level || 0) + 1,
            effect: newEffect,
          };
        }
        return i;
      });

      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      // Check if item is equipped in any slot
      const equippedSlot = Object.entries(prev.equippedItems).find(
        ([_, itemId]) => itemId === item.id
      )?.[0] as EquipmentSlot | undefined;
      if (equippedSlot) {
        const isNatal = item.id === prev.natalArtifactId;
        const oldStats = getItemStats(item, isNatal);
        newAttack -= oldStats.attack;
        newDefense -= oldStats.defense;
        newMaxHp -= oldStats.hp;
        newSpirit -= oldStats.spirit;
        newPhysique -= oldStats.physique;
        newSpeed -= oldStats.speed;

        const newItem = {
          ...item,
          effect: newEffect,
          level: (item.level || 0) + 1,
        };
        const newStats = getItemStats(newItem, isNatal);

        newAttack += newStats.attack;
        newDefense += newStats.defense;
        newMaxHp += newStats.hp;
        newSpirit += newStats.spirit;
        newPhysique += newStats.physique;
        newSpeed += newStats.speed;
      }

      addLog(`Refinement successful! ${item.name} quality has improved.`, 'gain');
      resolve('success');

      return {
        ...prev,
        spiritStones: newSpiritStones,
        inventory: finalInventory,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        spirit: newSpirit,
        physique: newPhysique,
        speed: Math.max(0, newSpeed),
      };
      });
    });
  };

  return {
    handleEquipItem,
    handleUnequipItem,
    handleRefineNatalArtifact,
    handleUnrefineNatalArtifact,
    handleOpenUpgrade,
    handleUpgradeItem,
  };
}
