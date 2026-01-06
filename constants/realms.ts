/**
 * Survival Tier System Constants
 * Contains tier order, data, and other configurations.
 */

import { RealmType } from '../types';

export const REALM_ORDER = [
  RealmType.QiRefining,
  RealmType.Foundation,
  RealmType.GoldenCore,
  RealmType.NascentSoul,
  RealmType.SpiritSevering,
  RealmType.DaoCombining,
  RealmType.LongevityRealm,
];

export const REALM_DATA: Record<
  RealmType,
  {
    baseMaxHp: number;
    baseAttack: number;
    baseDefense: number;
    baseSpirit: number; // Perception
    basePhysique: number; // Endurance
    baseSpeed: number; // Agility
    maxExpBase: number;
    baseMaxLifespan: number; // Base Max Survival Days
  }
> = {
  [RealmType.QiRefining]: {
    baseMaxHp: 100,
    baseAttack: 10,
    baseDefense: 5,
    baseSpirit: 5,
    basePhysique: 10,
    baseSpeed: 10,
    maxExpBase: 250, // 5x growth for smoother progression
    baseMaxLifespan: 120, // Scavenger: 120 days
  },
  [RealmType.Foundation]: {
    baseMaxHp: 500,
    baseAttack: 50,
    baseDefense: 25,
    baseSpirit: 25,
    basePhysique: 50,
    baseSpeed: 30,
    maxExpBase: 1250, // 5x growth for smoother progression
    baseMaxLifespan: 300, // Survivor: 300 days
  },
  [RealmType.GoldenCore]: {
    baseMaxHp: 2500,
    baseAttack: 200,
    baseDefense: 100,
    baseSpirit: 100,
    basePhysique: 200,
    baseSpeed: 50,
    maxExpBase: 6250, // 5x growth for smoother progression
    baseMaxLifespan: 800, // Raider: 800 days
  },
  [RealmType.NascentSoul]: {
    baseMaxHp: 10000,
    baseAttack: 1000,
    baseDefense: 500,
    baseSpirit: 500,
    basePhysique: 1000,
    baseSpeed: 100,
    maxExpBase: 31250, // 5x growth for smoother progression
    baseMaxLifespan: 2000, // Mercenary: 2000 days
  },
  [RealmType.SpiritSevering]: {
    baseMaxHp: 50000,
    baseAttack: 5000,
    baseDefense: 2500,
    baseSpirit: 2500,
    basePhysique: 5000,
    baseSpeed: 800,
    maxExpBase: 156250,
    baseMaxLifespan: 5000, // Commander: 5000 days
  },
  [RealmType.DaoCombining]: {
    baseMaxHp: 250000,
    baseAttack: 25000,
    baseDefense: 12500,
    baseSpirit: 12500,
    basePhysique: 25000,
    baseSpeed: 4000,
    maxExpBase: 781250,
    baseMaxLifespan: 12500, // Wasteland Legend: 12500 days
  },
  [RealmType.LongevityRealm]: {
    baseMaxHp: 1250000,
    baseAttack: 125000,
    baseDefense: 62500,
    baseSpirit: 62500,
    basePhysique: 125000,
    baseSpeed: 20000,
    maxExpBase: 3906250,
    baseMaxLifespan: 31250, // Vault Overseer: 31250 days
  },
};
