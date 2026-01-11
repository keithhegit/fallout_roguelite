import { KeyboardShortcutConfig } from '../types';
import { KeyboardShortcut } from '../hooks/useKeyboardShortcuts';

/**
 * Default shortcut configuration
 * key is actionId, used to identify different operations
 */
export const DEFAULT_SHORTCUTS: Record<string, KeyboardShortcutConfig> = {
  meditate: { key: 'm' },
  adventure: { key: 'a' },
  toggleAutoMeditate: { key: 'm', shift: true },
  toggleAutoAdventure: { key: 'a', shift: true },
  openInventory: { key: 'i' },
  openCultivation: { key: 'c' },
  openCharacter: { key: 'p' },
  openAchievement: { key: 't' },
  openPet: { key: 'e' },
  openLottery: { key: 'l' },
  openSettings: { key: 's' },
  openRealm: { key: 'r' },
  openAlchemy: { key: 'n' },
  openSect: { key: 'g' },
  openDailyQuest: { key: 'q' },
  closeModal: { key: 'Escape' },
};

/**
 * Get shortcut configuration (merge default and custom configuration)
 */
export function getShortcutConfig(
  actionId: string,
  customShortcuts?: Record<string, KeyboardShortcutConfig>
): KeyboardShortcutConfig {
  const custom = customShortcuts?.[actionId];
  return custom || DEFAULT_SHORTCUTS[actionId] || { key: '' };
}

/**
 * Check if shortcut conflicts
 */
export function checkShortcutConflict(
  shortcut: KeyboardShortcutConfig,
  actionId: string,
  allShortcuts: Record<string, KeyboardShortcutConfig>
): string | null {
  for (const [id, config] of Object.entries(allShortcuts)) {
    if (id === actionId) continue; // Skip self

    if (
      config.key.toLowerCase() === shortcut.key.toLowerCase() &&
      !!config.ctrl === !!shortcut.ctrl &&
      !!config.shift === !!shortcut.shift &&
      !!config.alt === !!shortcut.alt &&
      !!config.meta === !!shortcut.meta
    ) {
      return id;
    }
  }
  return null;
}

/**
 * Convert KeyboardShortcutConfig to KeyboardShortcut
 */
export function configToShortcut(
  config: KeyboardShortcutConfig,
  action: () => void,
  description: string,
  category: string
): KeyboardShortcut {
  return {
    key: config.key,
    ctrl: config.ctrl,
    shift: config.shift,
    alt: config.alt,
    meta: config.meta,
    action,
    description,
    category,
  };
}

/**
 * Get display information for all default shortcuts
 */
export const SHORTCUT_DESCRIPTIONS: Record<
  string,
  { description: string; category: string }
> = {
  meditate: { description: 'MEDITATE', category: 'BASIC_OPERATIONS' },
  adventure: { description: 'SCAVENGE', category: 'BASIC_OPERATIONS' },
  toggleAutoMeditate: { description: 'TOGGLE_AUTO_MEDITATE', category: 'BASIC_OPERATIONS' },
  toggleAutoAdventure: { description: 'TOGGLE_AUTO_SCAVENGE', category: 'BASIC_OPERATIONS' },
  openInventory: { description: 'OPEN_INVENTORY', category: 'INTERFACE_ACCESS' },
  openCultivation: { description: 'OPEN_TRAIN', category: 'INTERFACE_ACCESS' },
  openCharacter: { description: 'OPEN_CHARACTER', category: 'INTERFACE_ACCESS' },
  openAchievement: { description: 'OPEN_ACHIEVEMENTS', category: 'INTERFACE_ACCESS' },
  openPet: { description: 'OPEN_PETS', category: 'INTERFACE_ACCESS' },
  openLottery: { description: 'OPEN_LOTTERY', category: 'INTERFACE_ACCESS' },
  openSettings: { description: 'OPEN_SETTINGS', category: 'INTERFACE_ACCESS' },
  openRealm: { description: 'OPEN_EXPLORE', category: 'INTERFACE_ACCESS' },
  openAlchemy: { description: 'OPEN_CRAFT', category: 'INTERFACE_ACCESS' },
  openSect: { description: 'OPEN_FACTION', category: 'INTERFACE_ACCESS' },
  openDailyQuest: { description: 'OPEN_DAILY_QUESTS', category: 'INTERFACE_ACCESS' },
  closeModal: { description: 'ABORT_PROTOCOL', category: 'SYSTEM_COMMANDS' },
};

