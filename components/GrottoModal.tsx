import React, { useState, useMemo, useEffect } from 'react';
import { X, Home, ArrowUp, Sprout, Package, Coins, Zap, Clock, CheckCircle, AlertCircle, BookOpen, Sparkles, Gauge } from 'lucide-react';
import { PlayerStats, ItemRarity } from '../types';
import { ASSETS } from '../constants/assets';
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
 * Calculate progress percentage (0-100)
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

  // Safe grotto object, use default values if it doesn't exist
  const grotto = useMemo(() => {
    return player.grotto || {
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
    };
  }, [player.grotto]);

  const currentConfig = useMemo(() => {
    if (grotto.level === 0) return null;
    return GROTTO_CONFIGS.find((c) => c.level === grotto.level);
  }, [grotto.level]);

  // Calculate the number of harvestable herbs
  const matureHerbsCount = useMemo(() => {
    const now = Date.now();
    return grotto.plantedHerbs.filter((herb) => herb && herb.harvestTime && now >= herb.harvestTime).length;
  }, [grotto.plantedHerbs, timeUpdateKey]);

  // Regularly update display time (once per minute)
  useEffect(() => {
    if (!isOpen || activeTab !== 'overview' && activeTab !== 'plant') return;

    const interval = setInterval(() => {
      setTimeUpdateKey((prev) => prev + 1);
    }, 60000); // Update once per minute

    return () => clearInterval(interval);
  }, [isOpen, activeTab]);

  // Get list of upgradable bases
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

  // Get plantable herbs (show all possible herbs, including those not in the inventory)
  const availableHerbs = useMemo(() => {
    // Get all herbs in inventory (including those with quantity 0, for showing previously obtained herbs)
    // Strict filtering: only include herb type, exclude pills and other types
    const allInventoryHerbs = player.inventory.filter(
      (item) => item.type === ItemType.Herb
    );

    // Create herb list, priority use configurations in PLANTABLE_HERBS, otherwise use default configuration
    const herbMap = new Map<string, typeof PLANTABLE_HERBS[0]>();

    // Add all herbs defined in PLANTABLE_HERBS first (show all plantable herbs)
    PLANTABLE_HERBS.forEach((herb) => {
      herbMap.set(herb.name, herb);
    });

    // Add other undefined herbs in inventory (use default configuration, including those with quantity 0)
    allInventoryHerbs.forEach((item) => {
      if (!herbMap.has(item.name)) {
        // Set default configuration based on rarity
        const rarity = item.rarity || 'Common';
        const rarityConfigs: Record<string, { growthTime: number; harvestQuantity: { min: number; max: number }; grottoLevelRequirement: number }> = {
          'Common': { growthTime: 30 * 60 * 1000, harvestQuantity: { min: 2, max: 5 }, grottoLevelRequirement: 1 },
          'Rare': { growthTime: 3 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 3 }, grottoLevelRequirement: 3 },
          'Legendary': { growthTime: 8 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, grottoLevelRequirement: 5 },
          'Mythic': { growthTime: 18 * 60 * 60 * 1000, harvestQuantity: { min: 1, max: 2 }, grottoLevelRequirement: 6 },
        };
        const config = rarityConfigs[rarity] || rarityConfigs['Common'];
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

    // Return all herbs (including those not in inventory), and sort by plantable status
    const allHerbs = Array.from(herbMap.values());

    // Get current base info for sorting
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

    // Sort: plantable ones first
    return allHerbs.sort((a, b) => {
      // Get seed info for each herb
      const seedItemA = player.inventory.find(
        (item) => item.name === a.name && item.type === ItemType.Herb
      );
      const seedItemB = player.inventory.find(
        (item) => item.name === b.name && item.type === ItemType.Herb
      );

      // Calculate plantable status for each herb
      const levelMetA = grotto.level >= (a.grottoLevelRequirement || 1);
      const levelMetB = grotto.level >= (b.grottoLevelRequirement || 1);
      const hasSeedA = seedItemA && seedItemA.quantity > 0;
      const hasSeedB = seedItemB && seedItemB.quantity > 0;
      const canPlantA = !isFull && hasSeedA && levelMetA;
      const canPlantB = !isFull && hasSeedB && levelMetB;

      // Priority sort:
      // 1. Plantable (canPlant = true)
      // 2. Has seed but level not met (hasSeed && !levelMet)
      // 3. Has seed but slot is full (hasSeed && isFull)
      // 4. No seed (!hasSeed)

      if (canPlantA && !canPlantB) return -1;
      if (!canPlantA && canPlantB) return 1;

      // If both are plantable or both are not, continue to compare other conditions
      if (hasSeedA && !hasSeedB) return -1;
      if (!hasSeedA && hasSeedB) return 1;

      // If both have seeds or neither have seeds, compare level requirement
      if (levelMetA && !levelMetB) return -1;
      if (!levelMetA && levelMetB) return 1;

      // Finally sort by name
      return a.name.localeCompare(b.name);
    });
  }, [player.inventory, player.grotto]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 border border-stone-800 md:rounded-none shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Texture Layer */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
        {/* CRT Scanline Effect */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>

        {/* Header */}
        <div className="bg-stone-950 p-4 border-b border-stone-800 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <Home className="text-amber-400" size={24} />
            <h2 className="text-xl font-serif text-amber-400 tracking-widest font-bold">BASE</h2>
            {grotto.level > 0 && (
              <span className="text-xs px-2 py-1 rounded-none bg-stone-900 text-stone-300 border border-stone-800">
                {currentConfig?.name || `Rank ${grotto.level}`}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 transition-colors p-1"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-stone-950 border-b border-stone-800 flex gap-0 p-0 overflow-x-auto scrollbar-hide flex-shrink-0 z-10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 transition-colors whitespace-nowrap flex items-center gap-2 flex-shrink-0 font-bold border-r border-stone-800 ${activeTab === 'overview'
              ? 'bg-ink-950 text-amber-400 border-b-2 border-b-amber-500'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
          >
            <Home size={16} />
            <span>OVERVIEW</span>
          </button>
          <button
            onClick={() => setActiveTab('upgrade')}
            className={`px-6 py-3 transition-colors whitespace-nowrap flex items-center gap-2 flex-shrink-0 font-bold border-r border-stone-800 ${activeTab === 'upgrade'
              ? 'bg-ink-950 text-amber-400 border-b-2 border-b-amber-500'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
          >
            <ArrowUp size={16} />
            <span>UPGRADE</span>
          </button>
          <button
            onClick={() => setActiveTab('plant')}
            className={`px-6 py-3 transition-colors whitespace-nowrap flex items-center gap-2 relative flex-shrink-0 font-bold border-r border-stone-800 ${activeTab === 'plant'
              ? 'bg-ink-950 text-amber-400 border-b-2 border-b-amber-500'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
          >
            <Sprout size={16} />
            <span>PRODUCE</span>
            {matureHerbsCount > 0 && (
              <span className="absolute top-1 right-1 bg-green-600 text-white text-[10px] px-1 rounded-none">
                {matureHerbsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('enhancement')}
            className={`px-6 py-3 transition-colors whitespace-nowrap flex items-center gap-2 flex-shrink-0 font-bold border-r border-stone-800 ${activeTab === 'enhancement'
              ? 'bg-ink-950 text-amber-400 border-b-2 border-b-amber-500'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
          >
            <Zap size={16} />
            <span>REACTOR</span>
          </button>
          <button
            onClick={() => setActiveTab('herbarium')}
            className={`px-6 py-3 transition-colors whitespace-nowrap flex items-center gap-2 flex-shrink-0 relative font-bold ${activeTab === 'herbarium'
              ? 'bg-ink-950 text-amber-400 border-b-2 border-b-amber-500'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
          >
            <BookOpen size={16} />
            <span>INDEX</span>
            {grotto.herbarium && grotto.herbarium.length > 0 && (
              <span className="absolute top-1 right-1 bg-purple-600 text-white text-[10px] px-1 rounded-none">
                {grotto.herbarium.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="modal-scroll-container modal-scroll-content p-6 min-h-0 z-10">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {grotto.level === 0 ? (
                <div className="text-center py-12">
                  <Home className="mx-auto text-stone-500 mb-4" size={64} />
                  <p className="text-stone-300 text-lg mb-2 font-bold uppercase tracking-widest">You don't have a Base yet</p>
                  <p className="text-stone-400 text-sm mb-6 max-w-md mx-auto">
                    Acquiring a Base provides Reactor XP bonuses, supply production, and growth rate enhancements.
                  </p>
                  <button
                    onClick={() => setActiveTab('upgrade')}
                    className="px-6 py-3 bg-amber-500 text-ink-950 font-bold rounded-none hover:bg-amber-400 transition-all shadow-lg active:scale-95"
                  >
                    ACQUIRE BASE
                  </button>
                </div>
              ) : (
                <>
                  {/* Base Info Card */}
                  <div className="bg-stone-900/40 p-5 rounded-none border border-stone-800 shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-stone-200 uppercase tracking-wider">
                            {currentConfig?.name || 'Unknown Base'}
                          </h3>
                          <p className="text-stone-400 text-sm mt-1 uppercase tracking-tight">{currentConfig?.description}</p>
                        </div>
                        <span className="text-amber-400 text-sm bg-amber-500/10 px-3 py-1 rounded-none border border-amber-500/50 font-bold tracking-widest">
                          RANK {grotto.level}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-stone-950/40 p-4 rounded-none border border-stone-800 hover:border-amber-500/50 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="text-amber-400" size={18} />
                            <span className="text-stone-400 text-xs font-bold uppercase tracking-widest">XP Bonus</span>
                          </div>
                          <p className="text-2xl font-bold text-amber-400">
                            +{((grotto.expRateBonus + (grotto.spiritArrayEnhancement || 0)) * 100).toFixed(0)}%
                          </p>
                          {grotto.spiritArrayEnhancement > 0 && (
                            <p className="text-[10px] text-stone-500 mt-1 font-bold uppercase tracking-widest">
                              Base +{(grotto.expRateBonus * 100).toFixed(0)}% | Specs +{((grotto.spiritArrayEnhancement || 0) * 100).toFixed(0)}%
                            </p>
                          )}
                        </div>
                        <div className="bg-stone-950/40 p-4 rounded-none border border-stone-800 hover:border-green-400/50 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <Sprout className="text-green-400" size={18} />
                            <span className="text-stone-400 text-xs font-bold uppercase tracking-widest">Growth Rate</span>
                          </div>
                          <p className="text-2xl font-bold text-green-400">
                            +{(grotto.growthSpeedBonus * 100).toFixed(0)}%
                          </p>
                          <p className="text-[10px] text-stone-500 mt-1 font-bold uppercase tracking-widest">Cycle Reduction</p>
                        </div>
                        <div className="bg-stone-950/40 p-4 rounded-none border border-stone-800 hover:border-blue-400/50 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="text-blue-400" size={18} />
                            <span className="text-stone-400 text-xs font-bold uppercase tracking-widest">Slots</span>
                          </div>
                          <p className="text-2xl font-bold text-stone-200">
                            {grotto.plantedHerbs.length} / {currentConfig?.maxHerbSlots || 0}
                          </p>
                          <p className="text-[10px] text-stone-500 mt-1 font-bold uppercase tracking-widest">
                            {grotto.plantedHerbs.length >= (currentConfig?.maxHerbSlots || 0) ? 'FULL' : 'AVAILABLE'}
                          </p>
                        </div>
                        <div className="bg-stone-950/40 p-4 rounded-none border border-stone-800 hover:border-purple-400/50 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="text-purple-400" size={18} />
                            <span className="text-stone-400 text-xs font-bold uppercase tracking-widest">Index Progress</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-400">
                            {grotto.herbarium?.length || 0} / {PLANTABLE_HERBS.length}
                          </p>
                          <p className="text-[10px] text-stone-500 mt-1 font-bold uppercase tracking-widest">
                            {PLANTABLE_HERBS.length > 0 ? Math.floor(((grotto.herbarium?.length || 0) / PLANTABLE_HERBS.length) * 100) : 0}% COMPLETE
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Auto-Gather Toggle */}
                  {currentConfig?.autoHarvest && (
                    <div className="bg-stone-900/40 p-4 rounded-none border border-stone-800 shadow-lg relative overflow-hidden group">
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-none ${grotto.autoHarvest ? 'bg-green-950/30 border border-green-500' : 'bg-stone-950/40 border border-stone-800'}`}>
                            <Zap className={grotto.autoHarvest ? 'text-green-400' : 'text-stone-600'} size={20} />
                          </div>
                          <div>
                            <p className="text-stone-200 font-bold flex items-center gap-2 uppercase tracking-wider">
                              Auto-Gather
                              {grotto.autoHarvest && (
                                <span className="text-[10px] bg-green-600/20 text-green-400 px-2 py-0.5 rounded-none font-bold border border-green-500/50">ACTIVE</span>
                              )}
                            </p>
                            <p className="text-stone-400 text-[10px] mt-0.5 font-bold uppercase tracking-widest">
                              {grotto.autoHarvest ? 'Supplies will be automatically collected when ready' : 'Requires manual collection'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={onToggleAutoHarvest}
                          className={`px-5 py-2.5 rounded-none font-bold transition-all shadow-lg active:scale-95 uppercase tracking-widest text-xs ${grotto.autoHarvest
                            ? 'bg-green-900/20 text-green-400 hover:bg-green-900/40 border border-green-500/50'
                            : 'bg-stone-800/40 text-stone-500 hover:bg-stone-700/40 border border-stone-700'
                            }`}
                        >
                          {grotto.autoHarvest ? '[ ENABLED ]' : '[ DISABLED ]'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Active Production */}
                  {grotto.plantedHerbs.length > 0 && (
                    <div className="bg-stone-900/40 p-5 rounded-none border border-stone-800 shadow-lg relative overflow-hidden">
                      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-stone-200 flex items-center gap-2 uppercase tracking-wider">
                            <Sprout size={20} className="text-green-500" />
                            Active Production
                            {matureHerbsCount > 0 && (
                              <span className="text-[10px] bg-green-600/20 text-green-400 px-2 py-0.5 rounded-none font-bold border border-green-500/50 uppercase">
                                {matureHerbsCount} READY
                              </span>
                            )}
                          </h3>
                          {matureHerbsCount > 0 && (
                            <button
                              onClick={onHarvestAll}
                              className="px-4 py-2 bg-green-900/20 text-green-400 rounded-none hover:bg-green-900/40 transition-all text-xs font-bold flex items-center gap-2 shadow-lg border border-green-500/50 active:scale-95 uppercase tracking-widest"
                            >
                              <CheckCircle size={16} />
                              GATHER ALL
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {grotto.plantedHerbs.map((herb, index) => {
                            if (!herb) return null;
                            const now = Date.now();
                            const isMature = now >= herb.harvestTime;
                            const remaining = Math.max(0, herb.harvestTime - now);
                            const progress = calculateProgress(herb.plantTime, herb.harvestTime);

                            return (
                              <div
                                key={index}
                                className={`p-4 rounded-none border transition-all relative overflow-hidden ${isMature
                                  ? 'bg-green-950/20 border-green-500/50 shadow-lg'
                                  : 'bg-stone-950/40 border-stone-800'
                                  }`}
                              >
                                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                                <div className="flex items-start justify-between gap-4 relative z-10">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-bold text-stone-200 text-lg uppercase tracking-widest">{herb.herbName}</span>
                                      {herb.isMutated && (
                                        <span className="text-[10px] bg-purple-900/20 text-purple-400 px-2 py-0.5 rounded-none border border-purple-500/50 flex items-center gap-1 font-bold uppercase tracking-widest">
                                          <Sparkles size={10} />
                                          MUTANT
                                        </span>
                                      )}
                                      <span className="text-stone-400 text-xs bg-stone-950/60 px-2 py-0.5 rounded-none border border-stone-800 font-bold">
                                        x{herb.isMutated && herb.mutationBonus ? Math.floor(herb.quantity * herb.mutationBonus) : herb.quantity}
                                      </span>
                                      {isMature && (
                                        <span className="text-[10px] bg-green-900/20 text-green-400 px-2 py-0.5 rounded-none border border-green-500/50 flex items-center gap-1 font-bold uppercase tracking-widest">
                                          <CheckCircle size={10} />
                                          READY
                                        </span>
                                      )}
                                    </div>

                                    {!isMature && (
                                      <div className="mb-3">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                          <span className="flex items-center gap-1.5 text-stone-400 uppercase text-[10px] font-bold tracking-widest">
                                            <Clock size={12} className="text-blue-400" />
                                            <span>Time Left</span>
                                          </span>
                                          <span className="font-bold text-amber-400 tracking-widest">{formatGrottoTime(remaining)}</span>
                                        </div>
                                        <div className="w-full bg-stone-950/60 rounded-none h-4 relative overflow-hidden border border-stone-800">
                                          <div
                                            className="bg-emerald-500/30 h-full transition-all duration-1000 relative"
                                            style={{ width: `${progress}%` }}
                                          >
                                            <div className="absolute inset-0 bg-scanlines opacity-20"></div>
                                          </div>
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-emerald-500 tracking-widest">{progress}%</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {isMature && (
                                      <p className="text-[10px] text-green-400 flex items-center gap-1 uppercase font-bold tracking-widest">
                                        <CheckCircle size={12} />
                                        Mature! Ready for collection.
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {!isMature && (
                                      <button
                                        onClick={() => onSpeedupHerb(index)}
                                        className="px-4 py-2 bg-blue-900/10 text-blue-400 rounded-none hover:bg-blue-900/20 transition-all text-[10px] font-bold flex items-center gap-1.5 border border-blue-900/50 active:scale-95 uppercase tracking-widest"
                                        title="Speed up with Caps"
                                      >
                                        <Gauge size={14} />
                                        SPEED
                                      </button>
                                    )}
                                    {isMature && (
                                      <button
                                        onClick={() => onHarvestHerb(index)}
                                        className="px-4 py-2 bg-green-900/20 text-green-400 rounded-none hover:bg-green-900/40 transition-all text-[10px] font-bold border border-green-500/50 active:scale-95 uppercase tracking-widest"
                                      >
                                        <CheckCircle size={14} className="inline mr-1" />
                                        GATHER
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {grotto.plantedHerbs.length === 0 && (
                    <div className="bg-stone-900/50 p-8 rounded-none border border-stone-800 text-center">
                      <Sprout className="mx-auto text-stone-600 mb-3" size={48} />
                      <p className="text-stone-400 font-bold uppercase tracking-widest">No active production.</p>
                      <p className="text-stone-500 text-xs mt-2 uppercase">Head to 'Produce' to start growing supplies.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'upgrade' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-200 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <ArrowUp size={20} className="text-amber-400" />
                Acquire/Upgrade Base
              </h3>
              {availableUpgrades.length === 0 ? (
                <div className="text-center py-12 bg-stone-900/40 border border-stone-800 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                  <Home className="mx-auto text-stone-600 mb-4 relative z-10" size={48} />
                  <p className="text-stone-400 font-bold uppercase tracking-widest relative z-10">
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
                        className={`bg-stone-900/40 p-5 rounded-none border transition-all relative overflow-hidden group ${canAfford
                          ? 'border-stone-800 hover:border-amber-500 shadow-lg'
                          : 'border-stone-800/50 opacity-75'
                          }`}
                      >
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                        <div className="flex items-start justify-between mb-4 gap-4 relative z-10">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-xl font-bold text-stone-200 uppercase tracking-widest">
                                {config.name}
                              </h4>
                              <span className="text-stone-400 text-[10px] bg-stone-950/60 px-2 py-1 rounded-none border border-stone-800 font-bold uppercase tracking-widest">
                                RANK {config.level}
                              </span>
                            </div>
                            <p className="text-stone-400 text-xs mb-4 uppercase tracking-tight">{config.description}</p>

                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div className="bg-stone-950/40 p-3 rounded-none border border-stone-800">
                                <span className="text-stone-500 block mb-1 uppercase text-[10px] font-bold tracking-widest">XP Bonus</span>
                                <span className="text-amber-400 font-bold text-lg tracking-widest">
                                  +{(config.expRateBonus * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="bg-stone-950/40 p-3 rounded-none border border-stone-800">
                                <span className="text-stone-500 block mb-1 uppercase text-[10px] font-bold tracking-widest">Growth Rate</span>
                                <span className="text-green-400 font-bold text-lg tracking-widest">
                                  +{(config.growthSpeedBonus * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="bg-stone-950/40 p-3 rounded-none border border-stone-800">
                                <span className="text-stone-500 block mb-1 uppercase text-[10px] font-bold tracking-widest">Supply Slots</span>
                                <span className="text-stone-200 font-bold text-lg tracking-widest">{config.maxHerbSlots}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => onUpgradeGrotto(config.level)}
                              disabled={!canAfford}
                              className={`px-6 py-3 rounded-none font-bold transition-all flex items-center gap-2 shadow-lg uppercase tracking-widest text-xs ${canAfford
                                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/50 active:scale-95'
                                : 'bg-stone-800/40 text-stone-500 cursor-not-allowed border border-stone-800'
                                }`}
                            >
                              <Coins size={16} />
                              <span>[ {config.cost.toLocaleString()} CAPS ]</span>
                            </button>
                            {!canAfford && (
                              <p className="text-[10px] text-red-400/80 text-right font-bold uppercase tracking-widest">
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
                <h3 className="text-lg font-bold text-stone-200 flex items-center gap-2 uppercase tracking-wider">
                  <Sprout size={20} className="text-green-500" />
                  Produce Supplies
                </h3>
                {grotto.level > 0 && (
                  <div className="text-stone-400 text-[10px] bg-stone-950/60 px-3 py-1 rounded-none border border-stone-800 font-bold uppercase tracking-widest">
                    Slots: {grotto.plantedHerbs.length} / {currentConfig?.maxHerbSlots || 0}
                  </div>
                )}
              </div>

              {grotto.level === 0 ? (
                <div className="text-center py-12 bg-stone-900/40 border border-stone-800 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                  <AlertCircle className="mx-auto text-stone-600 mb-4 relative z-10" size={48} />
                  <p className="text-stone-400 mb-2 font-bold uppercase tracking-widest relative z-10">Acquire a base to start production.</p>
                  <button
                    onClick={() => setActiveTab('upgrade')}
                    className="px-6 py-2 bg-amber-500/20 text-amber-400 font-bold rounded-none hover:bg-amber-500/30 transition-all mt-4 uppercase tracking-widest text-xs border border-amber-500/50 relative z-10"
                  >
                    [ Acquire ]
                  </button>
                </div>
              ) : availableHerbs.length === 0 ? (
                <div className="text-center py-12 bg-stone-900/40 border border-stone-800 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                  <Sprout className="mx-auto text-stone-600 mb-4 relative z-10" size={48} />
                  <p className="text-stone-400 font-bold uppercase tracking-widest relative z-10">No plantable components in inventory.</p>
                  <p className="text-stone-500 text-[10px] mt-2 uppercase font-bold tracking-widest relative z-10">Acquire seeds via scavenging or trade.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableHerbs.map((herb) => {
                    // Strict match: name and type must match; herbs only (exclude pills and others)
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
                        className={`bg-stone-900/40 p-4 rounded-none border transition-all relative overflow-hidden group ${canPlant
                          ? 'border-stone-800 hover:border-green-500 shadow-lg'
                          : 'border-stone-800/50 opacity-75'
                          }`}
                      >
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                        <div className="flex items-start justify-between mb-3 gap-3 relative z-10">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="font-bold text-lg uppercase tracking-widest"
                                style={{ color: getRarityTextColor(herb.rarity) }}
                              >
                                {herb.name}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-none bg-stone-950/60 text-stone-400 border border-stone-800 font-bold uppercase tracking-widest">
                                {herb.rarity}
                              </span>
                            </div>

                            <div className="space-y-1 text-sm text-stone-400 mb-3">
                              <div className="flex items-center gap-1.5 uppercase text-[10px] font-bold tracking-widest">
                                <Clock size={12} className="text-blue-400" />
                                <span>Cycle: {timeText}</span>
                              </div>
                              <div className="flex items-center gap-1.5 uppercase text-[10px] font-bold tracking-widest">
                                <Package size={12} className="text-stone-500" />
                                <span>Yield: {herb.harvestQuantity.min}-{herb.harvestQuantity.max} units</span>
                              </div>
                              {herb.grottoLevelRequirement && (
                                <div className={`text-[10px] uppercase font-bold tracking-widest ${levelRequirementMet ? 'text-green-400' : 'text-red-400'}`}>
                                  {levelRequirementMet ? '✓ Rank Met' : `✗ Needs Base Rank ${herb.grottoLevelRequirement}`}
                                </div>
                              )}
                            </div>

                            <div className={`text-[10px] uppercase font-bold tracking-widest ${(!seedItem || seedItem.quantity === 0) ? 'text-red-400' : 'text-stone-500'}`}>
                              Seeds: <span className={`font-bold ${(!seedItem || seedItem.quantity === 0) ? 'text-red-300' : 'text-stone-300'}`}>{seedItem?.quantity || 0}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => onPlantHerb(herb.id || herb.name)}
                            disabled={!canPlant}
                            className={`px-4 py-2 rounded-none font-bold transition-all flex-shrink-0 uppercase tracking-widest text-[10px] ${canPlant
                              ? 'bg-green-900/20 text-green-400 hover:bg-green-900/40 border border-green-500/50 active:scale-95'
                              : 'bg-stone-800/40 text-stone-500 cursor-not-allowed border border-stone-800'
                              }`}
                          >
                            {(!seedItem || seedItem.quantity < 1)
                              ? '[ LOW SEEDS ]'
                              : !levelRequirementMet
                                ? `[ RANK ${herb.grottoLevelRequirement} ]`
                                : isFull
                                  ? '[ FULL ]'
                                  : '[ GROW ]'}
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
              <h3 className="text-lg font-bold text-stone-200 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Zap size={20} className="text-amber-400" />
                Reactor Overhaul
              </h3>
              {grotto.level === 0 ? (
                <div className="text-center py-12 bg-stone-900/40 border border-stone-800 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                  <AlertCircle className="mx-auto text-stone-600 mb-4 relative z-10" size={48} />
                  <p className="text-stone-400 mb-2 font-bold uppercase tracking-widest relative z-10">Acquire a base to start overhaul.</p>
                  <button
                    onClick={() => setActiveTab('upgrade')}
                    className="px-6 py-2 bg-amber-500/20 text-amber-400 font-bold rounded-none hover:bg-amber-500/30 transition-all mt-4 uppercase tracking-widest text-xs border border-amber-500/50 relative z-10"
                  >
                    [ Acquire ]
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-stone-900/40 p-5 rounded-none border border-stone-800 shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <div className="p-2.5 rounded-none bg-amber-500/10 border border-amber-500/50">
                        <Zap className="text-amber-400" size={24} />
                      </div>
                      <div className="flex-1">
                        <span className="text-stone-500 font-bold text-[10px] block uppercase tracking-widest">Current Overhaul Bonus</span>
                        <p className="text-3xl font-bold text-amber-400 mt-1 tracking-widest">
                          +{((grotto.spiritArrayEnhancement || 0) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <div className="bg-stone-950/40 p-3 rounded-none border border-stone-800 relative z-10">
                      <p className="text-[10px] text-stone-500 uppercase font-bold tracking-widest">
                        <span className="text-stone-400">Base Bonus:</span> +{(grotto.expRateBonus * 100).toFixed(0)}% |{' '}
                        <span className="text-amber-400">Total Bonus:</span> +{((grotto.expRateBonus + (grotto.spiritArrayEnhancement || 0)) * 100).toFixed(0)}%
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
                          className={`bg-stone-900/40 p-5 rounded-none border transition-all relative overflow-hidden group ${canEnhance
                            ? 'border-stone-800 hover:border-amber-500 shadow-lg'
                            : 'border-stone-800/50 opacity-75'
                            }`}
                        >
                          <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                          <div className="mb-4 relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-stone-200 text-lg uppercase tracking-widest">{enhancement.name}</span>
                              <span className="text-[10px] text-stone-400 bg-stone-950/60 px-2 py-1 rounded-none border border-stone-800 font-bold uppercase tracking-widest">
                                Needs Base Rank {enhancement.grottoLevelRequirement}
                              </span>
                            </div>
                            <p className="text-stone-400 text-xs mb-4 uppercase tracking-tight">{enhancement.description}</p>

                            <div className="bg-stone-950/40 p-4 rounded-none border border-stone-800 mb-4">
                              <div className="text-amber-400 text-xs mb-3 font-bold flex items-center gap-2 uppercase tracking-widest">
                                <Zap size={18} />
                                Bonus: +{(enhancement.expRateBonus * 100).toFixed(0)}% XP Rate
                              </div>
                              <div className="text-stone-500 text-[10px] mb-2 font-bold uppercase tracking-widest">Required Materials:</div>
                              <div className="flex flex-wrap gap-2">
                                {enhancement.materials.map((material, idx) => {
                                  const item = player.inventory.find((i) => i.name === material.name);
                                  const hasEnough = item && item.quantity >= material.quantity;
                                  return (
                                    <span
                                      key={idx}
                                      className={`text-[10px] px-2 py-1 rounded-none border font-bold uppercase tracking-widest ${hasEnough
                                        ? 'bg-green-950/20 text-green-400 border-green-500/50'
                                        : 'bg-red-950/20 text-red-400 border-red-500/50'
                                        }`}
                                    >
                                      {material.name} x{material.quantity}
                                      {item && ` (${item.quantity})`}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => onEnhanceSpiritArray(enhancement.id)}
                            disabled={!canEnhance}
                            className={`w-full px-4 py-3 rounded-none font-bold transition-all uppercase tracking-widest text-[10px] relative z-10 ${canEnhance
                              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/50 shadow-lg active:scale-95'
                              : 'bg-stone-800/40 text-stone-500 cursor-not-allowed border border-stone-800'
                              }`}
                          >
                            {!meetsLevelRequirement
                              ? `[ NEEDS BASE RANK ${enhancement.grottoLevelRequirement} ]`
                              : !hasMaterials
                                ? '[ LOW MATERIALS ]'
                                : '[ INSTALL OVERHAUL ]'}
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
              <h3 className="text-lg font-bold text-stone-200 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <BookOpen size={20} className="text-purple-500" />
                Supplies Database
              </h3>

              {/* Database Statistics */}
              <div className="bg-stone-900/40 p-5 rounded-none border border-stone-800 shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 relative z-10">
                  <div className="bg-stone-950/40 p-4 rounded-none border border-stone-800 hover:border-purple-400/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="text-purple-400" size={18} />
                      <div className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Collected</div>
                    </div>
                    <div className="text-2xl font-bold text-purple-400 tracking-widest">
                      {grotto.herbarium?.length || 0} / {PLANTABLE_HERBS.length}
                    </div>
                  </div>
                  <div className="bg-stone-950/40 p-4 rounded-none border border-stone-800 hover:border-amber-500/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="text-amber-400" size={18} />
                      <div className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Progress</div>
                    </div>
                    <div className="text-2xl font-bold text-amber-400 tracking-widest">
                      {PLANTABLE_HERBS.length > 0 ? Math.floor(((grotto.herbarium?.length || 0) / PLANTABLE_HERBS.length) * 100) : 0}%
                    </div>
                  </div>
                  <div className="bg-stone-950/40 p-4 rounded-none border border-stone-800 hover:border-blue-400/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-blue-400" size={18} />
                      <div className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Today's Speeds</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-400 tracking-widest">
                      {(() => {
                        const today = new Date().toISOString().split('T')[0];
                        const lastReset = grotto.lastSpeedupResetDate || today;
                        return lastReset === today ? (grotto.dailySpeedupCount || 0) : 0;
                      })()} / {SPEEDUP_CONFIG.dailyLimit}
                    </div>
                  </div>
                </div>

                {/* Index Reward Progress */}
                <div className="space-y-2 relative z-10">
                  {HERBARIUM_REWARDS.map((reward) => {
                    const isClaimed = player.achievements.includes(`herbarium-${reward.herbCount}`);
                    const isUnlocked = (grotto.herbarium?.length || 0) >= reward.herbCount;
                    return (
                      <div
                        key={reward.herbCount}
                        className={`p-3 rounded-none border transition-all ${isClaimed
                          ? 'bg-green-950/20 border-green-600/50 opacity-70'
                          : isUnlocked
                            ? 'bg-yellow-950/20 border-yellow-600/50 animate-pulse'
                            : 'bg-stone-950/40 border-stone-800'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-stone-200 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                              Collect {reward.herbCount} types
                              {isClaimed && <span className="text-green-400 flex items-center gap-1"><CheckCircle size={10} /> CLAIMED</span>}
                              {!isClaimed && isUnlocked && <span className="text-yellow-400 flex items-center gap-1 underline underline-offset-2">AVAILABLE</span>}
                            </div>
                            <div className="text-stone-500 text-[10px] mt-1 font-bold uppercase tracking-widest">
                              Reward:{' '}
                              <span className="text-stone-400">
                                {reward.reward.exp && `${reward.reward.exp} Data `}
                                {reward.reward.spiritStones && `${reward.reward.spiritStones} Caps `}
                                {reward.reward.attributePoints && `${reward.reward.attributePoints} Special Points `}
                                {reward.reward.title && `Title: ${reward.reward.title}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Logged Supplies List */}
              <div className="bg-stone-900/40 p-5 rounded-none border border-stone-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                <h4 className="text-stone-200 font-bold mb-4 uppercase tracking-widest text-sm relative z-10">Logged Supplies</h4>
                <div className="relative z-10">
                  {grotto.herbarium && grotto.herbarium.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {PLANTABLE_HERBS.map((herb) => {
                        const isCollected = grotto.herbarium?.includes(herb.name);
                        return (
                          <div
                            key={herb.id}
                            className={`p-3 rounded-none border text-center transition-all ${isCollected
                              ? 'bg-stone-950/60 border-stone-800 shadow-sm'
                              : 'bg-stone-950/20 border-stone-800/30 opacity-40'
                              }`}
                          >
                            <div
                              className={`font-bold text-[10px] mb-1 uppercase tracking-widest ${isCollected ? getRarityTextColor(herb.rarity) : 'text-stone-600'
                                }`}
                            >
                              {herb.name}
                            </div>
                            <div className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">{herb.rarity}</div>
                            {isCollected && (
                              <div className="mt-2">
                                <CheckCircle className="mx-auto text-green-500/70" size={14} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="mx-auto text-stone-600 mb-3" size={48} />
                      <p className="text-stone-400 font-bold uppercase tracking-widest">No supplies logged yet.</p>
                      <p className="text-stone-500 text-[10px] mt-2 uppercase font-bold tracking-widest">Produce and harvest supplies to log them here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrottoModal;
