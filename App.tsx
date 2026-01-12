import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { checkBreakthroughConditions } from './utils/cultivationUtils';
import {
  Item,
  Shop,
  ShopItem,
  ShopType,
  EquipmentSlot,
  TribulationState,
  TribulationResult,
  RealmType,
} from './types';
import WelcomeScreen from './components/WelcomeScreen';
import StartScreen from './components/StartScreen';
import DeathModal from './components/DeathModal';
import DebugModal from './components/DebugModal';
import SaveManagerModal from './components/SaveManagerModal';
import SaveCompareModal from './components/SaveCompareModal';
import TribulationModal from './components/TribulationModal';
import CultivationIntroModal from './components/CultivationIntroModal';
import AutoAdventureConfigModal from './components/AutoAdventureConfigModal';
import { CRTOverlay } from './components/CRTOverlay';
import {
  SaveData,
  ensurePlayerStatsCompatibility,
} from './utils/saveManagerUtils';
import { BattleReplay } from './services/battleService';
import { useGameState } from './hooks/useGameState';
import { useGameEffects } from './hooks/useGameEffects';
import { useUI } from './context/UIContext';
import { useDeathDetection } from './hooks/useDeathDetection';
import { useAutoFeatures } from './hooks/useAutoFeatures';
import { usePassiveRegeneration } from './hooks/usePassiveRegeneration';
import { useAutoGrottoHarvest } from './hooks/useAutoGrottoHarvest';
import { useBattleResultHandler } from './hooks/useBattleResultHandler';
import { STORAGE_KEYS } from './constants/storageKeys';
import { showConfirm } from './utils/toastUtils';
import AlertModal from './components/AlertModal';
import { useItemActionLog } from './hooks/useItemActionLog';
import { REALM_ORDER, TRIBULATION_CONFIG } from './constants/index';
import {
  useKeyboardShortcuts,
  KeyboardShortcut,
} from './hooks/useKeyboardShortcuts';
import {
  getShortcutConfig,
  configToShortcut,
} from './utils/shortcutUtils';
import { compareItemEffects } from './utils/objectUtils';
import { shouldTriggerTribulation, createTribulationState } from './utils/tribulationUtils';
import { getPlayerTotalStats } from './utils/statUtils';
import { isValidDailyQuestType } from './utils/typeGuards';

import { useIndexedDB } from './hooks/useIndexedDB';
import { usePlayTime } from './hooks/usePlayTime';
import { useLocale } from './hooks/useLocale';
import { useGameInitialization } from './hooks/useGameInitialization';
import { useLevelUp } from './hooks/useLevelUp';
import { useGlobalAlert } from './hooks/useGlobalAlert';
import { useRebirth } from './hooks/useRebirth';
import { logger } from './utils/logger';
import { CultivationArt, Recipe, SecretRealm, BattleResult, AdventureResult } from './types';
import { RandomSectTask } from './services/randomService';

// Import modularized handlers
import {
  useMeditationHandlers, // Meditation
  useBreakthroughHandlers, // Breakthrough
  useBattleHandlers, // Battle
  useItemHandlers, // Items
  useEquipmentHandlers, // Equipment
  useCultivationHandlers, // Mods/Cultivation
  useAlchemyHandlers, // Lab/Alchemy
  useCharacterHandlers, // Character
  useShopHandlers, // Shop
  useSettingsHandlers, // Settings
  useRealmHandlers, // Wasteland/Realm
  usePetHandlers, // Pets
  useLotteryHandlers, // Gacha/Lottery
  useSectHandlers, // Faction/Sect
  useAchievementHandlers, // Achievements
  useAdventureHandlers, // Exploration
  useDailyQuestHandlers, // Daily Bounties
  useGrottoHandlers, // Base/Grotto
  GameView, // Game View
  ModalsContainer, // Modals Container
} from './views';

function App() {
  const { t, locale, setLocale } = useLocale();
  // Manage game state with custom hooks
  const {
    hasSave, // Check for save data
    setHasSave, // Set save presence
    gameStarted, // Game start state
    player, // Player stats
    setPlayer, // Set player stats
    settings, // Game settings
    setSettings, // Set game settings
    logs, // Game logs
    setLogs, // Set game logs
    handleStartGame, // Start game handler
    setGameStarted, // Set game start state (for rebirth)
    saveGame, // Save game function
  } = useGameState();

  // Welcome Screen State - Always show welcome screen, let user choose to continue or start
  const [showWelcome, setShowWelcome] = useState(true);

  // Cultivation Intro Modal State
  const [showCultivationIntro, setShowCultivationIntro] = useState(false);

  // Use custom hooks to manage game effects
  const { visualEffects, createAddLog, triggerVisual } = useGameEffects();
  const addLog = createAddLog(setLogs);

  // Use unified App state management (via Context)
  const appState = useUI();
  const {
    modals,
    setters,
    shop,
    upgrade,
    notifications,
    battle,
    turnBasedBattle,
    itemActionLog,
    auto,
    actions,
  } = appState;

  const {
    autoMeditate,
    setAutoMeditate,
    autoAdventure,
    setAutoAdventure,
    autoAdventureConfig,
    setAutoAdventureConfig,
  } = auto;

  const { closeCurrentModal: handleCloseCurrentModal, openTurnBasedBattle: handleOpenTurnBasedBattle } = actions;

  // Destructure state for use
  const {
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
    isReputationEventOpen,
    isTreasureVaultOpen,
  } = modals;

  const {
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
  } = setters;

  const { isDebugModeEnabled, isAutoAdventureConfigOpen } = modals;

  // Check if debug mode is enabled
  useEffect(() => {
    const debugMode = localStorage.getItem(STORAGE_KEYS.DEBUG_MODE) === 'true';
    setIsDebugModeEnabled(debugMode);
  }, []);

  const { currentShop, setCurrentShop } = shop;
  const { setItemToUpgrade } = upgrade;
  const {
    purchaseSuccess,
    setPurchaseSuccess,
    lotteryRewards,
    setLotteryRewards,
  } = notifications;
  const { event: reputationEvent, setEvent: setReputationEvent } =
    appState.reputationEvent;
  const {
    battleReplay,
    setBattleReplay,
    revealedBattleRounds,
    setRevealedBattleRounds,
    lastBattleReplay,
    setLastBattleReplay,
  } = battle;
  const { params: turnBasedBattleParams, setParams: setTurnBasedBattleParams } =
    turnBasedBattle;
  const { value: itemActionLogValue, setValue: setItemActionLogRaw } =
    itemActionLog;

  // Use common hook to manage itemActionLog, automatically handle delayed clearing
  const { itemActionLog: delayedItemActionLog, setItemActionLog } = useItemActionLog({
    delay: 3000,
    externalSetter: setItemActionLogRaw,
  });

  // Use custom hook to handle game initialization
  useGameInitialization();

  // Check if cultivation intro modal needs to be shown (show on new game, do not show if already shown)
  useEffect(() => {
    if (gameStarted && player && !localStorage.getItem(STORAGE_KEYS.CULTIVATION_INTRO_SHOWN)) {
      // Delay showing for a short time to ensure game interface is loaded
      const timer = setTimeout(() => {
        setShowCultivationIntro(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameStarted, player]);

  const { loading, setLoading, cooldown, setCooldown } = appState.global;

  // Use custom hook to handle playtime and saving
  usePlayTime({
    gameStarted,
    player,
    setPlayer,
    saveGame,
    logs,
  });

  const { alertState, setAlertState, closeAlert } = useGlobalAlert();

  // Save Manager State
  const [isSaveManagerOpen, setIsSaveManagerOpen] = useState(false);
  const [isSaveCompareOpen, setIsSaveCompareOpen] = useState(false);
  const [compareSave1, setCompareSave1] = useState<SaveData | null>(null);
  const [compareSave2, setCompareSave2] = useState<SaveData | null>(null);

  // Tribulation Modal State
  const [tribulationState, setTribulationState] = useState<TribulationState | null>(null);

  // Initialize all modular handlers
  const battleHandlers = useBattleHandlers({
    battleReplay,
    setBattleReplay,
    isBattleModalOpen,
    setIsBattleModalOpen,
    revealedBattleRounds,
    setRevealedBattleRounds,
    animationSpeed: settings.animationSpeed,
  });

  // Use battle result handling hook
  const { handleBattleResult } = useBattleResultHandler({
    player,
    setPlayer,
    addLog,
    setLoading,
    updateQuestProgress: (type: string, amount: number = 1) => {
      // Type safe conversion: string -> DailyQuestType, runtime validation
      if (isValidDailyQuestType(type)) {
        dailyQuestHandlers.updateQuestProgress(type, amount);
      }
    },
  });

  const meditationHandlers = useMeditationHandlers({
    player,
    setPlayer,
    addLog,
    checkLevelUp: () => { }, // Level up logic handled in useEffect
  });

  const breakthroughHandlers = useBreakthroughHandlers({
    player,
    setPlayer,
    addLog,
    setLoading,
    loading,
  });

  // Use level up and tribulation handling hook
  const { isTribulationTriggeredRef } = useLevelUp({
    player,
    setPlayer,
    tribulationState,
    setTribulationState,
    handleBreakthrough: breakthroughHandlers.handleBreakthrough,
    addLog,
    autoAdventure, // Pass auto adventure state, do not trigger breakthrough during auto adventure
  });

  // Handle tribulation completion
  const handleTribulationComplete = (result: TribulationResult) => {
    // Do not reset flag here, let useEffect reset it when realm changes
    if (result.success) {
      // Tribulation successful, execute breakthrough (skip success rate check)
      // Pass tribulation HP loss to breakthrough handler, ensure processing in same state update
      breakthroughHandlers.handleBreakthrough(true, result.hpLoss || 0);

      if (result.hpLoss && result.hpLoss > 0) {
        addLog(t('messages.evolutionSuccess', { tier: player?.realm || '' }) + ` ${t('stats.health')} -${result.hpLoss}`, 'normal');
      } else {
        addLog(result.description || t('messages.levelUp'), 'gain');
      }
      setTribulationState(null);
    } else {
      // Tribulation failed, trigger death
      setDeathReason(result.description || t('messages.evolutionFailed'));
      setPlayer((prev) => {
        if (!prev) return prev;
        return { ...prev, hp: 0 };
      });
      setTribulationState(null);
    }
  };

  // Ensure auto adventure state is reset when new game starts
  // Reset auto adventure state when new game is detected (player changes from null to value, and is in initial state)
  const prevPlayerNameRef = useRef<string | null>(null);
  useEffect(() => {
    if (gameStarted && player) {
      // Detect if it is a true new game: player name changes, and player is in initial state (exp is 0, realm is initial realm)
      const isNewPlayer = prevPlayerNameRef.current !== null &&
        prevPlayerNameRef.current !== player.name;
      const isInitialState = player.exp === 0 &&
        player.realm === RealmType.QiRefining &&
        player.realmLevel === 1;

      if (isNewPlayer && isInitialState) {
        // Ensure auto adventure state is reset when new game starts
        setAutoAdventure(false);
      }

      prevPlayerNameRef.current = player.name;
    } else if (!gameStarted || !player) {
      // Reset ref when game not started or player is null
      prevPlayerNameRef.current = null;
    }
  }, [gameStarted, player?.name, player?.exp, player?.realm, player?.realmLevel]);

  const [isDead, setIsDead] = useState(false);
  const [deathBattleData, setDeathBattleData] = useState<BattleReplay | null>(
    null
  );
  const [deathReason, setDeathReason] = useState('');

  // Use custom hook to handle rebirth
  const { handleRebirth } = useRebirth({
    setPlayer,
    setLogs,
    setGameStarted,
    setHasSave,
    setIsDead,
    setDeathBattleData,
    setDeathReason,
  });

  const itemHandlers = useItemHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
    onOpenTreasureVault: () => setters.setIsTreasureVaultOpen(true),
  });

  const equipmentHandlers = useEquipmentHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
  });

  const cultivationHandlers = useCultivationHandlers({
    player,
    setPlayer,
    addLog,
  });

  const alchemyHandlers = useAlchemyHandlers({
    player,
    setPlayer,
    addLog,
    triggerVisual,
  });

  const characterHandlers = useCharacterHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
  });

  // Initialize new modular handlers
  const shopHandlers = useShopHandlers({
    player,
    setPlayer,
    addLog,
    currentShop,
    setCurrentShop,
    setIsShopOpen,
    setPurchaseSuccess,
  });

  const settingsHandlers = useSettingsHandlers({
    setSettings,
  });

  const petHandlers = usePetHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
  });

  const lotteryHandlers = useLotteryHandlers({
    player,
    setPlayer,
    addLog,
    setLotteryRewards,
  });

  // Grotto related logic
  const grottoHandlers = useGrottoHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
  });

  // Adventure related logic extracted to useAdventureHandlers
  const adventureHandlers = useAdventureHandlers({
    player,
    setPlayer,
    addLog,
    triggerVisual,
    setLoading,
    setCooldown,
    loading,
    cooldown,
    onOpenShop: (shopType: ShopType) => {
      // If skip shop is configured, do not open shop
      if (autoAdventure && autoAdventureConfig.skipShop) {
        return;
      }
      // Reuse shopHandlers logic
      shopHandlers.handleOpenShop(shopType);
    },
    onOpenBattleModal: (replay: BattleReplay) => {
      // Save recent battle data for death statistics
      setLastBattleReplay(replay);
      // Open battle modal (also opens in auto mode)
      battleHandlers.openBattleModal(replay);
    },
    onReputationEvent: (event) => {
      // Print debug info in test environment
      logger.debug('【Reputation Event Callback Triggered】', {
        event,
        hasChoices: !!event?.choices,
        choicesCount: event?.choices?.length || 0,
        autoAdventure,
      });

      // If skip reputation event is configured, do not open modal
      if (autoAdventure && autoAdventureConfig.skipReputationEvent) {
        return;
      }

      // Open reputation event modal
      setReputationEvent(event);
      setIsReputationEventOpen(true);

      // Confirm state setting in test environment
      logger.debug('【Reputation Event State Set】', {
        eventSet: !!event,
        shouldOpen: true,
      });
    },
    onOpenTurnBasedBattle: handleOpenTurnBasedBattle,
    skipBattle: autoAdventure && autoAdventureConfig.skipBattle, // Decide whether to skip battle based on config
    fleeOnBattle: autoAdventure && autoAdventureConfig.fleeOnBattle, // Decide whether to flee based on config
    skipShop: autoAdventure && autoAdventureConfig.skipShop, // Decide whether to skip shop based on config
    skipReputationEvent: autoAdventure && autoAdventureConfig.skipReputationEvent, // Decide whether to skip reputation event based on config
    useTurnBasedBattle: true, // Use new turn-based battle system
    autoAdventure, // Pass auto adventure state
    setAutoAdventure, // Pass function to set auto adventure state
  });

  const sectHandlers = useSectHandlers({
    player,
    setPlayer,
    addLog,
    setIsSectOpen,
    setPurchaseSuccess,
    setItemActionLog,
    onChallengeLeader: handleOpenTurnBasedBattle,
  });

  const achievementHandlers = useAchievementHandlers({
    player,
    setPlayer,
    addLog,
  });

  // Daily quest related logic
  const dailyQuestHandlers = useDailyQuestHandlers({
    player,
    setPlayer,
    addLog,
  });

  // Extract functions from handlers
  const handleSkipBattleLogs = battleHandlers.handleSkipBattleLogs;
  const handleCloseBattleModal = battleHandlers.handleCloseBattleModal;

  // Use death detection hook
  useDeathDetection({
    player,
    setPlayer,
    isDead,
    setIsDead,
    addLog,
    settings,
    lastBattleReplay,
    setDeathBattleData,
    setDeathReason,
    setIsBattleModalOpen,
    setAutoMeditate,
    setAutoAdventure,
  });


  const handleUseInheritance = breakthroughHandlers.handleUseInheritance;

  const handleUseItem = itemHandlers.handleUseItem;
  const handleOrganizeInventory = itemHandlers.handleOrganizeInventory;
  const handleDiscardItem = itemHandlers.handleDiscardItem;
  const handleRefineAdvancedItem = itemHandlers.handleRefineAdvancedItem;
  const handleBatchUse = useCallback((itemIds: string[]) => {
    itemHandlers.handleBatchUseItems(itemIds);
  }, [itemHandlers]);

  const handleBatchDiscard = useCallback((itemIds: string[]) => {
    setPlayer((prev) => {
      if (!prev) return prev;
      // Use Set to improve lookup performance, especially when itemIds array is large
      const itemIdsSet = new Set(itemIds);
      const newInv = prev.inventory.filter((i) => !itemIdsSet.has(i.id));
      addLog(`You batch discarded ${itemIds.length} items.`, 'normal');
      return { ...prev, inventory: newInv };
    });
  }, [addLog, setPlayer]);

  // Handle taking items from Sect Treasure Vault
  const handleTakeTreasureVaultItem = useCallback((item: Item) => {
    setPlayer((prev) => {
      if (!prev) return prev;
      const newInv = [...prev.inventory];
      // Check if same item exists in inventory (equipment items do not stack)
      const isEquipment = item.isEquippable || false;

      if (!isEquipment) {
        // Try to stack non-equipment items
        // Use optimized deep comparison function instead of JSON.stringify to improve performance
        const existingIndex = newInv.findIndex(
          i => i.name === item.name &&
            i.type === item.type &&
            i.rarity === item.rarity &&
            compareItemEffects(i.effect, item.effect, i.permanentEffect, item.permanentEffect)
        );

        if (existingIndex >= 0) {
          newInv[existingIndex].quantity += item.quantity;
        } else {
          newInv.push(item);
        }
      } else {
        // Directly add equipment items (do not stack)
        newInv.push(item);
      }

      // Update vault state: add item ID to taken list (use Set to improve performance)
      const currentVault = prev.sectTreasureVault || { items: [], takenItemIds: [] };
      const takenIdsSet = new Set(currentVault.takenItemIds || []);
      if (!takenIdsSet.has(item.id)) {
        takenIdsSet.add(item.id);
      }
      const newTakenIds = Array.from(takenIdsSet);

      addLog(`✨ You obtained [${item.name}] from Sect Treasure Vault!`, 'special');
      return {
        ...prev,
        inventory: newInv,
        sectTreasureVault: {
          ...currentVault,
          takenItemIds: newTakenIds,
        },
      };
    });
  }, [addLog, setPlayer]);

  // Handle updating Sect Treasure Vault (initialize vault items)
  const handleUpdateVault = useCallback((vault: { items: Item[]; takenItemIds: string[] }) => {
    setPlayer((prev) => ({
      ...prev,
      sectTreasureVault: vault,
    }));
  }, [setPlayer]);

  // Wrap handleEquipItem, add quest progress update
  const handleEquipItem = useCallback((item: Item, slot: EquipmentSlot) => {
    equipmentHandlers.handleEquipItem(item, slot);
    dailyQuestHandlers.updateQuestProgress('equip', 1);
  }, [equipmentHandlers, dailyQuestHandlers]);

  const handleUnequipItem = equipmentHandlers.handleUnequipItem;

  // Wrap handleRefineNatalArtifact, add quest progress update
  const handleRefineNatalArtifact = useCallback((item: Item) => {
    equipmentHandlers.handleRefineNatalArtifact(item);
    dailyQuestHandlers.updateQuestProgress('equip', 1);
  }, [equipmentHandlers, dailyQuestHandlers]);

  const handleUnrefineNatalArtifact =
    equipmentHandlers.handleUnrefineNatalArtifact;

  // Wrap handleLearnArt, add quest progress update
  const handleLearnArt = useCallback((art: CultivationArt) => {
    cultivationHandlers.handleLearnArt(art);
    dailyQuestHandlers.updateQuestProgress('learn', 1);
  }, [cultivationHandlers, dailyQuestHandlers]);

  const handleActivateArt = cultivationHandlers.handleActivateArt;

  // Wrap handleCraft, add quest progress update
  const handleCraft = useCallback(async (recipe: Recipe) => {
    await alchemyHandlers.handleCraft(recipe);
    dailyQuestHandlers.updateQuestProgress('alchemy', 1);
  }, [alchemyHandlers, dailyQuestHandlers]);

  const handleSelectTalent = characterHandlers.handleSelectTalent;
  const handleSelectTitle = characterHandlers.handleSelectTitle;
  const handleAllocateAttribute = characterHandlers.handleAllocateAttribute;
  const handleAllocateAllAttributes =
    characterHandlers.handleAllocateAllAttributes;

  // Extract new modular handlers
  const handleBuyItem = shopHandlers.handleBuyItem;
  const handleSellItem = shopHandlers.handleSellItem;

  const handleRefreshShop = useCallback((newItems: ShopItem[]) => {
    if (!currentShop || !player) return;
    const refreshCost = currentShop.refreshCost || 100; // Use shop refresh cost, default 100
    if (player.spiritStones < refreshCost) {
      addLog(`Insufficient Spirit Stones to refresh shop. Need ${refreshCost} Spirit Stones.`, 'danger');
      return;
    }
    setCurrentShop({
      ...currentShop,
      items: newItems,
    });
    setPlayer((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        spiritStones: prev.spiritStones - refreshCost, // Deduct refresh cost
      };
    });
    addLog('Shop items refreshed!', 'special');
  }, [currentShop, player, addLog, setCurrentShop, setPlayer]);

  // Handle reputation event selection
  const handleReputationEventChoice = useCallback((choiceIndex: number) => {
    if (!reputationEvent || !player) return;

    const choice = reputationEvent.choices[choiceIndex];
    if (!choice) return;

    setPlayer((prev) => {
      if (!prev) return prev;
      const newReputation = Math.max(
        0,
        (prev.reputation || 0) + choice.reputationChange
      );
      let newHp = prev.hp;
      let newExp = prev.exp;
      let newSpiritStones = prev.spiritStones;

      // Handle other changes
      if (choice.hpChange !== undefined) {
        // Use actual max HP (including Golden Core method bonuses etc.) as limit
        const totalStats = getPlayerTotalStats(prev);
        const actualMaxHp = totalStats.maxHp;
        newHp = Math.max(0, Math.min(actualMaxHp, prev.hp + choice.hpChange));
      }
      if (choice.expChange !== undefined) {
        newExp = Math.max(0, prev.exp + choice.expChange);
      }
      if (choice.spiritStonesChange !== undefined) {
        newSpiritStones = Math.max(
          0,
          prev.spiritStones + choice.spiritStonesChange
        );
      }

      // Record log
      if (choice.reputationChange > 0) {
        addLog(
          `✨ Your reputation increased by ${choice.reputationChange}! Current reputation: ${newReputation}`,
          'gain'
        );
      } else if (choice.reputationChange < 0) {
        addLog(
          `⚠️ Your reputation decreased by ${Math.abs(choice.reputationChange)}! Current reputation: ${newReputation}`,
          'danger'
        );
      }

      if (choice.description) {
        addLog(
          choice.description,
          choice.reputationChange > 0
            ? 'gain'
            : choice.reputationChange < 0
              ? 'danger'
              : 'normal'
        );
      }

      return {
        ...prev,
        reputation: newReputation,
        hp: newHp,
        exp: newExp,
        spiritStones: newSpiritStones,
      };
    });

    // Close modal and clear event
    setIsReputationEventOpen(false);
    setReputationEvent(null);

    // If auto adventure was paused due to reputation event, resume auto adventure
  }, [
    reputationEvent,
    player,
    addLog,
    setPlayer,
    setIsReputationEventOpen,
    setReputationEvent,
    setAutoAdventure,
  ]);

  const handleUpdateSettings = settingsHandlers.handleUpdateSettings;
  const handleActivatePet = petHandlers.handleActivatePet;
  const handleDeactivatePet = petHandlers.handleDeactivatePet;
  // Wrap handleFeedPet, add quest progress update
  const handleFeedPet = useCallback((
    petId: string,
    feedType: 'hp' | 'item' | 'exp',
    itemId?: string
  ) => {
    petHandlers.handleFeedPet(petId, feedType, itemId);
    dailyQuestHandlers.updateQuestProgress('pet', 1);
  }, [petHandlers, dailyQuestHandlers]);

  const handleBatchFeedItems = petHandlers.handleBatchFeedItems;
  const handleBatchFeedHp = petHandlers.handleBatchFeedHp;
  // Wrap handleEvolvePet, add quest progress update
  const handleEvolvePet = useCallback((petId: string) => {
    petHandlers.handleEvolvePet(petId);
    dailyQuestHandlers.updateQuestProgress('pet', 1);
  }, [petHandlers, dailyQuestHandlers]);

  const handleReleasePet = petHandlers.handleReleasePet;
  const handleBatchReleasePets = petHandlers.handleBatchReleasePets;
  const handleDraw = lotteryHandlers.handleDraw;
  const handleJoinSect = sectHandlers.handleJoinSect;
  const handleLeaveSect = sectHandlers.handleLeaveSect;
  const handleSafeLeaveSect = sectHandlers.handleSafeLeaveSect;
  // Wrap handleSectTask, add quest progress update
  const handleSectTask = useCallback((task: RandomSectTask, encounterResult?: AdventureResult) => {
    sectHandlers.handleSectTask(task, encounterResult);
    dailyQuestHandlers.updateQuestProgress('sect', 1);
  }, [sectHandlers, dailyQuestHandlers]);
  const handleSectPromote = sectHandlers.handleSectPromote;
  const handleSectBuy = sectHandlers.handleSectBuy;
  const checkAchievements = achievementHandlers.checkAchievements;

  // Extract functions from adventure handlers
  const { handleAdventure: originalHandleAdventure, executeAdventure } =
    adventureHandlers;

  // Wrap handleAdventure, add auto meditate check
  const handleAdventure = async () => {
    // If auto meditating, cannot manually adventure
    if (autoMeditate) {
      addLog('Meditating, cannot adventure. Please stop auto meditate first.', 'danger');
      return;
    }
    await originalHandleAdventure();
    // Update daily quest progress
    dailyQuestHandlers.updateQuestProgress('adventure', 1);
  };

  // Wrap handleMeditate, add auto meditate check
  const handleMeditate = () => {
    if (loading || cooldown > 0 || !player) return;
    // If auto adventuring, cannot manually meditate
    if (autoAdventure) {
      addLog('Adventuring, cannot meditate. Please stop auto adventure first.', 'danger');
      return;
    }
    meditationHandlers.handleMeditate();
    dailyQuestHandlers.updateQuestProgress('meditate', 1);
    setCooldown(1);
  };

  // Use passive regeneration and cooldown management hook
  usePassiveRegeneration({
    player,
    setPlayer,
    cooldown,
    setCooldown,
  });

  // Use auto grotto harvest hook
  useAutoGrottoHarvest({
    player,
    setPlayer,
    addLog,
  });

  // Use auto features hook
  useAutoFeatures({
    autoMeditate,
    autoAdventure,
    player,
    loading,
    cooldown,
    isShopOpen,
    isReputationEventOpen,
    isTurnBasedBattleOpen,
    handleMeditate,
    handleAdventure,
    setCooldown,
    autoAdventureConfig, // Pass auto adventure config
    setAutoAdventure, // Pass function to set auto adventure state
    addLog, // Pass log function
  });

  // Now executeAdventure can be used to initialize realmHandlers
  const realmHandlers = useRealmHandlers({
    player,
    setPlayer,
    addLog,
    setItemActionLog,
    setLoading,
    setCooldown,
    loading,
    cooldown,
    setIsRealmOpen,
    executeAdventure,
  });
  // Wrap handleEnterRealm, add quest progress update
  const handleEnterRealm = async (realm: SecretRealm) => {
    await realmHandlers.handleEnterRealm(realm);
    dailyQuestHandlers.updateQuestProgress('realm', 1);
  };
  // Adventure behavior implemented by handleAdventure provided by useAdventureHandlers

  // Reactive Level Up Check
  useEffect(() => {
    if (player && player.exp >= player.maxExp) {
      // Check if absolute peak is reached
      const realms = REALM_ORDER;
      const isMaxRealm = player.realm === realms[realms.length - 1];
      if (isMaxRealm && player.realmLevel >= 9) {
        // Lock exp to max value
        if (player.exp > player.maxExp) {
          setPlayer((prev) => (prev ? { ...prev, exp: prev.maxExp } : null));
        }
        return;
      }

      // Check if tribulation already triggered (prevent duplicate trigger)
      // If exp just equals maxExp (maybe locked after cancellation), and flag is true, do not trigger
      // Only allow trigger when exp truly exceeds maxExp (flag resets on realm change)
      if (isTribulationTriggeredRef.current && player.exp === player.maxExp) {
        return;
      }

      // If exp exceeds maxExp, it means new exp added, reset flag to allow trigger
      if (player.exp > player.maxExp) {
        isTribulationTriggeredRef.current = false;
      }

      // Check if tribulation is needed
      const isRealmUpgrade = player.realmLevel >= 9;
      let targetRealm = player.realm;
      if (isRealmUpgrade) {
        const currentIndex = REALM_ORDER.indexOf(player.realm);
        if (currentIndex < REALM_ORDER.length - 1) {
          targetRealm = REALM_ORDER[currentIndex + 1];
        }
      }

      // If realm upgrade, first check if breakthrough conditions met
      // Note: shouldTriggerTribulation also checks conditions internally, but pre-check here to:
      // 1. Give user explicit error message
      // 2. Lock exp to avoid repeated triggering
      if (isRealmUpgrade && targetRealm !== player.realm) {
        const conditionCheck = checkBreakthroughConditions(player, targetRealm);
        if (!conditionCheck.canBreakthrough) {
          addLog(conditionCheck.message, 'danger');
          // Lock exp to avoid repeated triggering
          setPlayer((prev) => (prev ? { ...prev, exp: prev.maxExp } : null));
          return;
        }
      }

      // Check if tribulation needed (only check after conditions met, shouldTriggerTribulation verifies again)
      if (shouldTriggerTribulation(player) && !tribulationState?.isOpen) {
        // Set flag to prevent duplicate trigger
        isTribulationTriggeredRef.current = true;

        // Get tribulation name
        const config = TRIBULATION_CONFIG[targetRealm];
        const tribulationName = config?.tribulationLevel || `${targetRealm} Tribulation`;

        // Show confirmation modal
        showConfirm(
          `Your ${tribulationName} has arrived, undergo tribulation now?`,
          'Confirm',
          () => {
            // After user confirms, create tribulation state and trigger modal
            const newTribulationState = createTribulationState(player, targetRealm);
            setTribulationState(newTribulationState);
          },
          () => {
            // User cancelled, keep flag true (prevent immediate re-trigger), clear tribulation state and lock exp
            // Flag will reset when exp truly changes or realm changes
            setTribulationState(null); // Clear tribulation state
            setPlayer((prev) => (prev ? { ...prev, exp: prev.maxExp } : null));
          }
        );
      } else if (!tribulationState?.isOpen) {
        // No tribulation needed, execute breakthrough directly
        breakthroughHandlers.handleBreakthrough();
      }
    }
  }, [
    player?.exp,
    player?.maxExp,
    player?.realm,
    player?.realmLevel,
    tribulationState?.isOpen,
  ]);

  // Monitor breakthrough success, update quest progress
  const prevRealmRef = useRef<{ realm: string; level: number } | null>(null);
  useEffect(() => {
    if (player && prevRealmRef.current) {
      const prevRealm = prevRealmRef.current.realm;
      const prevLevel = prevRealmRef.current.level;
      if (player.realm !== prevRealm || player.realmLevel !== prevLevel) {
        // Realm or level change indicates breakthrough success
        dailyQuestHandlers.updateQuestProgress('breakthrough', 1);
        // Reset tribulation trigger flag
        isTribulationTriggeredRef.current = false;
      }
    }
    if (player) {
      prevRealmRef.current = { realm: player.realm, level: player.realmLevel };
    }
  }, [player?.realm, player?.realmLevel, dailyQuestHandlers]);

  // Keep handleOpenUpgrade and handleUpgradeItem as they need state management
  const handleOpenUpgrade = (item: Item) => {
    setItemToUpgrade(item);
    setIsUpgradeOpen(true);
  };

  // handleUpgradeItem does not close modal, allowing user to continue upgrading
  const handleUpgradeItem = async (
    item: Item,
    costStones: number,
    costMats: number,
    upgradeStones: number = 0
  ): Promise<'success' | 'failure' | 'error'> => {
    const result = await equipmentHandlers.handleUpgradeItem(
      item,
      costStones,
      costMats,
      upgradeStones
    );
    // Do not close modal, allow user to continue upgrading
    // Modal will automatically get latest item info from player.inventory
    return result || 'success';
  };

  // Sect, Achievement, Pet, Lottery, Settings handlers have all been moved to corresponding modules

  // Check achievements (on realm change, stats change)
  useEffect(() => {
    if (player) {
      checkAchievements();
    }
  }, [
    player?.realm,
    player?.realmLevel,
    player?.statistics,
    player?.inventory.length,
    player?.pets.length,
    player?.cultivationArts.length,
    player?.unlockedRecipes?.length,
    player?.lotteryCount,
    checkAchievements,
  ]);

  // Define keyboard shortcuts (use saved config)
  const keyboardShortcuts: KeyboardShortcut[] = useMemo(() => {
    if (!player || !gameStarted) return [];

    const customShortcuts = settings.keyboardShortcuts || {};

    const shortcuts: KeyboardShortcut[] = [];

    // Meditate
    const meditateConfig = getShortcutConfig('meditate', customShortcuts);
    shortcuts.push(
      configToShortcut(meditateConfig, handleMeditate, 'Meditate', 'Basic')
    );

    // Adventure
    const adventureConfig = getShortcutConfig('adventure', customShortcuts);
    shortcuts.push(
      configToShortcut(adventureConfig, handleAdventure, 'Adventure', 'Basic')
    );

    // Toggle Auto Meditate
    const toggleAutoMeditateConfig = getShortcutConfig(
      'toggleAutoMeditate',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        toggleAutoMeditateConfig,
        () => {
          setAutoMeditate(!autoMeditate);
        },
        'Toggle Auto Meditate',
        'Basic'
      )
    );

    // Toggle Auto Adventure
    const toggleAutoAdventureConfig = getShortcutConfig(
      'toggleAutoAdventure',
      customShortcuts
    );
    const toggleAutoAdventureAction = () => {
      if (autoAdventure) {
        // If auto adventuring, close directly
        setAutoAdventure(false);
      } else {
        // If not enabled, open config modal
        setIsAutoAdventureConfigOpen(true);
      }
    };
    shortcuts.push(
      configToShortcut(
        toggleAutoAdventureConfig,
        toggleAutoAdventureAction,
        'Toggle Auto Adventure',
        'Basic'
      )
    );

    // Space key toggles auto adventure (higher priority than configured shortcut)
    shortcuts.push({
      key: ' ',
      action: toggleAutoAdventureAction,
      description: 'Toggle Auto Adventure',
      category: 'Basic',
    });

    // Open Inventory
    const openInventoryConfig = getShortcutConfig(
      'openInventory',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openInventoryConfig,
        () => setIsInventoryOpen(true),
        'Open Inventory',
        'Panels'
      )
    );

    // Open Cultivation
    const openCultivationConfig = getShortcutConfig(
      'openCultivation',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openCultivationConfig,
        () => setIsCultivationOpen(true),
        'Open Cultivation',
        'Panels'
      )
    );

    // Open Character
    const openCharacterConfig = getShortcutConfig(
      'openCharacter',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openCharacterConfig,
        () => setIsCharacterOpen(true),
        'Open Character',
        'Panels'
      )
    );

    // Open Achievement
    const openAchievementConfig = getShortcutConfig(
      'openAchievement',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openAchievementConfig,
        () => {
          setIsAchievementOpen(true);
          setPlayer((prev) => ({
            ...prev,
            viewedAchievements: [...prev.achievements],
          }));
        },
        'Open Achievement',
        'Panels'
      )
    );

    // Open Pet
    const openPetConfig = getShortcutConfig('openPet', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openPetConfig,
        () => setIsPetOpen(true),
        'Open Pet',
        'Panels'
      )
    );

    // Open Lottery
    const openLotteryConfig = getShortcutConfig('openLottery', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openLotteryConfig,
        () => setIsLotteryOpen(true),
        'Open Lottery',
        'Panels'
      )
    );

    // Open Settings
    const openSettingsConfig = getShortcutConfig(
      'openSettings',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openSettingsConfig,
        () => setIsSettingsOpen(true),
        'Open Settings',
        'Panels'
      )
    );

    // Open Realm
    const openRealmConfig = getShortcutConfig('openRealm', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openRealmConfig,
        () => setIsRealmOpen(true),
        'Open Realm',
        'Panels'
      )
    );

    // Open Alchemy
    const openAlchemyConfig = getShortcutConfig('openAlchemy', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openAlchemyConfig,
        () => setIsAlchemyOpen(true),
        'Open Alchemy',
        'Panels'
      )
    );

    // Open Sect
    const openSectConfig = getShortcutConfig('openSect', customShortcuts);
    shortcuts.push(
      configToShortcut(
        openSectConfig,
        () => setIsSectOpen(true),
        'Open Sect',
        'Panels'
      )
    );

    // Open Daily Quest
    const openDailyQuestConfig = getShortcutConfig(
      'openDailyQuest',
      customShortcuts
    );
    shortcuts.push(
      configToShortcut(
        openDailyQuestConfig,
        () => setIsDailyQuestOpen(true),
        'Open Daily Quest',
        'Panels'
      )
    );

    // Close Current Modal
    const closeModalConfig = getShortcutConfig('closeModal', customShortcuts);
    shortcuts.push(
      configToShortcut(
        closeModalConfig,
        handleCloseCurrentModal,
        'Close Modal',
        'General'
      )
    );

    return shortcuts;
  }, [
    handleMeditate,
    handleAdventure,
    autoMeditate,
    autoAdventure,
    setIsInventoryOpen,
    setIsCultivationOpen,
    setIsCharacterOpen,
    setIsAchievementOpen,
    setIsPetOpen,
    setIsLotteryOpen,
    setIsSettingsOpen,
    setIsRealmOpen,
    setIsAlchemyOpen,
    setIsSectOpen,
    setIsDailyQuestOpen,
    handleCloseCurrentModal,
  ]);

  // Use keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: keyboardShortcuts,
    enabled: gameStarted && !!player && !isDead,
  });

  // Cache GameView handlers
  const gameViewHandlers = useMemo(() => ({
    onMeditate: handleMeditate,
    onAdventure: handleAdventure,
    onOpenRealm: () => setIsRealmOpen(true),
    onOpenAlchemy: () => setIsAlchemyOpen(true),
    onOpenSect: () => setIsSectOpen(true),
    onOpenMenu: () => setIsMobileSidebarOpen(true),
    onOpenCultivation: () => setIsCultivationOpen(true),
    onOpenInventory: () => setIsInventoryOpen(true),
    onOpenCharacter: () => setIsCharacterOpen(true),
    onOpenAchievement: () => {
      setIsAchievementOpen(true);
      setPlayer((prev) => (prev ? {
        ...prev,
        viewedAchievements: [...prev.achievements],
      } : null));
    },
    onOpenPet: () => setIsPetOpen(true),
    onOpenLottery: () => setIsLotteryOpen(true),
    onOpenDailyQuest: () => setIsDailyQuestOpen(true),
    onOpenGrotto: () => setIsGrottoOpen(true),
    onOpenSettings: () => setIsSettingsOpen(true),
    onOpenDebug: () => setIsDebugOpen(true),
    onOpenStats: () => setIsMobileStatsOpen(true),
    onUpdateViewedAchievements: () => {
      setPlayer((prev) => (prev ? {
        ...prev,
        viewedAchievements: [...prev.achievements],
      } : null));
    },
    autoMeditate,
    autoAdventure,
    onToggleAutoMeditate: () => {
      setAutoMeditate(!autoMeditate);
    },
    onToggleAutoAdventure: () => {
      if (autoAdventure) {
        // If auto adventuring, close directly
        setAutoAdventure(false);
      } else {
        // If not enabled, open config modal
        setIsAutoAdventureConfigOpen(true);
      }
    },
  }), [
    handleMeditate,
    handleAdventure,
    setIsRealmOpen,
    setIsAlchemyOpen,
    setIsSectOpen,
    setIsMobileSidebarOpen,
    setIsCultivationOpen,
    setIsInventoryOpen,
    setIsCharacterOpen,
    setIsAchievementOpen,
    setIsPetOpen,
    setIsLotteryOpen,
    setIsDailyQuestOpen,
    setIsGrottoOpen,
    setIsSettingsOpen,
    setIsDebugOpen,
    setIsMobileStatsOpen,
    autoMeditate,
    autoAdventure,
  ]);

  // Cache ModalsContainer handlers
  const modalsHandlers = useMemo(() => ({
    setIsInventoryOpen,
    setIsCultivationOpen,
    setIsAlchemyOpen,
    setIsUpgradeOpen: (open: boolean) => {
      setIsUpgradeOpen(open);
      if (!open) setItemToUpgrade(null);
    },
    setIsSectOpen,
    setIsRealmOpen,
    setIsCharacterOpen,
    setIsAchievementOpen,
    setIsPetOpen,
    setIsLotteryOpen,
    setIsSettingsOpen,
    setIsDailyQuestOpen,
    setIsGrottoOpen,
    setIsShopOpen: (open: boolean) => {
      setIsShopOpen(open);
      if (!open) {
        setCurrentShop(null);
      }
    },
    setIsBattleModalOpen,
    setItemToUpgrade,
    setCurrentShop,
    setBattleReplay,
    setRevealedBattleRounds,
    handleSkipBattleLogs,
    handleCloseBattleModal,
    handleUseItem,
    handleEquipItem,
    handleUnequipItem,
    handleOpenUpgrade,
    handleDiscardItem,
    handleBatchDiscard,
    handleBatchUse,
    handleOrganizeInventory,
    handleRefineNatalArtifact,
    handleUnrefineNatalArtifact,
    handleRefineAdvancedItem,
    handleUpgradeItem,
    handleLearnArt,
    handleActivateArt,
    handleCraft,
    handleJoinSect,
    handleLeaveSect,
    handleSafeLeaveSect,
    handleSectTask,
    handleSectPromote,
    handleSectBuy,
    handleChallengeLeader: sectHandlers.handleChallengeLeader,
    handleEnterRealm,
    handleSelectTalent,
    handleSelectTitle,
    handleAllocateAttribute,
    handleAllocateAllAttributes,
    handleUseInheritance,
    setPlayer,
    addLog,
    handleUpdateViewedAchievements: () => {
      setPlayer((prev) => (prev ? {
        ...prev,
        viewedAchievements: [...prev.achievements],
      } : null));
    },
    handleActivatePet,
    handleDeactivatePet,
    handleFeedPet,
    handleBatchFeedItems,
    handleBatchFeedHp,
    handleEvolvePet,
    handleReleasePet,
    handleBatchReleasePets,
    handleDraw,
    handleUpdateSettings,
    handleRestartGame: handleRebirth,
    onOpenSaveManager: () => setIsSaveManagerOpen(true),
    handleClaimQuestReward: dailyQuestHandlers.claimQuestReward,
    handleUpgradeGrotto: grottoHandlers.handleUpgradeGrotto,
    handlePlantHerb: grottoHandlers.handlePlantHerb,
    handleHarvestHerb: grottoHandlers.handleHarvestHerb,
    handleHarvestAll: grottoHandlers.handleHarvestAll,
    handleEnhanceSpiritArray: grottoHandlers.handleEnhanceSpiritArray,
    handleToggleAutoHarvest: grottoHandlers.handleToggleAutoHarvest,
    handleSpeedupHerb: grottoHandlers.handleSpeedupHerb,
    handleBuyItem,
    handleSellItem,
    handleRefreshShop,
    handleReputationEventChoice,
    setIsReputationEventOpen: (open: boolean) => {
      setIsReputationEventOpen(open);
      if (!open) {
        setReputationEvent(null);
      }
    },
    setIsTreasureVaultOpen: (open: boolean) => setIsTreasureVaultOpen(open),
    handleTakeTreasureVaultItem,
    handleUpdateVault,
    setIsTurnBasedBattleOpen: (open: boolean) => {
      setIsTurnBasedBattleOpen(open);
      if (!open) {
        setTurnBasedBattleParams(null);
      }
    },
    handleTurnBasedBattleClose: (result: BattleResult | null, updatedInventory?: Item[]) => {
      // Check if it is a Heaven Earth Soul battle
      const isHeavenEarthSoulBattle = turnBasedBattleParams?.bossId !== undefined;

      setIsTurnBasedBattleOpen(false);
      setTurnBasedBattleParams(null);
      handleBattleResult(result, updatedInventory);
      if (!autoAdventure) {
        return;
      }
    },
  }), [
    setIsInventoryOpen, setIsCultivationOpen, setIsAlchemyOpen, setIsUpgradeOpen,
    setIsSectOpen, setIsRealmOpen, setIsCharacterOpen, setIsAchievementOpen,
    setIsPetOpen, setIsLotteryOpen, setIsSettingsOpen, setIsDailyQuestOpen,
    setIsGrottoOpen, setIsShopOpen, setIsBattleModalOpen, setItemToUpgrade,
    setCurrentShop, setBattleReplay, setRevealedBattleRounds, handleSkipBattleLogs,
    handleCloseBattleModal, handleUseItem, handleEquipItem, handleUnequipItem,
    handleOpenUpgrade, handleDiscardItem, handleBatchDiscard, handleBatchUse,
    handleOrganizeInventory, handleRefineNatalArtifact, handleUnrefineNatalArtifact,
    handleRefineAdvancedItem, handleUpgradeItem, handleLearnArt, handleActivateArt,
    handleCraft, handleJoinSect, handleLeaveSect, handleSafeLeaveSect, handleSectTask,
    handleSectPromote, handleSectBuy, sectHandlers.handleChallengeLeader,
    handleEnterRealm, handleSelectTalent, handleSelectTitle, handleAllocateAttribute,
    handleAllocateAllAttributes, handleUseInheritance, setPlayer, addLog,
    handleActivatePet, handleDeactivatePet, handleFeedPet, handleBatchFeedItems,
    handleBatchFeedHp, handleEvolvePet, handleReleasePet, handleBatchReleasePets,
    handleDraw, handleUpdateSettings, handleRebirth, setIsSaveManagerOpen,
    dailyQuestHandlers.claimQuestReward, grottoHandlers.handleUpgradeGrotto,
    grottoHandlers.handlePlantHerb, grottoHandlers.handleHarvestHerb,
    grottoHandlers.handleHarvestAll, grottoHandlers.handleEnhanceSpiritArray,
    grottoHandlers.handleToggleAutoHarvest, grottoHandlers.handleSpeedupHerb,
    handleBuyItem, handleSellItem, handleRefreshShop, handleReputationEventChoice,
    setIsReputationEventOpen, setReputationEvent,
    setAutoAdventure, setIsTreasureVaultOpen, handleTakeTreasureVaultItem,
    handleUpdateVault, setIsTurnBasedBattleOpen, setTurnBasedBattleParams,
    handleBattleResult, autoAdventure, setCurrentShop,
    turnBasedBattleParams
  ]);

  // Check if any modal is open
  const isAnyModalOpen = useMemo(() => {
    return (
      isInventoryOpen ||
      isCultivationOpen ||
      isAlchemyOpen ||
      isUpgradeOpen ||
      isSectOpen ||
      isRealmOpen ||
      isCharacterOpen ||
      isAchievementOpen ||
      isPetOpen ||
      isLotteryOpen ||
      isSettingsOpen ||
      isDailyQuestOpen ||
      isShopOpen ||
      isGrottoOpen ||
      isBattleModalOpen ||
      isTurnBasedBattleOpen ||
      isReputationEventOpen ||
      isTreasureVaultOpen
    );
  }, [
    isInventoryOpen, isCultivationOpen, isAlchemyOpen, isUpgradeOpen,
    isSectOpen, isRealmOpen, isCharacterOpen, isAchievementOpen,
    isPetOpen, isLotteryOpen, isSettingsOpen, isDailyQuestOpen,
    isShopOpen, isGrottoOpen, isBattleModalOpen, isTurnBasedBattleOpen,
    isReputationEventOpen, isTreasureVaultOpen
  ]);

  // Show Welcome Screen
  if (showWelcome) {
    return (
      <div className="font-mono text-stone-200 min-h-screen bg-stone-950 relative overflow-hidden">
        <CRTOverlay />
        <WelcomeScreen
          hasSave={hasSave}
          onStart={() => {
            // New Game: Clear save and reset state
            localStorage.removeItem(STORAGE_KEYS.SAVE);
            setHasSave(false);
            setGameStarted(false);
            setPlayer(null);
            setLogs([]);
            setShowWelcome(false);
          }}
          onContinue={() => {
            setShowWelcome(false);
          }}
        />
      </div>
    );
  }

  // Show start screen (naming) - only if no save and game not started
  if (!hasSave && (!gameStarted || !player)) {
    return (
      <div className="font-terminal text-amber-400 min-h-screen bg-stone-950">
        <CRTOverlay />
        <StartScreen onStart={handleStartGame} />
      </div>
    );
  }

  // If there is a save but player is still loading
  if (hasSave && !player) {
    return (
      <div className="font-terminal text-amber-400 fixed inset-0 bg-stone-950 flex items-center justify-center z-50">
        <CRTOverlay />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-amber-400 text-lg">Loading Genetic Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-terminal text-stone-200 min-h-screen bg-stone-950 selection:bg-amber-500/30 selection:text-amber-100">
      <CRTOverlay />
      {/* Tribulation Modal */}
      {tribulationState && (
        <TribulationModal
          tribulationState={tribulationState}
          onTribulationComplete={handleTribulationComplete}
          player={player}
        />
      )}

      {/* Death Modal - Cannot Close */}
      {isDead && player && (
        <DeathModal
          player={player}
          battleData={deathBattleData}
          deathReason={deathReason}
          difficulty={settings.difficulty || 'normal'}
          onRebirth={handleRebirth}
          onContinue={
            settings.difficulty !== 'hard'
              ? () => {
                setIsDead(false);
                setDeathBattleData(null);
                setDeathReason('');
              }
              : undefined
          }
        />
      )}

      <GameView
        player={player}
        logs={logs}
        setLogs={setLogs}
        visualEffects={visualEffects}
        loading={loading}
        cooldown={cooldown}
        purchaseSuccess={purchaseSuccess}
        lotteryRewards={lotteryRewards}
        onCloseLotteryRewards={() => setLotteryRewards([])}
        itemActionLog={itemActionLogValue}
        isMobileSidebarOpen={isMobileSidebarOpen}
        isMobileStatsOpen={isMobileStatsOpen}
        modals={{
          isInventoryOpen,
          isCultivationOpen,
          isCharacterOpen,
          isAchievementOpen,
          isPetOpen,
          isLotteryOpen,
          isSettingsOpen,
          isRealmOpen,
          isAlchemyOpen,
          isSectOpen,
          setIsMobileSidebarOpen,
          setIsMobileStatsOpen,
          setIsInventoryOpen,
          setIsCultivationOpen,
          setIsCharacterOpen,
          setIsAchievementOpen,
          setIsPetOpen,
          setIsLotteryOpen,
          setIsSettingsOpen,
          setIsRealmOpen,
          setIsAlchemyOpen,
          setIsSectOpen,
        }}
        handlers={gameViewHandlers}
        isDebugModeEnabled={isDebugModeEnabled}
      />

      {/* Debug Modal */}
      {player && isDebugModeEnabled && (
        <DebugModal
          isOpen={isDebugOpen}
          onClose={() => setIsDebugOpen(false)}
          player={player}
          onUpdatePlayer={(updates) => {
            setPlayer((prev) => {
              if (!prev) return prev;
              return { ...prev, ...updates };
            });
          }}
          onTriggerDeath={() => {
            // Trigger death: set hp to 0, death detection useEffect will handle it
            setPlayer((prev) => {
              if (!prev) return prev;
              return { ...prev, hp: 0 };
            });
          }}
          onTriggerReputationEvent={(event) => {
            // Set reputation event and open modal
            setReputationEvent(event);
            setIsReputationEventOpen(true);
          }}
            onChallengeDaoCombining={() => {
              // Challenge Heaven Earth Soul: use executeAdventure to execute special challenge
              if (adventureHandlers) {
              adventureHandlers.executeAdventure('dao_combining_challenge', undefined, 'Extreme');
              }
            }}
          />
        )}

      {/* Alert Modal */}
      {alertState && (
        <AlertModal
          isOpen={alertState.isOpen}
          onClose={closeAlert}
          type={alertState.type}
          title={alertState.title}
          message={alertState.message}
          onConfirm={alertState.onConfirm}
          showCancel={alertState.showCancel}
          onCancel={alertState.onCancel}
        />
      )}

      {/* Save Manager */}
      {player && (
        <SaveManagerModal
          isOpen={isSaveManagerOpen}
          onClose={() => setIsSaveManagerOpen(false)}
          currentPlayer={player}
          currentLogs={logs}
          onLoadSave={(loadedPlayer, loadedLogs) => {
            // Apply compatibility handling, ensure old save contains new fields
            const compatiblePlayer = ensurePlayerStatsCompatibility(loadedPlayer);
            setPlayer(compatiblePlayer);
            setLogs(loadedLogs);
          }}
          onCompareSaves={(save1, save2) => {
            setCompareSave1(save1);
            setCompareSave2(save2);
            setIsSaveCompareOpen(true);
          }}
        />
      )}

      {/* Save Comparison */}
      {compareSave1 && compareSave2 && (
        <SaveCompareModal
          isOpen={isSaveCompareOpen}
          onClose={() => {
            setIsSaveCompareOpen(false);
            setCompareSave1(null);
            setCompareSave2(null);
          }}
          save1={compareSave1}
          save2={compareSave2}
        />
      )}

      {player && isAnyModalOpen && (
        <ModalsContainer
          player={player}
          settings={settings}
          setItemActionLog={setItemActionLog}
          autoAdventure={autoAdventure}
          handlers={modalsHandlers}
        />
      )}

      {/* Lifespan Warning Overlay */}
      {player && !isDead && player.lifespan < Math.max(5, (player.maxLifespan || 100) * 0.1) && (
        <>
          <div className="lifespan-warning" />
          <div className="lifespan-warning-text animate-pulse">
            ⚠️ Lifespan Warning ({player.lifespan.toFixed(1)} years left)
          </div>
        </>
      )}

      {/* Game Mechanics Tutorial */}
      {showCultivationIntro && (
        <CultivationIntroModal
          isOpen={showCultivationIntro}
          onClose={() => {
            setShowCultivationIntro(false);
            localStorage.setItem(STORAGE_KEYS.CULTIVATION_INTRO_SHOWN, 'true');
          }}
        />
      )}

      {/* Auto Adventure Config */}
      <AutoAdventureConfigModal
        isOpen={isAutoAdventureConfigOpen}
        onClose={() => setIsAutoAdventureConfigOpen(false)}
        onConfirm={(config) => {
          setAutoAdventureConfig(config);
          setAutoAdventure(true);
        }}
        currentConfig={autoAdventureConfig}
      />
    </div>
  );

}

export default App;
