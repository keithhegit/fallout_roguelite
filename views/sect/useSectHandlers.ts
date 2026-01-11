import React from 'react';
import {
  PlayerStats,
  Item,
  ItemType,
  RealmType,
  SectRank,
} from '../../types';
import {
  SECTS,
  SECT_RANK_REQUIREMENTS,
  SECT_PROMOTION_BASE_REWARDS,
  SECT_SPECIAL_REWARDS,
  SECT_MASTER_CHALLENGE_REQUIREMENTS,
  REALM_ORDER,
} from '../../constants/index';
import { getPlayerTotalStats } from '../../utils/statUtils';
import { RandomSectTask } from '../../services/randomService';
import { AdventureResult } from '../../types';
import { addItemToInventory } from '../../utils/inventoryUtils';
import { sectTaskUtils } from '../../utils/sectTaskUtils';

interface UseSectHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setIsSectOpen: (open: boolean) => void;
  setPurchaseSuccess: (
    success: { item: string; quantity: number } | null
  ) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
  onChallengeLeader?: (params: { adventureType: 'sect_challenge' }) => void;
}

/**
 * Sect Handlers
 * Includes joining sect, leaving sect, completing sect tasks, promoting sect rank, purchasing sect items
 * @param player Player data
 * @param setPlayer Set player data
 * @param addLog Add log
 * @param setIsSectOpen Set sect modal open state
 * @param setPurchaseSuccess Set purchase success state
 * @returns handleJoinSect Join sect
 * @returns handleLeaveSect Leave sect
 * @returns handleSectTask Complete sect task
 * @returns handleSectPromote Promote sect rank
 * @returns handleSectBuy Buy sect items
 */

export function useSectHandlers({
  player,
  setPlayer,
  addLog,
  setIsSectOpen,
  setPurchaseSuccess,
  setItemActionLog,
  onChallengeLeader,
}: UseSectHandlersProps) {
  // Helper: Unify log output, prefer setItemActionLog
  const logMessage = (message: string, type: string = 'normal') => {
    if (setItemActionLog) {
      setItemActionLog({ text: message, type });
    } else {
      addLog(message, type);
    }
  };

  const handleJoinSect = (sectId: string, sectName?: string, sectInfo?: { exitCost?: { spiritStones?: number; items?: { name: string; quantity: number }[] } }) => {
    // Try to find in SECTS first
    let sect = SECTS.find((s) => s.id === sectId);

    // If not found, it's a generated sect, use passed name or create temp object
    if (!sect) {
      if (sectName) {
        // Create temp sect object from name
        sect = {
          id: sectId,
          name: sectName,
          description: '',
          reqRealm: RealmType.QiRefining,
          grade: 'C', // Default grade
          exitCost: sectInfo?.exitCost || {
            spiritStones: 300,
            items: [{ name: 'Glowing Fungus', quantity: 5 }],
          },
        };
      } else {
        // If no name, try to find in availableSects (passed from SectModal)
        console.warn('Sect info not found:', sectId);
        return;
      }
    }

    setPlayer((prev) => ({
      ...prev,
      sectId: sectId,
      sectRank: SectRank.Outer,
      sectContribution: 0,
      // If random sect, save full info
      currentSectInfo: !SECTS.find((s) => s.id === sectId) ? {
        id: sectId,
        name: sect!.name,
        exitCost: sect!.exitCost,
      } : undefined,
    }));
    logMessage(`Congratulations! You have joined [${sect.name}] as an Initiate.`, 'special');
  };

  const handleLeaveSect = () => {
    // Betray directly, will be hunted
    setPlayer((prev) => {
      if (!prev.sectId) return prev;

      const betrayedSects = [...(prev.betrayedSects || [])];
      if (!betrayedSects.includes(prev.sectId)) {
        betrayedSects.push(prev.sectId);
      }

      // Get sect name
      let sectName: string | null = null;
      // Prioritize getting from saved sect info
      if (prev.currentSectInfo) {
        sectName = prev.currentSectInfo.name;
      } else {
        // Find in SECTS constants
        const sect = SECTS.find((s) => s.id === prev.sectId);
        sectName = sect ? sect.name : null;
      }

      // Set hunt duration (7 days)
      const huntDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
      const huntEndTime = Date.now() + huntDuration;

      return {
        ...prev,
        sectId: null,
        sectRank: SectRank.Outer,
        sectContribution: 0,
        currentSectInfo: undefined, // Clear saved sect info
        betrayedSects,
        sectHuntEndTime: huntEndTime,
        sectHuntLevel: 0, // Initial hunt intensity is 0 (Initiate)
        sectHuntSectId: prev.sectId, // Record the sect ID hunting the player
        sectHuntSectName: sectName, // Record the sect name hunting the player
      };
    });
    logMessage(`You betrayed the faction! You are now a Wasteland Drifter. A kill order has been issued!`, 'danger');
    setIsSectOpen(false);
  };

  const handleSafeLeaveSect = () => {
    // Leave safely, need to pay price
    setPlayer((prev) => {
      if (!prev.sectId) {
        logMessage('You are not currently in any faction.', 'danger');
        return prev;
      }

      // Try to find in SECTS first
      let sect = SECTS.find((s) => s.id === prev.sectId);

      // If not found, try to get from saved sect info
      if (!sect && prev.currentSectInfo) {
        sect = {
          id: prev.currentSectInfo.id,
          name: prev.currentSectInfo.name,
          description: '',
          reqRealm: RealmType.QiRefining,
          grade: 'C',
          exitCost: prev.currentSectInfo.exitCost,
        };
      }

      // If still not found, use default exit cost
      if (!sect) {
        sect = {
          id: prev.sectId,
          name: 'This Sect', // Unable to get name, use placeholder
          description: '',
          reqRealm: RealmType.QiRefining,
          grade: 'C',
          exitCost: {
            spiritStones: 300,
            items: [{ name: 'Glowing Fungus', quantity: 5 }],
          },
        };
      }

      if (!sect.exitCost) {
        logMessage('Cannot leave safely. No exit cost defined.', 'danger');
        return prev;
      }

      // Check if resources are sufficient
      let updatedInventory = [...prev.inventory];
      let stoneCost = sect.exitCost.spiritStones || 0;
      const missingItems: string[] = [];

      if (prev.spiritStones < stoneCost) {
        logMessage(`Insufficient Caps. Need ${stoneCost}, have ${prev.spiritStones}.`, 'danger');
        return prev;
      }

      if (sect.exitCost.items) {
        for (const itemReq of sect.exitCost.items) {
          const itemIdx = updatedInventory.findIndex(
            (i) => i.name === itemReq.name
          );
          if (
            itemIdx === -1 ||
            updatedInventory[itemIdx].quantity < itemReq.quantity
          ) {
            const currentQuantity = itemIdx >= 0 ? updatedInventory[itemIdx].quantity : 0;
            missingItems.push(`${itemReq.name} (Need ${itemReq.quantity}, Have ${currentQuantity})`);
          }
        }

        if (missingItems.length > 0) {
          logMessage(`Missing items: ${missingItems.join(', ')}.`, 'danger');
          return prev;
        }

        // Deduct items
        for (const itemReq of sect.exitCost.items) {
          const itemIdx = updatedInventory.findIndex(
            (i) => i.name === itemReq.name
          );
          updatedInventory[itemIdx] = {
            ...updatedInventory[itemIdx],
            quantity: updatedInventory[itemIdx].quantity - itemReq.quantity,
          };
        }
        updatedInventory = updatedInventory.filter((i) => i.quantity > 0);
      }

      logMessage(`You paid the price and safely left [${sect.name}].`, 'normal');
      setIsSectOpen(false);

      return {
        ...prev,
        sectId: null,
        sectRank: SectRank.Outer,
        sectContribution: 0,
        currentSectInfo: undefined, // Clear saved sect info
        spiritStones: prev.spiritStones - stoneCost,
        inventory: updatedInventory,
      };
    });
  };

  const handleSectTask = (
    task: RandomSectTask,
    encounterResult?: AdventureResult,
    isPerfectCompletion?: boolean
  ) => {
    setPlayer((prev) => {
      // 1. Daily task limit logic
      const { limitReached, updatedCount, resetDate } = sectTaskUtils.checkDailyLimit(prev, task.id);
      if (limitReached) {
        logMessage(`You have completed [${task.name}] 3 times today. Please come back tomorrow.`, 'danger');
        return prev;
      }

      // 2. Cost check and deduction
      let updatedInventory = [...prev.inventory];
      let stoneCost = task.cost?.spiritStones || 0;

      if (prev.spiritStones < stoneCost) {
        logMessage(`Insufficient Spirit Stones! Need ${stoneCost}.`, 'danger');
        return prev;
      }

      if (task.cost?.items) {
        for (const itemReq of task.cost.items) {
          const itemIdx = updatedInventory.findIndex((i) => i.name === itemReq.name);
          if (itemIdx === -1 || updatedInventory[itemIdx].quantity < itemReq.quantity) {
            logMessage(`Insufficient Items! Need ${itemReq.quantity} x [${itemReq.name}].`, 'danger');
            return prev;
          }
          updatedInventory[itemIdx] = {
            ...updatedInventory[itemIdx],
            quantity: updatedInventory[itemIdx].quantity - itemReq.quantity,
          };
        }
        updatedInventory = updatedInventory.filter((i) => i.quantity > 0);
      }

      // 3. Reward calculation
      const { contribGain, expGain, stoneGain } = sectTaskUtils.calculateRewards(prev, task, !!isPerfectCompletion, encounterResult);

      if (prev.lastCompletedTaskType === task.type && task.typeBonus) {
        logMessage(`Consecutive ${task.type} tasks completed! Reward +${task.typeBonus}%!`, 'special');
      }

      // 4. Issue rewards
      // Normal reward items
      if (task.reward.items) {
        task.reward.items.forEach((ri) => {
          updatedInventory = addItemToInventory(
            updatedInventory,
            { name: ri.name, type: ItemType.Material, rarity: 'Common' },
            ri.quantity
          );
        });
      }

      // Special random reward (10% chance)
      let specialMsg = '';
      if (task.specialReward && Math.random() < 0.1) {
        const si = task.specialReward.item;
        if (si) {
          updatedInventory = addItemToInventory(
            updatedInventory,
            {
              name: si.name,
              type: ItemType.Material,
              rarity: task.quality === 'Mythic' ? 'Mythic' : 'Legendary',
            },
            si.quantity || 1
          );
          specialMsg = ` Bonus Special Reward: ${si.name}!`;
        }
      }

      // Advanced item reward
      const { item: advItem, message: advMsg } = sectTaskUtils.tryGetAdvancedItem(prev, task);
      if (advItem) {
        updatedInventory.push(advItem);
        specialMsg += advMsg;
      }

      // 5. Log and status update
      const rewardParts = [
        `${contribGain} Contrib`,
        expGain > 0 ? `${expGain} Exp` : '',
        stoneGain > 0 ? `${stoneGain} Stones` : '',
      ].filter(Boolean);

      const completionText = isPerfectCompletion ? '(Perfect Completion)' : '';
      logMessage(
        `Completed task [${task.name}]${completionText}! Gained ${rewardParts.join(', ')}.${specialMsg}`,
        isPerfectCompletion ? 'special' : 'gain'
      );

      const totalStats = getPlayerTotalStats(prev);
      const actualMaxHp = totalStats.maxHp;
      const newHp = encounterResult
        ? Math.max(0, Math.min(actualMaxHp, prev.hp + (encounterResult.hpChange || 0)))
        : prev.hp;

      return {
        ...prev,
        spiritStones: prev.spiritStones - stoneCost + stoneGain,
        exp: prev.exp + expGain,
        hp: newHp,
        inventory: updatedInventory,
        sectContribution: prev.sectContribution + contribGain,
        dailyTaskCount: updatedCount,
        lastTaskResetDate: resetDate,
        lastCompletedTaskType: task.type,
      };
    });
  };

  const handleSectPromote = () => {
    setPlayer((prev) => {
      const ranks = Object.values(SectRank);
      const currentRankIdx = ranks.indexOf(prev.sectRank);
      const nextRank = ranks[currentRankIdx + 1];

      if (!nextRank) return prev;

      // Leader can only be obtained through challenge
      if (nextRank === SectRank.Leader) {
        logMessage('The position of Sect Leader must be obtained by challenging the Forbidden Area and defeating the previous Leader.', 'danger');
        return prev;
      }

      const req = SECT_RANK_REQUIREMENTS[nextRank];
      if (prev.sectContribution < req.contribution) return prev;

      // Get rewards from constants
      const baseReward = SECT_PROMOTION_BASE_REWARDS[nextRank];
      const specialReward = SECT_SPECIAL_REWARDS[prev.sectId || '']?.[nextRank] || { items: [] };

      const reward = {
        ...baseReward,
        items: specialReward.items,
      };

      let updatedInventory = [...prev.inventory];

      // Add reward items
      if (reward.items) {
        reward.items.forEach((rewardItem) => {
          updatedInventory = addItemToInventory(
            updatedInventory,
            {
              name: rewardItem.name,
              type: ItemType.Material,
              description: `Promotion Reward: ${rewardItem.name}`,
              rarity: 'Common',
            },
            rewardItem.quantity || 1
          );
        });
      }

      const rewardText = [
        `${reward.contribution} Contrib`,
        `${reward.exp} Exp`,
        `${reward.spiritStones} Stones`,
        reward.items
          ? reward.items.map((i) => `${i.quantity} ${i.name}`).join(', ')
          : '',
      ]
        .filter(Boolean)
        .join(', ');

      logMessage(
        `Congratulations! You have been promoted to [${nextRank}]. Status increased! Gained: ${rewardText}.`,
        'special'
      );

      return {
        ...prev,
        sectRank: nextRank,
        sectContribution:
          prev.sectContribution - req.contribution + reward.contribution,
        exp: prev.exp + reward.exp,
        spiritStones: prev.spiritStones + reward.spiritStones,
        inventory: updatedInventory,
      };
    });
  };

  const handleSectBuy = (
    itemTemplate: Partial<Item>,
    cost: number,
    quantity: number = 1
  ) => {
    setPlayer((prev) => {
      const totalCost = cost * quantity;
      if (prev.sectContribution < totalCost) {
        logMessage('Insufficient Contribution!', 'danger');
        return prev;
      }

      const newInv = addItemToInventory(prev.inventory, itemTemplate, quantity);

      logMessage(
        `Spent ${totalCost} Contribution to exchange for ${itemTemplate.name} x${quantity}.`,
        'gain'
      );
      // Show purchase success popup
      setPurchaseSuccess({ item: itemTemplate.name || 'Unknown Item', quantity });
      setTimeout(() => setPurchaseSuccess(null), 2000);

      return {
        ...prev,
        sectContribution: prev.sectContribution - totalCost,
        inventory: newInv,
      };
    });
  };

  const handleBecomeLeader = () => {
    setPlayer((prev) => {
      if (prev.sectRank !== SectRank.Elder) return prev;

      const baseReward = SECT_PROMOTION_BASE_REWARDS[SectRank.Leader];
      const specialReward = SECT_SPECIAL_REWARDS[prev.sectId || '']?.[SectRank.Leader] || { items: [] };

      let updatedInventory = [...prev.inventory];
      if (specialReward.items) {
        specialReward.items.forEach((item) => {
          updatedInventory = addItemToInventory(updatedInventory, {
            name: item.name,
            type: ItemType.Material,
            rarity: 'Mythic',
          }, item.quantity);
        });
      }

      logMessage(`Congratulations! You passed the trial and officially took over the sect, becoming the new [Leader]!`, 'special');
      logMessage(`Inauguration Reward: ${baseReward.exp} Exp, ${baseReward.spiritStones} Stones, ${baseReward.contribution} Sect Contribution.`, 'gain');

      return {
        ...prev,
        sectRank: SectRank.Leader,
        sectMasterId: prev.id || 'player-leader', // Set to player's own ID
        exp: prev.exp + baseReward.exp,
        spiritStones: prev.spiritStones + baseReward.spiritStones,
        sectContribution: prev.sectContribution + baseReward.contribution,
        inventory: updatedInventory,
      };
    });
  };

  const handleChallengeLeader = () => {
    // 1. Identity check
    if (player.sectRank !== SectRank.Elder) {
      logMessage('Only Elders can challenge the Sect Leader.', 'danger');
      return;
    }

    // 2. Realm check
    const currentRealmIdx = REALM_ORDER.indexOf(player.realm);
    const minRealmIdx = REALM_ORDER.indexOf(SECT_MASTER_CHALLENGE_REQUIREMENTS.minRealm);
    if (currentRealmIdx < minRealmIdx) {
      logMessage(`Challenge requires [${SECT_MASTER_CHALLENGE_REQUIREMENTS.minRealm}] realm.`, 'danger');
      return;
    }

    // 3. Contribution check
    if (player.sectContribution < SECT_MASTER_CHALLENGE_REQUIREMENTS.minContribution) {
      logMessage(`Insufficient Contribution. Need ${SECT_MASTER_CHALLENGE_REQUIREMENTS.minContribution} Sect Contribution.`, 'danger');
      return;
    }

    // 4. Spirit Stones check
    if (player.spiritStones < SECT_MASTER_CHALLENGE_REQUIREMENTS.challengeCost.spiritStones) {
      logMessage(`Insufficient Spirit Stones. Opening the Forbidden Area requires ${SECT_MASTER_CHALLENGE_REQUIREMENTS.challengeCost.spiritStones} Stones.`, 'danger');
      return;
    }

    if (onChallengeLeader) {
      // Deduct opening cost (Spirit Stones)
      setPlayer(prev => ({
        ...prev,
        spiritStones: prev.spiritStones - SECT_MASTER_CHALLENGE_REQUIREMENTS.challengeCost.spiritStones
      }));

      logMessage('You challenged the Sect Leader and entered the Forbidden Area...', 'special');
      onChallengeLeader({ adventureType: 'sect_challenge' });
    }
  };

  return {
    handleJoinSect,
    handleLeaveSect,
    handleSafeLeaveSect,
    handleSectTask,
    handleSectPromote,
    handleSectBuy,
    handleBecomeLeader,
    handleChallengeLeader,
  };
}
