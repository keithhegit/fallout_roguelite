import { TitleSetEffect } from '../types';
import { TITLES, TITLE_SET_EFFECTS } from '../constants/index';

/**
 * Calculate title effects (including set effects)
 * @param titleId Currently equipped title ID
 * @param unlockedTitles List of unlocked title IDs
 * @returns Title effects object
 */
export function calculateTitleEffects(
  titleId: string | null,
  unlockedTitles: string[]
): {
  attack: number;
  defense: number;
  hp: number;
  spirit: number;
  physique: number;
  speed: number;
  expRate: number;
  luck: number;
} {
  const effects = {
    attack: 0,
    defense: 0,
    hp: 0,
    spirit: 0,
    physique: 0,
    speed: 0,
    expRate: 0,
    luck: 0,
  };

  if (!titleId) return effects;

  // Base title effects
  const title = TITLES.find((t) => t.id === titleId);
  if (title) {
    effects.attack += title.effects.attack || 0;
    effects.defense += title.effects.defense || 0;
    effects.hp += title.effects.hp || 0;
    effects.spirit += title.effects.spirit || 0;
    effects.physique += title.effects.physique || 0;
    effects.speed += title.effects.speed || 0;
    effects.expRate += title.effects.expRate || 0;
    effects.luck += title.effects.luck || 0;
  }

  // Check set effects: If all titles in set are unlocked, and equipped title belongs to set, grant set bonus
  if (title?.setGroup) {
    for (const setEffect of TITLE_SET_EFFECTS) {
      // Check if equipped title is in set
      if (setEffect.titles.includes(titleId)) {
        // Check if all titles in set are unlocked
        const allUnlocked = setEffect.titles.every((tid) =>
          unlockedTitles.includes(tid)
        );
        if (allUnlocked) {
          // Apply set effects
          effects.attack += setEffect.effects.attack || 0;
          effects.defense += setEffect.effects.defense || 0;
          effects.hp += setEffect.effects.hp || 0;
          effects.spirit += setEffect.effects.spirit || 0;
          effects.physique += setEffect.effects.physique || 0;
          effects.speed += setEffect.effects.speed || 0;
          effects.expRate += setEffect.effects.expRate || 0;
          effects.luck += setEffect.effects.luck || 0;
        }
      }
    }
  }

  return effects;
}

/**
 * Get active set effects info
 * @param titleId Currently equipped title ID
 * @param unlockedTitles List of unlocked title IDs
 * @returns List of active set effects
 */
export function getActiveSetEffects(
  titleId: string | null,
  unlockedTitles: string[]
): TitleSetEffect[] {
  if (!titleId) return [];

  const title = TITLES.find((t) => t.id === titleId);
  if (!title?.setGroup) return [];

  const activeSets: TitleSetEffect[] = [];

  for (const setEffect of TITLE_SET_EFFECTS) {
    if (setEffect.titles.includes(titleId)) {
      const allUnlocked = setEffect.titles.every((tid) =>
        unlockedTitles.includes(tid)
      );
      if (allUnlocked) {
        activeSets.push(setEffect);
      }
    }
  }

  return activeSets;
}

