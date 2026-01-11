import React, { useState, useEffect, useCallback } from 'react';
import { X, Keyboard, Edit2, RotateCcw, Save, AlertCircle } from 'lucide-react';
import { KeyboardShortcut, formatShortcut } from '../hooks/useKeyboardShortcuts';
import { KeyboardShortcutConfig } from '../types';
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_DESCRIPTIONS,
  checkShortcutConflict,
} from '../utils/shortcutUtils';
import { showError, showSuccess } from '../utils/toastUtils';
import { ASSETS } from '../constants/assets';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
  customShortcuts?: Record<string, KeyboardShortcutConfig>;
  onUpdateShortcuts?: (shortcuts: Record<string, KeyboardShortcutConfig>) => void;
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  shortcuts,
  customShortcuts,
  onUpdateShortcuts,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editedShortcuts, setEditedShortcuts] = useState<
    Record<string, KeyboardShortcutConfig>
  >({});
  const [conflictActionId, setConflictActionId] = useState<string | null>(null);

  // Initialize editing state
  useEffect(() => {
    if (isOpen) {
      setEditedShortcuts(customShortcuts || {});
      setEditingActionId(null);
      setConflictActionId(null);
    }
  }, [isOpen, customShortcuts]);

  // Get current shortcut config (merge default and custom)
  const getCurrentShortcut = useCallback(
    (actionId: string): KeyboardShortcutConfig => {
      return editedShortcuts[actionId] || DEFAULT_SHORTCUTS[actionId] || { key: '' };
    },
    [editedShortcuts]
  );

  // Start editing shortcut
  const handleStartEdit = (actionId: string) => {
    setEditingActionId(actionId);
    setConflictActionId(null);
  };

  // Handle keyboard input
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, actionId: string) => {
      if (editingActionId !== actionId) return;

      // Ignore modifier keys themselves
      if (
        event.key === 'Control' ||
        event.key === 'Shift' ||
        event.key === 'Alt' ||
        event.key === 'Meta'
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const newShortcut: KeyboardShortcutConfig = {
        key: event.key,
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
      };

      // Check for conflicts
      const allShortcuts = { ...DEFAULT_SHORTCUTS, ...editedShortcuts };
      const conflictId = checkShortcutConflict(
        newShortcut,
        actionId,
        allShortcuts
      );

      if (conflictId) {
        setConflictActionId(conflictId);
        showError(
          `Shortcut conflict! This key is already assigned to "${SHORTCUT_DESCRIPTIONS[conflictId]?.description || conflictId}"`
        );
        return;
      }

      setConflictActionId(null);
      setEditedShortcuts((prev) => ({
        ...prev,
        [actionId]: newShortcut,
      }));
      setEditingActionId(null);
    },
    [editingActionId, editedShortcuts]
  );

  // Global keyboard event handler (for editing mode)
  useEffect(() => {
    if (!isEditing || !editingActionId) return;

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Ignore modifier keys themselves
      if (
        event.key === 'Control' ||
        event.key === 'Shift' ||
        event.key === 'Alt' ||
        event.key === 'Meta'
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const newShortcut: KeyboardShortcutConfig = {
        key: event.key,
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey,
      };

      // Check for conflicts
      const allShortcuts = { ...DEFAULT_SHORTCUTS, ...editedShortcuts };
      const conflictId = checkShortcutConflict(
        newShortcut,
        editingActionId,
        allShortcuts
      );

      if (conflictId) {
        setConflictActionId(conflictId);
        showError(
          `Shortcut conflict! This key is already assigned to "${SHORTCUT_DESCRIPTIONS[conflictId]?.description || conflictId}"`
        );
        return;
      }

      setConflictActionId(null);
      setEditedShortcuts((prev) => ({
        ...prev,
        [editingActionId]: newShortcut,
      }));
      setEditingActionId(null);
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown, true);
    };
  }, [isEditing, editingActionId, editedShortcuts]);

  // Reset single shortcut
  const handleResetOne = (actionId: string) => {
    setEditedShortcuts((prev) => {
      const newShortcuts = { ...prev };
      delete newShortcuts[actionId];
      return newShortcuts;
    });
    setConflictActionId(null);
  };

  // Reset all shortcuts
  const handleResetAll = () => {
    setEditedShortcuts({});
    setConflictActionId(null);
    showSuccess('All shortcuts reset to defaults');
  };

  // Save shortcuts
  const handleSave = () => {
    if (onUpdateShortcuts) {
      onUpdateShortcuts(editedShortcuts);
      showSuccess('Shortcuts updated successfully');
      setIsEditing(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditedShortcuts(customShortcuts || {});
    setEditingActionId(null);
    setConflictActionId(null);
    setIsEditing(false);
  };

  if (!isOpen) return null;

  // Group shortcuts by category
  const shortcutsByCategory = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  const categories = Object.keys(shortcutsByCategory);

  // Get actionId (extracted from shortcuts, needs to match)
  const getActionId = (shortcut: KeyboardShortcut): string | null => {
    for (const [actionId, desc] of Object.entries(SHORTCUT_DESCRIPTIONS)) {
      if (
        desc.description === shortcut.description &&
        desc.category === shortcut.category
      ) {
        return actionId;
      }
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 crt-screen"
      onClick={onClose}
    >
      <div
        className="bg-ink-950 w-full max-w-2xl rounded-none border border-stone-800 shadow-2xl relative overflow-hidden flex flex-col font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background texture layer */}
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
              <Keyboard size={24} className="relative z-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-200 tracking-[0.2em] uppercase">KEY_BINDINGS</h2>
              <p className="text-[10px] text-stone-600 tracking-widest uppercase">INPUT_MAPPING // PROTOCOL_V1.0</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                {onUpdateShortcuts && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="h-10 px-4 bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-500/80 hover:text-emerald-500 border border-emerald-900/50 hover:border-emerald-600 transition-all flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold relative group overflow-hidden"
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                      style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                    />
                    <Edit2 size={14} className="relative z-10" />
                    <span className="relative z-10">RECONFIGURE</span>
                  </button>
                )}
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
              </>
            ) : (
              <>
                <button
                  onClick={handleResetAll}
                  className="h-10 px-4 bg-stone-950 hover:bg-stone-900 text-stone-500 hover:text-stone-200 border border-stone-800 transition-all flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold relative group overflow-hidden"
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                    style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                  />
                  <RotateCcw size={14} className="relative z-10" />
                  <span className="relative z-10">RESET_DEFAULTS</span>
                </button>
                <button
                  onClick={handleSave}
                  className="h-10 px-4 bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-500/80 hover:text-emerald-500 border border-emerald-900/50 hover:border-emerald-600 transition-all flex items-center gap-2 uppercase tracking-widest text-[10px] font-bold relative group overflow-hidden"
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                    style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                  />
                  <Save size={14} className="relative z-10" />
                  <span className="relative z-10">COMMIT</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="w-10 h-10 flex items-center justify-center text-stone-600 hover:text-red-500 hover:bg-red-950/10 transition-all border border-stone-800 hover:border-red-900/50 relative group overflow-hidden"
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity"
                    style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}
                  />
                  <X size={24} className="relative z-10" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-8 relative z-10 max-h-[70vh]">
          {categories.map((category) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/50 to-transparent" />
                <h3 className="font-bold text-emerald-500/80 text-xs uppercase tracking-[0.2em]">
                  {category}
                </h3>
                <div className="h-px flex-[4] bg-transparent" />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {shortcutsByCategory[category].map((shortcut, index) => {
                  const actionId = getActionId(shortcut);
                  const isEditingThis = editingActionId === actionId;
                  const currentConfig = actionId
                    ? getCurrentShortcut(actionId)
                    : null;
                  const displayShortcut = currentConfig
                    ? {
                      key: currentConfig.key,
                      ctrl: currentConfig.ctrl,
                      shift: currentConfig.shift,
                      alt: currentConfig.alt,
                      meta: currentConfig.meta,
                      action: shortcut.action,
                      description: shortcut.description,
                      category: shortcut.category,
                    }
                    : shortcut;

                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 bg-stone-900/20 border transition-all rounded-none relative group/item ${isEditingThis
                        ? 'border-emerald-500 bg-emerald-900/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : conflictActionId === actionId
                          ? 'border-red-900/50 bg-red-900/5'
                          : 'border-stone-800/50 hover:border-stone-700 hover:bg-stone-900/40'
                        }`}
                    >
                      {/* Hover texture */}
                      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/item:opacity-[0.02] transition-opacity"
                        style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }} />

                      <span className={`text-xs font-bold uppercase tracking-wider relative z-10 ${
                        isEditingThis ? 'text-emerald-400' : 'text-stone-400'
                      }`}>
                        {shortcut.description}
                      </span>
                      
                      <div className="flex items-center gap-2 relative z-10">
                        {isEditing && actionId ? (
                          <>
                            <button
                              onClick={() => handleStartEdit(actionId)}
                              onKeyDown={(e) => {
                                if (isEditingThis) {
                                  handleKeyDown(e, actionId);
                                }
                              }}
                              onBlur={() => {
                                if (isEditingThis) {
                                  setEditingActionId(null);
                                }
                              }}
                              className={`px-4 py-2 border rounded-none text-xs font-mono transition-all min-w-[140px] ${isEditingThis
                                ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                : 'bg-stone-900/60 border-stone-800 text-stone-500 hover:border-stone-700 hover:text-stone-300'
                                }`}
                              tabIndex={0}
                              autoFocus={isEditingThis}
                            >
                              {isEditingThis
                                ? '>>> LISTENING <<<'
                                : formatShortcut(displayShortcut)}
                            </button>
                            <button
                              onClick={() => actionId && handleResetOne(actionId)}
                              className="p-2 text-stone-600 hover:text-red-400 transition-colors"
                              title="Reset to default"
                            >
                              <RotateCcw size={14} />
                            </button>
                          </>
                        ) : (
                          <kbd className="px-3 py-1.5 bg-stone-900/60 border border-stone-800 rounded-none text-[10px] font-mono text-emerald-500/70 font-bold tracking-widest">
                            {formatShortcut(displayShortcut)}
                          </kbd>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-6 border-t border-stone-800 space-y-4 relative z-10">
            {isEditing && (
              <div className="bg-emerald-900/5 border border-emerald-900/30 rounded-none p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div className="text-[10px] text-emerald-500/70 leading-relaxed font-bold uppercase tracking-widest">
                    <p className="text-emerald-500 mb-2 underline decoration-emerald-500/30 underline-offset-4">
                      PROTOCOL: REBINDING_INSTRUCTIONS
                    </p>
                    <ul className="space-y-1.5">
                      <li className="flex gap-2">
                        <span className="text-emerald-500/40">01.</span>
                        <span>SELECT BINDING SLOT TO INITIALIZE LISTENING MODE</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-emerald-500/40">02.</span>
                        <span>INPUT DESIRED KEY COMBINATION ON PHYSICAL INTERFACE</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-emerald-500/40">03.</span>
                        <span>SYSTEM WILL AUTO-VALIDATE AGAINST CONFLICTS</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-emerald-500/40">04.</span>
                        <span>COMMIT CHANGES VIA SAVE COMMAND TO PERSIST CONFIG</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <p className="text-[10px] text-stone-600 text-center font-bold uppercase tracking-[0.2em]">
              SYSTEM_NOTICE: INTERFACE_INPUTS_PRIORITIZED_OVER_SHORTCUTS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;

