import React from 'react';
import { PlayerStats, AdventureType, ShopType, RealmType, AdventureResult, RiskLevel } from '../../types';
import { REALM_ORDER, HEAVEN_EARTH_SOUL_BOSSES } from '../../constants/index';
import {
  shouldTriggerBattle,
  resolveBattleEncounter,
  BattleReplay,
} from '../../services/battleService';
import { executeAdventureCore } from './executeAdventureCore';
import {
  initializeEventTemplateLibrary,
  getRandomEventTemplate,
  templateToAdventureResult,
} from '../../services/adventureTemplateService';
import { showConfirm } from '../../utils/toastUtils';
import { getPlayerTotalStats } from '../../utils/statUtils';

/**
 * Adventure Handler
 * Includes adventure and adventure core logic
 * @param player Player data
 * @param setPlayer Set player data
 * @param addLog Add log
 * @param triggerVisual Trigger visual effect
 * @param setLoading Set loading state
 * @param setCooldown Set cooldown
 * @param loading Loading state
 * @param cooldown Cooldown
 * @param onOpenShop Open shop
 * @param onOpenBattleModal Open battle modal
 * @returns handleAdventure Handle adventure
 * @returns executeAdventure Execute adventure core logic
 */

interface UseAdventureHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  triggerVisual: (type: string, text?: string, className?: string) => void;
  setLoading: (loading: boolean) => void;
  setCooldown: (cooldown: number) => void;
  loading: boolean;
  cooldown: number;
  onOpenShop: (shopType: ShopType) => void;
  onOpenBattleModal: (replay: BattleReplay) => void;
  onOpenTurnBasedBattle?: (params: {
    adventureType: AdventureType;
    riskLevel?: RiskLevel;
    realmMinRealm?: RealmType;
    bossId?: string; // Specified Heaven Earth Soul BOSS ID (for event template)
  }) => void; // Open turn-based battle
  skipBattle?: boolean; // Whether to skip battle (in auto mode)
  fleeOnBattle?: boolean; // Whether to flee on battle
  skipShop?: boolean; // Whether to skip shop
  skipReputationEvent?: boolean; // Whether to skip reputation event
  useTurnBasedBattle?: boolean; // Whether to use turn-based battle system
  onReputationEvent?: (event: AdventureResult['reputationEvent']) => void; // Reputation event callback
  autoAdventure?: boolean; // Whether auto adventure is active
  setAutoAdventurePausedByHeavenEarthSoul?: (paused: boolean) => void; // Set Heaven Earth Soul pause state
  setAutoAdventure?: (value: boolean) => void; // Set auto adventure state
}

export function useAdventureHandlers({
  player,
  setPlayer,
  addLog,
  triggerVisual,
  setLoading,
  setCooldown,
  loading,
  cooldown,
  onOpenShop,
  onOpenBattleModal,
  onOpenTurnBasedBattle,
  skipBattle = false,
  fleeOnBattle = false,
  skipShop = false,
  skipReputationEvent = false,
  useTurnBasedBattle = true, // Default to use new turn-based battle system
  onReputationEvent,
  autoAdventure = false,
  setAutoAdventurePausedByHeavenEarthSoul,
  setAutoAdventure,
}: UseAdventureHandlersProps) {
  // Ensure skip config is applied only in auto adventure mode
  const effectiveSkipBattle = autoAdventure && skipBattle;
  const effectiveFleeOnBattle = autoAdventure && fleeOnBattle;
  const effectiveSkipShop = autoAdventure && skipShop;
  const effectiveSkipReputationEvent = autoAdventure && skipReputationEvent;

  // Handler for pausing auto adventure
  const handlePauseAutoAdventure = () => {
    if (autoAdventure && setAutoAdventurePausedByHeavenEarthSoul && setAutoAdventure) {
      setAutoAdventurePausedByHeavenEarthSoul(true);
      setAutoAdventure(false);
    }
  };

  /**
   * Common function to handle battle
   * Decide whether to skip battle, open turn-based battle interface, or use auto battle system based on config
   */
  const handleBattle = async (
    battleType: AdventureType,
    riskLevel: RiskLevel,
    realmMinRealm: RealmType,
    bossId?: string,
    huntSectId?: string,
    huntLevel?: number
  ): Promise<{
    result: AdventureResult;
    battleContext: BattleReplay | null;
    petSkillCooldowns?: Record<string, number>;
    shouldReturn: boolean;
  }> => {
    // If flee is configured, skip battle directly
    if (effectiveFleeOnBattle) {
      addLog('You chose to avoid the battle and continue your journey...', 'normal');
      setLoading(false);
      setCooldown(1);
      return { result: {} as AdventureResult, battleContext: null, shouldReturn: true };
    }

    // In auto adventure mode, if skip battle is configured, use auto battle system directly and show result
    if (effectiveSkipBattle) {
      const battleResolution = await resolveBattleEncounter(
        player,
        battleType,
        riskLevel,
        realmMinRealm,
        undefined,
        huntSectId,
        huntLevel,
        bossId
      );
      const battleResult = battleResolution.adventureResult;
      const battleCtx = battleResolution.replay;
      const petSkillCooldowns = battleResolution.petSkillCooldowns;
      // Skip battle in auto adventure, do not open battle modal, return result directly
      return {
        result: battleResult,
        battleContext: battleCtx,
        petSkillCooldowns,
        shouldReturn: false
      };
    } else if (useTurnBasedBattle && onOpenTurnBasedBattle && !effectiveSkipBattle) {
      // If using turn-based battle system, open turn-based battle interface
      setTimeout(() => {
        onOpenTurnBasedBattle({
          adventureType: battleType,
          riskLevel,
          realmMinRealm,
          bossId,
        });
      }, 2000);
      setLoading(false);
      setCooldown(2);
      return { result: {} as AdventureResult, battleContext: null, shouldReturn: true };
    } else {
      // Otherwise use old auto battle system
      const battleResolution = await resolveBattleEncounter(
        player,
        battleType,
        riskLevel,
        realmMinRealm,
        undefined,
        huntSectId,
        huntLevel,
        bossId
      );
      return {
        result: battleResolution.adventureResult,
        battleContext: battleResolution.replay,
        petSkillCooldowns: battleResolution.petSkillCooldowns,
        shouldReturn: false,
      };
    }
  };

  const executeAdventure = async (
    adventureType: AdventureType,
    realmName?: string,
    riskLevel?: RiskLevel,
    realmMinRealm?: RealmType,
  ) => {
    if (!player) {
      setLoading(false);
      return;
    }
    setLoading(true);
    if (realmName) {
      addLog(`You entered [${realmName}]. The air is thick with radiation and danger...`, 'special');
      // Add exploring hint to avoid user feeling stuck
      // Use setTimeout to ensure hint shows in log
      setTimeout(() => {
        addLog('Exploring the secret realm, searching for opportunities...', 'normal');
      }, 100);
    } else if (adventureType === 'dao_combining_challenge') {
      addLog('You challenge the Heaven Earth Soul, the ultimate test of the Wasteland...', 'special');
    } else {
      addLog('You leave your shelter and head into the wasteland...', 'normal');
    }

    try {
      let result;
      let battleContext: BattleReplay | null = null;
      let petSkillCooldowns: Record<string, number> | undefined;

      // Check if being hunted
      const isHunted = player.sectHuntEndTime && player.sectHuntEndTime > Date.now();
      const huntSectId = player.sectHuntSectId;
      const huntLevel = player.sectHuntLevel || 0;

      // If being hunted, force trigger hunt battle (11% chance)
      if (isHunted && huntSectId && Math.random() < 0.11) {
        addLog('⚠️ You feel a strong murderous intent! A faction assassin has appeared!', 'danger');

        // Use common function to handle battle
        const huntRiskLevel = huntLevel >= 3 ? 'Extreme' : huntLevel >= 2 ? 'High' : huntLevel >= 1 ? 'Medium' : 'Low';
        const battleRes = await handleBattle(
          'sect_challenge',
          huntRiskLevel,
          player.realm,
          undefined,
          huntSectId,
          huntLevel
        );
        if (battleRes.shouldReturn) {
          return;
        }
        result = battleRes.result;
        battleContext = battleRes.battleContext;
        petSkillCooldowns = battleRes.petSkillCooldowns;
      } else if (shouldTriggerBattle(player, adventureType)) {
        // If flee is configured, skip battle directly
        if (effectiveFleeOnBattle) {
          addLog('You chose to avoid the battle and continue your journey...', 'normal');
          setLoading(false);
          setCooldown(1);
          return;
        }

        // Use common function to handle battle
        const battleRes = await handleBattle(adventureType, riskLevel || 'Low', realmMinRealm || player.realm);
        if (battleRes.shouldReturn) {
          return;
        }
        result = battleRes.result;
        battleContext = battleRes.battleContext;
        petSkillCooldowns = battleRes.petSkillCooldowns;
      } else {
        // 100% use template library
        initializeEventTemplateLibrary();
        const template = getRandomEventTemplate(adventureType, riskLevel, player.realm, player.realmLevel);

        if (template) {
          // Use actual max HP (including Golden Core Method bonuses etc.)
          const totalStats = getPlayerTotalStats(player);
          result = templateToAdventureResult(template, {
            realm: player.realm,
            realmLevel: player.realmLevel,
            maxHp: totalStats.maxHp,
          });

          // Heaven Earth Soul: Extra chance to encounter at Spirit Severing and above
          const currentRealmIndex = REALM_ORDER.indexOf(player.realm);
          const spiritSeveringIndex = REALM_ORDER.indexOf(RealmType.SpiritSevering);

          if (currentRealmIndex >= spiritSeveringIndex && !result.heavenEarthSoulEncounter) {
            const isSecretRealm = adventureType === 'secret_realm';
            // Spirit Severing and above: Calculate chance based on realm and event type
            const isSpiritSevering = currentRealmIndex === spiritSeveringIndex;
            const soulChance = isSpiritSevering
              ? (isSecretRealm ? 0.08 : (adventureType === 'lucky' ? 0.10 : 0.05)) // Spirit Severing: Normal 5%, Lucky 10%, Secret Realm 8%
              : (isSecretRealm ? 0.12 : (adventureType === 'lucky' ? 0.15 : 0.08)); // Above Spirit Severing: Normal 8%, Lucky 15%, Secret Realm 12%

            if (Math.random() < soulChance) {
              // Randomly select a Heaven Earth Soul BOSS
              const bosses = Object.values(HEAVEN_EARTH_SOUL_BOSSES);
              if (bosses.length > 0) {
                const selectedBoss = bosses[Math.floor(Math.random() * bosses.length)];
                result.heavenEarthSoulEncounter = selectedBoss.id;
                result.adventureType = 'dao_combining_challenge';
              }
            }
          }


          // If event template returns Heaven Earth Soul event, trigger battle
          if (result.adventureType === 'dao_combining_challenge' || result.heavenEarthSoulEncounter) {
            const actualAdventureType = result.adventureType || 'dao_combining_challenge';
            const bossId = result.heavenEarthSoulEncounter;

            // Get Heaven Earth Soul BOSS info
            const boss = bossId ? HEAVEN_EARTH_SOUL_BOSSES[bossId] : null;
            if (boss) {
              // Calculate player power
              const playerStats = getPlayerTotalStats(player);
              const playerPower = playerStats.attack + playerStats.defense + playerStats.maxHp / 10 + playerStats.speed;

              // Calculate BOSS power (apply strength multiplier)
              const bossStats = boss.baseStats;
              const bossPower = (bossStats.attack + bossStats.defense + bossStats.hp / 10 + bossStats.speed) * (boss.strengthMultiplier || 1);

              // Calculate power comparison
              const powerRatio = playerPower / bossPower;
              let strengthComparison = '';
              if (powerRatio >= 1.2) {
                strengthComparison = 'Your power is significantly higher.';
              } else if (powerRatio >= 1.0) {
                strengthComparison = 'Your power is slightly higher.';
              } else if (powerRatio >= 0.8) {
                strengthComparison = 'Your power is comparable.';
              } else if (powerRatio >= 0.6) {
                strengthComparison = 'Your power is slightly lower.';
              } else {
                strengthComparison = 'Your power is significantly lower. Proceed with caution.';
              }

              // If in auto adventure mode, pause auto adventure
              if (autoAdventure && setAutoAdventurePausedByHeavenEarthSoul && setAutoAdventure) {
                setAutoAdventurePausedByHeavenEarthSoul(true);
                setAutoAdventure(false);
              }

              // Build prompt message
              const message = `You encountered the Heaven Earth Soul [${boss.name}]!\n\n` +
                `Description: ${boss.description}\n\n` +
                `Realm: ${boss.realm}\n` +
                `Difficulty: ${boss.difficulty === 'easy' ? 'Easy' : boss.difficulty === 'normal' ? 'Normal' : boss.difficulty === 'hard' ? 'Hard' : 'Extreme'}\n\n` +
                `Power Comparison:\n` +
                `  Attack: ${playerStats.attack.toLocaleString()} vs ${Math.floor(bossStats.attack * (boss.strengthMultiplier || 1)).toLocaleString()}\n` +
                `  Defense: ${playerStats.defense.toLocaleString()} vs ${Math.floor(bossStats.defense * (boss.strengthMultiplier || 1)).toLocaleString()}\n` +
                `  HP: ${playerStats.maxHp.toLocaleString()} vs ${Math.floor(bossStats.hp * (boss.strengthMultiplier || 1)).toLocaleString()}\n` +
                `  Speed: ${playerStats.speed.toLocaleString()} vs ${Math.floor(bossStats.speed * (boss.strengthMultiplier || 1)).toLocaleString()}\n\n` +
                `${strengthComparison}\n\n` +
                `Challenge?`;

              // Show confirm dialog
              showConfirm(
                message,
                `Encounter: ${boss.name}`,
                () => {
                  // Player chose to challenge
                  addLog(`You decided to challenge ${boss.name}!`, 'warning');

                  // In auto adventure mode, if skip battle is configured, use auto battle system directly and show result
                  if (effectiveSkipBattle) {
                    resolveBattleEncounter(
                      player,
                      actualAdventureType,
                      riskLevel,
                      player.realm,
                      undefined,
                      undefined,
                      undefined,
                      bossId
                    ).then((battleResolution) => {
                      const battleResult = battleResolution.adventureResult;
                      const battleCtx = battleResolution.replay;
                      // Skip battle in auto adventure, do not open battle modal
                      executeAdventureCore({
                        result: battleResult,
                        battleContext: battleCtx,
                        petSkillCooldowns: battleResolution.petSkillCooldowns,
                        player,
                        setPlayer,
                        addLog,
                        triggerVisual,
                        onOpenBattleModal,
                        adventureType: actualAdventureType,
                        realmName,
                        skipReputationEvent: effectiveSkipReputationEvent,
                        skipBattle: effectiveSkipBattle, // Pass skipBattle param, ensure not to open battle modal
                        onPauseAutoAdventure: handlePauseAutoAdventure,
                      });
                      setLoading(false);
                      setCooldown(2);
                    });
                    return;
                  } else if (useTurnBasedBattle && onOpenTurnBasedBattle && !effectiveSkipBattle) {
                    // If using turn-based battle system, open turn-based battle interface
                    setTimeout(() => {
                      onOpenTurnBasedBattle({
                        adventureType: actualAdventureType,
                        riskLevel,
                        realmMinRealm: player.realm,
                        bossId,
                      });
                    }, 1000);
                    setLoading(false);
                    setCooldown(2);
                    return;
                  }

                  // Otherwise use old auto battle system
                  resolveBattleEncounter(
                    player,
                    actualAdventureType,
                    riskLevel,
                    player.realm,
                    undefined,
                    undefined,
                    undefined,
                    bossId
                  ).then((battleResolution) => {
                    const battleResult = battleResolution.adventureResult;
                    const battleCtx = battleResolution.replay;
                    executeAdventureCore({
                      result: battleResult,
                      battleContext: battleCtx,
                      petSkillCooldowns: battleResolution.petSkillCooldowns,
                      player,
                      setPlayer,
                      addLog,
                      triggerVisual,
                      onOpenBattleModal,
                      adventureType: actualAdventureType,
                      realmName,
                      skipReputationEvent: effectiveSkipReputationEvent,
                      skipBattle: false, // Manual challenge, do not skip battle, show battle modal
                      onPauseAutoAdventure: handlePauseAutoAdventure,
                    });
                    setLoading(false);
                    setCooldown(2);
                  });
                },
                () => {
                  // Player chose to give up
                  addLog(`You chose to avoid ${boss.name} for now and continue exploring...`, 'normal');
                  setLoading(false);
                  setCooldown(1);
                  // If previously in auto adventure mode, resume auto adventure
                  if (setAutoAdventurePausedByHeavenEarthSoul && setAutoAdventure) {
                    setAutoAdventurePausedByHeavenEarthSoul(false);
                    // Note: do not auto resume autoAdventure here, let user manually decide whether to continue auto adventure
                  }
                }
              );

              setLoading(false);
              return; // Wait for player choice
            }

            // If no BOSS info, use default flow
            // Use common function to handle battle
            const battleResult = await handleBattle(
              actualAdventureType,
              riskLevel || 'Low',
              player.realm,
              bossId
            );
            if (battleResult.shouldReturn) {
              return;
            }
            result = battleResult.result;
            battleContext = battleResult.battleContext;
          }
        } else {
          // If template library is empty, use default event
          result = {
            story: 'You encountered nothing special during your adventure.',
            hpChange: 0,
            expChange: Math.floor(10 * (1 + REALM_ORDER.indexOf(player.realm) * 0.3)),
            spiritStonesChange: 0,
            eventColor: 'normal',
          };
        }
      }

      // Wait 2 seconds before processing result
      await new Promise(resolve => setTimeout(resolve, 2000));

      if(import.meta.env.DEV) {
        console.log('result', result);
      }

      // Execute result processing after 3 seconds
      await executeAdventureCore({
        result,
        battleContext,
        petSkillCooldowns,
        player,
        setPlayer,
        addLog,
        triggerVisual,
        onOpenBattleModal,
        realmName,
        adventureType,
        skipBattle: effectiveSkipBattle,
        riskLevel,
        skipReputationEvent: effectiveSkipReputationEvent,
        onReputationEvent,
        onPauseAutoAdventure: handlePauseAutoAdventure,
      });
    } catch (e) {
      addLog('A sudden anomaly occurred during adventure, damaging your consciousness, forcing you to return.', 'danger');
    } finally {
      setLoading(false);
      setCooldown(2);
    }
  };

  const handleAdventure = async () => {
    if (loading || cooldown > 0) return;
    // Use actual max HP (including Golden Core Method bonuses etc.) to determine heavy injury state
    const totalStats = getPlayerTotalStats(player);
    if (player.hp < totalStats.maxHp * 0.2) {
      addLog('You are heavily injured, but you struggle to continue exploring...', 'danger');
    }

    // Calculate lucky chance based on realm
    const realmIndex = REALM_ORDER.indexOf(player.realm);
    const baseLuckyChance = 0.05; // Base 5% chance
    const realmBonus = realmIndex * 0.02; // +2% per realm
    const levelBonus = (player.realmLevel - 1) * 0.01; // +1% per level
    const luckBonus = player.luck * 0.001; // Luck bonus
    const luckyChance = Math.min(
      0.3,
      baseLuckyChance + realmBonus + levelBonus + luckBonus
    );

    // 15% Chance to encounter a shop
    const shopChance = Math.random();
    if (shopChance < 0.15) {
      setLoading(true);
      addLog('You found a trading post on the road...', 'normal');

      // Wait 3 seconds before opening shop
      setTimeout(() => {
        const shopTypes = [ShopType.Village, ShopType.City, ShopType.Sect, ShopType.LimitedTime, ShopType.BlackMarket, ShopType.Reputation];
        const randomShopType =
          shopTypes[Math.floor(Math.random() * shopTypes.length)];
        // If skip shop configured, and in auto adventure mode, do not open shop
        if (!effectiveSkipShop) {
          onOpenShop(randomShopType);
        } else {
          addLog('You chose to skip the shop and continue...', 'normal');
        }
        setLoading(false);
        setCooldown(2);
      }, 3000);
      return;
    }

    // Calculate lucky chance based on realm
    const isLucky = Math.random() < luckyChance;
    await executeAdventure(isLucky ? 'lucky' : 'normal');
  };

  return {
    handleAdventure,
    executeAdventure,
  };
}
