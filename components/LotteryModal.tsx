import React, { useState, useEffect, useRef } from 'react';
import { X, Gift, Sparkles } from 'lucide-react';
import { PlayerStats, LotteryPrize, ItemRarity } from '../types';
import { ASSETS } from '../constants/assets';
import { LOTTERY_PRIZES } from '../constants/index';
import { showError } from '../utils/toastUtils';
import { getRarityColor, getRarityBorder } from '../utils/rarityUtils';

interface LotteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerStats;
  onDraw: (count: number) => void;
}

const LotteryModal: React.FC<LotteryModalProps> = ({ isOpen, onClose, player, onDraw }) => {
  if (!isOpen) return null;

  const [isDrawing, setIsDrawing] = useState(false);
  const [lastResult, setLastResult] = useState<LotteryPrize[] | null>(null);
  const [displayTickets, setDisplayTickets] = useState(player.lotteryTickets);
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const drawTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 将输入值转换为数字，空字符串时返回0
  const customCount = customCountInput === '' ? 0 : parseInt(customCountInput, 10) || 0;

  // Listen for changes in ticket count to update display and adjust custom draw count
  useEffect(() => {
    setDisplayTickets(player.lotteryTickets);
    // Adjust custom draw count if it exceeds available tickets
    const currentCount = parseInt(customCountInput, 10) || 1;
    if (currentCount > player.lotteryTickets && player.lotteryTickets > 0) {
      setCustomCountInput(String(player.lotteryTickets));
    } else if (player.lotteryTickets === 0 && currentCount > 1) {
      setCustomCountInput('1');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.lotteryTickets]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (drawTimeoutRef.current) {
        clearTimeout(drawTimeoutRef.current);
        drawTimeoutRef.current = null;
      }
    };
  }, []);

  const handleDraw = async (count: number) => {
    const currentTickets = player.lotteryTickets;
    if (currentTickets < count) {
      showError(`Insufficient Tickets! Need ${count}, current: ${currentTickets}`);
      return;
    }
    if (count <= 0 || !Number.isInteger(count)) {
      showError('Count must be a positive integer!');
      return;
    }

    // 清理之前的定时器
    if (drawTimeoutRef.current) {
      clearTimeout(drawTimeoutRef.current);
    }

    setIsDrawing(true);
    setLastResult(null);

    // 抽奖动画持续时间（根据抽奖次数调整，但不超过5秒）
    const drawDuration = Math.min(2500 + (count - 1) * 200, 5000);

    // 模拟抽奖动画
    drawTimeoutRef.current = setTimeout(() => {
      setIsDrawing(false);
      onDraw(count);
      // 这里应该从实际抽奖结果中获取，暂时用空数组
      setLastResult([]);
      drawTimeoutRef.current = null;
    }, drawDuration);
  };

  // 渲染抽奖动画遮罩
  const renderDrawingOverlay = () => {
    if (!isDrawing) return null;

    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 animate-in fade-in duration-500">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* 八卦阵背景 */}
          <div className="absolute inset-0 border-4 border-mystic-gold/20 rounded-full animate-bagua flex items-center justify-center">
            <div className="w-[90%] h-[90%] border-2 border-mystic-gold/10 rounded-full border-dashed" />
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="text-4xl text-mystic-gold font-bold">☯</div>
            </div>
          </div>

          {/* 灵气汇聚粒子 */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="spirit-particle"
              style={
                {
                  '--rotation': `${i * 30}deg`,
                  animationDelay: `${i * 0.1}s`,
                  color:
                    i % 3 === 0
                      ? '#fbbf24'
                      : i % 3 === 1
                        ? '#a78bfa'
                        : '#60a5fa',
                } as React.CSSProperties
              }
            />
          ))}

          {/* 中心光点 */}
          <div className="relative z-10 w-16 h-16 bg-mystic-gold rounded-full shadow-[0_0_50px_rgba(203,161,53,0.8)] flex items-center justify-center animate-pulse">
            <Sparkles
              className="text-white w-8 h-8 animate-spin"
              style={{ animationDuration: '3s' }}
            />
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="text-2xl font-serif text-mystic-gold tracking-[0.5em] animate-pulse">
            ACCESSING DATABASE...
          </div>
          <div className="mt-2 text-stone-500 text-sm">Querying Supply Manifest</div>
        </div>

        {/* 氛围装饰 */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-24 opacity-30">
          <div className="w-1 h-32 bg-gradient-to-t from-transparent via-mystic-gold to-transparent" />
          <div className="w-1 h-32 bg-gradient-to-t from-transparent via-mystic-gold to-transparent" />
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm touch-manipulation font-mono"
      onClick={() => !isDrawing && onClose()}
    >
      {renderDrawingOverlay()}
      <div
          className="bg-ink-950 w-full h-[80vh] md:h-auto md:max-w-2xl rounded-none border-0 md:border border-stone-800 shadow-2xl flex flex-col md:max-h-[90vh] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 背景纹理 */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
          
          {/* CRT 效果层 */}
          <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none z-50"></div>
          <div className="crt-noise"></div>
          <div className="crt-vignette"></div>

          <div className="p-3 md:p-4 border-b border-stone-800 flex justify-between items-center bg-stone-950 rounded-none z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg md:text-xl font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-2">
              <Gift className="text-emerald-500 w-5 h-5 md:w-6 md:h-6" />
              Lottery_Terminal
            </h2>
            <div className="hidden md:block px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] uppercase tracking-widest">System_Active</div>
          </div>
          <button
            onClick={onClose}
            disabled={isDrawing}
            className={`text-stone-500 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation transition-colors ${isDrawing
                ? 'opacity-20 cursor-not-allowed'
                : 'active:text-white hover:text-stone-300'
              }`}
          >
            <X size={24} />
          </button>
        </div>

        <div className="modal-scroll-container modal-scroll-content p-6 space-y-6 bg-ink-950/50 z-10">
          {/* 抽奖券信息 */}
          <div className="bg-stone-900/50 rounded-none p-4 border border-stone-800 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
            <div className="relative z-10">
              <div className="text-2xl font-bold text-emerald-400 mb-2">
                {displayTickets} x
              </div>
              <div className="text-stone-400 text-xs uppercase tracking-widest">Supply_Tickets_Available</div>
              <div className="text-[10px] text-stone-500 mt-2 uppercase tracking-tighter">
                Total_Draws_Executed: {player.lotteryCount}
                {player.lotteryCount >= 10 && player.lotteryCount % 10 !== 0 && (
                  <span className="text-emerald-500/60 ml-2">
                    ({10 - (player.lotteryCount % 10)} more for Rare+)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 抽奖按钮 */}
          <div className="space-y-4">
            {/* 快速抽奖按钮 */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDraw(1)}
                disabled={isDrawing || displayTickets < 1}
                className="group relative px-6 py-8 bg-stone-900/40 hover:bg-stone-800/60 rounded-none border border-stone-800 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {isDrawing ? (
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    <span className="text-emerald-500 text-[10px] uppercase tracking-widest">Searching...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <Gift
                      size={32}
                      className="text-stone-500 group-hover:text-emerald-500 transition-colors"
                    />
                    <span className="font-bold text-stone-300 uppercase tracking-wider">Single_Draw</span>
                    <span className="text-[10px] text-stone-600 uppercase">Cost: 1_Unit</span>
                  </div>
                )}
              </button>

              <button
                onClick={() => handleDraw(10)}
                disabled={isDrawing || displayTickets < 10}
                className="group relative px-6 py-8 bg-stone-900/40 hover:bg-stone-800/60 rounded-none border border-stone-800 hover:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 draw-button-shimmer pointer-events-none opacity-10" />

                {isDrawing ? (
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    <span className="text-emerald-500 text-[10px] uppercase tracking-widest">Processing...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <Sparkles
                      size={32}
                      className="text-stone-500 group-hover:text-emerald-500 transition-colors"
                    />
                    <span className="font-bold text-stone-300 uppercase tracking-wider">10x_Draw</span>
                    <span className="text-[10px] text-stone-600 uppercase">Cost: 10_Units</span>
                  </div>
                )}
              </button>
            </div>

            {/* 自定义连抽 */}
            <div className="bg-stone-900/40 rounded-none p-4 border border-stone-800 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: `url(${ASSETS.TEXTURES.PANEL_FRAME})`, backgroundSize: 'cover' }}></div>
              <div className="relative z-10">
                <div className="text-[10px] font-bold text-stone-500 mb-3 uppercase tracking-widest">
                  Bulk_Supply_Request
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max={displayTickets}
                    value={customCountInput}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                        setCustomCountInput('');
                        return;
                      }
                      const value = parseInt(inputValue, 10);
                      if (!isNaN(value) && value > 0) {
                        setCustomCountInput(String(Math.max(1, value)));
                      }
                    }}
                    onBlur={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === '') {
                        return;
                      }
                      const value = parseInt(inputValue, 10);
                      if (isNaN(value) || value < 1) {
                        setCustomCountInput('');
                      } else {
                        const maxValue = displayTickets > 0 ? displayTickets : 1;
                        const validValue = Math.min(Math.max(1, value), maxValue);
                        setCustomCountInput(String(validValue));
                      }
                    }}
                    disabled={isDrawing}
                    className="flex-1 px-3 py-2 bg-stone-950 border border-stone-800 rounded-none text-emerald-500 focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    placeholder="ENTER_QTY"
                  />
                  <button
                    onClick={() => handleDraw(customCount)}
                    disabled={
                      isDrawing || displayTickets < customCount || customCount < 1
                    }
                    className="px-6 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-none text-stone-300 text-xs font-bold transition-colors border border-stone-700 uppercase tracking-wider"
                  >
                    {customCount > 0 ? `EXECUTE_${customCount}` : 'SET_COUNT'}
                  </button>
                </div>
                <div className="text-[9px] text-stone-600 mt-2 uppercase tracking-tighter">
                  {customCount > 0 ? `Resource_Requirement: ${customCount}_Tickets` : 'Awaiting input...'}
                  {customCount > 0 && displayTickets < customCount && (
                    <span className="text-red-900 ml-2">!_INSUFFICIENT_RESOURCES</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 奖品稀有度分布 */}
          <div>
            <h3 className="text-xs font-bold mb-3 text-stone-500 uppercase tracking-widest">Supply_Manifest_Probabilities</h3>
            <div className="space-y-3">
              {(['Common', 'Rare', 'Epic', 'Legendary'] as const).map((rarity) => {
                const prizesOfRarity = LOTTERY_PRIZES.filter(
                  (p) => p.rarity === rarity
                );
                const totalWeight = LOTTERY_PRIZES.reduce(
                  (sum, p) => sum + p.weight,
                  0
                );
                const rarityWeight = prizesOfRarity.reduce(
                  (sum, p) => sum + p.weight,
                  0
                );
                const probability = (
                  (rarityWeight / totalWeight) *
                  100
                ).toFixed(1);

                return (
                  <div
                    key={rarity}
                    className={`bg-stone-900/40 rounded-none p-3 border border-stone-800 relative overflow-hidden group`}
                  >
                    <div className="absolute inset-0 bg-stone-800/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            rarity === 'Common' ? 'text-stone-400' : 
                            rarity === 'Rare' ? 'text-blue-400' : 
                            rarity === 'Epic' ? 'text-purple-400' : 'text-emerald-400'
                          }`}
                        >
                          {rarity}
                        </div>
                        <div className="text-[9px] text-stone-600 uppercase tracking-tighter">
                          [{prizesOfRarity.length}_Entries]
                        </div>
                      </div>
                      <div className="text-xs font-bold text-stone-400 font-mono">
                        {probability}%
                      </div>
                    </div>
                    <div className="mt-2 bg-stone-950 border border-stone-800 h-1 overflow-hidden">
                      <div
                        className={`h-full ${
                          rarity === 'Common' ? 'bg-stone-600' : 
                          rarity === 'Rare' ? 'bg-blue-600' : 
                          rarity === 'Epic' ? 'bg-purple-600' : 'bg-emerald-600'
                        } opacity-50`}
                        style={{ width: `${probability}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-[9px] text-stone-600 text-center uppercase tracking-widest">
              * Guaranteed_Rare+ unit every 10 sequential cycles.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotteryModal;
