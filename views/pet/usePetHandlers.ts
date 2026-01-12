import React from 'react';
import { PlayerStats, ItemRarity, ItemType } from '../../types';
import {
  PET_TEMPLATES,
  REALM_ORDER,
} from '../../constants/index';

interface UsePetHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

/**
 * Pet Handlers
 * Includes activating pet, feeding pet, evolving pet
 * @param player Player data
 * @param setPlayer Set player data
 * @param addLog Add log
 * @returns handleActivatePet Activate pet
 * @returns handleFeedPet Feed pet
 * @returns handleEvolvePet Evolve pet
 */

export function usePetHandlers({
  player,
  setPlayer,
  addLog,
  setItemActionLog,
}: UsePetHandlersProps) {
  const handleActivatePet = (petId: string) => {
    if (!player) return;
    setPlayer((prev) => ({ ...prev, activePetId: petId }));
    const pet = player.pets.find((p) => p.id === petId);
    if (pet) addLog(`You activated pet [${pet.name}]!`, 'gain');
  };

  const handleDeactivatePet = () => {
    if (!player) return;
    const activePet = player.pets.find((p) => p.id === player.activePetId);
    setPlayer((prev) => ({ ...prev, activePetId: null }));
    if (activePet)
      addLog(`You deactivated pet [${activePet.name}].`, 'normal');
  };

  const handleFeedPet = (
    petId: string,
    feedType: 'hp' | 'item' | 'exp',
    itemId?: string
  ) => {
    if (!player) return;

    const pet = player.pets.find((p) => p.id === petId);
    if (!pet) return;

    // Check cost
    let canFeed = false;
    let costMessage = '';

    if (feedType === 'hp') {
      const hpCost = 200;
      if (player.hp >= hpCost) {
        canFeed = true;
        costMessage = `Consumed ${hpCost} HP`;
      } else {
        addLog(
          `Insufficient HP! Need ${hpCost}, have ${player.hp}.`,
          'danger'
        );
        return;
      }
    } else if (feedType === 'item') {
      if (!itemId) {
        addLog('Please select an item to feed.', 'danger');
        return;
      }
      const item = player.inventory.find((i) => i.id === itemId);
      if (!item || item.quantity <= 0) {
        addLog('Item not found or insufficient quantity.', 'danger');
        return;
      }
      canFeed = true;
      costMessage = `Consumed 1 [${item.name}]`;
    } else if (feedType === 'exp') {
      const expCost = Math.max(1, Math.floor(player.exp * 0.05)); // Consume 5% current Exp, at least 1 point
      if (player.exp >= expCost) {
        canFeed = true;
        costMessage = `Consumed ${expCost} Exp`;
      } else {
        addLog(
          `Insufficient Exp! Need ${expCost}, have ${player.exp}.`,
          'danger'
        );
        return;
      }
    }

    if (!canFeed) return;

    setPlayer((prev) => {
      if (!prev) return prev;

      // Calculate exp first (needs item info, calculate before deduction)
      // Significantly increase base exp
      let baseExp = 300; // Base exp increased from 200 to 300

      // Calculate base exp based on player realm (higher realm, higher base exp)
      const realmIndex = REALM_ORDER.indexOf(prev.realm);
      const realmMultiplier = 1 + realmIndex * 3.0; // Increase base exp by 300% per realm (increased from 250%)
      const levelMultiplier = 1 + prev.realmLevel * 0.6; // Increase by 60% per layer (increased from 50%)
      baseExp = Math.floor(baseExp * realmMultiplier * levelMultiplier);

      // Adjust exp multiplier based on feed type
      let feedTypeMultiplier = 1;
      if (feedType === 'hp') {
        feedTypeMultiplier = 1.5; // HP feeding gives 1.5x exp (increased from 1.2)
      } else if (feedType === 'exp') {
        feedTypeMultiplier = 2.0; // Exp feeding gives 2.0x exp (increased from 1.5)
      } else if (feedType === 'item') {
        feedTypeMultiplier = 3.5; // Item feeding base multiplier increased from 3 to 3.5
      }

      // Calculate exp multiplier based on item rarity
      // Classified by rarity: Common, Rare, Legendary, Mythic
      let rarityMultiplier = 1;
      if (feedType === 'item' && itemId) {
        const item = prev.inventory.find((i) => i.id === itemId);
        if (item) {
          const rarity = item.rarity || 'Common';
          // Set base exp multiplier based on rarity (more distinct difference)
          const rarityBaseMultipliers: Record<ItemRarity, number> = {
            Common: 1.0,
            Rare: 2.5,
            Legendary: 5.0,
            Mythic: 15.0,
          };
          rarityMultiplier = rarityBaseMultipliers[rarity] || 1.0;

          // Extra bonus for material items (materials are more suitable for feeding)
          if (item.type === ItemType.Material) {
            rarityMultiplier *= 1.5; // Material items get extra 50% bonus
          }
        }
      }

      // Calculate final exp (Base Exp * Type Multiplier * Rarity Multiplier, random fluctuation ±15%)
      let expGain = Math.floor(baseExp * feedTypeMultiplier * rarityMultiplier);
      const randomVariation = 0.85 + Math.random() * 0.3; // 0.85 to 1.15
      expGain = Math.floor(expGain * randomVariation);

      // Give at least 1 exp
      expGain = Math.max(1, expGain);

      // Deduct cost
      let newHp = prev.hp;
      let newExp = prev.exp;
      let newInventory = [...prev.inventory];

      if (feedType === 'hp') {
        newHp = Math.max(0, prev.hp - 200);
      } else if (feedType === 'item' && itemId) {
        newInventory = prev.inventory
          .map((item) => {
            if (item.id === itemId) {
              return { ...item, quantity: item.quantity - 1 };
            }
            return item;
          })
          .filter((item) => item.quantity > 0);
      } else if (feedType === 'exp') {
        const expCost = Math.max(1, Math.floor(prev.exp * 0.05));
        newExp = Math.max(0, prev.exp - expCost);
      }

      // Increase affection (2-5 points per feed)
      const affectionGain = Math.floor(2 + Math.random() * 4);

      const newPets = prev.pets.map((p) => {
        if (p.id === petId) {
          let petNewExp = p.exp + expGain;
          let petNewLevel = p.level;
          let petNewMaxExp = p.maxExp;
          let leveledUp = false;

          // Handle level up (may level up directly if exp is enough)
          while (petNewExp >= petNewMaxExp && petNewLevel < 100) {
            petNewExp -= petNewMaxExp;
            petNewLevel += 1;
            petNewMaxExp = Math.floor(petNewMaxExp * 1.2); // Reduce exp growth multiplier, from 1.3 to 1.2
            leveledUp = true;
            addLog(`[${p.name}] leveled up! Now level ${petNewLevel}.`, 'gain');
          }

          // If level 100 reached, cap exp at maxExp
          if (petNewLevel >= 100) {
            petNewExp = Math.min(petNewExp, petNewMaxExp);
          }

          // Only increase stats on level up
          const newStats = leveledUp
            ? {
                attack: Math.floor(p.stats.attack * 1.2), // Increased from 1.1 to 1.2 (+20% per level)
                defense: Math.floor(p.stats.defense * 1.2), // Increased from 1.1 to 1.2 (+20% per level)
                hp: Math.floor(p.stats.hp * 1.2), // Increased from 1.1 to 1.2 (+20% per level)
                speed: Math.floor(p.stats.speed * 1.1), // Increased from 1.05 to 1.1 (+10% per level)
              }
            : p.stats;

          // Increase affection (max 100)
          const newAffection = Math.min(100, p.affection + affectionGain);

          return {
            ...p,
            level: petNewLevel,
            exp: petNewExp,
            maxExp: petNewMaxExp,
            stats: newStats,
            affection: newAffection,
          };
        }
        return p;
      });

      // Build feedback message
      let feedbackMessage = `${costMessage}, [${pet.name}] gained ${expGain} Exp`;
      if (affectionGain > 0) {
        feedbackMessage += `, Affection +${affectionGain}`;
      }
      addLog(feedbackMessage, 'gain');

      return {
        ...prev,
        hp: newHp,
        exp: newExp,
        inventory: newInventory,
        pets: newPets,
      };
    });
  };

  const handleEvolvePet = (petId: string) => {
    if (!player) {
      addLog('Evolution failed: Player data missing!', 'danger');
      return;
    }

    const pet = player.pets.find((p) => p.id === petId);
    if (!pet) {
      addLog('Evolution failed: Pet not found!', 'danger');
      return;
    }

    if (pet.evolutionStage >= 2) {
      addLog('Pet has reached its final form!', 'danger');
      return;
    }

    const template = PET_TEMPLATES.find((t) => t.species === pet.species);
    if (!template) {
      addLog(`Evolution failed: Template for [${pet.species}] not found!`, 'danger');
      return;
    }

    if (!template.evolutionRequirements) {
      addLog('This pet cannot evolve!', 'danger');
      return;
    }

    // Determine requirements for current evolution stage
    const nextStage = pet.evolutionStage + 1; // 0->1 or 1->2
    const requirements =
      nextStage === 1
        ? template.evolutionRequirements.stage1 ||
          template.evolutionRequirements
        : template.evolutionRequirements.stage2 ||
          template.evolutionRequirements;

    // Check level requirement
    if (pet.level < (requirements.level || 0)) {
      const message = `Level too low! Need level ${requirements.level} to evolve to ${nextStage === 1 ? 'Mature' : 'Complete'} form.`;
      addLog(message, 'danger');
      if (setItemActionLog) {
        setItemActionLog({ text: message, type: 'danger' });
        // Delayed clearing handled automatically by useDelayedState in App.tsx
      }
      return;
    }

    // Check material requirements
    if (requirements.items && requirements.items.length > 0) {
      const missingItems: string[] = [];
      requirements.items.forEach((req) => {
        const item = player.inventory.find((i) => i.name === req.name);
        if (!item || item.quantity < req.quantity) {
          missingItems.push(`${req.name} x${req.quantity}`);
        }
      });

      if (missingItems.length > 0) {
        const message = `Insufficient materials! Need: ${missingItems.join(', ')}`;
        addLog(message, 'normal');
        // Show top-right toast
        if (setItemActionLog) {
          setItemActionLog({ text: message, type: 'normal' });
          // Delayed clearing handled automatically by useDelayedState in App.tsx
        }
        return;
      }
    }

    setPlayer((prev) => {
      if (!prev) return prev;

      // Deduct materials
      let newInventory = [...prev.inventory];
      if (requirements.items && requirements.items.length > 0) {
        requirements.items.forEach((req) => {
          newInventory = newInventory
            .map((item) => {
              if (item.name === req.name) {
                return { ...item, quantity: item.quantity - req.quantity };
              }
              return item;
            })
            .filter((item) => item.quantity > 0);
        });
      }

      // Update pet
      const newPets = prev.pets.map((p) => {
        if (p.id === petId) {
          const newStage = p.evolutionStage + 1;
          // Increase stats based on stage (significant increase to match realm)
          const statMultiplier = newStage === 1 ? 4.5 : 5.0; // Mature stage 4.5x, Complete stage 5x (Total 22.5x)
          const speedMultiplier = newStage === 1 ? 2.0 : 2.5; // Speed increase 2.0x and 2.5x

          // Update name (if evolution name exists)
          let newName = p.name;
          if (template.evolutionNames) {
            if (newStage === 1 && template.evolutionNames.stage1) {
              newName = template.evolutionNames.stage1;
            } else if (newStage === 2 && template.evolutionNames.stage2) {
              newName = template.evolutionNames.stage2;
            }
          }

          // Update skills and image
          const stageSkills =
            newStage === 1
              ? template.stageSkills?.stage1 || []
              : template.stageSkills?.stage2 || [];

          const stageImage =
            newStage === 1
              ? template.stageImages?.stage1 || template.image
              : template.stageImages?.stage2 || template.image;

          const stageName = newStage === 1 ? 'Mature' : 'Complete';
          addLog(
            `[${p.name}] evolved to ${stageName}! ${newName !== p.name ? `Renamed to [${newName}]! ` : ''}Power increased significantly, new skill learned!`,
            'special'
          );

          return {
            ...p,
            name: newName,
            evolutionStage: newStage,
            image: stageImage,
            skills: [...p.skills, ...stageSkills], // Keep old skills, add new skills
            stats: {
              attack: Math.floor(p.stats.attack * statMultiplier),
              defense: Math.floor(p.stats.defense * statMultiplier),
              hp: Math.floor(p.stats.hp * statMultiplier),
              speed: Math.floor(p.stats.speed * speedMultiplier),
            },
          };
        }
        return p;
      });

      return { ...prev, inventory: newInventory, pets: newPets };
    });
  };

  const handleBatchFeedItems = (petId: string, itemIds: string[]) => {
    if (!player || itemIds.length === 0) return;

    const pet = player.pets.find((p) => p.id === petId);
    if (!pet) return;

    // Batch feed: Process all items directly, no delay animation
    setPlayer((prev) => {
      if (!prev) return prev;

      let totalExpGain = 0;
      let totalAffectionGain = 0;
      let newInventory = [...prev.inventory];
      const itemCounts = new Map<string, number>();

      // Count occurrences of each item ID (quantity to feed)
      itemIds.forEach((itemId) => {
        itemCounts.set(itemId, (itemCounts.get(itemId) || 0) + 1);
      });

      // Calculate total exp for all items
      itemCounts.forEach((count, itemId) => {
        const item = prev.inventory.find((i) => i.id === itemId);
        if (item && item.quantity > 0) {
          // Calculate exp provided by this item (reuse feeding logic)
          let baseExp = 200; // Base exp increased from 100 to 200
          const realmIndex = REALM_ORDER.indexOf(prev.realm);
          const realmMultiplier = 1 + realmIndex * 1.2; // Increase base exp by 120% per realm
          const levelMultiplier = 1 + prev.realmLevel * 0.2; // Increase by 20% per layer
          baseExp = Math.floor(baseExp * realmMultiplier * levelMultiplier);

          // Item feeding multiplier
          const feedTypeMultiplier = 1.3; // Item feeding base multiplier increased from 1.0 to 1.3

          const rarity = item.rarity || 'Common';
          // Set base exp multiplier based on rarity (more distinct difference)
          const rarityBaseMultipliers: Record<ItemRarity, number> = {
            Common: 1.0,
            Rare: 2.5,
            Legendary: 5.0,
            Mythic: 15.0,
          };
          let rarityMultiplier = rarityBaseMultipliers[rarity] || 1.0;

          // Extra bonus for material items (materials are more suitable for feeding)
          if (item.type === ItemType.Material) {
            rarityMultiplier *= 1.5; // Material items get extra 50% bonus
          }

          // Apply item feeding multiplier
          baseExp = Math.floor(baseExp * feedTypeMultiplier);

          // Calculate single item exp
          const singleExpGain = Math.floor(
            baseExp * rarityMultiplier * (0.85 + Math.random() * 0.3)
          );

          // Accumulate exp based on quantity
          totalExpGain += singleExpGain * count;

          // Deduct items (deduct count)
          const actualCount = Math.min(count, item.quantity); // Ensure not exceeding actual quantity
          newInventory = newInventory
            .map((invItem) => {
              if (invItem.id === itemId) {
                return { ...invItem, quantity: invItem.quantity - actualCount };
              }
              return invItem;
            })
            .filter((invItem) => invItem.quantity > 0);
        }
      });

      // Increase affection (2-5 points per item, based on actual quantity fed)
      totalAffectionGain = Math.floor((2 + Math.random() * 4) * itemIds.length);

      // Update pet
      const newPets = prev.pets.map((p) => {
        if (p.id === petId) {
          let petNewExp = p.exp + totalExpGain;
          let petNewLevel = p.level;
          let petNewMaxExp = p.maxExp;
          let leveledUp = false;

          // Handle level up
          while (petNewExp >= petNewMaxExp && petNewLevel < 100) {
            petNewExp -= petNewMaxExp;
            petNewLevel += 1;
            petNewMaxExp = Math.floor(petNewMaxExp * 1.2); // Reduce exp growth multiplier, from 1.3 to 1.2
            leveledUp = true;
            addLog(`[${p.name}] leveled up! Now level ${petNewLevel}.`, 'gain');
          }

          // If level 100 reached, cap exp at maxExp
          if (petNewLevel >= 100) {
            petNewExp = Math.min(petNewExp, petNewMaxExp);
          }

          const newStats = leveledUp
            ? {
                attack: Math.floor(p.stats.attack * 1.2), // Increased from 1.1 to 1.2 (+20% per level)
                defense: Math.floor(p.stats.defense * 1.2), // Increased from 1.1 to 1.2 (+20% per level)
                hp: Math.floor(p.stats.hp * 1.2), // Increased from 1.1 to 1.2 (+20% per level)
                speed: Math.floor(p.stats.speed * 1.1), // Increased from 1.05 to 1.1 (+10% per level)
              }
            : p.stats;

          const newAffection = Math.min(100, p.affection + totalAffectionGain);

          return {
            ...p,
            level: petNewLevel,
            exp: petNewExp,
            maxExp: petNewMaxExp,
            stats: newStats,
            affection: newAffection,
          };
        }
        return p;
      });

      addLog(
        `Batch feed complete. [${pet.name}] gained ${totalExpGain} Exp, Affection +${totalAffectionGain}.`,
        'gain'
      );

      return {
        ...prev,
        inventory: newInventory,
        pets: newPets,
      };
    });
  };

  const handleReleasePet = (petId: string) => {
    if (!player) return;

    const pet = player.pets.find((p) => p.id === petId);
    if (!pet) {
      addLog('Pet not found!', 'danger');
      return;
    }

    // If releasing active pet, deactivate it
    const isActivePet = player.activePetId === petId;

    setPlayer((prev) => {
      if (!prev) return prev;

      // Remove pet
      const newPets = prev.pets.filter((p) => p.id !== petId);

      // If active pet released, deactivate
      const newActivePetId = isActivePet ? null : prev.activePetId;

      // Compensate based on pet level and rarity (Spirit Stones)
      const baseCompensation = 100;
      const levelMultiplier = 1 + pet.level * 0.1; // Increase 10% per level
      const rarityMultiplier =
        {
          Common: 1,
          Rare: 2,
          Legendary: 5,
          Mythic: 10,
        }[pet.rarity] || 1;
      const compensation = Math.floor(
        baseCompensation * levelMultiplier * rarityMultiplier
      );

      addLog(
        `You released [${pet.name}] and received ${compensation} Spirit Stones.`,
        isActivePet ? 'normal' : 'gain'
      );

      return {
        ...prev,
        pets: newPets,
        activePetId: newActivePetId,
        spiritStones: prev.spiritStones + compensation,
      };
    });
  };

  const handleBatchReleasePets = (petIds: string[]) => {
    if (!player || petIds.length === 0) return;

    setPlayer((prev) => {
      if (!prev) return prev;

      let totalCompensation = 0;
      const releasedPetNames: string[] = [];
      const wasActivePet = petIds.includes(prev.activePetId || '');

      // Calculate compensation for all released pets
      petIds.forEach((petId) => {
        const pet = prev.pets.find((p) => p.id === petId);
        if (pet) {
          const baseCompensation = 100;
          const levelMultiplier = 1 + pet.level * 0.1;
          const rarityMultiplier =
            {
              Common: 1,
              Rare: 2,
              Legendary: 5,
              Mythic: 10,
            }[pet.rarity] || 1;
          const compensation = Math.floor(
            baseCompensation * levelMultiplier * rarityMultiplier
          );
          totalCompensation += compensation;
          releasedPetNames.push(pet.name);
        }
      });

      // Remove pet
      const newPets = prev.pets.filter((p) => !petIds.includes(p.id));

      // If active pet released, deactivate
      const newActivePetId = wasActivePet ? null : prev.activePetId;

      addLog(
        `Batch released ${petIds.length} pets (${releasedPetNames.join(', ')}), received ${totalCompensation} Spirit Stones.`,
        'gain'
      );

      return {
        ...prev,
        pets: newPets,
        activePetId: newActivePetId,
        spiritStones: prev.spiritStones + totalCompensation,
      };
    });
  };

  const handleBatchFeedHp = (petId: string, times?: number) => {
    if (!player) return;

    const pet = player.pets.find((p) => p.id === petId);
    if (!pet) return;

    const hpCost = 200;
    const maxFeeds = times || Math.floor(player.hp / hpCost);

    if (maxFeeds <= 0) {
      addLog(
        `Insufficient HP! Need ${hpCost} HP, have ${player.hp}.`,
        'danger'
      );
      return;
    }

    setPlayer((prev) => {
      if (!prev) return prev;

      const actualFeeds = Math.min(maxFeeds, Math.floor(prev.hp / hpCost));
      if (actualFeeds <= 0) return prev;

      // Calculate total exp
      let totalExpGain = 0;
      let totalAffectionGain = 0;

      for (let i = 0; i < actualFeeds; i++) {
        // Base Exp
        let baseExp = 300; // Increased from 200 to 300
        const realmIndex = REALM_ORDER.indexOf(prev.realm);
        const realmMultiplier = 1 + realmIndex * 3.0; // Increased from 2.5 to 3.0
        const levelMultiplier = 1 + prev.realmLevel * 0.6; // Increased from 0.5 to 0.6
        baseExp = Math.floor(baseExp * realmMultiplier * levelMultiplier);

        // HP feed gives 1.5x exp (increased from 1.2)
        const feedTypeMultiplier = 1.5;
        let expGain = Math.floor(baseExp * feedTypeMultiplier);
        const randomVariation = 0.85 + Math.random() * 0.3;
        expGain = Math.floor(expGain * randomVariation);

        totalExpGain += expGain;
        totalAffectionGain += Math.floor(2 + Math.random() * 4);
      }

      // Deduct HP
      const newHp = Math.max(0, prev.hp - hpCost * actualFeeds);

      // Update Pet
      const newPets = prev.pets.map((p) => {
        if (p.id === petId) {
          let petNewExp = p.exp + totalExpGain;
          let petNewLevel = p.level;
          let petNewMaxExp = p.maxExp;
          let leveledUp = false;

          // Handle level up
          while (petNewExp >= petNewMaxExp && petNewLevel < 100) {
            petNewExp -= petNewMaxExp;
            petNewLevel += 1;
            petNewMaxExp = Math.floor(petNewMaxExp * 1.2); // Decreased from 1.3 to 1.2
            leveledUp = true;
            addLog(`[${p.name}] leveled up! Now level ${petNewLevel}.`, 'gain');
          }

          const newStats = leveledUp
            ? {
                attack: Math.floor(p.stats.attack * 1.2), // Increased from 1.1 to 1.2
                defense: Math.floor(p.stats.defense * 1.2), // Increased from 1.1 to 1.2
                hp: Math.floor(p.stats.hp * 1.2), // Increased from 1.1 to 1.2
                speed: Math.floor(p.stats.speed * 1.1), // Increased from 1.05 to 1.1
              }
            : p.stats;

          const newAffection = Math.min(100, p.affection + totalAffectionGain);

          return {
            ...p,
            level: petNewLevel,
            exp: petNewExp,
            maxExp: petNewMaxExp,
            stats: newStats,
            affection: newAffection,
          };
        }
        return p;
      });

      addLog(
        `Batch feed complete (${actualFeeds} times). [${pet.name}] gained ${totalExpGain} Exp, Affection +${totalAffectionGain}.`,
        'gain'
      );

      return {
        ...prev,
        hp: newHp,
        pets: newPets,
      };
    });
  };

  return {
    handleActivatePet,
    handleDeactivatePet,
    handleFeedPet,
    handleBatchFeedItems,
    handleBatchFeedHp,
    handleEvolvePet,
    handleReleasePet,
    handleBatchReleasePets,
  };
}
