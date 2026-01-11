import React, { useMemo } from 'react';
import { PlayerStats, Recipe } from '../types';
import { PILL_RECIPES, DISCOVERABLE_RECIPES } from '../constants/index';
import { X, Sparkles, FlaskConical, CircleOff } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onCraft: (recipe: Recipe) => Promise<void>;
}

const AlchemyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  onCraft,
}) => {
  const countItem = (itemName: string) => {
    const item = player.inventory.find((i) => i.name === itemName);
    return item ? item.quantity : 0;
  };

  // Merge base recipes and unlocked recipes
  const availableRecipes = useMemo(() => {
    const unlockedRecipes = player.unlockedRecipes || [];
    const unlocked = DISCOVERABLE_RECIPES.filter((recipe) =>
      unlockedRecipes.includes(recipe.name)
    );
    return [...PILL_RECIPES, ...unlocked];
  }, [player.unlockedRecipes]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation font-mono"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 w-full h-[80vh] md:h-auto md:max-w-3xl rounded-none border-0 md:border border-stone-800 shadow-2xl flex flex-col md:max-h-[85vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CRT Effect Layer */}
        <div className="absolute inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 crt-noise opacity-[0.03]"></div>
          <div className="absolute inset-0 scanline-overlay opacity-[0.05]"></div>
          <div className="absolute inset-0 crt-vignette"></div>
        </div>

        <div className="p-3 md:p-4 border-b border-stone-800 flex justify-between items-center bg-ink-900 rounded-none relative z-10">
          <h3 className="text-lg md:text-xl font-mono text-amber-400 flex items-center gap-2 uppercase tracking-widest">
            <FlaskConical size={18} className="md:w-5 md:h-5" /> Chemical Lab
          </h3>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="modal-scroll-container modal-scroll-content p-3 md:p-4 bg-ink-950 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 relative z-10">
          <div className="col-span-full mb-2 bg-ink-900/50 p-3 rounded-none border border-stone-800 text-xs md:text-sm text-stone-500 flex justify-between font-mono uppercase tracking-widest">
            <span>
              Caps Holding:
              <span className="text-amber-400 font-bold ml-2">
                {player.spiritStones}
              </span>
            </span>
            <span className="hidden md:inline">Bio-chemical processing authorized.</span>
          </div>

          {availableRecipes.map((recipe, idx) => {
            const canAfford = player.spiritStones >= recipe.cost;
            let hasIngredients = true;

            return (
              <div
                key={idx}
                className="bg-ink-950 border border-stone-800 rounded-none p-4 flex flex-col relative group hover:border-amber-500 transition-colors"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-stone-800 group-hover:bg-amber-500/50 transition-colors"></div>
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-base md:text-lg font-mono font-bold text-stone-200 uppercase tracking-wider">
                    {recipe.name}
                  </h4>
                  <span className="text-[10px] bg-stone-900 text-stone-500 border border-stone-800 px-2 py-0.5 rounded-none uppercase tracking-tighter">
                    CHEM
                  </span>
                </div>

                <p className="text-[11px] text-stone-500 mb-4 h-10 overflow-hidden leading-relaxed">
                  {recipe.result.description}
                </p>

                <div className="bg-ink-900/50 p-3 rounded-none border border-stone-800/50 mb-4 flex-1 font-mono">
                  <div className="text-[10px] text-stone-600 mb-2 font-bold uppercase tracking-[0.2em] border-b border-stone-800 pb-1">
                    REQUIRED MATERIALS
                  </div>
                  <ul className="space-y-1.5">
                    {recipe.ingredients.map((ing, i) => {
                      const owned = countItem(ing.name);
                      if (owned < ing.qty) hasIngredients = false;

                      return (
                        <li key={i} className="flex justify-between text-[11px] uppercase tracking-tighter">
                          <span className="text-stone-400">{ing.name}</span>
                          <span
                            className={
                              owned >= ing.qty
                                ? 'text-emerald-500'
                                : 'text-red-500'
                            }
                          >
                            {owned}/{ing.qty}
                          </span>
                        </li>
                      );
                    })}
                    <li className="flex justify-between text-[11px] pt-1.5 border-t border-stone-800 mt-1.5 uppercase tracking-tighter">
                      <span className="text-stone-400">CAPS COST</span>
                      <span
                        className={
                          canAfford ? 'text-amber-400' : 'text-red-500'
                        }
                      >
                        {recipe.cost}
                      </span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={async () => {
                    if (canAfford && hasIngredients) {
                      await onCraft(recipe);
                    }
                  }}
                  disabled={!canAfford || !hasIngredients}
                  className={`
                    w-full py-2.5 rounded-none font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-[0.2em] min-h-[44px]
                    ${canAfford && hasIngredients
                      ? 'bg-ink-950 text-amber-400 hover:bg-stone-900 border border-amber-500 active:scale-95'
                      : 'bg-ink-950 text-stone-700 cursor-not-allowed border border-stone-800'
                    }
                  `}
                >
                  {!canAfford || !hasIngredients ? (
                    <CircleOff size={16} />
                  ) : (
                    <FlaskConical size={16} />
                  )}
                  {canAfford && hasIngredients ? 'INITIALIZE SYNTHESIS' : 'INSUFFICIENT DATA'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(AlchemyModal);
