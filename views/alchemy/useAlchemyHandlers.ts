import React from 'react';
import {
  PlayerStats,
  Recipe,
  Item,
  ItemType,
  EquipmentSlot,
  ItemRarity,
} from '../../types';
import { uid } from '../../utils/gameUtils';
import { addItemToInventory } from '../../utils/inventoryUtils';
import { showSuccess } from '../../utils/toastUtils';

interface UseAlchemyHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  triggerVisual?: (type: 'damage' | 'heal' | 'slash' | 'alchemy', value?: string, color?: string) => void;
}

/**
 * Chem Lab processing functions
 * @param player Player data
 * @param setPlayer Set player data
 * @param addLog Add log
 * @returns handleCraft Crafting function
 */
export function useAlchemyHandlers({
  setPlayer,
  addLog,
  triggerVisual,
}: UseAlchemyHandlersProps) {
  const handleCraft = async (recipe: Recipe) => {
    // Trigger synthesis animation
    if (triggerVisual) {
      triggerVisual('alchemy', '🔥 SYNTHESIZING...', 'text-amber-400');
    }

    // Delay for visual effect
    await new Promise((resolve) => setTimeout(resolve, 800));

    setPlayer((prev) => {
      if (prev.spiritStones < recipe.cost) return prev;

      const newInventory = [...prev.inventory];
      for (const req of recipe.ingredients) {
        const itemIdx = newInventory.findIndex((i) => i.name === req.name);
        if (itemIdx === -1 || newInventory[itemIdx].quantity < req.qty)
          return prev;

        newInventory[itemIdx] = {
          ...newInventory[itemIdx],
          quantity: newInventory[itemIdx].quantity - req.qty,
        };
      }

      const cleanedInventory = addItemToInventory(newInventory.filter((i) => i.quantity > 0), {
        name: recipe.result.name || 'Unknown',
        type: recipe.result.type || ItemType.Pill,
        description: recipe.result.description || '',
        rarity: (recipe.result.rarity as ItemRarity) || 'Common',
        effect: recipe.result.effect,
        permanentEffect: recipe.result.permanentEffect,
      });

      addLog(`Synthesis complete. Produced: ${recipe.result.name}.`, 'gain');
      // Show global success notification
      showSuccess(`SYNTHESIS SUCCESSFUL: ${recipe.result.name}`);
      // Trigger success animation
      if (triggerVisual) {
        // Delay for visual clarity
        setTimeout(() => {
          triggerVisual('alchemy', `✨ ${recipe.result.name}`, 'text-amber-400');
        }, 200);
      }

      const newStats = {
        ...(prev.statistics || {
          killCount: 0,
          meditateCount: 0,
          adventureCount: 0,
          equipCount: 0,
          petCount: 0,
          recipeCount: 0,
          artCount: 0,
          breakthroughCount: 0,
          secretRealmCount: 0,
          alchemyCount: 0,
        }),
      };
      newStats.alchemyCount = (newStats.alchemyCount || 0) + 1;

      return {
        ...prev,
        spiritStones: prev.spiritStones - recipe.cost,
        inventory: cleanedInventory,
        statistics: newStats,
      };
    });
  };

  return {
    handleCraft,
  };
}
