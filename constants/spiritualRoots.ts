import { CultivationArt } from '../types';

export type SpiritualRootType = 'metal' | 'wood' | 'water' | 'fire' | 'earth';

// Genetic Aptitude Names
export const SPIRITUAL_ROOT_NAMES: Record<SpiritualRootType, string> = {
  metal: 'Strength',
  wood: 'Vitality',
  water: 'Perception',
  fire: 'Reflexes',
  earth: 'Hardiness',
};

// Impact of Genetic Aptitude on learning speed (each point adds 0.1% to learning speed)
export const SPIRITUAL_ROOT_EXP_MULTIPLIER = 0.001; // Each aptitude point adds 0.1% learning speed

// Impact of Genetic Aptitude on survival tier breakthrough success rate (each point adds 0.05% success rate)
export const SPIRITUAL_ROOT_BREAKTHROUGH_BONUS = 0.0005; // Each aptitude point adds 0.05% success rate

// Impact of Genetic Aptitude on survival attributes (each point adds 0.1% to corresponding attribute)
export const SPIRITUAL_ROOT_ATTRIBUTE_MULTIPLIER = 0.001; // Each aptitude point adds 0.1% attribute boost

// Genetic Aptitude attribute mapping (Different aptitudes influence different physical stats)
export const SPIRITUAL_ROOT_ATTRIBUTE_MAP: Record<
  SpiritualRootType,
  {
    attack?: number; // Attack bonus ratio
    defense?: number; // Defense bonus ratio
    spirit?: number; // Perception (Mental) bonus ratio
    physique?: number; // Endurance (Physical) bonus ratio
    speed?: number; // Agility bonus ratio
    maxHp?: number; // Max HP bonus ratio (Vitality aptitude uses this)
  }
> = {
  metal: { attack: 0.002, defense: 0.001 }, // Strength: Attack +0.2%/point, Defense +0.1%/point
  wood: { maxHp: 0.002, physique: 0.001 }, // Vitality: Max HP +0.2%/point, Endurance +0.1%/point
  water: { spirit: 0.002, defense: 0.001 }, // Perception: Perception +0.2%/point, Defense +0.1%/point
  fire: { attack: 0.002, speed: 0.001 }, // Reflexes: Attack +0.2%/point, Agility +0.1%/point
  earth: { defense: 0.002, physique: 0.001 }, // Hardiness: Defense +0.2%/point, Endurance +0.1%/point
};

// Calculate total genetic aptitude level
export const calculateTotalSpiritualRootLevel = (spiritualRoots: {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}): number => {
  return (
    spiritualRoots.metal +
    spiritualRoots.wood +
    spiritualRoots.water +
    spiritualRoots.fire +
    spiritualRoots.earth
  );
};

// Calculate learning speed bonus from genetic aptitude
export const calculateSpiritualRootExpBonus = (spiritualRoots: {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}): number => {
  const totalLevel = calculateTotalSpiritualRootLevel(spiritualRoots);
  return 1 + totalLevel * SPIRITUAL_ROOT_EXP_MULTIPLIER;
};

// Calculate breakthrough success rate bonus from genetic aptitude
export const calculateSpiritualRootBreakthroughBonus = (spiritualRoots: {
  metal: number;
  wood: number;
  water: number;
  fire: number;
  earth: number;
}): number => {
  const totalLevel = calculateTotalSpiritualRootLevel(spiritualRoots);
  return totalLevel * SPIRITUAL_ROOT_BREAKTHROUGH_BONUS;
};

// Calculate cultivation art effectiveness bonus from genetic aptitude (each point adds 0.5% effect)
export const calculateSpiritualRootArtBonus = (
  art: CultivationArt,
  spiritualRoots: {
    metal: number;
    wood: number;
    water: number;
    fire: number;
    earth: number;
  }
): number => {
  if (!art.spiritualRoot) return 1.0; // Skills without corresponding genetic aptitude don't get a bonus

  const rootLevel = spiritualRoots[art.spiritualRoot] || 0;
  // Each aptitude point adds 0.5% effect, max 50% bonus (at 100 points)
  return 1.0 + (rootLevel * 0.005);
};
