import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Award, Info, Zap, BarChart3, TrendingUp, Sparkles, BookOpen, Users, Beaker, Package } from 'lucide-react';
import { PlayerStats, ItemRarity, RealmType, Title } from '../types';
import {
  TALENTS,
  TITLES,
  TITLE_SET_EFFECTS,
  ACHIEVEMENTS,
  CULTIVATION_ARTS,
  REALM_ORDER,
  FOUNDATION_TREASURES,
  HEAVEN_EARTH_ESSENCES,
  HEAVEN_EARTH_MARROWS,
  LONGEVITY_RULES,
  RARITY_MULTIPLIERS,
} from '../constants/index';
import { getGoldenCoreBonusMultiplier, getGoldenCoreMethodTitle, calculateGoldenCoreMethodCount, getGoldenCoreTribulationDifficulty } from '../utils/cultivationUtils';
import { getItemStats } from '../utils/itemUtils';
import { getRarityTextColor } from '../utils/rarityUtils';
import { showConfirm, showError } from '../utils/toastUtils';
import {
  calculateTitleEffects,
  getActiveSetEffects,
} from '../utils/titleUtils';
import { useInheritanceHandlers } from '../views/inheritance';
import { getPlayerTotalStats, getActiveMentalArt } from '../utils/statUtils';
import { logger } from '../utils/logger';
import { formatValueChange, formatNumber } from '../utils/formatUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  onSelectTalent: (talentId: string) => void;
  onSelectTitle: (titleId: string) => void;
  onAllocateAttribute: (
    type: 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'
  ) => void;
  onAllocateAllAttributes?: (
    type: 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'
  ) => void;
  onUseInheritance?: () => void;
  onResetAttributes?: () => void;
  addLog?: (message: string, type?: string) => void;
}

// HoverableCard 组件 - 带 tooltip 的卡片
const HoverableCard: React.FC<{
  children: React.ReactNode;
  tooltipContent: React.ReactNode;
  borderColor?: string;
  width?: string;
  className?: string;
}> = ({ children, tooltipContent, borderColor = 'border-blue-500', width = 'w-64', className = '' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTooltip || !cardRef.current) return;

    const updatePosition = () => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const tooltipWidth = width === 'w-72' ? 288 : 256;
      const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
      const gap = 8;

      let left = rect.right + gap;
      let top = rect.top;

      if (left + tooltipWidth > window.innerWidth) {
        left = rect.left - tooltipWidth - gap;
      }

      if (top + tooltipHeight > window.innerHeight) {
        top = window.innerHeight - tooltipHeight - 10;
      }

      if (top < 10) {
        top = 10;
      }

      setPosition({ top, left });
    };

    updatePosition();
    const timer = setTimeout(updatePosition, 0);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showTooltip, width]);

  return (
    <>
      <div
        ref={cardRef}
        className={className}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </div>
      {showTooltip && createPortal(
        <div
          ref={tooltipRef}
          className={`fixed ${width} bg-stone-900 border-2 ${borderColor} rounded-lg p-3 shadow-xl z-[10000] pointer-events-none transition-opacity duration-200`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {tooltipContent}
        </div>,
        document.body
      )}
    </>
  );
};

// Tooltip Component - Using Portal to render to body (retained for backward compatibility)
const Tooltip: React.FC<{
  children: React.ReactNode;
  targetRef: React.RefObject<HTMLElement>;
  isVisible: boolean;
  borderColor?: string;
  width?: string;
}> = ({ children, targetRef, isVisible, borderColor = 'border-blue-500', width = 'w-64' }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !targetRef.current) return;

    const updatePosition = () => {
      if (!targetRef.current) return;
      const rect = targetRef.current.getBoundingClientRect();
      const tooltipWidth = width === 'w-72' ? 288 : 256; // w-64 = 256px, w-72 = 288px
      const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
      const gap = 8; // ml-2 = 8px

      let left = rect.right + gap;
      let top = rect.top;

      // Check if tooltip will exceed viewport right side
      if (left + tooltipWidth > window.innerWidth) {
        // Show on the left side
        left = rect.left - tooltipWidth - gap;
      }

      // Check if tooltip will exceed viewport bottom
      if (top + tooltipHeight > window.innerHeight) {
        top = window.innerHeight - tooltipHeight - 10;
      }

      // Check if tooltip will exceed viewport top
      if (top < 10) {
        top = 10;
      }

      setPosition({ top, left });
    };

    updatePosition();
    const timer = setTimeout(updatePosition, 0); // Delay one frame to ensure DOM update
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, targetRef, width]);

  if (!isVisible) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className={`fixed ${width} bg-stone-900 border-2 ${borderColor} rounded-lg p-3 shadow-xl z-[10000] pointer-events-none transition-opacity duration-200`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {children}
    </div>,
    document.body
  );
};

const CharacterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  setPlayer,
  onSelectTalent,
  onSelectTitle,
  onAllocateAttribute,
  onAllocateAllAttributes,
  onUseInheritance,
  onResetAttributes,
  addLog = (msg: string) => logger.log(msg),
}) => {
  if (!isOpen) return null;

  // Use getPlayerTotalStats to get total stats including heart method bonuses
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const totalStats = useMemo(() => getPlayerTotalStats(player), [player]);

  // Inheritance handlers
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const inheritanceHandlers = useInheritanceHandlers({
    player,
    setPlayer,
    addLog,
  });

  const [activeTab, setActiveTab] = useState<'character' | 'statistics'>(
    'character'
  );
  const [showAttributeDetails, setShowAttributeDetails] = useState(false);
  const [showMarrowFeedModal, setShowMarrowFeedModal] = useState(false);
  const [selectedFeedItemId, setSelectedFeedItemId] = useState<string | null>(null);
  const [showTitleDetails, setShowTitleDetails] = useState(false);

  // Cache refinement progress values for each item to avoid jitter
  const itemProgressCache = useMemo(() => {
    const cache: Record<string, number> = {};
    if (player && showMarrowFeedModal) {
      player.inventory
        .filter((item) => {
          const isEquipped = Object.values(player.equippedItems).includes(item.id);
          return !isEquipped && item.quantity > 0;
        })
        .forEach((item) => {
          // Use item ID to generate stable hash
          const hash = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const seed = (hash % 1000) / 1000; // 0-1 stable value

          const rarity = item.rarity || 'Common';
          const baseProgress = (rarity === 'Common' || rarity === '普通') ? 1.5 : (rarity === 'Rare' || rarity === '稀有') ? 4 : (rarity === 'Legendary' || rarity === '传说') ? 8 : 20;
          // Use stable seed instead of Math.random() for consistent value
          cache[item.id] = Math.floor(baseProgress * (0.8 + seed * 0.4)); // 80%-120% variance
        });
    }
    return cache;
  }, [player?.inventory, player?.equippedItems, showMarrowFeedModal]);
  const currentTalent = TALENTS.find((t) => t.id === player.talentId);
  const currentTitle = TITLES.find((t) => t.id === player.titleId);

  // 检查称号是否满足解锁条件
  const checkTitleRequirement = useCallback(
    (title: Title, player: PlayerStats): boolean => {
      const requirement = title.requirement.toLowerCase();
      const stats = player.statistics || {
        killCount: 0,
        meditateCount: 0,
        adventureCount: 0,
        equipCount: 0,
        petCount: 0,
        recipeCount: 0,
        artCount: 0,
        breakthroughCount: 0,
        secretRealmCount: 0,
      };

      // Check Tier based titles
      if (requirement.includes('Wastelander') || requirement.includes('Foundation')) {
        return REALM_ORDER.indexOf(player.realm) >= REALM_ORDER.indexOf(RealmType.Foundation);
      }
      if (requirement.includes('Mutant') || requirement.includes('Golden Core')) {
        return REALM_ORDER.indexOf(player.realm) >= REALM_ORDER.indexOf(RealmType.GoldenCore);
      }
      if (requirement.includes('Evolved') || requirement.includes('Nascent Soul')) {
        return REALM_ORDER.indexOf(player.realm) >= REALM_ORDER.indexOf(RealmType.NascentSoul);
      }
      if (requirement.includes('Legend') || requirement.includes('Ascension') || requirement.includes('Immortal')) {
        return REALM_ORDER.indexOf(player.realm) >= REALM_ORDER.indexOf(RealmType.LongevityRealm);
      }

      // Check Combat based titles
      if (requirement.includes('Defeat 10 hostiles') || requirement.includes('Kill 10')) {
        return stats.killCount >= 10;
      }
      if (requirement.includes('Defeat 50 hostiles') || requirement.includes('Kill 50')) {
        return stats.killCount >= 50;
      }
      if (requirement.includes('Defeat 100 hostiles') || requirement.includes('Kill 100')) {
        return stats.killCount >= 100;
      }

      // Check Exploration titles
      if (requirement.includes('Complete 20 explorations') || requirement.includes('20 explorations')) {
        return stats.adventureCount >= 20;
      }
      if (requirement.includes('Complete 50 explorations') || requirement.includes('50 explorations')) {
        return stats.adventureCount >= 50;
      }
      if (requirement.includes('Complete 100 explorations') || requirement.includes('100 explorations')) {
        return stats.adventureCount >= 100;
      }

      // Check Rest/Mod session titles
      if (requirement.includes('rest') || requirement.includes('stim')) {
        const match = requirement.match(/(\d+)/);
        if (match) {
          const count = parseInt(match[1]);
          return stats.meditateCount >= count;
        }
      }

      // Check Collection titles
      if (requirement.includes('collect') || requirement.includes('items')) {
        const match = requirement.match(/(\d+)/);
        if (match) {
          const count = parseInt(match[1]);
          const uniqueItems = new Set(player.inventory.map((i) => i.name)).size;
          return uniqueItems >= count;
        }
      }

      // Default initial titles
      if (requirement.includes('initial')) {
        return true;
      }

      return false;
    },
    []
  );

  // Get list of unlocked titles
  const unlockedTitles = useMemo(() => {
    return TITLES.filter((t) => (player.unlockedTitles || []).includes(t.id));
  }, [player.unlockedTitles]);

  // Calculate current title effects (including set effects)
  const titleEffects = useMemo(() => {
    return calculateTitleEffects(player.titleId, player.unlockedTitles || []);
  }, [player.titleId, player.unlockedTitles]);

  // Get active set effects
  const activeSetEffects = useMemo(() => {
    return getActiveSetEffects(player.titleId, player.unlockedTitles || []);
  }, [player.titleId, player.unlockedTitles]);


  // Calculate attribute sources
  const calculateAttributeSources = () => {
    const baseStats = {
      attack: 0,
      defense: 0,
      hp: 0,
      spirit: 0,
      physique: 0,
      speed: 0,
    };

    // Talent bonuses
    if (currentTalent) {
      baseStats.attack += currentTalent.effects.attack || 0;
      baseStats.defense += currentTalent.effects.defense || 0;
      baseStats.hp += currentTalent.effects.hp || 0;
      baseStats.spirit += currentTalent.effects.spirit || 0;
      baseStats.physique += currentTalent.effects.physique || 0;
      baseStats.speed += currentTalent.effects.speed || 0;
    }

    // Title bonuses (including set effects)
    const titleEffects = calculateTitleEffects(
      player.titleId,
      player.unlockedTitles || []
    );
    const titleStats = {
      attack: titleEffects.attack,
      defense: titleEffects.defense,
      hp: titleEffects.hp,
      spirit: titleEffects.spirit,
      physique: titleEffects.physique,
      speed: titleEffects.speed,
    };

    // Heart Method bonuses
    let artStats = {
      attack: 0,
      defense: 0,
      hp: 0,
      spirit: 0,
      physique: 0,
      speed: 0,
    };
    player.cultivationArts.forEach((artId) => {
      const art = CULTIVATION_ARTS.find((a) => a.id === artId);
      if (art) {
        artStats.attack += art.effects.attack || 0;
        artStats.defense += art.effects.defense || 0;
        artStats.hp += art.effects.hp || 0;
        artStats.spirit += art.effects.spirit || 0;
        artStats.physique += art.effects.physique || 0;
        artStats.speed += art.effects.speed || 0;
      }
    });

    // Legacy bonuses (Physical) - Removed
    let inheritanceStats = {
      attack: 0,
      defense: 0,
      hp: 0,
      spirit: 0,
      physique: 0,
      speed: 0,
    };

    // Equipment bonuses
    let equipmentStats = {
      attack: 0,
      defense: 0,
      hp: 0,
      spirit: 0,
      physique: 0,
      speed: 0,
    };
    Object.values(player.equippedItems).forEach((itemId) => {
      const equippedItem = player.inventory.find((i) => i.id === itemId);
      if (equippedItem && equippedItem.effect) {
        const isNatal = equippedItem.id === player.natalArtifactId;
        const itemStats = getItemStats(equippedItem, isNatal);
        equipmentStats.attack += itemStats.attack;
        equipmentStats.defense += itemStats.defense;
        equipmentStats.hp += itemStats.hp;
        equipmentStats.spirit += itemStats.spirit;
        equipmentStats.physique += itemStats.physique;
        equipmentStats.speed += itemStats.speed;
      }
    });

    // Current active heart method bonus
    const activeArt = getActiveMentalArt(player);
    let activeArtStats = {
      attack: 0,
      defense: 0,
      hp: 0,
      spirit: 0,
      physique: 0,
      speed: 0,
    };
    if (activeArt && activeArt.type === 'mental') {
      activeArtStats.attack = activeArt.effects.attack || 0;
      activeArtStats.defense = activeArt.effects.defense || 0;
      activeArtStats.hp = activeArt.effects.hp || 0;
      activeArtStats.spirit = activeArt.effects.spirit || 0;
      activeArtStats.physique = activeArt.effects.physique || 0;
      activeArtStats.speed = activeArt.effects.speed || 0;
    }

    return {
      base: baseStats,
      talent: baseStats,
      title: titleStats,
      art: artStats,
      inheritance: inheritanceStats,
      equipment: equipmentStats,
      activeArt: activeArtStats,
    };
  };

  const attributeSources = calculateAttributeSources();

  // Calculate game duration (from archive playTime)
  const gameDuration = useMemo(() => {
    if (!player || player.playTime === undefined) return null;
    const duration = player.playTime; // Cumulative duration from archive
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);
    const hoursRemainder = hours % 24;

    if (days > 0) {
      return `${days}d ${hoursRemainder}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }, [player?.playTime]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = player.statistics || {
      killCount: 0,
      meditateCount: 0,
      adventureCount: 0,
      equipCount: 0,
      petCount: 0,
      recipeCount: 0,
      artCount: 0,
      breakthroughCount: 0,
      secretRealmCount: 0,
    };

    // 计算额外统计数据
    const totalInventoryItems = player.inventory.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const totalEquippedItems = Object.keys(player.equippedItems).filter(
      (key) => player.equippedItems[key as keyof typeof player.equippedItems]
    ).length;
    const totalSpiritStonesEarned = player.spiritStones; // Current Caps (simplified)
    const totalExpEarned = player.exp; // Current Data (simplified)
    const realmIndex = REALM_ORDER.indexOf(player.realm);
    const maxRealmIndex = REALM_ORDER.length - 1;
    const realmProgress =
      ((realmIndex * 9 + player.realmLevel) / (maxRealmIndex * 9 + 9)) * 100;

    return {
      ...stats,
      totalInventoryItems,
      totalEquippedItems,
      totalSpiritStonesEarned,
      totalExpEarned,
      realmProgress: Math.min(100, realmProgress),
      gameDays: player.gameDays || 1,
      unlockedArtsCount: (player.unlockedArts || []).length,
      learnedArtsCount: player.cultivationArts.length,
    };
  }, [player]);

  // Calculate actual attribute gain per point based on realm
  const attributeGains = useMemo(() => {
    const realmIndex = REALM_ORDER.indexOf(player.realm);
    // Ensure realmIndex valid
    const validRealmIndex = realmIndex >= 0 ? realmIndex : 0;
    // Consistent with useCharacterHandlers.ts: linear growth
    const multiplier = 1 + validRealmIndex * 2; // Scavenger 1x, Apex 13x

    // Base attribute increase values
    const baseAttack = 5;
    const baseDefense = 3;
    const baseHp = 20;
    const baseSpirit = 3;
    const basePhysique = 3;
    const basePhysiqueHp = 10; // Extra HP from Endurance
    const baseSpeed = 2;

    return {
      attack: Math.floor(baseAttack * multiplier),
      defense: Math.floor(baseDefense * multiplier),
      hp: Math.floor(baseHp * multiplier),
      spirit: Math.floor(baseSpirit * multiplier),
      physique: Math.floor(basePhysique * multiplier),
      physiqueHp: Math.floor(basePhysiqueHp * multiplier),
      speed: Math.floor(baseSpeed * multiplier),
    };
  }, [player.realm]);

  // Handle confirm for allocate all
  const handleAllocateAllWithConfirm = (
    type: 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'
  ) => {
    if (!onAllocateAllAttributes) return;

    const attributeNames: Record<typeof type, string> = {
      attack: 'Firepower (FP)',
      defense: 'Dmg Resist (DR)',
      hp: 'Hit Points (HP)',
      spirit: 'Perception (PER)',
      physique: 'Endurance (END)',
      speed: 'Agility (AGI)',
    };

    const attributeName = attributeNames[type];
    const points = player.attributePoints;
    const realmIndex = REALM_ORDER.indexOf(player.realm);
    // 确保realmIndex有效，防止NaN
    const validRealmIndex = realmIndex >= 0 ? realmIndex : 0;
    // 与useCharacterHandlers.ts保持一致：线性增长
    const multiplier = 1 + validRealmIndex * 2; // 炼气期1倍，渡劫飞升13倍

    // 计算总增加值
    let totalGain = 0;
    let totalPhysiqueGain = 0;
    let totalHpGain = 0;

    if (type === 'attack') {
      totalGain = Math.floor(5 * multiplier * points);
    } else if (type === 'defense') {
      totalGain = Math.floor(3 * multiplier * points);
    } else if (type === 'hp') {
      totalGain = Math.floor(20 * multiplier * points);
    } else if (type === 'spirit') {
      totalGain = Math.floor(3 * multiplier * points);
    } else if (type === 'physique') {
      totalPhysiqueGain = Math.floor(3 * multiplier * points);
      totalHpGain = Math.floor(10 * multiplier * points);
    } else if (type === 'speed') {
      totalGain = Math.floor(2 * multiplier * points);
    }

    const gainText =
      type === 'physique'
        ? `+${totalPhysiqueGain} END, +${totalHpGain} HP`
        : `+${totalGain}`;

    showConfirm(
      `Are you sure you want to allocate all ${points} points to 【${attributeName}】?
 
 Predicted Gain: ${gainText}
 
 This operation cannot be undone!`,
      'Confirm Allocation',
      () => {
        onAllocateAllAttributes(type);
      }
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-paper-800 rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-600 shadow-2xl w-full h-[80vh] md:h-auto md:max-w-2xl md:max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 md:p-4 border-b border-stone-600 bg-ink-800 md:rounded-t flex justify-between items-start">
          <h2 className="text-lg md:text-xl font-serif text-mystic-gold">
            SPECIAL Profile
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>
        {/* Tab Switcher */}
        <div className="flex border-b border-stone-600 bg-ink-800">
          <button
            onClick={() => setActiveTab('character')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'character'
              ? 'bg-stone-700 text-mystic-gold border-b-2 border-mystic-gold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Info size={16} />
              Profile Info
            </div>
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'statistics'
              ? 'bg-stone-700 text-mystic-gold border-b-2 border-mystic-gold'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BarChart3 size={16} />
              Statistics
            </div>
          </button>
        </div>

        <div className="modal-scroll-container modal-scroll-content p-6 space-y-6 bg-paper-800">
          {activeTab === 'character' ? (
            <>
              {/* Evolution System Info */}
              <div className="bg-gradient-to-r from-blue-900/50 to-green-900/50 rounded-lg p-6 border-2 border-blue-500 shadow-lg" style={{ overflow: 'visible' }}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <TrendingUp className="text-blue-400" size={24} />
                    Neural Mods
                  </h3>
                  <div className="text-sm text-blue-300 bg-blue-800/50 px-3 py-1 rounded-full">
                    Evolution Matrix
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
                  {/* 筑基奇物 */}
                  {player.foundationTreasure ? (() => {
                    const treasure = FOUNDATION_TREASURES[player.foundationTreasure];
                    const effects = treasure?.effects || {};
                    const effectTexts: string[] = [];
                    if (effects.hpBonus) effectTexts.push(`HP +${effects.hpBonus}`);
                    if (effects.attackBonus) effectTexts.push(`FP +${effects.attackBonus}`);
                    if (effects.defenseBonus) effectTexts.push(`DR +${effects.defenseBonus}`);
                    if (effects.spiritBonus) effectTexts.push(`PER +${effects.spiritBonus}`);
                    if (effects.physiqueBonus) effectTexts.push(`END +${effects.physiqueBonus}`);
                    if (effects.speedBonus) effectTexts.push(`AGI +${effects.speedBonus}`);

                    return (
                      <HoverableCard
                        borderColor="border-blue-500"
                        className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 rounded-xl p-4 border-2 border-blue-600 shadow-md hover:shadow-lg transition-all duration-300 relative cursor-pointer"
                        tooltipContent={
                          <>
                            <div className="text-sm font-bold text-blue-300 mb-2">{treasure?.name}</div>
                            <div className="text-xs text-stone-400 mb-2">{treasure?.description}</div>
                            <div className="text-xs text-stone-300 space-y-1">
                              {effectTexts.map((text, idx) => (
                                <div key={idx} className="text-blue-300">{text}</div>
                              ))}
                              {effects.specialEffect && (
                                <div className="text-yellow-400 mt-2 border-t border-stone-700 pt-2">
                                  Special: {effects.specialEffect}
                                </div>
                              )}
                            </div>
                          </>
                        }
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <h4 className="text-base font-bold text-blue-300">Essential Gear</h4>
                        </div>
                        <div className="text-lg font-semibold text-blue-200 mb-1">
                          {treasure?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full inline-block mb-2">
                          {treasure?.rarity || 'Common'} Quality
                        </div>
                        {effectTexts.length > 0 && (
                          <div className="text-xs text-blue-300 space-y-1">
                            {effectTexts.slice(0, 3).map((text, idx) => (
                              <div key={idx}>{text}</div>
                            ))}
                            {effectTexts.length > 3 && (
                              <div className="text-blue-400">+{effectTexts.length - 3} more</div>
                            )}
                          </div>
                        )}
                      </HoverableCard>
                    );
                  })() : (
                    <div className="bg-gray-800/30 rounded-xl p-4 border-2 border-gray-600 opacity-60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <h4 className="text-base font-bold text-gray-400">Essential Gear</h4>
                      </div>
                      <div className="text-sm text-gray-500">None</div>
                    </div>
                  )}

                  {/* Golden Core Method Count */}
                  {(() => {
                    // Compatible with old saves: if no goldenCoreMethodCount, try to calculate
                    let methodCount = player.goldenCoreMethodCount;

                    // Check if player was ever in Golden Core realm (current realm is after Golden Core)
                    const currentRealmIndex = REALM_ORDER.indexOf(player.realm);
                    const goldenCoreRealmIndex = REALM_ORDER.indexOf(RealmType.GoldenCore);
                    const wasGoldenCore = currentRealmIndex > goldenCoreRealmIndex;
                    const isGoldenCore = currentRealmIndex === goldenCoreRealmIndex;

                    // If currently in Golden Core or was in Golden Core, but no method count, try to recalculate (only count Profound and above arts)
                    if (!methodCount && (isGoldenCore || wasGoldenCore)) {
                      methodCount = calculateGoldenCoreMethodCount(player);
                    }

                    // If there is a method count, display Golden Core Method Count
                    if (methodCount && methodCount > 0) {
                      const bonusMultiplier = getGoldenCoreBonusMultiplier(methodCount);
                      const bonusPercent = ((bonusMultiplier - 1) * 100).toFixed(0);
                      const difficulty = getGoldenCoreTribulationDifficulty(methodCount);
                      const methodTitle = getGoldenCoreMethodTitle(methodCount);

                      return (
                        <HoverableCard
                          borderColor="border-yellow-500"
                          className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 rounded-xl p-4 border-2 border-yellow-600 shadow-md hover:shadow-lg transition-all duration-300 relative cursor-pointer"
                          tooltipContent={
                            <>
                              <div className="text-sm font-bold text-yellow-300 mb-2">{methodTitle} Profile</div>
                              <div className="text-xs text-stone-300 space-y-1">
                                <div className="text-yellow-300">Hazard Difficulty: {difficulty.toFixed(1)}x</div>
                                <div className="text-green-300">Stat Multiplier: {bonusMultiplier.toFixed(1)}x</div>
                                <div className="text-green-300">Stat Bonus: +{bonusPercent}%</div>
                                <div className="text-stone-400 mt-2 pt-2 border-t border-stone-700">
                                  The more paths you follow, the greater the wasteland hazards, but the stronger your evolution becomes.
                                </div>
                              </div>
                            </>
                          }
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <h4 className="text-base font-bold text-yellow-300">Mutant Paths</h4>
                          </div>
                          <div className="text-2xl font-bold text-yellow-400 mb-1">
                            {methodTitle}
                          </div>
                          <div className="text-xs text-yellow-500 bg-yellow-900/30 px-2 py-1 rounded-full inline-block mb-2">
                            Hazard: {difficulty.toFixed(1)}x
                          </div>
                          {bonusMultiplier > 1 && (
                            <div className="text-xs text-green-300 space-y-0.5">
                              <div>Stat Bonus: +{bonusPercent}%</div>
                            </div>
                          )}
                        </HoverableCard>
                      );
                    }

                    // No paths, show un-evolved
                    return (
                      <div className="bg-gray-800/30 rounded-xl p-4 border-2 border-gray-600 opacity-60">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <h4 className="text-base font-bold text-gray-400">Mutant Paths</h4>
                        </div>
                        <div className="text-sm text-gray-500">None</div>
                      </div>
                    );
                  })()}

                  {/* Core Essence */}
                  {player.heavenEarthEssence ? (() => {
                    const essence = HEAVEN_EARTH_ESSENCES[player.heavenEarthEssence];
                    const effects = essence?.effects || {};
                    const effectTexts: string[] = [];
                    if (effects.hpBonus) effectTexts.push(`HP+${effects.hpBonus}`);
                    if (effects.attackBonus) effectTexts.push(`FP+${effects.attackBonus}`);
                    if (effects.defenseBonus) effectTexts.push(`DR+${effects.defenseBonus}`);
                    if (effects.spiritBonus) effectTexts.push(`PER+${effects.spiritBonus}`);
                    if (effects.physiqueBonus) effectTexts.push(`END+${effects.physiqueBonus}`);
                    if (effects.speedBonus) effectTexts.push(`AGI+${effects.speedBonus}`);

                    return (
                      <HoverableCard
                        borderColor="border-purple-500"
                        className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl p-4 border-2 border-purple-600 shadow-md hover:shadow-lg transition-all duration-300 relative cursor-pointer"
                        tooltipContent={
                          <>
                            <div className="text-sm font-bold text-purple-300 mb-2">{essence?.name}</div>
                            <div className="text-xs text-stone-400 mb-2">{essence?.description}</div>
                            <div className="text-xs text-stone-300 space-y-1">
                              <div className="text-purple-300">Quality: {essence?.quality || 0}</div>
                              {effectTexts.map((text, idx) => (
                                <div key={idx} className="text-purple-300">{text}</div>
                              ))}
                              {effects.specialEffect && (
                                <div className="text-yellow-400 mt-2 border-t border-stone-700 pt-2">
                                  Special Effect: {effects.specialEffect}
                                </div>
                              )}
                            </div>
                          </>
                        }
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <h4 className="text-base font-bold text-purple-300">Core Essence</h4>
                        </div>
                        <div className="text-lg font-semibold text-purple-200 mb-1">
                          {essence?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded-full inline-block mb-2">
                          Quality: {essence?.quality || 0}
                        </div>
                        {effectTexts.length > 0 && (
                          <div className="text-xs text-purple-300 space-y-1">
                            {effectTexts.slice(0, 3).map((text, idx) => (
                              <div key={idx}>{text}</div>
                            ))}
                            {effectTexts.length > 3 && (
                              <div className="text-purple-400">+{effectTexts.length - 3} more</div>
                            )}
                          </div>
                        )}
                      </HoverableCard>
                    );
                  })() : (
                    <div className="bg-gray-800/30 rounded-xl p-4 border-2 border-gray-600 opacity-60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <h4 className="text-base font-bold text-gray-400">Core Essence</h4>
                      </div>
                      <div className="text-sm text-gray-500">None</div>
                    </div>
                  )}

                  {/* Apex Marrow */}
                  {player.heavenEarthMarrow ? (() => {
                    const marrow = HEAVEN_EARTH_MARROWS[player.heavenEarthMarrow];
                    const effects = marrow?.effects || {};
                    const effectTexts: string[] = [];
                    if (effects.hpBonus) effectTexts.push(`气血+${effects.hpBonus}`);
                    if (effects.attackBonus) effectTexts.push(`攻击+${effects.attackBonus}`);
                    if (effects.defenseBonus) effectTexts.push(`防御+${effects.defenseBonus}`);
                    if (effects.spiritBonus) effectTexts.push(`神识+${effects.spiritBonus}`);
                    if (effects.physiqueBonus) effectTexts.push(`体魄+${effects.physiqueBonus}`);
                    if (effects.speedBonus) effectTexts.push(`速度+${effects.speedBonus}`);

                    return (
                      <HoverableCard
                        borderColor="border-red-500"
                        className="bg-gradient-to-br from-red-900/40 to-orange-900/40 rounded-xl p-4 border-2 border-red-600 shadow-md hover:shadow-lg transition-all duration-300 relative cursor-pointer"
                        tooltipContent={
                          <>
                            <div className="text-sm font-bold text-red-300 mb-2">{marrow?.name}</div>
                            <div className="text-xs text-stone-400 mb-2">{marrow?.description}</div>
                            <div className="text-xs text-stone-300 space-y-1">
                              <div className="text-red-300">Quality: {marrow?.quality || 0} | Process: {marrow?.refiningTime || 0} Days</div>
                              {player.marrowRefiningProgress !== undefined && (
                                <div className="text-red-300">Processing Progress: {player.marrowRefiningProgress}%</div>
                              )}
                              {effectTexts.map((text, idx) => (
                                <div key={idx} className="text-red-300">{text}</div>
                              ))}
                              {effects.specialEffect && (
                                <div className="text-yellow-400 mt-2 border-t border-stone-700 pt-2">
                                  Special Effect: {effects.specialEffect}
                                </div>
                              )}
                            </div>
                          </>
                        }
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <h4 className="text-base font-bold text-red-300">Apex Marrow</h4>
                        </div>
                        <div className="text-lg font-semibold text-red-200 mb-1">
                          {marrow?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-red-400 bg-red-900/30 px-2 py-1 rounded-full inline-block mb-2">
                          Quality: {marrow?.quality || 0}
                          {player.marrowRefiningProgress && player.marrowRefiningProgress > 0 && (
                            <span> - Progress: {player.marrowRefiningProgress}%</span>
                          )}
                        </div>
                        {effectTexts.length > 0 && (
                          <div className="text-xs text-red-300 space-y-1">
                            {effectTexts.slice(0, 3).map((text, idx) => (
                              <div key={idx}>{text}</div>
                            ))}
                            {effectTexts.length > 3 && (
                              <div className="text-red-400">+{effectTexts.length - 3} more</div>
                            )}
                          </div>
                        )}
                        {/* Processing progress bar and feed button */}
                        {player.marrowRefiningProgress !== undefined && player.marrowRefiningProgress < 100 && (
                          <div className="mt-3 space-y-2">
                            <div className="w-full bg-red-900/30 rounded-full h-2">
                              <div
                                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${player.marrowRefiningProgress}%` }}
                              ></div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMarrowFeedModal(true);
                              }}
                              className="w-full px-3 py-2 bg-red-800 hover:bg-red-700 text-red-200 text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Beaker size={14} />
                              Process Materials to Advance
                            </button>
                          </div>
                        )}
                      </HoverableCard>
                    );
                  })() : (
                    <div className="bg-gray-800/30 rounded-xl p-4 border-2 border-gray-600 opacity-60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <h4 className="text-base font-bold text-gray-400">Apex Marrow</h4>
                      </div>
                      <div className="text-sm text-gray-500">None</div>
                    </div>
                  )}

                  {/* Ruin Guardian Challenge */}
                  {player.daoCombiningChallenged ? (
                    <div className="bg-gradient-to-br from-indigo-900/40 to-violet-900/40 rounded-xl p-4 border-2 border-indigo-600 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                        <h4 className="text-base font-bold text-indigo-300">Guardian Challenge</h4>
                      </div>
                      <div className="text-lg font-semibold text-indigo-200 mb-1">
                        Challenge Complete
                      </div>
                      <div className="text-xs text-indigo-400 bg-indigo-900/30 px-2 py-1 rounded-full inline-block">
                        Ready for Transcendence
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/30 rounded-xl p-4 border-2 border-gray-600 opacity-60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <h4 className="text-base font-bold text-gray-400">Guardian Challenge</h4>
                      </div>
                      <div className="text-sm text-gray-500">Not Challenged</div>
                    </div>
                  )}


                  {/* Wasteland Laws */}
                  {player.longevityRules && player.longevityRules.length > 0 ? (
                    <HoverableCard
                      borderColor="border-green-500"
                      width="w-72"
                      className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 rounded-xl p-4 border-2 border-green-600 shadow-md hover:shadow-lg transition-all duration-300 relative cursor-pointer"
                      tooltipContent={
                        <div className="max-h-96 overflow-y-auto">
                          <div className="text-sm font-bold text-green-300 mb-3">Wasteland Laws Details</div>
                          {player.longevityRules.map((ruleId, idx) => {
                            const rule = LONGEVITY_RULES[ruleId];
                            if (!rule) return null;
                            const effects = rule.effects || {};
                            const effectTexts: string[] = [];
                            if (effects.hpPercent) effectTexts.push(`HP+${(effects.hpPercent * 100).toFixed(0)}%`);
                            if (effects.attackPercent) effectTexts.push(`FP+${(effects.attackPercent * 100).toFixed(0)}%`);
                            if (effects.defensePercent) effectTexts.push(`DR+${(effects.defensePercent * 100).toFixed(0)}%`);
                            if (effects.spiritPercent) effectTexts.push(`PER+${(effects.spiritPercent * 100).toFixed(0)}%`);
                            if (effects.physiquePercent) effectTexts.push(`END+${(effects.physiquePercent * 100).toFixed(0)}%`);
                            if (effects.speedPercent) effectTexts.push(`AGI+${(effects.speedPercent * 100).toFixed(0)}%`);

                            return (
                              <div key={ruleId} className={`mb-3 ${idx > 0 ? 'border-t border-stone-700 pt-3' : ''}`}>
                                <div className="text-xs font-bold text-green-300 mb-1">{rule.name}</div>
                                <div className="text-xs text-stone-400 mb-1">{rule.description}</div>
                                <div className="text-xs text-stone-500 mb-1">Power: {rule.power}</div>
                                {effectTexts.length > 0 && (
                                  <div className="text-xs text-green-300 space-y-0.5">
                                    {effectTexts.map((text, i) => (
                                      <div key={i}>{text}</div>
                                    ))}
                                  </div>
                                )}
                                {effects.specialEffect && (
                                  <div className="text-xs text-yellow-400 mt-1">
                                    Special: {effects.specialEffect}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      }
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <h4 className="text-base font-bold text-green-300">Wasteland Laws</h4>
                      </div>
                      <div className="text-sm text-green-200 mb-1">
                        {player.longevityRules.map(ruleId =>
                          LONGEVITY_RULES[ruleId]?.name || 'Unknown'
                        ).join(', ')}
                      </div>
                      <div className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded-full inline-block">
                        Mastered: {player.longevityRules.length}/{player.maxLongevityRules || 3}
                      </div>
                    </HoverableCard>
                  ) : (
                    <div className="bg-gray-800/30 rounded-xl p-4 border-2 border-gray-600 opacity-60">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <h4 className="text-base font-bold text-gray-400">Wasteland Laws</h4>
                      </div>
                      <div className="text-sm text-gray-500">None</div>
                    </div>
                  )}

                </div>
              </div>

              {/* Legacy System */}
              <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded p-4 border-2 border-purple-500">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                  <Sparkles className="text-purple-400" size={20} />
                  Legacy System
                </h3>

                {player.inheritanceLevel > 0 ? (
                  <div>
                    <p className="text-sm text-stone-300 mb-3">
                      Legacy Rank:{' '}
                      <span className="font-bold text-purple-300">
                        {player.inheritanceLevel}
                      </span>{' '}
                      / 4
                    </p>
                    <p className="text-xs text-stone-400 mb-3">
                      Legacy rank is earned through explorations and used for tier evolution.
                    </p>
                    {onUseInheritance && (
                      <button
                        onClick={onUseInheritance}
                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded border border-purple-400 font-bold text-white transition-all"
                      >
                        Use Legacy Data to Evolve
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-stone-400 mb-3">
                    No legacy data collected yet. Earn it through explorations.
                  </p>
                )}
              </div>

              {/* Attribute Details Panel */}
              <div className="bg-stone-900 rounded p-4 border border-stone-700">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Info className="text-blue-400" size={20} />
                    Character Attributes
                  </h3>
                  <button
                    onClick={() => setShowAttributeDetails(!showAttributeDetails)}
                    className="text-xs text-stone-400 hover:text-stone-300"
                  >
                    {showAttributeDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-stone-400">FP:</span>{' '}
                    <span className="text-red-400 font-bold">
                      {totalStats.attack}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400">DR:</span>{' '}
                    <span className="text-blue-400 font-bold">
                      {totalStats.defense}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400">HP:</span>{' '}
                    <span className="text-green-400 font-bold">
                      {player.hp}/{totalStats.maxHp}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400">PER:</span>{' '}
                    <span className="text-purple-400 font-bold">
                      {totalStats.spirit}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400">END:</span>{' '}
                    <span className="text-orange-400 font-bold">
                      {totalStats.physique}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400">AGI:</span>{' '}
                    <span className="text-yellow-400 font-bold">
                      {totalStats.speed}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400">Rep:</span>{' '}
                    <span className="text-mystic-gold font-bold">
                      {player.reputation || 0}
                    </span>
                  </div>
                </div>
                {showAttributeDetails && (
                  <div className="mt-3 pt-3 border-t border-stone-700 text-xs space-y-1">
                    <div className="text-stone-500 mb-2">Attribute Source Breakdown:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-stone-400">Base:</span> FP{' '}
                        {attributeSources.base.attack}, DR{' '}
                        {attributeSources.base.defense}, HP{' '}
                        {attributeSources.base.hp}
                      </div>
                      <div>
                        <span className="text-stone-400">Traits:</span> FP{' '}
                        {currentTalent?.effects.attack || 0}, DR{' '}
                        {currentTalent?.effects.defense || 0}, HP{' '}
                        {currentTalent?.effects.hp || 0}
                      </div>
                      <div>
                        <span className="text-stone-400">Rank:</span> FP{' '}
                        {attributeSources.title.attack}, DR{' '}
                        {attributeSources.title.defense}, HP{' '}
                        {attributeSources.title.hp}
                      </div>
                      <div>
                        <span className="text-stone-400">Mods:</span> FP{' '}
                        {attributeSources.art.attack}, DR{' '}
                        {attributeSources.art.defense}, HP {attributeSources.art.hp}
                      </div>
                      <div>
                        <span className="text-stone-400">Legacy:</span> FP{' '}
                        {attributeSources.inheritance.attack}, DR{' '}
                        {attributeSources.inheritance.defense}, HP {attributeSources.inheritance.hp}
                      </div>
                      <div>
                        <span className="text-stone-400">Gear:</span> FP{' '}
                        {attributeSources.equipment.attack}, DR{' '}
                        {attributeSources.equipment.defense}, HP{' '}
                        {attributeSources.equipment.hp}
                      </div>
                      <div className="col-span-2 text-blue-400">
                        <span className="text-stone-400 text-xs">Active Neural Mod:</span> FP{' '}
                        {attributeSources.activeArt.attack}, DR{' '}
                        {attributeSources.activeArt.defense}, HP{' '}
                        {attributeSources.activeArt.hp}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Attribute Allocation */}
              {player.attributePoints > 0 && (
                <div className="bg-stone-900 rounded p-4 border border-stone-700">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Star className="text-yellow-400" size={20} />
                    Unspent SPECIAL Points: {player.attributePoints}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => onAllocateAttribute('attack')}
                        className="flex-1 px-3 py-2 text-sm bg-red-900 hover:bg-red-800 rounded border border-red-700"
                      >
                        <div className="text-xs text-stone-400">FP</div>
                        <div className="text-sm">{formatValueChange(totalStats.attack, totalStats.attack + attributeGains.attack)}</div>
                        <div className="text-xs text-yellow-300">+{attributeGains.attack}</div>
                      </button>
                      {onAllocateAllAttributes && (
                        <button
                          onClick={() => handleAllocateAllWithConfirm('attack')}
                          className="px-2 py-2 text-sm bg-red-800 hover:bg-red-700 rounded border border-red-600 flex items-center justify-center"
                          title={`Allocate all ${player.attributePoints} points to Firepower`}
                        >
                          <Zap size={16} />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onAllocateAttribute('defense')}
                        className="flex-1 px-3 py-2 text-sm bg-blue-900 hover:bg-blue-800 rounded border border-blue-700"
                      >
                        <div className="text-xs text-stone-400">DR</div>
                        <div className="text-sm">{formatValueChange(totalStats.defense, totalStats.defense + attributeGains.defense)}</div>
                        <div className="text-xs text-yellow-300">+{attributeGains.defense}</div>
                      </button>
                      {onAllocateAllAttributes && (
                        <button
                          onClick={() => handleAllocateAllWithConfirm('defense')}
                          className="px-2 py-2 text-sm bg-blue-800 hover:bg-blue-700 rounded border border-blue-600 flex items-center justify-center"
                          title={`Allocate all ${player.attributePoints} points to Dmg Resist`}
                        >
                          <Zap size={16} />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onAllocateAttribute('hp')}
                        className="flex-1 px-3 py-2 text-sm bg-green-900 hover:bg-green-800 rounded border border-green-700"
                      >
                        <div className="text-xs text-stone-400">HP</div>
                        <div className="text-sm">{formatValueChange(totalStats.maxHp, totalStats.maxHp + attributeGains.hp)}</div>
                        <div className="text-xs text-yellow-300">+{attributeGains.hp}</div>
                      </button>
                      {onAllocateAllAttributes && (
                        <button
                          onClick={() => handleAllocateAllWithConfirm('hp')}
                          className="px-2 py-2 text-sm bg-green-800 hover:bg-green-700 rounded border border-green-600 flex items-center justify-center"
                          title={`Allocate all ${player.attributePoints} points to Hit Points`}
                        >
                          <Zap size={16} />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onAllocateAttribute('spirit')}
                        className="flex-1 px-3 py-2 text-sm bg-purple-900 hover:bg-purple-800 rounded border border-purple-700"
                      >
                        <div className="text-xs text-stone-400">PER</div>
                        <div className="text-sm">{formatValueChange(totalStats.spirit, totalStats.spirit + attributeGains.spirit)}</div>
                        <div className="text-xs text-yellow-300">+{attributeGains.spirit}</div>
                      </button>
                      {onAllocateAllAttributes && (
                        <button
                          onClick={() => handleAllocateAllWithConfirm('spirit')}
                          className="px-2 py-2 text-sm bg-purple-800 hover:bg-purple-700 rounded border border-purple-600 flex items-center justify-center"
                          title={`Allocate all ${player.attributePoints} points to Perception`}
                        >
                          <Zap size={16} />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onAllocateAttribute('physique')}
                        className="flex-1 px-3 py-2 text-sm bg-orange-900 hover:bg-orange-800 rounded border border-orange-700"
                      >
                        <div className="text-xs text-stone-400">END</div>
                        <div className="text-sm">{formatValueChange(totalStats.physique, totalStats.physique + attributeGains.physique)}</div>
                        <div className="text-xs text-yellow-300">+{attributeGains.physique}</div>
                      </button>
                      {onAllocateAllAttributes && (
                        <button
                          onClick={() => handleAllocateAllWithConfirm('physique')}
                          className="px-2 py-2 text-sm bg-orange-800 hover:bg-orange-700 rounded border border-orange-600 flex items-center justify-center"
                          title={`Allocate all ${player.attributePoints} points to Endurance`}
                        >
                          <Zap size={16} />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onAllocateAttribute('speed')}
                        className="flex-1 px-3 py-2 text-sm bg-yellow-900 hover:bg-yellow-800 rounded border border-yellow-700"
                      >
                        <div className="text-xs text-stone-400">AGI</div>
                        <div className="text-sm">{formatValueChange(totalStats.speed, totalStats.speed + attributeGains.speed)}</div>
                        <div className="text-xs text-yellow-300">+{attributeGains.speed}</div>
                      </button>
                      {onAllocateAllAttributes && (
                        <button
                          onClick={() => handleAllocateAllWithConfirm('speed')}
                          className="px-2 py-2 text-sm bg-yellow-800 hover:bg-yellow-700 rounded border border-yellow-600 flex items-center justify-center"
                          title={`Allocate all ${player.attributePoints} points to Agility`}
                        >
                          <Zap size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Traits Display (Immutable) */}
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <Star className="text-purple-400" size={20} />
                  Traits
                </h3>
                {currentTalent ? (
                  <div className="bg-stone-900 rounded p-4 border border-stone-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`font-bold ${getRarityTextColor(currentTalent.rarity as ItemRarity)}`}
                          >
                            {currentTalent.name}
                          </span>
                          <span className="text-xs text-stone-500">
                            ({currentTalent.rarity})
                          </span>
                        </div>
                        <p className="text-sm text-stone-400 mb-2">
                          {currentTalent.description}
                        </p>
                        <div className="text-xs text-stone-500 italic">
                          * Traits are randomly generated at the start and cannot be changed.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-stone-900 rounded p-4 border border-stone-700">
                    <p className="text-stone-500">No Traits Selected</p>
                  </div>
                )}
              </div>

              {/* Title System */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Award className="text-yellow-400" size={20} />
                    Title System
                    {unlockedTitles.length > 0 && (
                      <span className="text-xs text-stone-500">
                        ({unlockedTitles.length}/{TITLES.length})
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() => setShowTitleDetails(!showTitleDetails)}
                    className="text-xs text-stone-400 hover:text-stone-300"
                  >
                    {showTitleDetails ? 'Collapse' : 'Expand'}
                  </button>
                </div>

                {/* Currently Equipped Title */}
                {currentTitle ? (
                  <div className="bg-stone-900 rounded p-4 border-2 border-yellow-500/50 mb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`font-bold ${getRarityTextColor((currentTitle.rarity || '普通') as ItemRarity)}`}>
                            {currentTitle.name}
                          </span>
                          {currentTitle.rarity && (
                            <span className="text-xs text-stone-500">({currentTitle.rarity})</span>
                          )}
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                            Equipped
                          </span>
                        </div>
                        <p className="text-sm text-stone-400 mb-1">
                          {currentTitle.description}
                        </p>
                        <p className="text-xs text-stone-500 mb-2">
                          Requirement: {currentTitle.requirement}
                        </p>

                        {/* Title Effects */}
                        <div className="text-xs text-stone-400 space-y-1 mb-2">
                          {titleEffects.attack > 0 && <div>FP +{titleEffects.attack}</div>}
                          {titleEffects.defense > 0 && <div>DR +{titleEffects.defense}</div>}
                          {titleEffects.hp > 0 && <div>HP +{titleEffects.hp}</div>}
                          {titleEffects.spirit > 0 && <div>PER +{titleEffects.spirit}</div>}
                          {titleEffects.physique > 0 && <div>END +{titleEffects.physique}</div>}
                          {titleEffects.speed > 0 && <div>AGI +{titleEffects.speed}</div>}
                          {titleEffects.expRate > 0 && <div>Training Rate +{(titleEffects.expRate * 100).toFixed(0)}%</div>}
                          {titleEffects.luck > 0 && <div>Luck +{titleEffects.luck}</div>}
                        </div>

                        {/* Set Bonus */}
                        {activeSetEffects.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-yellow-500/30">
                            {activeSetEffects.map((setEffect) => (
                              <div key={setEffect.setName} className="text-xs">
                                <div className="flex items-center gap-1 mb-1">
                                  <Sparkles size={12} className="text-yellow-400" />
                                  <span className="font-bold text-yellow-400">Set Bonus: {setEffect.setName}</span>
                                </div>
                                <p className="text-stone-400 mb-1">{setEffect.description}</p>
                                <div className="text-stone-400 space-y-1">
                                  {setEffect.effects.attack > 0 && <div>FP +{setEffect.effects.attack}</div>}
                                  {setEffect.effects.defense > 0 && <div>DR +{setEffect.effects.defense}</div>}
                                  {setEffect.effects.hp > 0 && <div>HP +{setEffect.effects.hp}</div>}
                                  {setEffect.effects.spirit > 0 && <div>PER +{setEffect.effects.spirit}</div>}
                                  {setEffect.effects.speed > 0 && <div>AGI +{setEffect.effects.speed}</div>}
                                  {setEffect.effects.expRate > 0 && <div>Training Rate +{(setEffect.effects.expRate * 100).toFixed(0)}%</div>}
                                  {setEffect.effects.luck > 0 && <div>Luck +{setEffect.effects.luck}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-stone-900 rounded p-4 border border-stone-700 mb-3">
                    <p className="text-stone-500">No title equipped</p>
                  </div>
                )}

                {/* Unlocked Titles List */}
                {showTitleDetails && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-stone-400 mb-2">Unlocked Titles</h4>
                    <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 gap-2 max-h-80">
                      {unlockedTitles.map((title) => {
                        const isEquipped = title.id === player.titleId;
                        const isPartOfSet = title.setGroup && TITLE_SET_EFFECTS.some(se =>
                          se.titles.includes(title.id) &&
                          se.titles.every(tid => (player.unlockedTitles || []).includes(tid))
                        );

                        return (
                          <button
                            key={title.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isEquipped && onSelectTitle) {
                                onSelectTitle(title.id);
                              }
                            }}
                            disabled={isEquipped}
                            className={`text-left rounded p-3 border transition-colors ${isEquipped
                              ? 'bg-yellow-900/30 border-yellow-500 cursor-default opacity-60'
                              : 'bg-stone-900 hover:bg-stone-700 border-stone-700 cursor-pointer'
                              }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-bold ${getRarityTextColor((title.rarity || '普通') as ItemRarity)}`}>
                                    {title.name}
                                  </span>
                                  {title.rarity && (
                                    <span className="text-xs text-stone-500">({title.rarity})</span>
                                  )}
                                  {title.category && (
                                    <span className="text-xs text-stone-500">[{title.category}]</span>
                                  )}
                                  {isEquipped && (
                                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                      Equipped
                                    </span>
                                  )}
                                  {isPartOfSet && !isEquipped && (
                                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                                      Set Piece Ready
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-stone-400 mb-1">
                                  {title.description}
                                </p>
                                <p className="text-xs text-stone-500">
                                  {title.requirement}
                                </p>
                              </div>
                              {!isEquipped && (
                                <div className="ml-2 text-xs text-yellow-400">
                                  Click to Equip
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}

                      {unlockedTitles.length === 0 && (
                        <div className="text-center text-stone-500 py-4">
                          No titles unlocked yet.
                        </div>
                      )}
                    </div>

                    {/* Unlocked Titles (Optional View) */}
                    {TITLES.filter(t => !(player.unlockedTitles || []).includes(t.id)).length > 0 && (
                      <details className="mt-4">
                        <summary className="text-sm font-bold text-stone-400 cursor-pointer mb-2">
                          Available Titles ({TITLES.filter(t => !(player.unlockedTitles || []).includes(t.id)).length})
                        </summary>
                        <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 gap-2 max-h-60 mt-2">
                          {TITLES.filter(t => !unlockedTitles.map(ut => ut.id).includes(t.id)).map((title) => {
                            const isMet = checkTitleRequirement(title, player);
                            return (
                              <div
                                key={title.id}
                                className={`bg-stone-900/50 rounded p-3 border ${isMet ? 'border-green-600 opacity-100' : 'border-stone-800 opacity-60'}`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-bold ${getRarityTextColor((title.rarity || '普通') as ItemRarity)}`}>
                                    {title.name}
                                  </span>
                                  {title.rarity && (
                                    <span className="text-xs text-stone-500">({title.rarity})</span>
                                  )}
                                  {isMet && (
                                    <span className="text-xs text-green-400 font-bold">✓ Ready to Unlock</span>
                                  )}
                                </div>
                                <p className="text-xs text-stone-500">{title.requirement}</p>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Statistics Panel */}
              <div className="space-y-4">
                {/* Basic Statistics */}
                <div className="bg-stone-900 rounded p-4 border border-stone-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="text-blue-400" size={20} />
                    Core Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Days Survived
                      </div>
                      <div className="text-xl font-bold text-mystic-gold">
                        {statistics.gameDays}
                      </div>
                    </div>
                    {gameDuration && (
                      <div className="bg-stone-800 rounded p-3 border border-stone-700">
                        <div className="text-stone-400 text-xs mb-1">
                          Play Time
                        </div>
                        <div className="text-xl font-bold text-blue-400">
                          {gameDuration}
                        </div>
                      </div>
                    )}
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Current Rank
                      </div>
                      <div className="text-xl font-bold text-purple-400">
                        {(() => {
                          // If it's Mutant (formerly Golden Core), show path number
                          if (player.realm === 'Mutant' && player.goldenCoreMethodCount) {
                            const methodTitle = getGoldenCoreMethodTitle(player.goldenCoreMethodCount);
                            return `${methodTitle} ${player.realmLevel}`;
                          }
                          return `${player.realm} ${player.realmLevel}`;
                        })()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Rank Progress
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-stone-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${statistics.realmProgress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-purple-400">
                          {statistics.realmProgress.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Current Experience
                      </div>
                      <div className="text-xl font-bold text-green-400">
                        {player.exp.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        / {player.maxExp.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Bottle Caps
                      </div>
                      <div className="text-xl font-bold text-yellow-400">
                        {player.spiritStones.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 战斗统计 */}
                <div className="bg-stone-900 rounded p-4 border border-stone-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="text-red-400" size={20} />
                    Combat Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Hostiles Terminated
                      </div>
                      <div className="text-xl font-bold text-red-400">
                        {statistics.killCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Explorations
                      </div>
                      <div className="text-xl font-bold text-orange-400">
                        {statistics.adventureCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Vault/Ruin Delves
                      </div>
                      <div className="text-xl font-bold text-purple-400">
                        {statistics.secretRealmCount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 修炼统计 */}
                <div className="bg-stone-900 rounded p-4 border border-stone-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Star className="text-yellow-400" size={20} />
                    Training Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Resting Sessions
                      </div>
                      <div className="text-xl font-bold text-blue-400">
                        {statistics.meditateCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Evolution Count
                      </div>
                      <div className="text-xl font-bold text-purple-400">
                        {statistics.breakthroughCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Neural Mods Installed
                      </div>
                      <div className="text-xl font-bold text-green-400">
                        {statistics.learnedArtsCount} /{' '}
                        {statistics.unlockedArtsCount}
                      </div>
                      <div className="text-xs text-stone-500">
                        Installed / Discovered
                      </div>
                    </div>
                  </div>
                </div>

                {/* 收集统计 */}
                <div className="bg-stone-900 rounded p-4 border border-stone-700">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Award className="text-yellow-400" size={20} />
                    Asset Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Creatures Tamed
                      </div>
                      <div className="text-xl font-bold text-pink-400">
                        {statistics.petCount.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        Active Pets: {player.pets.length}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Gear Equipped
                      </div>
                      <div className="text-xl font-bold text-cyan-400">
                        {statistics.equipCount.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        Currently Wearing: {statistics.totalEquippedItems}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Schematics Unlocked
                      </div>
                      <div className="text-xl font-bold text-emerald-400">
                        {statistics.recipeCount.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        Owned: {(player.unlockedRecipes || []).length}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Inventory Items
                      </div>
                      <div className="text-xl font-bold text-stone-300">
                        {statistics.totalInventoryItems.toLocaleString()}
                      </div>
                      <div className="text-xs text-stone-500">
                        Unique Items: {player.inventory.length}
                      </div>
                    </div>
                    <div className="bg-stone-800 rounded p-3 border border-stone-700">
                      <div className="text-stone-400 text-xs mb-1">
                        Achievements Completed
                      </div>
                      <div className="text-xl font-bold text-yellow-400">
                        {player.achievements.length} / {ACHIEVEMENTS.length}
                      </div>
                      <div className="text-xs text-stone-500">
                        {(
                          (player.achievements.length / ACHIEVEMENTS.length) *
                          100
                        ).toFixed(1)}
                        % Completion
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 天地之髓投喂模态框 */}
      {showMarrowFeedModal && player.heavenEarthMarrow && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001] p-4"
          onClick={() => setShowMarrowFeedModal(false)}
        >
          <div
            className="bg-stone-800 rounded-lg border-2 border-red-600 shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-stone-800 border-b border-red-600 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-red-300 flex items-center gap-2">
                <Beaker size={20} />
                Process Materials to Advance Research
              </h3>
              <button
                onClick={() => setShowMarrowFeedModal(false)}
                className="text-stone-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4 text-sm text-stone-300">
                <p>Select materials to process into Apex Marrow. Progress depends on material rarity:</p>
                <ul className="mt-2 space-y-1 text-xs text-stone-400">
                  <li>• Common: +1-2% Progress</li>
                  <li>• Rare: +3-5% Progress</li>
                  <li>• Legendary: +6-10% Progress</li>
                  <li>• Apex: +15-25% Progress</li>
                </ul>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                {player.inventory
                  .filter((item) => {
                    // 只显示未装备的物品
                    const isEquipped = Object.values(player.equippedItems).includes(item.id);
                    return !isEquipped && item.quantity > 0;
                  })
                  .map((item) => {
                    const rarity = item.rarity || '普通';
                    // 从缓存中获取进度值，避免每次渲染时重新计算
                    const progressGain = itemProgressCache[item.id] || 0;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (!player.heavenEarthMarrow) return;

                          const currentProgress = player.marrowRefiningProgress || 0;
                          const newProgress = Math.min(100, currentProgress + progressGain);

                          setPlayer((prev) => {
                            if (!prev) return prev;
                            const newInventory = prev.inventory.map((i) =>
                              i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
                            ).filter((i) => i.quantity > 0);

                            const marrow = HEAVEN_EARTH_MARROWS[prev.heavenEarthMarrow!];
                            const isCompleted = newProgress >= 100;

                            if (addLog) {
                              if (isCompleted) {
                                addLog(`✨ Apex Marrow [${marrow?.name || 'Marrow'}] research complete! Full stat bonuses applied!`);
                              } else {
                                addLog(`Processed [${item.name}]. Progress +${progressGain}% (${currentProgress}% → ${newProgress}%)`);
                              }
                            }

                            return {
                              ...prev,
                              inventory: newInventory,
                              marrowRefiningProgress: newProgress,
                            };
                          });

                          if (newProgress >= 100) {
                            setShowMarrowFeedModal(false);
                          }
                        }}
                        className="p-3 bg-stone-700 hover:bg-stone-600 rounded border-2 border-stone-600 hover:border-red-500 transition-all text-left"
                      >
                        <div className="text-xs font-bold mb-1" style={{ color: getRarityTextColor(rarity) }}>
                          {item.name}
                        </div>
                        <div className="text-xs text-stone-400 mb-1">Qty: {item.quantity}</div>
                        <div className="text-xs text-green-400">+{progressGain}% Progress</div>
                      </button>
                    );
                  })}
              </div>
              {player.inventory.filter((item) => {
                const isEquipped = Object.values(player.equippedItems).includes(item.id);
                return !isEquipped && item.quantity > 0;
              }).length === 0 && (
                  <div className="text-center py-8 text-stone-400">
                    No processable items in inventory.
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CharacterModal);
