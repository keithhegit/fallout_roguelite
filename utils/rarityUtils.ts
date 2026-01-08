/**
 * 稀有度相关的工具函数
 * 统一管理所有稀有度相关的样式和工具函数，避免在多个组件中重复定义
 */

import { ItemRarity } from '../types';

/**
 * 获取稀有度的颜色类名（用于文本）
 */
export const getRarityTextColor = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case '稀有':
      return 'text-blue-400';
    case '传说':
      return 'text-purple-400';
    case '仙品':
      return 'text-amber-400';
    default:
      return 'text-steel-400';
  }
};

/**
 * 获取稀有度的名称样式类名（用于物品名称，包含 hover 效果）
 */
export const getRarityNameClasses = (rarity: ItemRarity | undefined): string => {
  const base = 'font-bold transition-colors duration-300 cursor-default ';
  switch (rarity) {
    case '稀有':
      return base + 'text-steel-400 hover:text-blue-400';
    case '传说':
      return base + 'text-steel-400 hover:text-purple-400';
    case '仙品':
      return (
        base +
        'text-steel-400 hover:text-amber-400 hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.45)]'
      );
    default:
      return base + 'text-steel-400 hover:text-stone-100';
  }
};

/**
 * 获取稀有度的边框样式类名
 */
export const getRarityBorder = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case '稀有':
      return 'border-blue-500';
    case '传说':
      return 'border-purple-500';
    case '仙品':
      return 'border-amber-500';
    default:
      return 'border-steel-500';
  }
};

/**
 * 获取稀有度的背景和边框样式类名（用于卡片/面板）
 */
export const getRarityColor = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case '稀有':
      return 'border-blue-500 bg-blue-950/20';
    case '传说':
      return 'border-purple-500 bg-purple-950/20';
    case '仙品':
      return 'border-amber-500 bg-amber-950/20';
    default:
      return 'border-steel-500 bg-stone-900/40';
  }
};

/**
 * 获取稀有度的徽章样式类名（用于标签）
 */
export const getRarityBadge = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case '稀有':
      return 'bg-blue-950/30 text-blue-400 border-blue-500/50';
    case '传说':
      return 'bg-purple-950/30 text-purple-400 border-purple-500/50';
    case '仙品':
      return 'bg-amber-950/30 text-amber-400 border-amber-500/50';
    default:
      return 'bg-stone-950/40 text-steel-400 border-steel-500/50';
  }
};

/**
 * 获取稀有度的发光样式类名
 */
export const getRarityGlow = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case '稀有':
      return 'shadow-[0_0_10px_rgba(59,130,246,0.2)]';
    case '传说':
      return 'shadow-[0_0_15px_rgba(168,85,247,0.2)]';
    case '仙品':
      return 'shadow-[0_0_20px_rgba(245,158,11,0.3)]';
    default:
      return 'shadow-none';
  }
};

/**
 * 获取稀有度的排序权重（用于排序）
 */
export const getRarityOrder = (rarity: ItemRarity | undefined): number => {
  const rarityOrder: Record<ItemRarity, number> = {
    仙品: 5,
    传说: 4,
    稀有: 3,
    普通: 2,
    Mythic: 5,
    Legendary: 4,
    Rare: 3,
    Common: 2,
  };
  return rarityOrder[rarity || '普通'];
};

/**
 * 获取稀有度的显示名称
 */
export const getRarityDisplayName = (rarity: ItemRarity | undefined): string => {
  switch (rarity) {
    case '稀有':
      return 'Rare';
    case '传说':
      return 'Legendary';
    case '仙品':
      return 'Mythic';
    default:
      return 'Common';
  }
};

/**
 * 稀有度别名映射（兼容英文和别称）
 */
const rarityAliasMap: Record<string, ItemRarity> = {
  rare: '稀有',
  common: '普通',
  normal: '普通',
  legend: '传说',
  legendary: '传说',
  mythic: '仙品',
  immortal: '仙品',
};

/**
 * 规范化稀有度值（将英文/别称转换为标准中文）
 * 用于统一显示，兼容AI可能返回的英文稀有度
 */
export const normalizeRarityValue = (rarity?: ItemRarity | string): ItemRarity => {
  if (!rarity) return '普通';
  const key = String(rarity).toLowerCase();
  return rarityAliasMap[key] || (rarity as ItemRarity);
};
