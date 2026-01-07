import React, { useEffect, useMemo, useRef } from 'react';
import { Shield, Sword, X, SkipForward } from 'lucide-react';
import { ASSETS } from '../constants/assets';
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
      className="fixed inset-0 bg-black/95 flex items-end md:items-center justify-center z-[80] p-0 md:p-8 touch-manipulation crt-screen"
      onClick={() => {
        if (!closeDisabled) onClose();
      }}
    >
      <div
        className="bg-ink-950 border border-stone-800 w-full md:max-w-3xl max-h-[92vh] rounded-none shadow-2xl flex flex-col relative overflow-hidden font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
        {/* CRT Visual Layers */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
        <div className="crt-noise"></div>
        <div className="crt-vignette"></div>

        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-stone-800 bg-stone-950 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-stone-900 border border-stone-800 flex items-center justify-center text-red-500/80 shadow-inner">
              <Sword size={24} />
            </div>
            <div>
              <div className="text-[10px] text-stone-600 uppercase tracking-[0.3em] font-bold">
                COMBAT_ENCOUNTER // SEQ_v2.01
              </div>
              <div className="flex items-center gap-2 text-lg md:text-xl font-bold text-stone-200 uppercase tracking-widest">
                {replay.enemy.title}·{replay.enemy.name}
                <span className="text-[9px] text-yellow-600 bg-stone-950 px-2 py-0.5 rounded-none border border-yellow-900/30">
                  {replay.enemy.realm}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={closeDisabled}
            className={`w-10 h-10 flex items-center justify-center transition-all border ${closeDisabled
                ? 'border-stone-900 text-stone-800 cursor-not-allowed'
                : 'border-stone-800 text-stone-500 hover:text-red-500 hover:bg-red-950/10 hover:border-red-900/50'
              }`}
            title={closeDisabled ? 'Combat in progress' : 'Close combat log'}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 md:px-6 py-4 border-b border-stone-800 bg-stone-950/50 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'HP', value: replay.enemy.maxHp, color: 'bg-red-500' },
              { label: 'ATK', value: replay.enemy.attack, color: 'bg-orange-500' },
              { label: 'DEF', value: replay.enemy.defense, color: 'bg-blue-500' },
              { label: 'SPD', value: replay.enemy.speed, color: 'bg-cyan-500' },
              { label: 'PER', value: replay.enemy.spirit, color: 'bg-purple-500' }
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[9px] text-stone-500 uppercase tracking-widest font-bold">
                  <span>{stat.label}</span>
                  <span>{stat.value}</span>
                </div>
                <div className="h-1 bg-stone-900 rounded-none overflow-hidden">
                  <div className={`h-full ${stat.color} opacity-30`} style={{ width: '100%' }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className={`mt-4 p-3 border border-dashed text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-center ${replay.victory ? 'bg-emerald-950/10 border-emerald-900/50 text-emerald-500' : 'bg-red-950/10 border-red-900/50 text-red-500'
              }`}>
            {replay.summary}
          </div>
        </div>

        <div
          ref={logRef}
          className="flex-1 overflow-y-auto px-5 md:px-6 py-6 space-y-4 bg-stone-950 relative z-10 custom-scrollbar"
        >
          {visibleRounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-stone-700 font-mono">
              <div className="w-8 h-8 border-2 border-stone-800 border-t-stone-600 animate-spin mb-4"></div>
              <div className="uppercase tracking-[0.3em] text-[10px]">INITIALIZING_COMBAT_LOGS...</div>
            </div>
          ) : (
            visibleRounds.map((round, idx) => (
              <div
                key={round.id}
                className={`p-4 rounded-none border relative overflow-hidden transition-all ${round.attacker === 'player'
                    ? 'bg-emerald-950/5 border-emerald-900/30 shadow-[0_0_10px_rgba(16,185,129,0.02)]'
                    : 'bg-red-950/5 border-red-900/30 shadow-[0_0_10px_rgba(239,68,68,0.02)]'
                  }`}
              >
                <div className="absolute inset-0 bg-scanlines opacity-[0.01] pointer-events-none"></div>
                
                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest mb-3 font-bold">
                  <span className={round.attacker === 'player' ? 'text-emerald-600' : 'text-red-600'}>
                    [{String(idx + 1).padStart(2, '0')}] // {round.attacker === 'player' ? 'USER_ACTION' : 'HOSTILE_ACTION'}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-stone-600 italic">
                      DMG: <span className={round.damage > 0 ? 'text-stone-200' : 'text-stone-700'}>{round.damage}</span>
                    </span>
                    {round.crit && (
                      <span className="text-yellow-600 bg-yellow-950/20 px-1.5 py-0.5 border border-yellow-900/50">CRIT</span>
                    )}
                  </div>
                </div>
                
                <p className="text-[13px] leading-relaxed text-stone-300 uppercase tracking-wider mb-4 border-l-2 border-stone-800 pl-3 py-1">
                  {round.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-stone-600 uppercase tracking-widest font-bold">
                      <span>USER_INTEGRITY</span>
                      <span>{round.playerHpAfter}</span>
                    </div>
                    <div className="h-1 bg-stone-900 overflow-hidden">
                      <div className="h-full bg-emerald-600 transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, (round.playerHpAfter / replay.playerHpBefore) * 100))}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-stone-600 uppercase tracking-widest font-bold">
                      <span>HOSTILE_INTEGRITY</span>
                      <span>{round.enemyHpAfter}</span>
                    </div>
                    <div className="h-1 bg-stone-900 overflow-hidden text-right">
                      <div className="h-full bg-red-600 transition-all duration-500 float-right" style={{ width: `${Math.max(0, Math.min(100, (round.enemyHpAfter / replay.enemy.maxHp) * 100))}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-stone-800 px-5 md:px-6 py-6 bg-stone-950 flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-stone-600 uppercase tracking-widest font-bold">SEQ_PROGRESS</span>
              <span className="text-xs text-stone-400 font-mono">{progressText} ROUNDS</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-stone-600 uppercase tracking-widest font-bold">INTEGRITY_LOSS</span>
              <span className="text-xs text-red-600 font-mono">-{replay.hpLoss} HP</span>
            </div>
            <div className="flex flex-col gap-0.5 col-span-2 mt-1">
              <span className="text-[9px] text-stone-600 uppercase tracking-widest font-bold">DATA_REWARDS</span>
              <div className="flex gap-4 text-xs text-yellow-600 font-mono">
                <span>XP: {replay.expChange >= 0 ? `+${replay.expChange}` : replay.expChange}</span>
                <span>CAPS: {replay.spiritChange >= 0 ? `+${replay.spiritChange}` : replay.spiritChange}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            {!isResolved && (
              <button
                onClick={onSkip}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-stone-950 hover:bg-stone-900 text-amber-600 hover:text-amber-500 border border-amber-900/50 hover:border-amber-600 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
              >
                <SkipForward size={14} />
                FAST_FORWARD
              </button>
            )}
            <button
              onClick={onClose}
              disabled={closeDisabled}
              className={`flex items-center justify-center gap-2 px-6 py-2 border text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${closeDisabled
                  ? 'bg-stone-950 border-stone-900 text-stone-800 cursor-not-allowed'
                  : 'bg-stone-950 border-emerald-900/50 text-emerald-600 hover:bg-emerald-950/20 hover:text-emerald-500 hover:border-emerald-500'
                }`}
            >
              <Shield size={14} />
              {closeDisabled ? 'SEQ_ACTIVE' : 'SEQ_COMPLETE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleModal;
