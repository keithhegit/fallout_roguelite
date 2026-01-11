import React from 'react';
import { PlayerStats, SecretRealm, RealmType, RiskLevel } from '../../types';
import { getPlayerTotalStats } from '../../utils/statUtils';

interface UseRealmHandlersProps {
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
  setLoading: (loading: boolean) => void;
  setCooldown: (cooldown: number) => void;
  loading: boolean;
  cooldown: number;
  setIsRealmOpen: (open: boolean) => void;
  executeAdventure: (adventureType: 'secret_realm', realmName: string, riskLevel?: RiskLevel, realmMinRealm?: RealmType, realmDescription?: string) => Promise<void>;
}

/**
 * Realm Handler
 * Includes entering secret realm
 * @param player Player data
 * @param setPlayer Set player data
 * @param addLog Add log
 * @param setLoading Set loading state
 * @param setCooldown Set cooldown
 * @param loading Loading state
 * @param cooldown Cooldown time
 * @param setIsRealmOpen Set realm modal open state
 * @param executeAdventure Execute adventure
 * @returns handleEnterRealm Enter secret realm
 */

export function useRealmHandlers({
  player,
  setPlayer,
  addLog,
  setItemActionLog,
  loading,
  cooldown,
  setIsRealmOpen,
  executeAdventure,
}: UseRealmHandlersProps) {
  const handleEnterRealm = async (realm: SecretRealm) => {
    if (loading || cooldown > 0 || !player) return;

    // Use actual max HP (including Golden Core bonuses etc.) to judge if HP is sufficient
    const totalStats = getPlayerTotalStats(player);
    if (player.hp < totalStats.maxHp * 0.3) {
      const message = 'Your HP is too low! Entering the Secret Realm now is suicide!';
      addLog(message, 'danger');
      if (setItemActionLog) {
        setItemActionLog({ text: message, type: 'danger' });
      }
      return;
    }

    if (player.spiritStones < realm.cost) {
      addLog('Insufficient Spirit Stones to open the Secret Realm.', 'danger');
      return;
    }

    setPlayer((prev) => ({
      ...prev,
      spiritStones: prev.spiritStones - realm.cost,
    }));
    setIsRealmOpen(false); // Close modal

    // Secret Realm Adventure - Pass full realm info
    await executeAdventure('secret_realm', realm.name, realm.riskLevel, realm.minRealm, realm.description);
  };

  return {
    handleEnterRealm,
  };
}
