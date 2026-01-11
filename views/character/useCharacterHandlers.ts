import React from 'react';
import { PlayerStats } from '../../types';
import { TITLES, TITLE_SET_EFFECTS } from '../../constants/index';
import { calculateTitleEffects } from '../../utils/titleUtils';
import {
  getAttributeMultiplier,
  BASE_ATTRIBUTES,
} from '../../utils/attributeUtils';
import { getPlayerTotalStats } from '../../utils/statUtils';

interface UseCharacterHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

/**
 * Character Handlers
 * Includes selecting talents, titles, and allocating attributes
 * @param player Player data
 * @param setPlayer Set player data
 * @param addLog Add log
 * @returns handleSelectTalent Select talent
 * @returns handleSelectTitle Select title
 * @returns handleAllocateAttribute Allocate attribute
 */
export function useCharacterHandlers({
  player,
  setPlayer,
  addLog,
  setItemActionLog,
}: UseCharacterHandlersProps) {
  const handleSelectTalent = (talentId: string) => {
    // Talents are randomly generated at the start of the game and cannot be changed
    addLog('Talents are determined at the start of the game and cannot be changed!', 'danger');
    return;
  };

  const handleSelectTitle = (titleId: string) => {
    const title = TITLES.find((t) => t.id === titleId);
    if (!title) return;

    // Check if unlocked
    const unlockedTitles = player.unlockedTitles || [];
    if (!unlockedTitles.includes(titleId)) {
      const message = `You have not unlocked the title [${title.name}]!`;
      if (setItemActionLog) {
        setItemActionLog({ text: message, type: 'danger' });
      } else {
        addLog(message, 'danger');
      }
      return;
    }

    setPlayer((prev) => {
      // Calculate old title effects (including set effects)
      const prevUnlockedTitles = prev.unlockedTitles || [];
      const oldEffects = calculateTitleEffects(prev.titleId, prevUnlockedTitles);

      // Calculate new title effects (including set effects)
      const newEffects = calculateTitleEffects(titleId, prevUnlockedTitles);

      // Apply effect difference
      const attackDiff = newEffects.attack - oldEffects.attack;
      const defenseDiff = newEffects.defense - oldEffects.defense;
      const hpDiff = newEffects.hp - oldEffects.hp;
      const spiritDiff = newEffects.spirit - oldEffects.spirit;
      const physiqueDiff = newEffects.physique - oldEffects.physique;
      const speedDiff = newEffects.speed - oldEffects.speed;
      const expRateDiff = newEffects.expRate - oldEffects.expRate;
      const luckDiff = newEffects.luck - oldEffects.luck;

      let newAttack = prev.attack + attackDiff;
      let newDefense = prev.defense + defenseDiff;
      let newMaxHp = prev.maxHp + hpDiff;
      let newHp = prev.hp + hpDiff;
      let newSpirit = prev.spirit + spiritDiff;
      let newPhysique = prev.physique + physiqueDiff;
      let newSpeed = prev.speed + speedDiff;
      let newLuck = prev.luck + luckDiff;

      // Calculate actual max HP (including cultivation art bonuses etc.)
      const tempPlayer = { ...prev, maxHp: newMaxHp };
      const totalStats = getPlayerTotalStats(tempPlayer);
      const actualMaxHp = totalStats.maxHp;

      let logMessage = `You equipped the title [${title.name}]!`;

      // Check for set effects
      if (title.setGroup) {
        const setEffect = TITLE_SET_EFFECTS.find(se =>
          se.titles.includes(titleId) &&
          se.titles.every(tid => prevUnlockedTitles.includes(tid))
        );
        if (setEffect) {
          logMessage += `\n✨ Activated set effect [${setEffect.setName}]!`;
        }
      }

      addLog(logMessage, 'special');
      return {
        ...prev,
        titleId: titleId,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: Math.min(newHp, actualMaxHp), // Use actual max HP as limit
        spirit: newSpirit,
        physique: newPhysique,
        speed: newSpeed,
        luck: newLuck,
      };
    });
  };

  const handleAllocateAttribute = (
    type: 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'
  ) => {
    if (!player || player.attributePoints <= 0) return;

    setPlayer((prev) => {
      const points = prev.attributePoints - 1;
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newHp = prev.hp;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      // Calculate attribute point bonus multiplier based on realm (linear growth, more balanced)
      const multiplier = getAttributeMultiplier(prev.realm);

      // Base attribute gain
      const baseAttack = BASE_ATTRIBUTES.attack;
      const baseDefense = BASE_ATTRIBUTES.defense;
      const baseHp = BASE_ATTRIBUTES.hp;
      const baseSpirit = BASE_ATTRIBUTES.spirit;
      const basePhysique = BASE_ATTRIBUTES.physique;
      const basePhysiqueHp = BASE_ATTRIBUTES.physiqueHp;
      const baseSpeed = BASE_ATTRIBUTES.speed;

      if (type === 'attack') {
        const gain = Math.floor(baseAttack * multiplier);
        newAttack += gain;
        addLog(`You allocated 1 attribute point to Attack (+${gain})`, 'gain');
      } else if (type === 'defense') {
        const gain = Math.floor(baseDefense * multiplier);
        newDefense += gain;
        addLog(`You allocated 1 attribute point to Defense (+${gain})`, 'gain');
      } else if (type === 'hp') {
        const gain = Math.floor(baseHp * multiplier);
        newMaxHp += gain;
        newHp += gain;
        // Calculate actual max HP (including cultivation art bonuses etc.) as limit
        const tempPlayer = { ...prev, maxHp: newMaxHp };
        const totalStats = getPlayerTotalStats(tempPlayer);
        const actualMaxHp = totalStats.maxHp;
        newHp = Math.min(newHp, actualMaxHp);
        addLog(`You allocated 1 attribute point to HP (+${gain})`, 'gain');
      } else if (type === 'spirit') {
        const gain = Math.floor(baseSpirit * multiplier);
        newSpirit += gain;
        addLog(`You allocated 1 attribute point to Spirit (+${gain})`, 'gain');
      } else if (type === 'physique') {
        const physiqueGain = Math.floor(basePhysique * multiplier);
        const hpGain = Math.floor(basePhysiqueHp * multiplier);
        newPhysique += physiqueGain;
        newMaxHp += hpGain;
        newHp += hpGain;
        // Calculate actual max HP (including cultivation art bonuses etc.) as limit
        const tempPlayer = { ...prev, maxHp: newMaxHp };
        const totalStats = getPlayerTotalStats(tempPlayer);
        const actualMaxHp = totalStats.maxHp;
        newHp = Math.min(newHp, actualMaxHp);
        addLog(`You allocated 1 attribute point to Physique (+${physiqueGain} Physique, +${hpGain} HP)`, 'gain');
      } else if (type === 'speed') {
        const gain = Math.floor(baseSpeed * multiplier);
        newSpeed += gain;
        addLog(`You allocated 1 attribute point to Speed (+${gain})`, 'gain');
      }

      return {
        ...prev,
        attributePoints: points,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: newHp,
        spirit: newSpirit,
        physique: newPhysique,
        speed: newSpeed,
      };
    });
  };

  const handleAllocateAllAttributes = (
    type: 'attack' | 'defense' | 'hp' | 'spirit' | 'physique' | 'speed'
  ) => {
    if (!player || player.attributePoints <= 0) return;

    setPlayer((prev) => {
      const pointsToAllocate = prev.attributePoints;
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newHp = prev.hp;
      let newSpirit = prev.spirit;
      let newPhysique = prev.physique;
      let newSpeed = prev.speed;

      // Calculate attribute point bonus multiplier based on realm (linear growth, more balanced)
      const multiplier = getAttributeMultiplier(prev.realm);

      // Base attribute gain
      const baseAttack = BASE_ATTRIBUTES.attack;
      const baseDefense = BASE_ATTRIBUTES.defense;
      const baseHp = BASE_ATTRIBUTES.hp;
      const baseSpirit = BASE_ATTRIBUTES.spirit;
      const basePhysique = BASE_ATTRIBUTES.physique;
      const basePhysiqueHp = BASE_ATTRIBUTES.physiqueHp;
      const baseSpeed = BASE_ATTRIBUTES.speed;

      // Calculate total gain
      let totalGain = 0;
      let totalPhysiqueGain = 0;
      let totalHpGain = 0;

      if (type === 'attack') {
        totalGain = Math.floor(baseAttack * multiplier * pointsToAllocate);
        newAttack += totalGain;
        addLog(`You auto-allocated ${pointsToAllocate} attribute points to Attack (+${totalGain})`, 'gain');
      } else if (type === 'defense') {
        totalGain = Math.floor(baseDefense * multiplier * pointsToAllocate);
        newDefense += totalGain;
        addLog(`You auto-allocated ${pointsToAllocate} attribute points to Defense (+${totalGain})`, 'gain');
      } else if (type === 'hp') {
        totalGain = Math.floor(baseHp * multiplier * pointsToAllocate);
        newMaxHp += totalGain;
        newHp += totalGain;
        // Calculate actual max HP (including cultivation art bonuses etc.) as limit
        const tempPlayer = { ...prev, maxHp: newMaxHp };
        const totalStats = getPlayerTotalStats(tempPlayer);
        const actualMaxHp = totalStats.maxHp;
        newHp = Math.min(newHp, actualMaxHp);
        addLog(`You auto-allocated ${pointsToAllocate} attribute points to HP (+${totalGain})`, 'gain');
      } else if (type === 'spirit') {
        totalGain = Math.floor(baseSpirit * multiplier * pointsToAllocate);
        newSpirit += totalGain;
        addLog(`You auto-allocated ${pointsToAllocate} attribute points to Spirit (+${totalGain})`, 'gain');
      } else if (type === 'physique') {
        totalPhysiqueGain = Math.floor(basePhysique * multiplier * pointsToAllocate);
        totalHpGain = Math.floor(basePhysiqueHp * multiplier * pointsToAllocate);
        newPhysique += totalPhysiqueGain;
        newMaxHp += totalHpGain;
        newHp += totalHpGain;
        // Calculate actual max HP (including cultivation art bonuses etc.) as limit
        const tempPlayer = { ...prev, maxHp: newMaxHp };
        const totalStats = getPlayerTotalStats(tempPlayer);
        const actualMaxHp = totalStats.maxHp;
        newHp = Math.min(newHp, actualMaxHp);
        addLog(
          `You auto-allocated ${pointsToAllocate} attribute points to Physique (+${totalPhysiqueGain} Physique, +${totalHpGain} HP)`,
          'gain'
        );
      } else if (type === 'speed') {
        totalGain = Math.floor(baseSpeed * multiplier * pointsToAllocate);
        newSpeed += totalGain;
        addLog(`You auto-allocated ${pointsToAllocate} attribute points to Speed (+${totalGain})`, 'gain');
      }

      return {
        ...prev,
        attributePoints: 0,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: newHp,
        spirit: newSpirit,
        physique: newPhysique,
        speed: newSpeed,
      };
    });
  };

  const handleResetAttributes = () => {
    if (!player) return;

    // Calculate reset cost: 100 Spirit Stones per allocated point
    const allocatedPoints = 0; // Need to track allocated points here, temporarily set to 0
    const cost = allocatedPoints * 100;

    if (player.spiritStones < cost) {
      addLog(`Resetting attributes costs ${cost} Spirit Stones. You don't have enough!`, 'danger');
      return;
    }

    // Temporarily indicate feature not fully implemented
    addLog('Attribute reset requires tracking allocated points. Not fully implemented yet.', 'danger');
  };

  return {
    handleSelectTalent,
    handleSelectTitle,
    handleAllocateAttribute,
    handleAllocateAllAttributes,
    handleResetAttributes,
  };
}
