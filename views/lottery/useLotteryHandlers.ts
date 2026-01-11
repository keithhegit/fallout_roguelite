import React, { useRef } from 'react';
import { PlayerStats, Pet, ItemType} from '../../types';
import { LOTTERY_PRIZES, PET_TEMPLATES } from '../../constants/index';
import { uid } from '../../utils/gameUtils';
import { addItemToInventory } from '../../utils/inventoryUtils';

interface UseLotteryHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setLotteryRewards: (
    rewards: Array<{ type: string; name: string; quantity?: number }>
  ) => void;
}

/**
 * Lottery Handler
 * Includes lottery logic
 * @param player Player data
 * @param setPlayer Set player data
 * @param addLog Add log
 * @param setLotteryRewards Set lottery rewards
 * @returns handleDraw Draw function
 */
export function useLotteryHandlers({
  player,
  setPlayer,
  addLog,
  setLotteryRewards,
}: UseLotteryHandlersProps) {
  const isDrawingRef = useRef(false); // Prevent duplicate calls
  const rewardTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Store reward display timer

  const handleDraw = (count: number) => {
    if (isDrawingRef.current) {
      return; // If drawing, ignore duplicate calls
    }
    if (!player || player.lotteryTickets < count) {
      addLog('Insufficient Lottery Tickets!', 'danger');
      return;
    }
    if (count <= 0 || !Number.isInteger(count)) {
      addLog('Draw count must be a positive integer!', 'danger');
      return;
    }

    // Check if prize pool is empty
    if (LOTTERY_PRIZES.length === 0) {
      addLog('Prize pool is empty!', 'danger');
      return;
    }

    isDrawingRef.current = true;

    const results: typeof LOTTERY_PRIZES = [];
    // Calculate guarantee: Rare or better every 10 draws
    const currentCount = player.lotteryCount;
    // Find which positions trigger guarantee in this draw batch (every 10th draw)
    // Optimization: Use Set for faster lookup
    const guaranteeIndices = new Set<number>();
    for (let i = 0; i < count; i++) {
      const totalCount = currentCount + i + 1;
      if (totalCount % 10 === 0) {
        guaranteeIndices.add(i);
      }
    }

    // Optimization: Pre-calculate rare prize list and total weight to avoid re-calculation in loop
    const rarePrizes = LOTTERY_PRIZES.filter((p) => p.rarity !== 'Common');
    const totalWeight = LOTTERY_PRIZES.reduce((sum, p) => sum + p.weight, 0);
    const rareTotalWeight = rarePrizes.reduce((sum, p) => sum + p.weight, 0);

    // Helper: Select prize by weight
    const selectPrizeByWeight = (prizes: typeof LOTTERY_PRIZES, weight: number) => {
      if (weight > 0) {
        let random = Math.random() * weight;
        for (const prize of prizes) {
          random -= prize.weight;
          if (random <= 0) {
            return prize;
          }
        }
      }
      // If weight is 0 or not found, return first prize as fallback
      return prizes.length > 0 ? prizes[0] : null;
    };

    for (let i = 0; i < count; i++) {
      // Check if guarantee should be triggered
      const shouldGuarantee = guaranteeIndices.has(i);
      if (shouldGuarantee) {
        // Guarantee Rare or better
        if (rarePrizes.length === 0) {
          // If no rare prizes, downgrade to use all prizes (defensive)
          const prize = selectPrizeByWeight(LOTTERY_PRIZES, totalWeight);
          if (prize) {
            results.push(prize);
          }
        } else {
          const prize = selectPrizeByWeight(rarePrizes, rareTotalWeight);
          if (prize) {
            results.push(prize);
          } else if (LOTTERY_PRIZES.length > 0) {
            // If even rare prizes fail, downgrade to first prize
            results.push(LOTTERY_PRIZES[0]);
          }
        }
      } else {
        // Normal draw
        const prize = selectPrizeByWeight(LOTTERY_PRIZES, totalWeight);
        if (prize) {
          results.push(prize);
        }
      }
    }

    // Check if all prizes generated successfully (defensive)
    if (results.length !== count) {
      console.error(`Draw result mismatch: Expected ${count}, Actual ${results.length}`);
      // If results insufficient, fill with first prize
      while (results.length < count && LOTTERY_PRIZES.length > 0) {
        results.push(LOTTERY_PRIZES[0]);
      }
    }

    // Tally all rewards for popup display first (before setPlayer to avoid multiple callbacks)
    const rewardMap = new Map<string, { type: string; name: string; quantity: number }>();

    // Traverse results once to tally rewards (without modifying inventory state yet)
    for (const prize of results) {
      if (prize.type === 'spiritStones') {
        const amount = prize.value.spiritStones || 0;
        const key = 'spiritStones';
        const existing = rewardMap.get(key);
        if (existing) {
          existing.quantity += amount;
        } else {
          rewardMap.set(key, { type: 'spiritStones', name: 'Spirit Stones', quantity: amount });
        }
      } else if (prize.type === 'exp') {
        const amount = prize.value.exp || 0;
        const key = 'exp';
        const existing = rewardMap.get(key);
        if (existing) {
          existing.quantity += amount;
        } else {
          rewardMap.set(key, { type: 'exp', name: 'Exp', quantity: amount });
        }
      } else if (prize.type === 'item' && prize.value.item) {
        const item = prize.value.item;
        const key = `item:${item.name}`;
        const existing = rewardMap.get(key);
        if (existing) {
          existing.quantity += 1;
        } else {
          rewardMap.set(key, { type: 'item', name: item.name, quantity: 1 });
        }
      } else if (prize.type === 'pet' && prize.value.petId) {
        const template = PET_TEMPLATES.find((t) => t.id === prize.value.petId);
        if (template) {
          // Merge display for pets with same name
          const key = `pet:${template.name}`;
          const existing = rewardMap.get(key);
          if (existing) {
            existing.quantity += 1;
          } else {
            rewardMap.set(key, { type: 'pet', name: template.name, quantity: 1 });
          }
        }
      } else if (prize.type === 'ticket') {
        const amount = prize.value.tickets || 0;
        const key = 'ticket';
        const existing = rewardMap.get(key);
        if (existing) {
          existing.quantity += amount;
        } else {
          rewardMap.set(key, { type: 'ticket', name: 'Tickets', quantity: amount });
        }
      }
    }

    // Convert to array
    const rewards = Array.from(rewardMap.values());

    setPlayer((prev) => {
      let newInv = [...prev.inventory];
      let newStones = prev.spiritStones;
      let newExp = prev.exp;
      const newPets = [...prev.pets];
      let newTickets = prev.lotteryTickets;

      for (const prize of results) {
        if (prize.type === 'spiritStones') {
          const amount = prize.value.spiritStones || 0;
          newStones += amount;
          addLog(`Gained ${amount} Spirit Stones`, 'gain');
        } else if (prize.type === 'exp') {
          const amount = prize.value.exp || 0;
          newExp += amount;
          addLog(`Gained ${amount} Exp`, 'gain');
        } else if (prize.type === 'item' && prize.value.item) {
          const item = prize.value.item;
          // Check if it is an advanced item
          if (item.advancedItemType && item.advancedItemId) {
            // Advanced item - use specific item info from prize
            if (item.advancedItemType === 'longevityRule') {
              // Rule power needs to check if already owned
              const currentRules = prev.longevityRules || [];
              const maxRules = prev.maxLongevityRules || 3;
              if (currentRules.includes(item.advancedItemId)) {
                addLog(`You already own the Rule [${item.name}]. Reward converted to Spirit Stones.`, 'gain');
                newStones += 20000;
              } else if (currentRules.length >= maxRules) {
                addLog(`You already have all Rules. Reward converted to Spirit Stones.`, 'gain');
                newStones += 20000;
              } else {
                newInv.push({
                  id: uid(),
                  name: item.name,
                  type: ItemType.AdvancedItem,
                  description: item.description,
                  quantity: 1,
                  rarity: item.rarity || 'Mythic',
                  advancedItemType: item.advancedItemType,
                  advancedItemId: item.advancedItemId,
                });
                const typeNames: Record<string, string> = {
                  foundationTreasure: 'Foundation Treasure',
                  heavenEarthEssence: 'Heaven Earth Essence',
                  heavenEarthMarrow: 'Heaven Earth Marrow',
                  longevityRule: 'Rule Power',
                };
                const typeName = typeNames[item.advancedItemType] || 'Advanced Item';
                addLog(`✨ Obtained ${typeName} [${item.name}]!`, 'special');
              }
            } else {
              // Other advanced items added directly
              newInv.push({
                id: uid(),
                name: item.name,
                type: ItemType.AdvancedItem,
                description: item.description,
                quantity: 1,
                rarity: item.rarity || 'Legendary',
                advancedItemType: item.advancedItemType,
                advancedItemId: item.advancedItemId,
              });
              const typeNames: Record<string, string> = {
                foundationTreasure: 'Foundation Treasure',
                heavenEarthEssence: 'Heaven Earth Essence',
                heavenEarthMarrow: 'Heaven Earth Marrow',
                longevityRule: 'Rule Power',
              };
              const typeName = typeNames[item.advancedItemType] || 'Advanced Item';
              addLog(`✨ Obtained ${typeName} [${item.name}]!`, 'special');
            }
          } else {
            // Normal item
            newInv = addItemToInventory(newInv, item);
            addLog(`Obtained ${item.name}!`, 'gain');
          }
        } else if (prize.type === 'pet' && prize.value.petId) {
          const template = PET_TEMPLATES.find(
            (t) => t.id === prize.value.petId
          );
          if (template) {
            const newPet: Pet = {
              id: uid(),
              name: template.name,
              species: template.species,
              level: 1,
              exp: 0,
              maxExp: 60, // Unified to 60
              rarity: template.rarity,
              stats: { ...template.baseStats },
              skills: [...template.skills],
              evolutionStage: 0,
              affection: 50,
            };
            newPets.push(newPet);
            addLog(`Obtained Pet [${template.name}]!`, 'special');
          }
        } else if (prize.type === 'ticket') {
          const amount = prize.value.tickets || 0;
          newTickets += amount;
          addLog(`Gained ${amount} Lottery Tickets`, 'gain');
        }
      }

      return {
        ...prev,
        lotteryTickets: newTickets - count,
        lotteryCount: prev.lotteryCount + count,
        inventory: newInv,
        spiritStones: newStones,
        exp: newExp,
        pets: newPets,
      };
    });

    // Clear previous timer
    if (rewardTimeoutRef.current) {
      clearTimeout(rewardTimeoutRef.current);
      rewardTimeoutRef.current = null;
    }

    // Show reward popup
    setLotteryRewards([]);
    if (rewards.length > 0) {
      // Delay showing rewards to ensure state update
      setTimeout(() => {
        setLotteryRewards([...rewards]); // Use spread operator to create new array
        // Hide rewards and reset state after 3 seconds
        const hideTimeout = setTimeout(() => {
          setLotteryRewards([]);
          isDrawingRef.current = false; // Reset drawing state
          rewardTimeoutRef.current = null;
        }, 3000);
        // Track the second timer (longest duration, needs cleanup)
        rewardTimeoutRef.current = hideTimeout;
      }, 0);
    } else {
      isDrawingRef.current = false; // If no rewards, reset immediately
    }
  };

  return {
    handleDraw,
  };
}
