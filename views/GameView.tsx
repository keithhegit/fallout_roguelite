import React, { useCallback, useMemo, useState } from 'react';
import { User, Briefcase, Radio, Menu, Map } from 'lucide-react';
import { PlayerStats, LogEntry } from '../types';
import { ASSETS } from '../constants/assets';
import { ItemActionLog } from '../hooks/useItemActionLog';
import StatsPanel from '../components/StatsPanel';
import LogPanel from '../components/LogPanel';
import CombatVisuals, { VisualEffect } from '../components/CombatVisuals';
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
  visualEffects: VisualEffect[];
  loading: boolean;
  cooldown: number;
  purchaseSuccess: { item: string; quantity: number } | null;
  lotteryRewards: Array<{ type: string; name: string; quantity?: number }>;
  onCloseLotteryRewards?: () => void;
  itemActionLog: ItemActionLog | null;
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
  const [mobileTab, setMobileTab] = useState<'status' | 'radio'>('radio');

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

  const handleSelectRadioTab = useCallback(() => {
    setMobileTab('radio');
    modals.setIsMobileStatsOpen(false);
    modals.setIsMobileSidebarOpen(false);
  }, [modals]);

  const handleSelectStatusTab = useCallback(() => {
    setMobileTab('status');
    modals.setIsMobileStatsOpen(false);
    modals.setIsMobileSidebarOpen(false);
  }, [modals]);

  const handleOpenMenuTab = useCallback(() => {
    setMobileTab('radio');
    modals.setIsMobileStatsOpen(false);
    modals.setIsMobileSidebarOpen(true);
  }, [modals]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-stone-950 text-stone-200 overflow-hidden relative crt-screen">
      {/* CRT Visual Layers */}
      <div className="crt-noise"></div>
      <div className="crt-vignette"></div>
      <div className="scanline-overlay pointer-events-none"></div>

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

        {mobileTab === 'status' ? (
          <div className="flex-1 bg-stone-950 overflow-y-auto md:hidden animate-fade-in">
            <StatsPanel player={player} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
            <LogPanel
              logs={logs}
              playerName={player.name}
              className="pb-24 md:pb-0"
              onClearLogs={() => setLogs([])}
            />
          </div>
        )}

        <div className={mobileTab === 'radio' ? 'block animate-fade-in' : 'hidden md:block'}>
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
        </div>

        <nav className="md:hidden bg-stone-950 border-t border-stone-700 grid grid-cols-5 safe-area-footer shrink-0 relative overflow-hidden">
          {/* Scanline Effect */}
          <div className="scanline-overlay opacity-50"></div>
          
          <button
            onClick={handleSelectStatusTab}
            className={`min-h-[56px] py-1 flex flex-col items-center justify-center touch-manipulation transition-all duration-200 relative z-20 ${
              mobileTab === 'status'
                ? 'text-amber-400 bg-stone-900/50 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]'
                : 'text-stone-500 active:bg-stone-900'
            }`}
          >
            <User size={20} className={mobileTab === 'status' ? 'terminal-flicker mb-1' : 'mb-1'} />
            <span className="text-[10px] font-serif uppercase tracking-wider font-bold">Status</span>
            {mobileTab === 'status' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></div>}
          </button>
          <button
            onClick={() => {
              handlers.onOpenInventory();
              handleSelectRadioTab();
            }}
            className="min-h-[56px] py-1 flex flex-col items-center justify-center touch-manipulation transition-colors text-stone-500 active:bg-stone-900 relative z-20"
          >
            <Briefcase size={20} className="mb-1" />
            <span className="text-[10px] font-serif uppercase tracking-wider font-bold">Inv</span>
          </button>
          <button
            onClick={handleSelectRadioTab}
            className={`min-h-[56px] py-1 flex flex-col items-center justify-center touch-manipulation transition-all duration-200 relative z-20 ${
              mobileTab === 'radio'
                ? 'text-amber-400 bg-stone-900/50 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]'
                : 'text-stone-500 active:bg-stone-900'
            }`}
          >
            <Radio size={20} className={mobileTab === 'radio' ? 'terminal-flicker mb-1' : 'mb-1'} />
            <span className="text-[10px] font-serif uppercase tracking-wider font-bold">Radio</span>
            {mobileTab === 'radio' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"></div>}
          </button>
          <button
            onClick={handleOpenMenuTab}
            className="min-h-[56px] py-1 flex flex-col items-center justify-center touch-manipulation transition-colors text-stone-500 active:bg-stone-900 relative z-20"
          >
            <Menu size={20} className="mb-1" />
            <span className="text-[10px] font-serif uppercase tracking-wider font-bold">Data</span>
          </button>
          <button
            onClick={() => {
              handlers.onOpenRealm();
              handleSelectRadioTab();
            }}
            className="min-h-[56px] py-1 flex flex-col items-center justify-center touch-manipulation transition-colors text-stone-500 active:bg-stone-900 relative z-20"
          >
            <Map size={20} className="mb-1" />
            <span className="text-[10px] font-serif uppercase tracking-wider font-bold">Map</span>
          </button>
        </nav>
      </main>

      {/* Auto-Adventure Prompt */}
      {handlers.autoAdventure && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none">
          <div className="bg-ink-950/90 backdrop-blur-sm border border-stone-800 px-6 py-3 shadow-lg">
            <p className="text-stone-300 text-lg md:text-xl font-serif">
              AUTO-EXPLORING <span className="text-stone-500 uppercase tracking-widest text-xs ml-2">Press SPACE to cancel...</span>
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
          key={itemActionLog.timestamp}
          log={{
            id: '',
            text: itemActionLog.text,
            type: itemActionLog.type as LogEntry['type'],
            timestamp: itemActionLog.timestamp || 0,
          }}
        />
      )}

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => modals.setIsMobileSidebarOpen(false)}
        onOpenCultivation={handlers.onOpenCultivation}
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
            className="bg-ink-950 w-full h-[80vh] border border-stone-800 shadow-2xl overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background texture layer */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
            {/* CRT scanline effect */}
            <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
            
            <div className="relative z-10">
              <StatsPanel player={player} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(GameView);
