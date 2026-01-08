import React, { useMemo, useCallback } from 'react';
import {
  X,
  BookOpen,
  Star,
  Trophy,
  Sparkles,
  Gift,
  Settings,
  Bug,
  Home,
} from 'lucide-react';
import { PlayerStats } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenCultivation: () => void;
  onOpenCharacter: () => void;
  onOpenAchievement: () => void;
  onOpenPet: () => void;
  onOpenLottery: () => void;
  onOpenSettings: () => void;
  onOpenGrotto?: () => void;
  onOpenDebug?: () => void;
  isDebugModeEnabled?: boolean;
  achievementCount?: number;
  petCount?: number;
  lotteryTickets?: number;
  player?: PlayerStats; // 用于显示洞府等级
}

const MobileSidebar: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenCultivation,
  onOpenCharacter,
  onOpenAchievement,
  onOpenPet,
  onOpenLottery,
  onOpenSettings,
  onOpenGrotto,
  onOpenDebug,
  isDebugModeEnabled = false,
  achievementCount = 0,
  petCount = 0,
  lotteryTickets = 0,
  player,
}) => {
  const menuItems = useMemo(
    () => [
      {
        icon: BookOpen,
        label: 'Mods',
        onClick: onOpenCultivation,
        color: 'text-blue-400',
      },
      {
        icon: Star,
        label: 'Character',
        onClick: onOpenCharacter,
        color: 'text-yellow-400',
      },
      {
        icon: Trophy,
        label: 'Achievements',
        onClick: onOpenAchievement,
        color: 'text-purple-400',
        badge: achievementCount > 0 ? achievementCount : undefined,
      },
      {
        icon: Sparkles,
        label: 'Pets',
        onClick: onOpenPet,
        color: 'text-cyan-400',
        badge: petCount > 0 ? petCount : undefined,
      },
      {
        icon: Gift,
        label: 'Gacha',
        onClick: onOpenLottery,
        color: 'text-orange-400',
        badge: lotteryTickets > 0 ? lotteryTickets : undefined,
      },
      ...(onOpenGrotto
        ? [
            {
              icon: Home,
              label: 'Base',
              onClick: onOpenGrotto,
              color: 'text-purple-400',
              badge: player?.grotto?.level > 0 ? `Lv.${player.grotto.level}` : undefined,
            },
          ]
        : []),
      {
        icon: Settings,
        label: 'Settings',
        onClick: onOpenSettings,
        color: 'text-stone-400',
      },
      ...(isDebugModeEnabled && onOpenDebug
        ? [
            {
              icon: Bug,
              label: 'Debug',
              onClick: onOpenDebug,
              color: 'text-red-400',
            },
          ]
        : []),
    ],
    [
      onOpenCultivation,
      onOpenCharacter,
      onOpenAchievement,
      onOpenPet,
      onOpenLottery,
      onOpenSettings,
      onOpenGrotto,
      onOpenDebug,
      isDebugModeEnabled,
      achievementCount,
      petCount,
      lotteryTickets,
      player,
    ]
  );

  const handleItemClick = useCallback(
    (onClick: () => void) => {
      onClick();
      onClose();
    },
    [onClose]
  );

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 right-0 h-full w-64 bg-ink-950 border-l border-stone-800 shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out md:hidden
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-ink-800">
            <h2 className="text-lg font-mono text-amber-400 uppercase tracking-widest">Menu</h2>
            <button
              onClick={onClose}
              className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              <X size={24} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleItemClick(item.onClick)}
                  className="w-full flex items-center gap-3 px-4 py-4 bg-ink-800 hover:bg-ink-700 active:bg-ink-600 rounded-none border border-stone-800 mb-2 transition-colors touch-manipulation min-h-[56px]"
                >
                  <Icon size={22} className={item.color} />
                  <span className="text-stone-200 font-mono uppercase tracking-wider flex-1 text-left">
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <span className={`text-white text-xs px-2 py-0.5 rounded-none font-bold ${
                      typeof item.badge === 'string' && item.badge.startsWith('Lv.')
                        ? 'bg-purple-500'
                        : 'bg-red-500 w-6 h-6 flex items-center justify-center'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(MobileSidebar);
