import React from 'react';
import { GameSettings } from '../../types';

interface UseSettingsHandlersProps {
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
}

/**
 * Settings Handler Functions
 * Includes update settings
 * @param setSettings Set game settings
 * @returns handleUpdateSettings Update settings
 */

export function useSettingsHandlers({ setSettings }: UseSettingsHandlersProps) {
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return {
    handleUpdateSettings,
  };
}
