import React, { useCallback, useRef } from 'react';
import { PlayerStats, RealmType } from '../../types';
import { REALM_ORDER, ACHIEVEMENTS, TITLES } from '../../constants/index';
import { uid } from '../../utils/gameUtils';
import { calculateTitleEffects } from '../../utils/titleUtils';
import { getPlayerTotalStats } from '../../utils/statUtils';

interface UseAchievementHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
}
/**
 * Achievement Handlers
 * Includes checking achievements and applying achievement effects
 * @param player Player data
 * @param setPlayer Set player data
 * @param addLog Add log
 * @returns checkAchievements Check achievements
 */
export function useAchievementHandlers({
  player,
  setPlayer,
  addLog,
}: UseAchievementHandlersProps) {
  // Use ref to prevent duplicate achievement triggers
  const checkingAchievementsRef = useRef(false);

  const checkAchievements = useCallback(() => {
    if (!player) return; // Prevent player being null
    if (checkingAchievementsRef.current) return; // Prevent duplicate triggers
    checkingAchievementsRef.current = true;

    setPlayer((prev) => {
      if (!prev) {
        checkingAchievementsRef.current = false;
        return prev; // Prevent prev being null
      }

      const newAchievements = [...prev.achievements];
      let hasNewAchievement = false;
      let newExp = prev.exp;
      let newStones = prev.spiritStones;
      let newInv = [...prev.inventory];
      let lastRewardedTitleId = '';
      const newlyUnlockedTitles: string[] = [];

      ACHIEVEMENTS.forEach((achievement) => {
        // Skip completed achievements to prevent duplicate triggers
        if (newAchievements.includes(achievement.id)) return;

        let completed = false;
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

        // Check different types of achievements
        if (achievement.requirement.type === 'realm') {
          const realmIndex = REALM_ORDER.indexOf(
            achievement.requirement.target as RealmType
          );
          const playerRealmIndex = REALM_ORDER.indexOf(prev.realm);
          // If index is invalid (-1), conservative handling: condition not met
          if (realmIndex < 0 || playerRealmIndex < 0) {
            completed = false;
          } else {
            completed = playerRealmIndex >= realmIndex;
          }
        } else if (achievement.requirement.type === 'kill') {
          // Kill achievement
          completed = stats.killCount >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'collect') {
          // Collection achievement: Check unique item count in inventory
          const uniqueItems = Array.isArray(prev.inventory)
            ? new Set(prev.inventory.map((item) => item.name))
            : new Set();
          completed = uniqueItems.size >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'meditate') {
          // Meditation achievement
          completed = stats.meditateCount >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'adventure') {
          // Adventure achievement
          completed = stats.adventureCount >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'equip') {
          // Equipment achievement
          completed = stats.equipCount >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'pet') {
          // Pet achievement
          completed = Array.isArray(prev.pets) && prev.pets.length >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'recipe') {
          // Recipe achievement
          completed = Array.isArray(prev.unlockedRecipes) && prev.unlockedRecipes.length >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'art') {
          // Cultivation art achievement
          completed = Array.isArray(prev.cultivationArts) && prev.cultivationArts.length >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'breakthrough') {
          // Breakthrough achievement
          completed = stats.breakthroughCount >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'secret_realm') {
          // Secret realm achievement
          completed = stats.secretRealmCount >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'lottery') {
          // Lottery achievement
          completed = (prev.lotteryCount || 0) >= achievement.requirement.value;
        } else if (achievement.requirement.type === 'custom') {
          // Custom achievement (e.g., first meditation, needs separate check in specific places)
          if (achievement.requirement.target === 'meditate') {
            // This needs to be checked separately during meditation
            return;
          } else if (achievement.requirement.target === 'alchemy') {
            completed = (stats.alchemyCount || 0) >= achievement.requirement.value;
          } else if (achievement.requirement.target === 'sect_elder') {
            const rankOrder = [SectRank.Outer, SectRank.Inner, SectRank.Core, SectRank.Elder, SectRank.Leader];
            const playerRankIdx = rankOrder.indexOf(prev.sectRank || SectRank.Outer);
            const targetRankIdx = rankOrder.indexOf(SectRank.Elder);
            completed = playerRankIdx >= targetRankIdx;
          }
          // Other custom achievements can be added as needed
        }

        if (completed) {
          hasNewAchievement = true;
          newAchievements.push(achievement.id);
          newExp += achievement.reward.exp || 0;
          newStones += achievement.reward.spiritStones || 0;

          if (achievement.reward.items) {
            achievement.reward.items.forEach((item) => {
              const existingIdx = newInv.findIndex((i) => i.name === item.name);
              if (existingIdx >= 0) {
                newInv[existingIdx] = {
                  ...newInv[existingIdx],
                  quantity: newInv[existingIdx].quantity + 1,
                };
              } else {
                newInv.push({ ...item, id: uid() });
              }
            });
          }

          if (achievement.reward.titleId) {
            lastRewardedTitleId = achievement.reward.titleId;
            if (!prev.unlockedTitles?.includes(lastRewardedTitleId) && !newlyUnlockedTitles.includes(lastRewardedTitleId)) {
              newlyUnlockedTitles.push(lastRewardedTitleId);
            }
          }

          addLog(`✨ Achievement Unlocked: [${achievement.name}]!`, 'special');
        }
      });

      if (!hasNewAchievement && newlyUnlockedTitles.length === 0) {
        checkingAchievementsRef.current = false;
        return prev;
      }

      // Handle title logic
      let finalTitleId = prev.titleId;
      let statUpdates = {};
      const updatedUnlockedTitles = prev.unlockedTitles 
        ? [...prev.unlockedTitles, ...newlyUnlockedTitles.filter(id => !prev.unlockedTitles!.includes(id))]
        : [...newlyUnlockedTitles];

      // If no title currently equipped and unlocked new title, auto equip last unlocked title
      if (!prev.titleId && newlyUnlockedTitles.length > 0) {
        finalTitleId = lastRewardedTitleId;
        
        // Calculate new title effects
        const oldEffects = calculateTitleEffects('', prev.unlockedTitles || []);
        const newEffects = calculateTitleEffects(finalTitleId, updatedUnlockedTitles);
        
        // First calculate new base attributes
        const newMaxHp = prev.maxHp + (newEffects.hp - oldEffects.hp);
        const newHp = prev.hp + (newEffects.hp - oldEffects.hp);

        // Create temporary player object to calculate actual max HP
        const tempPlayer = { ...prev, maxHp: newMaxHp };
        const totalStats = getPlayerTotalStats(tempPlayer);
        const actualMaxHp = totalStats.maxHp;

        statUpdates = {
          attack: prev.attack + (newEffects.attack - oldEffects.attack),
          defense: prev.defense + (newEffects.defense - oldEffects.defense),
          maxHp: newMaxHp,
          hp: Math.min(newHp, actualMaxHp), // Use actual max HP as limit
          spirit: prev.spirit + (newEffects.spirit - oldEffects.spirit),
          physique: prev.physique + (newEffects.physique - oldEffects.physique),
          speed: prev.speed + (newEffects.speed - oldEffects.speed),
          luck: prev.luck + (newEffects.luck - oldEffects.luck),
        };
        addLog(`✨ Automatically equipped new title: [${TITLES.find(t => t.id === finalTitleId)?.name}]!`, 'special');
      } else if (newlyUnlockedTitles.length > 0) {
        // Even if not automatically equipped, if a new title is unlocked and meets set effects, stats will change
        const oldEffects = calculateTitleEffects(prev.titleId, prev.unlockedTitles || []);
        const newEffects = calculateTitleEffects(prev.titleId, updatedUnlockedTitles);

        if (JSON.stringify(oldEffects) !== JSON.stringify(newEffects)) {
          // First calculate new base attributes
          const newMaxHp = prev.maxHp + (newEffects.hp - oldEffects.hp);
          const newHp = prev.hp + (newEffects.hp - oldEffects.hp);

          // Create temporary player object to calculate actual max HP
          const tempPlayer = { ...prev, maxHp: newMaxHp };
          const totalStats = getPlayerTotalStats(tempPlayer);
          const actualMaxHp = totalStats.maxHp;

          statUpdates = {
            attack: prev.attack + (newEffects.attack - oldEffects.attack),
            defense: prev.defense + (newEffects.defense - oldEffects.defense),
            maxHp: newMaxHp,
            hp: Math.min(newHp, actualMaxHp), // Use actual max HP as limit
            spirit: prev.spirit + (newEffects.spirit - oldEffects.spirit),
            physique: prev.physique + (newEffects.physique - oldEffects.physique),
            speed: prev.speed + (newEffects.speed - oldEffects.speed),
            luck: prev.luck + (newEffects.luck - oldEffects.luck),
          };
          addLog(`✨ Unlocking new title triggered set effects! Power increased!`, 'special');
        }
      }

      checkingAchievementsRef.current = false;
      return {
        ...prev,
        achievements: newAchievements,
        exp: newExp,
        spiritStones: newStones,
        inventory: newInv,
        titleId: finalTitleId,
        unlockedTitles: updatedUnlockedTitles,
        ...statUpdates,
      };

    });
  }, [player, setPlayer, addLog]);

  return {
    checkAchievements,
  };
}
