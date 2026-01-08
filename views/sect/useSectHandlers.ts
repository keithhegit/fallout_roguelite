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
 * 宗门处理函数
 * 包含加入宗门、离开宗门、完成宗门任务、晋升宗门、购买宗门物品
 * @param player 玩家数据
 * @param setPlayer 设置玩家数据
 * @param addLog 添加日志
 * @param setIsSectOpen 设置宗门是否打开
 * @param setPurchaseSuccess 设置购买成功
 * @returns handleJoinSect 加入宗门
 * @returns handleLeaveSect 离开宗门
 * @returns handleSectTask 完成宗门任务
 * @returns handleSectPromote 晋升宗门
 * @returns handleSectBuy 购买宗门物品
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
    // 先尝试从 SECTS 中查找
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
            items: [{ name: '聚灵草', quantity: 5 }],
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
    // 直接背叛，会被追杀
    setPlayer((prev) => {
      if (!prev.sectId) return prev;

      const betrayedSects = [...(prev.betrayedSects || [])];
      if (!betrayedSects.includes(prev.sectId)) {
        betrayedSects.push(prev.sectId);
      }

      // 获取宗门名称
      let sectName: string | null = null;
      // 优先从保存的宗门信息中获取
      if (prev.currentSectInfo) {
        sectName = prev.currentSectInfo.name;
      } else {
        // 从SECTS常量中查找
        const sect = SECTS.find((s) => s.id === prev.sectId);
        sectName = sect ? sect.name : null;
      }

      // 设置追杀时间（7天）
      const huntDuration = 7 * 24 * 60 * 60 * 1000; // 7天
      const huntEndTime = Date.now() + huntDuration;

      return {
        ...prev,
        sectId: null,
        sectRank: SectRank.Outer,
        sectContribution: 0,
        currentSectInfo: undefined, // 清除保存的宗门信息
        betrayedSects,
        sectHuntEndTime: huntEndTime,
        sectHuntLevel: 0, // 初始追杀强度为0（普通弟子）
        sectHuntSectId: prev.sectId, // 记录正在追杀玩家的宗门ID
        sectHuntSectName: sectName, // 记录正在追杀玩家的宗门名称
      };
    });
    logMessage(`You betrayed the faction! You are now a Wasteland Drifter. A kill order has been issued!`, 'danger');
    setIsSectOpen(false);
  };

  const handleSafeLeaveSect = () => {
    // 安全退出，需要支付代价
    setPlayer((prev) => {
      if (!prev.sectId) {
        logMessage('You are not currently in any faction.', 'danger');
        return prev;
      }

      // 先尝试从 SECTS 中查找
      let sect = SECTS.find((s) => s.id === prev.sectId);

      // 如果找不到，尝试从保存的宗门信息中获取
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

      // 如果还是找不到，使用默认退出代价
      if (!sect) {
        sect = {
          id: prev.sectId,
          name: '该宗门', // 无法获取名称，使用占位符
          description: '',
          reqRealm: RealmType.QiRefining,
          grade: 'C',
          exitCost: {
            spiritStones: 300,
            items: [{ name: '聚灵草', quantity: 5 }],
          },
        };
      }

      if (!sect.exitCost) {
        logMessage('Cannot leave safely. No exit cost defined.', 'danger');
        return prev;
      }

      // 检查是否有足够的资源
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
            missingItems.push(`${itemReq.name}（需要 ${itemReq.quantity} 个，当前拥有 ${currentQuantity} 个）`);
          }
        }

        if (missingItems.length > 0) {
          logMessage(`Missing items: ${missingItems.join(', ')}.`, 'danger');
          return prev;
        }

        // 扣除物品
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
        currentSectInfo: undefined, // 清除保存的宗门信息
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
      // 1. 每日任务限制逻辑
      const { limitReached, updatedCount, resetDate } = sectTaskUtils.checkDailyLimit(prev, task.id);
      if (limitReached) {
        logMessage(`今日已完成3次【${task.name}】任务，请明日再来。`, 'danger');
        return prev;
      }

      // 2. 消耗检查与扣除
      let updatedInventory = [...prev.inventory];
      let stoneCost = task.cost?.spiritStones || 0;

      if (prev.spiritStones < stoneCost) {
        logMessage(`灵石不足，需要 ${stoneCost} 灵石。`, 'danger');
        return prev;
      }

      if (task.cost?.items) {
        for (const itemReq of task.cost.items) {
          const itemIdx = updatedInventory.findIndex((i) => i.name === itemReq.name);
          if (itemIdx === -1 || updatedInventory[itemIdx].quantity < itemReq.quantity) {
            logMessage(`物品不足，需要 ${itemReq.quantity} 个【${itemReq.name}】。`, 'danger');
            return prev;
          }
          updatedInventory[itemIdx] = {
            ...updatedInventory[itemIdx],
            quantity: updatedInventory[itemIdx].quantity - itemReq.quantity,
          };
        }
        updatedInventory = updatedInventory.filter((i) => i.quantity > 0);
      }

      // 3. 奖励计算
      const { contribGain, expGain, stoneGain } = sectTaskUtils.calculateRewards(prev, task, !!isPerfectCompletion, encounterResult);

      if (prev.lastCompletedTaskType === task.type && task.typeBonus) {
        logMessage(`连续完成${task.type}任务，获得${task.typeBonus}%奖励加成！`, 'special');
      }

      // 4. 发放奖励
      // 普通奖励物品
      if (task.reward.items) {
        task.reward.items.forEach((ri) => {
          updatedInventory = addItemToInventory(
            updatedInventory,
            { name: ri.name, type: ItemType.Material, rarity: '普通' },
            ri.quantity
          );
        });
      }

      // 特殊随机奖励 (10% 概率)
      let specialMsg = '';
      if (task.specialReward && Math.random() < 0.1) {
        const si = task.specialReward.item;
        if (si) {
          updatedInventory = addItemToInventory(
            updatedInventory,
            {
              name: si.name,
              type: ItemType.Material,
              rarity: task.quality === 'Mythic' ? '仙品' : '传说',
            },
            si.quantity || 1
          );
          specialMsg = ` 额外获得特殊奖励：${si.name}！`;
        }
      }

      // 进阶物品奖励
      const { item: advItem, message: advMsg } = sectTaskUtils.tryGetAdvancedItem(prev, task);
      if (advItem) {
        updatedInventory.push(advItem);
        specialMsg += advMsg;
      }

      // 5. 日志与状态更新
      const rewardParts = [
        `${contribGain} 贡献`,
        expGain > 0 ? `${expGain} 修为` : '',
        stoneGain > 0 ? `${stoneGain} 灵石` : '',
      ].filter(Boolean);

      const completionText = isPerfectCompletion ? '（完美完成）' : '';
      logMessage(
        `你完成了任务【${task.name}】${completionText}，获得了 ${rewardParts.join('、')}。${specialMsg}`,
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

      // 宗主只能通过挑战获得
      if (nextRank === SectRank.Leader) {
        logMessage('宗主之位需通过挑战禁地并战胜上代宗主方可继任。', 'danger');
        return prev;
      }

      const req = SECT_RANK_REQUIREMENTS[nextRank];
      if (prev.sectContribution < req.contribution) return prev;

      // 从常量中获取奖励
      const baseReward = SECT_PROMOTION_BASE_REWARDS[nextRank];
      const specialReward = SECT_SPECIAL_REWARDS[prev.sectId || '']?.[nextRank] || { items: [] };

      const reward = {
        ...baseReward,
        items: specialReward.items,
      };

      let updatedInventory = [...prev.inventory];

      // 添加奖励物品
      if (reward.items) {
        reward.items.forEach((rewardItem) => {
          updatedInventory = addItemToInventory(
            updatedInventory,
            {
              name: rewardItem.name,
              type: ItemType.Material,
              description: `晋升奖励：${rewardItem.name}`,
              rarity: '普通',
            },
            rewardItem.quantity || 1
          );
        });
      }

      const rewardText = [
        `${reward.contribution} 贡献`,
        `${reward.exp} 修为`,
        `${reward.spiritStones} 灵石`,
        reward.items
          ? reward.items.map((i) => `${i.quantity} ${i.name}`).join('、')
          : '',
      ]
        .filter(Boolean)
        .join('、');

      logMessage(
        `恭喜！你晋升为【${nextRank}】，地位大增。获得奖励：${rewardText}。`,
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
        logMessage('贡献不足！', 'danger');
        return prev;
      }

      const newInv = addItemToInventory(prev.inventory, itemTemplate, quantity);

      logMessage(
        `你消耗了 ${totalCost} 贡献，兑换了 ${itemTemplate.name} x${quantity}。`,
        'gain'
      );
      // 显示购买成功弹窗
      setPurchaseSuccess({ item: itemTemplate.name || '未知物品', quantity });
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
            rarity: '仙品',
          }, item.quantity);
        });
      }

      logMessage(`恭喜！你通过了考验，正式接管宗门，成为新一代【宗主】！`, 'special');
      logMessage(`获得接任奖励：${baseReward.exp} 修为、${baseReward.spiritStones} 灵石、${baseReward.contribution} 宗门贡献。`, 'gain');

      return {
        ...prev,
        sectRank: SectRank.Leader,
        sectMasterId: prev.id || 'player-leader', // 设置为玩家自己的ID
        exp: prev.exp + baseReward.exp,
        spiritStones: prev.spiritStones + baseReward.spiritStones,
        sectContribution: prev.sectContribution + baseReward.contribution,
        inventory: updatedInventory,
      };
    });
  };

  const handleChallengeLeader = () => {
    // 1. 身份检查
    if (player.sectRank !== SectRank.Elder) {
      logMessage('只有长老才能挑战宗主。', 'danger');
      return;
    }

    // 2. 境界检查
    const currentRealmIdx = REALM_ORDER.indexOf(player.realm);
    const minRealmIdx = REALM_ORDER.indexOf(SECT_MASTER_CHALLENGE_REQUIREMENTS.minRealm);
    if (currentRealmIdx < minRealmIdx) {
      logMessage(`挑战宗主需要达到【${SECT_MASTER_CHALLENGE_REQUIREMENTS.minRealm}】境界。`, 'danger');
      return;
    }

    // 3. 贡献检查
    if (player.sectContribution < SECT_MASTER_CHALLENGE_REQUIREMENTS.minContribution) {
      logMessage(`贡献不足，需要 ${SECT_MASTER_CHALLENGE_REQUIREMENTS.minContribution} 宗门贡献。`, 'danger');
      return;
    }

    // 4. 灵石检查
    if (player.spiritStones < SECT_MASTER_CHALLENGE_REQUIREMENTS.challengeCost.spiritStones) {
      logMessage(`灵石不足，开启挑战禁地需要 ${SECT_MASTER_CHALLENGE_REQUIREMENTS.challengeCost.spiritStones} 灵石。`, 'danger');
      return;
    }

    if (onChallengeLeader) {
      // 扣除开启成本（灵石）
      setPlayer(prev => ({
        ...prev,
        spiritStones: prev.spiritStones - SECT_MASTER_CHALLENGE_REQUIREMENTS.challengeCost.spiritStones
      }));

      logMessage('你向宗主发起了挑战，进入挑战禁地...', 'special');
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
