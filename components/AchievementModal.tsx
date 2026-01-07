import React from 'react';
import { X, Trophy, Star } from 'lucide-react';
import { PlayerStats, Achievement, ItemRarity } from '../types';
import { ACHIEVEMENTS } from '../constants/index';
import { getRarityTextColor } from '../utils/rarityUtils';
import { ASSETS } from '../constants/assets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
}

const AchievementModal: React.FC<Props> = ({ isOpen, onClose, player }) => {
  if (!isOpen) return null;

  const getRequirementTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      realm: 'Rank',
      kill: 'Kill',
      collect: 'Collect',
      meditate: 'Train',
      adventure: 'Scavenge',
      equip: 'Equip',
      pet: 'Pet',
      recipe: 'Recipe',
      art: 'Mod',
      breakthrough: 'Rank Up',
      secret_realm: 'Ruin',
      lottery: 'Gacha',
      custom: 'Special',
    };
    return typeMap[type] || type;
  };

  const getRequirementText = (achievement: Achievement) => {
    const typeText = getRequirementTypeText(achievement.requirement.type);
    if (
      achievement.requirement.type === 'realm' &&
      achievement.requirement.target
    ) {
      return `Reach ${achievement.requirement.target}`;
    }
    return `${typeText} ${achievement.requirement.value}${getRequirementUnit(achievement.requirement.type)}`;
  };

  const getRequirementUnit = (type: string) => {
    const unitMap: Record<string, string> = {
      kill: ' enemies',
      collect: ' items',
      meditate: ' times',
      adventure: ' times',
      equip: ' pieces',
      pet: ' pets',
      recipe: ' recipes',
      art: ' mods',
      breakthrough: ' times',
      secret_realm: ' times',
      lottery: ' times',
    };
    return unitMap[type] || '';
  };

  const completedAchievements = ACHIEVEMENTS.filter((a) =>
    player.achievements.includes(a.id)
  );
  const incompleteAchievements = ACHIEVEMENTS.filter(
    (a) => !player.achievements.includes(a.id)
  );

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation font-mono"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 w-full h-[80vh] md:h-auto md:max-w-3xl rounded-none border-0 md:border border-stone-800 shadow-2xl flex flex-col md:max-h-[85vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景纹理层 */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
          style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
        />

        {/* CRT 效果层 */}
        <div className="absolute inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 crt-noise opacity-[0.02]"></div>
          <div className="absolute inset-0 scanline-overlay opacity-[0.04]"></div>
          <div className="absolute inset-0 crt-vignette"></div>
        </div>

        <div className="p-3 md:p-4 border-b border-stone-800 flex justify-between items-center bg-stone-900/40 rounded-none relative z-10">
          <h2 className="text-lg md:text-xl font-mono text-emerald-500 flex items-center gap-2 uppercase tracking-[0.2em] font-bold">
            <Trophy className="text-emerald-500 w-5 h-5 md:w-6 md:h-6" />
            [ ARCHIVE_ACHIEVEMENTS ]
          </h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-emerald-500 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation transition-colors group/close relative z-20"
          >
            <X size={24} className="group-hover/close:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="modal-scroll-container modal-scroll-content p-4 md:p-6 min-h-0 relative z-10">
          <div className="mb-6 text-center">
            <div className="inline-block px-6 py-3 border border-stone-800 bg-stone-900/20 relative group/stats overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover/stats:opacity-100 transition-opacity" />
              <p className="text-stone-400 font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] relative z-10">
                Data Synchronization: <span className="text-emerald-500 font-bold">{completedAchievements.length}</span> / <span className="text-stone-600">{ACHIEVEMENTS.length}</span>
              </p>
            </div>
          </div>

          {/* 已完成的成就 */}
          {completedAchievements.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-mono mb-4 text-emerald-500/60 flex items-center gap-2 uppercase tracking-[0.3em] font-bold">
                <div className="w-1.5 h-1.5 bg-emerald-500 animate-pulse"></div>
                UNLOCKED PROTOCOLS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-stone-900/40 rounded-none p-4 border border-stone-800 relative group/item overflow-hidden transition-all hover:border-emerald-500/40 hover:bg-emerald-900/5"
                  >
                    {/* 悬停纹理 */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/item:opacity-[0.02] transition-opacity"
                      style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }} />
                    
                    <div className="absolute top-0 left-0 w-0.5 h-full bg-emerald-500/30 group-hover:bg-emerald-500 transition-colors"></div>
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="mt-1 p-1.5 border border-stone-800 bg-stone-900 group-hover/item:border-emerald-500/30 transition-colors">
                        <Trophy
                          className="text-emerald-500/60 group-hover/item:text-emerald-400 transition-colors"
                          size={18}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-stone-200 uppercase tracking-wider text-xs group-hover/item:text-emerald-400 transition-colors">{achievement.name}</span>
                          <span
                            className={`text-[9px] uppercase border border-stone-800/50 px-1.5 py-0.5 bg-stone-950/50 ${getRarityTextColor(achievement.rarity as ItemRarity)}`}
                          >
                            {achievement.rarity}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 mb-3 leading-relaxed font-mono uppercase tracking-tight">
                          {achievement.description}
                        </p>
                        <div className="text-[9px] text-emerald-500/40 uppercase tracking-widest flex items-center gap-1.5 group-hover/item:text-emerald-500/70 transition-colors font-bold">
                          <div className="w-1 h-1 bg-emerald-500/40 group-hover/item:bg-emerald-500 transition-colors"></div>
                          PROTOCOL_ACTIVE
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 未完成的成就 */}
          {incompleteAchievements.length > 0 && (
            <div>
              <h3 className="text-xs font-mono mb-4 text-stone-600 flex items-center gap-2 uppercase tracking-[0.3em] font-bold">
                <div className="w-1.5 h-1.5 bg-stone-800"></div>
                PENDING_SYNCHRONIZATION
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incompleteAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-stone-900/10 rounded-none p-4 border border-stone-800/50 opacity-60 relative group/pending overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-0.5 h-full bg-stone-800"></div>
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="mt-1 p-1.5 border border-stone-800 bg-stone-950">
                        <Star
                          className="text-stone-700"
                          size={18}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-stone-600 uppercase tracking-wider text-xs">
                            {achievement.name}
                          </span>
                          <span className="text-[9px] text-stone-700 uppercase border border-stone-800/30 px-1.5 py-0.5 bg-stone-950/30 font-mono">
                            {achievement.rarity}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-600 mb-3 leading-relaxed font-mono uppercase tracking-tight">
                          {achievement.description}
                        </p>
                        <div className="text-[9px] text-stone-700 uppercase tracking-widest border-t border-stone-800/30 pt-2 font-mono">
                          REQ: {getRequirementText(achievement)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementModal;
