import React from 'react';
import { PlayerStats, ItemType, RealmType, ItemRarity } from '../../types';
import { GROTTO_CONFIGS, PLANTABLE_HERBS, REALM_ORDER, SPIRIT_ARRAY_ENHANCEMENTS, HERB_MUTATION_CONFIG, SPEEDUP_CONFIG, HERBARIUM_REWARDS } from '../../constants/index';
import { addItemToInventory } from '../../utils/inventoryUtils';

interface UseGrottoHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

/**
 * Grotto Handler
 * Includes purchasing/upgrading Grotto, planting/harvesting herbs, using Grotto storage, enhancing Spirit Array
 *
 * Design Principles:
 * - All operations have clear feedback
 * - Error messages are clear and friendly
 * - Automatically handle edge cases
 */
export function useGrottoHandlers({
  player,
  setPlayer,
  addLog,
  setItemActionLog,
}: UseGrottoHandlersProps) {
  /**
   * Get default Grotto data
   */
  const getDefaultGrotto = () => ({
    level: 0,
    expRateBonus: 0,
    autoHarvest: false,
    growthSpeedBonus: 0,
    plantedHerbs: [],
    lastHarvestTime: null,
    spiritArrayEnhancement: 0,
    herbarium: [],
    dailySpeedupCount: 0,
    lastSpeedupResetDate: new Date().toISOString().split('T')[0],
  });

  /**
   * Get current Grotto configuration
   */
  const getCurrentGrottoConfig = (level: number) => {
    return GROTTO_CONFIGS.find((c) => c.level === level);
  };

  /**
   * Check realm requirement
   */
  const checkRealmRequirement = (requiredRealm: RealmType | undefined, playerRealm: RealmType): boolean => {
    if (!requiredRealm) return true;
    const playerRealmIndex = REALM_ORDER.indexOf(playerRealm);
    const requiredRealmIndex = REALM_ORDER.indexOf(requiredRealm);
    return playerRealmIndex >= requiredRealmIndex;
  };

  /**
   * Get default herb config by rarity
   */
  const getDefaultHerbConfig = (herbName: string, rarity: ItemRarity = 'Common') => {
    // Set default growth time and harvest quantity based on rarity
    const rarityConfigs: Record<ItemRarity, { growthTime: number; harvestQuantity: { min: number; max: number }; grottoLevelRequirement: number }> = {
      'Common': { growthTime: 30 * 60 * 1000, harvestQuantity: { min: 2, max: 5 }, grottoLevelRequirement: 1 },
      'Rare': { growthTime: 3 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 3 }, grottoLevelRequirement: 3 },
      'Legendary': { growthTime: 8 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, grottoLevelRequirement: 5 },
      'Mythic': { growthTime: 18 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, grottoLevelRequirement: 6 },
    };

    const config = rarityConfigs[rarity] || rarityConfigs['Common']; // Fallback to Common if rarity not found
    return {
      id: `herb-${herbName.toLowerCase().replace(/\s+/g, '-')}`,
      name: herbName,
      growthTime: config.growthTime,
      harvestQuantity: config.harvestQuantity,
      rarity: rarity,
      grottoLevelRequirement: config.grottoLevelRequirement,
    };
  };

  /**
   * Upgrade Grotto
   *
   * Improvements:
   * - Clearer error messages
   * - Automatically handle downgrade cases
   * - Friendly success feedback
   */
  const handleUpgradeGrotto = (targetLevel: number) => {
    setPlayer((prev) => {
      const grotto = prev.grotto || getDefaultGrotto();
      const currentLevel = grotto.level;

      // Check if it's an upgrade
      if (targetLevel <= currentLevel) {
        addLog('Cannot downgrade Grotto! Sell current Grotto first to change.', 'danger');
        return prev;
      }

      // Get target level config
      const targetConfig = GROTTO_CONFIGS.find((c) => c.level === targetLevel);
      if (!targetConfig) {
        addLog('Error: Grotto configuration for this level not found.', 'danger');
        return prev;
      }

      // Check realm requirement
      if (!checkRealmRequirement(targetConfig.realmRequirement, prev.realm)) {
        addLog(
          `Requires [${targetConfig.realmRequirement}] realm to purchase this Grotto. Current realm: ${prev.realm}`,
          'danger'
        );
        return prev;
      }

      // Check if spirit stones are enough
      if (prev.spiritStones < targetConfig.cost) {
        const shortage = targetConfig.cost - prev.spiritStones;
        addLog(
          `Insufficient Spirit Stones! Need ${targetConfig.cost.toLocaleString()}, have ${prev.spiritStones.toLocaleString()}. Shortage: ${shortage.toLocaleString()}.`,
          'danger'
        );
        return prev;
      }

      // Calculate herbs to remove (if new level supports fewer slots)
      const currentConfig = getCurrentGrottoConfig(currentLevel);
      const maxSlots = targetConfig.maxHerbSlots;
      const currentPlanted = grotto.plantedHerbs.length;
      let newPlantedHerbs = [...grotto.plantedHerbs];

      // If new level supports fewer slots, remove excess planted herbs
      if (currentPlanted > maxSlots) {
        const toRemove = currentPlanted - maxSlots;
        // Remove oldest planted
        newPlantedHerbs = newPlantedHerbs.slice(toRemove);
        addLog(
          `Upgrade reduced herb slots to ${maxSlots}. Removed ${toRemove} oldest planted herbs.`,
          'normal'
        );
      }

      // Deduct spirit stones and upgrade Grotto
      const newSpiritStones = prev.spiritStones - targetConfig.cost;

      const actionText = currentLevel === 0 ? 'Purchase' : 'Upgrade';
      const features: string[] = [
        `Cultivation Speed +${(targetConfig.expRateBonus * 100).toFixed(0)}%`,
        `${targetConfig.maxHerbSlots} Herb Slots`,
      ];

      if (targetConfig.growthSpeedBonus > 0) {
        features.push(`Herb Growth Speed +${(targetConfig.growthSpeedBonus * 100).toFixed(0)}%`);
      }
      if (targetConfig.autoHarvest) {
        features.push('Auto-harvest supported');
      }

      addLog(
        `✨ ${actionText} successful! Grotto: [${targetConfig.name}]. Cost: ${targetConfig.cost.toLocaleString()} Spirit Stones. Features: ${features.join(', ')}.`,
        'gain'
      );

      return {
        ...prev,
        spiritStones: newSpiritStones,
        grotto: {
          ...grotto,
          level: targetLevel,
          expRateBonus: targetConfig.expRateBonus,
          autoHarvest: targetConfig.autoHarvest,
          growthSpeedBonus: targetConfig.growthSpeedBonus,
          plantedHerbs: newPlantedHerbs,
          spiritArrayEnhancement: grotto.spiritArrayEnhancement || 0,
        },
      };
    });
  };

  /**
   * Plant Herb
   *
   * Improvements:
   * - Detailed validation and feedback
   * - Automatic harvest time calculation
   * - Friendly time display
   * - Supports all herb types
   */
  const handlePlantHerb = (herbIdOrName: string) => {
    setPlayer((prev) => {
      const grotto = prev.grotto || getDefaultGrotto();

      // Check if Grotto is owned
      if (grotto.level === 0) {
        addLog('Purchase a Grotto first to plant herbs. Visit "Upgrade" tab.', 'danger');
        return prev;
      }

      const currentConfig = getCurrentGrottoConfig(grotto.level);
      if (!currentConfig) {
        addLog('Grotto configuration error. Please reload.', 'danger');
        return prev;
      }

      // Check for empty slots
      if (grotto.plantedHerbs.length >= currentConfig.maxHerbSlots) {
        addLog(
          `Planting slots full! ${grotto.plantedHerbs.length}/${currentConfig.maxHerbSlots} used. Harvest herbs or upgrade Grotto.`,
          'danger'
        );
        return prev;
      }

      // Try to find in PLANTABLE_HERBS first (by ID or name)
      let herbConfig = PLANTABLE_HERBS.find((h) => h.id === herbIdOrName || h.name === herbIdOrName);

      // Determine target herb name (prefer config name, else use passed parameter)
      let targetHerbName = herbIdOrName;
      if (herbConfig) {
        targetHerbName = herbConfig.name;
      } else {
        // If ID format (e.g. herb-Snow Lotus), try to extract name
        // Or if name directly, use it
        if (herbIdOrName.startsWith('herb-')) {
          // Try to extract name from ID (herb-Snow Lotus -> Snow Lotus)
          // But safer to use passed value and find in inventory
          targetHerbName = herbIdOrName;
        }
      }

      // Find herb in inventory (multiple matching methods)
      // Strict filter: only herb types, exclude pills etc.
      let seedItem = prev.inventory.find(
        (item) => {
          if (item.type !== ItemType.Herb) return false;
          // 1. Exact name match
          if (item.name === targetHerbName) return true;
          // 2. If ID passed, try matching name
          if (herbConfig && item.name === herbConfig.name) return true;
          // 3. If ID format passed, try matching extracted name
          if (herbIdOrName.startsWith('herb-')) {
            const possibleName = herbIdOrName.replace(/^herb-/, '');
            if (item.name === possibleName) return true;
          }
          // 4. Match by item ID (legacy support)
          if (item.id === herbIdOrName) return true;
          return false;
        }
      );

      if (!seedItem || seedItem.quantity < 1) {
        const herbName = herbConfig?.name || herbIdOrName;
        addLog(`No [${herbName}] seeds in inventory! Obtain via Adventure or Shop.`, 'danger');
        return prev;
      }

      // If no predefined config, use default config
      if (!herbConfig) {
        herbConfig = getDefaultHerbConfig(seedItem.name, seedItem.rarity || 'Common');
      }

      // Check Grotto level requirement
      if (grotto.level < (herbConfig.grottoLevelRequirement || 1)) {
        addLog(
          `Planting [${herbConfig.name}] requires Grotto Lv.${herbConfig.grottoLevelRequirement}. Current: Lv.${grotto.level}. Upgrade Grotto first.`,
          'danger'
        );
        if (setItemActionLog) {
          setItemActionLog({ text: `Planting [${herbConfig.name}] requires Grotto Lv.${herbConfig.grottoLevelRequirement}. Current: Lv.${grotto.level}. Upgrade Grotto first.`, type: 'danger' });
        }
        return prev;
      }

      // Deduct seed
      const updatedInventory = prev.inventory.map((item) => {
        if (item.id === seedItem.id) {
          return {
            ...item,
            quantity: item.quantity - 1,
          };
        }
        return item;
      }).filter((item) => item.quantity > 0);

      // Calculate harvest time (apply growth speed bonus)
      const now = Date.now();
      const growthSpeedBonus = grotto.growthSpeedBonus || 0;
      const actualGrowthTime = Math.floor(herbConfig.growthTime * (1 - growthSpeedBonus));
      const harvestTime = now + actualGrowthTime;

      // Calculate mutation chance
      const mutationChance = Math.min(
        HERB_MUTATION_CONFIG.baseMutationChance + (grotto.level * HERB_MUTATION_CONFIG.grottoLevelBonus),
        HERB_MUTATION_CONFIG.maxMutationChance
      );
      const isMutated = Math.random() < mutationChance;
      const mutationBonus = isMutated
        ? HERB_MUTATION_CONFIG.mutationBonusRange.min +
          Math.random() * (HERB_MUTATION_CONFIG.mutationBonusRange.max - HERB_MUTATION_CONFIG.mutationBonusRange.min)
        : 1.0;

      // Calculate harvest quantity (mutated herbs have bonus)
      let harvestQuantity = herbConfig.harvestQuantity.min +
        Math.floor(Math.random() * (herbConfig.harvestQuantity.max - herbConfig.harvestQuantity.min + 1));

      if (isMutated) {
        const quantityMultiplier = HERB_MUTATION_CONFIG.quantityMultiplier.min +
          Math.random() * (HERB_MUTATION_CONFIG.quantityMultiplier.max - HERB_MUTATION_CONFIG.quantityMultiplier.min);
        harvestQuantity = Math.floor(harvestQuantity * quantityMultiplier);
      }

      // Add planting
      const newPlantedHerb = {
        herbId: herbConfig.id,
        herbName: herbConfig.name,
        plantTime: now,
        harvestTime: harvestTime,
        quantity: harvestQuantity,
        isMutated: isMutated,
        mutationBonus: isMutated ? mutationBonus : undefined,
      };

      // Format time display
      const growthMinutes = Math.floor(actualGrowthTime / 60000);
      const growthHours = Math.floor(growthMinutes / 60);
      const growthMins = growthMinutes % 60;
      const timeText = growthHours > 0
        ? `${growthHours}h ${growthMins}m`
        : `${growthMinutes}m`;

      let bonusText = '';
      if (growthSpeedBonus > 0) {
        const originalMinutes = Math.floor(herbConfig.growthTime / 60000);
        bonusText = `(Grotto Bonus: ${(growthSpeedBonus * 100).toFixed(0)}%, Original: ${originalMinutes}m)`;
      }

      let logMessage = `🌱 Planted [${herbConfig.name}]! Harvest ${harvestQuantity} in ${timeText}. ${bonusText}`;
      if (isMutated) {
        logMessage += ` ✨ Mutation! Yield +${((mutationBonus - 1) * 100).toFixed(0)}%!`;
      }
      addLog(logMessage, isMutated ? 'special' : 'gain');
      if (setItemActionLog) {
        setItemActionLog({ text: logMessage, type: isMutated ? 'special' : 'gain' });
      }

      return {
        ...prev,
        inventory: updatedInventory,
        grotto: {
          ...grotto,
          plantedHerbs: [...grotto.plantedHerbs, newPlantedHerb],
        },
      };
    });
  };

  /**
   * Harvest Herb
   *
   * Improvements:
   * - Clearer error messages
   * - Automatically merge to inventory
   * - Friendly success feedback
   */
  const handleHarvestHerb = (herbIndex: number) => {
    setPlayer((prev) => {
      const grotto = prev.grotto || getDefaultGrotto();
      const plantedHerbs = [...grotto.plantedHerbs];

      if (herbIndex < 0 || herbIndex >= plantedHerbs.length) {
        addLog('Error: Planting slot not found. Please refresh.', 'danger');
        return prev;
      }

      const herb = plantedHerbs[herbIndex];
      const now = Date.now();

      // Check if ready for harvest
      if (now < herb.harvestTime) {
        const remaining = herb.harvestTime - now;
        const remainingMinutes = Math.ceil(remaining / 60000);
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMins = remainingMinutes % 60;
        const timeText = remainingHours > 0
          ? `${remainingHours}h ${remainingMins}m`
          : `${remainingMinutes}m`;

        addLog(`[${herb.herbName}] not ready! Wait ${timeText}.`, 'danger');
        return prev;
      }

      // Harvest herb, add to inventory
      const herbConfig = PLANTABLE_HERBS.find((h) => h.id === herb.herbId);
      if (!herbConfig) {
        addLog('Error: Herb configuration not found.', 'danger');
        return prev;
      }

      // Calculate actual harvest quantity (mutated herbs have bonus)
      const actualQuantity = herb.isMutated && herb.mutationBonus
        ? Math.floor(herb.quantity * herb.mutationBonus)
        : herb.quantity;

      const updatedInventory = addItemToInventory(
        prev.inventory,
        {
          name: herb.herbName,
          type: ItemType.Herb,
          description: `${herbConfig.name}, used for Alchemy.`,
          rarity: herbConfig.rarity,
        },
        actualQuantity
      );

      // Update herbarium (if not collected)
      const updatedHerbarium = [...(grotto.herbarium || [])];
      if (!updatedHerbarium.includes(herb.herbName)) {
        updatedHerbarium.push(herb.herbName);
      }

      // Remove harvested planting
      plantedHerbs.splice(herbIndex, 1);

      let logMessage = `✨ Harvested [${herb.herbName}] x${actualQuantity}! Added to inventory.`;
      if (herb.isMutated) {
        logMessage += ` 🌟 Mutated Herb Bonus!`;
      }
      if (!grotto.herbarium?.includes(herb.herbName)) {
        logMessage += ` 📖 Added to Herbarium!`;
      }
      addLog(logMessage, herb.isMutated ? 'special' : 'gain');
      if (setItemActionLog) {
        setItemActionLog({ text: logMessage, type: herb.isMutated ? 'special' : 'gain' });
      }

      // Check herbarium rewards
      const newPlayer = {
        ...prev,
        inventory: updatedInventory,
        grotto: {
          ...grotto,
          plantedHerbs: plantedHerbs,
          lastHarvestTime: now,
          herbarium: updatedHerbarium,
        },
      };

      // Check and award herbarium rewards
      const finalPlayer = checkAndAwardHerbariumRewards(newPlayer, updatedHerbarium.length);

      return finalPlayer;
    });
  };

  /**
   * Bulk Harvest All Mature Herbs
   *
   * Improvements:
   * - More detailed feedback
   * - Automatically handle all mature herbs
   */
  const handleHarvestAll = () => {
    setPlayer((prev) => {
      const grotto = prev.grotto || getDefaultGrotto();
      const now = Date.now();
      const matureHerbs = grotto.plantedHerbs.filter((herb) => now >= herb.harvestTime);

      if (matureHerbs.length === 0) {
        addLog('No herbs ready for harvest.', 'normal');
        return prev;
      }

      let updatedInventory = [...prev.inventory];
      const remainingHerbs = grotto.plantedHerbs.filter((herb) => now < herb.harvestTime);
      const updatedHerbarium = [...(grotto.herbarium || [])];
      let totalQuantity = 0;
      let hasMutation = false;
      const newHerbs: string[] = [];

      // Harvest all mature herbs
      matureHerbs.forEach((herb) => {
        const herbConfig = PLANTABLE_HERBS.find((h) => h.id === herb.herbId);

        // Calculate actual harvest quantity (mutated herbs have bonus)
        const actualQuantity = herb.isMutated && herb.mutationBonus
          ? Math.floor(herb.quantity * herb.mutationBonus)
          : herb.quantity;

        totalQuantity += actualQuantity;
        if (herb.isMutated) hasMutation = true;

        updatedInventory = addItemToInventory(
          updatedInventory,
          {
            name: herb.herbName,
            type: ItemType.Herb,
            description: `${herbConfig?.name || herb.herbName}, used for Alchemy.`,
            rarity: herbConfig?.rarity || 'Common',
          },
          actualQuantity
        );

        // Update herbarium
        if (!updatedHerbarium.includes(herb.herbName)) {
          updatedHerbarium.push(herb.herbName);
          newHerbs.push(herb.herbName);
        }
      });

      const herbNames = matureHerbs.map(h => h.herbName).join(', ');
      let logMessage = `✨ Bulk harvested ${matureHerbs.length} herbs (${herbNames}), total ${totalQuantity}! Added to inventory.`;
      if (hasMutation) {
        logMessage += ` 🌟 Includes Mutated Herbs!`;
      }
      if (newHerbs.length > 0) {
        logMessage += ` 📖 New Herbarium entries: ${newHerbs.length}!`;
      }
      addLog(logMessage, hasMutation ? 'special' : 'gain');
      if (setItemActionLog) {
        setItemActionLog({ text: logMessage, type: hasMutation ? 'special' : 'gain' });
      }

      const newPlayer = {
        ...prev,
        inventory: updatedInventory,
        grotto: {
          ...grotto,
          plantedHerbs: remainingHerbs,
          lastHarvestTime: now,
          herbarium: updatedHerbarium,
        },
      };

      // Check and award herbarium rewards
      return checkAndAwardHerbariumRewards(newPlayer, updatedHerbarium.length);
    });
  };

  /**
   * Enhance Spirit Array
   *
   * Improvements:
   * - More detailed material check
   * - Friendly success feedback
   */
  const handleEnhanceSpiritArray = (enhancementId: string) => {
    setPlayer((prev) => {
      const grotto = prev.grotto || getDefaultGrotto();

      // Check if Grotto is owned
      if (grotto.level === 0) {
        addLog('Purchase a Grotto first to enhance Spirit Array. Visit "Upgrade" tab.', 'danger');
        return prev;
      }

      // Find enhancement config
      const enhancementConfig = SPIRIT_ARRAY_ENHANCEMENTS.find((e) => e.id === enhancementId);
      if (!enhancementConfig) {
        addLog('Error: Enhancement configuration not found.', 'danger');
        return prev;
      }

      // Check Grotto level requirement
      if (grotto.level < enhancementConfig.grottoLevelRequirement) {
        addLog(
          `Enhancing [${enhancementConfig.name}] requires Grotto Lv.${enhancementConfig.grottoLevelRequirement}. Current: Lv.${grotto.level}. Upgrade first.`,
          'danger'
        );
        if (setItemActionLog) {
          setItemActionLog({ text: `Enhancing [${enhancementConfig.name}] requires Grotto Lv.${enhancementConfig.grottoLevelRequirement}. Current: Lv.${grotto.level}. Upgrade first.`, type: 'danger' });
        }
        return prev;
      }

      // Check if materials are enough
      const missingMaterials: string[] = [];
      for (const material of enhancementConfig.materials) {
        const item = prev.inventory.find((i) => i.name === material.name);
        if (!item || item.quantity < material.quantity) {
          const has = item?.quantity || 0;
          missingMaterials.push(`${material.name} (Need ${material.quantity}, Have ${has})`);
        }
      }

      if (missingMaterials.length > 0) {
        addLog(
          `Insufficient materials! Missing: ${missingMaterials.join(', ')}. Please collect materials first.`,
          'danger'
        );
        if (setItemActionLog) {
          setItemActionLog({ text: `Insufficient materials! Missing: ${missingMaterials.join(', ')}. Please collect materials first.`, type: 'danger' });
        }
        return prev;
      }

      // Deduct materials
      let updatedInventory = prev.inventory.map((item) => {
        const material = enhancementConfig.materials.find((m) => m.name === item.name);
        if (material) {
          return {
            ...item,
            quantity: item.quantity - material.quantity,
          };
        }
        return item;
      }).filter((item) => item.quantity > 0);

      // Apply enhancement bonus
      const newEnhancement = (grotto.spiritArrayEnhancement || 0) + enhancementConfig.expRateBonus;
      const totalBonus = (grotto.expRateBonus + newEnhancement) * 100;

      addLog(
        `✨ Enhanced Spirit Array [${enhancementConfig.name}]! Cultivation Speed +${(enhancementConfig.expRateBonus * 100).toFixed(0)}%. Total Bonus: ${totalBonus.toFixed(0)}% (Base ${(grotto.expRateBonus * 100).toFixed(0)}% + Enhanced ${(newEnhancement * 100).toFixed(0)}%).`,
        'gain'
      );
      if (setItemActionLog) {
        setItemActionLog({ text: `✨ Enhanced Spirit Array [${enhancementConfig.name}]! Cultivation Speed +${(enhancementConfig.expRateBonus * 100).toFixed(0)}%. Total Bonus: ${totalBonus.toFixed(0)}% (Base ${(grotto.expRateBonus * 100).toFixed(0)}% + Enhanced ${(newEnhancement * 100).toFixed(0)}%).`, type: 'gain' });
      }

      return {
        ...prev,
        inventory: updatedInventory,
        grotto: {
          ...grotto,
          spiritArrayEnhancement: newEnhancement,
        },
      };
    });
  };

  /**
   * Toggle auto-harvest switch
   */
  const handleToggleAutoHarvest = () => {
    setPlayer((prev) => {
      const grotto = prev.grotto || getDefaultGrotto();

      if (grotto.level === 0) {
        addLog('Purchase a Grotto first to use auto-harvest.', 'danger');
        return prev;
      }

      const currentConfig = getCurrentGrottoConfig(grotto.level);
      if (!currentConfig || !currentConfig.autoHarvest) {
        addLog(`Current Grotto level does not support auto-harvest. Requires Grotto Lv.${GROTTO_CONFIGS.find(c => c.autoHarvest)?.level || 4} or higher.`, 'danger');
        return prev;
      }

      const newAutoHarvest = !grotto.autoHarvest;
      addLog(
        newAutoHarvest
          ? '✨ Auto-harvest enabled! Mature herbs will be automatically collected.'
          : 'Auto-harvest disabled.',
        newAutoHarvest ? 'gain' : 'normal'
      );

      return {
        ...prev,
        grotto: {
          ...grotto,
          autoHarvest: newAutoHarvest,
        },
      };
    });
  };

  /**
   * Check and award herbarium rewards
   */
  const checkAndAwardHerbariumRewards = (player: PlayerStats, herbCount: number): PlayerStats => {
    const grotto = player.grotto || getDefaultGrotto();
    const awardedRewards = grotto.herbarium?.length || 0;

    // Find unclaimed rewards
    const unclaimedRewards = HERBARIUM_REWARDS.filter(
      reward => herbCount >= reward.herbCount && !player.achievements.includes(`herbarium-${reward.herbCount}`)
    );

    if (unclaimedRewards.length === 0) {
      return player;
    }

    let updatedPlayer = { ...player };
    let totalExp = 0;
    let totalSpiritStones = 0;
    let totalAttributePoints = 0;
    const newTitles: string[] = [];

    unclaimedRewards.forEach(reward => {
      if (reward.reward.exp) totalExp += reward.reward.exp;
      if (reward.reward.spiritStones) totalSpiritStones += reward.reward.spiritStones;
      if (reward.reward.attributePoints) totalAttributePoints += reward.reward.attributePoints;
      if (reward.reward.title) newTitles.push(reward.reward.title);

      // Mark reward as claimed
      updatedPlayer.achievements = [...updatedPlayer.achievements, `herbarium-${reward.herbCount}`];
    });

    // Apply rewards
    updatedPlayer.exp += totalExp;
    updatedPlayer.spiritStones += totalSpiritStones;
    updatedPlayer.attributePoints += totalAttributePoints;

    // Add titles (if any)
      if (newTitles.length > 0) {
        // Here we would add titles to the system
        // Logging only for now
        newTitles.forEach(title => {
          addLog(`🏆 Title Acquired: [${title}]!`, 'special');
          if (setItemActionLog) {
            setItemActionLog({ text: `🏆 Title Acquired: [${title}]!`, type: 'special' });
          }
        });
      }

      // Generate reward message
      const rewardParts: string[] = [];
      if (totalExp > 0) rewardParts.push(`${totalExp} Exp`);
      if (totalSpiritStones > 0) rewardParts.push(`${totalSpiritStones} Spirit Stones`);
      if (totalAttributePoints > 0) rewardParts.push(`${totalAttributePoints} Attribute Points`);

      if (rewardParts.length > 0) {
        addLog(
          `📖 Herbarium Reward: Collected ${herbCount} herbs, gained ${rewardParts.join(', ')}!`,
          'special'
        );
        if (setItemActionLog) {
          setItemActionLog({ text: `📖 Herbarium Reward: Collected ${herbCount} herbs, gained ${rewardParts.join(', ')}!`, type: 'special' });
        }
      }

    return updatedPlayer;
  };

  /**
   * Time acceleration: Use spirit stones to speed up herb growth
   */
  const handleSpeedupHerb = (herbIndex: number) => {
    setPlayer((prev) => {
      const grotto = prev.grotto || getDefaultGrotto();

      if (grotto.level === 0) {
        addLog('Purchase a Grotto first to use speedup.', 'danger');
        if (setItemActionLog) {
          setItemActionLog({ text: 'Purchase a Grotto first to use speedup.', type: 'danger' });
        }
        return prev;
      }

      // Check daily speedup limit
      const today = new Date().toISOString().split('T')[0];
      let dailySpeedupCount = grotto.dailySpeedupCount || 0;
      const lastSpeedupResetDate = grotto.lastSpeedupResetDate || today;

      // Reset count if date changed
      if (lastSpeedupResetDate !== today) {
        dailySpeedupCount = 0;
      }

      if (dailySpeedupCount >= SPEEDUP_CONFIG.dailyLimit) {
        addLog(`Daily speedup limit reached (${SPEEDUP_CONFIG.dailyLimit}), please come back tomorrow.`, 'danger');
        if (setItemActionLog) {
          setItemActionLog({ text: `Daily speedup limit reached (${SPEEDUP_CONFIG.dailyLimit}), please come back tomorrow.`, type: 'danger' });
        }
        return prev;
      }

      const plantedHerbs = [...grotto.plantedHerbs];
      if (herbIndex < 0 || herbIndex >= plantedHerbs.length) {
        addLog('Error: Planting slot not found.', 'danger');
        if (setItemActionLog) {
          setItemActionLog({ text: 'Error: Planting slot not found.', type: 'danger' });
        }
        return prev;
      }

      const herb = plantedHerbs[herbIndex];
      const now = Date.now();

      // If already mature, no need to speed up
      if (now >= herb.harvestTime) {
        addLog('This herb is already mature.', 'normal');
        if (setItemActionLog) {
          setItemActionLog({ text: 'This herb is already mature.', type: 'normal' });
        }
        return prev;
      }

      // Calculate remaining time and cost
      const remainingTime = herb.harvestTime - now;
      const remainingMinutes = Math.ceil(remainingTime / 60000);
      const cost = Math.max(
        SPEEDUP_CONFIG.minCost,
        remainingMinutes * SPEEDUP_CONFIG.costPerMinute
      );

      // Check if spirit stones are enough
      if (prev.spiritStones < cost) {
        const shortage = cost - prev.spiritStones;
        addLog(`Insufficient Spirit Stones! Speedup requires ${cost.toLocaleString()}, have ${prev.spiritStones.toLocaleString()}. Shortage: ${shortage.toLocaleString()}.`, 'danger');
        return prev;
      }

      // Complete growth immediately
      plantedHerbs[herbIndex] = {
        ...herb,
        harvestTime: now,
      };

      dailySpeedupCount += 1;

      addLog(
        `⚡ Used ${cost.toLocaleString()} Spirit Stones to speed up [${herb.herbName}], matured immediately!`,
        'gain'
      );

      return {
        ...prev,
        spiritStones: prev.spiritStones - cost,
        grotto: {
          ...grotto,
          plantedHerbs: plantedHerbs,
          dailySpeedupCount: dailySpeedupCount,
          lastSpeedupResetDate: today,
        },
      };
    });
  };

  return {
    handleUpgradeGrotto,
    handlePlantHerb,
    handleHarvestHerb,
    handleHarvestAll,
    handleEnhanceSpiritArray,
    handleToggleAutoHarvest,
    handleSpeedupHerb,
  };
}
