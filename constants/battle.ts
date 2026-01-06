/**
 * Battle System Constants
 */

import { BattleSkill, BattlePotion, ItemType } from '../types';

// Artifact Battle Skill Configuration
export const ARTIFACT_BATTLE_SKILLS: Record<string, BattleSkill[]> = {
  // Starlight Matrix - Defense and Attack Skills
  'lottery-artifact-legend-1': [
    {
      id: 'skill-star-shield',
      name: 'Star Shield',
      description: 'The Starlight Matrix deploys a protective field, significantly increasing defense.',
      type: 'defense',
      source: 'artifact',
      sourceId: 'lottery-artifact-legend-1',
      effects: [
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'star-shield',
            name: 'Star Shield',
            type: 'defense',
            value: 0.3, // 30% defense increase
            duration: 2,
            source: 'lottery-artifact-legend-1',
            description: 'Defense increased by 30% for 2 rounds',
          },
        },
      ],
      cost: { mana: 20 },
      cooldown: 0,
      maxCooldown: 3,
      target: 'self',
    },
    {
      id: 'skill-star-burst',
      name: 'Star Burst',
      description: 'The Starlight Matrix releases concentrated stellar energy, dealing magical damage.',
      type: 'attack',
      source: 'artifact',
      sourceId: 'lottery-artifact-legend-1',
      effects: [],
      cost: { mana: 40 },
      cooldown: 0,
      maxCooldown: 4,
      target: 'enemy',
      damage: {
        base: 30,
        multiplier: 1.2,
        type: 'magical',
        critChance: 0.15,
        critMultiplier: 2.0,
      },
    },
  ],
  // Primal Sphere - Powerful Skills
  'lottery-artifact-immortal-1': [
    {
      id: 'skill-immortal-blessing',
      name: 'Primal Blessing',
      description: 'The Primal Sphere releases a pulse of biological energy, boosting all attributes.',
      type: 'buff',
      source: 'artifact',
      sourceId: 'lottery-artifact-immortal-1',
      effects: [
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'immortal-attack',
            name: 'Primal Surge (Attack)',
            type: 'attack',
            value: 0.25, // 25% attack increase
            duration: 3,
            source: 'lottery-artifact-immortal-1',
            description: 'Attack increased by 25% for 3 rounds',
          },
        },
        {
          type: 'buff',
          target: 'self',
          buff: {
            id: 'immortal-defense',
            name: 'Primal Surge (Defense)',
            type: 'defense',
            value: 0.25, // 25% defense increase
            duration: 3,
            source: 'lottery-artifact-immortal-1',
            description: 'Defense increased by 25% for 3 rounds',
          },
        },
      ],
      cost: { mana: 50 },
      cooldown: 0,
      maxCooldown: 5,
      target: 'self',
    },
  ],
};

// Weapon Battle Skill Configuration
export const WEAPON_BATTLE_SKILLS: Record<string, BattleSkill[]> = {
  // Apex Sword - Blade Dance Skills
  'weapon-apex-sword': [
    {
      id: 'skill-sword-dance',
      name: 'Blade Dance',
      description: 'Perform a lethal dance with your blade, striking multiple times.',
      type: 'attack',
      source: 'weapon',
      sourceId: 'weapon-apex-sword',
      effects: [],
      cost: { mana: 25 },
      cooldown: 0,
      maxCooldown: 2,
      target: 'enemy',
      damage: {
        base: 40,
        multiplier: 1.3,
        type: 'physical',
        critChance: 0.2,
        critMultiplier: 2.0,
      },
    },
  ],
  // Starlight Blade - Starlight Cut
  'weapon-starlight-blade': [
    {
      id: 'skill-star-slash',
      name: 'Starlight Cut',
      description: 'Channel stellar radiation into your blade for a devastating strike.',
      type: 'attack',
      source: 'weapon',
      sourceId: 'weapon-starlight-blade',
      effects: [],
      cost: { mana: 30 },
      cooldown: 0,
      maxCooldown: 3,
      target: 'enemy',
      damage: {
        base: 60,
        multiplier: 1.5,
        type: 'physical',
        critChance: 0.25,
        critMultiplier: 2.2,
      },
    },
  ],
};

// Combat Potion Configuration
export const BATTLE_POTIONS: Record<string, BattlePotion> = {
  'Heal Shot': {
    itemId: 'potion-heal-basic',
    name: 'Heal Shot',
    type: 'heal',
    effect: {
      heal: 50,
    },
    cooldown: 0,
    itemType: ItemType.Pill,
  },
  'Super Heal Shot': {
    itemId: 'potion-heal-advanced',
    name: 'Super Heal Shot',
    type: 'heal',
    effect: {
      heal: 200,
    },
    cooldown: 0,
    itemType: ItemType.Pill,
  },
  'Hardening Shot': {
    itemId: 'potion-strength',
    name: 'Hardening Shot',
    type: 'buff',
    effect: {
      buffs: [
        {
          id: 'strength-boost',
          name: 'Hardened State',
          type: 'attack',
          value: 50, // Attack +50
          duration: 3,
          source: 'Hardening Shot',
          description: 'Attack increased by 50 for 3 rounds',
        },
      ],
    },
    cooldown: 5,
    itemType: ItemType.Pill,
  },
  'Clarity Shot': {
    itemId: 'potion-spirit',
    name: 'Clarity Shot',
    type: 'buff',
    effect: {
      buffs: [
        {
          id: 'spirit-boost',
          name: 'Clear Focus',
          type: 'custom',
          value: 30, // Perception +30
          duration: 3,
          source: 'Clarity Shot',
          description: 'Perception increased by 30 for 3 rounds',
        },
      ],
    },
    cooldown: 5,
    itemType: ItemType.Pill,
  },
};
