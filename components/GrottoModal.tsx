import React, { useState, useMemo, useEffect } from 'react';
import { X, Home, ArrowUp, Sprout, Package, Coins, Zap, Clock, CheckCircle, AlertCircle, BookOpen, Sparkles, Gauge } from 'lucide-react';
import { PlayerStats, ItemRarity } from '../types';
import { GROTTO_CONFIGS, PLANTABLE_HERBS, REALM_ORDER, SPIRIT_ARRAY_ENHANCEMENTS, SPEEDUP_CONFIG, HERBARIUM_REWARDS } from '../constants/index';
import { getRarityTextColor } from '../utils/rarityUtils';
import { formatGrottoTime } from '../utils/formatUtils';
import { ItemType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onUpgradeGrotto: (level: number) => void;
  onPlantHerb: (herbId: string) => void;
  onHarvestHerb: (index: number) => void;
  onHarvestAll: () => void;
  onEnhanceSpiritArray: (enhancementId: string) => void;
  onToggleAutoHarvest: () => void;
  onSpeedupHerb: (index: number) => void;
}

/**
 * 计算进度百分比（0-100）
 */
const calculateProgress = (plantTime: number, harvestTime: number): number => {
  const now = Date.now();
  if (now >= harvestTime) return 100;
  if (now <= plantTime) return 0;

  const total = harvestTime - plantTime;
  const elapsed = now - plantTime;
  return Math.min(100, Math.max(0, Math.floor((elapsed / total) * 100)));
};

const GrottoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onUpgradeGrotto,
  onPlantHerb,
  onHarvestHerb,
  onHarvestAll,
  onEnhanceSpiritArray,
  onToggleAutoHarvest,
  onSpeedupHerb,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'upgrade' | 'plant' | 'enhancement' | 'herbarium'>('overview');
  const [timeUpdateKey, setTimeUpdateKey] = useState(0);

  // 安全的 grotto 对象，如果不存在则使用默认值
  const grotto = useMemo(() => {
    return player.grotto || {
      level: 0,
      expRateBonus: 0,
      autoHarvest: false,
      growthSpeedBonus: 0,
      plantedHerbs: [],
      lastHarvestTime: null,
      spiritArrayEnhancement: 0,
    };
  }, [player.grotto]);

  const currentConfig = useMemo(() => {
    if (grotto.level === 0) return null;
    return GROTTO_CONFIGS.find((c) => c.level === grotto.level);
  }, [grotto.level]);

  // 计算可收获的灵草数量
  const matureHerbsCount = useMemo(() => {
    const now = Date.now();
    return grotto.plantedHerbs.filter((herb) => now >= herb.harvestTime).length;
  }, [grotto.plantedHerbs, timeUpdateKey]);

  // 定时更新显示时间（每分钟更新一次）
  useEffect(() => {
    if (!isOpen || activeTab !== 'overview' && activeTab !== 'plant') return;

    const interval = setInterval(() => {
      setTimeUpdateKey((prev) => prev + 1);
    }, 60000); // 每分钟更新一次

    return () => clearInterval(interval);
  }, [isOpen, activeTab]);

  // 获取可升级的洞府列表
  const availableUpgrades = useMemo(() => {
    const currentLevel = grotto.level;
    const playerRealmIndex = REALM_ORDER.indexOf(player.realm);
    return GROTTO_CONFIGS.filter((config) => {
      if (config.level <= currentLevel) return false;
      if (config.realmRequirement) {
        const requiredIndex = REALM_ORDER.indexOf(config.realmRequirement);
        return playerRealmIndex >= requiredIndex;
      }
      return true;
    });
  }, [grotto.level, player.realm]);

  // 获取可种植的灵草（显示所有可能的草药，包括背包中没有的）
  const availableHerbs = useMemo(() => {
    // 获取背包中所有草药（包括数量为0的，用于显示曾经获得过的草药）
    // 严格过滤：只包含草药类型，排除丹药等其他类型
    const allInventoryHerbs = player.inventory.filter(
      (item) => item.type === ItemType.Herb
    );

    // 创建草药列表，优先使用 PLANTABLE_HERBS 中的配置，否则使用默认配置
    const herbMap = new Map<string, typeof PLANTABLE_HERBS[0]>();

    // 先添加 PLANTABLE_HERBS 中定义的所有草药（显示所有可种植的草药）
    PLANTABLE_HERBS.forEach((herb) => {
      herbMap.set(herb.name, herb);
    });

    // 添加背包中其他未定义的草药（使用默认配置，包括数量为0的）
    allInventoryHerbs.forEach((item) => {
      if (!herbMap.has(item.name)) {
        // 根据稀有度设置默认配置
        const rarity = item.rarity || '普通';
        const rarityConfigs: Record<string, { growthTime: number; harvestQuantity: { min: number; max: number }; grottoLevelRequirement: number }> = {
          '普通': { growthTime: 30 * 60 * 1000, harvestQuantity: { min: 2, max: 5 }, grottoLevelRequirement: 1 },
          '稀有': { growthTime: 3 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 3 }, grottoLevelRequirement: 3 },
          '传说': { growthTime: 8 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, grottoLevelRequirement: 5 },
          '仙品': { growthTime: 18 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, grottoLevelRequirement: 6 },
        };
        const config = rarityConfigs[rarity];
        herbMap.set(item.name, {
          id: `herb-${item.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: item.name,
          growthTime: config.growthTime,
          harvestQuantity: config.harvestQuantity,
          rarity: rarity as ItemRarity,
          grottoLevelRequirement: config.grottoLevelRequirement,
        });
      }
    });

    // 返回所有草药（包括背包中没有的），并按照可种植状态排序
    const allHerbs = Array.from(herbMap.values());

    // 获取当前洞府信息用于排序
    const grotto = player.grotto || {
      level: 0,
      expRateBonus: 0,
      autoHarvest: false,
      growthSpeedBonus: 0,
      plantedHerbs: [],
      lastHarvestTime: null,
      spiritArrayEnhancement: 0,
    };
    const currentConfig = GROTTO_CONFIGS.find((c) => c.level === grotto.level);
    const maxHerbSlots = currentConfig?.maxHerbSlots || 0;
    const isFull = grotto.plantedHerbs.length >= maxHerbSlots;

    // 排序：可种植的排在前面
    return allHerbs.sort((a, b) => {
      // 获取每个草药的种子信息
      const seedItemA = player.inventory.find(
        (item) => item.name === a.name && item.type === ItemType.Herb
      );
      const seedItemB = player.inventory.find(
        (item) => item.name === b.name && item.type === ItemType.Herb
      );

      // 计算每个草药的可种植状态
      const levelMetA = grotto.level >= (a.grottoLevelRequirement || 1);
      const levelMetB = grotto.level >= (b.grottoLevelRequirement || 1);
      const hasSeedA = seedItemA && seedItemA.quantity > 0;
      const hasSeedB = seedItemB && seedItemB.quantity > 0;
      const canPlantA = !isFull && hasSeedA && levelMetA;
      const canPlantB = !isFull && hasSeedB && levelMetB;

      // 优先级排序：
      // 1. 可以种植的（canPlant = true）
      // 2. 有种子但等级不够的（hasSeed && !levelMet）
      // 3. 有种子但槽位已满的（hasSeed && isFull）
      // 4. 没有种子的（!hasSeed）

      if (canPlantA && !canPlantB) return -1;
      if (!canPlantA && canPlantB) return 1;

      // 如果都是可种植或都不可种植，继续比较其他条件
      if (hasSeedA && !hasSeedB) return -1;
      if (!hasSeedA && hasSeedB) return 1;

      // 如果都有种子或都没有种子，比较等级要求
      if (levelMetA && !levelMetB) return -1;
      if (!levelMetA && levelMetB) return 1;

      // Finally sort by name
      return a.name.localeCompare(b.name);
    });
  }, [player.inventory, player.grotto]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 border-2 border-stone-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-ink-900 p-4 border-b border-stone-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Home className="text-mystic-gold" size={24} />
            <h2 className="text-xl font-serif text-mystic-gold tracking-widest">BASE</h2>
            {grotto.level > 0 && (
              <span className="text-xs px-2 py-1 rounded bg-stone-700 text-stone-300 border border-stone-600">
                {currentConfig?.name || `Rank ${grotto.level}`}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors p-1 rounded hover:bg-stone-700"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-ink-900 border-b border-stone-700 flex gap-2 p-2 overflow-x-auto scrollbar-hide flex-shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded transition-colors whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${activeTab === 'overview'
              ? 'bg-mystic-gold text-stone-900 font-bold'
              : 'bg-ink-800 text-stone-300 hover:bg-stone-700'
              }`}
          >
            <Home size={16} />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('upgrade')}
            className={`px-4 py-2 rounded transition-colors whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${activeTab === 'upgrade'
              ? 'bg-mystic-gold text-stone-900 font-bold'
              : 'bg-ink-800 text-stone-300 hover:bg-stone-700'
              }`}
          >
            <ArrowUp size={16} />
            <span>Upgrade</span>
          </button>
          <button
            onClick={() => setActiveTab('plant')}
            className={`px-4 py-2 rounded transition-colors whitespace-nowrap flex items-center gap-2 relative flex-shrink-0 ${activeTab === 'plant'
              ? 'bg-mystic-gold text-stone-900 font-bold'
              : 'bg-ink-800 text-stone-300 hover:bg-stone-700'
              }`}
          >
            <Sprout size={16} />
            <span>Produce</span>
            {matureHerbsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {matureHerbsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('enhancement')}
            className={`px-4 py-2 rounded transition-colors whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${activeTab === 'enhancement'
              ? 'bg-mystic-gold text-stone-900 font-bold'
              : 'bg-ink-800 text-stone-300 hover:bg-stone-700'
              }`}
          >
            <Zap size={16} />
            <span>Reactor</span>
          </button>
          <button
            onClick={() => setActiveTab('herbarium')}
            className={`px-4 py-2 rounded transition-colors whitespace-nowrap flex items-center gap-2 flex-shrink-0 relative ${activeTab === 'herbarium'
              ? 'bg-mystic-gold text-stone-900 font-bold'
              : 'bg-ink-800 text-stone-300 hover:bg-stone-700'
              }`}
          >
            <BookOpen size={16} />
            <span>Index</span>
            {grotto.herbarium && grotto.herbarium.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {grotto.herbarium.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="modal-scroll-container modal-scroll-content p-6 min-h-0">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {grotto.level === 0 ? (
                <div className="text-center py-12">
                  <Home className="mx-auto text-stone-500 mb-4" size={64} />
                  <p className="text-stone-300 text-lg mb-2 font-bold">You don't have a Base yet</p>
                  <p className="text-stone-400 text-sm mb-6 max-w-md mx-auto">
                    Acquiring a Base provides Reactor XP bonuses, supply production, and growth rate enhancements.
                  </p>
                  <button
                    onClick={() => setActiveTab('upgrade')}
                    className="px-6 py-3 bg-mystic-gold text-stone-900 font-bold rounded hover:bg-yellow-600 transition-colors shadow-lg"
                  >
                    Acquire
                  </button>
                </div>
              ) : (
                <>
                  {/* 洞府信息卡片 */}
                  <div className="bg-ink-900 p-5 rounded-lg border border-stone-700 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-stone-200">
                          {currentConfig?.name || 'Unknown Base'}
                        </h3>
                        <p className="text-stone-400 text-sm mt-1">{currentConfig?.description}</p>
                      </div>
                      <span className="text-stone-200 text-sm bg-mystic-gold/20 px-3 py-1 rounded border border-mystic-gold/50 font-bold">
                        Lv.{grotto.level}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50 hover:border-mystic-gold/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="text-mystic-gold" size={18} />
                          <span className="text-stone-400 text-xs font-medium">XP Bonus</span>
                        </div>
                        <p className="text-2xl font-bold text-mystic-gold">
                          +{((grotto.expRateBonus + (grotto.spiritArrayEnhancement || 0)) * 100).toFixed(0)}%
                        </p>
                        {grotto.spiritArrayEnhancement > 0 && (
                          <p className="text-xs text-stone-500 mt-1">
                            Base +{(grotto.expRateBonus * 100).toFixed(0)}% | Specs +{((grotto.spiritArrayEnhancement || 0) * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                      <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50 hover:border-green-400/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Sprout className="text-green-400" size={18} />
                          <span className="text-stone-400 text-xs font-medium">Growth Rate</span>
                        </div>
                        <p className="text-2xl font-bold text-green-400">
                          +{(grotto.growthSpeedBonus * 100).toFixed(0)}%
                        </p>
                        <p className="text-xs text-stone-500 mt-1">Cycle Reduction</p>
                      </div>
                      <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50 hover:border-blue-400/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="text-blue-400" size={18} />
                          <span className="text-stone-400 text-xs font-medium">Slots</span>
                        </div>
                        <p className="text-2xl font-bold text-stone-200">
                          {grotto.plantedHerbs.length} / {currentConfig?.maxHerbSlots || 0}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          {grotto.plantedHerbs.length >= (currentConfig?.maxHerbSlots || 0) ? 'Full' : 'Available'}
                        </p>
                      </div>
                      <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50 hover:border-purple-400/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="text-purple-400" size={18} />
                          <span className="text-stone-400 text-xs font-medium">Index Progress</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-400">
                          {grotto.herbarium?.length || 0} / {PLANTABLE_HERBS.length}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          {PLANTABLE_HERBS.length > 0 ? Math.floor(((grotto.herbarium?.length || 0) / PLANTABLE_HERBS.length) * 100) : 0}% Complete
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 自动收获开关 */}
                  {currentConfig?.autoHarvest && (
                    <div className="bg-ink-900 p-4 rounded-lg border border-stone-700 shadow-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${grotto.autoHarvest ? 'bg-green-900/30 border-2 border-green-500' : 'bg-stone-800 border-2 border-stone-700'}`}>
                            <Zap className={grotto.autoHarvest ? 'text-green-400' : 'text-stone-500'} size={20} />
                          </div>
                          <div>
                            <p className="text-stone-200 font-bold flex items-center gap-2">
                              Auto-Gather
                              {grotto.autoHarvest && (
                                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Active</span>
                              )}
                            </p>
                            <p className="text-stone-400 text-sm mt-0.5">
                              {grotto.autoHarvest ? 'Supplies will be automatically collected when ready' : 'Requires manual collection'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={onToggleAutoHarvest}
                          className={`px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg ${grotto.autoHarvest
                            ? 'bg-green-600 text-white hover:bg-green-700 border-2 border-green-500'
                            : 'bg-stone-700 text-stone-300 hover:bg-stone-600 border-2 border-stone-600'
                            }`}
                        >
                          {grotto.autoHarvest ? '✓ ON' : '○ OFF'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 种植的灵草 */}
                  {grotto.plantedHerbs.length > 0 && (
                    <div className="bg-ink-900 p-5 rounded-lg border border-stone-700 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                          <Sprout size={20} />
                          Active Production
                          {matureHerbsCount > 0 && (
                            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                              {matureHerbsCount} Ready
                            </span>
                          )}
                        </h3>
                        {matureHerbsCount > 0 && (
                          <button
                            onClick={onHarvestAll}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-bold flex items-center gap-2 shadow-lg border-2 border-green-500"
                          >
                            <CheckCircle size={16} />
                            Gather All
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {grotto.plantedHerbs.map((herb, index) => {
                          const now = Date.now();
                          const isMature = now >= herb.harvestTime;
                          const remaining = Math.max(0, herb.harvestTime - now);
                          const progress = calculateProgress(herb.plantTime, herb.harvestTime);

                          return (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border-2 transition-all ${isMature
                                ? 'bg-green-900/30 border-green-500 shadow-lg ring-2 ring-green-500/30'
                                : 'bg-stone-800/50 border-stone-700 hover:border-stone-600'
                                }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-stone-200 text-lg">{herb.herbName}</span>
                                    {herb.isMutated && (
                                      <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                                        <Sparkles size={12} />
                                        Mutant
                                      </span>
                                    )}
                                    <span className="text-stone-400 text-sm bg-stone-700 px-2 py-0.5 rounded">
                                      x{herb.isMutated && herb.mutationBonus ? Math.floor(herb.quantity * herb.mutationBonus) : herb.quantity}
                                    </span>
                                    {isMature && (
                                      <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded flex items-center gap-1">
                                        <CheckCircle size={12} />
                                        Ready
                                      </span>
                                    )}
                                  </div>

                                  {!isMature && (
                                    <div className="mb-3">
                                      <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="flex items-center gap-1.5 text-stone-300">
                                          <Clock size={14} className="text-blue-400" />
                                          <span>Time Left</span>
                                        </span>
                                        <span className="font-bold text-mystic-gold">{formatGrottoTime(remaining)}</span>
                                      </div>
                                      <div className="w-full bg-stone-700/50 rounded-full h-2.5 overflow-hidden border border-stone-600">
                                        <div
                                          className="bg-gradient-to-r from-mystic-gold to-yellow-500 h-full transition-all duration-1000 shadow-lg"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between mt-1.5">
                                        <p className="text-xs text-stone-500">Growth Progress</p>
                                        <p className="text-xs font-bold text-mystic-gold">{progress}%</p>
                                      </div>
                                    </div>
                                  )}

                                  {isMature && (
                                    <p className="text-sm text-green-300 flex items-center gap-1">
                                      <CheckCircle size={14} />
                                      Mature! Ready for collection.
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {!isMature && (
                                    <button
                                      onClick={() => onSpeedupHerb(index)}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-bold flex items-center gap-1.5 shadow-lg border-2 border-blue-500"
                                      title="Speed up with Caps"
                                    >
                                      <Gauge size={14} />
                                      Speed
                                    </button>
                                  )}
                                  {isMature && (
                                    <button
                                      onClick={() => onHarvestHerb(index)}
                                      className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-bold shadow-lg border-2 border-green-500"
                                    >
                                      <CheckCircle size={14} className="inline mr-1" />
                                      Gather
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {grotto.plantedHerbs.length === 0 && (
                    <div className="bg-ink-900 p-8 rounded-lg border border-stone-700 text-center">
                      <Sprout className="mx-auto text-stone-500 mb-3" size={48} />
                      <p className="text-stone-400">No active production.</p>
                      <p className="text-stone-500 text-sm mt-2">Head to 'Produce' to start growing supplies.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'upgrade' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-200 mb-4 flex items-center gap-2">
                <ArrowUp size={20} />
                Acquire/Upgrade Base
              </h3>
              {availableUpgrades.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="mx-auto text-stone-500 mb-4" size={48} />
                  <p className="text-stone-400">
                    {grotto.level === 0
                      ? 'No bases currently available.'
                      : '🎉 Max upgrade level reached!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableUpgrades.map((config) => {
                    const canAfford = player.spiritStones >= config.cost;
                    const shortage = config.cost - player.spiritStones;

                    return (
                      <div
                        key={config.level}
                        className={`bg-ink-900 p-5 rounded-lg border-2 shadow-lg transition-all ${canAfford
                          ? 'border-stone-700 hover:border-mystic-gold hover:shadow-mystic-gold/20'
                          : 'border-stone-700/50 opacity-75'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-4 gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-xl font-bold text-stone-200">
                                {config.name}
                              </h4>
                              <span className="text-stone-400 text-sm bg-stone-800 px-2 py-1 rounded border border-stone-700">
                                Rank {config.level}
                              </span>
                            </div>
                            <p className="text-stone-400 text-sm mb-4">{config.description}</p>

                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div className="bg-stone-800 p-3 rounded border border-stone-700">
                                <span className="text-stone-400 block mb-1">XP Bonus</span>
                                <span className="text-mystic-gold font-bold text-lg">
                                  +{(config.expRateBonus * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="bg-stone-800 p-3 rounded border border-stone-700">
                                <span className="text-stone-400 block mb-1">Growth Rate</span>
                                <span className="text-green-400 font-bold text-lg">
                                  +{(config.growthSpeedBonus * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="bg-stone-800 p-3 rounded border border-stone-700">
                                <span className="text-stone-400 block mb-1">Supply Slots</span>
                                <span className="text-stone-200 font-bold text-lg">{config.maxHerbSlots}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => onUpgradeGrotto(config.level)}
                              disabled={!canAfford}
                              className={`px-6 py-3 rounded font-bold transition-colors flex items-center gap-2 shadow-lg ${canAfford
                                ? 'bg-mystic-gold text-stone-900 hover:bg-yellow-600'
                                : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                                }`}
                            >
                              <Coins size={20} />
                              <span>{config.cost.toLocaleString()}</span>
                            </button>
                            {!canAfford && (
                              <p className="text-xs text-red-400 text-right">
                                Needs {shortage.toLocaleString()} Caps
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'plant' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                  <Sprout size={20} />
                  Produce Supplies
                </h3>
                {grotto.level > 0 && (
                  <div className="text-stone-400 text-sm bg-stone-800 px-3 py-1 rounded border border-stone-700">
                    Slots: {grotto.plantedHerbs.length} / {currentConfig?.maxHerbSlots || 0}
                  </div>
                )}
              </div>

              {grotto.level === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto text-stone-500 mb-4" size={48} />
                  <p className="text-stone-400 mb-2">Acquire a base to start production.</p>
                  <button
                    onClick={() => setActiveTab('upgrade')}
                    className="px-4 py-2 bg-mystic-gold text-stone-900 font-bold rounded hover:bg-yellow-600 transition-colors mt-4"
                  >
                    Acquire
                  </button>
                </div>
              ) : availableHerbs.length === 0 ? (
                <div className="text-center py-12">
                  <Sprout className="mx-auto text-stone-500 mb-4" size={48} />
                  <p className="text-stone-400">No plantable components in inventory.</p>
                  <p className="text-stone-500 text-sm mt-2">Acquire seeds via scavenging or trade.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableHerbs.map((herb) => {
                    // 严格查找：名称和类型都必须匹配，必须是草药类型，排除丹药
                    const seedItem = player.inventory.find(
                      (item) => item.name === herb.name && item.type === ItemType.Herb
                    );
                    const isFull = grotto.plantedHerbs.length >= (currentConfig?.maxHerbSlots || 0);
                    const levelRequirementMet = grotto.level >= (herb.grottoLevelRequirement || 1);
                    const canPlant = !isFull && seedItem && seedItem.quantity > 0 && levelRequirementMet;

                    const growthMinutes = Math.floor(herb.growthTime / 60000);
                    const growthHours = Math.floor(growthMinutes / 60);
                    const growthMins = growthMinutes % 60;
                    const timeText = growthHours > 0
                      ? `${growthHours}h ${growthMins}m`
                      : `${growthMinutes}m`;

                    return (
                      <div
                        key={herb.id}
                        className={`bg-ink-900 p-4 rounded-lg border-2 transition-all ${canPlant
                          ? 'border-stone-700 hover:border-green-500 shadow-lg hover:shadow-green-500/20'
                          : 'border-stone-700/50 opacity-75'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-3 gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="font-bold text-lg"
                                style={{ color: getRarityTextColor(herb.rarity) }}
                              >
                                {herb.name}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
                                {herb.rarity}
                              </span>
                            </div>

                            <div className="space-y-1 text-sm text-stone-400 mb-3">
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>Cycle: {timeText}</span>
                              </div>
                              <div>
                                Yield: {herb.harvestQuantity.min}-{herb.harvestQuantity.max} units
                              </div>
                              {herb.grottoLevelRequirement && (
                                <div className={`text-xs ${levelRequirementMet ? 'text-green-400' : 'text-red-400'}`}>
                                  {levelRequirementMet ? '✓' : '✗'} Needs Base Rank {herb.grottoLevelRequirement}
                                </div>
                              )}
                            </div>

                            <div className={`text-xs ${(!seedItem || seedItem.quantity === 0) ? 'text-red-400' : 'text-stone-500'}`}>
                              Seeds: <span className={`font-bold ${(!seedItem || seedItem.quantity === 0) ? 'text-red-300' : 'text-stone-300'}`}>{seedItem?.quantity || 0}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => onPlantHerb(herb.id || herb.name)}
                            disabled={!canPlant}
                            className={`px-5 py-2.5 rounded-lg font-bold transition-all flex-shrink-0 ${canPlant
                              ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg border-2 border-green-500'
                              : 'bg-stone-700 text-stone-500 cursor-not-allowed border-2 border-stone-600'
                              }`}
                          >
                            {(!seedItem || seedItem.quantity < 1)
                              ? 'Low Seeds'
                              : !levelRequirementMet
                                ? `Need Lv.${herb.grottoLevelRequirement}`
                                : isFull
                                  ? 'Slots Full'
                                  : '✓ Grow'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'enhancement' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-stone-200 mb-4 flex items-center gap-2">
                <Zap size={20} />
                Reactor Overhaul
              </h3>
              {grotto.level === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto text-stone-500 mb-4" size={48} />
                  <p className="text-stone-400 mb-2">Acquire a base to start overhaul.</p>
                  <button
                    onClick={() => setActiveTab('upgrade')}
                    className="px-4 py-2 bg-mystic-gold text-stone-900 font-bold rounded hover:bg-yellow-600 transition-colors mt-4"
                  >
                    Acquire
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-ink-900 p-5 rounded-lg border border-stone-700 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-lg bg-mystic-gold/20 border-2 border-mystic-gold/50">
                        <Zap className="text-mystic-gold" size={24} />
                      </div>
                      <div className="flex-1">
                        <span className="text-stone-200 font-bold text-lg block">Current Overhaul Bonus</span>
                        <p className="text-3xl font-bold text-mystic-gold mt-1">
                          +{((grotto.spiritArrayEnhancement || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <div className="bg-stone-800/50 p-3 rounded-lg border border-stone-700/50">
                      <p className="text-stone-400 text-sm">
                        <span className="text-stone-300">Base Bonus:</span> +{(grotto.expRateBonus * 100).toFixed(0)}% |{' '}
                        <span className="text-mystic-gold font-bold">Total Bonus:</span> +{((grotto.expRateBonus + (grotto.spiritArrayEnhancement || 0)) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {SPIRIT_ARRAY_ENHANCEMENTS.map((enhancement) => {
                      const meetsLevelRequirement = grotto.level >= enhancement.grottoLevelRequirement;
                      const hasMaterials = enhancement.materials.every((material) => {
                        const item = player.inventory.find((i) => i.name === material.name);
                        return item && item.quantity >= material.quantity;
                      });
                      const canEnhance = meetsLevelRequirement && hasMaterials;

                      return (
                        <div
                          key={enhancement.id}
                          className={`bg-ink-900 p-5 rounded-lg border-2 transition-all ${canEnhance
                            ? 'border-stone-700 hover:border-mystic-gold shadow-lg hover:shadow-mystic-gold/20'
                            : 'border-stone-700/50 opacity-75'
                            }`}
                        >
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-stone-200 text-lg">{enhancement.name}</span>
                              <span className="text-xs text-stone-500 bg-stone-800 px-2 py-1 rounded border border-stone-700">
                                Needs Base Rank {enhancement.grottoLevelRequirement}
                              </span>
                            </div>
                            <p className="text-stone-400 text-sm mb-4">{enhancement.description}</p>

                            <div className="bg-stone-800 p-4 rounded-lg border border-stone-700 mb-4">
                              <div className="text-stone-300 text-base mb-3 font-bold flex items-center gap-2">
                                <Zap size={18} className="text-mystic-gold" />
                                Bonus: +{(enhancement.expRateBonus * 100).toFixed(0)}% XP Rate
                              </div>
                              <div className="text-stone-400 text-sm mb-2 font-medium">Required Materials:</div>
                              <div className="flex flex-wrap gap-2">
                                {enhancement.materials.map((material, idx) => {
                                  const item = player.inventory.find((i) => i.name === material.name);
                                  const hasEnough = item && item.quantity >= material.quantity;
                                  return (
                                    <span
                                      key={idx}
                                      className={`text-sm px-3 py-1.5 rounded border ${hasEnough
                                        ? 'bg-green-900/50 text-green-300 border-green-700'
                                        : 'bg-red-900/50 text-red-300 border-red-700'
                                        }`}
                                    >
                                      {material.name} x{material.quantity}
                                      {item && ` (Held: ${item.quantity})`}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => onEnhanceSpiritArray(enhancement.id)}
                            disabled={!canEnhance}
                            className={`w-full px-4 py-3 rounded-lg font-bold transition-all ${canEnhance
                              ? 'bg-mystic-gold text-stone-900 hover:bg-yellow-600 shadow-lg border-2 border-yellow-500'
                              : 'bg-stone-700 text-stone-500 cursor-not-allowed border-2 border-stone-600'
                              }`}
                          >
                            {!meetsLevelRequirement
                              ? `Needs Base Rank ${enhancement.grottoLevelRequirement}`
                              : !hasMaterials
                                ? 'Low Materials'
                                : '✓ Install Overhaul'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'herbarium' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-stone-200 mb-4 flex items-center gap-2">
                <BookOpen size={20} />
                Supplies Database
              </h3>

              {/* Database Statistics */}
              <div className="bg-ink-900 p-5 rounded-lg border border-stone-700 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50 hover:border-purple-400/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="text-purple-400" size={18} />
                      <div className="text-stone-400 text-xs font-medium">Collected</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                      {grotto.herbarium?.length || 0} / {PLANTABLE_HERBS.length}
                    </div>
                  </div>
                  <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50 hover:border-mystic-gold/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="text-mystic-gold" size={18} />
                      <div className="text-stone-400 text-xs font-medium">Progress</div>
                    </div>
                    <div className="text-2xl font-bold text-mystic-gold">
                      {PLANTABLE_HERBS.length > 0 ? Math.floor(((grotto.herbarium?.length || 0) / PLANTABLE_HERBS.length) * 100) : 0}%
                    </div>
                  </div>
                  <div className="bg-stone-800/50 p-4 rounded-lg border border-stone-700/50 hover:border-blue-400/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-blue-400" size={18} />
                      <div className="text-stone-400 text-xs font-medium">Today's Speeds</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                      {(() => {
                        const today = new Date().toISOString().split('T')[0];
                        const lastReset = grotto.lastSpeedupResetDate || today;
                        return lastReset === today ? (grotto.dailySpeedupCount || 0) : 0;
                      })()} / {SPEEDUP_CONFIG.dailyLimit}
                    </div>
                  </div>
                </div>

                {/* 图鉴奖励进度 */}
                {HERBARIUM_REWARDS.map((reward) => {
                  const isClaimed = player.achievements.includes(`herbarium-${reward.herbCount}`);
                  const isUnlocked = (grotto.herbarium?.length || 0) >= reward.herbCount;
                  return (
                    <div
                      key={reward.herbCount}
                      className={`p-3 rounded-lg border mb-2 ${isClaimed
                        ? 'bg-green-900/30 border-green-600'
                        : isUnlocked
                          ? 'bg-yellow-900/30 border-yellow-600'
                          : 'bg-stone-800 border-stone-700'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-stone-200 font-bold">
                            Collect {reward.herbCount} types
                            {isClaimed && <span className="ml-2 text-green-400 text-sm">✓ Claimed</span>}
                            {!isClaimed && isUnlocked && <span className="ml-2 text-yellow-400 text-sm">Available</span>}
                          </div>
                          <div className="text-stone-400 text-sm mt-1">
                            Reward:{' '}
                            {reward.reward.exp && `${reward.reward.exp} Data `}
                            {reward.reward.spiritStones && `${reward.reward.spiritStones} Caps `}
                            {reward.reward.attributePoints && `${reward.reward.attributePoints} Special Points `}
                            {reward.reward.title && `Title: ${reward.reward.title}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 灵草列表 */}
              <div className="bg-ink-900 p-5 rounded-lg border border-stone-700">
                <h4 className="text-stone-200 font-bold mb-4">Logged Supplies</h4>
                {grotto.herbarium && grotto.herbarium.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PLANTABLE_HERBS.map((herb) => {
                      const isCollected = grotto.herbarium?.includes(herb.name);
                      return (
                        <div
                          key={herb.id}
                          className={`p-3 rounded-lg border text-center ${isCollected
                            ? 'bg-stone-800 border-stone-600'
                            : 'bg-stone-900/50 border-stone-800 opacity-50'
                            }`}
                        >
                          <div
                            className={`font-bold text-sm mb-1 ${isCollected ? getRarityTextColor(herb.rarity) : 'text-stone-600'
                              }`}
                          >
                            {herb.name}
                          </div>
                          <div className="text-xs text-stone-500">{herb.rarity}</div>
                          {isCollected && (
                            <div className="mt-2">
                              <CheckCircle className="mx-auto text-green-400" size={16} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto text-stone-500 mb-3" size={48} />
                    <p className="text-stone-400">No supplies logged yet.</p>
                    <p className="text-stone-500 text-sm mt-2">Produce and harvest supplies to log them here.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrottoModal;
