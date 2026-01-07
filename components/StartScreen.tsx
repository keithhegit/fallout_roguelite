import React, { useState, useMemo, useRef } from 'react';
import { DifficultyMode, ItemRarity } from '../types';
import { TALENTS } from '../constants/index';
import { Sparkles, Sword, Shield, Heart, Zap, User, Upload, TriangleAlert } from 'lucide-react';
import { showError } from '../utils/toastUtils';
import { STORAGE_KEYS } from '../constants/storageKeys';
import {
  getCurrentSlotId,
  saveToSlot,
  importSave,
  ensurePlayerStatsCompatibility,
} from '../utils/saveManagerUtils';
import { getRarityTextColor } from '../utils/rarityUtils';

interface Props {
  onStart: (
    playerName: string,
    talentId: string,
    difficulty: DifficultyMode
  ) => void;
}

const StartScreen: React.FC<Props> = ({ onStart }) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedTalentId, setSelectedTalentId] = useState<string | null>(null);
  // 从 localStorage 读取保存的难度选择，如果没有则默认为 'normal'
  const [difficulty, setDifficulty] = useState<DifficultyMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.difficulty) {
          return settings.difficulty;
        }
      }
    } catch (error) {
      console.error('读取难度设置失败:', error);
    }
    return 'normal';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 只在组件首次加载时随机生成一个天赋（使用useMemo确保只执行一次）
  const initialRandomTalentId = useMemo(() => {
    const availableTalents = TALENTS;
    const randomTalent =
      availableTalents[Math.floor(Math.random() * availableTalents.length)];
    return randomTalent.id;
  }, []); // 空依赖数组，确保只执行一次

  // 如果没有选择天赋，使用初始随机天赋
  const finalTalentId = selectedTalentId || initialRandomTalentId;
  const selectedTalent = TALENTS.find((t) => t.id === finalTalentId);

  const handleStart = () => {
    if (!playerName.trim()) {
      showError('Please enter survivor name!');
      return;
    }
    onStart(playerName.trim(), finalTalentId, difficulty);
  };

  const handleImportSave = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 支持 .json 和 .txt 文件
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.json') && !fileName.endsWith('.txt')) {
      showError('Please select a .json or .txt save file!');
      return;
    }

    try {
      const text = await file.text();
      // 使用 importSave 函数处理存档（支持 Base64 编码）
      const saveData = importSave(text);

      if (!saveData) {
        showError('Save file format error! Please ensure the content is valid JSON.');
        // 清空文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // 验证存档数据格式
      if (!saveData.player || !Array.isArray(saveData.logs)) {
        showError('Save data format error! Missing required fields.');
        // 清空文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // 直接导入存档，不需要确认
      try {
        // 获取当前存档槽位ID，如果没有则使用槽位1
        const currentSlotId = getCurrentSlotId();

        // 使用新的存档系统保存到当前槽位
        const success = saveToSlot(
          currentSlotId,
          ensurePlayerStatsCompatibility(saveData.player),
          saveData.logs || []
        );

        if (!success) {
          showError('Failed to save, please try again!');
          // 清空文件输入
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }

        window.location.reload();
      } catch (error) {
        console.error('保存存档失败:', error);
        showError(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}, please try again!`);
        // 清空文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('导入存档失败:', error);
      showError(
        `Import failed! Error: ${error instanceof Error ? error.message : 'Unknown error'}, please check file format.`
      );
    }

    // 清空文件输入，以便可以重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // 保存难度选择到 localStorage
  const saveDifficulty = (newDifficulty: DifficultyMode) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const settings = saved ? JSON.parse(saved) : {};
      settings.difficulty = newDifficulty;
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('保存难度设置失败:', error);
    }
  };

  // 处理难度选择变化
  const handleDifficultyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDifficulty = e.target.value as DifficultyMode;
    setDifficulty(newDifficulty);
    saveDifficulty(newDifficulty);
  };

  // 使用统一的工具函数获取稀有度颜色（带边框，StartScreen 使用不同的边框颜色）
  const getRarityColor = (rarity: string) => {
    const baseColor = getRarityTextColor(rarity as ItemRarity);
    switch (rarity) {
      case '稀有':
        return `${baseColor} border-blue-500/50`;
      case '传说':
        return `${baseColor} border-purple-500/50`;
      case '仙品':
        return `${baseColor} border-emerald-500/50`;
      default:
        return `${baseColor} border-stone-800`;
    }
  };

  return (
    <div className="fixed inset-0 bg-ink-950 flex items-center justify-center z-50 p-4 overflow-y-auto touch-manipulation crt-screen">
      {/* 背景纹理层 */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
      />

      {/* CRT Visual Layers */}
      <div className="crt-noise opacity-[0.02]"></div>
      <div className="crt-vignette"></div>
      <div className="scanline-overlay opacity-[0.04]"></div>

      <div className="bg-ink-950/90 border-2 border-stone-800 rounded-none p-6 md:p-10 max-w-2xl w-full shadow-[0_0_30px_rgba(0,0,0,0.5)] my-auto relative z-30 backdrop-blur-md overflow-hidden">
        {/* 内置背景纹理 */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.02] z-0"
          style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
        />

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-2xl md:text-4xl font-mono font-bold text-emerald-500 tracking-[0.3em] mb-3 uppercase">
            [ USER_REGISTRATION ]
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-8 bg-emerald-500/20"></div>
            <p className="text-stone-500 text-[10px] md:text-xs font-mono tracking-[0.4em] uppercase">Vault-Tec Personnel Entry</p>
            <div className="h-[1px] w-8 bg-emerald-500/20"></div>
          </div>
        </div>

        <div className="space-y-6 md:space-y-8 relative z-10">
          {/* 输入名称 */}
          <div className="space-y-3">
            <label className="block text-emerald-500/60 font-mono text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 font-bold">
              <User size={14} className="text-emerald-500/40" />
              SUBJECT_IDENTITY
            </label>
            <div className="relative group">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter subject name..."
                className="w-full px-5 py-4 bg-stone-900/40 border-2 border-stone-800 rounded-none text-stone-200 placeholder-stone-700 focus:outline-none focus:border-emerald-500/40 transition-all font-mono text-sm uppercase tracking-widest"
                maxLength={20}
              />
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-emerald-500/10 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
            </div>
          </div>

          {/* 天赋选择 */}
          <div className="space-y-3">
            <label className="block text-emerald-500/60 font-mono text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 font-bold">
              <Sparkles size={14} className="text-emerald-500/40" />
              GENETIC_PERK_ANALYSIS
            </label>
            <div
              className={`p-5 rounded-none border-2 bg-stone-900/20 relative overflow-hidden group/perk transition-all hover:bg-stone-900/30 ${getRarityColor(selectedTalent?.rarity || '普通')}`}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-0 group-hover/perk:opacity-[0.02] transition-opacity pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base md:text-lg font-bold uppercase tracking-[0.2em] text-stone-200 group-hover/perk:text-emerald-400 transition-colors">
                    {selectedTalent?.name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-none text-[9px] font-bold uppercase tracking-[0.3em] border-2 bg-stone-950/60 ${getRarityColor(selectedTalent?.rarity || '普通')}`}
                  >
                    {selectedTalent?.rarity}
                  </span>
                </div>
                <p className="text-stone-400 mb-5 text-[11px] md:text-xs leading-relaxed font-mono uppercase tracking-tight opacity-80 group-hover/perk:opacity-100 transition-opacity">
                  {selectedTalent?.description}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-stone-800/50 pt-4">
                  {selectedTalent?.effects.attack && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500 group-hover/perk:text-emerald-500/70 transition-colors">
                      <Sword size={12} className="opacity-50" />
                      <span className="uppercase">ATK +{selectedTalent.effects.attack}</span>
                    </div>
                  )}
                  {selectedTalent?.effects.defense && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500 group-hover/perk:text-emerald-500/70 transition-colors">
                      <Shield size={12} className="opacity-50" />
                      <span className="uppercase">DEF +{selectedTalent.effects.defense}</span>
                    </div>
                  )}
                  {selectedTalent?.effects.hp && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500 group-hover/perk:text-emerald-500/70 transition-colors">
                      <Heart size={12} className="opacity-50" />
                      <span className="uppercase">HP +{selectedTalent.effects.hp}</span>
                    </div>
                  )}
                  {selectedTalent?.effects.spirit && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500 group-hover/perk:text-emerald-500/70 transition-colors">
                      <Zap size={12} className="opacity-50" />
                      <span className="uppercase">SPI +{selectedTalent.effects.spirit}</span>
                    </div>
                  )}
                  {selectedTalent?.effects.physique && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500 group-hover/perk:text-emerald-500/70 transition-colors">
                      <Shield size={12} className="opacity-50" />
                      <span className="uppercase">PHY +{selectedTalent.effects.physique}</span>
                    </div>
                  )}
                  {selectedTalent?.effects.speed && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500 group-hover/perk:text-emerald-500/70 transition-colors">
                      <Zap size={12} className="opacity-50" />
                      <span className="uppercase">SPD +{selectedTalent.effects.speed}</span>
                    </div>
                  )}
                  {selectedTalent?.effects.expRate && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500 group-hover/perk:text-emerald-500/70 transition-colors">
                      <Sparkles size={12} className="opacity-50" />
                      <span className="uppercase">DATA +{Math.round(selectedTalent.effects.expRate * 100)}%</span>
                    </div>
                  )}
                  {selectedTalent?.effects.luck && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-stone-500 group-hover/perk:text-emerald-500/70 transition-colors">
                      <Sparkles size={12} className="opacity-50" />
                      <span className="uppercase">LUCK +{selectedTalent.effects.luck}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[9px] text-stone-600 font-mono uppercase tracking-widest pl-2 border-l border-stone-800">
              * Genetic perks are randomized and immutable post-initialization.
            </p>
          </div>

          {/* 难度选择 */}
          <div className="space-y-4">
            <label className="block text-emerald-500/60 font-mono text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 font-bold">
              <TriangleAlert size={14} className="text-emerald-500/40" />
              OPERATION_PROTOCOL
            </label>
            <div className="grid grid-cols-1 gap-3">
              <label className={`group/opt flex items-center gap-5 p-4 rounded-none border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${difficulty === 'easy'
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-stone-800 bg-stone-900/10 hover:border-stone-700'
                }`}>
                <input
                  type="radio"
                  name="difficulty"
                  value="easy"
                  checked={difficulty === 'easy'}
                  onChange={handleDifficultyChange}
                  className="w-5 h-5 accent-emerald-500 z-10"
                />
                <div className="flex-1 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-xs uppercase tracking-[0.2em] transition-colors ${difficulty === 'easy' ? 'text-emerald-400' : 'text-stone-500 group-hover/opt:text-stone-300'}`}>Standard Protocol</span>
                  </div>
                  <p className="text-[9px] text-stone-600 mt-1 uppercase tracking-widest transition-colors group-hover/opt:text-stone-500">No lethal consequences. Recommended for initial deployment.</p>
                </div>
                {difficulty === 'easy' && (
                  <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                )}
              </label>
              
              <label className={`group/opt flex items-center gap-5 p-4 rounded-none border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${difficulty === 'normal'
                ? 'border-yellow-500/40 bg-yellow-500/5'
                : 'border-stone-800 bg-stone-900/10 hover:border-stone-700'
                }`}>
                <input
                  type="radio"
                  name="difficulty"
                  value="normal"
                  checked={difficulty === 'normal'}
                  onChange={handleDifficultyChange}
                  className="w-5 h-5 accent-yellow-500 z-10"
                />
                <div className="flex-1 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-xs uppercase tracking-[0.2em] transition-colors ${difficulty === 'normal' ? 'text-yellow-400' : 'text-stone-500 group-hover/opt:text-stone-300'}`}>Hardcore Protocol</span>
                  </div>
                  <p className="text-[9px] text-stone-600 mt-1 uppercase tracking-widest transition-colors group-hover/opt:text-stone-500">Death results in partial stat and equipment loss.</p>
                </div>
                {difficulty === 'normal' && (
                  <div className="absolute right-0 top-0 h-full w-1 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                )}
              </label>

              <label className={`group/opt flex items-center gap-5 p-4 rounded-none border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${difficulty === 'hard'
                ? 'border-red-500/40 bg-red-500/5'
                : 'border-stone-800 bg-stone-900/10 hover:border-stone-700'
                }`}>
                <input
                  type="radio"
                  name="difficulty"
                  value="hard"
                  checked={difficulty === 'hard'}
                  onChange={handleDifficultyChange}
                  className="w-5 h-5 accent-red-500 z-10"
                />
                <div className="flex-1 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold text-xs uppercase tracking-[0.2em] transition-colors ${difficulty === 'hard' ? 'text-red-400' : 'text-stone-500 group-hover/opt:text-stone-300'}`}>Survival Protocol</span>
                  </div>
                  <p className="text-[9px] text-stone-600 mt-1 uppercase tracking-widest transition-colors group-hover/opt:text-stone-500">Death deletes all subject data. For true wastelanders.</p>
                </div>
                {difficulty === 'hard' && (
                  <div className="absolute right-0 top-0 h-full w-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                )}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
            <button
              onClick={handleStart}
              disabled={!playerName.trim()}
              className="group/btn relative w-full py-5 bg-emerald-500 text-ink-950 font-bold text-base rounded-none transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-[1.02] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-[0.2em] border-2 border-emerald-500 overflow-hidden"
            >
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/btn:opacity-[0.05] transition-opacity"
                style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }} />
              <Sparkles size={20} className="relative z-10" />
              <span className="relative z-10">Initialize</span>
            </button>
            <button
              onClick={handleImportClick}
              className="group/btn relative w-full py-5 bg-stone-900/40 text-stone-400 font-bold text-base rounded-none transition-all duration-300 border-2 border-stone-800 hover:border-emerald-500/40 hover:text-emerald-500 flex items-center justify-center gap-3 uppercase tracking-[0.2em] overflow-hidden"
            >
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/btn:opacity-[0.03] transition-opacity"
                style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }} />
              <Upload size={18} className="relative z-10" />
              <span className="relative z-10">Import Data</span>
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleImportSave}
            className="hidden"
          />
        </div>

        {/* Footer info */}
        <div className="mt-10 pt-6 border-t border-stone-800/50 text-center opacity-30 text-[9px] font-mono tracking-[0.4em] uppercase pointer-events-none">
          Subject status: Healthy // Equipment: Minimal // Clearance: Level 1
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
