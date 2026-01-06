import React, { useState, } from 'react';
import { X, Sword, Shield, Zap, Heart, } from 'lucide-react';
import { PlayerStats, DaoCombiningChallengeState } from '../types';
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-paper-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-stone-600 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-stone-600 bg-ink-800 rounded-t">
          <h2 className="text-2xl font-serif text-mystic-gold">
            The Apex Challenge: Wasteland Entities
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Challenge Briefing */}
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">
              MISSION BRIEFING
            </h3>
            <p className="text-stone-300">
              To cross the final frontier and achieve Apex status, you must neutralize a high-threat Wasteland Entity. Proving your combat superiority is mandatory for final elevation.
            </p>
            <div className="mt-2 text-sm text-stone-400">
              <p>• Requires Guardian IX / Spirit Severing IX</p>
              <p>• Requires Wasteland Essence Requisition</p>
              <p>• Requires Superior Biological Parameters</p>
              <p>• Engagement Limit: {DAO_COMBINING_CHALLENGE_CONFIG.maxBossAttempts} per target</p>
            </div>
          </div>

          {/* Requirement Check */}
          {!canChallengeDaoCombining() && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
              <h3 className="text-lg font-semibold text-red-300 mb-2">
                CRITICAL REQUIREMENTS NOT MET
              </h3>
              <ul className="text-stone-300 space-y-1">
                {player.realm !== DAO_COMBINING_CHALLENGE_CONFIG.requiredRealm && (
                  <li>• Rank insufficient: Need {DAO_COMBINING_CHALLENGE_CONFIG.requiredRealm}</li>
                )}
                {player.realmLevel < DAO_COMBINING_CHALLENGE_CONFIG.requiredRealmLevel && (
                  <li>• Level insufficient: Need IX</li>
                )}
                {!player.heavenEarthMarrow && (
                  <li>• Requisition missing: Need Wasteland Essence</li>
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
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                      ? 'border-blue-500 bg-blue-900/30'
                      : isMaxAttempts
                        ? 'border-red-900/50 bg-red-900/10 opacity-60'
                        : 'border-stone-700 bg-ink-800/50 hover:border-blue-700'
                    }`}
                  onClick={() => !isMaxAttempts && handleSelectBoss(bossId)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-stone-100">{boss.name}</h3>
                    <span className={`text-sm font-medium ${getDifficultyColor(boss.difficulty)}`}>
                      {boss.difficulty === 'easy' ? 'Easy' :
                        boss.difficulty === 'normal' ? 'Normal' :
                          boss.difficulty === 'hard' ? 'Hard' : 'Extreme'}
                    </span>
                  </div>

                  <p className="text-sm text-stone-400 mb-3">
                    {boss.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-stone-300">
                    <div className="flex items-center">
                      <Sword size={12} className="mr-1 text-stone-500" />
                      <span>ATK: {boss.baseStats.attack.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Shield size={12} className="mr-1 text-stone-500" />
                      <span>DEF: {boss.baseStats.defense.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Heart size={12} className="mr-1 text-stone-500" />
                      <span>HP: {boss.baseStats.hp.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center">
                      <Zap size={12} className="mr-1 text-stone-500" />
                      <span>AP: {boss.baseStats.spirit.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-stone-500">
                      Attempts: {attempts}/{DAO_COMBINING_CHALLENGE_CONFIG.maxBossAttempts}
                    </span>
                    {isMaxAttempts && (
                      <span className="text-xs text-red-400">ENGAGEMENT LIMIT REACHED</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Battle Result */}
          {challengeState.battleResult && (
            <div className={`mb-6 p-4 rounded-lg ${challengeState.battleResult.victory
                ? 'bg-green-900/20 border border-green-800/50'
                : 'bg-red-900/20 border border-red-800/50'
              }`}>
              <h3 className={`text-lg font-semibold mb-2 ${challengeState.battleResult.victory ? 'text-green-300' : 'text-red-300'}`}>
                {challengeState.battleResult.victory ? 'MISSION SUCCESS' : 'MISSION FAILURE'}
              </h3>
              <p className="text-stone-300">
                {challengeState.battleResult.summary}
              </p>
            </div>
          )}

          {/* 行动按钮 */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              取消
            </button>

            {canChallengeDaoCombining() && selectedBossId && (
              <button
                onClick={handleStartChallenge}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!selectedBossId}
              >
                开始挑战
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DaoCombiningChallengeModal;