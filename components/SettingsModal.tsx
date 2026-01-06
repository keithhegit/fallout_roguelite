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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 touch-manipulation"
      onClick={onClose}
    >
      <div
        className="bg-stone-800 md:rounded-t-2xl md:rounded-b-lg border-0 md:border border-stone-700 w-full h-[80vh] md:h-auto md:max-w-md md:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-stone-800 border-b border-stone-700 p-3 md:p-4 flex justify-between items-center md:rounded-t-2xl flex-shrink-0">
          <h2 className="text-lg md:text-xl font-serif text-mystic-gold">
            System Settings
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 active:text-white min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>

        <div className="modal-scroll-container modal-scroll-content p-6 space-y-6">
          {/* 音效设置 */}
          {/* <div>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 size={20} className="text-stone-400" />
              <h3 className="font-bold">音效</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-stone-300">启用音效</span>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ soundEnabled: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </label>
              {settings.soundEnabled && (
                <div>
                  <label className="block text-sm text-stone-400 mb-2">
                    音效音量: {settings.soundVolume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.soundVolume}
                    onChange={(e) =>
                      onUpdateSettings({
                        soundVolume: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div> */}

          {/* 音乐设置 */}
          {/* <div>
            <div className="flex items-center gap-2 mb-3">
              <Music size={20} className="text-stone-400" />
              <h3 className="font-bold">音乐</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-stone-300">启用音乐</span>
                <input
                  type="checkbox"
                  checked={settings.musicEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ musicEnabled: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </label>
              {settings.musicEnabled && (
                <div>
                  <label className="block text-sm text-stone-400 mb-2">
                    音乐音量: {settings.musicVolume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.musicVolume}
                    onChange={(e) =>
                      onUpdateSettings({
                        musicVolume: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div> */}

          {/* 游戏设置 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Save size={20} className="text-stone-400" />
              <h3 className="font-bold">游戏</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-stone-300">Auto Save</span>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) =>
                    onUpdateSettings({ autoSave: e.target.checked })
                  }
                  className="w-5 h-5"
                />
              </label>
              <div>
                <label className="block text-sm text-stone-400 mb-2">
                  Animation Speed
                </label>
                <select
                  value={settings.animationSpeed}
                  onChange={(e) =>
                    onUpdateSettings({
                      animationSpeed: e.target.value as GameSettings['animationSpeed']
                    })
                  }
                  className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-2">
                  Game Difficulty (View Only)
                </label>
                <div className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200">
                  {settings.difficulty === 'easy' && (
                    <span className="text-green-400 font-semibold">
                      Easy - No Penalties
                    </span>
                  )}
                  {settings.difficulty === 'normal' && (
                    <span className="text-yellow-400 font-semibold">
                      Normal - Partial Loss on Death
                    </span>
                  )}
                  {settings.difficulty === 'hard' && (
                    <span className="text-red-400 font-semibold">
                      Hardcore - Permanent Death
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Difficulty is set at character creation and cannot be changed.
                </p>
              </div>
            </div>
          </div>

          {/* 存档管理 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Save size={20} className="text-stone-400" />
              <h3 className="font-bold">Data Storage</h3>
            </div>
            <div className="space-y-3">
              {onOpenSaveManager && (
                <div>
                  <label className="block text-sm text-stone-400 mb-2">
                    Multi-Slot Management
                  </label>
                  <button
                    onClick={() => {
                      onOpenSaveManager();
                      onClose();
                    }}
                    className="w-full bg-mystic-gold hover:bg-yellow-600 text-stone-900 border border-yellow-500 rounded px-4 py-2 flex items-center justify-center transition-colors font-semibold"
                  >
                    <FolderOpen size={16} className="mr-2" />
                    Open Save Manager
                  </button>
                  <p className="text-xs text-stone-500 mt-2">
                    Manage multiple save slots, backups, and comparisons.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm text-stone-400 mb-2">
                  Export Save
                </label>
                <button
                  onClick={handleExportSave}
                  className="w-full bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded px-4 py-2 flex items-center justify-center transition-colors"
                >
                  <Download size={16} className="mr-2" />
                  Export Current Save (.json)
                </button>
                <p className="text-xs text-stone-500 mt-2">
                  Export your progress to a JSON file for backup or sharing.
                </p>
              </div>
              <div>
                <label className="block text-sm text-stone-400 mb-2">
                  Import Save
                </label>
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
                  className="block w-full bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded px-4 py-2 text-center cursor-pointer transition-colors"
                >
                  <Upload size={16} className="inline mr-2" />
                  Select Save File (.json or .txt)
                </label>
                <p className="text-xs text-stone-500 mt-2">
                  Importing will replace your current simulation data and refresh the browser.
                </p>
              </div>
              {onRestartGame && (
                <div>
                  <label className="block text-sm text-stone-400 mb-2">
                    Reset Progress
                  </label>
                  <button
                    onClick={() => {
                      showInfo('Restarting will clear all progress, including:\n- Character Data\n- Gear & Items\n- Rank & XP\n- All Trophies\n\nThis action cannot be undone!', 'Rebuild Future', () => {
                        onRestartGame();
                        onClose();
                      });

                    }}
                    className="w-full bg-red-700 hover:bg-red-600 text-white border border-red-600 rounded px-4 py-2 flex items-center justify-center transition-colors font-semibold"
                  >
                    <RotateCcw size={16} className="mr-2" />
                    Reset Data
                  </button>
                  <p className="text-xs text-stone-500 mt-2">
                    Clear all current simulation data. Export a backup first if needed.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 语言设置 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={20} className="text-stone-400" />
              <h3 className="font-bold">Language</h3>
            </div>
            <select
              value={settings.language}
              onChange={(e) =>
                onUpdateSettings({
                  language: e.target.value as GameSettings['language']
                })
              }
              className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200"
            >
              <option value="zh">Chinese</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* 快捷键 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Keyboard size={20} className="text-stone-400" />
              <h3 className="font-bold">Shortcuts</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setIsShortcutsOpen(true)}
                className="flex items-center gap-2 w-full bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded px-4 py-2 transition-colors text-left"
              >
                <Keyboard size={16} />
                <span>View Key Bindings</span>
              </button>
              <p className="text-xs text-stone-500">
                View all available keyboard shortcuts for faster navigation.
              </p>
            </div>
          </div>

          {/* 用户反馈交流群 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle size={20} className="text-stone-400" />
              <h3 className="font-bold">Community & Feedback</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-stone-900/50 border border-stone-700 rounded p-4 flex flex-col items-center">
                <img
                  src="/assets/images/group.jpg"
                  alt="Wasteland Survivor Community"
                  className="w-full max-w-xs rounded-lg shadow-lg"
                />
                <p className="text-xs text-stone-400 mt-3 text-center">
                  Scan to join our WeChat group for feedback and strategy.
                </p>
              </div>
            </div>
          </div>

          {/* 关于 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Github size={20} className="text-stone-400" />
              <h3 className="font-bold">About</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-stone-900/50 border border-stone-700 rounded px-4 py-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-stone-400">Version</span>
                  <span className="text-sm font-mono text-mystic-gold">
                    v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
                  </span>
                </div>
                <div className="text-xs text-stone-500">
                  Last Updated: 2024-12-05
                </div>
              </div>
              <a
                href="https://github.com/JeasonLoop/react-xiuxian-game"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded px-4 py-2 transition-colors"
              >
                <Github size={16} />
                <span>GitHub Repository</span>
                <span className="ml-auto text-xs text-stone-400">↗</span>
              </a>
              <button
                onClick={() => setIsChangelogOpen(true)}
                className="flex items-center gap-2 w-full bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600 rounded px-4 py-2 transition-colors text-left"
              >
                <Save size={16} />
                <span>Read Revision Notes</span>
              </button>
              <p className="text-xs text-stone-500">
                A fallout-themed survival sim. Star or Fork on GitHub!
              </p>
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
