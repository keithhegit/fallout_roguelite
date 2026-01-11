import React from 'react';
import { PlayerStats, CultivationArt, RealmType } from '../../types';
import { SECTS, REALM_ORDER, calculateSpiritualRootArtBonus } from '../../constants/index';
import { showError, showWarning } from '../../utils/toastUtils';

interface UseCultivationHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
}

/**
 * Cultivation Art Handlers
 * Includes learning and activating cultivation arts
 * @param player Player data
 * @param setPlayer Set player data
 * @param addLog Add log
 * @returns handleLearnArt Learn cultivation art
 * @returns handleActivateArt Activate cultivation art
 */

export function useCultivationHandlers({
  player,
  setPlayer,
  addLog,
}: UseCultivationHandlersProps) {
  const handleLearnArt = (art: CultivationArt) => {
    if (!player) {
      showError('Player data not found!', 'Error');
      addLog('Player data not found!', 'danger');
      return;
    }

    // Check if already learned
    if (player.cultivationArts.includes(art.id)) {
      showWarning(`You have already learned the cultivation art [${art.name}]!`, 'Cannot Learn');
      addLog(`You have already learned the cultivation art [${art.name}]!`, 'danger');
      return;
    }

    // Check if unlocked (only arts unlocked through adventure can be learned)
    const unlockedArts = player.unlockedArts || [];
    if (!unlockedArts.includes(art.id)) {
      showWarning(`You have not unlocked the cultivation art [${art.name}] yet! Obtain it through adventures.`, 'Locked');
      addLog(`You have not unlocked the cultivation art [${art.name}] yet! Obtain it through adventures.`, 'danger');
      return;
    }

    if (player.spiritStones < art.cost) {
      showError(`Not enough Spirit Stones!\nNeed ${art.cost}, but you only have ${player.spiritStones}.`, 'Insufficient Spirit Stones');
      addLog('Not enough Spirit Stones!', 'danger');
      return;
    }

    // Check realm requirement
    const getRealmIndex = (realm: RealmType) => REALM_ORDER.indexOf(realm);
    if (getRealmIndex(player.realm) < getRealmIndex(art.realmRequirement)) {
      showWarning(
        `Learning this art requires [${art.realmRequirement}] realm.\nYour current realm is [${player.realm}].`,
        'Insufficient Realm'
      );
      addLog(`Learning this art requires [${art.realmRequirement}] realm, but your current realm is [${player.realm}].`, 'danger');
      return;
    }

    // Check sect requirement
    if (art.sectId !== null && art.sectId !== undefined) {
      if (player.sectId !== art.sectId) {
        const sect = SECTS.find((s) => s.id === art.sectId);
        const sectName = sect ? sect.name : art.sectId;
        showWarning(`This art is exclusive to [${sectName}]. You cannot learn it.`, 'Cannot Learn');
        addLog(`This art is exclusive to [${sectName}]. You cannot learn it.`, 'danger');
        return;
      }
    }

    // Check attribute requirements
    if (art.attributeRequirements) {
      const reqs = art.attributeRequirements;
      const missingReqs: string[] = [];

      if (reqs.attack && player.attack < reqs.attack) {
        missingReqs.push(`Attack: Need ${reqs.attack}, Current ${player.attack}`);
      }
      if (reqs.defense && player.defense < reqs.defense) {
        missingReqs.push(`Defense: Need ${reqs.defense}, Current ${player.defense}`);
      }
      if (reqs.spirit && player.spirit < reqs.spirit) {
        missingReqs.push(`Spirit: Need ${reqs.spirit}, Current ${player.spirit}`);
      }
      if (reqs.physique && player.physique < reqs.physique) {
        missingReqs.push(`Physique: Need ${reqs.physique}, Current ${player.physique}`);
      }
      if (reqs.speed && player.speed < reqs.speed) {
        missingReqs.push(`Speed: Need ${reqs.speed}, Current ${player.speed}`);
      }

      if (missingReqs.length > 0) {
        const message = `Learning this art requires the following stats:\n\n${missingReqs.join('\n')}`;
        showWarning(message, 'Insufficient Stats');
        // Keep original logging (only log the first missing requirement)
        if (reqs.attack && player.attack < reqs.attack) {
          addLog(`Learning this art requires Attack ${reqs.attack}, but you have ${player.attack}.`, 'danger');
        } else if (reqs.defense && player.defense < reqs.defense) {
          addLog(`Learning this art requires Defense ${reqs.defense}, but you have ${player.defense}.`, 'danger');
        } else if (reqs.spirit && player.spirit < reqs.spirit) {
          addLog(`Learning this art requires Spirit ${reqs.spirit}, but you have ${player.spirit}.`, 'danger');
        } else if (reqs.physique && player.physique < reqs.physique) {
          addLog(`Learning this art requires Physique ${reqs.physique}, but you have ${player.physique}.`, 'danger');
        } else if (reqs.speed && player.speed < reqs.speed) {
          addLog(`Learning this art requires Speed ${reqs.speed}, but you have ${player.speed}.`, 'danger');
        }
        return;
      }
    }

    // Use functional update to ensure state consistency
    setPlayer((prev) => {
      // Check again to prevent double learning (double safety)
      if (prev.cultivationArts.includes(art.id)) {
        // If already learned, don't show warning (might be caused by rapid clicking)
        return prev;
      }

      // Check unlocked status again (prevent state out of sync)
      const unlockedArts = prev.unlockedArts || [];
      if (!unlockedArts.includes(art.id)) {
        // If locked, don't update state, but don't show error (state might be out of sync)
        return prev;
      }

      // Check spirit stones again (prevent state out of sync)
      if (prev.spiritStones < art.cost) {
        return prev;
      }

      // Check realm requirement again (prevent state out of sync)
      const getRealmIndex = (realm: RealmType) => REALM_ORDER.indexOf(realm);
      if (getRealmIndex(prev.realm) < getRealmIndex(art.realmRequirement)) {
        return prev;
      }

      // Check sect requirement again (prevent state out of sync)
      if (art.sectId !== null && art.sectId !== undefined) {
        if (prev.sectId !== art.sectId) {
          return prev;
        }
      }

      // Check attribute requirements again (prevent state out of sync)
      if (art.attributeRequirements) {
        const reqs = art.attributeRequirements;
        if (reqs.attack && prev.attack < reqs.attack) return prev;
        if (reqs.defense && prev.defense < reqs.defense) return prev;
        if (reqs.spirit && prev.spirit < reqs.spirit) return prev;
        if (reqs.physique && prev.physique < reqs.physique) return prev;
        if (reqs.speed && prev.speed < reqs.speed) return prev;
      }

      // All checks passed, execute learning
      const newStones = prev.spiritStones - art.cost;

      // Calculate spiritual root bonus
      const spiritualRootBonus = calculateSpiritualRootArtBonus(art, prev.spiritualRoots || {
        metal: 0,
        wood: 0,
        water: 0,
        fire: 0,
        earth: 0,
      });

      // Attribute bonus logic: Body arts permanently increase stats, Mental arts dynamically increase via activation
      let newAttack = prev.attack;
      let newDefense = prev.defense;
      let newMaxHp = prev.maxHp;
      let newHp = prev.hp;

      if (art.type === 'body') {
        newAttack += Math.floor((art.effects.attack || 0) * spiritualRootBonus);
        newDefense += Math.floor((art.effects.defense || 0) * spiritualRootBonus);
        newMaxHp += Math.floor((art.effects.hp || 0) * spiritualRootBonus);
        newHp += Math.floor((art.effects.hp || 0) * spiritualRootBonus);
      }

      // Ensure not adding duplicate (check again, prevent race condition)
      if (prev.cultivationArts.includes(art.id)) {
        return prev;
      }
      const newArts = [...prev.cultivationArts, art.id];

      let newActiveId = prev.activeArtId;
      if (!newActiveId && art.type === 'mental') {
        newActiveId = art.id;
      }

      return {
        ...prev,
        spiritStones: newStones,
        attack: newAttack,
        defense: newDefense,
        maxHp: newMaxHp,
        hp: newHp,
        cultivationArts: newArts,
        activeArtId: newActiveId,
      };
    });

    // Show spiritual root bonus info
    const spiritualRootBonus = calculateSpiritualRootArtBonus(art, player.spiritualRoots || {
      metal: 0,
      wood: 0,
      water: 0,
      fire: 0,
      earth: 0,
    });

    if (art.spiritualRoot && spiritualRootBonus > 1.0) {
      const rootNames: Record<string, string> = {
        metal: 'Metal',
        wood: 'Wood',
        water: 'Water',
        fire: 'Fire',
        earth: 'Earth',
      };
      const bonusPercent = Math.floor((spiritualRootBonus - 1.0) * 100);
      addLog(`You successfully learned [${art.name}]! Due to your ${rootNames[art.spiritualRoot]} Spirit Root, the effect is increased by ${bonusPercent}%!`, 'gain');
    } else {
      addLog(`You successfully learned [${art.name}]! Your power has increased.`, 'gain');
    }
  };

  const handleActivateArt = (art: CultivationArt) => {
    if (art.type !== 'mental') return;
    setPlayer((prev) => ({ ...prev, activeArtId: art.id }));
    addLog(`You started circulating the mental art [${art.name}].`, 'normal');
  };

  return {
    handleLearnArt,
    handleActivateArt,
  };
}
