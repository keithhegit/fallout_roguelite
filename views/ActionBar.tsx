import React from 'react';
import { ASSETS } from '../constants/assets';
import {
  Play,
  Pause,
} from 'lucide-react';
/**
 * Action Button Bar Component
 * Contains five buttons: Train, Scavenge, Explore, Craft, Faction
 * Train: Cultivation · Heart Method
 * Scavenge: Adventure · Combat
 * Explore: Ruins · Vaults
 * Craft: Meds · Boosts
 * Faction: Quests · Promotion
 */
interface ActionBarProps {
  loading: boolean;
  cooldown: number;
  onMeditate: () => void;
  onAdventure: () => void;
  onOpenRealm: () => void;
  onOpenAlchemy: () => void;
  onOpenSect: () => void;
  autoMeditate: boolean;
  autoAdventure: boolean;
  onToggleAutoMeditate: () => void;
  onToggleAutoAdventure: () => void;
}

function ActionBar({
  loading,
  cooldown,
  onMeditate,
  onAdventure,
  onOpenRealm,
  onOpenAlchemy,
  onOpenSect,
  autoMeditate,
  autoAdventure,
  onToggleAutoMeditate,
  onToggleAutoAdventure,
}: ActionBarProps) {
  return (
    <div className="bg-stone-950 p-3 md:p-4 border-t border-amber-500/30 grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 shrink-0 relative z-20 shadow-lg md:shadow-none">
      <div className="relative">
        <button
          onClick={onMeditate}
          disabled={loading || cooldown > 0}
          className={`
            flex flex-col items-center justify-center p-4 md:p-4 rounded-none border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px] w-full
            ${loading || cooldown > 0
              ? 'bg-stone-950/50 border-stone-800 text-stone-500 cursor-not-allowed'
              : 'bg-stone-900 border-stone-700 active:border-emerald-500 active:bg-stone-800 text-stone-200'
            }
            ${autoMeditate ? 'border-emerald-500 border-2' : ''}
          `}
        >
          <img
            src="https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/bottom_tab_status.png"
            alt="Train"
            className="w-6 h-6 md:w-8 md:h-8 mb-1.5 md:mb-2 object-contain"
          />
          <span className="font-mono font-bold text-base md:text-base uppercase tracking-wider">
            Train
          </span>
          <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1 font-mono">
            Skills · Perks
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleAutoMeditate();
          }}
          className={`
            absolute top-1 right-1 p-1 rounded-none transition-all duration-200
            ${autoMeditate
              ? 'bg-emerald-500/80 text-stone-900 hover:bg-emerald-500'
              : 'bg-stone-700/80 text-stone-400 hover:bg-stone-600'
            }
          `}
          title={autoMeditate ? 'Disable Auto-Train' : 'Enable Auto-Train'}
        >
          {autoMeditate ? <Pause size={12} /> : <Play size={12} />}
        </button>
      </div>

      <div className="relative">
        <button
          onClick={onAdventure}
          disabled={loading || cooldown > 0}
          className={`
            flex flex-col items-center justify-center p-4 md:p-4 rounded-none border-2 transition-all duration-200 group touch-manipulation min-h-[90px] md:min-h-[100px] w-full
            ${loading || cooldown > 0
              ? 'bg-stone-950/50 border-stone-800 text-stone-500 cursor-not-allowed'
              : 'bg-stone-900 border-stone-700 active:border-amber-500 active:bg-stone-800 text-stone-200'
            }
            ${autoAdventure ? 'border-amber-500 border-2' : ''}
          `}
        >
          <img
            src={ASSETS.BOTTOM_TAB.INV}
            alt="Scavenge"
            className={`w-6 h-6 md:w-8 md:h-8 mb-1.5 md:mb-2 object-contain ${loading
              ? 'animate-spin'
              : 'group-active:scale-110 transition-transform'
              }`}
          />
          <span className="font-mono font-bold text-base md:text-base uppercase tracking-wider">
            {loading ? 'Scavenging...' : 'Scavenge'}
          </span>
          <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1 font-mono">
            Loot · Combat
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleAutoAdventure();
          }}
          className={`
            absolute top-1 right-1 p-1 rounded-none transition-all duration-200
            ${autoAdventure
              ? 'bg-amber-500/80 text-stone-900 hover:bg-amber-500'
              : 'bg-stone-700/80 text-stone-400 hover:bg-stone-600'
            }
          `}
          title={autoAdventure ? 'Disable Auto-Scavenge' : 'Enable Auto-Scavenge'}
        >
          {autoAdventure ? <Pause size={12} /> : <Play size={12} />}
        </button>
      </div>

      <button
        onClick={onOpenRealm}
        disabled={loading}
        className={`
          flex flex-col items-center justify-center p-4 md:p-4 rounded-none border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px]
          ${loading
            ? 'bg-stone-950/50 border-stone-800 text-stone-500 cursor-not-allowed'
            : 'bg-stone-900 border-stone-700 active:border-purple-500 active:bg-stone-800 text-stone-200'
          }
        `}
      >
        <img
          src="https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/bottom_tab_map.png"
          alt="Explore"
          className="w-6 h-6 md:w-8 md:h-8 mb-1.5 md:mb-2 object-contain"
        />
        <span className="font-mono font-bold text-base md:text-base uppercase tracking-wider">
          Explore
        </span>
        <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1 font-mono">
          Ruins · Vaults
        </span>
      </button>

      <button
        onClick={onOpenAlchemy}
        disabled={loading}
        className={`
          flex flex-col items-center justify-center p-4 md:p-4 rounded-none border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px]
          ${loading
            ? 'bg-stone-950/50 border-stone-800 text-stone-500 cursor-not-allowed'
            : 'bg-stone-900 border-stone-700 active:border-cyan-500 active:bg-stone-800 text-stone-200'
          }
        `}
      >
        <img
          src="https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/bottom_tab_data.png"
          alt="Craft"
          className="w-6 h-6 md:w-8 md:h-8 mb-1.5 md:mb-2 object-contain"
        />
        <span className="font-mono font-bold text-base md:text-base uppercase tracking-wider">
          Craft
        </span>
        <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1 font-mono">
          Meds · Boosts
        </span>
      </button>

      <button
        onClick={onOpenSect}
        className={`
          flex flex-col items-center justify-center p-4 md:p-4 rounded-none border-2 transition-all duration-200 touch-manipulation min-h-[90px] md:min-h-[100px]
          ${loading
            ? 'bg-stone-950/50 border-stone-800 text-stone-500 cursor-not-allowed'
            : 'bg-stone-900 border-stone-700 active:border-blue-400 active:bg-stone-800 text-stone-200'
          }
        `}
      >
        <img
          src={ASSETS.BOTTOM_TAB.RADIO}
          alt="Faction"
          className="w-6 h-6 md:w-8 md:h-8 mb-1.5 md:mb-2 object-contain"
        />
        <span className="font-mono font-bold text-base md:text-base uppercase tracking-wider">
          Faction
        </span>
        <span className="text-xs md:text-xs text-stone-500 mt-0.5 md:mt-1 font-mono">
          Ops · Rank
        </span>
      </button>
    </div>
  );
}

export default React.memo(ActionBar);
