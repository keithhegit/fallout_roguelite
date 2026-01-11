import { PlayerStats, CultivationArt } from '../types';
import { CULTIVATION_ARTS, TALENTS, TITLES, calculateSpiritualRootArtBonus } from '../constants/index';
import { getGoldenCoreBonusMultiplier } from './cultivationUtils';
import { getItemStats } from './itemUtils';

/**
 * Calculate all fixed value bonuses for player (Arts, Equipment, Talents, Titles)
 * These bonuses are usually reflected directly in base values like player.attack
 */
export function calculatePlayerBonuses(player: PlayerStats): {
  attack: number;
  defense: number;
  hp: number;
  spirit: number;
  physique: number;
  speed: number;
} {
  let bonusAttack = 0;
  let bonusDefense = 0;
  let bonusHp = 0;
  let bonusSpirit = 0;
  let bonusPhysique = 0;
  let bonusSpeed = 0;

  // 1. Art Bonuses (Fixed bonuses from all learned arts)
  const spiritualRoots = player.spiritualRoots || {
    metal: 0, wood: 0, water: 0, fire: 0, earth: 0,
  };

  player.cultivationArts.forEach((artId) => {
    const art = CULTIVATION_ARTS.find((a) => a.id === artId);
    if (art) {
      const spiritualRootBonus = calculateSpiritualRootArtBonus(art, spiritualRoots);
      bonusAttack += Math.floor((art.effects.attack || 0) * spiritualRootBonus);
      bonusDefense += Math.floor((art.effects.defense || 0) * spiritualRootBonus);
      bonusHp += Math.floor((art.effects.hp || 0) * spiritualRootBonus);
      bonusSpirit += Math.floor((art.effects.spirit || 0) * spiritualRootBonus);
      bonusPhysique += Math.floor((art.effects.physique || 0) * spiritualRootBonus);
      bonusSpeed += Math.floor((art.effects.speed || 0) * spiritualRootBonus);
    }
  });

  // 2. Equipment Bonuses
  Object.values(player.equippedItems).forEach((itemId) => {
    const equippedItem = player.inventory.find((i) => i.id === itemId);
    if (equippedItem && equippedItem.effect) {
      const isNatal = equippedItem.id === player.natalArtifactId;
      const itemStats = getItemStats(equippedItem, isNatal);
      bonusAttack += itemStats.attack;
      bonusDefense += itemStats.defense;
      bonusHp += itemStats.hp;
      bonusSpirit += itemStats.spirit;
      bonusPhysique += itemStats.physique;
      bonusSpeed += itemStats.speed;
    }
  });

  // 3. Talent Bonuses
  const talent = TALENTS.find((t) => t.id === player.talentId);
  if (talent) {
    bonusAttack += talent.effects.attack || 0;
    bonusDefense += talent.effects.defense || 0;
    bonusHp += talent.effects.hp || 0;
    bonusSpirit += talent.effects.spirit || 0;
    bonusPhysique += talent.effects.physique || 0;
    bonusSpeed += talent.effects.speed || 0;
  }

  // 4. Title Bonuses
  const title = TITLES.find((t) => t.id === player.titleId);
  if (title) {
    bonusAttack += title.effects.attack || 0;
    bonusDefense += title.effects.defense || 0;
    bonusHp += title.effects.hp || 0;
    bonusSpirit += title.effects.spirit || 0;
    bonusPhysique += title.effects.physique || 0;
    bonusSpeed += title.effects.speed || 0;
  }

  return {
    attack: bonusAttack,
    defense: bonusDefense,
    hp: bonusHp,
    spirit: bonusSpirit,
    physique: bonusPhysique,
    speed: bonusSpeed,
  };
}

/**
 * Get active mental art of player
 */
export function getActiveMentalArt(player: PlayerStats): CultivationArt | null {
  if (!player.activeArtId) return null;

  // Find in cultivation arts
  const art = CULTIVATION_ARTS.find((a) => a.id === player.activeArtId);
  return art || null;
}

/**
 * Calculate player total stats (Base + Equipment + Arts + Titles + Talents)
 * Note: In current implementation, Equipment, Titles, Talents, and Physical Arts are permanently added to player.attack etc.
 * This mainly adds bonuses from [Active Mental Art]
 */
export const getPlayerTotalStats = (player: PlayerStats): {
  attack: number;
  defense: number;
  maxHp: number;
  spirit: number;
  physique: number;
  speed: number;
} => {
  const stats = {
    attack: player.attack,
    defense: player.defense,
    maxHp: player.maxHp,
    spirit: player.spirit,
    physique: player.physique,
    speed: player.speed,
  };

  // 1. Get active mental art
  const activeArt = getActiveMentalArt(player);

  if (activeArt && activeArt.type === 'mental') {
    const effects = activeArt.effects;

    // Calculate spiritual root bonus for art
    const spiritualRoots = player.spiritualRoots || {
      metal: 0,
      wood: 0,
      water: 0,
      fire: 0,
      earth: 0,
    };
    const spiritualRootBonus = calculateSpiritualRootArtBonus(activeArt, spiritualRoots);

    // Add fixed value bonuses (apply spiritual root bonus)
    stats.attack += Math.floor((effects.attack || 0) * spiritualRootBonus);
    stats.defense += Math.floor((effects.defense || 0) * spiritualRootBonus);
    stats.maxHp += Math.floor((effects.hp || 0) * spiritualRootBonus);
    stats.spirit += Math.floor((effects.spirit || 0) * spiritualRootBonus);
    stats.physique += Math.floor((effects.physique || 0) * spiritualRootBonus);
    stats.speed += Math.floor((effects.speed || 0) * spiritualRootBonus);

    // Add percentage bonuses (if any)
    // Note: Percentage bonuses are usually based on current stats (Base + Equipment etc.)
    if (effects.attackPercent) stats.attack = Math.floor(stats.attack * (1 + effects.attackPercent));
    if (effects.defensePercent) stats.defense = Math.floor(stats.defense * (1 + effects.defensePercent));
    if (effects.hpPercent) stats.maxHp = Math.floor(stats.maxHp * (1 + effects.hpPercent));
    if (effects.spiritPercent) stats.spirit = Math.floor(stats.spirit * (1 + effects.spiritPercent));
    if (effects.physiquePercent) stats.physique = Math.floor(stats.physique * (1 + effects.physiquePercent));
    if (effects.speedPercent) stats.speed = Math.floor(stats.speed * (1 + effects.speedPercent));
  }

  // 2. Apply Golden Core Method bonuses (if player is Golden Core or above and has method)
  if (player.goldenCoreMethodCount && player.goldenCoreMethodCount > 0) {
    const bonusMultiplier = getGoldenCoreBonusMultiplier(player.goldenCoreMethodCount);
    // Apply stat bonus multiplier (e.g. 3.6x means stats increase to 3.6 times original, i.e. +260%)
    stats.attack = Math.floor(stats.attack * bonusMultiplier);
    stats.defense = Math.floor(stats.defense * bonusMultiplier);
    stats.maxHp = Math.floor(stats.maxHp * bonusMultiplier);
    stats.spirit = Math.floor(stats.spirit * bonusMultiplier);
    stats.physique = Math.floor(stats.physique * bonusMultiplier);
    stats.speed = Math.floor(stats.speed * bonusMultiplier);
  }

  return stats;
}

