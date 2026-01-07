import React, { useRef, useState } from 'react';
import {
  X,
  Volume2,
  Music,
  Save,
  Globe,
  Upload,
  Download,
  Github,
  RotateCcw,
  FolderOpen,
  Keyboard,
  MessageCircle,
} from 'lucide-react';
import { GameSettings } from '../types';
import dayjs from 'dayjs';
import { showError, showSuccess, showInfo, showConfirm } from '../utils/toastUtils';
import { STORAGE_KEYS } from '../constants/storageKeys';
import {
  getCurrentSlotId,
  saveToSlot,
  loadFromSlot,
  exportSave,
  importSave,
  ensurePlayerStatsCompatibility,
} from '../utils/saveManagerUtils';
import ChangelogModal from './ChangelogModal';
import ShortcutsModal from './ShortcutsModal';
import { KeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import { KeyboardShortcutConfig } from '../types';
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_DESCRIPTIONS,
  getShortcutConfig,
  configToShortcut,
} from '../utils/shortcutUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onImportSave?: () => void;
  onRestartGame?: () => void;
  onOpenSaveManager?: () => void;
}

const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onRestartGame,
  onOpenSaveManager,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Generate shortcut list (for display)
  const shortcuts: KeyboardShortcut[] = Object.keys(SHORTCUT_DESCRIPTIONS).map(
    (actionId) => {
      const desc = SHORTCUT_DESCRIPTIONS[actionId];
      const config = getShortcutConfig(
        actionId,
        settings.keyboardShortcuts
      );
      return configToShortcut(
        config,
        () => { }, // Placeholder for display
        desc.description,
        desc.category
      );
    }
  );

  // 处理快捷键更新
  const handleUpdateShortcuts = (newShortcuts: Record<string, KeyboardShortcutConfig>) => {
    onUpdateSettings({ keyboardShortcuts: newShortcuts });
  };

  if (!isOpen) return null;

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
        return;
      }

      // 显示存档信息预览
      const playerName = saveData.player.name || 'Unknown';
      const realm = saveData.player.realm || 'Unknown';
      const timestamp = saveData.timestamp
        ? new Date(saveData.timestamp).toLocaleString('en-US')
        : 'Unknown';

      // 确认导入
      showConfirm(
        `Are you sure you want to import this save?\n\nPlayer: ${playerName}\nRank: ${realm}\nSaved: ${timestamp}\n\nCurrent save will be replaced and the page will refresh.`,
        'Confirm Import',
        () => {
          try {
            // 获取当前存档槽位ID，如果没有则使用槽位1
            const currentSlotId = getCurrentSlotId();

            // 使用新的存档系统保存到当前槽位
            const success = saveToSlot(
              currentSlotId,
              ensurePlayerStatsCompatibility(saveData.player),
              saveData.logs
            );

            if (!success) {
              showError('Failed to save, please try again!');
              return;
            }

            // 直接刷新页面，不需要再次确认
            // 延迟一小段时间让用户看到操作完成
            setTimeout(() => {
              window.location.reload();
            }, 100);
          } catch (error) {
            console.error('保存存档失败:', error);
            showError('Failed to save, please try again!');
          }
        }
      );
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

  const handleExportSave = () => {
    try {
      // 获取当前存档槽位ID
      const currentSlotId = getCurrentSlotId();

      // 从当前槽位加载存档
      const saveData = loadFromSlot(currentSlotId);

      if (!saveData) {
        showError('No save data found! Please start a game first.');
        return;
      }

      // 使用 exportSave 函数导出（支持 Base64 编码）
      const jsonString = exportSave(saveData);

      // 创建文件名
      const playerName = saveData.player?.name || 'player';
      const fileName = `xiuxian-save-${playerName}-${dayjs().format('YYYY-MM-DD HH:mm:ss')}.json`;

      // 创建下载链接
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      showSuccess('Save exported successfully!');
    } catch (error) {
      console.error('导出存档失败:', error);
      showError(
        `Export failed! Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 crt-screen"
      onClick={onClose}
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

        <div className="bg-stone-950/50 border-b border-stone-800 p-4 md:p-6 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-900 border border-stone-800 flex items-center justify-center text-emerald-500/80 shadow-inner relative group overflow-hidden">
              <div 
                className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
              />
              <Save size={24} className="relative z-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-200 tracking-[0.2em] uppercase">SYSTEM_SETTINGS</h2>
              <p className="text-[10px] text-stone-600 tracking-widest uppercase">HARDWARE_CONFIG // PROTOCOL_V9.4</p>
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

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-8 relative z-10 max-h-[70vh]">
          {/* 游戏设置 */}
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-2">
              <Save size={18} className="text-emerald-500" />
              <h3 className="font-bold uppercase tracking-widest text-sm text-stone-100">GAMEPLAY_PARAMETERS</h3>
            </div>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer group/item">
                <span className="text-stone-300 text-xs uppercase tracking-wider font-bold">AUTO_SAVE_PROTOCOL</span>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) =>
                    onUpdateSettings({ autoSave: e.target.checked })
                  }
                  className="w-5 h-5 accent-emerald-600 rounded-none border-stone-700 bg-stone-900"
                />
              </label>
              
              <div className="space-y-2">
                <label className="block text-[10px] text-stone-500 uppercase tracking-widest font-bold">
                  ANIMATION_PROCESSING_SPEED
                </label>
                <select
                  value={settings.animationSpeed}
                  onChange={(e) =>
                    onUpdateSettings({
                      animationSpeed: e.target.value as GameSettings['animationSpeed']
                    })
                  }
                  className="w-full bg-stone-900/40 border border-stone-800 rounded-none px-3 py-2 text-stone-200 text-xs uppercase tracking-widest font-bold focus:border-emerald-500 outline-none transition-colors"
                >
                  <option value="slow">SLOW_STABILITY</option>
                  <option value="normal">BALANCED_OPTIMAL</option>
                  <option value="fast">HIGH_PERFORMANCE</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] text-stone-500 uppercase tracking-widest font-bold">
                  SIMULATION_DIFFICULTY
                </label>
                <div className="w-full bg-stone-900/40 border border-stone-800 rounded-none px-3 py-2">
                  {settings.difficulty === 'easy' && (
                    <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest">
                      EASY - [ NO_PENALTIES ]
                    </span>
                  )}
                  {settings.difficulty === 'normal' && (
                    <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest">
                      NORMAL - [ PARTIAL_DATA_LOSS ]
                    </span>
                  )}
                  {settings.difficulty === 'hard' && (
                    <span className="text-red-500 text-xs font-bold uppercase tracking-widest">
                      HARDCORE - [ PERMANENT_TERMINATION ]
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-stone-600 italic leading-tight">
                  * Difficulty parameters are immutable once simulation begins.
                </p>
              </div>
            </div>
          </div>

          {/* 存档管理 */}
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-2">
              <FolderOpen size={18} className="text-emerald-500" />
              <h3 className="font-bold uppercase tracking-widest text-sm text-stone-100">DATA_REQUISITION</h3>
            </div>
            <div className="space-y-4">
              {onOpenSaveManager && (
                <div className="space-y-2">
                  <label className="block text-[10px] text-stone-500 uppercase tracking-widest font-bold">
                    ARCHIVE_SYSTEM_ACCESS
                  </label>
                  <button
                    onClick={() => {
                      onOpenSaveManager();
                      onClose();
                    }}
                    className="w-full bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-500 border border-emerald-800/50 rounded-none px-4 py-2.5 flex items-center justify-center transition-all font-bold uppercase tracking-widest text-xs"
                  >
                    <FolderOpen size={14} className="mr-2" />
                    [ ACCESS_SAVE_MANAGER ]
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <button
                    onClick={handleExportSave}
                    className="w-full bg-stone-900/40 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-none px-4 py-2.5 flex items-center justify-center transition-all font-bold uppercase tracking-widest text-xs"
                  >
                    <Download size={14} className="mr-2" />
                    [ EXPORT_ENCRYPTED_DATA ]
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.txt"
                    onChange={handleImportSave}
                    className="hidden"
                    id="import-save-input"
                  />
                  <label
                    htmlFor="import-save-input"
                    className="block w-full bg-stone-900/40 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-none px-4 py-2.5 text-center cursor-pointer transition-all font-bold uppercase tracking-widest text-xs"
                  >
                    <Upload size={14} className="inline mr-2" />
                    [ IMPORT_EXTERNAL_RECORDS ]
                  </label>
                </div>
              </div>

              {onRestartGame && (
                <div className="pt-2 border-t border-stone-900">
                  <button
                    onClick={() => {
                      showInfo('Restarting will clear all progress, including:\n- Character Data\n- Gear & Items\n- Rank & XP\n- All Trophies\n\nThis action cannot be undone!', 'Rebuild Future', () => {
                        onRestartGame();
                        onClose();
                      });
                    }}
                    className="w-full bg-red-900/10 hover:bg-red-900/20 text-red-500 border border-red-900/30 rounded-none px-4 py-2.5 flex items-center justify-center transition-all font-bold uppercase tracking-widest text-xs"
                  >
                    <RotateCcw size={14} className="mr-2" />
                    [ WIPE_SIMULATION_DATA ]
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 语言设置 */}
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-2">
              <Globe size={18} className="text-emerald-500" />
              <h3 className="font-bold uppercase tracking-widest text-sm text-stone-100">INTERFACE_LINGUISTICS</h3>
            </div>
            <select
              value={settings.language}
              onChange={(e) =>
                onUpdateSettings({
                  language: e.target.value as GameSettings['language']
                })
              }
              className="w-full bg-stone-900/40 border border-stone-800 rounded-none px-3 py-2 text-stone-200 text-xs uppercase tracking-widest font-bold focus:border-emerald-500 outline-none transition-colors"
            >
              <option value="zh">ZH_CN_STANDARD</option>
              <option value="en">EN_US_ENHANCED</option>
            </select>
          </div>

          {/* 快捷键 */}
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-2">
              <Keyboard size={18} className="text-emerald-500" />
              <h3 className="font-bold uppercase tracking-widest text-sm text-stone-100">NEURAL_INTERFACE_MAPPING</h3>
            </div>
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="flex items-center gap-2 w-full bg-stone-900/40 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-none px-4 py-2.5 transition-all font-bold uppercase tracking-widest text-xs text-left"
            >
              <Keyboard size={14} className="text-emerald-500" />
              <span>[ VIEW_OPERATIONAL_SHORTCUTS ]</span>
            </button>
          </div>

          {/* 关于与更新 */}
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-stone-800 pb-2">
              <MessageCircle size={18} className="text-emerald-500" />
              <h3 className="font-bold uppercase tracking-widest text-sm text-stone-100">VAULT_COMMUNICATIONS</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-stone-900/40 border border-stone-800 rounded-none p-4 flex flex-col items-center">
                <img
                  src="/assets/images/group.jpg"
                  alt="Wasteland Survivor Community"
                  className="w-full max-w-xs rounded-none border border-stone-800 shadow-lg grayscale"
                />
                <p className="text-[10px] text-stone-500 mt-3 text-center uppercase tracking-widest font-bold">
                  SCAN_TO_JOIN_SURVIVOR_NETWORK
                </p>
              </div>

              <div className="bg-stone-950 border border-stone-800 rounded-none px-4 py-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">FIRMWARE_VERSION</span>
                  <span className="text-xs font-mono text-emerald-500 font-bold">
                    V_{import.meta.env.VITE_APP_VERSION || '1.0.0'}
                  </span>
                </div>
                <div className="text-[10px] text-stone-600 uppercase font-bold">
                  LAST_STABLE_COMPILE: 2024-12-05
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <a
                  href="https://github.com/JeasonLoop/react-xiuxian-game"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full bg-stone-900/40 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-none px-4 py-2.5 transition-all font-bold uppercase tracking-widest text-xs"
                >
                  <Github size={14} className="text-emerald-500" />
                  <span>[ GITHUB_REPOSITORY ]</span>
                  <span className="ml-auto text-[10px] text-stone-500">↗</span>
                </a>
                <button
                  onClick={() => setIsChangelogOpen(true)}
                  className="flex items-center gap-2 w-full bg-stone-900/40 hover:bg-stone-800 text-stone-300 border border-stone-800 rounded-none px-4 py-2.5 transition-all font-bold uppercase tracking-widest text-xs text-left"
                >
                  <Save size={14} className="text-emerald-500" />
                  <span>[ REVISION_CHRONICLES ]</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 更新日志弹窗 */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />

      {/* 快捷键说明弹窗 */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        shortcuts={shortcuts}
        customShortcuts={settings.keyboardShortcuts}
        onUpdateShortcuts={handleUpdateShortcuts}
      />
    </div>
  );
};

export default SettingsModal;
