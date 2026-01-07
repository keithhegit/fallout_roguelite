import React, { useState, } from 'react';
import { X, Sword, Shield, Zap, Heart, } from 'lucide-react';
import { PlayerStats, DaoCombiningChallengeState } from '../types';
import { ASSETS } from '../constants/assets';
import { HEAVEN_EARTH_SOUL_BOSSES, DAO_COMBINING_CHALLENGE_CONFIG } from '../constants/index';
import { executePlayerAction, executeEnemyTurn, checkBattleEnd, calculateBattleRewards } from '../services/battleService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerStats>>;
  addLog: (message: string, type?: string) => void;
  challengeState: DaoCombiningChallengeState;
  setChallengeState: React.Dispatch<React.SetStateAction<DaoCombiningChallengeState>>;
}

const DaoCombiningChallengeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  player,
  setPlayer,
  addLog,
  challengeState,
  setChallengeState
}) => {
  const [selectedBossId, setSelectedBossId] = useState<string | null>(null);
  const [bossAttempts, setBossAttempts] = useState<Record<string, number>>({});
  // 处理战斗的函数
  const handleBattle = async (battleState: any) => {
    // 使用回合制战斗系统处理战斗
    let currentState = battleState;

    // 战斗循环
    while (!checkBattleEnd(currentState)) {
      if (currentState.isPlayerTurn) {
        // 玩家回合 - 这里需要处理玩家行动
        // 简化处理：玩家自动普通攻击
        const playerAction = { type: 'attack' as const };
        currentState = executePlayerAction(currentState, playerAction);
      } else {
        // 敌人回合
        currentState = executeEnemyTurn(currentState);
      }
    }

    // 计算战斗结果
    const victory = currentState.enemy.hp <= 0;
    const hpLoss = Math.max(0, battleState.player.hp - currentState.player.hp);

    // 计算奖励
    const rewards = calculateBattleRewards(currentState, player);

    return {
      victory,
      hpLoss,
      expChange: rewards.expChange,
      spiritChange: rewards.spiritChange,
      summary: victory ?
        `Success! You defeated 【${currentState.enemy.name}】! Recovered ${rewards.expChange} XP and ${rewards.spiritChange} Caps!` :
        `Challenge 【${currentState.enemy.name}】 failed! Lost ${hpLoss} HP.`
    };
  };

  // 检查解锁条件
  const canChallengeDaoCombining = () => {
    if (player.realm !== DAO_COMBINING_CHALLENGE_CONFIG.requiredRealm || player.realmLevel < DAO_COMBINING_CHALLENGE_CONFIG.requiredRealmLevel) {
      return false;
    }

    if (!player.heavenEarthMarrow) {
      return false;
    }

    // 检查属性是否足够
    const totalStats = player.attack + player.defense + player.spirit + player.physique + player.speed;
    return totalStats > 100000;
  };

  // 选择BOSS
  const handleSelectBoss = (bossId: string) => {
    const boss = HEAVEN_EARTH_SOUL_BOSSES[bossId];
    const attempts = bossAttempts[bossId] || 0;

    if (attempts >= DAO_COMBINING_CHALLENGE_CONFIG.maxBossAttempts) {
      addLog(`该BOSS的挑战次数已达上限（${DAO_COMBINING_CHALLENGE_CONFIG.maxBossAttempts}次）！`, 'danger');
      return;
    }

    setSelectedBossId(bossId);
    addLog(`Engagement selected: 【${boss.name}】! Prepare for high-intensity combat!`, 'special');
  };

  // 开始挑战
  const handleStartChallenge = async () => {
    if (!selectedBossId) return;

    const boss = HEAVEN_EARTH_SOUL_BOSSES[selectedBossId];

    // 生成随机强度倍数
    const [min, max] = DAO_COMBINING_CHALLENGE_CONFIG.bossStrengthMultiplierRange;
    const strengthMultiplier = Math.random() * (max - min) + min;

    setChallengeState({
      isOpen: true,
      bossId: selectedBossId,
      bossStrengthMultiplier: strengthMultiplier,
      battleResult: null
    });

    // 创建战斗状态
    const battleState = {
      id: `dao_combining_${Date.now()}`,
      round: 0,
      turn: 'player' as const,
      player: {
        id: 'player',
        name: player.name,
        realm: player.realm,
        hp: player.hp,
        maxHp: player.maxHp,
        attack: player.attack,
        defense: player.defense,
        speed: player.speed,
        spirit: player.spirit,
        buffs: [],
        debuffs: [],
        skills: [],
        cooldowns: {},
        mana: 1000,
        maxMana: 1000,
        isDefending: false
      },
      enemy: {
        id: boss.id,
        name: boss.name,
        realm: boss.realm,
        hp: boss.baseStats.hp * strengthMultiplier,
        maxHp: boss.baseStats.hp * strengthMultiplier,
        attack: boss.baseStats.attack * strengthMultiplier,
        defense: boss.baseStats.defense * strengthMultiplier,
        speed: boss.baseStats.speed,
        spirit: boss.baseStats.spirit * strengthMultiplier,
        buffs: [],
        debuffs: [],
        skills: boss.specialSkills,
        cooldowns: {},
        mana: 2000,
        maxMana: 2000,
        isDefending: false
      },
      history: [],
      isPlayerTurn: true,
      waitingForPlayerAction: true,
      playerInventory: player.inventory,
      playerActionsRemaining: 1,
      enemyActionsRemaining: 1,
      playerMaxActions: 1,
      enemyMaxActions: 1,
      enemyStrengthMultiplier: strengthMultiplier,
      adventureType: 'normal' as const,
      riskLevel: 'Extreme' as const
    };

    // 进行战斗
    const result = await handleBattle(battleState);

    setChallengeState(prev => ({
      ...prev,
      battleResult: result
    }));

    // 更新挑战次数
    setBossAttempts(prev => ({
      ...prev,
      [selectedBossId]: (prev[selectedBossId] || 0) + 1
    }));

    if (result.victory) {
      // 胜利奖励
      setPlayer(prev => ({
        ...prev,
        exp: prev.exp + boss.rewards.exp,
        spiritStones: prev.spiritStones + boss.rewards.spiritStones,
        daoCombiningChallenged: true
      }));

      addLog(`Success! You defeated 【${boss.name}】! Recovered ${boss.rewards.exp.toLocaleString()} XP and ${boss.rewards.spiritStones.toLocaleString()} Caps!`, 'gain');
      addLog('Engagement Clearance Granted! You may now attempt to ascend to the high-rank realm!', 'special');
    } else {
      addLog(`Failure! Engagement with 【${boss.name}】 failed. Improve your survival parameters.`, 'danger');
    }
  };

  // 获取BOSS难度颜色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'normal': return 'text-blue-500';
      case 'hard': return 'text-orange-500';
      case 'extreme': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-ink-950 rounded-none max-w-4xl w-full max-h-[90vh] overflow-hidden border border-stone-800 shadow-2xl relative flex flex-col group">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
        {/* CRT 扫描线效果 */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
        
        <div className="flex items-center justify-between p-6 border-b border-stone-800 bg-stone-950 relative z-10">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-emerald-500">
            [ APEX_CHALLENGE: ENTITY_NEUTRALIZATION ]
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto relative z-10">
          {/* Challenge Briefing */}
          <div className="mb-6 p-4 bg-stone-900/40 border border-stone-800 rounded-none">
            <h3 className="text-sm font-bold text-emerald-500 mb-2 uppercase tracking-widest">
              > MISSION_BRIEFING
            </h3>
            <p className="text-stone-300 text-sm leading-relaxed">
              To cross the final frontier and achieve Apex status, you must neutralize a high-threat Wasteland Entity. Proving your combat superiority is mandatory for final elevation.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-[10px] text-stone-500 uppercase tracking-widest font-bold">
              <p>• Guardian IX / Spirit Severing IX required</p>
              <p>• Wasteland Essence Requisition required</p>
              <p>• Superior Biological Parameters required</p>
              <p>• Engagement Limit: {DAO_COMBINING_CHALLENGE_CONFIG.maxBossAttempts} per target</p>
            </div>
          </div>

          {/* Requirement Check */}
          {!canChallengeDaoCombining() && (
            <div className="mb-6 p-4 bg-red-900/10 border border-red-900/30 rounded-none">
              <h3 className="text-sm font-bold text-red-500 mb-2 uppercase tracking-widest">
                ! CRITICAL_REQUIREMENTS_NOT_MET
              </h3>
              <ul className="text-stone-400 text-xs space-y-1 uppercase tracking-wider">
                {player.realm !== DAO_COMBINING_CHALLENGE_CONFIG.requiredRealm && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-900 rounded-full"></span>
                    Rank insufficient: Need {DAO_COMBINING_CHALLENGE_CONFIG.requiredRealm}
                  </li>
                )}
                {player.realmLevel < DAO_COMBINING_CHALLENGE_CONFIG.requiredRealmLevel && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-900 rounded-full"></span>
                    Level insufficient: Need IX
                  </li>
                )}
                {!player.heavenEarthMarrow && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-900 rounded-full"></span>
                    Requisition missing: Need Wasteland Essence
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* BOSS选择 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(HEAVEN_EARTH_SOUL_BOSSES).map(([bossId, boss]) => {
              const attempts = bossAttempts[bossId] || 0;
              const remainingAttempts = DAO_COMBINING_CHALLENGE_CONFIG.maxBossAttempts - attempts;
              const isSelected = selectedBossId === bossId;
              const isMaxAttempts = attempts >= DAO_COMBINING_CHALLENGE_CONFIG.maxBossAttempts;

              return (
                <div
                  key={bossId}
                  className={`p-4 border-2 rounded-none cursor-pointer transition-all relative group/card ${isSelected
                      ? 'border-emerald-500 bg-emerald-900/10'
                      : isMaxAttempts
                        ? 'border-red-900/30 bg-red-900/5 opacity-60 grayscale'
                        : 'border-stone-800 bg-stone-900/40 hover:border-emerald-800'
                    }`}
                  onClick={() => !isMaxAttempts && handleSelectBoss(bossId)}
                >
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover/card:opacity-[0.05] transition-opacity" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-stone-100 uppercase tracking-widest">{boss.name}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 border ${isSelected ? 'border-emerald-500/50' : 'border-stone-700'} ${getDifficultyColor(boss.difficulty)}`}>
                        {boss.difficulty}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 mb-4 leading-relaxed line-clamp-2 italic">
                      "{boss.description}"
                    </p>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                      <div className="flex items-center justify-between border-b border-stone-800/50 pb-1">
                        <span className="text-[10px] text-stone-500 uppercase font-bold">ATK</span>
                        <span className="text-[10px] text-stone-300 font-mono">{boss.baseStats.attack.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-stone-800/50 pb-1">
                        <span className="text-[10px] text-stone-500 uppercase font-bold">DEF</span>
                        <span className="text-[10px] text-stone-300 font-mono">{boss.baseStats.defense.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-stone-800/50 pb-1">
                        <span className="text-[10px] text-stone-500 uppercase font-bold">HP</span>
                        <span className="text-[10px] text-stone-300 font-mono">{boss.baseStats.hp.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-stone-800/50 pb-1">
                        <span className="text-[10px] text-stone-500 uppercase font-bold">AP</span>
                        <span className="text-[10px] text-stone-300 font-mono">{boss.baseStats.spirit.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                      <span className={isMaxAttempts ? 'text-red-500' : 'text-stone-600'}>
                        Attempts: {attempts}/{DAO_COMBINING_CHALLENGE_CONFIG.maxBossAttempts}
                      </span>
                      {isMaxAttempts && (
                        <span className="text-red-500/70">[ LOCKED ]</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Battle Result */}
          {challengeState.battleResult && (
            <div className={`mb-6 p-4 rounded-none border ${challengeState.battleResult.victory
                ? 'bg-emerald-900/10 border-emerald-800/50'
                : 'bg-red-900/10 border-red-800/50'
              }`}>
              <h3 className={`text-sm font-bold mb-2 uppercase tracking-widest ${challengeState.battleResult.victory ? 'text-emerald-500' : 'text-red-500'}`}>
                {challengeState.battleResult.victory ? '> MISSION_SUCCESS' : '! MISSION_FAILURE'}
              </h3>
              <p className="text-stone-300 text-xs leading-relaxed uppercase tracking-wider font-bold">
                {challengeState.battleResult.summary}
              </p>
            </div>
          )}

          {/* 行动按钮 */}
          <div className="flex justify-end gap-4 mt-2">
            <button
              onClick={onClose}
              className="px-6 py-2 text-stone-500 border border-stone-800 rounded-none hover:bg-stone-900 hover:text-stone-300 transition-all uppercase tracking-widest font-bold text-xs"
            >
              [ CANCEL ]
            </button>

            {canChallengeDaoCombining() && selectedBossId && (
              <button
                onClick={handleStartChallenge}
                className="px-8 py-2 bg-emerald-900/20 text-emerald-500 border border-emerald-800 rounded-none hover:bg-emerald-900/40 transition-all uppercase tracking-widest font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                disabled={!selectedBossId}
              >
                [ COMMENCE_ENGAGEMENT ]
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaoCombiningChallengeModal;