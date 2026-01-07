import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Download, Upload, Copy, RotateCcw, FileText } from 'lucide-react';
import {
  getAllSlots,
  loadFromSlot,
  saveToSlot,
  deleteSlot,
  getBackups,
  restoreFromBackup,
  createBackup,
  SaveSlot,
  SaveData,
  exportSave,
  importSave,
  getCurrentSlotId,
  setCurrentSlotId,
} from '../utils/saveManagerUtils';
import { showError, showSuccess, showConfirm, showInfo } from '../utils/toastUtils';
import { PlayerStats, LogEntry } from '../types';
import dayjs from 'dayjs';
import { ASSETS } from '../constants/assets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: PlayerStats | null;
  currentLogs: LogEntry[];
  onLoadSave: (player: PlayerStats, logs: LogEntry[]) => void;
  onCompareSaves?: (save1: SaveData, save2: SaveData) => void;
}

const SaveManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentPlayer,
  currentLogs,
  onLoadSave,
  onCompareSaves,
}) => {
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showBackups, setShowBackups] = useState<number | null>(null);
  const [backups, setBackups] = useState<SaveData[]>([]);
  const [currentSlotId, setCurrentSlotIdState] = useState<number>(1);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      refreshSlots();
      setCurrentSlotIdState(getCurrentSlotId());
    }
  }, [isOpen]);

  const refreshSlots = () => {
    const allSlots = getAllSlots();
    setSlots(allSlots);
  };

  const handleSaveToSlot = (slotId: number) => {
    if (!currentPlayer) {
      showError('没有可保存的游戏数据！');
      return;
    }

    showConfirm(
      `确定要保存到存档${slotId}吗？\n\n如果该槽位已有存档，将被覆盖。`,
      '确认保存',
      () => {
        const success = saveToSlot(slotId, currentPlayer, currentLogs);
        if (success) {
          showSuccess(`已保存到存档${slotId}！`);
          refreshSlots();
          setCurrentSlotIdState(slotId);
        } else {
          showError('保存失败，请重试！');
        }
      }
    );
  };

  const handleLoadFromSlot = (slotId: number) => {
    const saveData = loadFromSlot(slotId);
    if (!saveData) {
      showError('该存档槽位为空！');
      return;
    }

    showConfirm(
      `确定要加载存档${slotId}吗？\n\n玩家: ${saveData.player.name}\n境界: ${saveData.player.realm}\n保存时间: ${dayjs(saveData.timestamp).format('YYYY-MM-DD HH:mm:ss')}\n\n当前游戏进度将被替换，页面将自动刷新。`,
      '确认加载',
      () => {
        onLoadSave(saveData.player, saveData.logs);
        setCurrentSlotIdState(slotId);
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    );
  };

  const handleDeleteSlot = (slotId: number) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || !slot.data) {
      showError('该存档槽位为空！');
      return;
    }

    showConfirm(
      `确定要删除存档${slotId}吗？\n\n玩家: ${slot.playerName}\n境界: ${slot.realm}\n\n此操作无法撤销！`,
      '确认删除',
      () => {
        const success = deleteSlot(slotId);
        if (success) {
          showSuccess(`已删除存档${slotId}！`);
          refreshSlots();
          if (currentSlotId === slotId) {
            setCurrentSlotIdState(1);
            setCurrentSlotId(1);
          }
        } else {
          showError('删除失败，请重试！');
        }
      }
    );
  };

  const handleExportSlot = (slotId: number) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || !slot.data) {
      showError('该存档槽位为空！');
      return;
    }

    try {
      const jsonString = exportSave(slot.data);
      const fileName = `xiuxian-save-slot${slotId}-${slot.playerName}-${dayjs(slot.timestamp).format('YYYY-MM-DD HH-mm-ss')}.json`;

      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('存档导出成功！');
    } catch (error) {
      console.error('导出存档失败:', error);
      showError('导出存档失败！');
    }
  };

  const handleImportToSlot = async (event: React.ChangeEvent<HTMLInputElement>, slotId: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.json') && !fileName.endsWith('.txt')) {
      showError('请选择 .json 或 .txt 格式的存档文件！');
      return;
    }

    try {
      const text = await file.text();
      const saveData = importSave(text);

      if (!saveData) {
        showError('存档文件格式错误！');
        return;
      }

      const playerName = saveData.player.name || '未知';
      const realm = saveData.player.realm || '未知';
      const timestamp = saveData.timestamp
        ? dayjs(saveData.timestamp).format('YYYY-MM-DD HH:mm:ss')
        : '未知';

      showConfirm(
        `确定要导入到存档${slotId}吗？\n\n玩家名称: ${playerName}\n境界: ${realm}\n保存时间: ${timestamp}\n\n如果该槽位已有存档，将被覆盖。`,
        '确认导入',
        () => {
          const success = saveToSlot(slotId, saveData.player, saveData.logs);
          if (success) {
            showSuccess(`已导入到存档${slotId}！`);
            refreshSlots();
          } else {
            showError('导入失败，请重试！');
          }
        }
      );
    } catch (error) {
      console.error('导入存档失败:', error);
      showError('导入存档失败！');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleShowBackups = (slotId: number) => {
    if (showBackups === slotId) {
      setShowBackups(null);
      setBackups([]);
    } else {
      const slotBackups = getBackups(slotId);
      setBackups(slotBackups);
      setShowBackups(slotId);
    }
  };

  const handleCreateBackup = (slotId: number) => {
    if (!currentPlayer || currentSlotId !== slotId) {
      showError('请先加载该存档槽位！');
      return;
    }

    const success = createBackup(slotId);
    if (success) {
      showSuccess('备份创建成功！');
      if (showBackups === slotId) {
        setBackups(getBackups(slotId));
      }
    } else {
      showError('备份创建失败！');
    }
  };

  const handleRestoreBackup = (slotId: number, backupIndex: number) => {
    showConfirm(
      `确定要从备份恢复存档${slotId}吗？\n\n当前存档将被备份覆盖，页面将自动刷新。`,
      '确认恢复',
      () => {
        const success = restoreFromBackup(slotId, backupIndex);
        if (success) {
          showSuccess('备份恢复成功！');
          setTimeout(() => {
            window.location.reload();
          }, 100);
        } else {
          showError('备份恢复失败！');
        }
      }
    );
  };

  const handleCompareSaves = (slotId1: number, slotId2: number) => {
    const slot1 = slots.find((s) => s.id === slotId1);
    const slot2 = slots.find((s) => s.id === slotId2);

    if (!slot1 || !slot1.data || !slot2 || !slot2.data) {
      showError('请选择两个有效的存档进行对比！');
      return;
    }

    if (onCompareSaves) {
      onCompareSaves(slot1.data, slot2.data);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4"
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
            [ DATA_STORAGE_MANAGER ]
          </h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-emerald-500 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="modal-scroll-container modal-scroll-content p-4 md:p-6 space-y-6 relative z-10">
          {/* 存档槽位列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slots.map((slot) => {
              const isEmpty = !slot.data;
              const isCurrent = currentSlotId === slot.id;

              return (
                <div
                  key={slot.id}
                  className={`border p-4 transition-all rounded-none relative group/slot ${
                    isEmpty
                      ? 'border-stone-800 bg-stone-900/20 opacity-60'
                      : isCurrent
                        ? 'border-emerald-500 bg-emerald-900/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : 'border-stone-800 bg-stone-900/40 hover:border-stone-700'
                  }`}
                >
                  {/* 悬停纹理 */}
                  {!isEmpty && (
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/slot:opacity-[0.02] transition-opacity"
                      style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }} />
                  )}

                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-stone-300 uppercase tracking-wider">
                          SLOT_{slot.id.toString().padStart(2, '0')}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-emerald-900 text-emerald-500 border border-emerald-500/50 px-2 py-0.5 font-bold uppercase tracking-widest">
                            ACTIVE
                          </span>
                        )}
                        {isEmpty && (
                          <span className="text-[10px] text-stone-600 font-bold uppercase tracking-widest">
                            EMPTY_BUFFER
                          </span>
                        )}
                      </div>
                      {!isEmpty && (
                        <div className="text-[11px] space-y-1 font-bold uppercase tracking-wider">
                          <div className="text-emerald-500/80">SUBJECT: {slot.playerName}</div>
                          <div className="text-stone-400">STATE: {slot.realm} {slot.realmLevel}_LVL</div>
                          <div className="text-stone-600 text-[10px] mt-2">
                            TIMESTAMP: {dayjs(slot.timestamp).format('YYYY.MM.DD_HH:MM:SS')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 relative z-10">
                    {!isEmpty && (
                      <>
                        <button
                          onClick={() => handleLoadFromSlot(slot.id)}
                          className="bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-500 border border-emerald-800/50 rounded-none text-[10px] py-2 flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest transition-all"
                        >
                          <RotateCcw size={12} />
                          [ LOAD ]
                        </button>
                        <button
                          onClick={() => handleExportSlot(slot.id)}
                          className="bg-stone-900/40 hover:bg-stone-800 text-stone-400 border border-stone-800 rounded-none text-[10px] py-2 flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest transition-all"
                        >
                          <Download size={12} />
                          [ EXPORT ]
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="bg-red-900/10 hover:bg-red-900/20 text-red-500/70 hover:text-red-500 border border-red-900/30 rounded-none text-[10px] py-2 flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest transition-all"
                        >
                          <Trash2 size={12} />
                          [ PURGE ]
                        </button>
                        <button
                          onClick={() => handleShowBackups(slot.id)}
                          className="bg-stone-900/40 hover:bg-stone-800 text-stone-400 border border-stone-800 rounded-none text-[10px] py-2 flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest transition-all"
                        >
                          <Copy size={12} />
                          [ BACKUP ]
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleSaveToSlot(slot.id)}
                      className={`col-span-1 ${isEmpty ? 'col-span-2' : ''} bg-emerald-600 hover:bg-emerald-500 text-white rounded-none text-[10px] py-2 flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)]`}
                      disabled={!currentPlayer}
                    >
                      <Save size={12} />
                      {isEmpty ? '[ INITIALIZE_SAVE ]' : '[ OVERWRITE ]'}
                    </button>
                    <label className="col-span-1 bg-stone-900/40 hover:bg-stone-800 text-stone-400 border border-stone-800 rounded-none text-[10px] py-2 flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest transition-all cursor-pointer">
                      <Upload size={12} />
                      [ IMPORT ]
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.txt"
                        onChange={(e) => handleImportToSlot(e, slot.id)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* 备份列表 */}
                  {showBackups === slot.id && (
                    <div className="mt-4 pt-4 border-t border-stone-800 relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-[0.2em]">
                          REDUNDANCY_LOGS
                        </span>
                        <button
                          onClick={() => handleCreateBackup(slot.id)}
                          className="text-[9px] bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-500 border border-emerald-800/50 px-2 py-1 rounded-none font-bold uppercase tracking-widest transition-all"
                          disabled={!currentPlayer || currentSlotId !== slot.id}
                        >
                          [ CREATE_BACKUP ]
                        </button>
                      </div>
                      {backups.length === 0 ? (
                        <div className="text-[10px] text-stone-600 py-3 text-center italic uppercase tracking-wider">
                          NO_BACKUP_DATA_FOUND
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {backups.map((backup, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-stone-900/60 border border-stone-800/50 text-[10px]"
                            >
                              <div className="flex flex-col">
                                <span className="text-stone-400 font-bold uppercase">
                                  {backup.player.name}
                                </span>
                                <span className="text-[9px] text-stone-600 font-mono">
                                  {dayjs(backup.timestamp).format('YYYY.MM.DD_HH:MM')}
                                </span>
                              </div>
                              <button
                                onClick={() => handleRestoreBackup(slot.id, idx)}
                                className="text-emerald-500/60 hover:text-emerald-500 transition-colors font-bold uppercase tracking-widest"
                              >
                                [ RESTORE ]
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 存档对比功能 */}
          {onCompareSaves && (
            <div className="pt-6 border-t border-stone-800 relative z-10">
              <h3 className="text-xs font-bold text-emerald-500 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <FileText size={16} />
                [ DATA_DIFFERENTIAL_ANALYSIS ]
              </h3>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex gap-2">
                  <select
                    id="compare-slot1"
                    className="flex-1 bg-stone-900/60 border border-stone-800 rounded-none px-3 py-2 text-stone-300 text-[10px] font-bold uppercase tracking-widest focus:border-emerald-500 outline-none transition-colors"
                  >
                    <option value="" className="bg-ink-950">SELECT_SOURCE_A</option>
                    {slots
                      .filter((s) => s.data)
                      .map((slot) => (
                        <option key={slot.id} value={slot.id} className="bg-ink-950">
                          SLOT_{slot.id} - {slot.playerName}
                        </option>
                      ))}
                  </select>
                  <select
                    id="compare-slot2"
                    className="flex-1 bg-stone-900/60 border border-stone-800 rounded-none px-3 py-2 text-stone-300 text-[10px] font-bold uppercase tracking-widest focus:border-emerald-500 outline-none transition-colors"
                  >
                    <option value="" className="bg-ink-950">SELECT_SOURCE_B</option>
                    {slots
                      .filter((s) => s.data)
                      .map((slot) => (
                        <option key={slot.id} value={slot.id} className="bg-ink-950">
                          SLOT_{slot.id} - {slot.playerName}
                        </option>
                      ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    const slot1Select = document.getElementById(
                      'compare-slot1'
                    ) as HTMLSelectElement;
                    const slot2Select = document.getElementById(
                      'compare-slot2'
                    ) as HTMLSelectElement;
                    const slotId1 = parseInt(slot1Select.value, 10);
                    const slotId2 = parseInt(slot2Select.value, 10);

                    if (!slotId1 || !slotId2) {
                      showError('请选择两个存档进行对比！');
                      return;
                    }

                    if (slotId1 === slotId2) {
                      showError('请选择两个不同的存档！');
                      return;
                    }

                    handleCompareSaves(slotId1, slotId2);
                  }}
                  className="bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-500 border border-emerald-800/50 rounded-none px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  [ ANALYZE ]
                </button>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-stone-800 relative z-10">
            <p className="text-[10px] text-stone-600 text-center font-bold uppercase tracking-[0.2em] leading-relaxed">
              STORAGE_PROTOCOL: ALL_DATA_LOCALIZED_TO_USER_INTERFACE_STORAGE_BUFFER<br/>
              MANUAL_EXPORT_RECOMMENDED_FOR_CRITICAL_PROGRESS_RETENTION
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveManagerModal;

