import React from 'react';
import { PlayerStats, DailyQuest, DailyQuestType, RealmType, ItemType } from '../../types';
import {
  PREDEFINED_DAILY_QUESTS,
  calculateDailyQuestReward,
  REALM_ORDER,
  FOUNDATION_TREASURES,
  HEAVEN_EARTH_ESSENCES,
  HEAVEN_EARTH_MARROWS,
  LONGEVITY_RULES,
} from '../../constants/index';
import { uid } from '../../utils/gameUtils';

interface UseDailyQuestHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
}

/**
 * Daily Quest Handler
 * Includes generating daily quests, updating quest progress, completing quests, etc.
 */
export function useDailyQuestHandlers({
  player,
  setPlayer,
  addLog,
}: UseDailyQuestHandlersProps) {
  // Generate daily quests (randomly select from 30 predefined quests)
  const generateDailyQuests = (): DailyQuest[] => {
    // Randomly generate 10-20 quests
    const questCount = Math.floor(Math.random() * 11) + 10; // 10-20

    // Randomly select from predefined quests
    const availableQuests = [...PREDEFINED_DAILY_QUESTS];
    const selectedQuests: DailyQuest[] = [];
    const usedIndices = new Set<number>();

    // Randomly select specified number of quests, ensuring no duplicates
    while (selectedQuests.length < questCount && usedIndices.size < availableQuests.length) {
      const randomIndex = Math.floor(Math.random() * availableQuests.length);

      // If index already used, skip
      if (usedIndices.has(randomIndex)) {
        continue;
      }

      usedIndices.add(randomIndex);
      const questTemplate = availableQuests[randomIndex];

      // For breakthrough quests, 50% chance to generate
      if (questTemplate.type === 'breakthrough') {
        if (Math.random() < 0.5) {
          continue; // Skip
        }
      }

      // Randomly generate target amount
      const target = Math.floor(
        Math.random() * (questTemplate.targetRange.max - questTemplate.targetRange.min + 1)
      ) + questTemplate.targetRange.min;

      // Calculate reward
      const reward = calculateDailyQuestReward(
        questTemplate.type,
        target,
        questTemplate.rarity
      );

      selectedQuests.push({
        id: `daily-quest-${uid()}`,
        type: questTemplate.type,
        name: questTemplate.name,
        description: questTemplate.description,
        target,
        progress: 0,
        reward,
        rarity: questTemplate.rarity,
        completed: false,
      });
    }

    // If selected quests are not enough, fill up (avoid duplicates)
    if (selectedQuests.length < questCount) {
      const remainingQuests = availableQuests.filter((_, index) => !usedIndices.has(index));
      const needed = questCount - selectedQuests.length;

      for (let i = 0; i < needed && remainingQuests.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * remainingQuests.length);
        const questTemplate = remainingQuests[randomIndex];
        remainingQuests.splice(randomIndex, 1);

        // For breakthrough quests, 50% chance to generate
        if (questTemplate.type === 'breakthrough' && Math.random() < 0.5) {
          continue;
        }

        const target = Math.floor(
          Math.random() * (questTemplate.targetRange.max - questTemplate.targetRange.min + 1)
        ) + questTemplate.targetRange.min;

        const reward = calculateDailyQuestReward(
          questTemplate.type,
          target,
          questTemplate.rarity
        );

        selectedQuests.push({
          id: `daily-quest-${uid()}`,
          type: questTemplate.type,
          name: questTemplate.name,
          description: questTemplate.description,
          target,
          progress: 0,
          reward,
          rarity: questTemplate.rarity,
          completed: false,
        });
      }
    }

    return selectedQuests.slice(0, questCount);
  };

  // Reset daily quests (reset every day)
  const resetDailyQuests = () => {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = player.lastDailyQuestResetDate || today;

    // If date changed or dailyQuests not exist/empty, reset
    if (lastReset !== today || !player.dailyQuests || player.dailyQuests.length === 0) {
      // Only show generating hint when date changed
      if (lastReset !== today) {
        addLog('Generating daily quests...', 'special');
      }

      const newQuests = generateDailyQuests();

        setPlayer((prev) => {
          const currentGameDays = prev.gameDays || 1;
          const isNewDay = lastReset !== today;

          return {
            ...prev,
            dailyQuests: newQuests,
            // If new day, reset progress and completed list
            dailyQuestProgress: isNewDay ? {} : (prev.dailyQuestProgress || {}),
            dailyQuestCompleted: isNewDay ? [] : (prev.dailyQuestCompleted || []),
            lastDailyQuestResetDate: today,
            gameDays: isNewDay ? currentGameDays + 1 : currentGameDays, // Only increase game days when date changes
          };
        });

      if (lastReset !== today) {
        addLog(`New daily quests refreshed! Total ${newQuests.length} quests today.`, 'special');
      }
    }
  };

  // Initialize daily quests (if empty)
  const initializeDailyQuests = () => {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = player.lastDailyQuestResetDate || today;

    // Generate quests only if:
    // 1. Quests not exist or empty
    // 2. Date changed (new day)
    const needsReset =
      !player.dailyQuests ||
      player.dailyQuests.length === 0 ||
      lastReset !== today;

    if (needsReset) {
      resetDailyQuests();
    }
    // If quests exist and date not changed, do nothing
  };

  // Update quest progress (rewards not auto-issued, need manual claim)
  const updateQuestProgress = (
    questType: DailyQuestType,
    amount: number = 1
  ) => {
    setPlayer((prev) => {
      // Ensure dailyQuests exists
      if (!prev.dailyQuests || prev.dailyQuests.length === 0) {
        return prev;
      }
      const updatedQuests = prev.dailyQuests.map((quest) => {
        // Only update matching type and not completed quests
        if (quest.type === questType && !quest.completed) {
          // Calculate new progress, ensure not exceeding target
          const newProgress = Math.min(quest.progress + amount, quest.target);
          // Completion check: when progress reaches or exceeds target, quest completed
          const completed = newProgress >= quest.target;

          return {
            ...quest,
            progress: newProgress,
            completed: completed,
          };
        }
        return quest;
      });

      // Update progress record (save current progress of all matching type quests)
      const updatedProgress = { ...prev.dailyQuestProgress };
      updatedQuests.forEach((quest) => {
        // Only update matching type quest progress (including completed ones, for record)
        if (quest.type === questType) {
          updatedProgress[quest.id] = quest.progress;
        }
      });

      return {
        ...prev,
        dailyQuests: updatedQuests,
        dailyQuestProgress: updatedProgress,
      };
    });
  };

  // Claim quest reward (manual claim for UI)
  const claimQuestReward = (questId: string) => {
    setPlayer((prev) => {
      // Ensure dailyQuests exists
      if (!prev.dailyQuests || prev.dailyQuests.length === 0) {
        return prev;
      }
      const quest = prev.dailyQuests.find((q) => q.id === questId);
      if (!quest || !quest.completed || prev.dailyQuestCompleted.includes(questId)) {
        return prev;
      }

      const expGain = quest.reward.exp || 0;
      const stoneGain = quest.reward.spiritStones || 0;
      const ticketGain = quest.reward.lotteryTickets || 0;

      // Advanced item reward (chance to get for high quality quests) - Add to inventory
      const currentRealmIndex = REALM_ORDER.indexOf(prev.realm);
      let advancedItemMsg = '';
      const newInventory = [...prev.inventory];

      // Only Legendary or Mythic quests have chance to get advanced items
      if ((quest.rarity === 'Legendary' || quest.rarity === 'Mythic') && Math.random() < 0.05) {
        // 5% chance to get advanced item

        // Foundation Treasure (Qi Refining, Foundation)
        if (currentRealmIndex <= REALM_ORDER.indexOf(RealmType.Foundation)) {
          const treasures = Object.values(FOUNDATION_TREASURES);
          const availableTreasures = treasures.filter(t => !t.requiredLevel || prev.realmLevel >= t.requiredLevel);
          if (availableTreasures.length > 0) {
            const selected = availableTreasures[Math.floor(Math.random() * availableTreasures.length)];
            newInventory.push({
              id: uid(),
              name: selected.name,
              type: ItemType.AdvancedItem,
              description: selected.description,
              quantity: 1,
              rarity: selected.rarity,
              advancedItemType: 'foundationTreasure',
              advancedItemId: selected.id,
            });
            advancedItemMsg = ` ✨ Bonus Foundation Treasure [${selected.name}]!`;
          }
        }

        // Heaven Earth Essence (Golden Core, Nascent Soul)
        if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.GoldenCore) &&
            currentRealmIndex <= REALM_ORDER.indexOf(RealmType.NascentSoul)) {
          const essences = Object.values(HEAVEN_EARTH_ESSENCES);
          if (essences.length > 0) {
            const selected = essences[Math.floor(Math.random() * essences.length)];
            newInventory.push({
              id: uid(),
              name: selected.name,
              type: ItemType.AdvancedItem,
              description: selected.description,
              quantity: 1,
              rarity: selected.rarity,
              advancedItemType: 'heavenEarthEssence',
              advancedItemId: selected.id,
            });
            advancedItemMsg = ` ✨ Bonus Essence [${selected.name}]!`;
          }
        }

        // Heaven Earth Marrow (Spirit Severing and above)
        if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.SpiritSevering)) {
          const marrows = Object.values(HEAVEN_EARTH_MARROWS);
          if (marrows.length > 0) {
            const selected = marrows[Math.floor(Math.random() * marrows.length)];
            newInventory.push({
              id: uid(),
              name: selected.name,
              type: ItemType.AdvancedItem,
              description: selected.description,
              quantity: 1,
              rarity: selected.rarity,
              advancedItemType: 'heavenEarthMarrow',
              advancedItemId: selected.id,
            });
            advancedItemMsg = ` ✨ Bonus Marrow [${selected.name}]!`;
          }
        }

        // Longevity Rule (Longevity Realm)
        if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.LongevityRealm)) {
          const rules = Object.values(LONGEVITY_RULES);
          const currentRules = prev.longevityRules || [];
          const availableRules = rules.filter(r => !currentRules.includes(r.id));
          const maxRules = prev.maxLongevityRules || 3;
          if (availableRules.length > 0 && currentRules.length < maxRules) {
            const selected = availableRules[Math.floor(Math.random() * availableRules.length)];
            newInventory.push({
              id: uid(),
              name: selected.name,
              type: ItemType.AdvancedItem,
              description: selected.description,
              quantity: 1,
              rarity: 'Mythic',
              advancedItemType: 'longevityRule',
              advancedItemId: selected.id,
            });
            advancedItemMsg = ` ✨ Bonus Rule [${selected.name}]!`;
          }
        }
      }

      // Build reward message
      const rewardParts: string[] = [];
      if (expGain > 0) rewardParts.push(`${expGain} Exp`);
      if (stoneGain > 0) rewardParts.push(`${stoneGain} Spirit Stones`);
      if (ticketGain > 0) rewardParts.push(`${ticketGain} Tickets`);

      const rewardText = rewardParts.length > 0 ? rewardParts.join(', ') : 'No Reward';

      addLog(
        `Claimed Daily Quest [${quest.name}] reward! Obtained ${rewardText}.${advancedItemMsg}`,
        advancedItemMsg ? 'special' : 'gain'
      );

      return {
        ...prev,
        exp: prev.exp + expGain,
        inventory: newInventory,
        spiritStones: prev.spiritStones + stoneGain,
        lotteryTickets: prev.lotteryTickets + ticketGain,
        dailyQuestCompleted: [...prev.dailyQuestCompleted, questId],
      };
    });
  };

  return {
    initializeDailyQuests,
    resetDailyQuests,
    updateQuestProgress,
    claimQuestReward,
  };
}

