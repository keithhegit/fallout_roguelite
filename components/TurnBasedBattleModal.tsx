import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield,
  Sword,
  X,
  Zap,
  Option,
  ArrowRight,
  FastForward,
} from 'lucide-react';
import {
  BattleState,
  PlayerAction,
  Item,
  PlayerStats,
  RealmType,
  RiskLevel,
} from '../types';
import BattleLog from './BattleLog';
import CombatVisuals, { VisualEffect } from './CombatVisuals';
import {
  executePlayerAction,
  executeEnemyTurn,
  checkBattleEnd,
  initializeTurnBasedBattle,
  calculateBattleRewards,
} from '../services/battleService';
import { BATTLE_POTIONS, FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS, LONGEVITY_RULES } from '../constants/index';
import { showConfirm } from '../utils/toastUtils';

interface TurnBasedBattleModalProps {
  isOpen: boolean;
  player: PlayerStats;
  adventureType: 'normal' | 'lucky' | 'secret_realm' | 'sect_challenge' | 'dao_combining_challenge';
  riskLevel?: RiskLevel;
  realmMinRealm?: RealmType;
  bossId?: string; // Specified Heaven Earth Essence BOSS ID (for event template)
  autoAdventure?: boolean; // Whether in auto-adventure mode
  onClose: (
    result?: {
      victory: boolean;
      hpLoss: number;
      expChange: number;
      spiritChange: number;
      adventureType?: 'normal' | 'lucky' | 'secret_realm' | 'sect_challenge' | 'dao_combining_challenge';
      items?: Array<{
        name: string;
        type: string;
        description: string;
        rarity?: string;
        isEquippable?: boolean;
        equipmentSlot?: string;
        effect?: any;
        permanentEffect?: any;
      }>;
      petSkillCooldowns?: Record<string, number>; // Pet skill cooldown status
    },
    updatedInventory?: Item[]
  ) => void;
}

const TurnBasedBattleModal: React.FC<TurnBasedBattleModalProps> = ({
  isOpen,
  player,
  adventureType,
  riskLevel,
  realmMinRealm,
  bossId,
  autoAdventure = false,
  onClose,
}) => {
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [showSkills, setShowSkills] = useState(false);
  const [showPotions, setShowPotions] = useState(false);
  const [showAdvancedItems, setShowAdvancedItems] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([]);
  const lastProcessedActionIdRef = useRef<string | null>(null);

  // Watch for new history items to trigger visual effects
  useEffect(() => {
    if (!battleState?.history?.length) return;
    const lastAction = battleState.history[battleState.history.length - 1];
    
    if (lastAction.id === lastProcessedActionIdRef.current) return;
    lastProcessedActionIdRef.current = lastAction.id;

    const newEffects: VisualEffect[] = [];
    
    if (lastAction.result.damage && lastAction.result.damage > 0) {
      // Determine target for positioning
      // If turn is 'player', player attacked, so enemy takes damage (isPlayer=false)
      // If turn is 'enemy', enemy attacked, so player takes damage (isPlayer=true)
      const isPlayerTakingDamage = lastAction.turn === 'enemy';

      newEffects.push({
        id: `dmg-${lastAction.id}`,
        type: lastAction.result.crit ? 'crit' : 'damage',
        value: lastAction.result.crit ? 'CRIT!' : `-${lastAction.result.damage}`,
        // Color: Red if player takes damage, Amber if enemy takes damage
        color: isPlayerTakingDamage ? 'text-red-500' : 'text-amber-400',
        isPlayer: isPlayerTakingDamage
      });
      
      if (lastAction.result.crit) {
          // Add specific crit damage number if crit text is separate
          newEffects.push({
            id: `crit-dmg-${lastAction.id}`,
            type: 'damage',
            value: `-${lastAction.result.damage}`,
            color: isPlayerTakingDamage ? 'text-red-600' : 'text-yellow-400',
            isPlayer: isPlayerTakingDamage
          });
      }
    }
    
    if (lastAction.result.miss) {
        const isPlayerTakingDamage = lastAction.turn === 'enemy';
        newEffects.push({
            id: `miss-${lastAction.id}`,
            type: 'miss',
            value: 'MISS',
            isPlayer: isPlayerTakingDamage
        });
    }

    if (newEffects.length > 0) {
      setVisualEffects(prev => [...prev, ...newEffects]);
      setTimeout(() => {
        setVisualEffects(prev => prev.filter(e => !newEffects.find(ne => ne.id === e.id)));
      }, 2000);
    }
  }, [battleState?.history]);

  // Use ref to create a more reliable lock to prevent duplicate clicks during state updates (synchronous check)
  const isActionLockedRef = useRef(false);
  // Use state to trigger re-render, ensuring button disabled state updates correctly

  // Initialize battle - Use ref to prevent duplicate initialization
  const isInitializedRef = useRef(false);
  // Track if initialization has timed out
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitTimedOutRef = useRef(false);

  useEffect(() => {
    if (isOpen && !battleState && !isInitializedRef.current) {
      isInitializedRef.current = true;
      isActionLockedRef.current = false;
      setIsProcessing(true); // Set to processing during initialization

      // Reset timeout flag
      hasInitTimedOutRef.current = false;

      // Add initialization timeout protection (10s)
      initTimeoutRef.current = setTimeout(() => {
        if (isInitializedRef.current) {
          hasInitTimedOutRef.current = true;
          console.error('Combat initialization timeout (10s)');
          setErrorMessage('Combat initialization timeout, please retry');
          setIsProcessing(false);
          isActionLockedRef.current = false;
          isInitializedRef.current = false; // Allow retry
          initTimeoutRef.current = null;
          setTimeout(() => setErrorMessage(null), 3000);
        }
      }, 10000);

      initializeTurnBasedBattle(
        player,
        adventureType,
        riskLevel as any,
        realmMinRealm as any,
        undefined,
        bossId
      )
        .then((state) => {
          if (hasInitTimedOutRef.current || !isInitializedRef.current) {
            // If timed out, ignore result
            if (initTimeoutRef.current) {
              clearTimeout(initTimeoutRef.current);
              initTimeoutRef.current = null;
            }
            return;
          }
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
          }
          setBattleState(state);
          setIsProcessing(false); // Reset after initialization complete
          isActionLockedRef.current = false;
        })
        .catch((error) => {
          if (hasInitTimedOutRef.current || !isInitializedRef.current) {
            // If timed out, ignore error
            if (initTimeoutRef.current) {
              clearTimeout(initTimeoutRef.current);
              initTimeoutRef.current = null;
            }
            return;
          }
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
          }
          console.error('Combat initialization failed:', error);
          setErrorMessage('Combat initialization failed');
          setIsProcessing(false);
          isActionLockedRef.current = false;
          isInitializedRef.current = false; // Initialization failed, allow retry
          setTimeout(() => setErrorMessage(null), 3000);
        });
    } else if (!isOpen && battleState) {
      // Reset all state on close
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      hasInitTimedOutRef.current = false;
      isInitializedRef.current = false;
      isProcessingEnemyTurnRef.current = false;
      setBattleState(null);
      setIsProcessing(false);
      isActionLockedRef.current = false;
      setShowSkills(false);
      setShowPotions(false);
      setShowAdvancedItems(false);
      setErrorMessage(null);
    }
  }, [isOpen, player, adventureType, riskLevel, realmMinRealm, bossId]);

  // Monitor state to ensure action bar displays correctly (prevent isProcessing stuck)
  useEffect(() => {
    if (!battleState) return;

    // If it should be player turn but isProcessing is stuck, auto reset
    if (
      battleState.waitingForPlayerAction &&
      battleState.playerActionsRemaining > 0 &&
      isProcessing
    ) {
      // Check if really processing (by checking for ongoing async operations)
      // If processing for more than 2 seconds, might be stuck, auto reset
      const timeout = setTimeout(() => {
        setIsProcessing((prev) => {
          // Only reset if still processing and still player turn
          if (prev && battleState?.waitingForPlayerAction) {
            console.warn('Detected isProcessing stuck, auto-resetting');
            return false;
          }
          return prev;
        });
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [battleState?.waitingForPlayerAction, battleState?.playerActionsRemaining, isProcessing]);

  // If enemy goes first, auto drive enemy action to avoid missing action bar
  // Use useRef to store latest onClose to avoid frequent triggers due to dependency changes
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Use ref to track if processing enemy turn to avoid duplicate triggers
  const isProcessingEnemyTurnRef = useRef(false);

  useEffect(() => {
    if (
      !battleState ||
      battleState.waitingForPlayerAction ||
      battleState.enemyActionsRemaining <= 0
    ) {
      // If it should be player turn but no action bar, ensure isProcessing is reset
      if (battleState?.waitingForPlayerAction && isProcessing) {
        setIsProcessing(false);
      }
      isProcessingEnemyTurnRef.current = false;
      return;
    }

    // Avoid multiple triggers: use ref to check if processing
    if (isProcessingEnemyTurnRef.current || isProcessing) {
      return;
    }

    isProcessingEnemyTurnRef.current = true;
    setIsProcessing(true);

    // Use shorter delay for faster UI updates
    const timer = setTimeout(() => {
      try {
        let newState = executeEnemyTurn(battleState);

        // If player action count is 0 (too slow), continue enemy turn until player can act or battle ends
        // executeEnemyTurn already handles this, but check again for safety
        let safety = 0;
        while (
          newState.waitingForPlayerAction &&
          newState.playerActionsRemaining <= 0 &&
          !checkBattleEnd(newState) &&
          safety < 10
        ) {
          // Player cannot act, switch back to enemy turn immediately (executeEnemyTurn should have handled this, but just in case)
          if (newState.enemyActionsRemaining <= 0) {
            newState.waitingForPlayerAction = false;
            newState.turn = 'enemy';
            newState.enemyActionsRemaining = newState.enemyMaxActions;
          }
          newState = executeEnemyTurn(newState);
          safety += 1;
        }

        // Battle ended, settle immediately and callback
        if (checkBattleEnd(newState)) {
          const victory = newState.enemy.hp <= 0;
          const hpLoss = player.hp - newState.player.hp;
          const rewards = calculateBattleRewards(
            newState,
            player,
            adventureType,
            riskLevel
          );
          const finalPetSkillCooldowns: Record<string, number> = {};
          if (newState.petSkillCooldowns) {
            Object.keys(newState.petSkillCooldowns).forEach((skillId) => {
              if (newState.petSkillCooldowns![skillId] > 0) {
                finalPetSkillCooldowns[skillId] =
                  newState.petSkillCooldowns![skillId];
              }
            });
          }
          isProcessingEnemyTurnRef.current = false;
          setIsProcessing(false);
          isActionLockedRef.current = false; // Release lock
          onCloseRef.current(
            {
              victory,
              hpLoss,
              expChange: rewards.expChange,
              spiritChange: rewards.spiritChange,
              adventureType,
              items: rewards.items,
              petSkillCooldowns:
                Object.keys(finalPetSkillCooldowns).length > 0
                  ? finalPetSkillCooldowns
                  : undefined,
            },
            newState.playerInventory
          );
          return;
        }

        // Set state directly, then reset processing flag in next event loop
        setBattleState(newState);

        // Use setTimeout to ensure processing flag is reset after state update completes
        setTimeout(() => {
          isProcessingEnemyTurnRef.current = false;
          setIsProcessing(false);
          isActionLockedRef.current = false; // Release lock, allow player action after enemy turn ends
        }, 50);
      } catch (error) {
        console.error('Enemy turn error:', error);
        isProcessingEnemyTurnRef.current = false;
        setErrorMessage('Enemy action error');
        setIsProcessing(false);
        isActionLockedRef.current = false; // Release lock
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }, 100); // Reduce delay time

    return () => {
      clearTimeout(timer);
    };
  }, [battleState?.waitingForPlayerAction, battleState?.enemyActionsRemaining, battleState?.id]);

  // Handle player action
  const handlePlayerAction = async (action: PlayerAction) => {
    // Use ref lock for first layer check (synchronous, immediate effect)
    if (isActionLockedRef.current) {
      return;
    }

    // Strict check: must meet all conditions to operate
    if (
      !battleState ||
      isProcessing ||
      !battleState.waitingForPlayerAction ||
      battleState.playerActionsRemaining <= 0
    ) {
      return;
    }

    // Set lock immediately to prevent duplicate clicks (update ref and state simultaneously)
    isActionLockedRef.current = true;
    setIsProcessing(true);
    setShowSkills(false);
    setShowPotions(false);
    setShowAdvancedItems(false);

    try {
      // Execute player action
      let newState = executePlayerAction(battleState, action);

      // Check if battle ended
      if (checkBattleEnd(newState)) {
        // Battle ended, calculate rewards
        const victory = newState.enemy.hp <= 0;
        const hpLoss = player.hp - newState.player.hp;
        const rewards = calculateBattleRewards(
          newState,
          player,
          adventureType,
          riskLevel
        );
        // Clear cooldowns for skills with 0 cooldown
        const finalPetSkillCooldowns: Record<string, number> = {};
        if (newState.petSkillCooldowns) {
          Object.keys(newState.petSkillCooldowns).forEach((skillId) => {
            if (newState.petSkillCooldowns![skillId] > 0) {
              finalPetSkillCooldowns[skillId] = newState.petSkillCooldowns![skillId];
            }
          });
        }
        setIsProcessing(false);
        isActionLockedRef.current = false;
        onClose(
          {
            victory,
            hpLoss,
            expChange: rewards.expChange,
            spiritChange: rewards.spiritChange,
            adventureType,
            items: rewards.items,
            petSkillCooldowns: Object.keys(finalPetSkillCooldowns).length > 0 ? finalPetSkillCooldowns : undefined,
          },
          newState.playerInventory
        );
        return;
      }

      // If player has remaining actions, continue player turn
      // But wait for state update to complete to prevent rapid clicks
      if (
        newState.waitingForPlayerAction &&
        newState.playerActionsRemaining > 0
      ) {
        setBattleState(newState);
        // Add short delay to ensure next action allowed after state update
        setTimeout(() => {
          setIsProcessing(false);
          isActionLockedRef.current = false;
        }, 500); // Increase to 500ms delay to ensure state update complete
        return; // Continue waiting for player action
      }

      // Player turn ended, execute enemy turn after delay
      setTimeout(() => {
        try {
          newState = executeEnemyTurn(newState);

          // Check if battle ended again
          if (checkBattleEnd(newState)) {
            const victory = newState.enemy.hp <= 0;
            const hpLoss = player.hp - newState.player.hp;
            const rewards = calculateBattleRewards(
              newState,
              player,
              adventureType,
              riskLevel
            );
            setIsProcessing(false);
            isActionLockedRef.current = false; // Release lock
            onClose(
              {
                victory,
                hpLoss,
                expChange: rewards.expChange,
                spiritChange: rewards.spiritChange,
                items: rewards.items,
              },
              newState.playerInventory
            );
            return;
          }

          setBattleState(newState);
          setIsProcessing(false);
          isActionLockedRef.current = false; // Release lock
        } catch (error) {
          console.error('Enemy turn error:', error);
          setIsProcessing(false);
          isActionLockedRef.current = false; // Release lock
          setErrorMessage('Error during enemy turn');
          setTimeout(() => setErrorMessage(null), 3000);
        }
      }, 1000);
    } catch (error) {
      console.error('Combat action error:', error);
      // Show error (especially for insufficient MP)
      const errorMsg = error instanceof Error ? error.message : 'Combat action failed';
      setErrorMessage(errorMsg);
      setIsProcessing(false);
      isActionLockedRef.current = false; // Release lock
      // Clear error message after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Skip battle
  const handleSkipBattle = () => {
    if (!battleState || isProcessing) return;

    // Double confirmation
    showConfirm(
      'Skipping combat ignores the challenge of the wasteland. Proceed?',
      'Confirm Skip Combat',
      () => {
        // Execute skip logic
        setIsProcessing(true);
        let currentState = { ...battleState };
        let isBattleEnded = false;
        let loopCount = 0;
        const MAX_LOOPS = 200; // Prevent infinite loop

        try {
          while (!isBattleEnded && loopCount < MAX_LOOPS) {
            loopCount++;

            // Player turn
            if (
              currentState.waitingForPlayerAction &&
              currentState.playerActionsRemaining > 0
            ) {
              currentState = executePlayerAction(currentState, { type: 'attack' });
              isBattleEnded = checkBattleEnd(currentState);
              if (isBattleEnded) break;
            }

            // Enemy turn (if player actions exhausted or not player turn)
            if (
              !isBattleEnded &&
              (!currentState.waitingForPlayerAction ||
                currentState.playerActionsRemaining <= 0)
            ) {
              currentState = executeEnemyTurn(currentState);
              isBattleEnded = checkBattleEnd(currentState);
            }
          }

          // Battle end settlement
          const victory = currentState.enemy.hp <= 0;
          const hpLoss = player.hp - currentState.player.hp;
          const rewards = calculateBattleRewards(
            currentState,
            player,
            adventureType,
            riskLevel
          );

          onClose(
            {
              victory,
              hpLoss,
              expChange: rewards.expChange,
              spiritChange: rewards.spiritChange,
              adventureType,
              items: rewards.items,
            },
            currentState.playerInventory
          );
        } catch (error) {
          console.error('Error during skip combat:', error);
          setErrorMessage('Skip combat failed');
          setIsProcessing(false);
        }
      },
      () => {
        // User cancelled, do nothing
      }
    );
  };

  // Get available skills (check cooldown and MP)
  const availableSkills = useMemo(() => {
    if (!battleState) return [];
    return battleState.player.skills.filter((skill) => {
      const cooldownOk = (battleState.player.cooldowns[skill.id] || 0) === 0;
      const manaOk =
        !skill.cost.mana || (battleState.player.mana || 0) >= skill.cost.mana;
      return cooldownOk && manaOk;
    });
  }, [battleState]);

  // Get skills on cooldown or insufficient MP
  const unavailableSkills = useMemo(() => {
    if (!battleState) return [];
    return battleState.player.skills.filter((skill) => {
      const onCooldown = (battleState.player.cooldowns[skill.id] || 0) > 0;
      const notEnoughMana =
        skill.cost.mana && (battleState.player.mana || 0) < skill.cost.mana;
      return onCooldown || notEnoughMana;
    });
  }, [battleState]);

  // Get available chems (get from battle state inventory as item usage updates inventory)
  const availablePotions = useMemo(() => {
    if (!battleState) return [];
    const inventory = battleState.playerInventory || player.inventory;
    if (!Array.isArray(inventory)) return [];
    return inventory.filter((item) => {
      const potionConfig = Object.values(BATTLE_POTIONS).find(
        (p) => p.name === item.name
      );
      return potionConfig && item.quantity > 0;
    });
  }, [battleState?.playerInventory, player.inventory]);

  if (!isOpen || !battleState) return null;

  const { player: playerUnit, enemy: enemyUnit } = battleState;
  // Ensure HP is integer (avoid floating point precision issues)
  const playerHp = Math.floor(playerUnit.hp);
  const playerMaxHp = Math.floor(playerUnit.maxHp);
  const enemyHp = Math.floor(enemyUnit.hp);
  const enemyMaxHp = Math.floor(enemyUnit.maxHp);
  const playerHpPercent = (playerHp / playerMaxHp) * 100;
  const enemyHpPercent = (enemyHp / enemyMaxHp) * 100;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4"
      onClick={(e) => {
        // In auto-adventure mode, clicking outside to close is not allowed, only flee or fast forward to end battle
        if (autoAdventure) {
          return;
        }
        if (
          e.target === e.currentTarget &&
          !battleState.waitingForPlayerAction
        ) {
          // Only allow clicking outside to close when battle ends
        }
      }}
    >
      <div
        className="bg-stone-950 border border-amber-500/30 w-full max-w-4xl max-h-[90vh] rounded-none shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700">
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-widest">
              Turn-Based Combat · Round {battleState.round}
            </div>
            <div className="flex items-center gap-2 text-lg font-terminal text-amber-400">
              <Sword size={18} className="text-amber-400" />
              {enemyUnit.name}
              <span className="text-[11px] text-stone-400 bg-stone-900 px-2 py-0.5 rounded-none border border-stone-700">
                {enemyUnit.realm}
              </span>
            </div>
            {battleState.waitingForPlayerAction &&
              battleState.playerActionsRemaining > 0 && (
                <div className="text-xs text-emerald-400 mt-1">
                  Action Points (AP): {battleState.playerActionsRemaining} /{' '}
                  {battleState.playerMaxActions}
                </div>
              )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkipBattle}
              disabled={isProcessing}
              className="p-2 rounded border border-stone-600 text-stone-200 hover:bg-stone-700/40 disabled:opacity-50"
              title="Skip Combat"
            >
              <FastForward size={18} />
            </button>
          </div>
        </div>

        {/* Battle Area */}
        <div className="modal-scroll-container modal-scroll-content px-6 py-4 space-y-4">
          {/* Enemy Info */}
          <div className="bg-rose-900/20 border border-rose-700/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-rose-300 font-semibold">
                {enemyUnit.name}
              </span>
              <span className="text-xs text-stone-400">
                HP: {enemyHp} / {enemyMaxHp}
              </span>
            </div>
            <div className="w-full bg-stone-800 rounded-full h-3 mb-2">
              <div
                className="bg-rose-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${enemyHpPercent}%` }}
              />
            </div>
            <div className="flex gap-4 text-xs text-stone-400">
              <span>ATK: {enemyUnit.attack}</span>
              <span>DEF: {enemyUnit.defense}</span>
              <span>SPD: {enemyUnit.speed}</span>
              <span>PER: {enemyUnit.spirit}</span>
            </div>
          </div>

          {/* Player Info */}
          <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-300 font-semibold">
                {playerUnit.name}
              </span>
              <span className="text-xs text-stone-400">
                HP: {playerHp} / {playerMaxHp} · MP:{' '}
                {Math.floor(playerUnit.mana || 0)} / {Math.floor(playerUnit.maxMana || 100)}
                {battleState.waitingForPlayerAction && (
                  <span className="text-emerald-400 ml-2">
                    · AP: {battleState.playerActionsRemaining}/
                    {battleState.playerMaxActions}
                  </span>
                )}
              </span>
            </div>
            <div className="w-full bg-stone-800 rounded-full h-3 mb-2">
              <div
                className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${playerHpPercent}%` }}
              />
            </div>
            <div className="flex gap-4 text-xs text-stone-400">
              <span>ATK: {playerUnit.attack}</span>
              <span>DEF: {playerUnit.defense}</span>
              <span>SPD: {playerUnit.speed}</span>
              <span>PER: {playerUnit.spirit}</span>
            </div>
            {/* Buff/Debuff Display */}
            {(playerUnit.buffs.length > 0 || playerUnit.debuffs.length > 0) && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {playerUnit.buffs.map((buff) => (
                  <span
                    key={buff.id}
                    className="text-xs bg-emerald-700/30 text-emerald-200 px-2 py-0.5 rounded"
                    title={buff.description || buff.name}
                  >
                    {buff.name}
                  </span>
                ))}
                {playerUnit.debuffs.map((debuff) => (
                  <span
                    key={debuff.id}
                    className="text-xs bg-rose-700/30 text-rose-200 px-2 py-0.5 rounded"
                    title={debuff.description || debuff.name}
                  >
                    {debuff.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Battle Journal */}
          <div className="mt-4">
            <BattleLog history={battleState.history} />
          </div>

          {/* Combat Visuals Overlay */}
          <CombatVisuals effects={visualEffects} />
        </div>

        {/* Action Selection Area */}
        {battleState.waitingForPlayerAction && battleState.playerActionsRemaining > 0 && !isProcessing && (
          <div className="border-t border-stone-700 px-6 py-4 bg-stone-950/90">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => handlePlayerAction({ type: 'attack' })}
                disabled={isProcessing || battleState.playerActionsRemaining <= 0}
                className={`flex items-center gap-2 px-4 py-2 rounded border ${isProcessing || battleState.playerActionsRemaining <= 0
                  ? 'border-stone-700 text-stone-600 cursor-not-allowed opacity-50'
                  : 'border-amber-500 text-amber-300 hover:bg-amber-500/10'
                  }`}
              >
                <Sword size={16} />
                Basic Attack
              </button>
              <button
                onClick={() => setShowSkills(!showSkills)}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-4 py-2 rounded border ${isProcessing
                  ? 'border-stone-700 text-stone-600 cursor-not-allowed opacity-50'
                  : 'border-blue-500 text-blue-300 hover:bg-blue-500/10'
                  }`}
              >
                <Zap size={16} />
                Skills ({availableSkills.length})
              </button>
              <button
                onClick={() => setShowPotions(!showPotions)}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-4 py-2 rounded border ${isProcessing
                  ? 'border-stone-700 text-stone-600 cursor-not-allowed opacity-50'
                  : 'border-purple-500 text-purple-300 hover:bg-purple-500/10'
                  }`}
              >
                <Option size={16} />
                Chems ({availablePotions.length})
              </button>
              <button
                onClick={() => setShowAdvancedItems(!showAdvancedItems)}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-4 py-2 rounded border ${isProcessing
                  ? 'border-stone-700 text-stone-600 cursor-not-allowed opacity-50'
                  : 'border-yellow-500 text-yellow-300 hover:bg-yellow-500/10'
                  }`}
              >
                <Zap size={16} />
                Advanced Items
              </button>
              <button
                onClick={() => handlePlayerAction({ type: 'defend' })}
                disabled={isProcessing || battleState.playerActionsRemaining <= 0}
                className={`flex items-center gap-2 px-4 py-2 rounded border ${isProcessing || battleState.playerActionsRemaining <= 0
                  ? 'border-stone-700 text-stone-600 cursor-not-allowed opacity-50'
                  : 'border-cyan-500 text-cyan-300 hover:bg-cyan-500/10'
                  }`}
              >
                <Shield size={16} />
                Defend
              </button>
              <button
                onClick={() => handlePlayerAction({ type: 'flee' })}
                disabled={isProcessing || battleState.playerActionsRemaining <= 0}
                className={`flex items-center gap-2 px-4 py-2 rounded border ${isProcessing || battleState.playerActionsRemaining <= 0
                  ? 'border-stone-700 text-stone-600 cursor-not-allowed opacity-50'
                  : 'border-stone-500 text-stone-300 hover:bg-stone-500/10'
                  }`}
              >
                <ArrowRight size={16} />
                Flee
              </button>
            </div>

            {/* Skills List */}
            {showSkills && (
              <div className="mt-3 p-3 bg-ink-800 rounded border border-stone-700 max-h-[300px] overflow-y-auto">
                <div className="text-xs text-stone-400 mb-2">Available Skills / Perks</div>
                <div className="space-y-2">
                  {availableSkills.length === 0 ? (
                    <div className="text-sm text-stone-500">No available skills</div>
                  ) : (
                    availableSkills.map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() =>
                          handlePlayerAction({
                            type: 'skill',
                            skillId: skill.id,
                          })
                        }
                        disabled={isProcessing || battleState.playerActionsRemaining <= 0}
                        className={`w-full text-left p-2 rounded border text-sm ${isProcessing || battleState.playerActionsRemaining <= 0
                          ? 'border-stone-700 bg-stone-900/40 text-stone-600 cursor-not-allowed opacity-50'
                          : 'border-blue-700/50 bg-blue-900/20 hover:bg-blue-900/40'
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-blue-300 font-semibold">
                            {skill.name}
                          </span>
                          <span className="text-xs text-stone-400">
                            {skill.cost.mana
                              ? `AP Cost: ${skill.cost.mana}`
                              : ''}
                          </span>
                        </div>
                        <div className="text-xs text-stone-400 mt-1">
                          {skill.description}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {unavailableSkills.length > 0 && (
                  <>
                    <div className="text-xs text-stone-500 mt-3 mb-2">
                      Unavailable Skills
                    </div>
                    <div className="space-y-2">
                      {unavailableSkills.map((skill) => {
                        const onCooldown =
                          (battleState.player.cooldowns[skill.id] || 0) > 0;
                        const notEnoughMana =
                          skill.cost.mana &&
                          (battleState.player.mana || 0) < skill.cost.mana;
                        return (
                          <div
                            key={skill.id}
                            className="w-full text-left p-2 rounded border border-stone-700 bg-stone-900/40 text-sm opacity-50"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-stone-400 font-semibold">
                                {skill.name}
                              </span>
                              <span className="text-xs text-stone-500">
                                {onCooldown &&
                                  `Cooldown: ${battleState.player.cooldowns[skill.id]} Rounds`}
                                {notEnoughMana &&
                                  `Low AP (Need ${skill.cost.mana}, Current ${battleState.player.mana || 0})`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Chems List */}
            {showPotions && (
              <div className="mt-3 p-3 bg-ink-800 rounded border border-stone-700 max-h-[300px] overflow-y-auto">
                <div className="text-xs text-stone-400 mb-2">Available Chems</div>
                <div className="space-y-2">
                  {availablePotions.length === 0 ? (
                    <div className="text-sm text-stone-500">No available chems</div>
                  ) : (
                    availablePotions.map((item) => {
                      const potionConfig = Object.values(BATTLE_POTIONS).find(
                        (p) => p.name === item.name
                      );
                      if (!potionConfig) return null;
                      return (
                        <button
                          key={item.id}
                          onClick={() =>
                            handlePlayerAction({
                              type: 'item',
                              itemId: item.id,
                            })
                          }
                          disabled={isProcessing || battleState.playerActionsRemaining <= 0}
                          className={`w-full text-left p-2 rounded border text-sm ${isProcessing || battleState.playerActionsRemaining <= 0
                            ? 'border-stone-700 bg-stone-900/40 text-stone-600 cursor-not-allowed opacity-50'
                            : 'border-purple-700/50 bg-purple-900/20 hover:bg-purple-900/40'
                            }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-purple-300 font-semibold">
                              {item.name}
                            </span>
                            <span className="text-xs text-stone-400">
                              Qty: {item.quantity}
                            </span>
                          </div>
                          <div className="text-xs text-stone-400 mt-1">
                            {potionConfig.type === 'heal'
                              ? `Restore ${potionConfig.effect.heal} HP`
                              : 'Grant buff effect'}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Advanced Items List */}
            {showAdvancedItems && (() => {
              const availableAdvancedItems: Array<{
                type: 'foundationTreasure' | 'heavenEarthEssence' | 'heavenEarthMarrow' | 'longevityRule';
                id: string;
                name: string;
                rarity: string;
                battleEffect: any;
                cooldown?: number;
              }> = [];

              // Check Foundation Treasures
              if (player?.foundationTreasure) {
                const treasure = FOUNDATION_TREASURES[player.foundationTreasure];
                if (treasure) {
                  if (treasure.battleEffect) {
                    const cooldownKey = `advanced_foundationTreasure_${treasure.id}`;
                    const cooldown = battleState?.player.cooldowns[cooldownKey] || 0;
                    availableAdvancedItems.push({
                      type: 'foundationTreasure',
                      id: treasure.id,
                      name: treasure.name,
                      rarity: treasure.rarity,
                      battleEffect: treasure.battleEffect,
                      cooldown,
                    });
                  } else {
                    // If no battleEffect, show but mark as unavailable
                    availableAdvancedItems.push({
                      type: 'foundationTreasure',
                      id: treasure.id,
                      name: treasure.name,
                      rarity: treasure.rarity,
                      battleEffect: null as any, // Mark as null indicating no battle effect
                      cooldown: 0,
                    });
                  }
                }
              }

              // Check Heaven Earth Essence
              if (player?.heavenEarthEssence) {
                const essence = HEAVEN_EARTH_ESSENCES[player.heavenEarthEssence];
                if (essence) {
                  if (essence.battleEffect) {
                    const cooldownKey = `advanced_heavenEarthEssence_${essence.id}`;
                    const cooldown = battleState?.player.cooldowns[cooldownKey] || 0;
                    availableAdvancedItems.push({
                      type: 'heavenEarthEssence',
                      id: essence.id,
                      name: essence.name,
                      rarity: essence.rarity,
                      battleEffect: essence.battleEffect,
                      cooldown,
                    });
                  } else {
                    availableAdvancedItems.push({
                      type: 'heavenEarthEssence',
                      id: essence.id,
                      name: essence.name,
                      rarity: essence.rarity,
                      battleEffect: null as any,
                      cooldown: 0,
                    });
                  }
                }
              }

              // Check Heaven Earth Marrow
              if (player?.heavenEarthMarrow) {
                const marrow = HEAVEN_EARTH_MARROWS[player.heavenEarthMarrow];
                if (marrow) {
                  if (marrow.battleEffect) {
                    const cooldownKey = `advanced_heavenEarthMarrow_${marrow.id}`;
                    const cooldown = battleState?.player.cooldowns[cooldownKey] || 0;
                    availableAdvancedItems.push({
                      type: 'heavenEarthMarrow',
                      id: marrow.id,
                      name: marrow.name,
                      rarity: marrow.rarity,
                      battleEffect: marrow.battleEffect,
                      cooldown,
                    });
                  } else {
                    availableAdvancedItems.push({
                      type: 'heavenEarthMarrow',
                      id: marrow.id,
                      name: marrow.name,
                      rarity: marrow.rarity,
                      battleEffect: null as any,
                      cooldown: 0,
                    });
                  }
                }
              }

              // Check Longevity Rules
              if (player?.longevityRules && Array.isArray(player.longevityRules)) {
                player.longevityRules.forEach((ruleId) => {
                  const rule = LONGEVITY_RULES[ruleId];
                  if (rule) {
                    if (rule.battleEffect) {
                      const cooldownKey = `advanced_longevityRule_${rule.id}`;
                      const cooldown = battleState?.player.cooldowns[cooldownKey] || 0;
                      availableAdvancedItems.push({
                        type: 'longevityRule',
                        id: rule.id,
                        name: rule.name,
                        rarity: 'Mythic',
                        battleEffect: rule.battleEffect,
                        cooldown,
                      });
                    } else {
                      availableAdvancedItems.push({
                        type: 'longevityRule',
                        id: rule.id,
                        name: rule.name,
                        rarity: 'Mythic',
                        battleEffect: null as any,
                        cooldown: 0,
                      });
                    }
                  }
                });
              }

              return (
                <div className="mt-3 p-3 bg-ink-800 rounded border border-stone-700 max-h-[300px] overflow-y-auto">
                  <div className="text-xs text-stone-400 mb-2">Advanced Items</div>
                  <div className="space-y-2">
                    {availableAdvancedItems.length === 0 ? (
                      <div className="text-sm text-stone-500">No advanced items available</div>
                    ) : (
                      availableAdvancedItems.map((item) => {
                        const isOnCooldown = (item.cooldown || 0) > 0;
                        const hasBattleEffect = item.battleEffect !== null;
                        const canUse = !isProcessing && battleState.playerActionsRemaining > 0 && !isOnCooldown && hasBattleEffect;

                        return (
                          <button
                            key={`${item.type}_${item.id}`}
                            onClick={() => {
                              if (canUse) {
                                handlePlayerAction({
                                  type: 'advancedItem',
                                  itemType: item.type,
                                  itemId: item.id,
                                });
                              }
                            }}
                            disabled={!canUse}
                            className={`w-full text-left p-2 rounded border text-sm ${!canUse
                              ? 'border-stone-700 bg-stone-900/40 text-stone-600 cursor-not-allowed opacity-50'
                              : 'border-yellow-700/50 bg-yellow-900/20 hover:bg-yellow-900/40'
                              }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-yellow-300 font-semibold">
                                {item.name}
                              </span>
                              <span className={`text-xs ${item.rarity === 'Mythic' ? 'text-amber-400' :
                                item.rarity === 'Legendary' ? 'text-purple-400' :
                                  item.rarity === 'Rare' ? 'text-blue-400' :
                                    'text-stone-400'
                                }`}>
                                {item.rarity === 'Mythic'
                                  ? 'Mythic'
                                  : item.rarity === 'Legendary'
                                    ? 'Legendary'
                                    : item.rarity === 'Rare'
                                      ? 'Rare'
                                      : item.rarity}
                              </span>
                            </div>
                            {hasBattleEffect ? (
                              <>
                                <div className="text-xs text-stone-400 mt-1">
                                  {item.battleEffect.description}
                                </div>
                                <div className="text-xs text-stone-500 mt-1">
                                  {(() => {
                                    const costs: string[] = [];
                                    if (item.battleEffect.cost?.lifespan) {
                                      costs.push(`Life Cost: ${item.battleEffect.cost.lifespan}y`);
                                    }
                                    if (item.battleEffect.cost?.maxHp) {
                                      const maxHpCost = item.battleEffect.cost.maxHp;
                                      const display =
                                        typeof maxHpCost === 'number' && maxHpCost < 1
                                          ? `${(maxHpCost * 100).toFixed(0)}%`
                                          : String(maxHpCost);
                                      costs.push(`Max HP Cost: ${display}`);
                                    }
                                    if (item.battleEffect.cost?.hp) {
                                      costs.push(`HP Cost: ${item.battleEffect.cost.hp}`);
                                    }
                                    if (item.battleEffect.cost?.spirit) {
                                      costs.push(`PER Cost: ${item.battleEffect.cost.spirit}`);
                                    }
                                    return costs.join(' · ');
                                  })()}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-stone-500 mt-1">
                                No combat effect.
                              </div>
                            )}
                            {isOnCooldown && (
                              <div className="text-xs text-red-400 mt-1">
                                Cooldown: {item.cooldown} turns
                              </div>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="border-t border-stone-700 px-6 py-4 bg-ink-900/90">
            <div className="text-center text-stone-400">Processing...</div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="border-t border-stone-700 px-6 py-4 bg-rose-900/20 border-rose-700/40">
            <div className="text-center text-rose-300 text-sm">
              {errorMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnBasedBattleModal;
