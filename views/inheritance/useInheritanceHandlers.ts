import React from 'react';
import { PlayerStats } from '../../types';
import { showConfirm, showError } from '../../utils/toastUtils';

interface UseInheritanceHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
}

/**
 * Inheritance Handler Functions
 * Removed inheritance level and exp cultivation functions, only retained realm breakthrough function
 * Inheritance level can only be obtained through adventure, cannot be manually upgraded
 */
export function useInheritanceHandlers({
  player,
  setPlayer,
  addLog,
}: UseInheritanceHandlersProps) {
  // Inheritance system simplified, no longer provides manual level upgrade function
  // Inheritance level can only be obtained through adventure (inheritanceLevelChange)
  // Function to break through realm using inheritance is in useBreakthroughHandlers

  return {};
}

