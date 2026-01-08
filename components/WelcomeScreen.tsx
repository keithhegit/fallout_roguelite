import React, { useRef } from 'react';
import { ASSETS } from '../constants/assets';
import { Sparkles, Play, Upload } from 'lucide-react';

import {
  getCurrentSlotId,
  saveToSlot,
  importSave,
  ensurePlayerStatsCompatibility,
} from '../utils/saveManagerUtils';
import { showError, showConfirm } from '../utils/toastUtils';

interface Props {
  hasSave: boolean;
  onStart: () => void;
  onContinue: () => void;
}

const WelcomeScreen: React.FC<Props> = ({ hasSave, onStart, onContinue }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportSave = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Support .json and .txt files
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.json') && !fileName.endsWith('.txt')) {
      showError('Please select a .json or .txt save file!');
      return;
    }

    try {
      const text = await file.text();
      // Process save using importSave function (supports Base64)
      const saveData = importSave(text);

      if (!saveData) {
        showError('Save file format error! Please ensure the content is valid JSON.');
        return;
      }

      // Preview save info
      const playerName = saveData.player.name || 'Unknown';
      const realm = saveData.player.realm || 'Unknown';
      const timestamp = saveData.timestamp
        ? new Date(saveData.timestamp).toLocaleString('en-US')
        : 'Unknown';

      onContinue();
      // Confirm import
      showConfirm(
        `Are you sure you want to import this save?\n\nPlayer: ${playerName}\nRank: ${realm}\nSaved: ${timestamp}\n\nCurrent save will be replaced and the page will refresh.`,
        'Confirm Import',
        () => {
          try {
            // Get current slot ID, default to 1
            const currentSlotId = getCurrentSlotId();

            // Save to current slot using new system
            const success = saveToSlot(
              currentSlotId,
              ensurePlayerStatsCompatibility(saveData.player),
              saveData.logs
            );

            if (!success) {
              showError('Failed to save, please try again!');
              return;
            }

            // Refresh page directly, no re-confirmation needed
            // Delay slightly to let user see completion
            setTimeout(() => {
              window.location.reload();
            }, 100);
          } catch (error) {
            console.error('Save failed:', error);
            showError('Failed to save, please try again!');
          }
        }
      );
    } catch (error) {
      console.error('Import failed:', error);
      showError(
        `Import failed! Error: ${error instanceof Error ? error.message : 'Unknown error'}, please check file format.`
      );
    }

    // Clear file input to allow re-selecting same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-ink-950 flex items-center justify-center z-50 overflow-hidden touch-manipulation crt-screen">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
        style={{ backgroundImage: `url(${ASSETS.BRAND.WELCOME_BG})` }}
      ></div>
      
      {/* CRT Visual Layers */}
      <div className="crt-noise"></div>
      <div className="crt-vignette"></div>
      <div className="scanline-overlay"></div>

      {/* Main Content Area */}
      <div className="relative z-30 flex flex-col items-center justify-center w-full h-full p-6 sm:p-8">
        {/* Logo Image */}
        <div className="mb-8 sm:mb-12 animate-fade-in">
          <div className="relative">
            <img
              src={ASSETS.BRAND.LOGO}
              alt="Wasteland Survivor"
              className="w-[75vw] max-w-[300px] sm:max-w-[450px] h-auto object-contain drop-shadow-[0_0_20px_rgba(203,161,53,0.3)] relative z-10 animate-glow-pulse"
            />
            {/* Glow Effect */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] aspect-square -z-10 opacity-30 pointer-events-none">
              <div
                className="w-full h-full animate-glow-pulse blur-3xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(203, 161, 53, 0.4) 0%, transparent 70%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* 游戏标题 */}
        <div
          className="text-center mb-10 sm:mb-16 px-4 animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          <h1 className="text-3xl sm:text-5xl font-mono font-bold text-amber-400 tracking-[0.2em] mb-4 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] uppercase">
            Wasteland Survivor
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-8 bg-amber-500/30"></div>
            <p className="text-amber-400/60 text-xs sm:text-sm font-mono tracking-[0.3em] uppercase">
              Terminal v2.1.0
            </p>
            <div className="h-[1px] w-8 bg-amber-500/30"></div>
          </div>
        </div>

        {/* Game Buttons */}
        <div
          className="animate-fade-in flex flex-col gap-4 w-full max-w-xs sm:max-w-sm px-4"
          style={{ animationDelay: '0.4s' }}
        >
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleImportSave}
            className="hidden"
          />

          {hasSave ? (
            // Has save: Show Continue and New Game buttons
            <>
              <button
                onClick={onContinue}
                className="group relative px-8 py-4 bg-emerald-500 text-ink-950 font-bold text-base sm:text-lg rounded-none transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 min-h-[60px] touch-manipulation uppercase tracking-[0.2em] border-2 border-emerald-500 overflow-hidden"
              >
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-[0.05] transition-opacity"
                  style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }} />
                <Play
                  size={22}
                  className="relative z-10 flex-shrink-0"
                />
                <span className="relative z-10 whitespace-nowrap">
                  Continue Journey
                </span>
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onStart}
                  className="group relative px-4 py-3 bg-stone-900/40 text-stone-400 font-bold text-xs sm:text-sm rounded-none transition-all duration-300 border-2 border-stone-800 hover:border-emerald-500/50 hover:text-emerald-500 flex items-center justify-center gap-2 min-h-[50px] touch-manipulation uppercase tracking-wider overflow-hidden"
                >
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-[0.03] transition-opacity"
                    style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }} />
                  <Sparkles size={16} className="relative z-10" />
                  <span className="relative z-10">New Game</span>
                </button>
                <button
                  onClick={handleImportClick}
                  className="group relative px-4 py-3 bg-stone-900/40 text-stone-400 font-bold text-xs sm:text-sm rounded-none transition-all duration-300 border-2 border-stone-800 hover:border-emerald-500/50 hover:text-emerald-500 flex items-center justify-center gap-2 min-h-[50px] touch-manipulation uppercase tracking-wider overflow-hidden"
                >
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-[0.03] transition-opacity"
                    style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }} />
                  <Upload size={16} className="relative z-10" />
                  <span className="relative z-10">Import</span>
                </button>
              </div>
            </>
          ) : (
            // No save: Show Start Game and Import buttons
            <>
              <button
                onClick={onStart}
                className="group relative px-8 py-4 bg-emerald-500 text-ink-950 font-bold text-base sm:text-lg rounded-none transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 min-h-[60px] touch-manipulation uppercase tracking-[0.2em] border-2 border-emerald-500 overflow-hidden"
              >
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-[0.05] transition-opacity"
                  style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }} />
                <Sparkles
                  size={22}
                  className="relative z-10 flex-shrink-0"
                />
                <span className="relative z-10 whitespace-nowrap">Enter Wasteland</span>
              </button>
              <button
                onClick={handleImportClick}
                className="group relative px-8 py-3 bg-stone-900/40 text-stone-400 font-bold text-sm rounded-none transition-all duration-300 border-2 border-stone-800 hover:border-emerald-500/50 hover:text-emerald-500 flex items-center justify-center gap-2 min-h-[50px] touch-manipulation uppercase tracking-[0.2em] overflow-hidden"
              >
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-[0.03] transition-opacity"
                  style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }} />
                <Upload size={18} className="relative z-10" />
                <span className="relative z-10">Import Save</span>
              </button>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="absolute bottom-8 left-0 right-0 text-center animate-fade-in opacity-40 text-[10px] font-mono tracking-widest uppercase pointer-events-none" style={{ animationDelay: '0.6s' }}>
          Authorized access only // RobCo Industries
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
