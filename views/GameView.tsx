import React, { useMemo } from 'react';
import { PlayerStats, LogEntry } from '../types';
import StatsPanel from '../components/StatsPanel';
import LogPanel from '../components/LogPanel';
import CombatVisuals from '../components/CombatVisuals';
import MobileSidebar from '../components/MobileSidebar';
import GameHeader from './GameHeader';
import ActionBar from './ActionBar';
import {
  PurchaseSuccessToast,
  LotteryRewardsToast,
  ItemActionToast,
} from './NotificationToast';

/**
 * Game View Component
 * Contains Header, Action Bar, Log Panel, Stats Panel, and Mobile Sidebar
 * Header: Title, Menu, Desktop Buttons
 * Action Bar: Meditate, Exploration, Zones, Lab, Factions
 * Log Panel: Game logs
 * Stats Panel: Player stats
 * Mobile Sidebar: Mods, Inventory, Character, Achievements, Pets, Supply Drop, Settings
 */

interface GameViewProps {
  player: PlayerStats;
  logs: LogEntry[];
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  visualEffects: any[];
  loading: boolean;
  cooldown: number;
  purchaseSuccess: { item: string; quantity: number } | null;
  lotteryRewards: Array<{ type: string; name: string; quantity?: number }>;
  onCloseLotteryRewards?: () => void;
  itemActionLog: { text: string; type: string } | null;
  isMobileSidebarOpen: boolean;
  isMobileStatsOpen: boolean;
  modals: {
    isInventoryOpen: boolean;
    isCultivationOpen: boolean;
    isCharacterOpen: boolean;
    isAchievementOpen: boolean;
    isPetOpen: boolean;
    isLotteryOpen: boolean;
    isSettingsOpen: boolean;
    isRealmOpen: boolean;
    isAlchemyOpen: boolean;
    isSectOpen: boolean;
    setIsMobileSidebarOpen: (open: boolean) => void;
    setIsMobileStatsOpen: (open: boolean) => void;
    setIsInventoryOpen: (open: boolean) => void;
    setIsCultivationOpen: (open: boolean) => void;
    setIsCharacterOpen: (open: boolean) => void;
    setIsAchievementOpen: (open: boolean) => void;
    setIsPetOpen: (open: boolean) => void;
    setIsLotteryOpen: (open: boolean) => void;
    setIsSettingsOpen: (open: boolean) => void;
    setIsRealmOpen: (open: boolean) => void;
    setIsAlchemyOpen: (open: boolean) => void;
    setIsSectOpen: (open: boolean) => void;
  };
  handlers: {
    onMeditate: () => void;
    onAdventure: () => void;
    onOpenRealm: () => void;
    onOpenAlchemy: () => void;
    onOpenSect: () => void;
    onOpenMenu: () => void;
    onOpenCultivation: () => void;
    onOpenInventory: () => void;
    onOpenCharacter: () => void;
    onOpenAchievement: () => void;
    onOpenPet: () => void;
    onOpenLottery: () => void;
    onOpenDailyQuest?: () => void;
    onOpenGrotto?: () => void;
    onOpenSettings: () => void;
    onOpenStats: () => void;
    onOpenDebug?: () => void;
    onUpdateViewedAchievements: () => void;
    autoMeditate: boolean;
    autoAdventure: boolean;
    onToggleAutoMeditate: () => void;
    onToggleAutoAdventure: () => void;
  };
  isDebugModeEnabled?: boolean;
}

function GameView({
  player,
  logs,
  setLogs,
  visualEffects,
  loading,
  cooldown,
  purchaseSuccess,
  lotteryRewards,
  onCloseLotteryRewards,
  itemActionLog,
  isMobileSidebarOpen,
  isMobileStatsOpen,
  modals,
  handlers,
  isDebugModeEnabled = false,
}: GameViewProps) {
  // Calculate pending achievements
  const achievementCount = useMemo(
    () =>
      player.achievements.filter((a) => !player.viewedAchievements.includes(a))
        .length,
    [player.achievements, player.viewedAchievements]
  );

  const petCount = useMemo(() => player.pets.length, [player.pets.length]);

  const lotteryTickets = useMemo(
    () => player.lotteryTickets,
    [player.lotteryTickets]
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-stone-900 text-stone-200 overflow-hidden relative">
      {/* Visual Effects Layer */}
      <CombatVisuals effects={visualEffects} />

      <div className="hidden md:block">
        <StatsPanel player={player} />
      </div>

      <main className="flex-1 flex flex-col h-full relative min-w-0">
        <GameHeader
          player={player}
          onOpenMenu={handlers.onOpenMenu}
          onOpenCultivation={handlers.onOpenCultivation}
          onOpenInventory={handlers.onOpenInventory}
          onOpenCharacter={handlers.onOpenCharacter}
          onOpenAchievement={handlers.onOpenAchievement}
          onOpenPet={handlers.onOpenPet}
          onOpenLottery={handlers.onOpenLottery}
          onOpenDailyQuest={handlers.onOpenDailyQuest}
          onOpenGrotto={handlers.onOpenGrotto}
          onOpenSettings={handlers.onOpenSettings}
          onOpenDebug={handlers.onOpenDebug}
          isDebugModeEnabled={isDebugModeEnabled}
        />

        <LogPanel
          logs={logs}
          playerName={player.name}
          className="pb-[23rem] md:pb-0"
          onClearLogs={() => setLogs([])}
        />

        <ActionBar
          loading={loading}
          cooldown={cooldown}
          onMeditate={handlers.onMeditate}
          onAdventure={handlers.onAdventure}
          onOpenRealm={handlers.onOpenRealm}
          onOpenAlchemy={handlers.onOpenAlchemy}
          onOpenSect={handlers.onOpenSect}
          autoMeditate={handlers.autoMeditate}
          autoAdventure={handlers.autoAdventure}
          onToggleAutoMeditate={handlers.onToggleAutoMeditate}
          onToggleAutoAdventure={handlers.onToggleAutoAdventure}
        />
      </main>

      {/* Auto-Adventure Prompt */}
      {handlers.autoAdventure && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none">
          <div className="bg-stone-800/90 backdrop-blur-sm border border-stone-600/50 rounded-lg px-6 py-3 shadow-lg">
            <p className="text-stone-300 text-lg md:text-xl font-serif">
              AUTO-EXPLORING <span className="text-stone-500">Press SPACE to cancel...</span>
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {purchaseSuccess && (
        <PurchaseSuccessToast
          item={purchaseSuccess.item}
          quantity={purchaseSuccess.quantity}
        />
      )}
      <LotteryRewardsToast
        rewards={lotteryRewards}
        onClose={onCloseLotteryRewards}
      />
      {itemActionLog && (
        <ItemActionToast
          log={{
            id: '',
            text: itemActionLog.text,
            type: itemActionLog.type as LogEntry['type'],
            timestamp: Date.now(),
          }}
        />
      )}

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => modals.setIsMobileSidebarOpen(false)}
        onOpenStats={handlers.onOpenStats}
        onOpenCultivation={handlers.onOpenCultivation}
        onOpenInventory={handlers.onOpenInventory}
        onOpenCharacter={handlers.onOpenCharacter}
        onOpenAchievement={handlers.onOpenAchievement}
        onOpenPet={handlers.onOpenPet}
        onOpenLottery={handlers.onOpenLottery}
        onOpenSettings={handlers.onOpenSettings}
        onOpenDebug={handlers.onOpenDebug}
        isDebugModeEnabled={isDebugModeEnabled}
        achievementCount={achievementCount}
        petCount={petCount}
        lotteryTickets={lotteryTickets}
        player={player}
      />

      {isMobileStatsOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-end justify-center z-[70] p-0 md:hidden touch-manipulation"
          onClick={() => modals.setIsMobileStatsOpen(false)}
        >
          <div
            className="bg-paper-800 w-full h-[80vh] rounded-t-2xl border border-stone-700 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <StatsPanel player={player} />
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(GameView);
