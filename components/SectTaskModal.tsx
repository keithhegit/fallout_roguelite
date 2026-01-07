import React, { useState, useEffect } from 'react';
import { PlayerStats, AdventureResult } from '../types';
import { ASSETS } from '../constants/assets';
import { RandomSectTask } from '../services/randomService';
import {
  initializeEventTemplateLibrary,
  getRandomEventTemplate,
  templateToAdventureResult,
} from '../services/adventureTemplateService';
import { X, Loader2 } from 'lucide-react';
import { logger } from '../utils/logger';
import { getPlayerTotalStats } from '../utils/statUtils';


interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: RandomSectTask;
  player: PlayerStats;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
  onTaskComplete: (task: RandomSectTask, encounterResult?: AdventureResult, isPerfectCompletion?: boolean) => void;
}

const SectTaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  task,
  player,
  setItemActionLog,
  onTaskComplete,
}) => {
  const [stage, setStage] = useState<'preparing' | 'executing' | 'encounter' | 'complete'>('preparing');
  const [progress, setProgress] = useState(0);
  const [encounterResult, setEncounterResult] = useState<AdventureResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStage('preparing');
      setProgress(0);
      setEncounterResult(null);
    }
  }, [isOpen, task.id]);

  const difficultyColors = {
    'Easy': 'text-green-500',
    'Normal': 'text-blue-500',
    'Hard': 'text-orange-500',
    'Extreme': 'text-red-500',
  };

  const difficultyBgColors = {
    'Easy': 'bg-green-900/10 border-green-900/30',
    'Normal': 'bg-blue-900/10 border-blue-900/30',
    'Hard': 'bg-orange-900/10 border-orange-900/30',
    'Extreme': 'bg-red-900/10 border-red-900/30',
  };

  const handleStartTask = async () => {
    try {
      logger.log('Beginning Op:', task);
      setStage('executing');
      setLoading(true);
      setProgress(0);

      // 根据推荐属性计算成功率加成
      let statBonus = 0;
      if (task.recommendedFor) {
        if (task.recommendedFor.highAttack) statBonus += (player.attack / 500);
        if (task.recommendedFor.highDefense) statBonus += (player.defense / 250);
        if (task.recommendedFor.highSpirit) statBonus += (player.spirit / 100);
        if (task.recommendedFor.highSpeed) statBonus += (player.speed / 100);
      }

      // 限制加成上限为 20%
      const finalStatBonus = Math.min(20, statBonus);

      // 模拟任务执行进度
      const duration = {
        'instant': 800,
        'short': 1500,
        'medium': 3000,
        'long': 5000,
      }[task.timeCost] || 2000;

      const steps = 20;
      const stepDuration = duration / steps;

      // Difficulty specific encounter chances
      const encounterChance = {
        'Easy': 0.05,   // 5%
        'Normal': 0.10,   // 10%
        'Hard': 0.15,   // 15%
        'Extreme': 0.20,   // 20%
      }[task.difficulty] || 0.10;

      for (let i = 0; i <= steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, stepDuration));
        setProgress((i / steps) * 100);

        // 在任务执行过程中根据难度随机触发事件
        if (i === Math.floor(steps / 2) && Math.random() < encounterChance) {
          setLoading(false);
          setStage('encounter');

          try {
            // 使用事件模板库生成奇遇事件
            initializeEventTemplateLibrary();
            // Select risk level based on difficulty
            const riskLevel = task.difficulty === 'Easy' ? 'Low' :
              task.difficulty === 'Normal' ? 'Low' :
                task.difficulty === 'Hard' ? 'Medium' : 'High';
            const template = getRandomEventTemplate('lucky', riskLevel, player.realm, player.realmLevel);

            if (template) {
              // 使用实际最大血量（包含金丹法数加成等）
              const totalStats = getPlayerTotalStats(player);
              const result = templateToAdventureResult(template, {
                realm: player.realm,
                realmLevel: player.realmLevel,
                maxHp: totalStats.maxHp,
              });
              setEncounterResult(result);

              // 使用 setItemActionLog 提示
              if (setItemActionLog && result.story) {
                setItemActionLog({
                  text: `✨ Encountered an anomaly during Op: ${result.story.substring(0, 30)}${result.story.length > 30 ? '...' : ''}`,
                  type: result.eventColor || 'special',
                });
              }
            } else {
              // 如果模板库为空，使用默认事件
              const defaultResult = {
                story: 'You found some stray supplies while on the run.',
                hpChange: 0,
                expChange: Math.floor(50 * (1 + 0.3)),
                spiritStonesChange: Math.floor(30 * (1 + 0.3)),
                eventColor: 'gain' as const,
              };
              setEncounterResult(defaultResult);

              if (setItemActionLog) {
                setItemActionLog({
                  text: '✨ Random Encounter: You found some stray supplies while on the run.',
                  type: 'special',
                });
              }
            }
          } catch (error) {
            console.error('Encounter generation failed:', error);
            const difficultyMultiplier = {
              'Easy': 0.7,
              'Normal': 1,
              'Hard': 1.5,
              'Extreme': 2.5,
            }[task.difficulty] || 1;

            const fallbackResult = {
              story: 'You encountered an veteran scavenger who shared some wasteland tips.',
              hpChange: 0,
              expChange: Math.floor(50 * difficultyMultiplier),
              spiritStonesChange: Math.floor(100 * difficultyMultiplier),
              eventColor: 'special' as const,
            };
            setEncounterResult(fallbackResult);

            if (setItemActionLog) {
              setItemActionLog({
                text: '✨ Random Encounter: You encountered an veteran scavenger who shared some wasteland tips.',
                type: 'special',
              });
            }
          }
          return;
        }
      }

      setLoading(false);
      setStage('complete');
    } catch (error) {
      console.error('Operation execution error:', error);
      setLoading(false);
      setStage('complete');
    }
  };

  const handleEncounterContinue = async () => {
    try {
      setStage('executing');
      setLoading(true);

      // 继续任务执行，从50%进度开始
      const duration = {
        'instant': 800,
        'short': 1500,
        'medium': 3000,
        'long': 5000,
      }[task.timeCost] || 2000;

      const steps = 20;
      const stepDuration = duration / steps;
      const startProgress = 50; // 从50%开始，因为奇遇发生在中间

      for (let i = Math.floor(steps / 2); i <= steps; i++) {
        await new Promise((resolve) => setTimeout(resolve, stepDuration));
        setProgress((i / steps) * 100);
      }

      setLoading(false);
      setStage('complete');
    } catch (error) {
      console.error('Resume operation error:', error);
      setLoading(false);
      setStage('complete');
    }
  };

  const handleComplete = () => {
    // 计算最终成功率
    let successRate = task.successRate ?? 75;

    // 加上属性加成
    if (task.recommendedFor) {
      const attackBonus = task.recommendedFor.highAttack ? (player.attack / 1000) * 10 : 0;
      const defenseBonus = task.recommendedFor.highDefense ? (player.defense / 500) * 10 : 0;
      const spiritBonus = task.recommendedFor.highSpirit ? (player.spirit / 200) * 10 : 0;
      const speedBonus = task.recommendedFor.highSpeed ? (player.speed / 200) * 10 : 0;
      successRate += (attackBonus + defenseBonus + spiritBonus + speedBonus);
    }

    const isPerfectCompletion = Math.random() * 100 < Math.min(95, successRate);

    onTaskComplete(task, encounterResult || undefined, isPerfectCompletion);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
      onClick={(e) => {
        // Prevent event propagation to SectModal
        e.stopPropagation();
        // Close task modal on background click
        onClose();
      }}
    >
      <div
        className="bg-ink-950 w-full max-w-2xl md:rounded-none border border-stone-800 shadow-2xl relative flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
        {/* CRT 扫描线效果 */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>

        {/* Header */}
        <div className="p-4 border-b border-stone-800 bg-stone-950 z-10 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-emerald-500 mb-1 uppercase tracking-widest">
              {task.name.replace(/\s+/g, '_')}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-none border font-bold uppercase tracking-widest ${difficultyColors[task.difficulty]} ${difficultyBgColors[task.difficulty]}`}>
                DIFF: {task.difficulty.toUpperCase()}
              </span>
              <span className="text-[10px] text-stone-600 uppercase tracking-widest">
                DURATION: {
                  task.timeCost === 'instant' ? 'INSTANT' :
                    task.timeCost === 'short' ? 'SHORT' :
                      task.timeCost === 'medium' ? 'MEDIUM' : 'LONG'
                }
              </span>
              {task.recommendedFor && (
                <div className="flex gap-1 ml-auto">
                  {task.recommendedFor.highAttack && <span className="text-[8px] bg-red-900/10 text-red-500 border border-red-900/30 px-1 py-0.5 rounded-none uppercase tracking-tighter">HIGH_FP_REC</span>}
                  {task.recommendedFor.highDefense && <span className="text-[8px] bg-blue-900/10 text-blue-500 border border-blue-900/30 px-1 py-0.5 rounded-none uppercase tracking-tighter">HIGH_DR_REC</span>}
                  {task.recommendedFor.highSpirit && <span className="text-[8px] bg-purple-900/10 text-purple-500 border border-purple-900/30 px-1 py-0.5 rounded-none uppercase tracking-tighter">HIGH_PER_REC</span>}
                  {task.recommendedFor.highSpeed && <span className="text-[8px] bg-green-900/10 text-green-500 border border-green-900/30 px-1 py-0.5 rounded-none uppercase tracking-tighter">HIGH_AGI_REC</span>}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-stone-600 hover:text-emerald-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 z-10 overflow-y-auto max-h-[70vh]">
          {stage === 'preparing' && (
            <div className="space-y-6">
              <p className="text-[11px] text-stone-500 uppercase tracking-tighter leading-relaxed">
                {task.description}
              </p>

              <div className="bg-stone-900/40 p-4 rounded-none border border-stone-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                <h4 className="text-[10px] font-bold text-stone-400 mb-3 uppercase tracking-widest border-b border-stone-800 pb-2">OPERATIONAL_REWARDS_MANIFEST</h4>
                <div className="space-y-1.5 text-[10px] text-stone-500 uppercase tracking-widest">
                  <div className="flex justify-between">
                    <span>COMMENDATIONS:</span>
                    <span className="text-emerald-500 font-bold">{task.reward.contribution}</span>
                  </div>
                  {task.reward.exp && (
                    <div className="flex justify-between">
                      <span>NEURAL_DATA:</span>
                      <span className="text-blue-500 font-bold">{task.reward.exp}</span>
                    </div>
                  )}
                  {task.reward.spiritStones && (
                    <div className="flex justify-between">
                      <span>CAPS:</span>
                      <span className="text-yellow-500 font-bold">{task.reward.spiritStones}</span>
                    </div>
                  )}
                  {task.reward.items && task.reward.items.length > 0 && (
                    <div className="flex justify-between flex-wrap gap-2">
                      <span>EQUIPMENT:</span>
                      <div className="flex gap-2">
                        {task.reward.items.map((item, idx) => (
                          <span key={idx} className="text-stone-300 font-bold">[{item.name.toUpperCase().replace(/\s+/g, '_')} x{item.quantity}]</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {task.completionBonus && (
                  <div className="mt-4 pt-4 border-t border-stone-800 border-dashed">
                    <div className="text-[9px] text-stone-600 mb-2 uppercase tracking-widest">PERFECT_EXECUTION_BONUS:</div>
                    <div className="space-y-1 text-[9px] text-stone-500 uppercase tracking-widest">
                      {task.completionBonus.contribution && (
                        <div className="flex justify-between">
                          <span>COMMENDATIONS:</span>
                          <span className="text-emerald-700">+{task.completionBonus.contribution}</span>
                        </div>
                      )}
                      {task.completionBonus.exp && (
                        <div className="flex justify-between">
                          <span>NEURAL_DATA:</span>
                          <span className="text-blue-700">+{task.completionBonus.exp}</span>
                        </div>
                      )}
                      {task.completionBonus.spiritStones && (
                        <div className="flex justify-between">
                          <span>CAPS:</span>
                          <span className="text-yellow-700">+{task.completionBonus.spiritStones}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {task.successRate && (
                  <div className="mt-4 text-[9px] text-stone-700 uppercase tracking-widest flex justify-between">
                    <span>FLAWLESS_EXECUTION_PROBABILITY:</span>
                    <span className="text-yellow-600 font-bold">{task.successRate}%</span>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  logger.log('Operation started');
                  handleStartTask();
                }}
                disabled={loading}
                className={`w-full py-3 border rounded-none transition-colors font-bold uppercase tracking-widest text-xs ${loading
                  ? 'bg-stone-900 text-stone-700 border-stone-800 cursor-not-allowed'
                  : 'bg-emerald-900/20 text-emerald-500 border-emerald-800/50 hover:bg-emerald-900/40'
                  }`}
              >
                {loading ? '[ EXECUTING... ]' : '[ BEGIN_OPERATION ]'}
              </button>
            </div>
          )}

          {stage === 'executing' && (
            <div className="space-y-6 py-10">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-6 opacity-50" />
                <p className="text-[10px] text-stone-500 mb-6 uppercase tracking-[0.2em] font-bold">EXECUTING_PROTOCOL...</p>

                {/* Progress Bar */}
                <div className="w-full bg-stone-900 border border-stone-800 h-6 mb-2 relative overflow-hidden">
                  <div
                    className="bg-emerald-500/30 h-full transition-all duration-300 relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-scanlines opacity-20"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-emerald-500 tracking-widest">{Math.floor(progress)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {stage === 'encounter' && !encounterResult && (
            <div className="space-y-6 py-10 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4 opacity-50" />
              <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-bold">INTERCEPTING_SIGNAL...</p>
            </div>
          )}

          {stage === 'encounter' && encounterResult && (
            <div className="space-y-6">
              <div className="bg-stone-900/40 p-4 rounded-none border border-stone-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                <h4 className="text-sm font-bold text-emerald-500 mb-3 uppercase tracking-widest border-b border-stone-800 pb-2 flex items-center gap-2">
                  <span className="animate-pulse">⚡</span> RANDOM_ENCOUNTER_DETECTED
                </h4>
                <p className="text-[11px] text-stone-500 whitespace-pre-wrap mb-6 uppercase tracking-tighter leading-relaxed">
                  {encounterResult.story}
                </p>

                {(encounterResult.expChange !== 0 || encounterResult.spiritStonesChange !== 0 || encounterResult.hpChange !== 0) && (
                  <div className="space-y-1.5 text-[10px] uppercase tracking-widest p-3 bg-stone-950 border border-stone-800">
                    {encounterResult.expChange > 0 && (
                      <div className="text-blue-500 font-bold">DATA_RECOVERED: +{encounterResult.expChange}</div>
                    )}
                    {encounterResult.spiritStonesChange > 0 && (
                      <div className="text-yellow-500 font-bold">CAPS_FOUND: +{encounterResult.spiritStonesChange}</div>
                    )}
                    {encounterResult.hpChange !== 0 && (
                      <div className={encounterResult.hpChange > 0 ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                        VITAL_SIGNS: {encounterResult.hpChange > 0 ? '+' : ''}{encounterResult.hpChange}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleEncounterContinue}
                className="w-full py-3 bg-emerald-900/20 text-emerald-500 border border-emerald-800/50 hover:bg-emerald-900/40 rounded-none transition-colors font-bold uppercase tracking-widest text-xs"
              >
                [ RESUME_OPERATION ]
              </button>
            </div>
          )}

          {stage === 'complete' && (() => {
            const successRate = task.successRate ?? 75;
            const isPerfectCompletion = Math.random() * 100 < successRate;
            return (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <div className="text-4xl mb-6 grayscale opacity-50">{isPerfectCompletion ? '⭐' : '✓'}</div>
                  <p className="text-lg font-bold text-emerald-500 mb-2 uppercase tracking-[0.2em]">
                    {isPerfectCompletion ? 'FLAWLESS_EXECUTION' : 'OPERATION_SUCCESS'}
                  </p>
                  <p className="text-[10px] text-stone-600 uppercase tracking-widest">
                    {isPerfectCompletion
                      ? 'OBJECTIVES_SECURED_WITH_MAXIMUM_EFFICIENCY'
                      : 'OBJECTIVES_SECURED_WITH_STANDARD_PROTOCOL'}
                  </p>
                </div>

                {encounterResult && (
                  <div className="bg-stone-900/40 p-4 rounded-none border border-stone-800 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
                    <h4 className="text-[10px] font-bold text-stone-400 mb-3 uppercase tracking-widest border-b border-stone-800 pb-2">ADDITIONAL_ENCOUNTER_DATA</h4>
                    <div className="space-y-1.5 text-[10px] text-stone-500 uppercase tracking-widest">
                      {encounterResult.expChange > 0 && (
                        <div className="flex justify-between">
                          <span>NEURAL_DATA:</span>
                          <span className="text-blue-500 font-bold">+{encounterResult.expChange}</span>
                        </div>
                      )}
                      {encounterResult.spiritStonesChange > 0 && (
                        <div className="flex justify-between">
                          <span>CAPS:</span>
                          <span className="text-yellow-500 font-bold">+{encounterResult.spiritStonesChange}</span>
                        </div>
                      )}
                      {encounterResult.hpChange !== 0 && (
                        <div className="flex justify-between">
                          <span>VITAL_STATUS:</span>
                          <span className={encounterResult.hpChange > 0 ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                            {encounterResult.hpChange > 0 ? '+' : ''}{encounterResult.hpChange}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleComplete}
                  className="w-full py-3 bg-emerald-900/20 text-emerald-500 border border-emerald-800/50 hover:bg-emerald-900/40 rounded-none transition-colors font-bold uppercase tracking-widest text-xs"
                >
                  [ CONFIRM_AND_EXTRACT ]
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default SectTaskModal;

