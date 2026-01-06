import React, { useEffect, useMemo, useRef } from 'react';
import { Shield, Sword, X, SkipForward } from 'lucide-react';
import { BattleReplay } from '../services/battleService';

interface BattleModalProps {
  isOpen: boolean;
  replay: BattleReplay | null;
  revealedRounds: number;
  onSkip: () => void;
  onClose: () => void;
}

const BattleModal: React.FC<BattleModalProps> = ({
  isOpen,
  replay,
  revealedRounds,
  onSkip,
  onClose,
}) => {
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [revealedRounds, replay]);

  const { visibleRounds, isResolved, progressText } = useMemo(() => {
    if (!replay) {
      return {
        visibleRounds: [],
        isResolved: true,
        progressText: '0 / 0',
      };
    }
    const total = replay.rounds.length || 1;
    const progress = Math.min(revealedRounds, total);
    return {
      visibleRounds: replay.rounds.slice(0, progress),
      isResolved: progress >= total,
      progressText: `${progress} / ${total}`,
    };
  }, [replay, revealedRounds]);

  if (!isOpen || !replay) return null;

  const closeDisabled = !isResolved;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-[80] p-0 md:p-8"
      onClick={() => {
        if (!closeDisabled) onClose();
      }}
    >
      <div
        className="bg-ink-900 border border-stone-700 w-full md:max-w-3xl max-h-[92vh] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-stone-700">
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-widest">
              Combat Encounter
            </div>
            <div className="flex items-center gap-2 text-lg md:text-xl font-serif text-mystic-gold">
              <Sword size={18} className="text-mystic-gold" />
              {replay.enemy.title}·{replay.enemy.name}
              <span className="text-[11px] text-stone-400 bg-ink-800 px-2 py-0.5 rounded border border-stone-700">
                {replay.enemy.realm}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={closeDisabled}
            className={`p-2 rounded border ${closeDisabled
                ? 'border-stone-700 text-stone-600 cursor-not-allowed'
                : 'border-stone-600 text-stone-200 hover:bg-stone-700/40'
              }`}
            title={closeDisabled ? 'Combat in progress' : 'Close combat log'}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 md:px-6 py-4 border-b border-stone-800 bg-ink-900">
          <div className="flex flex-wrap gap-4 text-xs text-stone-400">
            <span>Enemy HP: {replay.enemy.maxHp}</span>
            <span>Enemy ATK: {replay.enemy.attack}</span>
            <span>Enemy DEF: {replay.enemy.defense}</span>
            <span>Enemy SPD: {replay.enemy.speed}</span>
            <span>Enemy PER: {replay.enemy.spirit}</span>
          </div>
          <p
            className={`mt-3 text-sm md:text-base font-semibold ${replay.victory ? 'text-emerald-400' : 'text-rose-400'
              }`}
          >
            {replay.summary}
          </p>
        </div>

        <div
          ref={logRef}
          className="flex-1 overflow-y-auto px-5 md:px-6 py-4 space-y-3 bg-ink-800/60 text-sm"
        >
          {visibleRounds.length === 0 ? (
            <div className="text-center text-stone-500 py-6">
              Combat logs initializing...
            </div>
          ) : (
            visibleRounds.map((round, idx) => (
              <div
                key={round.id}
                className={`p-3 rounded border text-stone-200 ${round.attacker === 'player'
                    ? 'bg-emerald-900/10 border-emerald-700/40'
                    : 'bg-rose-900/15 border-rose-700/40'
                  }`}
              >
                <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                  <span>
                    Round {idx + 1} ·{' '}
                    {round.attacker === 'player' ? 'Your Turn' : 'Enemy Turn'}
                  </span>
                  <span>
                    Damage {round.damage}
                    {round.crit && (
                      <span className="text-mystic-gold ml-1">· CRIT</span>
                    )}
                  </span>
                </div>
                <p>{round.description}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                  <span>Your HP: {round.playerHpAfter}</span>
                  <span>Enemy HP: {round.enemyHpAfter}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-stone-700 px-5 md:px-6 py-4 bg-ink-900/90 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-stone-400 space-y-1">
            <div>Combat Progress: {progressText} Rounds</div>
            <div>HP Loss: {replay.hpLoss}</div>
            <div className="text-stone-300">
              Rewards:
              {replay.expChange >= 0
                ? `+${replay.expChange}`
                : replay.expChange}{' '}
              XP ·{' '}
              {replay.spiritChange >= 0
                ? `+${replay.spiritChange}`
                : replay.spiritChange}{' '}
              Caps
            </div>
            <div>Current HP: {replay.playerHpAfter}</div>
          </div>
          <div className="flex gap-2">
            {!isResolved && (
              <button
                onClick={onSkip}
                className="flex items-center gap-1 px-3 py-2 rounded border border-amber-500 text-amber-300 hover:bg-amber-500/10 text-sm"
              >
                <SkipForward size={16} />
                Skip Combat
              </button>
            )}
            <button
              onClick={onClose}
              disabled={closeDisabled}
              className={`flex items-center gap-1 px-3 py-2 rounded border text-sm ${closeDisabled
                  ? 'border-stone-700 text-stone-600 cursor-not-allowed'
                  : 'border-emerald-500 text-emerald-300 hover:bg-emerald-500/10'
                }`}
            >
              <Shield size={16} />
              {closeDisabled ? 'Combat Active' : 'End Combat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleModal;
