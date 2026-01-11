/**
 * Save Manager Utility Functions
 * Supports multiple save slots, backups, and comparison
 */

import { PlayerStats, LogEntry } from '../types';
import {
  SAVE_SLOT_KEYS,
  getSlotKey as getSlotKeyConstant,
  getBackupKey as getBackupKeyConstant,
} from '../constants/storageKeys';

/**
 * Ensure player data compatibility, fill missing fields
 */
export const ensurePlayerStatsCompatibility = (loadedPlayer: any): PlayerStats => {
  return {
    ...loadedPlayer,
    dailyTaskCount:
      loadedPlayer.dailyTaskCount &&
      typeof loadedPlayer.dailyTaskCount === 'object' &&
      !('instant' in loadedPlayer.dailyTaskCount)
        ? loadedPlayer.dailyTaskCount
        : {},
    lastTaskResetDate:
      loadedPlayer.lastTaskResetDate ||
      new Date().toISOString().split('T')[0],
    viewedAchievements: loadedPlayer.viewedAchievements || [],
    natalArtifactId: loadedPlayer.natalArtifactId || null,
    unlockedRecipes: loadedPlayer.unlockedRecipes || [],
    unlockedArts: loadedPlayer.unlockedArts || loadedPlayer.cultivationArts || [],
    sectTreasureVault: loadedPlayer.sectTreasureVault || undefined,
    meditationHpRegenMultiplier:
      loadedPlayer.meditationHpRegenMultiplier ?? 1.0,
    meditationBoostEndTime:
      loadedPlayer.meditationBoostEndTime ?? null,
    playTime: loadedPlayer.playTime ?? 0,
    statistics: loadedPlayer.statistics || {
      killCount: 0,
      meditateCount: 0,
      adventureCount: 0,
      equipCount: 0,
      petCount: 0,
      recipeCount: loadedPlayer.unlockedRecipes?.length || 0,
      artCount: loadedPlayer.cultivationArts?.length || 0,
      breakthroughCount: 0,
      secretRealmCount: 0,
    },
    lifespan: loadedPlayer.lifespan ?? loadedPlayer.maxLifespan ?? 100,
    maxLifespan: loadedPlayer.maxLifespan ?? 100,
    spiritualRoots: loadedPlayer.spiritualRoots || {
      metal: Math.floor(Math.random() * 16),
      wood: Math.floor(Math.random() * 16),
      water: Math.floor(Math.random() * 16),
      fire: Math.floor(Math.random() * 16),
      earth: Math.floor(Math.random() * 16),
    },
    unlockedTitles: loadedPlayer.unlockedTitles || (loadedPlayer.titleId ? [loadedPlayer.titleId] : ['title-novice']),
    reputation: loadedPlayer.reputation || 0,
    // Sect Hunt System
    betrayedSects: loadedPlayer.betrayedSects || [],
    sectHuntEndTime: loadedPlayer.sectHuntEndTime || null,
    sectHuntLevel: loadedPlayer.sectHuntLevel || 0,
    sectHuntSectId: loadedPlayer.sectHuntSectId || null,
    sectHuntSectName: loadedPlayer.sectHuntSectName || null,
    grotto: loadedPlayer.grotto ? {
      ...loadedPlayer.grotto,
      autoHarvest: loadedPlayer.grotto.autoHarvest ?? false,
      growthSpeedBonus: loadedPlayer.grotto.growthSpeedBonus ?? 0,
      spiritArrayEnhancement: loadedPlayer.grotto.spiritArrayEnhancement || 0,
      herbarium: loadedPlayer.grotto.herbarium || [],
      dailySpeedupCount: loadedPlayer.grotto.dailySpeedupCount || 0,
      lastSpeedupResetDate: loadedPlayer.grotto.lastSpeedupResetDate || new Date().toISOString().split('T')[0],
      plantedHerbs: (loadedPlayer.grotto.plantedHerbs || []).map((herb: any) => ({
        ...herb,
        isMutated: herb.isMutated || false,
        mutationBonus: herb.mutationBonus || undefined,
      })),
    } : {
      level: 0,
      expRateBonus: 0,
      autoHarvest: false,
      growthSpeedBonus: 0,
      plantedHerbs: [],
      lastHarvestTime: null,
      spiritArrayEnhancement: 0,
      herbarium: [],
      dailySpeedupCount: 0,
      lastSpeedupResetDate: new Date().toISOString().split('T')[0],
    },
  };
};

export interface SaveSlot {
  id: number; // Save Slot ID (1-10)
  name: string; // Save Name (User Defined)
  playerName: string; // Player Name
  realm: string; // Realm
  realmLevel: number; // Realm Level
  timestamp: number; // Save Timestamp
  data: SaveData | null; // Save Data (null indicates empty slot)
}

export interface SaveData {
  player: PlayerStats;
  logs: LogEntry[];
  timestamp: number;
}

/**
 * Get localStorage key for save slot
 */
const getSlotKey = (slotId: number): string => {
  return getSlotKeyConstant(slotId);
};

/**
 * Get localStorage key for backup
 */
const getBackupKey = (slotId: number, backupIndex: number): string => {
  return getBackupKeyConstant(slotId, backupIndex);
};

/**
 * Get current save slot ID
 */
export const getCurrentSlotId = (): number => {
  try {
    const slotId = localStorage.getItem(SAVE_SLOT_KEYS.CURRENT_SLOT);
    return slotId ? parseInt(slotId, 10) : 1; // Default to slot 1
  } catch {
    return 1;
  }
};

/**
 * Set current save slot ID
 */
export const setCurrentSlotId = (slotId: number): void => {
  try {
    localStorage.setItem(SAVE_SLOT_KEYS.CURRENT_SLOT, slotId.toString());
  } catch (error) {
    console.error('Failed to set current save slot:', error);
  }
};

/**
 * Save to specific slot
 */
export const saveToSlot = (
  slotId: number,
  player: PlayerStats,
  logs: LogEntry[],
  slotName?: string
): boolean => {
  try {
    if (slotId < 1 || slotId > SAVE_SLOT_KEYS.MAX_SLOTS) {
      console.error(`Save slot ID must be between 1-${SAVE_SLOT_KEYS.MAX_SLOTS}`);
      return false;
    }

    const saveData: SaveData = {
      player,
      logs,
      timestamp: Date.now(),
    };

    const slotKey = getSlotKey(slotId);
    localStorage.setItem(slotKey, JSON.stringify(saveData));

    // Update current slot
    setCurrentSlotId(slotId);

    // Automatically create backup
    createBackup(slotId, saveData);

    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    return false;
  }
};

/**
 * Load from specific slot
 */
export const loadFromSlot = (slotId: number): SaveData | null => {
  try {
    if (slotId < 1 || slotId > SAVE_SLOT_KEYS.MAX_SLOTS) {
      console.error(`Save slot ID must be between 1-${SAVE_SLOT_KEYS.MAX_SLOTS}`);
      return null;
    }

    const slotKey = getSlotKey(slotId);
    const saved = localStorage.getItem(slotKey);

    if (!saved) {
      return null;
    }

    const saveData: SaveData = JSON.parse(saved);
    setCurrentSlotId(slotId);
    return saveData;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
};

/**
 * Get all save slots info
 */
export const getAllSlots = (): SaveSlot[] => {
  const slots: SaveSlot[] = [];

  for (let i = 1; i <= SAVE_SLOT_KEYS.MAX_SLOTS; i++) {
    const slotKey = getSlotKey(i);
    const saved = localStorage.getItem(slotKey);

    if (saved) {
      try {
        const saveData: SaveData = JSON.parse(saved);
        slots.push({
          id: i,
          name: `Save ${i}`, // Default name, can be extended to support custom names
          playerName: saveData.player.name || 'Unknown',
          realm: saveData.player.realm || 'Unknown',
          realmLevel: saveData.player.realmLevel || 1,
          timestamp: saveData.timestamp || Date.now(),
          data: saveData,
        });
      } catch (error) {
        console.error(`Failed to parse save slot ${i}:`, error);
      }
    } else {
      // Empty Slot
      slots.push({
        id: i,
        name: `Save ${i}`,
        playerName: '',
        realm: '',
        realmLevel: 0,
        timestamp: 0,
        data: null,
      });
    }
  }

  return slots;
};

/**
 * Delete specific slot save
 */
export const deleteSlot = (slotId: number): boolean => {
  try {
    if (slotId < 1 || slotId > SAVE_SLOT_KEYS.MAX_SLOTS) {
      return false;
    }

    const slotKey = getSlotKey(slotId);
    localStorage.removeItem(slotKey);

    // Delete all backups for this slot
    for (let i = 0; i < SAVE_SLOT_KEYS.MAX_BACKUPS; i++) {
      const backupKey = getBackupKey(slotId, i);
      localStorage.removeItem(backupKey);
    }

    return true;
  } catch (error) {
    console.error('Failed to delete save:', error);
    return false;
  }
};

/**
 * Clear all save slots (including all slots and backups)
 * Used to clear all saves on death in Hard Mode
 */
export const clearAllSlots = (): void => {
  try {
    // Clear all save slots
    for (let i = 1; i <= SAVE_SLOT_KEYS.MAX_SLOTS; i++) {
      const slotKey = getSlotKey(i);
      localStorage.removeItem(slotKey);

      // Clear all backups for this slot
      for (let j = 0; j < SAVE_SLOT_KEYS.MAX_BACKUPS; j++) {
        const backupKey = getBackupKey(i, j);
        localStorage.removeItem(backupKey);
      }
    }

    // Clear current slot flag (optional, as it will default to 1 next time)
    localStorage.removeItem(SAVE_SLOT_KEYS.CURRENT_SLOT);
  } catch (error) {
    console.error('Failed to clear all saves:', error);
  }
};

/**
 * Create Backup
 */
export const createBackup = (slotId: number, saveData?: SaveData): boolean => {
  try {
    if (slotId < 1 || slotId > SAVE_SLOT_KEYS.MAX_SLOTS) {
      return false;
    }

    // If no data provided, load from current slot
    if (!saveData) {
      saveData = loadFromSlot(slotId);
      if (!saveData) {
        return false;
      }
    }

    // Get existing backup list
    const backups = getBackups(slotId);

    // Add new backup
    backups.unshift({
      ...saveData,
      timestamp: Date.now(),
    });

    // Keep only the latest MAX_BACKUPS backups
    const backupsToKeep = backups.slice(0, SAVE_SLOT_KEYS.MAX_BACKUPS);

    // Save backup
    backupsToKeep.forEach((backup, index) => {
      const backupKey = getBackupKey(slotId, index);
      localStorage.setItem(backupKey, JSON.stringify(backup));
    });

    // Delete excess backups
    for (let i = SAVE_SLOT_KEYS.MAX_BACKUPS; i < backups.length; i++) {
      const backupKey = getBackupKey(slotId, i);
      localStorage.removeItem(backupKey);
    }

    return true;
  } catch (error) {
    console.error('Failed to create backup:', error);
    return false;
  }
};

/**
 * Get all backups for specific slot
 */
export const getBackups = (slotId: number): SaveData[] => {
  const backups: SaveData[] = [];

  for (let i = 0; i < SAVE_SLOT_KEYS.MAX_BACKUPS; i++) {
    const backupKey = getBackupKey(slotId, i);
    const saved = localStorage.getItem(backupKey);

    if (saved) {
      try {
        const backup: SaveData = JSON.parse(saved);
        backups.push(backup);
      } catch (error) {
        console.error(`Failed to parse backup ${i}:`, error);
      }
    }
  }

  return backups;
};

/**
 * Restore save from backup
 */
export const restoreFromBackup = (
  slotId: number,
  backupIndex: number
): boolean => {
  try {
    const backupKey = getBackupKey(slotId, backupIndex);
    const saved = localStorage.getItem(backupKey);

    if (!saved) {
      return false;
    }

    const backup: SaveData = JSON.parse(saved);
    return saveToSlot(slotId, backup.player, backup.logs);
  } catch (error) {
    console.error('Failed to restore backup:', error);
    return false;
  }
};

/**
 * Compare differences between two saves
 */
export interface SaveComparison {
  playerName: { old: string; new: string };
  realm: { old: string; new: string };
  realmLevel: { old: number; new: number };
  exp: { old: number; new: number };
  maxExp: { old: number; new: number };
  hp: { old: number; new: number };
  maxHp: { old: number; new: number };
  attack: { old: number; new: number };
  defense: { old: number; new: number };
  spirit: { old: number; new: number };
  physique: { old: number; new: number };
  speed: { old: number; new: number };
  spiritStones: { old: number; new: number };
  inventoryCount: { old: number; new: number };
  equipmentCount: { old: number; new: number };
  timestamp: { old: number; new: number };
}

export const compareSaves = (
  save1: SaveData,
  save2: SaveData
): SaveComparison => {
  const p1 = save1.player;
  const p2 = save2.player;

  return {
    playerName: { old: p1.name, new: p2.name },
    realm: { old: p1.realm, new: p2.realm },
    realmLevel: { old: p1.realmLevel, new: p2.realmLevel },
    exp: { old: p1.exp, new: p2.exp },
    maxExp: { old: p1.maxExp, new: p2.maxExp },
    hp: { old: p1.hp, new: p2.hp },
    maxHp: { old: p1.maxHp, new: p2.maxHp },
    attack: { old: p1.attack, new: p2.attack },
    defense: { old: p1.defense, new: p2.defense },
    spirit: { old: p1.spirit, new: p2.spirit },
    physique: { old: p1.physique, new: p2.physique },
    speed: { old: p1.speed, new: p2.speed },
    spiritStones: { old: p1.spiritStones, new: p2.spiritStones },
    inventoryCount: {
      old: p1.inventory?.length || 0,
      new: p2.inventory?.length || 0,
    },
    equipmentCount: {
      old: Object.values(p1.equippedItems || {}).filter((e) => e !== null).length,
      new: Object.values(p2.equippedItems || {}).filter((e) => e !== null).length,
    },
    timestamp: { old: save1.timestamp, new: save2.timestamp },
  };
};

/**
 * Export save data as encrypted/encoded string
 */
export const exportSave = (saveData: SaveData): string => {
  const json = JSON.stringify(saveData);
  // Simple Base64 encoding to add a little difficulty to modification
  try {
    return btoa(encodeURIComponent(json));
  } catch (e) {
    return json; // Fallback to normal JSON
  }
};

/**
 * Import save data (handle encryption/encoding)
 */
export const importSave = (encodedString: string): SaveData | null => {
  try {
    let jsonString = encodedString;
    // Try to decode Base64
    try {
      if (!encodedString.startsWith('{')) {
        jsonString = decodeURIComponent(atob(encodedString));
      }
    } catch (e) {
      // If not Base64, treat as is
    }

    const saveData: SaveData = JSON.parse(jsonString);

    // Validate data structure
    if (!saveData.player || !Array.isArray(saveData.logs)) {
      return null;
    }

    // Ensure timestamp exists
    if (!saveData.timestamp) {
      saveData.timestamp = Date.now();
    }

    return saveData;
  } catch (error) {
    console.error('Import save failed:', error);
    return null;
  }
};

