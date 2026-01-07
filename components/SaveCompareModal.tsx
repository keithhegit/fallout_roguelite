import React from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { compareSaves, SaveData, SaveComparison } from '../utils/saveManagerUtils';
import { formatNumber } from '../utils/formatUtils';
import dayjs from 'dayjs';
import { ASSETS } from '../constants/assets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  save1: SaveData;
  save2: SaveData;
}

const SaveCompareModal: React.FC<Props> = ({ isOpen, onClose, save1, save2 }) => {
  if (!isOpen) return null;

  const comparison: SaveComparison = compareSaves(save1, save2);

  const getDiff = (oldVal: number, newVal: number) => {
    const diff = newVal - oldVal;
    const percent = oldVal !== 0 ? ((diff / oldVal) * 100).toFixed(1) : '∞';
    return { diff, percent, isPositive: diff >= 0 };
  };

  const ComparisonRow = ({
    label,
    oldVal,
    newVal,
    format = (v: number) => v.toString(),
  }: {
    label: string;
    oldVal: number | string;
    newVal: number | string;
    format?: (v: number) => string;
  }) => {
    const isString = typeof oldVal === 'string' || typeof newVal === 'string';
    const oldNum = typeof oldVal === 'number' ? oldVal : 0;
    const newNum = typeof newVal === 'number' ? newVal : 0;
    const { diff, percent, isPositive } = isString
      ? { diff: 0, percent: '0', isPositive: true }
      : getDiff(oldNum, newNum);

    return (
      <tr className="border-b border-stone-800/30 hover:bg-emerald-500/5 transition-colors group">
        <td className="px-4 py-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest group-hover:text-emerald-500/80 transition-colors">
          {label}
        </td>
        <td className="px-4 py-3 text-[10px] font-mono text-stone-500 text-right">
          {isString ? oldVal : format(oldNum)}
        </td>
        <td className="px-4 py-3 text-[10px] font-mono text-stone-300 text-right">
          {isString ? newVal : format(newNum)}
        </td>
        <td className="px-4 py-3 text-right">
          {!isString && (
            <div className="flex items-center justify-end gap-2 font-mono text-[10px] font-bold">
              {diff !== 0 ? (
                <>
                  <span
                    className={
                      isPositive ? 'text-emerald-500' : 'text-red-500'
                    }
                  >
                    {isPositive ? '▲' : '▼'}
                    {isPositive ? '+' : ''}
                    {format(diff)}
                  </span>
                  <span className={`text-[9px] px-1 py-0.5 border ${
                    isPositive ? 'border-emerald-900/50 text-emerald-500/60 bg-emerald-900/10' : 'border-red-900/50 text-red-500/60 bg-red-900/10'
                  }`}>
                    {percent}%
                  </span>
                </>
              ) : (
                <span className="text-stone-600">---</span>
              )}
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-[60] p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 rounded-none border-0 md:border border-stone-800 w-full h-[90vh] md:h-auto md:max-w-4xl md:max-h-[90vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景纹理层 */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
          style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
        />
        
        {/* CRT 扫描线 */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-crt-lines opacity-[0.02]" />

        <div className="bg-stone-900/40 border-b border-stone-800 p-3 md:p-4 flex justify-between items-center rounded-none flex-shrink-0 relative z-10">
          <h2 className="text-lg md:text-xl font-bold text-emerald-500 uppercase tracking-widest">
            [ DATA_DIFFERENTIAL_ANALYSIS ]
          </h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-emerald-500 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="modal-scroll-container modal-scroll-content p-4 md:p-6 space-y-8 relative z-10">
          {/* 基本信息对比 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-emerald-500/30" />
              <h3 className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-[0.2em]">
                CORE_METADATA
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-900/40 border border-stone-800 p-4 relative group/card">
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/card:opacity-[0.02] transition-opacity"
                  style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }} />
                <div className="text-[9px] text-stone-600 mb-2 font-bold uppercase tracking-widest">SOURCE_A</div>
                <div className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-1">
                  {comparison.playerName.old}
                </div>
                <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                  {comparison.realm.old} {comparison.realmLevel.old}_LVL
                </div>
                <div className="text-[9px] text-stone-600 mt-3 font-mono">
                  {dayjs(comparison.timestamp.old).format('YYYY.MM.DD_HH:MM:SS')}
                </div>
              </div>
              <div className="bg-stone-900/40 border border-emerald-900/30 p-4 relative group/card">
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/card:opacity-[0.02] transition-opacity"
                  style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }} />
                <div className="text-[9px] text-emerald-900/60 mb-2 font-bold uppercase tracking-widest">SOURCE_B</div>
                <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  {comparison.playerName.new}
                </div>
                <div className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest">
                  {comparison.realm.new} {comparison.realmLevel.new}_LVL
                </div>
                <div className="text-[9px] text-stone-600 mt-3 font-mono">
                  {dayjs(comparison.timestamp.new).format('YYYY.MM.DD_HH:MM:SS')}
                </div>
              </div>
            </div>
          </div>

          {/* 属性对比表格 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-emerald-500/30" />
              <h3 className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-[0.2em]">
                STATISTICAL_VARIANCE
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent" />
            </div>
            <div className="bg-stone-900/20 border border-stone-800 overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-stone-900/60 border-b border-stone-800">
                    <th className="px-4 py-3 text-left text-[9px] font-bold text-emerald-500/40 uppercase tracking-[0.2em]">PARAMETER</th>
                    <th className="px-4 py-3 text-right text-[9px] font-bold text-emerald-500/40 uppercase tracking-[0.2em]">SOURCE_A</th>
                    <th className="px-4 py-3 text-right text-[9px] font-bold text-emerald-500/40 uppercase tracking-[0.2em]">SOURCE_B</th>
                    <th className="px-4 py-3 text-right text-[9px] font-bold text-emerald-500/40 uppercase tracking-[0.2em]">VARIANCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/20">
                  <ComparisonRow
                    label="境界等级"
                    oldVal={comparison.realmLevel.old}
                    newVal={comparison.realmLevel.new}
                  />
                  <ComparisonRow
                    label="经验值"
                    oldVal={comparison.exp.old}
                    newVal={comparison.exp.new}
                    format={formatNumber}
                  />
                  <ComparisonRow
                    label="最大经验"
                    oldVal={comparison.maxExp.old}
                    newVal={comparison.maxExp.new}
                    format={formatNumber}
                  />
                  <ComparisonRow
                    label="生命值"
                    oldVal={comparison.hp.old}
                    newVal={comparison.hp.new}
                    format={formatNumber}
                  />
                  <ComparisonRow
                    label="最大生命"
                    oldVal={comparison.maxHp.old}
                    newVal={comparison.maxHp.new}
                    format={formatNumber}
                  />
                  <ComparisonRow
                    label="攻击力"
                    oldVal={comparison.attack.old}
                    newVal={comparison.attack.new}
                    format={formatNumber}
                  />
                  <ComparisonRow
                    label="防御力"
                    oldVal={comparison.defense.old}
                    newVal={comparison.defense.new}
                    format={formatNumber}
                  />
                  <ComparisonRow
                    label="灵力"
                    oldVal={comparison.spirit.old}
                    newVal={comparison.spirit.new}
                    format={formatNumber}
                  />
                  <ComparisonRow
                    label="体质"
                    oldVal={comparison.physique.old}
                    newVal={comparison.physique.new}
                    format={formatNumber}
                  />
                  <ComparisonRow
                    label="速度"
                    oldVal={comparison.speed.old}
                    newVal={comparison.speed.new}
                    format={formatNumber}
                  />
                  <ComparisonRow
                    label="灵石"
                    oldVal={comparison.spiritStones.old}
                    newVal={comparison.spiritStones.new}
                    format={formatNumber}
                  />
                  <ComparisonRow
                    label="背包物品数"
                    oldVal={comparison.inventoryCount.old}
                    newVal={comparison.inventoryCount.new}
                  />
                  <ComparisonRow
                    label="装备数量"
                    oldVal={comparison.equipmentCount.old}
                    newVal={comparison.equipmentCount.new}
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* 时间信息 */}
          <div className="text-xs text-stone-500 text-center">
            存档1保存时间: {dayjs(comparison.timestamp.old).format('YYYY-MM-DD HH:mm:ss')}
            <br />
            存档2保存时间: {dayjs(comparison.timestamp.new).format('YYYY-MM-DD HH:mm:ss')}
            <br />
            时间差: {dayjs(comparison.timestamp.new).diff(dayjs(comparison.timestamp.old), 'hour')} 小时
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveCompareModal;

