import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Backpack,
  Star,
  Trophy,
  Sparkles,
  Gift,
  Settings,
  Menu,
  Bug,
  Calendar,
  Home,
  Users,
} from 'lucide-react';
import { PlayerStats } from '../types';
import { ASSETS } from '../constants/assets';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useParty } from '../hooks/useParty';

/**
 * Game Header Component
 * Contains the game title, menu button, and desktop action buttons.
 * Menu button: Opens the mobile sidebar.
 * Desktop buttons: Includes Mods, Inventory, Character, Trophies, Pets, Gacha, and Settings.
 */

interface GameHeaderProps {
  player: PlayerStats;
  onOpenMenu: () => void;
  onOpenCultivation: () => void;
  onOpenInventory: () => void;
  onOpenCharacter: () => void;
  onOpenAchievement: () => void;
  onOpenPet: () => void;
  onOpenLottery: () => void;
  onOpenSettings: () => void;
  onOpenDailyQuest?: () => void;
  onOpenGrotto?: () => void;
  onOpenDebug?: () => void;
  isDebugModeEnabled?: boolean;
}

function GameHeader({
  player,
  onOpenMenu,
  onOpenCultivation,
  onOpenInventory,
  onOpenCharacter,
  onOpenAchievement,
  onOpenPet,
  onOpenLottery,
  onOpenSettings,
  onOpenDailyQuest,
  onOpenGrotto,
  onOpenDebug,
  isDebugModeEnabled = false,
}: GameHeaderProps) {
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appVersion = import.meta.env.VITE_APP_VERSION || '-';

  // Use PartyKit to get online player count
  const { onlineCount } = useParty('global');

  const newAchievements = useMemo(
    () =>
      Array.isArray(player.achievements) &&
        Array.isArray(player.viewedAchievements)
        ? player.achievements.filter(
          (a) => !player.viewedAchievements.includes(a)
        )
        : [],
    [player.achievements, player.viewedAchievements]
  );

  const newAchievementsCount = useMemo(
    () => newAchievements.length,
    [newAchievements.length]
  );

  const petsCount = useMemo(
    () => (Array.isArray(player.pets) ? player.pets.length : 0),
    [player.pets]
  );

  const lotteryTickets = useMemo(
    () => player.lotteryTickets,
    [player.lotteryTickets]
  );

  const dailyQuestCompletedCount = useMemo(
    () => (player.dailyQuests || []).filter((q) => q.completed).length,
    [player.dailyQuests]
  );

  // Handle title click for debug mode activation
  const handleTitleClick = () => {
    // Clear previous timeouts
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const newCount = clickCount + 1;
    setClickCount(newCount);

    // Activate debug mode after 5 clicks
    if (newCount >= 5) {
      localStorage.setItem(STORAGE_KEYS.DEBUG_MODE, 'true');
      setClickCount(0);
      // Refresh page to apply debug mode
      window.location.reload();
    } else {
      // Reset counter if no click within 2 seconds
      clickTimeoutRef.current = setTimeout(() => {
        setClickCount(0);
      }, 2000);
    }
  };

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="bg-ink-950 p-2 md:p-4 border-b border-stone-800 flex justify-between items-center shadow-lg z-10 sticky top-0 safe-area-header">
      <div className="flex items-center gap-3">
        <h1
          onClick={handleTitleClick}
          className="text-sm md:text-xl font-mono text-amber-400 tracking-widest cursor-pointer select-none hover:opacity-80 transition-opacity uppercase"
          title={
            clickCount > 0 ? `Click ${5 - clickCount} more times for debug mode` : undefined
          }
        >
          Wasteland Survivor
        </h1>
        <div className="hidden md:flex items-center gap-2">
          <span
            className="text-xs md:text-sm text-stone-400 font-mono px-2 py-1 bg-stone-800 rounded-none border border-stone-800"
            title="Current Version"
          >
            v{appVersion}
          </span>
          {onlineCount > 0 && (
            <span
              className="text-xs md:text-sm text-green-400 font-mono px-2 py-1 bg-green-900/30 rounded-none border border-green-700 flex items-center gap-1"
              title="Players Online"
            >
              <Users size={12} />
              {onlineCount}
            </span>
          )}
        </div>
      </div>
      {/* Mobile Menu Button */}
      <button
        onClick={onOpenMenu}
        className="md:hidden flex items-center justify-center w-12 h-12 bg-ink-800 active:bg-stone-700 rounded-none border border-stone-800 touch-manipulation"
      >
        <img
          src={ASSETS.TOP_TAB.MENU}
          alt="Menu"
          className="w-6 h-6 object-contain"
        />
      </button>
      {/* Desktop Buttons */}
      <div className="hidden md:flex gap-2 flex-wrap">
        <button
          onClick={onOpenCultivation}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded-none border border-stone-800 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
        >
          <img
            src={ASSETS.ICONS.CRAFTING}
            alt="Mods"
            className="w-5 h-5 object-contain"
          />
          <span>Mods</span>
        </button>
        <button
          onClick={onOpenInventory}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded-none border border-stone-800 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
        >
          <img
            src={ASSETS.ICONS.BACKPACK}
            alt="Inventory"
            className="w-5 h-5 object-contain"
          />
          <span>Inventory</span>
        </button>
        <button
          onClick={onOpenCharacter}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded-none border border-stone-800 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
        >
          <img
            src={ASSETS.BOTTOM_TAB.STATUS}
            alt="Character"
            className="w-5 h-5 object-contain"
          />
          <span>Character</span>
        </button>
        <button
          onClick={onOpenAchievement}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded-none border border-stone-800 transition-colors text-sm relative min-w-[44px] min-h-[44px] justify-center"
        >
          <img
            src={ASSETS.ICONS.ACHIEVEMENTS}
            alt="Trophies"
            className="w-5 h-5 object-contain"
          />
          <span>Trophies</span>
          {newAchievementsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-none w-5 h-5 flex items-center justify-center">
              {newAchievementsCount}
            </span>
          )}
        </button>
        <button
          onClick={onOpenPet}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded-none border border-stone-800 transition-colors text-sm relative min-w-[44px] min-h-[44px] justify-center"
        >
          <img
            src={ASSETS.ICONS.COMPANIONS}
            alt="Pets"
            className="w-5 h-5 object-contain"
          />
          <span>Pets</span>
          {petsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-none w-5 h-5 flex items-center justify-center">
              {petsCount}
            </span>
          )}
        </button>
        <button
          onClick={onOpenLottery}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded-none border border-stone-800 transition-colors text-sm relative min-w-[44px] min-h-[44px] justify-center"
        >
          <img
            src={ASSETS.ICONS.GACHA}
            alt="Gacha"
            className="w-5 h-5 object-contain"
          />
          <span>Gacha</span>
          {lotteryTickets > 0 && (
            <span className="absolute -top-1 -right-1 bg-yellow-500 text-ink-950 text-[10px] font-bold rounded-none px-1 h-5 flex items-center justify-center min-w-[20px]">
              {lotteryTickets}
            </span>
          )}
        </button>
        {onOpenDailyQuest && (
          <button
            onClick={onOpenDailyQuest}
            className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded-none border border-stone-800 transition-colors text-sm relative min-w-[44px] min-h-[44px] justify-center"
          >
            <img
              src={ASSETS.ICONS.QUESTS}
              alt="Bounties"
              className="w-5 h-5 object-contain"
            />
            <span>Bounties</span>
            {dailyQuestCompletedCount > 0 &&
              (player.dailyQuests || []).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-none w-5 h-5 flex items-center justify-center">
                  {dailyQuestCompletedCount}/{(player.dailyQuests || []).length}
                </span>
              )}
          </button>
        )}
        {onOpenGrotto && (
          <button
            onClick={onOpenGrotto}
            className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded-none border border-stone-800 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
            title="Base"
          >
            <Home size={18} />
            <span>Base</span>
            {player.grotto && player.grotto.level > 0 && (
              <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded-none">
                Lv.{player.grotto.level}
              </span>
            )}
          </button>
        )}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 hover:bg-stone-700 rounded-none border border-stone-800 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
        >
          <img
            src={ASSETS.TOP_TAB.SETTINGS}
            alt="Settings"
            className="w-5 h-5 object-contain"
          />
          <span>Settings</span>
        </button>
        {isDebugModeEnabled && onOpenDebug && (
          <button
            onClick={onOpenDebug}
            className="flex items-center gap-2 px-3 py-2 bg-red-800 hover:bg-red-700 rounded-none border border-red-600 transition-colors text-sm min-w-[44px] min-h-[44px] justify-center"
            title="Debug Mode"
          >
            <Bug size={18} />
            <span>Debug</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default React.memo(GameHeader);
