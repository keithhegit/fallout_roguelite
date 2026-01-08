import React, { useState, useEffect } from 'react';
import { Item, PlayerStats } from '../types';
import {
  UPGRADE_MATERIAL_NAME,
  UPGRADE_STONE_NAME,
  BASE_UPGRADE_COST_STONES,
  BASE_UPGRADE_COST_MATS,
  getUpgradeMultiplier,
  RARITY_MULTIPLIERS,
  UPGRADE_STONE_SUCCESS_BONUS,
} from '../constants/index';
import {
  X,
  Hammer,
  ArrowRight,
  Shield,
  Zap,
  Heart,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  player: PlayerStats;
  onConfirm: (
    item: Item,
    costStones: number,
    costMats: number,
    upgradeStones: number
  ) => Promise<'success' | 'failure' | 'error'>;
  setItemActionLog?: (log: { text: string; type: string } | null) => void;
}

const ArtifactUpgradeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  item,
  player,
  onConfirm,
  setItemActionLog
}) => {
  const [upgradeStones, setUpgradeStones] = useState(0);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // 当 Modal 打开时重置状态
  useEffect(() => {
    if (isOpen && item) {
      setUpgradeStones(0);
      setIsUpgrading(false);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  // 从玩家库存中获取最新的物品信息（确保显示的是最新数据）
  const currentItem = player.inventory.find((i) => i.id === item.id) || item;

  const currentLevel = currentItem.level || 0;
  const nextLevel = currentLevel + 1;
  const rarity = currentItem.rarity || '普通';
  const rarityMult = RARITY_MULTIPLIERS[rarity];

  // Cost Calculation - 每次强化后炼器石需求增加
  // 灵石消耗：基础消耗 * (等级+1) * 品质倍率 * (1 + 等级 * 0.25) - 高等级增长更快
  const costStones = Math.floor(
    BASE_UPGRADE_COST_STONES * (currentLevel + 1) * rarityMult * (1 + currentLevel * 0.25)
  );
  // 材料消耗：基础消耗 * 品质倍率 * (等级+1) * (1 + 等级 * 0.5) - 高等级和品质消耗大幅增加
  const costMats = Math.floor(
    BASE_UPGRADE_COST_MATS * rarityMult * (currentLevel + 1) * (1 + currentLevel * 0.5)
  );

  // 计算基础成功率（根据稀有度和等级）
  const baseSuccessRate = Math.max(
    0.1,
    1 - currentLevel * 0.1 - (rarityMult - 1) * 0.15
  );
  const successRate = Math.min(
    1,
    baseSuccessRate + upgradeStones * UPGRADE_STONE_SUCCESS_BONUS
  );

  // Stat Calculation
  const growthRate = getUpgradeMultiplier(rarity);
  const getNextStat = (val: number) => Math.floor(val * (1 + growthRate));

  // Current Stats (with Rarity applied already in display logic usually, but here we work on base effect for persistent updates or raw numbers)
  // Note: Inventory stores RAW base effects. InventoryModal applies rarity visual multiplier.
  // HOWEVER, the `handleUpgrade` logic updates the raw effect in inventory.
  // So `item.effect` is the source of truth.

  const currentEffect = currentItem.effect || {};
  const nextEffect = {
    attack: currentEffect.attack ? getNextStat(currentEffect.attack) : 0,
    defense: currentEffect.defense ? getNextStat(currentEffect.defense) : 0,
    hp: currentEffect.hp ? getNextStat(currentEffect.hp) : 0,
  };

  // Check Resources
  const playerStones = player.spiritStones;
  const playerMats =
    player.inventory.find((i) => i.name === UPGRADE_MATERIAL_NAME)?.quantity ||
    0;
  const playerUpgradeStones =
    player.inventory.find((i) => i.name === UPGRADE_STONE_NAME)?.quantity || 0;
  const maxUpgradeStones = Math.min(upgradeStones, playerUpgradeStones);
  const canAfford = playerStones >= costStones && playerMats >= costMats;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-[60] p-0 md:p-4 backdrop-blur-sm touch-manipulation font-mono"
      onClick={isUpgrading ? undefined : onClose}
    >
      <div
        className="bg-ink-950 w-full h-[80vh] md:h-auto md:max-w-md rounded-none border-0 md:border border-stone-800 shadow-2xl flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CRT 效果层 */}
        <div className="absolute inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 crt-noise opacity-[0.03]"></div>
          <div className="absolute inset-0 scanline-overlay opacity-[0.05]"></div>
          <div className="absolute inset-0 crt-vignette"></div>
        </div>

        {/* 强化动画覆盖层 */}
        {isUpgrading && (
          <div className="absolute inset-0 bg-ink-950/90 z-[60] flex items-center justify-center">
            <div className="text-center p-8 border border-amber-500/30 bg-ink-900 relative">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 scanline-overlay opacity-10"></div>
              </div>
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-2 border-amber-500/20 rounded-none animate-ping"></div>
                <div className="absolute inset-0 border-2 border-amber-500 border-t-transparent rounded-none animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-amber-400 animate-pulse" size={32} />
                </div>
              </div>
              <div className="text-amber-400 text-xl font-bold animate-pulse uppercase tracking-[0.2em]">
                CALIBRATING...
              </div>
              <div className="text-stone-500 text-[10px] mt-4 uppercase tracking-widest">
                SYNCING QUANTUM DATA / ENHANCING MATRIX
              </div>
            </div>
          </div>
        )}

        <div className="p-3 md:p-4 border-b border-stone-800 flex justify-between items-center bg-ink-900 rounded-none relative z-10">
          <h3 className="text-lg font-mono text-amber-400 flex items-center gap-2 uppercase tracking-widest">
            <Hammer size={18} /> Artifact Calibration
          </h3>
          <button onClick={onClose} className="text-stone-500 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 relative z-10 overflow-y-auto">
          {/* Header Item Info */}
          <div className="text-center border-b border-stone-900 pb-4">
            <h4 className="text-xl font-bold text-stone-200 uppercase tracking-wider">
              {currentItem.name}
            </h4>
            <div className="text-stone-500 text-[10px] mt-1 uppercase tracking-[0.2em]">
              {currentItem.rarity} MODULE // LEVEL +{currentLevel}
            </div>
          </div>

          {/* Stats Comparison */}
          <div className="bg-ink-900/50 p-4 rounded-none border border-stone-800 grid grid-cols-3 gap-2 items-center">
            {/* Current */}
            <div className="space-y-3 text-right">
              {currentEffect.attack !== undefined && (
                <div className="text-stone-500 flex items-center justify-end gap-2 text-xs">
                  {currentEffect.attack} <Zap size={12} className="text-stone-600" />
                </div>
              )}
              {currentEffect.defense !== undefined && (
                <div className="text-stone-500 flex items-center justify-end gap-2 text-xs">
                  {currentEffect.defense} <Shield size={12} className="text-stone-600" />
                </div>
              )}
              {currentEffect.hp !== undefined && (
                <div className="text-stone-500 flex items-center justify-end gap-2 text-xs">
                  {currentEffect.hp} <Heart size={12} className="text-stone-600" />
                </div>
              )}
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-8 h-px bg-stone-800 relative">
                <div className="absolute right-0 -top-[3px] w-2 h-2 border-t border-r border-stone-600 rotate-45"></div>
              </div>
            </div>

            {/* Next */}
            <div className="space-y-3 text-left font-bold">
              {currentEffect.attack !== undefined && (
                <div className="text-emerald-500 flex items-center gap-2 text-xs">
                  <Zap size={12} /> {nextEffect.attack}
                </div>
              )}
              {currentEffect.defense !== undefined && (
                <div className="text-emerald-500 flex items-center gap-2 text-xs">
                  <Shield size={12} /> {nextEffect.defense}
                </div>
              )}
              {currentEffect.hp !== undefined && (
                <div className="text-emerald-500 flex items-center gap-2 text-xs">
                  <Heart size={12} /> {nextEffect.hp}
                </div>
              )}
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-ink-900/50 p-4 rounded-none border border-stone-800">
            <div className="flex justify-between items-center mb-3">
              <span className="text-stone-500 text-[10px] uppercase tracking-widest">Success Probability</span>
              <span
                className={`text-sm font-bold ${successRate >= 0.7 ? 'text-emerald-500' : successRate >= 0.5 ? 'text-yellow-500' : 'text-red-500'}`}
              >
                {Math.floor(successRate * 100)}%
              </span>
            </div>
            <div className="w-full bg-stone-900 rounded-none h-1.5 overflow-hidden border border-stone-800">
              <div
                className={`h-full transition-all duration-500 ${
                  successRate >= 0.7
                    ? 'bg-emerald-500'
                    : successRate >= 0.5
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, successRate * 100)}%` }}
              />
            </div>
          </div>

          {/* Cost */}
          <div className="space-y-3 bg-ink-900/30 p-4 border border-stone-900">
            <div className="flex justify-between items-center text-[10px]">
              <span className={`uppercase tracking-widest ${playerStones >= costStones ? 'text-stone-500' : 'text-red-500'}`}>
                Energy Credits Required
              </span>
              <span className={`font-bold ${playerStones >= costStones ? 'text-amber-400' : 'text-red-500'}`}>
                {playerStones} / {costStones}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className={`uppercase tracking-widest ${playerMats >= costMats ? 'text-stone-500' : 'text-red-500'}`}>
                {UPGRADE_MATERIAL_NAME}
              </span>
              <span className={`font-bold ${playerMats >= costMats ? 'text-stone-200' : 'text-red-500'}`}>
                {playerMats} / {costMats}
              </span>
            </div>
            
            <div className="h-px bg-stone-900 my-2"></div>
            
            <div className="flex justify-between items-center text-[10px]">
              <div className="flex flex-col gap-0.5">
                <span className={`uppercase tracking-widest ${upgradeStones <= playerUpgradeStones ? 'text-stone-500' : 'text-red-500'}`}>
                  {UPGRADE_STONE_NAME}
                </span>
                <span className="text-[9px] text-stone-600 uppercase">+10% PROBABILITY / UNIT</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUpgradeStones(Math.max(0, upgradeStones - 1))}
                  disabled={upgradeStones === 0}
                  className="w-8 h-8 flex items-center justify-center border border-stone-800 hover:bg-stone-900 disabled:opacity-30 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className={`min-w-[40px] text-center font-bold ${upgradeStones > playerUpgradeStones ? 'text-red-500' : 'text-stone-200'}`}>
                  {upgradeStones} / {playerUpgradeStones}
                </span>
                <button
                  onClick={() => setUpgradeStones(Math.min(playerUpgradeStones, upgradeStones + 1))}
                  disabled={upgradeStones >= playerUpgradeStones}
                  className="w-8 h-8 flex items-center justify-center border border-stone-800 hover:bg-stone-900 disabled:opacity-30 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              if (!canAfford || isUpgrading) return;
              setIsUpgrading(true);
              await new Promise(resolve => setTimeout(resolve, 1500));
              try {
                const result = await onConfirm(currentItem, costStones, costMats, upgradeStones);
                if (result === 'success') {
                  if (setItemActionLog) {
                    setItemActionLog({
                      text: `>> SUCCESS: ${currentItem.name} MATRIX ENHANCED`,
                      type: 'special'
                    });
                    setTimeout(() => setItemActionLog && setItemActionLog(null), 3000);
                  }
                  setUpgradeStones(0);
                  setTimeout(() => {
                    setIsUpgrading(false);
                    onClose();
                  }, 500);
                } else if (result === 'failure') {
                  if (setItemActionLog) {
                    setItemActionLog({
                      text: `>> FAILURE: CALIBRATION ABORTED. RESOURCES DEPLETED.`,
                      type: 'danger'
                    });
                    setTimeout(() => setItemActionLog && setItemActionLog(null), 3000);
                  }
                  setIsUpgrading(false);
                  setUpgradeStones(0);
                } else {
                  setIsUpgrading(false);
                }
              } catch (error) {
                setIsUpgrading(false);
                console.error('Upgrade error:', error);
              }
            }}
            disabled={!canAfford || isUpgrading}
            className={`
              w-full py-4 rounded-none font-bold text-sm transition-all relative overflow-hidden uppercase tracking-[0.3em] min-h-[52px]
              ${canAfford && !isUpgrading
                ? 'bg-ink-950 text-amber-400 hover:bg-stone-900 border border-amber-500 active:scale-[0.98]'
                : 'bg-ink-950 text-stone-700 cursor-not-allowed border border-stone-900'}
            `}
          >
            {isUpgrading ? (
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="animate-spin" size={16} />
                <span>PROCESSING...</span>
              </div>
            ) : (
              canAfford ? 'Initialize Calibration' : 'Insufficient Resources'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtifactUpgradeModal;
