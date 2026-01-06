import React from 'react';
import { PlayerStats, DifficultyMode } from '../types';
import { BattleReplay } from '../services/battleService';
import { Flame, Sword, Heart, Skull, RotateCcw } from 'lucide-react';

interface DeathModalProps {
  player: PlayerStats;
  battleData: BattleReplay | null;
  deathReason: string;
  difficulty: DifficultyMode;
  onRebirth: () => void;
  onContinue?: () => void; // Continue game (Normal and Easy modes)
}

const DeathModal: React.FC<DeathModalProps> = ({
  player,
  battleData,
  deathReason,
  difficulty,
  onRebirth,
  onContinue,
}) => {
  // 计算战斗统计
  const battleStats = battleData
    ? {
      totalRounds: battleData.rounds.length,
      playerDamage: battleData.rounds
        .filter((r) => r.attacker === 'player')
        .reduce((sum, r) => sum + r.damage, 0),
      enemyDamage: battleData.rounds
        .filter((r) => r.attacker === 'enemy')
        .reduce((sum, r) => sum + r.damage, 0),
      critCount: battleData.rounds.filter((r) => r.crit).length,
      maxDamage: Math.max(...battleData.rounds.map((r) => r.damage), 0),
    }
    : null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-2 md:p-4">
      <div className="bg-gradient-to-br from-red-900/95 via-stone-900 to-red-900/95 border-2 md:border-4 border-red-600 rounded-lg p-3 md:p-6 max-w-lg md:max-w-2xl w-full shadow-2xl my-auto">
        {/* 标题 */}
        <div className="text-center mb-3 md:mb-4">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-3">
            <Skull
              size={32}
              className="md:w-12 md:h-12 text-red-500 animate-pulse"
            />
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-red-400">
              WASTED
            </h1>
            <Skull
              size={32}
              className="md:w-12 md:h-12 text-red-500 animate-pulse"
            />
          </div>
          <p className="text-stone-300 text-sm md:text-base">
            {player.name} met an unfortunate end in the wasteland...
          </p>
        </div>

        {/* 死亡原因 */}
        <div className="bg-stone-800/50 border-2 border-red-600/50 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
          <h2 className="text-base md:text-lg font-bold text-red-400 mb-1 md:mb-2 flex items-center gap-1 md:gap-2">
            <Flame size={16} className="md:w-5 md:h-5" />
            Cause of Failure
          </h2>
          <p className="text-stone-200 text-xs md:text-sm leading-relaxed">
            {deathReason}
          </p>
        </div>

        {/* 战斗统计 */}
        {battleStats && battleData && (
          <div className="bg-stone-800/50 border-2 border-red-600/50 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-bold text-red-400 mb-2 md:mb-3 flex items-center gap-1 md:gap-2">
              <Sword size={16} className="md:w-5 md:h-5" />
              Final Combat Log
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              <div className="bg-stone-900/50 rounded p-2">
                <div className="text-stone-400 text-xs mb-0.5 md:mb-1">
                  Enemy
                </div>
                <div className="text-stone-200 font-bold text-sm md:text-base break-words">
                  {battleData.enemy.title}
                  {battleData.enemy.name}
                </div>
              </div>
              <div className="bg-stone-900/50 rounded p-2">
                <div className="text-stone-400 text-xs mb-0.5 md:mb-1">
                  Rounds
                </div>
                <div className="text-stone-200 font-bold text-sm md:text-base">
                  {battleStats.totalRounds} Rounds
                </div>
              </div>
              <div className="bg-stone-900/50 rounded p-2">
                <div className="text-stone-400 text-xs mb-0.5 md:mb-1">
                  Damage Dealt
                </div>
                <div className="text-red-300 font-bold text-sm md:text-base">
                  {battleStats.playerDamage}
                </div>
              </div>
              <div className="bg-stone-900/50 rounded p-2">
                <div className="text-stone-400 text-xs mb-0.5 md:mb-1">
                  Damage Taken
                </div>
                <div className="text-red-400 font-bold text-sm md:text-base">
                  {battleStats.enemyDamage}
                </div>
              </div>
              <div className="bg-stone-900/50 rounded p-2">
                <div className="text-stone-400 text-xs mb-0.5 md:mb-1">
                  Crits
                </div>
                <div className="text-yellow-400 font-bold text-sm md:text-base">
                  {battleStats.critCount}
                </div>
              </div>
              <div className="bg-stone-900/50 rounded p-2">
                <div className="text-stone-400 text-xs mb-0.5 md:mb-1">
                  Max Damage
                </div>
                <div className="text-orange-400 font-bold text-sm md:text-base">
                  {battleStats.maxDamage}
                </div>
              </div>
            </div>
            <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-stone-700 space-y-1 md:space-y-2">
              <div className="flex items-center justify-between text-stone-300 text-xs md:text-sm">
                <span>HP Before Combat:</span>
                <span className="font-bold">{battleData.playerHpBefore}</span>
              </div>
              <div className="flex items-center justify-between text-stone-300 text-xs md:text-sm">
                <span>HP After Combat:</span>
                <span className="font-bold text-red-400">
                  {battleData.playerHpAfter}
                </span>
              </div>
              <div className="flex items-center justify-between text-red-400 text-xs md:text-sm font-bold">
                <span>HP Loss:</span>
                <span>-{battleData.hpLoss}</span>
              </div>
            </div>
          </div>
        )}

        {/* 角色信息 */}
        <div className="bg-stone-800/50 border-2 border-red-600/50 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
          <h2 className="text-base md:text-lg font-bold text-red-400 mb-2 md:mb-3 flex items-center gap-1 md:gap-2">
            <Heart size={16} className="md:w-5 md:h-5" />
            最终状态
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
              <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
                Rank
              </div>
              <div className="text-stone-200 font-bold text-xs md:text-sm">
                {player.realm}
              </div>
            </div>
            <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
              <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
                Level
              </div>
              <div className="text-stone-200 font-bold text-xs md:text-sm">
                {player.realmLevel}
              </div>
            </div>
            <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
              <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
                XP
              </div>
              <div className="text-stone-200 font-bold text-xs md:text-sm">
                {player.exp}
              </div>
            </div>
            <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
              <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
                Caps
              </div>
              <div className="text-stone-200 font-bold text-xs md:text-sm">
                {player.spiritStones}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
              <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
                Attack
              </div>
              <div className="text-red-300 font-bold text-xs md:text-sm">
                {player.attack}
              </div>
            </div>
            <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
              <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
                Defense
              </div>
              <div className="text-blue-300 font-bold text-xs md:text-sm">
                {player.defense}
              </div>
            </div>
            <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
              <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
                Max HP
              </div>
              <div className="text-pink-300 font-bold text-xs md:text-sm">
                {player.maxHp}
              </div>
            </div>
            <div className="bg-stone-900/50 rounded p-1.5 md:p-2">
              <div className="text-stone-400 text-[10px] md:text-xs mb-0.5 md:mb-1">
                Speed
              </div>
              <div className="text-cyan-300 font-bold text-xs md:text-sm">
                {player.speed}
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="text-center space-y-2">
          {difficulty === 'hard' ? (
            <>
              <button
                onClick={onRebirth}
                className="w-full py-2.5 md:py-3 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-500 hover:via-orange-500 hover:to-red-500 text-white font-bold text-base md:text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 md:gap-3 touch-manipulation"
              >
                <Flame size={18} className="md:w-6 md:h-6" />
                REBORN FROM ASHES
              </button>
              <p className="text-stone-400 text-xs md:text-sm mt-2 md:mt-3">
                Death in Hardcore mode deletes your save. Respawns will reset all data and return to the start screen.
              </p>
            </>
          ) : (
            <>
              {onContinue && (
                <button
                  onClick={onContinue}
                  className="w-full py-2.5 md:py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-500 hover:via-emerald-500 hover:to-green-500 text-white font-bold text-base md:text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 md:gap-3 touch-manipulation"
                >
                  <RotateCcw size={18} className="md:w-6 md:h-6" />
                  Continue Journey
                </button>
              )}
              <button
                onClick={onRebirth}
                className="w-full py-2 md:py-2.5 bg-stone-700 hover:bg-stone-600 text-stone-200 font-semibold text-sm md:text-base rounded-lg transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 touch-manipulation"
              >
                <Flame size={16} className="md:w-5 md:h-5" />
                Rebirth (Start Over)
              </button>
              <p className="text-stone-400 text-xs md:text-sm mt-2">
                {difficulty === 'easy'
                  ? 'No penalty for death in Easy mode. You can continue or restart.'
                  : 'Death in Normal mode results in partial stat and gear loss. You can continue or restart.'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeathModal;
