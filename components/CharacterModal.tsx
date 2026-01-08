import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Award, Info, Zap, BarChart3, TrendingUp, Sparkles, BookOpen, Users, Beaker, Package } from 'lucide-react';
import { ASSETS } from '../constants/assets';
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
}> = ({ children, tooltipContent, borderColor = 'border-stone-800', width = 'w-64', className = '' }) => {
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
          className={`fixed ${width} bg-ink-950 border border-stone-800 rounded-none p-4 shadow-2xl z-[10000] pointer-events-none transition-opacity duration-200 font-mono relative overflow-hidden`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {/* 背景纹理层 */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
          />
          {/* CRT 扫描线效果 */}
          <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50" />
          
          <div className="relative z-10">
            {tooltipContent}
          </div>
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
}> = ({ children, targetRef, isVisible, borderColor = 'border-stone-800', width = 'w-64' }) => {
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
      className={`fixed ${width} bg-ink-950 border-2 ${borderColor} rounded-none p-3 shadow-xl z-[10000] pointer-events-none transition-opacity duration-200 font-mono relative overflow-hidden`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* 背景纹理层 */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
      {/* CRT 扫描线效果 */}
      <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
      <div className="relative z-10">
        {children}
      </div>
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation crt-screen"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 rounded-none border-0 md:border border-stone-800 shadow-2xl w-full h-[80vh] md:h-auto md:max-w-2xl md:max-h-[90vh] flex flex-col overflow-hidden font-mono relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景纹理层 */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
        />
        {/* CRT 扫描线效果 */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50" />
        <div className="absolute inset-0 bg-crt-noise opacity-[0.02] pointer-events-none z-50" />
        
        <div className="p-3 md:p-4 border-b border-stone-800 bg-ink-950 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-500 animate-pulse"></div>
            <h2 className="text-lg md:text-xl font-mono text-amber-400 uppercase tracking-[0.2em]">
              SPECIAL PROFILE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-stone-500 hover:text-red-500 hover:bg-red-950/10 transition-all border border-stone-800 hover:border-red-900/50 relative group overflow-hidden"
            aria-label="CLOSE"
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <X size={20} className="relative z-10" />
          </button>
        </div>
        {/* Tab Switcher */}
        <div className="flex border-b border-stone-800 bg-ink-950 relative z-10">
          <button
            onClick={() => setActiveTab('character')}
            className={`flex-1 px-4 py-3 text-xs font-bold transition-all uppercase tracking-[0.2em] border-r border-stone-800/50 relative group overflow-hidden ${activeTab === 'character'
              ? 'bg-stone-900/50 text-amber-400'
              : 'text-stone-600 hover:text-stone-400 hover:bg-stone-900/30'
              }`}
          >
            <div 
              className={`absolute inset-0 opacity-[0.03] transition-opacity ${activeTab === 'character' ? 'opacity-[0.05]' : 'opacity-0 group-hover:opacity-[0.02]'}`}
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <div className="flex items-center justify-center gap-2 relative z-10">
              <Info size={14} />
              PROFILE INFO
            </div>
            {activeTab === 'character' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.45)]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex-1 px-4 py-3 text-xs font-bold transition-all uppercase tracking-[0.2em] relative group overflow-hidden ${activeTab === 'statistics'
              ? 'bg-stone-900/50 text-amber-400'
              : 'text-stone-600 hover:text-stone-400 hover:bg-stone-900/30'
              }`}
          >
            <div 
              className={`absolute inset-0 opacity-[0.03] transition-opacity ${activeTab === 'statistics' ? 'opacity-[0.05]' : 'opacity-0 group-hover:opacity-[0.02]'}`}
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <div className="flex items-center justify-center gap-2 relative z-10">
              <BarChart3 size={14} />
              STATISTICS
            </div>
            {activeTab === 'statistics' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.45)]" />
            )}
          </button>
        </div>

        <div className="modal-scroll-container modal-scroll-content p-6 space-y-8 bg-ink-950 relative z-10">
          {activeTab === 'character' ? (
            <>
              {/* Evolution System Info */}
              <div className="bg-ink-950/50 rounded-none p-6 border border-stone-800 shadow-xl relative overflow-hidden" style={{ overflow: 'visible' }}>
                <div 
                  className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                  style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                />
                <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none"></div>
                
                <div className="flex justify-between items-center mb-6 border-b border-stone-800/50 pb-4 relative z-10">
                  <h3 className="text-sm font-mono flex items-center gap-3 uppercase tracking-[0.2em] text-blue-400">
                    <TrendingUp size={18} className="animate-pulse" />
                    NEURAL MODS CONFIG
                  </h3>
                  <div className="text-[10px] text-blue-500 bg-blue-950/20 px-3 py-1 rounded-none border border-blue-900/40 uppercase tracking-widest font-mono">
                    Evolution Matrix v2.4
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
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
                        className="bg-ink-950 rounded-none p-4 border border-blue-900/30 shadow-md hover:border-blue-400/50 transition-all duration-300 relative cursor-pointer group overflow-hidden"
                        tooltipContent={
                          <div className="relative font-mono">
                            <div className="text-sm font-bold text-blue-400 mb-2 uppercase tracking-[0.2em] border-b border-blue-900/30 pb-1">{treasure?.name}</div>
                            <div className="text-[10px] text-stone-500 mb-3 leading-relaxed uppercase tracking-tight">{treasure?.description}</div>
                            <div className="space-y-1">
                              {effectTexts.map((text, idx) => (
                                <div key={idx} className="text-[10px] text-blue-300 font-mono flex items-center gap-2 uppercase tracking-tighter">
                                  <div className="w-1 h-1 bg-blue-500/50"></div>
                                  {text}
                                </div>
                              ))}
                              {effects.specialEffect && (
                                <div className="text-[10px] text-amber-400 mt-2 border-t border-stone-800/50 pt-2 font-mono italic uppercase tracking-widest">
                                  MOD: {effects.specialEffect}
                                </div>
                              )}
                            </div>
                          </div>
                        }
                      >
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                          style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                        />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-1.5 bg-blue-500 animate-pulse"></div>
                            <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">ESSENTIAL GEAR</h4>
                          </div>
                          <div className="text-sm font-bold text-blue-100 mb-1 uppercase tracking-tight">
                            {treasure?.name || 'Unknown'}
                          </div>
                          <div className="text-[9px] text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded-none inline-block mb-3 border border-blue-900/40 font-mono uppercase tracking-tighter">
                            {treasure?.rarity || 'Common'} QUALITY
                          </div>
                          {effectTexts.length > 0 && (
                            <div className="space-y-1 font-mono">
                              {effectTexts.slice(0, 3).map((text, idx) => (
                                <div key={idx} className="text-[10px] text-blue-300/80 uppercase tracking-tighter">{text}</div>
                              ))}
                              {effectTexts.length > 3 && (
                                <div className="text-[9px] text-blue-500 uppercase tracking-tighter mt-1">+{effectTexts.length - 3} ADDITIONAL</div>
                              )}
                            </div>
                          )}
                        </div>
                      </HoverableCard>
                    );
                  })() : (
                    <div className="bg-ink-950 rounded-none p-4 border border-stone-800/50 opacity-40 grayscale relative overflow-hidden">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 bg-stone-600"></div>
                        <h4 className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">ESSENTIAL GEAR</h4>
                      </div>
                      <div className="text-sm font-bold text-stone-700 uppercase mb-2">SLOT EMPTY</div>
                      <div className="text-[9px] text-stone-800 font-mono uppercase tracking-tighter italic">No neural mod detected</div>
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
                          className="bg-ink-950 rounded-none p-4 border border-yellow-900/30 shadow-md hover:border-yellow-400/50 transition-all duration-300 relative cursor-pointer group overflow-hidden"
                          tooltipContent={
                            <div className="relative font-mono">
                              <div className="text-sm font-bold text-yellow-400 mb-2 font-mono uppercase tracking-[0.2em] border-b border-yellow-900/30 pb-1">{methodTitle} PROFILE</div>
                              <div className="space-y-2 font-mono">
                                <div className="text-[10px] text-yellow-300 uppercase tracking-widest">HAZARD LEVEL: {difficulty.toFixed(1)}x</div>
                                <div className="text-[10px] text-green-400 uppercase tracking-widest">SYNC MULTIPLIER: {bonusMultiplier.toFixed(1)}x</div>
                                <div className="text-[10px] text-green-400 uppercase tracking-widest">OUTPUT BONUS: +{bonusPercent}%</div>
                                <div className="text-[9px] text-stone-500 mt-2 pt-2 border-t border-stone-800/50 leading-relaxed uppercase tracking-tighter">
                                  EXTREME HAZARD WARNING: Greater mutation levels increase wasteland environmental resistance but amplify neural strain.
                                </div>
                              </div>
                            </div>
                          }
                        >
                          <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                            style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                          />
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-1.5 h-1.5 bg-yellow-500 animate-pulse"></div>
                              <h4 className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">MUTANT PATHS</h4>
                            </div>
                            <div className="text-sm font-bold text-yellow-100 mb-1 uppercase tracking-tight">
                              {methodTitle}
                            </div>
                            <div className="text-[9px] text-yellow-500 bg-yellow-950/40 px-2 py-0.5 rounded-none inline-block mb-3 border border-yellow-900/40 font-mono uppercase tracking-tighter">
                              HAZARD: {difficulty.toFixed(1)}x
                            </div>
                            {bonusMultiplier > 1 && (
                              <div className="text-[10px] text-green-400/80 font-mono uppercase tracking-widest">
                                BONUS: +{bonusPercent}%
                              </div>
                            )}
                          </div>
                        </HoverableCard>
                      );
                    }

                    // No paths, show un-evolved
                    return (
                      <div className="bg-ink-950 rounded-none p-4 border border-stone-800/50 opacity-40 grayscale relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 bg-stone-600"></div>
                          <h4 className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">MUTANT PATHS</h4>
                        </div>
                        <div className="text-sm font-bold text-stone-700 uppercase mb-2">NO MUTATION</div>
                        <div className="text-[9px] text-stone-800 font-mono uppercase tracking-tighter italic">Neural structure stable</div>
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
                        borderColor="border-purple-500/50"
                        className="bg-ink-950 rounded-none p-4 border border-purple-900/30 shadow-md hover:border-purple-400/50 transition-all duration-300 relative cursor-pointer group overflow-hidden"
                        tooltipContent={
                          <div className="relative font-mono">
                            <div className="text-sm font-bold text-purple-400 mb-2 font-mono uppercase tracking-[0.2em] border-b border-purple-900/30 pb-1">{essence?.name}</div>
                            <div className="text-[10px] text-stone-500 mb-3 leading-relaxed uppercase tracking-tight">{essence?.description}</div>
                            <div className="space-y-1 font-mono">
                              <div className="text-[10px] text-purple-300 uppercase tracking-widest">SYNC QUALITY: {essence?.quality || 0}</div>
                              {effectTexts.map((text, idx) => (
                                <div key={idx} className="text-[10px] text-purple-300 uppercase tracking-tighter">{text}</div>
                              ))}
                              {effects.specialEffect && (
                                <div className="text-[10px] text-amber-400 mt-2 border-t border-stone-800/50 pt-2 font-mono italic uppercase tracking-widest">
                                  OVERDRIVE: {effects.specialEffect}
                                </div>
                              )}
                            </div>
                          </div>
                        }
                      >
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                          style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                        />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-1.5 bg-purple-500 animate-pulse"></div>
                            <h4 className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">CORE ESSENCE</h4>
                          </div>
                          <div className="text-sm font-bold text-purple-100 mb-1 uppercase tracking-tight">
                            {essence?.name || 'Unknown'}
                          </div>
                          <div className="text-[9px] text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded-none inline-block mb-3 border border-purple-900/40 font-mono uppercase tracking-tighter">
                            QUALITY {essence?.quality || 0}
                          </div>
                          {effectTexts.length > 0 && (
                            <div className="space-y-1 font-mono">
                              {effectTexts.slice(0, 3).map((text, idx) => (
                                <div key={idx} className="text-[10px] text-purple-300/80 uppercase tracking-tighter">{text}</div>
                              ))}
                              {effectTexts.length > 3 && (
                                <div className="text-[9px] text-purple-500 uppercase tracking-tighter mt-1">+{effectTexts.length - 3} ADDITIONAL</div>
                              )}
                            </div>
                          )}
                        </div>
                      </HoverableCard>
                    );
                  })() : (
                    <div className="bg-ink-950 rounded-none p-4 border border-stone-800/50 opacity-40 grayscale relative overflow-hidden">
                      <div 
                        className="absolute inset-0 opacity-[0.03]"
                        style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                      />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 bg-stone-600"></div>
                          <h4 className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">CORE ESSENCE</h4>
                        </div>
                        <div className="text-sm font-bold text-stone-700 uppercase mb-2">SLOT EMPTY</div>
                        <div className="text-[9px] text-stone-800 font-mono uppercase tracking-tighter italic">No essence filter detected</div>
                      </div>
                    </div>
                  )}

                  {/* Apex Marrow */}
                  {player.heavenEarthMarrow ? (() => {
                    const marrow = HEAVEN_EARTH_MARROWS[player.heavenEarthMarrow];
                    const effects = marrow?.effects || {};
                    const effectTexts: string[] = [];
                    if (effects.hpBonus) effectTexts.push(`HP+${effects.hpBonus}`);
                    if (effects.attackBonus) effectTexts.push(`FP+${effects.attackBonus}`);
                    if (effects.defenseBonus) effectTexts.push(`DR+${effects.defenseBonus}`);
                    if (effects.spiritBonus) effectTexts.push(`PER+${effects.spiritBonus}`);
                    if (effects.physiqueBonus) effectTexts.push(`END+${effects.physiqueBonus}`);
                    if (effects.speedBonus) effectTexts.push(`AGI+${effects.speedBonus}`);

                    return (
                      <HoverableCard
                        borderColor="border-red-500/50"
                        className="bg-ink-950 rounded-none p-4 border border-red-900/30 shadow-md hover:border-red-400/50 transition-all duration-300 relative cursor-pointer group overflow-hidden"
                        tooltipContent={
                          <div className="relative font-mono">
                            <div className="text-sm font-bold text-red-400 mb-2 font-mono uppercase tracking-[0.2em] border-b border-red-900/30 pb-1">{marrow?.name}</div>
                            <div className="text-[10px] text-stone-500 mb-3 leading-relaxed uppercase tracking-tight">{marrow?.description}</div>
                            <div className="space-y-1 font-mono">
                              <div className="text-[10px] text-red-300 uppercase tracking-widest">QUALITY: {marrow?.quality || 0} | LOAD: {marrow?.refiningTime || 0} DAYS</div>
                              {player.marrowRefiningProgress !== undefined && (
                                <div className="text-[10px] text-red-300 uppercase tracking-widest">NEURAL INTEGRATION: {player.marrowRefiningProgress}%</div>
                              )}
                              {effectTexts.map((text, idx) => (
                                <div key={idx} className="text-[10px] text-red-300 uppercase tracking-tighter">{text}</div>
                              ))}
                              {effects.specialEffect && (
                                <div className="text-[10px] text-amber-400 mt-2 border-t border-stone-800/50 pt-2 font-mono italic uppercase tracking-widest">
                                  CRITICAL: {effects.specialEffect}
                                </div>
                              )}
                            </div>
                          </div>
                        }
                      >
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                          style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                        />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-1.5 h-1.5 bg-red-500 animate-pulse"></div>
                            <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest">APEX MARROW</h4>
                          </div>
                          <div className="text-sm font-bold text-red-100 mb-1 uppercase tracking-tight">
                            {marrow?.name || 'Unknown'}
                          </div>
                          <div className="text-[9px] text-red-400 bg-red-950/40 px-2 py-0.5 rounded-none inline-block mb-3 border border-red-900/40 font-mono uppercase tracking-tighter">
                            QUALITY {marrow?.quality || 0}
                            {player.marrowRefiningProgress && player.marrowRefiningProgress > 0 && (
                              <span> - {player.marrowRefiningProgress}%</span>
                            )}
                          </div>
                          {effectTexts.length > 0 && (
                            <div className="space-y-1 font-mono">
                              {effectTexts.slice(0, 3).map((text, idx) => (
                                <div key={idx} className="text-[10px] text-red-300/80 uppercase tracking-tighter">{text}</div>
                              ))}
                              {effectTexts.length > 3 && (
                                <div className="text-[9px] text-red-500 uppercase tracking-tighter mt-1">+{effectTexts.length - 3} ADDITIONAL</div>
                              )}
                            </div>
                          )}
                          {/* Processing progress bar and feed button */}
                          {player.marrowRefiningProgress !== undefined && player.marrowRefiningProgress < 100 && (
                            <div className="mt-3 space-y-2">
                              <div className="w-full bg-red-950/40 border border-red-900/40 h-1 rounded-none overflow-hidden">
                                <div
                                  className="bg-red-500 h-full transition-all duration-300 relative"
                                  style={{ width: `${player.marrowRefiningProgress}%` }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMarrowFeedModal(true);
                                }}
                                className="w-full px-3 py-2 bg-ink-950 hover:bg-red-900/20 border border-red-900/50 text-red-400 text-xs rounded-none transition-all flex items-center justify-center gap-2 font-mono uppercase tracking-widest relative group overflow-hidden"
                              >
                                <div 
                                  className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                                  style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                                />
                                <Beaker size={14} className="relative z-10 group-hover:scale-110 transition-transform" />
                                <span className="relative z-10">Refine Bio-Materials</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </HoverableCard>
                    );
                  })() : (
                    <div className="bg-ink-950 rounded-none p-4 border border-stone-800 opacity-60 font-mono relative overflow-hidden">
                      <div 
                        className="absolute inset-0 opacity-[0.03]"
                        style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                      />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-stone-600 rounded-none"></div>
                          <h4 className="text-base font-mono text-stone-500 uppercase tracking-widest">Apex Marrow</h4>
                        </div>
                        <div className="text-sm text-stone-600 uppercase">NONE</div>
                      </div>
                    </div>
                  )}

                  {/* Ruin Guardian Challenge */}
                  {player.daoCombiningChallenged ? (
                    <div className="bg-ink-950 rounded-none p-4 border border-indigo-900/50 shadow-lg hover:border-indigo-500/50 transition-all duration-300 font-mono group relative overflow-hidden">
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                        style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                      />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-none group-hover:animate-pulse"></div>
                          <h4 className="text-base font-mono text-indigo-400 uppercase tracking-widest">Guardian Challenge</h4>
                        </div>
                        <div className="text-lg font-mono text-indigo-300 mb-1 uppercase tracking-tight">
                          CHALLENGE COMPLETE
                        </div>
                        <div className="text-[10px] text-indigo-400 bg-indigo-900/20 px-2 py-1 border border-indigo-900/30 inline-block uppercase tracking-tighter">
                          Ready for Transcendence
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-ink-950 rounded-none p-4 border border-stone-800 opacity-60 font-mono relative overflow-hidden">
                      <div 
                        className="absolute inset-0 opacity-[0.03]"
                        style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                      />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-stone-600 rounded-none"></div>
                          <h4 className="text-base font-mono text-stone-500 uppercase tracking-widest">Guardian Challenge</h4>
                        </div>
                        <div className="text-sm text-stone-600 uppercase">NOT CHALLENGED</div>
                      </div>
                    </div>
                  )}


                  {/* Wasteland Laws */}
                  {player.longevityRules && player.longevityRules.length > 0 ? (
                    <HoverableCard
                      borderColor="border-emerald-900/50"
                      width="w-72"
                      className="bg-ink-950 rounded-none p-4 border border-emerald-900/50 shadow-lg hover:border-emerald-500/50 transition-all duration-300 relative cursor-pointer font-mono group overflow-hidden"
                      tooltipContent={
                        <div className="max-h-96 overflow-y-auto font-mono">
                          <div className="text-sm font-mono text-emerald-400 mb-3 uppercase tracking-widest border-b border-emerald-900/30 pb-1">Wasteland Laws Protocol</div>
                          {player.longevityRules.map((ruleId, idx) => {
                            const rule = LONGEVITY_RULES[ruleId];
                            if (!rule) return null;
                            const effects = rule.effects || {};
                            const effectTexts: string[] = [];
                            if (effects.hpPercent) effectTexts.push(`HP +${(effects.hpPercent * 100).toFixed(0)}%`);
                            if (effects.attackPercent) effectTexts.push(`FP +${(effects.attackPercent * 100).toFixed(0)}%`);
                            if (effects.defensePercent) effectTexts.push(`DR +${(effects.defensePercent * 100).toFixed(0)}%`);
                            if (effects.spiritPercent) effectTexts.push(`PER +${(effects.spiritPercent * 100).toFixed(0)}%`);
                            if (effects.physiquePercent) effectTexts.push(`END +${(effects.physiquePercent * 100).toFixed(0)}%`);
                            if (effects.speedPercent) effectTexts.push(`AGI +${(effects.speedPercent * 100).toFixed(0)}%`);

                            return (
                              <div key={ruleId} className={`mb-3 ${idx > 0 ? 'border-t border-emerald-900/20 pt-3' : ''}`}>
                                <div className="text-xs font-mono text-emerald-300 mb-1 uppercase tracking-wider">{rule.name}</div>
                                <div className="text-[10px] text-stone-400 mb-1 leading-relaxed uppercase">{rule.description}</div>
                                <div className="text-[10px] text-emerald-500/70 mb-1 uppercase tracking-tighter">STABILITY: {rule.power}</div>
                                {effectTexts.length > 0 && (
                                  <div className="text-[10px] text-emerald-400/80 space-y-0.5 mt-1">
                                    {effectTexts.map((text, i) => (
                                      <div key={i}>{text}</div>
                                    ))}
                                  </div>
                                )}
                                {effects.specialEffect && (
                                  <div className="text-[10px] text-amber-400 mt-1 uppercase tracking-tighter italic">
                                    PROTOCOL: {effects.specialEffect}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      }
                    >
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                        style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                      />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-none group-hover:animate-pulse"></div>
                          <h4 className="text-base font-mono text-emerald-400 uppercase tracking-widest">Wasteland Laws</h4>
                        </div>
                        <div className="text-sm text-emerald-200 mb-1 font-mono uppercase tracking-tight line-clamp-2">
                          {player.longevityRules.map(ruleId =>
                            LONGEVITY_RULES[ruleId]?.name || 'Unknown'
                          ).join(', ')}
                        </div>
                        <div className="text-[10px] text-emerald-400 bg-emerald-900/20 px-2 py-1 border border-emerald-900/30 inline-block uppercase tracking-tighter">
                          Mastered: {player.longevityRules.length}/{player.maxLongevityRules || 3}
                        </div>
                      </div>
                    </HoverableCard>
                  ) : (
                    <div className="bg-ink-950 rounded-none p-4 border border-stone-800 opacity-60 font-mono relative overflow-hidden">
                      <div 
                        className="absolute inset-0 opacity-[0.03]"
                        style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                      />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-stone-600 rounded-none"></div>
                          <h4 className="text-base font-mono text-stone-500 uppercase tracking-widest">Wasteland Laws</h4>
                        </div>
                        <div className="text-sm text-stone-600 uppercase">NO LAWS DETECTED</div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Evolution Protocol */}
              <div className="bg-ink-950 rounded-none p-4 border border-stone-800 font-mono relative overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-[0.03]"
                  style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                />
                <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
                
                <div className="relative z-10">
                  <h3 className="text-sm font-mono flex items-center gap-2 mb-4 text-purple-400 uppercase tracking-[0.2em]">
                    <TrendingUp className="text-purple-400 animate-pulse" size={16} />
                    EVOLUTION PROTOCOL
                  </h3>

                  {player.inheritanceLevel > 0 ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-stone-800/50 pb-2">
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest">
                          LEGACY SYNC RANK
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-mono text-purple-400 leading-none">
                            {player.inheritanceLevel}
                          </span>
                          <span className="text-stone-600 text-xs">/ 4</span>
                        </div>
                      </div>
                      
                      <p className="text-[9px] text-stone-600 leading-relaxed uppercase tracking-tighter italic">
                        {'// Legacy data synchronization complete. Authorized for tier evolution protocols.'}
                      </p>

                      {onUseInheritance && (
                        <button
                          onClick={onUseInheritance}
                          className="w-full px-4 py-3 bg-ink-950 hover:bg-purple-950/20 border border-purple-900/40 text-purple-400 font-mono text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] relative group overflow-hidden"
                        >
                          <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                            style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                          />
                          INITIALIZE EVOLUTION
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center border border-dashed border-stone-800 bg-black/20">
                      <p className="text-[10px] text-stone-600 uppercase tracking-[0.2em]">NO LEGACY DATA DETECTED</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Attribute Details Panel */}
              <div className="bg-ink-950 rounded-none p-5 border-2 border-stone-800 font-mono relative">
                <div className="flex justify-between items-center mb-5 border-b border-stone-800/50 pb-3">
                  <h3 className="text-sm font-mono flex items-center gap-3 text-blue-400 uppercase tracking-[0.2em]">
                    <Info className="text-blue-400" size={18} />
                    NEURAL PROFILE
                  </h3>
                  <button
                    onClick={() => setShowAttributeDetails(!showAttributeDetails)}
                    className="text-[9px] text-stone-500 hover:text-blue-400 uppercase tracking-widest border border-stone-800 px-3 py-1 bg-black/20 transition-all hover:border-blue-900/50"
                  >
                    {showAttributeDetails ? '[-] HIDE DIAGNOSTICS' : '[+] SHOW DIAGNOSTICS'}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                  <div className="flex flex-col border-l-2 border-red-900/30 pl-3">
                    <span className="text-[9px] text-stone-600 uppercase tracking-widest mb-1">Firepower (FP)</span>
                    <span className="text-base text-red-400 font-mono font-bold">
                      {totalStats.attack}
                    </span>
                  </div>
                  <div className="flex flex-col border-l-2 border-blue-900/30 pl-3">
                    <span className="text-[9px] text-stone-600 uppercase tracking-widest mb-1">Dmg Resist (DR)</span>
                    <span className="text-base text-blue-400 font-mono font-bold">
                      {totalStats.defense}
                    </span>
                  </div>
                  <div className="flex flex-col border-l-2 border-green-900/30 pl-3">
                    <span className="text-[9px] text-stone-600 uppercase tracking-widest mb-1">Hit Points (HP)</span>
                    <span className="text-base text-green-400 font-mono font-bold">
                      {player.hp}<span className="text-stone-700 text-xs mx-1">/</span>{totalStats.maxHp}
                    </span>
                  </div>
                  <div className="flex flex-col border-l-2 border-purple-900/30 pl-3">
                    <span className="text-[9px] text-stone-600 uppercase tracking-widest mb-1">Perception (PER)</span>
                    <span className="text-base text-purple-400 font-mono font-bold">
                      {totalStats.spirit}
                    </span>
                  </div>
                  <div className="flex flex-col border-l-2 border-orange-900/30 pl-3">
                    <span className="text-[9px] text-stone-600 uppercase tracking-widest mb-1">Endurance (END)</span>
                    <span className="text-base text-orange-400 font-mono font-bold">
                      {totalStats.physique}
                    </span>
                  </div>
                  <div className="flex flex-col border-l-2 border-yellow-900/30 pl-3">
                    <span className="text-[9px] text-stone-600 uppercase tracking-widest mb-1">Agility (AGI)</span>
                    <span className="text-base text-yellow-400 font-mono font-bold">
                      {totalStats.speed}
                    </span>
                  </div>
                  <div className="flex flex-col border-l-2 border-amber-500/30 pl-3">
                    <span className="text-[9px] text-stone-600 uppercase tracking-widest mb-1">Reputation (REP)</span>
                    <span className="text-base text-amber-400 font-mono font-bold">
                      {player.reputation || 0}
                    </span>
                  </div>
                </div>
                {showAttributeDetails && (
                  <div className="mt-6 pt-5 border-t border-stone-800/50 text-[10px] space-y-3 font-mono bg-black/20 p-4">
                    <div className="text-stone-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500/50"></div>
                      SOURCE BREAKDOWN:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
                      <div className="flex justify-between border-b border-stone-900/50 pb-1">
                        <span className="text-stone-600 uppercase tracking-tighter">BASE PROTOCOL:</span>
                        <span className="text-stone-400">FP {attributeSources.base.attack} / DR {attributeSources.base.defense} / HP {attributeSources.base.hp}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-900/50 pb-1">
                        <span className="text-stone-600 uppercase tracking-tighter">GENETIC TRAITS:</span>
                        <span className="text-stone-400">FP {currentTalent?.effects.attack || 0} / DR {currentTalent?.effects.defense || 0} / HP {currentTalent?.effects.hp || 0}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-900/50 pb-1">
                        <span className="text-stone-600 uppercase tracking-tighter">RANK BONUSES:</span>
                        <span className="text-stone-400">FP {attributeSources.title.attack} / DR {attributeSources.title.defense} / HP {attributeSources.title.hp}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-900/50 pb-1">
                        <span className="text-stone-600 uppercase tracking-tighter">EQUIPMENT MODS:</span>
                        <span className="text-stone-400">FP {attributeSources.art.attack} / DR {attributeSources.art.defense} / HP {attributeSources.art.hp}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-900/50 pb-1">
                        <span className="text-stone-600 uppercase tracking-tighter">LEGACY DATA:</span>
                        <span className="text-stone-400 text-right">FP {attributeSources.inheritance.attack} / DR {attributeSources.inheritance.defense} / HP {attributeSources.inheritance.hp}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-900/50 pb-1">
                        <span className="text-stone-600 uppercase tracking-tighter">NEURAL MODS:</span>
                        <span className="text-stone-400 text-right">FP {attributeSources.activeArt.attack} / DR {attributeSources.activeArt.defense} / HP {attributeSources.activeArt.hp}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Attribute Allocation */}
              {player.attributePoints > 0 && (
                <div className="bg-ink-950 rounded-none p-5 border border-stone-800 font-mono relative overflow-hidden">
                  <div 
                    className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                  />
                  <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-5 border-b border-stone-800/50 pb-3">
                    <h3 className="text-sm font-mono flex items-center gap-3 text-yellow-500 uppercase tracking-[0.2em]">
                      <Star className="text-yellow-500 animate-pulse" size={18} />
                      UNSPENT_SPECIAL_POINTS
                    </h3>
                    <div className="text-xl text-yellow-500 font-mono font-bold bg-yellow-950/10 px-4 py-1 border border-yellow-900/30">
                      {player.attributePoints}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Firepower */}
                    <div className="flex flex-col gap-1 group">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onAllocateAttribute('attack')}
                          className="flex-1 px-3 py-3 bg-stone-950 hover:bg-red-950/20 border border-stone-900 rounded-none transition-all group-hover:border-red-900/50"
                        >
                          <div className="text-[10px] text-stone-600 uppercase tracking-widest mb-2 border-b border-stone-900/50 pb-1 group-hover:text-red-400/70 transition-colors text-left">Firepower (FP)</div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-mono text-stone-400">{formatValueChange(totalStats.attack, totalStats.attack + attributeGains.attack)}</span>
                            <span className="text-xs text-yellow-500/80 font-mono">+{attributeGains.attack}</span>
                          </div>
                        </button>
                        {onAllocateAllAttributes && (
                          <button
                            onClick={() => handleAllocateAllWithConfirm('attack')}
                            className="px-3 bg-stone-950 hover:bg-red-950/20 border border-stone-900 rounded-none flex items-center justify-center transition-all group-hover:border-red-900/50"
                            title={`Allocate all ${player.attributePoints} points to Firepower`}
                          >
                            <Zap size={16} className="text-stone-700 group-hover:text-red-500 transition-colors" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Dmg Resist */}
                    <div className="flex flex-col gap-1 group">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onAllocateAttribute('defense')}
                          className="flex-1 px-3 py-3 bg-stone-950 hover:bg-blue-950/20 border border-stone-900 rounded-none transition-all group-hover:border-blue-900/50"
                        >
                          <div className="text-[10px] text-stone-600 uppercase tracking-widest mb-2 border-b border-stone-900/50 pb-1 group-hover:text-blue-400/70 transition-colors text-left">Dmg Resist (DR)</div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-mono text-stone-400">{formatValueChange(totalStats.defense, totalStats.defense + attributeGains.defense)}</span>
                            <span className="text-xs text-yellow-500/80 font-mono">+{attributeGains.defense}</span>
                          </div>
                        </button>
                        {onAllocateAllAttributes && (
                          <button
                            onClick={() => handleAllocateAllWithConfirm('defense')}
                            className="px-3 bg-stone-950 hover:bg-blue-950/20 border border-stone-900 rounded-none flex items-center justify-center transition-all group-hover:border-blue-900/50"
                            title={`Allocate all ${player.attributePoints} points to Dmg Resist`}
                          >
                            <Zap size={16} className="text-stone-700 group-hover:text-blue-500 transition-colors" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Hit Points */}
                    <div className="flex flex-col gap-1 group">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onAllocateAttribute('hp')}
                          className="flex-1 px-3 py-3 bg-stone-950 hover:bg-green-950/20 border border-stone-900 rounded-none transition-all group-hover:border-green-900/50"
                        >
                          <div className="text-[10px] text-stone-600 uppercase tracking-widest mb-2 border-b border-stone-900/50 pb-1 group-hover:text-green-400/70 transition-colors text-left">Hit Points (HP)</div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-mono text-stone-400">{formatValueChange(totalStats.maxHp, totalStats.maxHp + attributeGains.hp)}</span>
                            <span className="text-xs text-yellow-500/80 font-mono">+{attributeGains.hp}</span>
                          </div>
                        </button>
                        {onAllocateAllAttributes && (
                          <button
                            onClick={() => handleAllocateAllWithConfirm('hp')}
                            className="px-3 bg-stone-950 hover:bg-green-950/20 border border-stone-900 rounded-none flex items-center justify-center transition-all group-hover:border-green-900/50"
                            title={`Allocate all ${player.attributePoints} points to Hit Points`}
                          >
                            <Zap size={16} className="text-stone-700 group-hover:text-green-500 transition-colors" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Perception */}
                    <div className="flex flex-col gap-1 group">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onAllocateAttribute('spirit')}
                          className="flex-1 px-3 py-3 bg-stone-950 hover:bg-purple-950/20 border border-stone-900 rounded-none transition-all group-hover:border-purple-900/50"
                        >
                          <div className="text-[10px] text-stone-600 uppercase tracking-widest mb-2 border-b border-stone-900/50 pb-1 group-hover:text-purple-400/70 transition-colors text-left">Perception (PER)</div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-mono text-stone-400">{formatValueChange(totalStats.spirit, totalStats.spirit + attributeGains.spirit)}</span>
                            <span className="text-xs text-yellow-500/80 font-mono">+{attributeGains.spirit}</span>
                          </div>
                        </button>
                        {onAllocateAllAttributes && (
                          <button
                            onClick={() => handleAllocateAllWithConfirm('spirit')}
                            className="px-3 bg-stone-950 hover:bg-purple-950/20 border border-stone-900 rounded-none flex items-center justify-center transition-all group-hover:border-purple-900/50"
                            title={`Allocate all ${player.attributePoints} points to Perception`}
                          >
                            <Zap size={16} className="text-stone-700 group-hover:text-purple-500 transition-colors" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Endurance */}
                    <div className="flex flex-col gap-1 group">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onAllocateAttribute('physique')}
                          className="flex-1 px-3 py-3 bg-stone-950 hover:bg-orange-950/20 border border-stone-900 rounded-none transition-all group-hover:border-orange-900/50"
                        >
                          <div className="text-[10px] text-stone-600 uppercase tracking-widest mb-2 border-b border-stone-900/50 pb-1 group-hover:text-orange-400/70 transition-colors text-left">Endurance (END)</div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-mono text-stone-400">{formatValueChange(totalStats.physique, totalStats.physique + attributeGains.physique)}</span>
                            <span className="text-xs text-yellow-500/80 font-mono">+{attributeGains.physique}</span>
                          </div>
                        </button>
                        {onAllocateAllAttributes && (
                          <button
                            onClick={() => handleAllocateAllWithConfirm('physique')}
                            className="px-3 bg-stone-950 hover:bg-orange-950/20 border border-stone-900 rounded-none flex items-center justify-center transition-all group-hover:border-orange-900/50"
                            title={`Allocate all ${player.attributePoints} points to Endurance`}
                          >
                            <Zap size={16} className="text-stone-700 group-hover:text-orange-500 transition-colors" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Agility */}
                    <div className="flex flex-col gap-1 group">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onAllocateAttribute('speed')}
                          className="flex-1 px-3 py-3 bg-stone-950 hover:bg-yellow-950/20 border border-stone-900 rounded-none transition-all group-hover:border-yellow-900/50"
                        >
                          <div className="text-[10px] text-stone-600 uppercase tracking-widest mb-2 border-b border-stone-900/50 pb-1 group-hover:text-yellow-400/70 transition-colors text-left">Agility (AGI)</div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-mono text-stone-400">{formatValueChange(totalStats.speed, totalStats.speed + attributeGains.speed)}</span>
                            <span className="text-xs text-yellow-500/80 font-mono">+{attributeGains.speed}</span>
                          </div>
                        </button>
                        {onAllocateAllAttributes && (
                          <button
                            onClick={() => handleAllocateAllWithConfirm('speed')}
                            className="px-3 bg-stone-950 hover:bg-yellow-950/20 border border-stone-900 rounded-none flex items-center justify-center transition-all group-hover:border-yellow-900/50"
                            title={`Allocate all ${player.attributePoints} points to Agility`}
                          >
                            <Zap size={16} className="text-stone-700 group-hover:text-yellow-500 transition-colors" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Traits Display (Immutable) */}
              <div className="font-mono">
                <h3 className="text-lg font-mono mb-3 flex items-center gap-2 text-purple-400 uppercase tracking-widest">
                  <Star className="text-purple-400" size={20} />
                  GENETIC TRAITS
                </h3>
                {currentTalent ? (
                  <div className="bg-ink-950 rounded-none p-4 border border-stone-800 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/30"></div>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`font-mono font-bold uppercase tracking-wider ${getRarityTextColor(currentTalent.rarity as ItemRarity)}`}
                          >
                            {currentTalent.name}
                          </span>
                          <span className="text-[10px] text-stone-600 border border-stone-800 px-1 uppercase">{currentTalent.rarity}</span>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed mb-3">
                          {currentTalent.description}
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(currentTalent.effects).map(([key, value]) => {
                            if (typeof value !== 'number' || value === 0) return null;
                            const labels: Record<string, string> = {
                              attack: 'FP', defense: 'DR', hp: 'HP', spirit: 'PER', physique: 'END', speed: 'AGI'
                            };
                            return (
                              <div key={key} className="flex justify-between text-[10px] border-b border-stone-900/50 pb-0.5">
                                <span className="text-stone-500 uppercase">{labels[key] || key}</span>
                                <span className="text-purple-400">+{value}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 text-[10px] text-stone-600 italic uppercase tracking-tighter">
                          * Neural traits are hard-coded into your DNA and cannot be modified.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-ink-950 rounded-none p-4 border border-dashed border-stone-800 text-center">
                    <span className="text-xs text-stone-600 uppercase tracking-widest">No Traits Identified</span>
                  </div>
                )}
              </div>

              {/* Title System */}
              <div className="mt-8 font-mono">
                <div className="flex justify-between items-center mb-4 border-b border-stone-800 pb-2">
                  <h3 className="text-sm font-mono text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Award className="text-yellow-500" size={18} />
                    NEURAL RANK TITLES
                    {unlockedTitles.length > 0 && (
                      <span className="text-[10px] text-stone-600 font-normal">
                        [{unlockedTitles.length}/{TITLES.length}]
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() => setShowTitleDetails(!showTitleDetails)}
                    className="text-[10px] font-mono text-stone-500 hover:text-yellow-500 uppercase tracking-widest transition-colors"
                  >
                    {showTitleDetails ? '[ COLLAPSE_PROTOCOLS ]' : '[ EXPAND_PROTOCOLS ]'}
                  </button>
                </div>

                {/* Currently Equipped Title */}
                {currentTitle ? (
                  <div className="bg-ink-950 border-2 border-stone-800 p-4 rounded-none mb-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none"></div>
                    <div className="absolute top-0 right-0 bg-stone-900 text-yellow-500 text-[10px] px-3 py-1 font-mono uppercase tracking-[0.2em] border-l border-b border-stone-800">
                      PRIMARY
                    </div>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`text-lg font-mono uppercase tracking-[0.2em] ${getRarityTextColor((currentTitle.rarity || '普通') as ItemRarity)}`}>
                            {currentTitle.name}
                          </span>
                          {currentTitle.rarity && (
                            <span className="text-[10px] text-stone-600 font-mono uppercase tracking-widest border border-stone-900 px-1">({currentTitle.rarity})</span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 mb-4 font-mono leading-relaxed max-w-2xl">
                          {currentTitle.description}
                        </p>
                        <div className="bg-stone-950/50 p-2 border border-stone-900 mb-4">
                          <p className="text-[10px] text-stone-500 font-mono uppercase tracking-widest">
                            AUTH_REQ: {currentTitle.requirement}
                          </p>
                        </div>

                        {/* Title Effects */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {titleEffects.attack > 0 && <div className="text-[11px] font-mono text-emerald-500/80 uppercase tracking-widest border-l-2 border-emerald-900/30 pl-2">FP +{titleEffects.attack}</div>}
                          {titleEffects.defense > 0 && <div className="text-[11px] font-mono text-emerald-500/80 uppercase tracking-widest border-l-2 border-emerald-900/30 pl-2">DR +{titleEffects.defense}</div>}
                          {titleEffects.hp > 0 && <div className="text-[11px] font-mono text-emerald-500/80 uppercase tracking-widest border-l-2 border-emerald-900/30 pl-2">HP +{titleEffects.hp}</div>}
                          {titleEffects.spirit > 0 && <div className="text-[11px] font-mono text-emerald-500/80 uppercase tracking-widest border-l-2 border-emerald-900/30 pl-2">PER +{titleEffects.spirit}</div>}
                          {titleEffects.physique > 0 && <div className="text-[11px] font-mono text-emerald-500/80 uppercase tracking-widest border-l-2 border-emerald-900/30 pl-2">END +{titleEffects.physique}</div>}
                          {titleEffects.speed > 0 && <div className="text-[11px] font-mono text-emerald-500/80 uppercase tracking-widest border-l-2 border-emerald-900/30 pl-2">AGI +{titleEffects.speed}</div>}
                          {titleEffects.expRate > 0 && <div className="text-[11px] font-mono text-blue-400/80 uppercase tracking-widest border-l-2 border-blue-900/30 pl-2">TRAIN +{(titleEffects.expRate * 100).toFixed(0)}%</div>}
                          {titleEffects.luck > 0 && <div className="text-[11px] font-mono text-yellow-500 uppercase tracking-widest border-l-2 border-yellow-900/30 pl-2">LUCK +{titleEffects.luck}</div>}
                        </div>

                        {/* Set Bonus */}
                        {activeSetEffects.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-stone-900">
                            {activeSetEffects.map((setEffect) => (
                              <div key={setEffect.setName} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Sparkles size={14} className="text-purple-500 animate-pulse" />
                                  <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-[0.2em]">PROTOCOL_SYNC: {setEffect.setName}</span>
                                </div>
                                <p className="text-[10px] text-stone-500 font-mono mb-2">{setEffect.description}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {setEffect.effects.attack > 0 && <div className="text-[10px] font-mono text-purple-400/70 uppercase tracking-widest">FP +{setEffect.effects.attack}</div>}
                                  {setEffect.effects.defense > 0 && <div className="text-[10px] font-mono text-purple-400/70 uppercase tracking-widest">DR +{setEffect.effects.defense}</div>}
                                  {setEffect.effects.hp > 0 && <div className="text-[10px] font-mono text-purple-400/70 uppercase tracking-widest">HP +{setEffect.effects.hp}</div>}
                                  {setEffect.effects.spirit > 0 && <div className="text-[10px] font-mono text-purple-400/70 uppercase tracking-widest">PER +{setEffect.effects.spirit}</div>}
                                  {setEffect.effects.speed > 0 && <div className="text-[10px] font-mono text-purple-400/70 uppercase tracking-widest">AGI +{setEffect.effects.speed}</div>}
                                  {setEffect.effects.expRate > 0 && <div className="text-[10px] font-mono text-purple-400/70 uppercase tracking-widest">TRAIN +{(setEffect.effects.expRate * 100).toFixed(0)}%</div>}
                                  {setEffect.effects.luck > 0 && <div className="text-[10px] font-mono text-purple-400/70 uppercase tracking-widest">LUCK +{setEffect.effects.luck}</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-ink-950 border border-stone-800 p-6 rounded-none mb-4 text-center font-mono text-xs text-stone-600 uppercase tracking-[0.2em]">
                    NO_ACTIVE_PROTOCOL_DETECTED
                  </div>
                )}

                {/* Unlocked Titles List */}
                {showTitleDetails && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <h4 className="text-[10px] font-mono text-stone-500 uppercase tracking-widest border-b border-stone-900 pb-1 mb-3">VERIFIED_PROTOCOLS</h4>
                      <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 gap-2 max-h-80 pr-1">
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
                              className={`text-left rounded-none p-4 border font-mono transition-all group relative overflow-hidden ${isEquipped
                                ? 'bg-stone-900 border-yellow-900/50 cursor-default'
                                : 'bg-ink-950 hover:bg-stone-900 border-stone-800 hover:border-stone-700 cursor-pointer'
                                }`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-sm font-mono uppercase tracking-widest ${getRarityTextColor((title.rarity || '普通') as ItemRarity)}`}>
                                      {title.name}
                                    </span>
                                    {isEquipped && (
                                      <span className="text-[9px] bg-yellow-950/30 text-yellow-500 px-2 py-0.5 border border-yellow-900/30 uppercase tracking-widest">
                                        ACTIVE
                                      </span>
                                    )}
                                    {isPartOfSet && !isEquipped && (
                                      <span className="text-[9px] bg-purple-950/30 text-purple-400 px-2 py-0.5 border border-purple-900/30 uppercase tracking-widest">
                                        SYNC_READY
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-stone-500 group-hover:text-stone-400 transition-colors leading-relaxed">
                                    {title.description}
                                  </p>
                                </div>
                                {!isEquipped && (
                                  <div className="ml-4 text-[10px] text-stone-600 group-hover:text-yellow-500 uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                    [ INITIALIZE_SYNC ]
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}

                        {unlockedTitles.length === 0 && (
                          <div className="text-center text-stone-700 py-8 font-mono text-[10px] uppercase tracking-widest border border-dashed border-stone-900">
                            NO_VERIFIED_PROTOCOLS_AVAILABLE
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Available Titles */}
                    {TITLES.filter(t => !(player.unlockedTitles || []).includes(t.id)).length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-mono text-stone-500 uppercase tracking-widest border-b border-stone-900 pb-1 mb-3">
                          UNRESOLVED_PROTOCOLS ({TITLES.filter(t => !(player.unlockedTitles || []).includes(t.id)).length})
                        </h4>
                        <div className="modal-scroll-container modal-scroll-content grid grid-cols-1 gap-2 max-h-60 pr-1">
                          {TITLES.filter(t => !unlockedTitles.map(ut => ut.id).includes(t.id)).map((title) => {
                            const isMet = checkTitleRequirement(title, player);
                            return (
                              <div
                                key={title.id}
                                className={`bg-ink-950/50 rounded-none p-4 border font-mono transition-all ${isMet ? 'border-emerald-900/50 opacity-100' : 'border-stone-900/50 opacity-40'}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-xs font-mono uppercase tracking-widest ${getRarityTextColor((title.rarity || '普通') as ItemRarity)}`}>
                                    {title.name}
                                  </span>
                                  {isMet && (
                                    <span className="text-[9px] text-emerald-500 font-mono uppercase tracking-widest animate-pulse">SYNC_READY</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-stone-600 uppercase tracking-tighter leading-tight">AUTH_REQ: {title.requirement}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Statistics Panel */}
              <div className="space-y-6 font-mono">
                {/* Basic Statistics */}
                <div className="bg-ink-950 border-2 border-stone-800 p-6 rounded-none relative overflow-hidden">
                  <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none"></div>
                  <h3 className="text-sm font-mono text-stone-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-stone-900 pb-2">
                    <BarChart3 className="text-blue-500" size={18} />
                    CORE_METRICS
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        SURVIVAL_DURATION
                      </div>
                      <div className="text-2xl font-bold text-yellow-500">
                        {statistics.gameDays} <span className="text-[10px] text-stone-600 font-normal">DAYS</span>
                      </div>
                    </div>
                    {gameDuration && (
                      <div className="bg-stone-950/50 p-4 border border-stone-900">
                        <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                          UPTIME_SESSION
                        </div>
                        <div className="text-2xl font-bold text-blue-500">
                          {gameDuration}
                        </div>
                      </div>
                    )}
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        NEURAL_RANK
                      </div>
                      <div className="text-xl font-bold text-purple-500 uppercase tracking-tight">
                        {(() => {
                          if (player.realm === 'Mutant' && player.goldenCoreMethodCount) {
                            const methodTitle = getGoldenCoreMethodTitle(player.goldenCoreMethodCount);
                            return `${methodTitle} ${player.realmLevel}`;
                          }
                          return `${player.realm} ${player.realmLevel}`;
                        })()}
                      </div>
                    </div>
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        RANK_SYNC_PROGRESS
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-ink-950 border border-stone-800 h-2 rounded-none overflow-hidden">
                          <div
                            className="bg-purple-600 h-full transition-all duration-1000"
                            style={{ width: `${statistics.realmProgress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-purple-400">
                          {statistics.realmProgress.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        COGNITIVE_EXP
                      </div>
                      <div className="flex flex-col">
                        <div className="text-xl font-bold text-green-500">
                          {player.exp.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-stone-600 uppercase tracking-widest">
                          / {player.maxExp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        BOTTLE_CAPS
                      </div>
                      <div className="text-2xl font-bold text-yellow-500">
                        {player.spiritStones.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Engagement Statistics */}
                <div className="bg-ink-950 border-2 border-stone-800 p-6 rounded-none relative overflow-hidden">
                  <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none"></div>
                  <h3 className="text-sm font-mono text-stone-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-stone-900 pb-2">
                    <TrendingUp className="text-red-500" size={18} />
                    ENGAGEMENT_DATA
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        HOSTILES_TERMINATED
                      </div>
                      <div className="text-2xl font-bold text-red-500">
                        {statistics.killCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        RECON_MISSIONS
                      </div>
                      <div className="text-2xl font-bold text-orange-500">
                        {statistics.adventureCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        VAULT_DELVES
                      </div>
                      <div className="text-2xl font-bold text-purple-500">
                        {statistics.secretRealmCount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Training Statistics */}
                <div className="bg-ink-950 border-2 border-stone-800 p-6 rounded-none relative overflow-hidden">
                  <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none"></div>
                  <h3 className="text-sm font-mono text-stone-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-stone-900 pb-2">
                    <Star className="text-yellow-500" size={18} />
                    NEURAL_ADAPTATION
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        RECOVERY_CYCLES
                      </div>
                      <div className="text-2xl font-bold text-blue-400">
                        {statistics.meditateCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        EVOLUTION_EVENTS
                      </div>
                      <div className="text-2xl font-bold text-purple-400">
                        {statistics.breakthroughCount.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        NEURAL_MODS
                      </div>
                      <div className="flex flex-col">
                        <div className="text-2xl font-bold text-green-500">
                          {statistics.learnedArtsCount} <span className="text-[10px] text-stone-600 font-normal">INSTALLED</span>
                        </div>
                        <div className="text-[10px] text-stone-600 uppercase tracking-widest">
                          / {statistics.unlockedArtsCount} DISCOVERED
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logistics Statistics */}
                <div className="bg-ink-950 border-2 border-stone-800 p-6 rounded-none relative overflow-hidden">
                  <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none"></div>
                  <h3 className="text-sm font-mono text-stone-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-stone-900 pb-2">
                    <Award className="text-yellow-500" size={18} />
                    LOGISTICS_INVENTORY
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        BIO_ASSETS_TAMED
                      </div>
                      <div className="flex flex-col">
                        <div className="text-2xl font-bold text-pink-500">
                          {statistics.petCount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-stone-600 uppercase tracking-widest">
                          {player.pets.length} ACTIVE
                        </div>
                      </div>
                    </div>
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        EQUIPMENT_CYCLES
                      </div>
                      <div className="flex flex-col">
                        <div className="text-2xl font-bold text-cyan-500">
                          {statistics.equipCount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-stone-600 uppercase tracking-widest">
                          {statistics.totalEquippedItems} MOUNTED
                        </div>
                      </div>
                    </div>
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        SCHEMATICS_CATALOGED
                      </div>
                      <div className="flex flex-col">
                        <div className="text-2xl font-bold text-emerald-500">
                          {statistics.recipeCount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-stone-600 uppercase tracking-widest">
                          {(player.unlockedRecipes || []).length} ARCHIVED
                        </div>
                      </div>
                    </div>
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        TOTAL_INVENTORY_UNITS
                      </div>
                      <div className="flex flex-col">
                        <div className="text-2xl font-bold text-stone-400">
                          {statistics.totalInventoryItems.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-stone-600 uppercase tracking-widest">
                          {player.inventory.length} UNIQUE_IDs
                        </div>
                      </div>
                    </div>
                    <div className="bg-stone-950/50 p-4 border border-stone-900">
                      <div className="text-stone-600 text-[10px] uppercase tracking-widest mb-2">
                        OBJECTIVES_SECURED
                      </div>
                      <div className="flex flex-col">
                        <div className="text-2xl font-bold text-yellow-500">
                          {player.achievements.length}
                        </div>
                        <div className="text-[10px] text-stone-600 uppercase tracking-widest">
                          / {ACHIEVEMENTS.length} [{((player.achievements.length / ACHIEVEMENTS.length) * 100).toFixed(1)}%]
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bio-Material Processing Modal */}
      {showMarrowFeedModal && player.heavenEarthMarrow && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[10001] p-4 font-mono"
          onClick={() => setShowMarrowFeedModal(false)}
        >
          <div
            className="bg-ink-950 rounded-none border-2 border-stone-800 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none"></div>
            <div className="bg-stone-900 border-b border-stone-800 p-4 flex justify-between items-center relative z-10">
              <h3 className="text-sm font-mono text-red-500 flex items-center gap-3 uppercase tracking-[0.2em]">
                <Beaker size={18} className="animate-pulse" />
                BIO_SYNTH_PROCESSOR v2.4
              </h3>
              <button
                onClick={() => setShowMarrowFeedModal(false)}
                className="text-stone-500 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto modal-scroll-content relative z-10">
              <div className="mb-6 p-4 bg-red-950/10 border border-red-900/30 text-[10px] text-red-400/80 space-y-3 uppercase tracking-widest leading-relaxed">
                <p className="border-b border-red-900/20 pb-2">Select materials for neural bio-synthesis. Yield efficiency varies by material purity:</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-bold">
                  <div className="flex justify-between"><span>[ COMMON ]</span> <span className="text-red-500/60">1-2%</span></div>
                  <div className="flex justify-between"><span>[ RARE ]</span> <span className="text-red-500/60">3-5%</span></div>
                  <div className="flex justify-between"><span>[ LEGENDARY ]</span> <span className="text-red-500/60">6-10%</span></div>
                  <div className="flex justify-between"><span>[ APEX ]</span> <span className="text-red-500/60">15-25%</span></div>
                </div>
              </div>
              
              <h4 className="text-[10px] font-mono text-stone-500 uppercase tracking-widest border-b border-stone-900 pb-1 mb-4">MATERIAL_CATALOG</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {player.inventory
                  .filter((item) => {
                    const isEquipped = Object.values(player.equippedItems).includes(item.id);
                    return !isEquipped && item.quantity > 0;
                  })
                  .map((item) => {
                    const rarity = item.rarity || '普通';
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
                                addLog(`✨ APEX_MARROW [${marrow?.name || 'Marrow'}] research complete! Full stat bonuses applied!`);
                              } else {
                                addLog(`MATERIAL_PROCESSED: [${item.name}]. Progress +${progressGain}% (${currentProgress}% → ${newProgress}%)`);
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
                        className="p-3 bg-stone-950 hover:bg-red-950/20 rounded-none border border-stone-900 hover:border-red-900/50 transition-all text-left group flex flex-col justify-between min-h-[70px]"
                      >
                        <div className="text-[10px] font-bold mb-2 font-mono uppercase tracking-widest group-hover:text-red-400 transition-colors leading-tight" style={{ color: getRarityTextColor(rarity as ItemRarity) }}>
                          {item.name}
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-mono border-t border-stone-900 pt-1.5 mt-auto">
                          <span className="text-stone-600">QTY: {item.quantity}</span>
                          <span className="text-red-500/70">+{progressGain}%</span>
                        </div>
                      </button>
                    );
                  })}
              </div>
              
              {player.inventory.filter((item) => {
                const isEquipped = Object.values(player.equippedItems).includes(item.id);
                return !isEquipped && item.quantity > 0;
              }).length === 0 && (
                <div className="text-center py-16 text-stone-700 font-mono text-[10px] uppercase tracking-widest border border-dashed border-stone-900">
                  NO_COMPATIBLE_MATERIALS_FOUND
                </div>
              )}
            </div>
            <div className="bg-stone-950 border-t border-stone-900 p-3 text-center relative z-10">
              <p className="text-[9px] text-stone-700 uppercase tracking-widest">System Warning: Material synthesis is irreversible.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CharacterModal);
