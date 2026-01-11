/**
 * App State Management Hook
 * Unified management of all modal states, shop states, notification states, etc.
 */

import { useState, useCallback } from 'react';
import {
  Item,
  Shop,
  AdventureType,
  RealmType,
  AdventureResult,
  RiskLevel,
} from '../types';
import { BattleReplay } from '../services/battleService';
import { AutoAdventureConfig } from '../components/AutoAdventureConfigModal';
import { ItemActionLog } from './useItemActionLog';

export interface AppModalState {
  isInventoryOpen: boolean;
  isCultivationOpen: boolean;
  isAlchemyOpen: boolean;
  isUpgradeOpen: boolean;
  isSectOpen: boolean;
  isRealmOpen: boolean;
  isCharacterOpen: boolean;
  isAchievementOpen: boolean;
  isPetOpen: boolean;
  isLotteryOpen: boolean;
  isSettingsOpen: boolean;
  isDailyQuestOpen: boolean;
  isShopOpen: boolean;
  isGrottoOpen: boolean;
  isDebugOpen: boolean;
  isBattleModalOpen: boolean;
  isTurnBasedBattleOpen: boolean;
  isMobileSidebarOpen: boolean;
  isMobileStatsOpen: boolean;
  isDebugModeEnabled: boolean;
  isReputationEventOpen: boolean;
  isTreasureVaultOpen: boolean;
  isAutoAdventureConfigOpen: boolean;
}

export interface AppModalSetters {
  setIsInventoryOpen: (open: boolean) => void;
  setIsCultivationOpen: (open: boolean) => void;
  setIsAlchemyOpen: (open: boolean) => void;
  setIsUpgradeOpen: (open: boolean) => void;
  setIsSectOpen: (open: boolean) => void;
  setIsRealmOpen: (open: boolean) => void;
  setIsCharacterOpen: (open: boolean) => void;
  setIsAchievementOpen: (open: boolean) => void;
  setIsPetOpen: (open: boolean) => void;
  setIsLotteryOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsDailyQuestOpen: (open: boolean) => void;
  setIsShopOpen: (open: boolean) => void;
  setIsGrottoOpen: (open: boolean) => void;
  setIsDebugOpen: (open: boolean) => void;
  setIsBattleModalOpen: (open: boolean) => void;
  setIsTurnBasedBattleOpen: (open: boolean) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  setIsMobileStatsOpen: (open: boolean) => void;
  setIsDebugModeEnabled: (enabled: boolean) => void;
  setIsReputationEventOpen: (open: boolean) => void;
  setIsTreasureVaultOpen: (open: boolean) => void;
  setIsAutoAdventureConfigOpen: (open: boolean) => void;
}

export interface AppState {
  modals: AppModalState;
  setters: AppModalSetters;
  shop: {
    currentShop: Shop | null;
    setCurrentShop: (shop: Shop | null) => void;
  };
  upgrade: {
    itemToUpgrade: Item | null;
    setItemToUpgrade: (item: Item | null) => void;
  };
  notifications: {
    purchaseSuccess: { item: string; quantity: number } | null;
    setPurchaseSuccess: (value: { item: string; quantity: number } | null) => void;
    lotteryRewards: Array<{ type: string; name: string; quantity?: number }>;
    setLotteryRewards: (value: Array<{ type: string; name: string; quantity?: number }>) => void;
  };
  battle: {
    battleReplay: BattleReplay | null;
    setBattleReplay: (replay: BattleReplay | null) => void;
    revealedBattleRounds: number;
    setRevealedBattleRounds: (rounds: number) => void;
    lastBattleReplay: BattleReplay | null;
    setLastBattleReplay: (replay: BattleReplay | null) => void;
  };
  turnBasedBattle: {
    params: {
      adventureType: AdventureType;
      riskLevel?: RiskLevel;
      realmMinRealm?: RealmType;
      bossId?: string;
    } | null;
    setParams: (params: {
      adventureType: AdventureType;
      riskLevel?: RiskLevel;
      realmMinRealm?: RealmType;
      bossId?: string;
    } | null) => void;
  };
  itemActionLog: {
    value: { text: string; type: string } | null;
    setValue: (value: { text: string; type: string } | null) => void;
  };
  reputationEvent: {
    event: AdventureResult['reputationEvent'] | null;
    setEvent: (event: AdventureResult['reputationEvent'] | null) => void;
  };
  auto: {
    autoMeditate: boolean;
    setAutoMeditate: (value: boolean) => void;
    autoAdventure: boolean;
    setAutoAdventure: (value: boolean) => void;
    autoAdventureConfig: AutoAdventureConfig;
    setAutoAdventureConfig: (config: AutoAdventureConfig) => void;
    pausedByShop: boolean;
    setPausedByShop: (value: boolean) => void;
    pausedByBattle: boolean;
    setPausedByBattle: (value: boolean) => void;
    pausedByReputationEvent: boolean;
    setPausedByReputationEvent: (value: boolean) => void;
    pausedByHeavenEarthSoul: boolean;
    setPausedByHeavenEarthSoul: (value: boolean) => void;
  };
  global: {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    cooldown: number;
    setCooldown: (cooldown: number) => void;
  };
  actions: {
    closeCurrentModal: () => void;
    openTurnBasedBattle: (params: {
      adventureType: AdventureType;
      riskLevel?: RiskLevel;
      realmMinRealm?: RealmType;
      bossId?: string;
    }) => void;
  };
}

/**
 * Unified management of all App states
 */
export function useAppState(): AppState {
  // Modal states
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCultivationOpen, setIsCultivationOpen] = useState(false);
  const [isAlchemyOpen, setIsAlchemyOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isSectOpen, setIsSectOpen] = useState(false);
  const [isRealmOpen, setIsRealmOpen] = useState(false);
  const [isCharacterOpen, setIsCharacterOpen] = useState(false);
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  const [isPetOpen, setIsPetOpen] = useState(false);
  const [isLotteryOpen, setIsLotteryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDailyQuestOpen, setIsDailyQuestOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isGrottoOpen, setIsGrottoOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isBattleModalOpen, setIsBattleModalOpen] = useState(false);
  const [isTurnBasedBattleOpen, setIsTurnBasedBattleOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);
  const [isDebugModeEnabled, setIsDebugModeEnabled] = useState(false);
  const [isReputationEventOpen, setIsReputationEventOpen] = useState(false);
  const [isTreasureVaultOpen, setIsTreasureVaultOpen] = useState(false);
  const [isAutoAdventureConfigOpen, setIsAutoAdventureConfigOpen] = useState(false);

  // Shop states
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);

  // Upgrade states
  const [itemToUpgrade, setItemToUpgrade] = useState<Item | null>(null);

  // Notification states
  const [purchaseSuccess, setPurchaseSuccess] = useState<{
    item: string;
    quantity: number;
  } | null>(null);
  const [lotteryRewards, setLotteryRewards] = useState<
    Array<{ type: string; name: string; quantity?: number }>
  >([]);

  // Battle states
  const [battleReplay, setBattleReplay] = useState<BattleReplay | null>(null);
  const [revealedBattleRounds, setRevealedBattleRounds] = useState(0);
  const [lastBattleReplay, setLastBattleReplay] = useState<BattleReplay | null>(null);

  // Turn-based battle states
  const [turnBasedBattleParams, setTurnBasedBattleParams] = useState<{
    adventureType: AdventureType;
    riskLevel?: RiskLevel;
    realmMinRealm?: RealmType;
    bossId?: string;
  } | null>(null);

  // Item Action Log
  const [itemActionLog, setItemActionLog] = useState<ItemActionLog | null>(null);

  // Reputation Event
  const [reputationEvent, setEvent] = useState<AdventureResult['reputationEvent'] | null>(null);

  // Auto Features State
  const [autoMeditate, setAutoMeditate] = useState(false);
  const [autoAdventure, setAutoAdventure] = useState(false);
  const [autoAdventureConfig, setAutoAdventureConfig] = useState({
    skipBattle: true,
    fleeOnBattle: false,
    skipShop: true, // Default skip shop
    skipReputationEvent: true,
    minHpThreshold: 20, // Default no limit (low threshold)
  });
  const [pausedByShop, setPausedByShop] = useState(false);
  const [pausedByBattle, setPausedByBattle] = useState(false);
  const [pausedByReputationEvent, setPausedByReputationEvent] = useState(false);
  const [pausedByHeavenEarthSoul, setPausedByHeavenEarthSoul] = useState(false);

  // Global loading and cooldown states
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Close currently open modal
  const closeCurrentModal = useCallback(() => {
    // In auto-adventure mode, do not allow closing turn-based battle modal via shortcut
    if (isTurnBasedBattleOpen && autoAdventure) {
      return;
    }

    if (isShopOpen) {
      setIsShopOpen(false);
      setCurrentShop(null);
    }
    else if (isInventoryOpen) setIsInventoryOpen(false);
    else if (isCultivationOpen) setIsCultivationOpen(false);
    else if (isCharacterOpen) setIsCharacterOpen(false);
    else if (isAchievementOpen) setIsAchievementOpen(false);
    else if (isPetOpen) setIsPetOpen(false);
    else if (isLotteryOpen) setIsLotteryOpen(false);
    else if (isSettingsOpen) setIsSettingsOpen(false);
    else if (isRealmOpen) setIsRealmOpen(false);
    else if (isAlchemyOpen) setIsAlchemyOpen(false);
    else if (isSectOpen) setIsSectOpen(false);
    else if (isDailyQuestOpen) setIsDailyQuestOpen(false);
    else if (isGrottoOpen) setIsGrottoOpen(false);
    else if (isUpgradeOpen) {
      setIsUpgradeOpen(false);
      setItemToUpgrade(null);
    }
    else if (isBattleModalOpen) setIsBattleModalOpen(false);
    else if (isTurnBasedBattleOpen) {
      setIsTurnBasedBattleOpen(false);
      setTurnBasedBattleParams(null);
      if (pausedByBattle) {
        setPausedByBattle(false);
      }
    }
    else if (isReputationEventOpen) setIsReputationEventOpen(false);
    else if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
    else if (isMobileStatsOpen) setIsMobileStatsOpen(false);
    else if (isDebugOpen) setIsDebugOpen(false);
  }, [
    isShopOpen, isInventoryOpen, isCultivationOpen, isCharacterOpen,
    isAchievementOpen, isPetOpen, isLotteryOpen, isSettingsOpen,
    isRealmOpen, isAlchemyOpen, isSectOpen, isDailyQuestOpen,
    isGrottoOpen, isUpgradeOpen, isBattleModalOpen, isTurnBasedBattleOpen,
    isReputationEventOpen, isMobileSidebarOpen, isMobileStatsOpen, isDebugOpen,
    autoAdventure, pausedByBattle
  ]);

  // Unified handling of turn-based battle open logic
  const openTurnBasedBattle = useCallback((params: {
    adventureType: AdventureType;
    riskLevel?: RiskLevel;
    realmMinRealm?: RealmType;
    bossId?: string;
  }) => {
    // If auto-adventuring, pause but save state
    if (autoAdventure) {
      setAutoAdventure(false);
      setPausedByBattle(true);
    }
    setTurnBasedBattleParams(params);
    setIsTurnBasedBattleOpen(true);
  }, [autoAdventure, setAutoAdventure, setPausedByBattle, setTurnBasedBattleParams, setIsTurnBasedBattleOpen]);

  return {
    modals: {
      isInventoryOpen,
      isCultivationOpen,
      isAlchemyOpen,
      isUpgradeOpen,
      isSectOpen,
      isRealmOpen,
      isCharacterOpen,
      isAchievementOpen,
      isPetOpen,
      isLotteryOpen,
      isSettingsOpen,
      isDailyQuestOpen,
      isShopOpen,
      isGrottoOpen,
      isDebugOpen,
      isBattleModalOpen,
      isTurnBasedBattleOpen,
      isMobileSidebarOpen,
      isMobileStatsOpen,
      isDebugModeEnabled,
      isReputationEventOpen,
      isTreasureVaultOpen,
      isAutoAdventureConfigOpen,
    },
    setters: {
      setIsInventoryOpen,
      setIsCultivationOpen,
      setIsAlchemyOpen,
      setIsUpgradeOpen,
      setIsSectOpen,
      setIsRealmOpen,
      setIsCharacterOpen,
      setIsAchievementOpen,
      setIsPetOpen,
      setIsLotteryOpen,
      setIsSettingsOpen,
      setIsDailyQuestOpen,
      setIsShopOpen,
      setIsGrottoOpen,
      setIsDebugOpen,
      setIsBattleModalOpen,
      setIsTurnBasedBattleOpen,
      setIsMobileSidebarOpen,
      setIsMobileStatsOpen,
      setIsDebugModeEnabled,
      setIsReputationEventOpen,
      setIsTreasureVaultOpen,
      setIsAutoAdventureConfigOpen,
    },
    shop: {
      currentShop,
      setCurrentShop,
    },
    upgrade: {
      itemToUpgrade,
      setItemToUpgrade,
    },
    notifications: {
      purchaseSuccess,
      setPurchaseSuccess,
      lotteryRewards,
      setLotteryRewards,
    },
    battle: {
      battleReplay,
      setBattleReplay,
      revealedBattleRounds,
      setRevealedBattleRounds,
      lastBattleReplay,
      setLastBattleReplay,
    },
    turnBasedBattle: {
      params: turnBasedBattleParams,
      setParams: setTurnBasedBattleParams,
    },
    itemActionLog: {
      value: itemActionLog,
      setValue: setItemActionLog,
    },
    reputationEvent: {
      event: reputationEvent,
      setEvent,
    },
    auto: {
      autoMeditate,
      setAutoMeditate,
      autoAdventure,
      setAutoAdventure,
      autoAdventureConfig,
      setAutoAdventureConfig,
      pausedByShop,
      setPausedByShop,
      pausedByBattle,
      setPausedByBattle,
      pausedByReputationEvent,
      setPausedByReputationEvent,
      pausedByHeavenEarthSoul,
      setPausedByHeavenEarthSoul,
    },
    global: {
      loading,
      setLoading,
      cooldown,
      setCooldown,
    },
    actions: {
      closeCurrentModal,
      openTurnBasedBattle,
    },
  };
}
