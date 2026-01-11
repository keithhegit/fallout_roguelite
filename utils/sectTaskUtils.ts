import { PlayerStats, ItemType, RealmType, AdventureResult } from '../types';
import { REALM_ORDER, FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS, LONGEVITY_RULES } from '../constants/index';
import { uid } from './gameUtils';
import { RandomSectTask } from '../services/randomService';

/**
 * Sect Task Utility Class
 */
export const sectTaskUtils = {
  /**
   * Check task daily limit
   */
  checkDailyLimit: (player: PlayerStats, taskId: string): { limitReached: boolean; updatedCount: Record<string, number>; resetDate: string } => {
    const today = new Date().toISOString().split('T')[0];
    let dailyTaskCount = player.dailyTaskCount || {};
    let lastTaskResetDate = player.lastTaskResetDate || today;

    if (lastTaskResetDate !== today) {
      dailyTaskCount = {};
      lastTaskResetDate = today;
    }

    const TASK_DAILY_LIMIT = 3;
    const currentCount = dailyTaskCount[taskId] || 0;

    if (currentCount >= TASK_DAILY_LIMIT) {
      return { limitReached: true, updatedCount: dailyTaskCount, resetDate: lastTaskResetDate };
    }

    return {
      limitReached: false,
      updatedCount: { ...dailyTaskCount, [taskId]: currentCount + 1 },
      resetDate: lastTaskResetDate
    };
  },

  /**
   * Calculate task rewards
   */
  calculateRewards: (player: PlayerStats, task: RandomSectTask, isPerfect: boolean, encounter?: AdventureResult) => {
    let contribGain = task.reward.contribution || 0;
    let expGain = task.reward.exp || 0;
    let stoneGain = task.reward.spiritStones || 0;

    // Consecutive type bonus
    if (player.lastCompletedTaskType === task.type && task.typeBonus) {
      const multiplier = 1 + task.typeBonus / 100;
      contribGain = Math.floor(contribGain * multiplier);
      expGain = Math.floor(expGain * multiplier);
      stoneGain = Math.floor(stoneGain * multiplier);
    }

    // Perfect completion bonus
    if (isPerfect && task.completionBonus) {
      contribGain += task.completionBonus.contribution || 0;
      expGain += task.completionBonus.exp || 0;
      stoneGain += task.completionBonus.spiritStones || 0;
    }

    // Encounter extra reward
    if (encounter) {
      expGain += encounter.expChange || 0;
      stoneGain += encounter.spiritStonesChange || 0;
    }

    return { contribGain, expGain, stoneGain };
  },

  /**
   * Try to get advanced item reward
   */
  tryGetAdvancedItem: (player: PlayerStats, task: RandomSectTask): { item: Partial<Item> | null; message: string } => {
    if (task.difficulty !== 'Extreme' || task.quality !== 'Mythic') {
      return { item: null, message: '' };
    }

    const currentRealmIndex = REALM_ORDER.indexOf(player.realm);
    const advancedItemChance = 0.08;

    if (Math.random() >= advancedItemChance) return { item: null, message: '' };

    // Foundation Treasures (Qi Refining, Foundation)
    if (currentRealmIndex <= REALM_ORDER.indexOf(RealmType.Foundation)) {
      const treasures = Object.values(FOUNDATION_TREASURES);
      const available = treasures.filter(t => !t.requiredLevel || player.realmLevel >= t.requiredLevel);
      if (available.length > 0) {
        const selected = available[Math.floor(Math.random() * available.length)];
        return {
          item: {
            id: uid(),
            name: selected.name,
            type: ItemType.AdvancedItem,
            description: selected.description,
            quantity: 1,
            rarity: selected.rarity,
            advancedItemType: 'foundationTreasure',
            advancedItemId: selected.id,
          },
          message: ` ✨ Obtained Foundation Treasure [${selected.name}]!`
        };
      }
    }

    // Heaven Earth Essences (Golden Core, Nascent Soul)
    if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.GoldenCore) && currentRealmIndex <= REALM_ORDER.indexOf(RealmType.NascentSoul)) {
      const essences = Object.values(HEAVEN_EARTH_ESSENCES);
      if (essences.length > 0) {
        const selected = essences[Math.floor(Math.random() * essences.length)];
        return {
          item: {
            id: uid(),
            name: selected.name,
            type: ItemType.AdvancedItem,
            description: selected.description,
            quantity: 1,
            rarity: selected.rarity,
            advancedItemType: 'heavenEarthEssence',
            advancedItemId: selected.id,
          },
          message: ` ✨ Obtained Heaven Earth Essence [${selected.name}]!`
        };
      }
    }

    // Heaven Earth Marrows (Spirit Severing and above)
    if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.SpiritSevering) && Math.random() < 0.7) {
      const marrows = Object.values(HEAVEN_EARTH_MARROWS);
      if (marrows.length > 0) {
        const selected = marrows[Math.floor(Math.random() * marrows.length)];
        return {
          item: {
            id: uid(),
            name: selected.name,
            type: ItemType.AdvancedItem,
            description: selected.description,
            quantity: 1,
            rarity: selected.rarity,
            advancedItemType: 'heavenEarthMarrow',
            advancedItemId: selected.id,
          },
          message: ` ✨ Obtained Heaven Earth Marrow [${selected.name}]!`
        };
      }
    }

    // Rules of Longevity (Longevity Realm)
    if (currentRealmIndex >= REALM_ORDER.indexOf(RealmType.LongevityRealm) && Math.random() < 0.5) {
      const rules = Object.values(LONGEVITY_RULES);
      const currentRules = player.longevityRules || [];
      const available = rules.filter(r => !currentRules.includes(r.id));
      const maxRules = player.maxLongevityRules || 3;
      if (available.length > 0 && currentRules.length < maxRules) {
        const selected = available[Math.floor(Math.random() * available.length)];
        return {
          item: {
            id: uid(),
            name: selected.name,
            type: ItemType.AdvancedItem,
            description: selected.description,
            quantity: 1,
            rarity: 'Mythic',
            advancedItemType: 'longevityRule',
            advancedItemId: selected.id,
          },
          message: ` ✨ Obtained Rule of Longevity [${selected.name}]!`
        };
      }
    }

    return { item: null, message: '' };
  }
};

