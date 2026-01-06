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
        return `${baseColor} border-blue-500`;
      case '传说':
        return `${baseColor} border-purple-500`;
      case '仙品':
        return `${baseColor} border-yellow-500`;
      default:
        return `${baseColor} border-stone-500`;
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center z-50 p-4 overflow-y-auto touch-manipulation">
      <div className="bg-paper-800 border-2 border-mystic-gold rounded-lg p-4 md:p-8 max-w-2xl w-full shadow-2xl my-auto">
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-mystic-gold tracking-widest mb-2">
            Wasteland Survivor
          </h1>
          <p className="text-stone-400 text-sm md:text-lg">Embark on your journey of survival</p>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* 输入名称 */}
          <div>
            <label className="block text-stone-300 mb-2 font-semibold flex items-center gap-2 text-sm md:text-base">
              <User size={18} className="md:w-5 md:h-5" />
              Name Of Survival
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your wasteland handle..."
              className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-stone-700 border border-stone-600 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-mystic-jade focus:ring-2 focus:ring-mystic-jade/50 text-sm md:text-base"
              maxLength={20}
            />
          </div>

          {/* 天赋选择（只显示，不可修改） */}
          <div>
            <label className="block text-stone-300 mb-2 font-semibold flex items-center gap-2 text-sm md:text-base">
              <Sparkles size={18} className="md:w-5 md:h-5" />
              Innate Perk (Randomly generated, permanent)
            </label>
            <div
              className={`p-3 md:p-4 rounded border-2 ${getRarityColor(selectedTalent?.rarity || '普通')} bg-stone-800/50`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg md:text-xl font-bold">
                  {selectedTalent?.name}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-[10px] md:text-xs font-semibold ${getRarityColor(selectedTalent?.rarity || '普通')}`}
                >
                  {selectedTalent?.rarity}
                </span>
              </div>
              <p className="text-stone-300 mb-2 md:mb-3 text-xs md:text-sm">
                {selectedTalent?.description}
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                {selectedTalent?.effects.attack && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Sword size={14} className="md:w-4 md:h-4 text-red-400" />
                    <span>Firepower +{selectedTalent.effects.attack}</span>
                  </div>
                )}
                {selectedTalent?.effects.defense && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Shield size={14} className="md:w-4 md:h-4 text-blue-400" />
                    <span>Defense +{selectedTalent.effects.defense}</span>
                  </div>
                )}
                {selectedTalent?.effects.hp && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Heart size={14} className="md:w-4 md:h-4 text-pink-400" />
                    <span>HP +{selectedTalent.effects.hp}</span>
                  </div>
                )}
                {selectedTalent?.effects.spirit && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Zap size={14} className="md:w-4 md:h-4 text-yellow-400" />
                    <span>Neural +{selectedTalent.effects.spirit}</span>
                  </div>
                )}
                {selectedTalent?.effects.physique && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Shield
                      size={14}
                      className="md:w-4 md:h-4 text-green-400"
                    />
                    <span>Physique +{selectedTalent.effects.physique}</span>
                  </div>
                )}
                {selectedTalent?.effects.speed && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Zap size={14} className="md:w-4 md:h-4 text-cyan-400" />
                    <span>Speed +{selectedTalent.effects.speed}</span>
                  </div>
                )}
                {selectedTalent?.effects.expRate && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Sparkles
                      size={14}
                      className="md:w-4 md:h-4 text-purple-400"
                    />
                    <span>
                      Data Rate +
                      {Math.round(selectedTalent.effects.expRate * 100)}%
                    </span>
                  </div>
                )}
                {selectedTalent?.effects.luck && (
                  <div className="flex items-center gap-1 text-stone-300">
                    <Sparkles
                      size={14}
                      className="md:w-4 md:h-4 text-yellow-400"
                    />
                    <span>Luck +{selectedTalent.effects.luck}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[10px] md:text-xs text-stone-500 mt-2">
              * Perks are randomized at the start and cannot be changed.
            </p>
          </div>

          {/* 难度选择 */}
          <div>
            <label className="block text-stone-300 mb-2 font-semibold flex items-center gap-2 text-sm md:text-base">
              <TriangleAlert size={18} className="md:w-5 md:h-5" />
              Game Difficulty
            </label>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 bg-stone-800/50 rounded border-2 cursor-pointer transition-colors ${difficulty === 'easy'
                ? 'border-green-500 bg-green-900/20'
                : 'border-stone-700 hover:border-mystic-jade/50'
                }`}>
                <input
                  type="radio"
                  name="difficulty"
                  value="easy"
                  checked={difficulty === 'easy'}
                  onChange={handleDifficultyChange}
                  className="w-4 h-4 text-green-500 accent-green-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-400">Easy Mode</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    No death penalty. Suitable for new recruits.
                  </p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 bg-stone-800/50 rounded border-2 cursor-pointer transition-colors ${difficulty === 'normal'
                ? 'border-yellow-500 bg-yellow-900/20'
                : 'border-stone-700 hover:border-mystic-jade/50'
                }`}>
                <input
                  type="radio"
                  name="difficulty"
                  value="normal"
                  checked={difficulty === 'normal'}
                  onChange={handleDifficultyChange}
                  className="w-4 h-4 text-yellow-500 accent-yellow-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-yellow-400">Normal Mode</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    Death results in partial stat loss (10-20%) and equipment loss (1-3 items).
                  </p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 bg-stone-800/50 rounded border-2 cursor-pointer transition-colors ${difficulty === 'hard'
                ? 'border-red-500 bg-red-900/20'
                : 'border-stone-700 hover:border-mystic-jade/50'
                }`}>
                <input
                  type="radio"
                  name="difficulty"
                  value="hard"
                  checked={difficulty === 'hard'}
                  onChange={handleDifficultyChange}
                  className="w-4 h-4 text-red-500 accent-red-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-400">Hard Mode</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    Death deletes save data. For true wastelanders.
                  </p>
                </div>
              </label>
            </div>
            <p className="text-[10px] md:text-xs text-stone-500 mt-2">
              * Difficulty can be viewed in settings later, but should be chosen now.
            </p>
          </div>
          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleImportSave}
            className="hidden"
            aria-label="导入存档文件"
          />

          {/* 开始按钮 */}
          <button
            onClick={handleStart}
            disabled={!playerName.trim()}
            className="w-full py-3 md:py-4 bg-gradient-to-r from-mystic-gold to-yellow-600 active:from-yellow-600 active:to-mystic-gold text-stone-900 font-bold text-base md:text-lg rounded-lg transition-all duration-300 shadow-lg active:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[56px] md:min-h-0 touch-manipulation"
          >
            <Sparkles size={20} className="md:w-6 md:h-6" />
            Start Survival Journey
          </button>

          {/* 导入存档按钮 */}
          <button
            onClick={handleImportClick}
            className="w-full py-2.5 md:py-3 bg-gradient-to-r from-stone-500 to-stone-600 active:from-stone-600 active:to-stone-500 text-stone-200 font-bold text-sm md:text-base rounded-lg transition-all duration-300 shadow-lg active:shadow-xl flex items-center justify-center gap-2 min-h-[48px] md:min-h-0 touch-manipulation border border-stone-500"
          >
            <Upload size={18} className="md:w-5 md:h-5" />
            Import Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
