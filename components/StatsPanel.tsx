import React, { useState, useMemo } from 'react';
import { PlayerStats } from '../types';
import { CULTIVATION_ARTS } from '../constants/index';
import { getRarityTextColor } from '../utils/rarityUtils';
import { Shield, Zap, Coins, BookOpen, Sword, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { getPlayerTotalStats } from '../utils/statUtils';
import { getGoldenCoreMethodTitle, } from '../utils/cultivationUtils';
import { formatNumber } from '../utils/formatUtils';

interface Props {
  player: PlayerStats;
}

const StatsPanel: React.FC<Props> = ({ player }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Use getPlayerTotalStats to get total stats including heart method bonuses
  const totalStats = useMemo(() => getPlayerTotalStats(player), [player]);

  // Use useMemo to cache calculation results
  const expPercentage = useMemo(
    () => Math.min(100, (player.exp / player.maxExp) * 100),
    [player.exp, player.maxExp]
  );
  const hpPercentage = useMemo(
    () => Math.min(100, (player.hp / totalStats.maxHp) * 100),
    [player.hp, totalStats.maxHp]
  );
  const lifespanPercentage = useMemo(
    () => {
      const maxLifespan = player.maxLifespan ?? 100;
      const lifespan = player.lifespan ?? maxLifespan;
      return Math.min(100, (lifespan / maxLifespan) * 100);
    },
    [player.lifespan, player.maxLifespan]
  );

  const activeArt = useMemo(
    () => CULTIVATION_ARTS.find((a) => a.id === player.activeArtId),
    [player.activeArtId]
  );

  // Find natal artifact (via natalArtifactId)
  const natalArtifact = useMemo(
    () =>
      player.natalArtifactId && Array.isArray(player.inventory)
        ? player.inventory.find((i) => i.id === player.natalArtifactId)
        : null,
    [player.natalArtifactId, player.inventory]
  );

  // Use unified utility function to get rarity color

  return (
    <div className="bg-ink-950 border-r-2 border-b-2 md:border-b-0 border-stone-800 p-3 md:p-6 flex flex-col gap-3 md:gap-6 w-full md:w-80 shrink-0 h-auto md:h-full overflow-y-auto font-mono">
      {/* Mobile Collapse Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="md:hidden flex items-center justify-between w-full p-2 bg-ink-900 rounded-none border border-stone-700 mb-2 touch-manipulation"
      >
        <div className="text-center flex-1">
          <h2 className="text-lg font-mono font-bold text-mystic-gold tracking-[0.2em] uppercase">
            {player.name}
          </h2>
          <div className="text-stone-400 text-xs mt-0.5 font-mono uppercase tracking-wider">
            {(() => {
              // Using mutant path title for RealmType.GoldenCore
              if (player.realm === 'Mutant' && player.goldenCoreMethodCount) {
                const methodTitle = getGoldenCoreMethodTitle(player.goldenCoreMethodCount);
                return `${methodTitle} - Rank ${player.realmLevel}`;
              }
              return `${player.realm} - Rank ${player.realmLevel}`;
            })()}
          </div>
        </div>
        {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>

      {/* Desktop Header */}
      <div className="hidden md:block text-center mb-4 border-b-2 border-stone-800 pb-4">
        <h2 className="text-2xl font-mono font-bold text-mystic-gold tracking-[0.2em] uppercase">
          {player.name}
        </h2>
        <div className="text-stone-400 text-sm mt-1 font-mono uppercase tracking-wider">
          {(() => {
            // Using mutant path title for RealmType.GoldenCore
            if (player.realm === 'Mutant' && player.goldenCoreMethodCount) {
              const methodTitle = getGoldenCoreMethodTitle(player.goldenCoreMethodCount);
              return `${methodTitle} - Rank ${player.realmLevel}`;
            }
            return `${player.realm} - Rank ${player.realmLevel}`;
          })()}
        </div>
      </div>

      {/* Collapsible Content */}
      <div
        className={`${isCollapsed ? 'hidden md:flex' : 'flex'} flex-col gap-3 md:gap-6`}
      >
        {/* Vitals */}
        <div className="space-y-2 md:space-y-4">
          <div>
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>Hit Points (HP)</span>
              <span>
                {formatNumber(player.hp)} / {formatNumber(totalStats.maxHp)}
              </span>
            </div>
            <div className="h-2 bg-stone-900 rounded-none overflow-hidden border border-stone-700">
              <div
                className="h-full bg-mystic-blood transition-all duration-500 ease-out"
                style={{ width: `${hpPercentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>Experience (XP)</span>
              <span>
                {formatNumber(Math.floor(player.exp))} / {formatNumber(player.maxExp)}
              </span>
            </div>
            <div className="h-2 bg-stone-900 rounded-none overflow-hidden border border-stone-700">
              <div
                className="h-full bg-mystic-jade transition-all duration-500 ease-out"
                style={{ width: `${expPercentage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-stone-400 mb-1">
              <span>Lifespan (Y)</span>
              <span>
                {formatNumber(Math.floor(player.lifespan ?? player.maxLifespan ?? 100))} / {formatNumber(Math.floor(player.maxLifespan ?? 100))}
              </span>
            </div>
            <div className="h-2 bg-stone-900 rounded-none overflow-hidden border border-stone-700">
              <div
                className={`h-full transition-all duration-500 ease-out ${lifespanPercentage < 20 ? 'bg-red-500' : lifespanPercentage < 50 ? 'bg-orange-500' : 'bg-emerald-500'
                  }`}
                style={{ width: `${lifespanPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active Art */}
        <div className="bg-ink-800 p-2 md:p-3 rounded-none border border-stone-700 flex items-center gap-2 md:gap-3">
          <BookOpen
            size={16}
            className="md:w-[18px] md:h-[18px] text-blue-400"
          />
          <div className="flex-1">
            <div className="text-[10px] md:text-xs text-stone-500 uppercase">
              Active Neural Mod
            </div>
            <div className="text-stone-200 font-mono font-bold text-xs md:text-sm uppercase">
              {activeArt ? activeArt.name : 'Unknown Mod'}
            </div>
          </div>
        </div>

        {/* Natal Artifact */}
        <div className="bg-ink-800 p-2 md:p-3 rounded-none border border-stone-700 flex items-center gap-2 md:gap-3">
          <Sword
            size={16}
            className="md:w-[18px] md:h-[18px] text-purple-400"
          />
          <div className="flex-1">
            <div className="text-[10px] md:text-xs text-stone-500 uppercase">
              Signature Gear
            </div>
            <div
              className={`font-mono font-bold text-xs md:text-sm uppercase ${getRarityTextColor(natalArtifact?.rarity)}`}
            >
              {natalArtifact ? natalArtifact.name : 'None'}
            </div>
          </div>
        </div>

        {/* Attributes */}
        <div className="grid grid-cols-2 gap-2 md:gap-3 mt-1">
          <div className="bg-ink-800 p-2 md:p-3 rounded-none border border-stone-700 flex items-center gap-2 md:gap-3">
            <Sword size={14} className="md:w-[18px] md:h-[18px] text-red-400" />
            <div>
              <div className="text-[10px] md:text-xs text-stone-500 uppercase">Firepower (FP)</div>
              <div className="text-stone-200 font-bold text-xs md:text-base">
                {totalStats.attack}
              </div>
            </div>
          </div>
          <div className="bg-ink-800 p-2 md:p-3 rounded-none border border-stone-700 flex items-center gap-2 md:gap-3">
            <Shield
              size={14}
              className="md:w-[18px] md:h-[18px] text-blue-400"
            />
            <div>
              <div className="text-[10px] md:text-xs text-stone-500 uppercase">Dmg Resist (DR)</div>
              <div className="text-stone-200 font-bold text-xs md:text-base">
                {totalStats.defense}
              </div>
            </div>
          </div>
          <div className="bg-ink-800 p-2 md:p-3 rounded-none border border-stone-700 flex items-center gap-2 md:gap-3">
            <Zap
              size={14}
              className="md:w-[18px] md:h-[18px] text-yellow-400"
            />
            <div>
              <div className="text-[10px] md:text-xs text-stone-500 uppercase">Perception (PER)</div>
              <div className="text-stone-200 font-bold text-xs md:text-base">
                {totalStats.spirit}
              </div>
            </div>
          </div>
          <div className="bg-ink-800 p-2 md:p-3 rounded-none border border-stone-700 flex items-center gap-2 md:gap-3">
            <Shield
              size={14}
              className="md:w-[18px] md:h-[18px] text-green-400"
            />
            <div>
              <div className="text-[10px] md:text-xs text-stone-500 uppercase">Endurance (END)</div>
              <div className="text-stone-200 font-bold text-xs md:text-base">
                {totalStats.physique}
              </div>
            </div>
          </div>
          <div className="bg-ink-800 p-2 md:p-3 rounded-none border border-stone-700 flex items-center gap-2 md:gap-3">
            <Zap size={14} className="md:w-[18px] md:h-[18px] text-cyan-400" />
            <div>
              <div className="text-[10px] md:text-xs text-stone-500 uppercase">Agility (AGL)</div>
              <div className="text-stone-200 font-bold text-xs md:text-base">
                {totalStats.speed}
              </div>
            </div>
          </div>
          <div className="bg-ink-800 p-2 md:p-3 rounded-none border border-stone-700 flex items-center gap-2 md:gap-3">
            <Coins
              size={14}
              className="md:w-[18px] md:h-[18px] text-mystic-gold"
            />
            <div>
              <div className="text-[10px] md:text-xs text-stone-500 uppercase">Bottle Caps</div>
              <div className="text-mystic-gold font-bold text-xs md:text-base">
                {formatNumber(player.spiritStones)}
              </div>
            </div>
          </div>
        </div>

        {/* 其他信息 */}
        {player.lotteryTickets > 0 && (
          <div className="bg-ink-800 p-2 md:p-3 rounded-none border border-yellow-500/50 flex items-center gap-2 md:gap-3">
            <Zap
              size={14}
              className="md:w-[18px] md:h-[18px] text-yellow-400"
            />
            <div>
              <div className="text-[10px] md:text-xs text-stone-500 uppercase">
                Lottery Tickets
              </div>
              <div className="text-yellow-400 font-bold text-xs md:text-base">
                {player.lotteryTickets}
              </div>
            </div>
          </div>
        )}
        {player.inheritanceLevel > 0 && (
          <div className="bg-ink-800 p-2 md:p-3 rounded-none border border-purple-500/50 flex items-center gap-2 md:gap-3">
            <Zap
              size={14}
              className="md:w-[18px] md:h-[18px] text-purple-400"
            />
            <div>
              <div className="text-[10px] md:text-xs text-stone-500 uppercase">
                Legacy Level
              </div>
              <div className="text-purple-400 font-bold text-xs md:text-base">
                {player.inheritanceLevel}
              </div>
            </div>
          </div>
        )}

        {/* 灵根显示 */}
        <div className="bg-ink-800 p-2 md:p-3 rounded-none border border-stone-700">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles
              size={14}
              className="md:w-[18px] md:h-[18px] text-purple-400"
            />
            <div className="text-[10px] md:text-xs text-stone-500 uppercase">Aptitude</div>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {(['metal', 'wood', 'water', 'fire', 'earth'] as const).map((root) => {
              const rootNames: Record<typeof root, string> = {
                metal: 'STR',
                wood: 'VIT',
                water: 'PER',
                fire: 'REF',
                earth: 'HRD',
              };
              const rootColors: Record<typeof root, string> = {
                metal: 'text-yellow-400',
                wood: 'text-green-400',
                water: 'text-blue-400',
                fire: 'text-red-400',
                earth: 'text-amber-600',
              };
              const value = player.spiritualRoots?.[root] || 0;
              return (
                <div
                  key={root}
                  className="text-center p-1 bg-stone-900 rounded-none border border-stone-700"
                >
                  <div className={`text-[10px] md:text-xs font-bold ${rootColors[root]}`}>
                    {rootNames[root]}
                  </div>
                  <div className="text-stone-200 text-[10px] md:text-xs">
                    {value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden md:block mt-auto pt-6 border-t border-stone-700 text-xs text-stone-500 italic text-center uppercase tracking-widest">
          "War. War never changes."
        </div>
      </div>
    </div>
  );
};

export default React.memo(StatsPanel);
