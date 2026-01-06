import React, { useRef } from 'react';
import { Sparkles, Play, Upload } from 'lucide-react';
const logo = 'https://pub-c98d5902eedf42f6a9765dfad981fd88.r2.dev/wasteland/main_logo.png';
import { STORAGE_KEYS } from '../constants/storageKeys';
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
    <div className="fixed inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center z-50 overflow-hidden touch-manipulation">
      {/* Background Decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(203,161,53,0.1),transparent_70%)]" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Logo Image */}
        <div className="mb-4 sm:mb-6 md:mb-8 lg:mb-12 animate-fade-in">
          <div className="relative">
            <img
              src={logo}
              alt="Wasteland Survivor"
              className="w-[70vw] max-w-[280px] sm:w-[60vw] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] h-auto max-h-[30vh] sm:max-h-[35vh] md:max-h-[40vh] lg:max-h-[400px] object-contain drop-shadow-2xl relative z-10 animate-glow-pulse"
            />
            {/* Glow Effect */}
            {/* Glow Effect */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] aspect-square -z-10 opacity-20 sm:opacity-85 pointer-events-none">
              <div
                className="w-full h-full animate-glow-pulse blur-2xl sm:blur-3xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(203, 161, 53, 0.6) 0%, transparent 70%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* 游戏标题 */}
        <div
          className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-12 px-4 animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif font-bold text-mystic-gold tracking-wide sm:tracking-wider md:tracking-widest mb-2 sm:mb-3 md:mb-4 drop-shadow-lg">
            Wasteland Survivor
          </h1>
          <p className="text-stone-400 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-light px-2">
            Embark on your journey of survival
          </p>
        </div>

        {/* Game Buttons */}
        <div
          className="animate-fade-in flex flex-col gap-2 sm:gap-3 md:gap-4 w-full max-w-xs sm:max-w-sm md:max-w-md px-4 sm:px-0"
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
                className="group relative px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-3.5 md:py-4 lg:py-5 bg-gradient-to-r from-mystic-jade to-green-600 text-stone-900 font-bold text-sm sm:text-base md:text-lg lg:text-xl rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 min-h-[50px] sm:min-h-[55px] md:min-h-[60px] lg:min-h-[70px] touch-manipulation overflow-hidden"
              >
                {/* Button Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <Play
                  size={20}
                  className="sm:w-6 sm:h-6 md:w-7 md:h-7 relative z-10 flex-shrink-0"
                />
                <span className="relative z-10 whitespace-nowrap">
                  Continue Journey
                </span>
              </button>
              <button
                onClick={onStart}
                className="group relative px-4 sm:px-6 md:px-8 lg:px-12 py-2.5 sm:py-3 md:py-4 lg:py-5 bg-gradient-to-r from-stone-600 to-stone-700 text-stone-200 font-bold text-xs sm:text-sm md:text-base lg:text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 min-h-[45px] sm:min-h-[50px] md:min-h-[55px] lg:min-h-[60px] touch-manipulation overflow-hidden border border-stone-500"
              >
                {/* Button Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <Sparkles
                  size={18}
                  className="sm:w-5 sm:h-5 md:w-6 md:h-6 relative z-10 flex-shrink-0"
                />
                <span className="relative z-10 whitespace-nowrap">New Game</span>
              </button>
              <button
                onClick={handleImportClick}
                className="group relative px-4 sm:px-6 md:px-8 lg:px-12 py-2.5 sm:py-3 md:py-4 lg:py-5 bg-gradient-to-r from-stone-500 to-stone-600 text-stone-200 font-bold text-xs sm:text-sm md:text-base lg:text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 min-h-[45px] sm:min-h-[50px] md:min-h-[55px] lg:min-h-[60px] touch-manipulation overflow-hidden border border-stone-500"
              >
                {/* Button Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <Upload
                  size={18}
                  className="sm:w-5 sm:h-5 md:w-6 md:h-6 relative z-10 flex-shrink-0"
                />
                <span className="relative z-10 whitespace-nowrap">Import Save</span>
              </button>
            </>
          ) : (
            // No save: Show Start Game and Import buttons
            <>
              <button
                onClick={onStart}
                className="group relative px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-3.5 md:py-4 lg:py-5 bg-gradient-to-r from-mystic-gold to-yellow-600 text-stone-900 font-bold text-sm sm:text-base md:text-lg lg:text-xl rounded-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 min-h-[50px] sm:min-h-[55px] md:min-h-[60px] lg:min-h-[70px] touch-manipulation overflow-hidden"
              >
                {/* Button Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <Sparkles
                  size={20}
                  className="sm:w-6 sm:h-6 md:w-7 md:h-7 relative z-10 flex-shrink-0"
                />
                <span className="relative z-10 whitespace-nowrap">Enter Wasteland</span>
              </button>
              <button
                onClick={handleImportClick}
                className="group relative px-4 sm:px-6 md:px-8 lg:px-12 py-2.5 sm:py-3 md:py-4 lg:py-5 bg-gradient-to-r from-stone-500 to-stone-600 text-stone-200 font-bold text-xs sm:text-sm md:text-base lg:text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 min-h-[45px] sm:min-h-[50px] md:min-h-[55px] lg:min-h-[60px] touch-manipulation overflow-hidden border border-stone-500"
              >
                {/* Button Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                <Upload
                  size={18}
                  className="sm:w-5 sm:h-5 md:w-6 md:h-6 relative z-10 flex-shrink-0"
                />
                <span className="relative z-10 whitespace-nowrap">Import Save</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
