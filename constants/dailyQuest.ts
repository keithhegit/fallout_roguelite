/**
 * Daily Scavenging Task System Constants
 */

import { DailyQuestType, ItemRarity, RealmType, Recipe } from '../types';
import { RARITY_MULTIPLIERS } from './items';

// Daily Task Type Configuration
export interface DailyQuestConfig {
  type: DailyQuestType;
  name: string;
  description: string;
  targetRange: { min: number; max: number }; // Target quantity range
  rewardMultiplier: number; // Reward multiplier
}

// Daily Task Base Configuration
export const DAILY_QUEST_CONFIGS: Partial<Record<DailyQuestType, Omit<DailyQuestConfig, 'targetRange'>>> = {
  meditate: {
    type: 'meditate',
    name: 'System Reboot',
    description: 'Perform a specified number of system reboots/maintenances',
    rewardMultiplier: 1.0,
  },
  adventure: {
    type: 'adventure',
    name: 'Scavenging Expedition',
    description: 'Complete a specified number of scavenging expeditions',
    rewardMultiplier: 1.2,
  },
  breakthrough: {
    type: 'breakthrough',
    name: 'Mutation Breakthrough',
    description: 'Complete a specified number of mutation breakthroughs',
    rewardMultiplier: 2.0,
  },
  alchemy: {
    type: 'alchemy',
    name: 'Chemical Synthesis',
    description: 'Synthesize a specified number of chemical compounds',
    rewardMultiplier: 1.5,
  },
  equip: {
    type: 'equip',
    name: 'Gear Modification',
    description: 'Perform a specified number of gear modifications',
    rewardMultiplier: 1.3,
  },
  pet: {
    type: 'pet',
    name: 'Pet Conditioning',
    description: 'Feed or train your mutant pet for a specified number of times',
    rewardMultiplier: 1.4,
  },
  sect: {
    type: 'sect',
    name: 'Faction Task',
    description: 'Complete a specified number of tasks for your faction',
    rewardMultiplier: 1.6,
  },
  realm: {
    type: 'realm',
    name: 'Vault Exploration',
    description: 'Explore a specified number of pre-war vaults',
    rewardMultiplier: 1.8,
  },
};

// 任务目标数量范围（根据类型）
export const DAILY_QUEST_TARGET_RANGES: Record<DailyQuestType, { min: number; max: number }> = {
  meditate: { min: 3, max: 8 }, // 打坐：3-8次，比较轻松
  adventure: { min: 3, max: 10 }, // 历练：3-10次，适中
  breakthrough: { min: 0, max: 1 }, // 境界突破：0-1次（0表示不出现，1表示最多1次），因为突破需要积累修为
  alchemy: { min: 2, max: 6 }, // 炼丹：2-6次，适中
  equip: { min: 1, max: 3 }, // 装备强化：1-3次，适中
  pet: { min: 1, max: 3 }, // 灵宠培养：1-3次，适中
  sect: { min: 2, max: 5 }, // 宗门任务：2-5次，适中
  realm: { min: 1, max: 3 }, // 秘境探索：1-3次，适中
  kill: { min: 5, max: 20 }, // 击败敌人：5-20次（AI生成）
  collect: { min: 3, max: 10 }, // 收集物品：3-10次（AI生成）
  learn: { min: 1, max: 3 }, // 学习功法：1-3次（AI生成）
  other: { min: 1, max: 5 }, // 其他任务：1-5次（AI生成）
};

// 根据稀有度计算奖励
export const calculateDailyQuestReward = (
  type: DailyQuestType,
  target: number,
  rarity: ItemRarity
): {
  exp?: number;
  spiritStones?: number;
  lotteryTickets?: number;
} => {
  const config = DAILY_QUEST_CONFIGS[type];
  const rarityMultiplier = RARITY_MULTIPLIERS[rarity];
  const baseReward = target * config.rewardMultiplier * rarityMultiplier;

  // 根据任务类型分配奖励
  switch (type) {
    case 'meditate':
      return {
        exp: Math.floor(baseReward * 20),
        spiritStones: Math.floor(baseReward * 10),
      };
    case 'adventure':
      return {
        exp: Math.floor(baseReward * 30),
        spiritStones: Math.floor(baseReward * 15),
        lotteryTickets: rarity === 'Mythic' ? 1 : 0,
      };
    case 'breakthrough':
      return {
        exp: Math.floor(baseReward * 100),
        spiritStones: Math.floor(baseReward * 50),
        lotteryTickets: rarity === 'Legendary' || rarity === 'Mythic' ? 1 : 0,
      };
    case 'alchemy':
      return {
        exp: Math.floor(baseReward * 25),
        spiritStones: Math.floor(baseReward * 20),
      };
    case 'equip':
      return {
        exp: Math.floor(baseReward * 15),
        spiritStones: Math.floor(baseReward * 30),
      };
    case 'pet':
      return {
        exp: Math.floor(baseReward * 20),
        spiritStones: Math.floor(baseReward * 15),
      };
    case 'sect':
      return {
        exp: Math.floor(baseReward * 40),
        spiritStones: Math.floor(baseReward * 25),
        lotteryTickets: rarity === 'Mythic' ? 1 : 0,
      };
    case 'realm':
      return {
        exp: Math.floor(baseReward * 50),
        spiritStones: Math.floor(baseReward * 40),
        lotteryTickets: rarity === 'Legendary' || rarity === 'Mythic' ? 1 : 0,
      };
    default:
      return {
        exp: Math.floor(baseReward * 20),
        spiritStones: Math.floor(baseReward * 10),
      };
  }
};

// Generate Daily Task Rarity
export const generateDailyQuestRarity = (): ItemRarity => {
  const rand = Math.random();
  if (rand < 0.5) return 'Common';
  if (rand < 0.8) return 'Rare';
  if (rand < 0.95) return 'Legendary';
  return 'Mythic';
};

// 30个预定义的日常任务模板
export interface PredefinedDailyQuest {
  type: DailyQuestType;
  name: string;
  description: string;
  targetRange: { min: number; max: number };
  rarity: ItemRarity; // 固定稀有度
}

export const PREDEFINED_DAILY_QUESTS: PredefinedDailyQuest[] = [
  // System Reboot (5)
  { type: 'meditate', name: 'Morning Reboot', description: 'Perform core maintenance at sunrise to absorb background radiation', targetRange: { min: 3, max: 6 }, rarity: 'Common' },
  { type: 'meditate', name: 'Diagnostic Run', description: 'Run a deep system diagnostic to optimize survival protocols', targetRange: { min: 4, max: 8 }, rarity: 'Common' },
  { type: 'meditate', name: 'Lunar Siphon', description: 'Absorb the refined nocturnal radiation', targetRange: { min: 5, max: 8 }, rarity: 'Rare' },
  { type: 'meditate', name: 'Elite Sequence', description: 'Accelerate your genetic sequence through core focus', targetRange: { min: 6, max: 10 }, rarity: 'Legendary' },
  { type: 'meditate', name: 'Singularity Sync', description: 'Synchronize your biological core with the universal data stream', targetRange: { min: 8, max: 12 }, rarity: 'Mythic' },

  // Scavenging Expedition (5)
  { type: 'adventure', name: 'Waste Clearing', description: 'Venture out and clear hostile mutants from the safe zone', targetRange: { min: 3, max: 7 }, rarity: 'Common' },
  { type: 'adventure', name: 'Unknown Recon', description: 'Explore unknown ruins for pre-war artifacts', targetRange: { min: 4, max: 8 }, rarity: 'Common' },
  { type: 'adventure', name: 'Urban Scavenge', description: 'Scavenge for supplies in the ruined cities', targetRange: { min: 5, max: 10 }, rarity: 'Rare' },
  { type: 'adventure', name: 'Sector Puree', description: 'Clear a high-threat sector of apex mutants', targetRange: { min: 6, max: 12 }, rarity: 'Legendary' },
  { type: 'adventure', name: 'Vault Siege', description: 'Participate in a siege of a fortified pre-war vault', targetRange: { min: 8, max: 15 }, rarity: 'Mythic' },

  // Mutation Breakthrough (3)
  { type: 'breakthrough', name: 'Limit Break', description: 'Break through your current genetic limits', targetRange: { min: 1, max: 1 }, rarity: 'Rare' },
  { type: 'breakthrough', name: 'Tier Evolution', description: 'Complete a full tier mutation breakthrough', targetRange: { min: 1, max: 1 }, rarity: 'Legendary' },
  { type: 'breakthrough', name: 'Transcendent Shift', description: 'Achieve a transcendent mutation state', targetRange: { min: 1, max: 1 }, rarity: 'Mythic' },

  // Chemical Synthesis (4)
  { type: 'alchemy', name: 'Chem Basics', description: 'Synthesize basic chemicals for daily survival', targetRange: { min: 2, max: 5 }, rarity: 'Common' },
  { type: 'alchemy', name: 'Stim Production', description: 'Synthesize advanced stimpaks to aid in evolution', targetRange: { min: 3, max: 6 }, rarity: 'Rare' },
  { type: 'alchemy', name: 'Apex Serum', description: 'Synthesize high-grade serums for maximum performance', targetRange: { min: 4, max: 8 }, rarity: 'Legendary' },
  { type: 'alchemy', name: 'God-Machine Formula', description: 'Synthesize a legendary chemical formula from the pre-war era', targetRange: { min: 5, max: 10 }, rarity: 'Mythic' },

  // Gear Modification (3)
  { type: 'equip', name: 'Basic Tuning', description: 'Modify your gear to improve functional integrity', targetRange: { min: 1, max: 3 }, rarity: 'Common' },
  { type: 'equip', name: 'Relic Refinement', description: 'Refine a pre-war relic to unlock its hidden power', targetRange: { min: 2, max: 4 }, rarity: 'Rare' },
  { type: 'equip', name: 'Prototype Forge', description: 'Modify a prototype weapon into a legendary arm', targetRange: { min: 3, max: 5 }, rarity: 'Legendary' },

  // Pet Conditioning (3)
  { type: 'pet', name: 'Mutant Rations', description: 'Feed your mutant pet with high-energy rations', targetRange: { min: 1, max: 3 }, rarity: 'Common' },
  { type: 'pet', name: 'DNA Evolution', description: 'Help your pet complete a DNA-based evolution', targetRange: { min: 1, max: 2 }, rarity: 'Rare' },
  { type: 'pet', name: 'Apex Guardian', description: 'Condition your pet to become an apex wasteland guardian', targetRange: { min: 2, max: 4 }, rarity: 'Legendary' },

  // Faction Task (3)
  { type: 'sect', name: 'Community Task', description: 'Complete a task assigned by your faction leader', targetRange: { min: 2, max: 5 }, rarity: 'Common' },
  { type: 'sect', name: 'Faction Merit', description: 'Perform deeds to increase your merit within the community', targetRange: { min: 3, max: 6 }, rarity: 'Rare' },
  { type: 'sect', name: 'Iron Trial', description: 'Complete a deadly trial to prove your loyalty to the faction', targetRange: { min: 4, max: 8 }, rarity: 'Legendary' },

  // Vault Exploration (4)
  { type: 'realm', name: 'Vault Recon', description: 'Perform recon on a mysterious pre-war vault', targetRange: { min: 1, max: 3 }, rarity: 'Common' },
  { type: 'realm', name: 'Relic Hunting', description: 'Search for precious relics within deep vault levels', targetRange: { min: 2, max: 4 }, rarity: 'Rare' },
  { type: 'realm', name: 'Ancient Data Hunt', description: 'Scavenge pre-war data servers for lost knowledge', targetRange: { min: 3, max: 5 }, rarity: 'Legendary' },
  { type: 'realm', name: 'Core Breach', description: 'Explore a breached reactor core for mythic energy', targetRange: { min: 4, max: 6 }, rarity: 'Mythic' },
];
