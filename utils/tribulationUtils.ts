import { PlayerStats, TribulationState, TribulationResult } from '../types';
import {
  TRIBULATION_CONFIG,
  calculateTribulationDeathProbability,
  calculateEquipmentQualityScore,
  REALM_ORDER,
} from '../constants/index';
import { getPlayerTotalStats } from './statUtils';
import { checkBreakthroughConditions } from './cultivationUtils';

/**
 * Check if Tribulation should be triggered
 * @param player Player data
 * @returns Whether Tribulation should be triggered
 */
export const shouldTriggerTribulation = (player: PlayerStats): boolean => {
  // Check if EXP is full
  if (player.exp < player.maxExp) {
    return false;
  }

  // Only trigger tribulation when upgrading Realm (realmLevel >= 9)
  // No tribulation for layer upgrade (realmLevel < 9)
  if (player.realmLevel < 9) {
    return false;
  }

  // Calculate target realm for Realm Upgrade
  const currentIndex = REALM_ORDER.indexOf(player.realm);
  if (currentIndex >= REALM_ORDER.length - 1) {
    // Already max realm, cannot breakthrough further
    return false;
  }

  const targetRealm = REALM_ORDER[currentIndex + 1];

  // Check if target realm requires tribulation
  const config = TRIBULATION_CONFIG[targetRealm];
  if (!config.requiresTribulation) {
    return false;
  }

  // Check breakthrough conditions (all realms need check)
  const conditionCheck = checkBreakthroughConditions(player, targetRealm);
  if (!conditionCheck.canBreakthrough) {
    // Conditions not met, do not trigger tribulation
    return false;
  }

  return true;
};

/**
 * Create Tribulation State
 * @param player Player data
 * @param targetRealm Target Realm
 * @returns Tribulation State
 */
export const createTribulationState = (
  player: PlayerStats,
  targetRealm: typeof player.realm
): TribulationState => {
  const config = TRIBULATION_CONFIG[targetRealm];

  // Get player total stats
  const totalStats = getPlayerTotalStats(player);

  // Calculate equipment quality score
  const equipmentQualityScore = calculateEquipmentQualityScore(
    player.equippedItems,
    player.inventory
  );

  // Check if Natal Artifact exists
  const hasNatalArtifact = player.natalArtifactId !== null &&
    Object.values(player.equippedItems).includes(player.natalArtifactId);

  // Calculate death probability
  const deathProbability = calculateTribulationDeathProbability(
    targetRealm,
    totalStats,
    equipmentQualityScore,
    hasNatalArtifact
  );

  // Calculate attribute bonus (Reduction of death probability by total stats)
  const attributeBonus = Math.min(
    (totalStats.attack + totalStats.defense + totalStats.spirit +
     totalStats.physique + totalStats.speed + totalStats.maxHp / 10) / 6 / 500 * 0.01,
    0.20
  );

  return {
    isOpen: true,
    targetRealm,
    tribulationLevel: config.tribulationLevel!,
    stage: 'Pending',
    deathProbability,
    attributeBonus,
    equipmentBonus: equipmentQualityScore,
    totalStats,
    equipmentQualityScore,
    isCleared: false,
  };
};

/**
 * Execute Tribulation
 * @param tribulationState Tribulation State
 * @returns Tribulation Result
 */
export const executeTribulation = (
  tribulationState: TribulationState
): TribulationResult => {
  const { deathProbability } = tribulationState;
  const roll = Math.random();
  const success = roll > deathProbability;

  let description = '';
  let hpLoss = 0;

  if (success) {
    // Tribulation Success
    const hpLossPercent = Math.random() * 0.3 + 0.1; // Lose 10%-40% HP
    hpLoss = Math.floor(tribulationState.totalStats.maxHp * hpLossPercent);

    if (deathProbability < 0.2) {
      description = 'The radiation surge was trivial. You weathered the storm without a scratch!';
    } else if (deathProbability < 0.4) {
      description = 'You gritted your teeth and endured. Though wounded, you survived the tribulation!';
    } else if (deathProbability < 0.6) {
      description = 'The tribulation was perilous. You narrowly escaped death!';
    } else {
      description = 'Teetering on the brink of death, you survived the lethal strike by sheer luck!';
    }
  } else {
    // Tribulation Failed
    if (deathProbability < 0.3) {
      description = 'The tribulation was too strong. Despite your resistance, you were struck down...';
    } else if (deathProbability < 0.5) {
      description = 'The thunder was too fierce. Your body destroyed, your spirit shattered...';
    } else if (deathProbability < 0.7) {
      description = 'The might of heaven cannot be stopped. You turned to dust under the tribulation...';
    } else {
      description = 'A peerless catastrophe descended. Helpless, you perished on the spot...';
    }
  }

  return {
    success,
    deathProbability,
    roll,
    hpLoss,
    description,
  };
};

/**
 * Get Tribulation Description Text
 * @param tribulationLevel Tribulation Level
 * @param deathProbability Death Probability
 * @returns Description Text
 */
export const getTribulationDescription = (
  tribulationLevel: string,
  deathProbability: number
): string => {
  let riskLevel = '';
  if (deathProbability < 0.2) {
    riskLevel = 'Low Risk';
  } else if (deathProbability < 0.4) {
    riskLevel = 'Medium Risk';
  } else if (deathProbability < 0.6) {
    riskLevel = 'High Risk';
  } else if (deathProbability < 0.8) {
    riskLevel = 'Extreme Risk';
  } else {
    riskLevel = 'Suicidal';
  }

  return `Approaching ${tribulationLevel}. ${riskLevel}. Lethality Probability: ${(deathProbability * 100).toFixed(1)}%`;
};

/**
 * Format Attribute Bonus Display
 * @param attributeBonus Attribute Bonus Value
 * @returns Formatted String
 */
export const formatAttributeBonus = (attributeBonus: number): string => {
  return `-${(attributeBonus * 100).toFixed(1)}%`;
};

/**
 * Format Equipment Bonus Display
 * @param equipmentBonus Equipment Bonus Value
 * @returns Formatted String
 */
export const formatEquipmentBonus = (equipmentBonus: number): string => {
  return `-${(equipmentBonus * 100).toFixed(1)}%`;
};
