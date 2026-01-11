import React from 'react';
import { PlayerStats } from '../../types';
import {
  TALENTS,
  ACHIEVEMENTS,
  REALM_ORDER,
  calculateSpiritualRootArtBonus,
} from '../../constants/index';
import { getActiveMentalArt, getPlayerTotalStats } from '../../utils/statUtils';

interface UseMeditationHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  checkLevelUp: (addedExp: number) => void;
}

/**
 * Meditation Handler Functions
 * Includes meditation
 * @param player Player data
 * @param setPlayer Set player data
 * @param addLog Add log
 * @param checkLevelUp Check level up
 * @returns handleMeditate Meditate
 */

export function useMeditationHandlers({
  player,
  setPlayer,
  addLog,
  checkLevelUp,
}: UseMeditationHandlersProps) {
  const handleMeditate = () => {
    if (!player) return;

    // Calculate base gain based on realm
    // Base gain = Realm base value * (1 + Realm level * 0.15)
    const realmIndex = REALM_ORDER.indexOf(player.realm);

    // Realm base multiplier (based on realm level) - Reduce base multiplier to slow down leveling
    const realmBaseMultipliers = [1, 2, 4, 8, 15, 30, 60]; // Reduced multipliers: from [1,2,5,10,25,50,100]
    const realmBaseMultiplier = realmBaseMultipliers[realmIndex] || 1;

    // Base gain = Realm base multiplier * 5 * (1 + Realm level * 0.1) - Reduce base value and level bonus
    let baseGain = Math.floor(
      realmBaseMultiplier * 5 * (1 + player.realmLevel * 0.1) // From 10 reduced to 5, from 0.15 reduced to 0.1
    );

    // Apply Active Art Bonus
    const activeArt = getActiveMentalArt(player);
    if (activeArt && activeArt.effects.expRate) {
      // Calculate Spiritual Root bonus for Mental Art
      const spiritualRootBonus = calculateSpiritualRootArtBonus(
        activeArt,
        player.spiritualRoots || {
          metal: 0,
          wood: 0,
          water: 0,
          fire: 0,
          earth: 0,
        }
      );
      baseGain = Math.floor(baseGain * (1 + activeArt.effects.expRate) * spiritualRootBonus);
    }

    // Apply Talent Bonus
    const talent = TALENTS.find((t) => t.id === player.talentId);
    if (talent && talent.effects.expRate) {
      baseGain = Math.floor(baseGain * (1 + talent.effects.expRate));
    }

    // Apply Grotto Bonus (Spirit Array bonus + Modification bonus)
    if (player.grotto) {
      const totalGrottoBonus = (player.grotto.expRateBonus || 0) + (player.grotto.spiritArrayEnhancement || 0);
      if (totalGrottoBonus > 0) {
        const beforeGrotto = baseGain;
        baseGain = Math.floor(baseGain * (1 + totalGrottoBonus));
        // Only show extra hint when there is modification bonus
        if (player.grotto.spiritArrayEnhancement && player.grotto.spiritArrayEnhancement > 0) {
          const enhancementGain = Math.floor(beforeGrotto * player.grotto.spiritArrayEnhancement);
          if (enhancementGain > 0) {
            addLog(`The Spirit Array modification brought you extra spiritual energy support! (+${enhancementGain} Exp)`, 'special');
          }
        }
      }
    }

    // Check if enlightenment triggered (0.1% chance)
    const isEnlightenment = Math.random() < 0.001;
    let actualGain: number;
    let logMessage: string;

    if (isEnlightenment) {
      // Enlightenment: Gain 30-50x exp
      const enlightenmentMultiplier = 30 + Math.random() * 20; // 30-50x
      actualGain = Math.floor(baseGain * enlightenmentMultiplier);
      const artText = activeArt ? `, circulating ${activeArt.name}` : '';
      logMessage = `✨ You suddenly had an epiphany, your mind cleared, and you gained a deeper understanding of the Dao${artText}! (+${actualGain} Exp)`;
      addLog(logMessage, 'special');
    } else {
      // Normal cultivation: Small random fluctuation
      actualGain = Math.floor(baseGain * (0.85 + Math.random() * 0.3)); // 85%-115%
      const artText = activeArt ? `, circulating ${activeArt.name}` : '';
      logMessage = `You focused on comprehending the Dao${artText}. (+${actualGain} Exp)`;
      addLog(logMessage);
    }

    setPlayer((prev) => {
      // Get actual max HP (including Golden Core Method bonuses etc.)
      const totalStats = getPlayerTotalStats(prev);
      const actualMaxHp = totalStats.maxHp;

      // Meditate accelerates healing: Base 2x, can increase based on realm and level
      // Base multiplier = 2.0 + Realm level * 0.1 (Max 3.5x)
      const baseMultiplier = 2.0 + Math.min(prev.realmLevel * 0.1, 1.5); // 2.0 - 3.5x

      // Calculate healing: Base regen * Meditation multiplier (based on actual max HP)
      const baseRegen = Math.max(1, Math.floor(actualMaxHp * 0.01));
      const actualRegen = Math.floor(baseRegen * baseMultiplier);

      // Restore HP directly (use actual max HP as limit)
      const newHp = Math.min(actualMaxHp, prev.hp + actualRegen);

      // Add healing hint
      const multiplierText = baseMultiplier.toFixed(1);
      if (newHp > prev.hp) {
        addLog(
          `💚 Meditation accelerates healing, restoring ${actualRegen} HP (${multiplierText}x speed)`,
          'gain'
        );
      }

      // Gain small amount of Spirit Stones during meditation (provide stable source)
      // Base Spirit Stones = Realm Index * 2 + 1, increases with realm
      const realmIndex = REALM_ORDER.indexOf(prev.realm);
      const baseStones = Math.max(1, realmIndex * 2 + 1);
      // Random fluctuation ±1
      const stoneGain = baseStones + Math.floor(Math.random() * 3) - 1;
      const newSpiritStones = prev.spiritStones + Math.max(1, stoneGain);

      // Update statistics
      const stats = prev.statistics || {
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

      // Only show hint when gaining Spirit Stones (avoid spam)
      if (stoneGain > 0 && Math.random() < 0.3) {
        // 30% chance to show hint, avoid spam
        addLog(`💰 You obtained ${Math.max(1, stoneGain)} Spirit Stones during meditation`, 'gain');
      }

      return {
        ...prev,
        exp: prev.exp + actualGain,
        hp: newHp,
        spiritStones: newSpiritStones,
        statistics: {
          ...stats,
          meditateCount: stats.meditateCount + 1,
        },
      };
    });
    checkLevelUp(actualGain);

    // Check first meditation achievement
    if (!player.achievements.includes('ach-first-step')) {
      const firstMeditateAchievement = ACHIEVEMENTS.find(
        (a) => a.id === 'ach-first-step'
      );
      if (firstMeditateAchievement) {
        setPlayer((prev) => {
          const newAchievements = [...prev.achievements, 'ach-first-step'];
          addLog(
            `🎉 Achievement Unlocked: [${firstMeditateAchievement.name}]!`,
            'special'
          );
          return {
            ...prev,
            achievements: newAchievements,
            exp: prev.exp + (firstMeditateAchievement.reward.exp || 0),
            spiritStones:
              prev.spiritStones +
              (firstMeditateAchievement.reward.spiritStones || 0),
          };
        });
      }
    }
  };

  return {
    handleMeditate,
  };
}
