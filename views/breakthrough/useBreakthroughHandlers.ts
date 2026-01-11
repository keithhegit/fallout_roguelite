import React from 'react';
import { PlayerStats, RealmType } from '../../types';
import { REALM_DATA, REALM_ORDER } from '../../constants/index';
import { getRandomBreakthroughDescription } from '../../services/templateService';
import { getRealmIndex, calculateBreakthroughAttributePoints } from '../../utils/attributeUtils';
import { checkBreakthroughConditions, calculateGoldenCoreMethodCount } from '../../utils/cultivationUtils';
import { getPlayerTotalStats, calculatePlayerBonuses } from '../../utils/statUtils';

interface UseBreakthroughHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setLoading: (loading: boolean) => void;
  loading: boolean;
}

/**
 * Breakthrough Handler Functions
 * Includes breakthrough and using inheritance
 * @param player Player data
 * @param setPlayer Set player data
 * @param addLog Add log
 * @param setLoading Set loading state
 * @param loading Loading state
 * @returns handleBreakthrough Breakthrough
 * @returns handleUseInheritance Use inheritance
 */
export function useBreakthroughHandlers({
  player,
  setPlayer,
  addLog,
  setLoading,
  loading,
}: UseBreakthroughHandlersProps) {
  const handleBreakthrough = async (skipSuccessCheck: boolean = false, hpLoss: number = 0) => {
    if (loading || !player) return;

    const isRealmUpgrade = player.realmLevel >= 9;

    // If it's a realm upgrade, check promotion conditions
    if (isRealmUpgrade) {
      const currentIndex = REALM_ORDER.indexOf(player.realm);
      if (currentIndex < REALM_ORDER.length - 1) {
        const targetRealm = REALM_ORDER[currentIndex + 1];
        const conditionCheck = checkBreakthroughConditions(player, targetRealm);

        if (!conditionCheck.canBreakthrough) {
          addLog(conditionCheck.message, 'danger');
          return;
        }
      }
    }

    const successChance = isRealmUpgrade ? 0.6 : 0.9;

    // If skipping success check (after Tribulation success), execute breakthrough directly
    const isSuccess = skipSuccessCheck || Math.random() < successChance;

    if (isSuccess) {
      setLoading(true);

      let nextRealm = player.realm;
      let nextLevel = player.realmLevel + 1;

      if (isRealmUpgrade) {
        const currentIndex = REALM_ORDER.indexOf(player.realm);
        if (currentIndex < REALM_ORDER.length - 1) {
          nextRealm = REALM_ORDER[currentIndex + 1];
          nextLevel = 1;
        } else {
          // Already at peak realm and level 9, cannot break through normally
          addLog('You have reached the peak of the Immortal Path. Due to planar restrictions, you cannot break through further!', 'special');
          setLoading(false);
          // Lock exp at max to avoid repeated triggers
          setPlayer(prev => ({ ...prev, exp: prev.maxExp }));
          return;
        }
      }

      const realmText = isRealmUpgrade ? nextRealm : `${player.realm} Layer ${nextLevel}`;
      // Use template library to generate breakthrough description
      const flavor = getRandomBreakthroughDescription(realmText, player.name);
      addLog(flavor, 'special');

      setPlayer((prev) => {
        const stats = REALM_DATA[nextRealm];
        const levelMultiplier = 1 + nextLevel * 0.1;

        // Calculate old realm base stats (for attribute point allocation calculation)
        const oldStats = REALM_DATA[prev.realm];
        const oldLevelMultiplier = 1 + prev.realmLevel * 0.1;
        const oldBaseAttack = Math.floor(oldStats.baseAttack * oldLevelMultiplier);
        const oldBaseDefense = Math.floor(oldStats.baseDefense * oldLevelMultiplier);
        const oldBaseHp = Math.floor(oldStats.baseMaxHp * oldLevelMultiplier);
        const oldBaseSpirit = Math.floor(oldStats.baseSpirit * oldLevelMultiplier);
        const oldBasePhysique = Math.floor(oldStats.basePhysique * oldLevelMultiplier);
        const oldBaseSpeed = Math.floor(oldStats.baseSpeed * oldLevelMultiplier);

        // Use unified bonus calculation function
        const bonuses = calculatePlayerBonuses(prev);
        const bonusAttack = bonuses.attack;
        const bonusDefense = bonuses.defense;
        const bonusHp = bonuses.hp;
        const bonusSpirit = bonuses.spirit;
        const bonusPhysique = bonuses.physique;
        const bonusSpeed = bonuses.speed;

        // Calculate old base stats + fixed bonuses (for attribute point allocation calculation)
        const oldBaseWithFixedBonusAttack = oldBaseAttack + bonusAttack;
        const oldBaseWithFixedBonusDefense = oldBaseDefense + bonusDefense;
        const oldBaseWithFixedBonusHp = oldBaseHp + bonusHp;
        const oldBaseWithFixedBonusSpirit = oldBaseSpirit + bonusSpirit;
        const oldBaseWithFixedBonusPhysique = oldBasePhysique + bonusPhysique;
        const oldBaseWithFixedBonusSpeed = oldBaseSpeed + bonusSpeed;

        // Calculate extra attributes allocated by user points
        const allocatedAttack = Math.max(0, prev.attack - oldBaseWithFixedBonusAttack);
        const allocatedDefense = Math.max(0, prev.defense - oldBaseWithFixedBonusDefense);
        const allocatedHp = Math.max(0, prev.maxHp - oldBaseWithFixedBonusHp);
        const allocatedSpirit = Math.max(0, prev.spirit - oldBaseWithFixedBonusSpirit);
        const allocatedPhysique = Math.max(0, prev.physique - oldBaseWithFixedBonusPhysique);
        const allocatedSpeed = Math.max(0, prev.speed - oldBaseWithFixedBonusSpeed);

        const newBaseMaxHp = Math.floor(stats.baseMaxHp * levelMultiplier);
        const newMaxExp = Math.floor(stats.maxExpBase * levelMultiplier * 1.5);
        const newBaseMaxLifespan = stats.baseMaxLifespan;

        // Calculate excess exp, keep for next realm
        const excessExp = Math.max(0, prev.exp - prev.maxExp);
        const newExp = excessExp;

        // Update statistics
        const playerStats = prev.statistics || {
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

        // Attribute points gained on breakthrough: Exponential growth
        // Realm upgrade: 2^(realm index + 1), Level upgrade: 2^realm index / 9 + 1
        const targetRealm = isRealmUpgrade ? nextRealm : prev.realm;
        const attributePointsGained = calculateBreakthroughAttributePoints(isRealmUpgrade, targetRealm);
        if (attributePointsGained > 0) {
          addLog(
            `✨ Breakthrough Successful! Gained ${attributePointsGained} attribute points!`,
            'gain'
          );
        }

        // Calculate lifespan increase (Stronger drive: Longevity)
        const oldMaxLifespan = prev.maxLifespan || 100;
        let lifespanIncrease = 0;

        if (isRealmUpgrade) {
          // Realm upgrade: Gain full base lifespan difference + extra base value bonus
          const baseIncrease = newBaseMaxLifespan - oldMaxLifespan;
          lifespanIncrease = baseIncrease + Math.floor(newBaseMaxLifespan * 0.1);
        } else {
          // Level upgrade: Gain 1/9 of difference, plus at least 1-5 years random bonus
          const baseIncrease = Math.floor((newBaseMaxLifespan - oldMaxLifespan) / 9);
          const bonus = Math.floor(Math.random() * 5) + 1;
          lifespanIncrease = baseIncrease + bonus;
        }

        const newMaxLifespan = oldMaxLifespan + lifespanIncrease;
        const newLifespan = (prev.lifespan ?? oldMaxLifespan) + lifespanIncrease;

        if (lifespanIncrease > 0) {
          addLog(
            `✨ Breakthrough Successful! Your lifespan increased by ${lifespanIncrease} years! Current Lifespan: ${Math.floor(newLifespan)}/${newMaxLifespan} years`,
            'gain'
          );
        }

        // Calculate base stats + fixed bonuses + allocated points
        const baseAttack = Math.floor(stats.baseAttack * levelMultiplier) + bonusAttack + allocatedAttack;
        const baseDefense = Math.floor(stats.baseDefense * levelMultiplier) + bonusDefense + allocatedDefense;
        const baseMaxHp = newBaseMaxHp + bonusHp + allocatedHp;
        const baseSpirit = Math.floor(stats.baseSpirit * levelMultiplier) + bonusSpirit + allocatedSpirit;
        const basePhysique = Math.floor(stats.basePhysique * levelMultiplier) + bonusPhysique + allocatedPhysique;
        const baseSpeed = Math.max(0, Math.floor(stats.baseSpeed * levelMultiplier) + bonusSpeed + allocatedSpeed);

        // Calculate Golden Core Method count (if upgrading to Golden Core)
        let goldenCoreMethodCount = prev.goldenCoreMethodCount;
        if (isRealmUpgrade && nextRealm === RealmType.GoldenCore) {
          goldenCoreMethodCount = calculateGoldenCoreMethodCount(prev);
        }

        // Build updated player state to calculate actual max HP (including art bonuses etc.)
        const updatedPlayer = {
          ...prev,
          realm: nextRealm,
          realmLevel: nextLevel,
          maxHp: baseMaxHp,
          attack: baseAttack,
          defense: baseDefense,
          spirit: baseSpirit,
          physique: basePhysique,
          speed: baseSpeed,
          goldenCoreMethodCount,
          activeArtId: prev.activeArtId,
          cultivationArts: prev.cultivationArts,
          spiritualRoots: prev.spiritualRoots,
        };
        const totalStats = getPlayerTotalStats(updatedPlayer);
        const actualMaxHp = totalStats.maxHp; // Actual max HP (including art bonuses)

        return {
          ...prev,
          realm: nextRealm,
          realmLevel: nextLevel,
          exp: newExp, // Keep excess exp
          maxExp: newMaxExp,
          // New stats = Base stats (new realm) + Fixed bonuses + Allocated points
          maxHp: baseMaxHp,
          attack: baseAttack,
          defense: baseDefense,
          spirit: baseSpirit,
          physique: basePhysique,
          speed: baseSpeed,
          attributePoints: prev.attributePoints + attributePointsGained,
          maxLifespan: newMaxLifespan,
          lifespan: newLifespan,
          goldenCoreMethodCount, // Set Golden Core Method count
          hp: Math.max(0, actualMaxHp - hpLoss), // Apply HP loss from tribulation
          statistics: {
            ...playerStats,
            breakthroughCount: playerStats.breakthroughCount + 1,
          },
        };
      });
      setLoading(false);
    } else {
      addLog('You tried to break through the bottleneck, but your foundation was unstable and you suffered a backlash!', 'danger');
      setPlayer((prev) => ({
        ...prev,
        exp: Math.floor(prev.exp * 0.7),
        hp: Math.floor(prev.hp * 0.5),
      }));
    }
  };

  const handleUseInheritance = () => {
    setPlayer((prev) => {
      const inheritanceLevel = prev.inheritanceLevel || 0;
      if (inheritanceLevel <= 0) {
        return prev;
      }

      let breakthroughCount = inheritanceLevel;
      let remainingInheritance = 0;
      let currentRealm = prev.realm;
      let currentLevel = prev.realmLevel;

      // Calculate possible breakthroughs
      while (breakthroughCount > 0) {
        const currentIndex = REALM_ORDER.indexOf(currentRealm);
        if (currentLevel >= 9) {
          // Realm upgrade
          if (currentIndex < REALM_ORDER.length - 1) {
            currentRealm = REALM_ORDER[currentIndex + 1];
            currentLevel = 1;
          } else {
            // Already at peak realm, cannot break through
            remainingInheritance = breakthroughCount;
            break;
          }
        } else {
          currentLevel += 1;
        }
        breakthroughCount--;
      }

      if (remainingInheritance === inheritanceLevel) {
        addLog('You have reached the peak of the Immortal Path and cannot use inheritance to break through further!', 'special');
        return prev;
      }

      const actualBreakthroughCount = inheritanceLevel - remainingInheritance;

      if (actualBreakthroughCount > 0) {
        const stats = REALM_DATA[currentRealm];
        const levelMultiplier = 1 + currentLevel * 0.1;

        // Calculate old realm base stats (for attribute point allocation calculation)
        const oldStats = REALM_DATA[prev.realm];
        const oldLevelMultiplier = 1 + prev.realmLevel * 0.1;
        const oldBaseAttack = Math.floor(oldStats.baseAttack * oldLevelMultiplier);
        const oldBaseDefense = Math.floor(oldStats.baseDefense * oldLevelMultiplier);
        const oldBaseHp = Math.floor(oldStats.baseMaxHp * oldLevelMultiplier);
        const oldBaseSpirit = Math.floor(oldStats.baseSpirit * oldLevelMultiplier);
        const oldBasePhysique = Math.floor(oldStats.basePhysique * oldLevelMultiplier);
        const oldBaseSpeed = Math.floor(oldStats.baseSpeed * oldLevelMultiplier);

        // Use unified bonus calculation function
        const bonuses = calculatePlayerBonuses(prev);
        const bonusAttack = bonuses.attack;
        const bonusDefense = bonuses.defense;
        const bonusHp = bonuses.hp;
        const bonusSpirit = bonuses.spirit;
        const bonusPhysique = bonuses.physique;
        const bonusSpeed = bonuses.speed;

        // Calculate old base stats + fixed bonuses (for attribute point allocation calculation)
        const oldBaseWithFixedBonusAttack = oldBaseAttack + bonusAttack;
        const oldBaseWithFixedBonusDefense = oldBaseDefense + bonusDefense;
        const oldBaseWithFixedBonusHp = oldBaseHp + bonusHp;
        const oldBaseWithFixedBonusSpirit = oldBaseSpirit + bonusSpirit;
        const oldBaseWithFixedBonusPhysique = oldBasePhysique + bonusPhysique;
        const oldBaseWithFixedBonusSpeed = oldBaseSpeed + bonusSpeed;

        // Calculate extra attributes allocated by user points
        const allocatedAttack = Math.max(0, prev.attack - oldBaseWithFixedBonusAttack);
        const allocatedDefense = Math.max(0, prev.defense - oldBaseWithFixedBonusDefense);
        const allocatedHp = Math.max(0, prev.maxHp - oldBaseWithFixedBonusHp);
        const allocatedSpirit = Math.max(0, prev.spirit - oldBaseWithFixedBonusSpirit);
        const allocatedPhysique = Math.max(0, prev.physique - oldBaseWithFixedBonusPhysique);
        const allocatedSpeed = Math.max(0, prev.speed - oldBaseWithFixedBonusSpeed);

        const newBaseMaxHp = Math.floor(stats.baseMaxHp * levelMultiplier);
        const newMaxExp = Math.floor(stats.maxExpBase * levelMultiplier * 1.5);

        // Calculate excess exp, keep for next realm
        const excessExp = Math.max(0, prev.exp - prev.maxExp);
        const newExp = excessExp;

        // Calculate attribute points gained from inheritance breakthrough (Exponential growth)
        let attributePointsGained = 0;
        let tempRealm = prev.realm;
        let tempLevel = prev.realmLevel;
        for (let i = 0; i < actualBreakthroughCount; i++) {
          const isRealmUpgrade = tempLevel >= 9;
          const validRealmIndex = getRealmIndex(tempRealm);
          if (isRealmUpgrade) {
            if (validRealmIndex < REALM_ORDER.length - 1) {
              attributePointsGained += calculateBreakthroughAttributePoints(isRealmUpgrade, REALM_ORDER[validRealmIndex + 1]);
              tempRealm = REALM_ORDER[validRealmIndex + 1];
              tempLevel = 1;
            }
          } else {
            attributePointsGained += calculateBreakthroughAttributePoints(isRealmUpgrade, tempRealm);
            tempLevel++;
          }
        }

        addLog(
          `🌟 You used the inheritance and broke through ${actualBreakthroughCount} realms consecutively! Gained ${attributePointsGained} attribute points!`,
          'special'
        );

        // Calculate new realm final stats = Base stats + Fixed bonuses + Allocated points
        const baseAttack = Math.floor(stats.baseAttack * levelMultiplier) + bonusAttack + allocatedAttack;
        const baseDefense = Math.floor(stats.baseDefense * levelMultiplier) + bonusDefense + allocatedDefense;
        const baseMaxHp = newBaseMaxHp + bonusHp + allocatedHp;
        const baseSpirit = Math.floor(stats.baseSpirit * levelMultiplier) + bonusSpirit + allocatedSpirit;
        const basePhysique = Math.floor(stats.basePhysique * levelMultiplier) + bonusPhysique + allocatedPhysique;
        const baseSpeed = Math.max(0, Math.floor(stats.baseSpeed * levelMultiplier) + bonusSpeed + allocatedSpeed);

        // Build updated player state to calculate actual max HP (including art bonuses etc.)
        const updatedPlayer = {
          ...prev,
          realm: currentRealm,
          realmLevel: currentLevel,
          maxHp: baseMaxHp,
          attack: baseAttack,
          defense: baseDefense,
          spirit: baseSpirit,
          physique: basePhysique,
          speed: baseSpeed,
          goldenCoreMethodCount: prev.goldenCoreMethodCount,
          activeArtId: prev.activeArtId,
          cultivationArts: prev.cultivationArts,
          spiritualRoots: prev.spiritualRoots,
        };
        const totalStats = getPlayerTotalStats(updatedPlayer);
        const actualMaxHp = totalStats.maxHp; // Actual max HP (including art bonuses)

        return {
          ...prev,
          realm: currentRealm,
          realmLevel: currentLevel,
          exp: newExp,
          maxExp: newMaxExp,
          maxHp: baseMaxHp,
          hp: actualMaxHp, // Use actual max HP (including art bonuses) as full HP
          attack: baseAttack,
          defense: baseDefense,
          spirit: baseSpirit,
          physique: basePhysique,
          speed: baseSpeed,
          attributePoints: prev.attributePoints + attributePointsGained,
          inheritanceLevel: remainingInheritance,
        };
      }

      return prev;
    });
  };

  return {
    handleBreakthrough,
    handleUseInheritance,
  };
}
