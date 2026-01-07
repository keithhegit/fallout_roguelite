import React, { useState, useEffect } from 'react';
import { X, Play, Settings } from 'lucide-react';
import { ASSETS } from '../constants/assets';

export interface AutoAdventureConfig {
  skipBattle: boolean; // 是否跳过战斗
  fleeOnBattle: boolean; // 遇到战斗是否逃跑
  skipShop: boolean; // 是否跳过商店
  skipReputationEvent: boolean; // 是否跳过声望事件
  minHpThreshold: number; // 血量阈值，低于此值时自动停止历练（0表示不限制）
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: AutoAdventureConfig) => void;
  currentConfig?: AutoAdventureConfig;
}

const defaultConfig: AutoAdventureConfig = {
  skipBattle: true,
  fleeOnBattle: false,
  skipShop: true, // 默认跳过商店
  skipReputationEvent: true,
  minHpThreshold: 20, // 默认不限制
};

const AutoAdventureConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  currentConfig = defaultConfig,
}) => {
  const [config, setConfig] = useState<AutoAdventureConfig>(currentConfig);

  // 修复状态同步问题：当模态框打开或配置变化时，同步内部状态
  useEffect(() => {
    if (isOpen) {
      setConfig(currentConfig);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(config);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 crt-screen"
    >
      <div
        className="bg-ink-950 w-full max-w-md rounded-none border border-stone-800 shadow-2xl relative overflow-hidden flex flex-col font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景纹理层 */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
          style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
        />

        {/* CRT Visual Layers */}
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
        <div className="crt-noise"></div>
        <div className="crt-vignette"></div>

        {/* 头部 */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-stone-800 bg-stone-950/50 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-900 border border-stone-800 flex items-center justify-center text-emerald-500/80 shadow-inner relative group overflow-hidden">
              <div 
                className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
              />
              <Settings size={24} className="relative z-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-200 tracking-[0.2em] uppercase">AUTO_EXPEDITION</h2>
              <p className="text-[10px] text-stone-600 tracking-widest uppercase">CONFIG_INTERFACE // PROTOCOL_V4.2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-stone-600 hover:text-red-500 hover:bg-red-950/10 transition-all border border-stone-800 hover:border-red-900/50 relative group overflow-hidden"
            aria-label="ABORT"
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <X size={24} className="relative z-10" />
          </button>
        </div>

        {/* 配置项 */}
        <div className="p-4 md:p-6 space-y-4 relative z-10 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {/* 跳过战斗 */}
          <div className="flex items-center justify-between p-4 bg-stone-950/30 border border-stone-800 hover:bg-stone-900/40 transition-all group relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <div className="flex-1 pr-4 relative z-10">
              <label className="text-stone-300 text-xs font-bold block mb-1 uppercase tracking-widest">
                SKIP_COMBAT_SEQUENCES
              </label>
              <p className="text-[10px] text-stone-600 uppercase tracking-tight leading-relaxed">
                BYPASS ALL HOSTILE ENCOUNTERS AUTOMATICALLY
              </p>
            </div>
            <button 
              onClick={() => setConfig({ ...config, skipBattle: !config.skipBattle })}
              className={`w-12 h-6 border transition-all relative flex items-center px-1 z-10 ${
                config.skipBattle ? 'border-emerald-600 bg-emerald-950/20' : 'border-stone-800 bg-stone-950'
              }`}
            >
              <div className={`w-3 h-3 transition-all ${
                config.skipBattle ? 'translate-x-6 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'translate-x-0 bg-stone-700'
              }`}></div>
            </button>
          </div>

          {/* 遇到战斗逃跑 */}
          <div className={`flex items-center justify-between p-4 bg-stone-950/30 border border-stone-800 transition-all group relative overflow-hidden ${
            config.skipBattle ? 'opacity-30' : 'hover:bg-stone-900/40'
          }`}>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <div className="flex-1 pr-4 relative z-10">
              <label className="text-stone-300 text-xs font-bold block mb-1 uppercase tracking-widest">
                AUTO_EVASIVE_MANEUVERS
              </label>
              <p className="text-[10px] text-stone-600 uppercase tracking-tight leading-relaxed">
                FLEE FROM COMBAT IF ENGAGED
              </p>
            </div>
            <button 
              disabled={config.skipBattle}
              onClick={() => setConfig({ ...config, fleeOnBattle: !config.fleeOnBattle })}
              className={`w-12 h-6 border transition-all relative flex items-center px-1 z-10 ${
                config.fleeOnBattle ? 'border-emerald-600 bg-emerald-950/20' : 'border-stone-800 bg-stone-950'
              } ${config.skipBattle ? 'cursor-not-allowed' : ''}`}
            >
              <div className={`w-3 h-3 transition-all ${
                config.fleeOnBattle ? 'translate-x-6 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'translate-x-0 bg-stone-700'
              }`}></div>
            </button>
          </div>

          {/* 跳过商店 */}
          <div className="flex items-center justify-between p-4 bg-stone-950/30 border border-stone-800 hover:bg-stone-900/40 transition-all group relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <div className="flex-1 pr-4 relative z-10">
              <label className="text-stone-300 text-xs font-bold block mb-1 uppercase tracking-widest">
                IGNORE_TRADING_HUBS
              </label>
              <p className="text-[10px] text-stone-600 uppercase tracking-tight leading-relaxed">
                DO NOT INTERACT WITH SETTLEMENT VENDORS
              </p>
            </div>
            <button 
              onClick={() => setConfig({ ...config, skipShop: !config.skipShop })}
              className={`w-12 h-6 border transition-all relative flex items-center px-1 z-10 ${
                config.skipShop ? 'border-emerald-600 bg-emerald-950/20' : 'border-stone-800 bg-stone-950'
              }`}
            >
              <div className={`w-3 h-3 transition-all ${
                config.skipShop ? 'translate-x-6 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'translate-x-0 bg-stone-700'
              }`}></div>
            </button>
          </div>

          {/* 跳过声望事件 */}
          <div className="flex items-center justify-between p-4 bg-stone-950/30 border border-stone-800 hover:bg-stone-900/40 transition-all group relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <div className="flex-1 pr-4 relative z-10">
              <label className="text-stone-300 text-xs font-bold block mb-1 uppercase tracking-widest">
                BYPASS_SOCIAL_ENCOUNTERS
              </label>
              <p className="text-[10px] text-stone-600 uppercase tracking-tight leading-relaxed">
                IGNORE FACTION REPUTATION EVENTS
              </p>
            </div>
            <button 
              onClick={() => setConfig({ ...config, skipReputationEvent: !config.skipReputationEvent })}
              className={`w-12 h-6 border transition-all relative flex items-center px-1 z-10 ${
                config.skipReputationEvent ? 'border-emerald-600 bg-emerald-950/20' : 'border-stone-800 bg-stone-950'
              }`}
            >
              <div className={`w-3 h-3 transition-all ${
                config.skipReputationEvent ? 'translate-x-6 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'translate-x-0 bg-stone-700'
              }`}></div>
            </button>
          </div>

          {/* 血量阈值 */}
          <div className="p-4 bg-stone-950/30 border border-stone-800 relative group overflow-hidden">
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <div className="relative z-10">
              <label className="text-stone-300 text-xs font-bold block mb-1 uppercase tracking-widest">
                VITALITY_FAILSAFE_THRESHOLD
              </label>
              <p className="text-[10px] text-stone-600 uppercase tracking-tight leading-relaxed mb-4">
                TERMINATE EXPEDITION IF HP DROPS BELOW SPECIFIED %
              </p>
              <div className="flex items-center gap-4 bg-stone-950 p-3 border border-stone-900">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.minHpThreshold}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                    setConfig({ ...config, minHpThreshold: value });
                  }}
                  className="w-20 bg-stone-900 border border-stone-800 text-emerald-500 font-bold text-sm px-3 py-2 focus:outline-none focus:border-emerald-900/50 rounded-none uppercase tracking-widest font-mono"
                  placeholder="0"
                />
                <div className="flex-1 h-2 bg-stone-900 border border-stone-800 rounded-none overflow-hidden relative">
                  <div 
                    className="absolute inset-y-0 left-0 bg-emerald-600 transition-all duration-500"
                    style={{ width: `${config.minHpThreshold}%` }}
                  ></div>
                </div>
                <span className="text-stone-500 text-[10px] font-bold uppercase tracking-widest w-8 text-right font-mono">
                  {config.minHpThreshold}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-4 p-4 md:p-6 border-t border-stone-800 bg-stone-950/50 relative z-10 font-mono">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-stone-950 hover:bg-stone-900 text-stone-500 hover:text-stone-200 border border-stone-800 transition-all uppercase tracking-widest text-[10px] font-bold relative group overflow-hidden"
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <span className="relative z-10">ABORT_INIT</span>
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-500/80 hover:text-emerald-500 border border-emerald-900/50 hover:border-emerald-600 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[10px] font-bold relative group overflow-hidden"
          >
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
              style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
            />
            <Play size={14} className="relative z-10" />
            <span className="relative z-10">INITIALIZE_EXPEDITION</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoAdventureConfigModal;

