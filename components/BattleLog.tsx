import React, { useEffect, useRef } from 'react';
import { BattleAction } from '../types';

interface BattleLogProps {
  history: BattleAction[];
}

const BattleLog: React.FC<BattleLogProps> = ({ history }) => {
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when history updates
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="bg-stone-950/50 rounded-none border border-stone-800 p-4 h-40 flex items-center justify-center text-stone-600 font-mono text-xs">
        WAITING_FOR_COMBAT_DATA...
      </div>
    );
  }

  return (
    <div 
      ref={logRef}
      className="bg-stone-950/50 rounded-none border border-stone-800 p-4 h-40 overflow-y-auto font-mono text-xs space-y-1 scroll-smooth"
    >
      <div className="text-stone-500 mb-2 uppercase tracking-widest border-b border-stone-800 pb-1">
        Combat Journal_
      </div>
      {history.map((action, index) => {
        const isPlayer = action.turn === 'player';
        return (
          <div key={action.id || index} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
            <span className="text-stone-600 mr-2">[{String(index + 1).padStart(3, '0')}]</span>
            <span className={isPlayer ? 'text-emerald-500' : 'text-red-500'}>
              {isPlayer ? '>> ' : '<< '}
            </span>
            <span className="text-stone-300">
              {action.description}
            </span>
            {action.result.crit && (
              <span className="ml-2 text-yellow-500 font-bold text-[10px] border border-yellow-900/50 px-1 rounded bg-yellow-900/10">
                CRIT
              </span>
            )}
            {action.result.miss && (
              <span className="ml-2 text-stone-500 italic">
                (MISS)
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BattleLog;
