import React from 'react';
import { BattleReplay } from '../../services/battleService';

interface UseBattleHandlersProps {
  battleReplay: BattleReplay | null;
  setBattleReplay: React.Dispatch<React.SetStateAction<BattleReplay | null>>;
  isBattleModalOpen: boolean;
  setIsBattleModalOpen: (open: boolean) => void;
  revealedBattleRounds: number;
  setRevealedBattleRounds: (
    rounds: number | ((prev: number) => number)
  ) => void;
  animationSpeed: string;
}

/**
 * Battle Handlers
 * Includes opening battle modal, skipping battle logs, closing battle modal
 * @param battleReplay Battle replay
 * @param setBattleReplay Set battle replay
 * @param setIsBattleModalOpen Set is battle modal open
 * @param setRevealedBattleRounds Set revealed battle rounds
 * @returns openBattleModal Open battle modal
 * @returns handleSkipBattleLogs Skip battle logs
 * @returns handleCloseBattleModal Close battle modal
 */
export function useBattleHandlers({
  battleReplay,
  setBattleReplay,
  setIsBattleModalOpen,
  setRevealedBattleRounds,
}: UseBattleHandlersProps) {
  const openBattleModal = (replay: BattleReplay) => {
    setBattleReplay(replay);
    setIsBattleModalOpen(true);
    setRevealedBattleRounds(replay.rounds.length > 0 ? 1 : 0);
  };

  const handleSkipBattleLogs = () => {
    if (battleReplay) {
      setRevealedBattleRounds(battleReplay.rounds.length);
    }
  };

  const handleCloseBattleModal = () => {
    setIsBattleModalOpen(false);
    setBattleReplay(null);
    setRevealedBattleRounds(0);
  };

  return {
    openBattleModal,
    handleSkipBattleLogs,
    handleCloseBattleModal,
  };
}
