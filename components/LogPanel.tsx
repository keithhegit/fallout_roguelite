import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { LogEntry } from '../types';
import { GlobalChat } from './GlobalChat';
import { ChevronsDown, Trash2, Info, TrendingUp, AlertTriangle, Star } from 'lucide-react';

interface Props {
  logs: LogEntry[];
  playerName: string;
  className?: string;
  onClearLogs?: () => void;
}

// Limit number of logs to recent 500 to avoid DOM performance issues
const MAX_LOGS = 500;

// Individual log item component, optimized with memo
const LogItem = React.memo<{ log: LogEntry }>(({ log }) => {
  const timeString = useMemo(
    () => new Date(log.timestamp).toLocaleTimeString(),
    [log.timestamp]
  );

  const { containerClass, icon, iconColor, borderColor } = useMemo(() => {
    const baseClass =
      'p-3 rounded-none border font-mono text-xs md:text-sm lg:text-base leading-relaxed animate-fade-in uppercase tracking-wider relative overflow-hidden group transition-all duration-300 hover:translate-x-1';
    
    switch (log.type) {
      case 'gain':
        return {
          containerClass: `${baseClass} border-emerald-500/30 bg-emerald-950/10 hover:bg-emerald-950/20 hover:border-emerald-500/50`,
          icon: <TrendingUp size={14} />,
          iconColor: 'text-emerald-500',
          borderColor: 'border-emerald-500/30'
        };
      case 'danger':
        return {
          containerClass: `${baseClass} border-red-600/30 bg-red-950/10 hover:bg-red-950/20 hover:border-red-500/50`,
          icon: <AlertTriangle size={14} />,
          iconColor: 'text-red-500',
          borderColor: 'border-red-600/30'
        };
      case 'special':
        return {
          containerClass: `${baseClass} border-amber-500/30 bg-amber-950/10 hover:bg-amber-950/20 hover:border-amber-500/50`,
          icon: <Star size={14} />,
          iconColor: 'text-amber-500',
          borderColor: 'border-amber-500/30'
        };
      default:
        return {
          containerClass: `${baseClass} border-stone-800 bg-stone-900/40 hover:bg-stone-900/60 hover:border-stone-600`,
          icon: <Info size={14} />,
          iconColor: 'text-stone-500',
          borderColor: 'border-stone-800'
        };
    }
  }, [log.type]);

  return (
    <div className={containerClass}>
      {/* Decorative corner */}
      <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${borderColor} opacity-50`}></div>
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${borderColor} opacity-50`}></div>

      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${iconColor} opacity-70`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] md:text-xs opacity-40 mb-1 font-mono flex items-center gap-2">
            <span>{timeString}</span>
            <span className="h-px w-4 bg-current opacity-30"></span>
            <span>{log.type === 'normal' ? 'SYSTEM' : log.type}</span>
          </div>
          <div className={log.type === 'normal' ? 'text-stone-400' : log.type === 'gain' ? 'text-emerald-200' : log.type === 'danger' ? 'text-red-200' : 'text-amber-200'}>
            {log.text}
          </div>
        </div>
      </div>
    </div>
  );
});

LogItem.displayName = 'LogItem';

const LogPanel: React.FC<Props> = ({ logs, playerName, className, onClearLogs }) => {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const lastLogIdRef = useRef<string | null>(null);
  const shouldAutoScrollRef = useRef(true); // Track if auto-scroll is enabled
  // Limit log count to recent items only
  const displayedLogs = useMemo(() => {
    if (logs.length <= MAX_LOGS) return logs;
    return logs.slice(-MAX_LOGS);
  }, [logs]);

  // Check if at bottom
  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Calculate distance from bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    // If distance from bottom is <= 50px, consider it at bottom (add tolerance to avoid frequent toggling)
    return distanceFromBottom <= 50;
  }, []);

  // Auto-scroll to bottom when new logs arrive if user is at bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container || logs.length === 0) return;

    const lastLog = logs[logs.length - 1];
    const hasNewLog = lastLog.id !== lastLogIdRef.current;

    if (hasNewLog) {
      lastLogIdRef.current = lastLog.id;

      // Check if user is at bottom
      const isAtBottom = checkIfAtBottom();
      shouldAutoScrollRef.current = isAtBottom;

      if (!isAtBottom) {
        // Use requestAnimationFrame to ensure scroll happens after DOM update
        requestAnimationFrame(() => {
          endRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
      }
    }

    // Only update scroll button state when logs actually increase
    // Timer logic here can be optimized to trigger only on scroll event or new log
  }, [logs.length, checkIfAtBottom]); // Depend on logs.length instead of logs array reference

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom = checkIfAtBottom();
      setShowScrollButton(!isAtBottom);
      // Update auto-scroll state: if user manually scrolls to bottom, allow auto-scroll
      shouldAutoScrollRef.current = isAtBottom;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check and 1-second polling (fallback)
    handleScroll();
    const interval = setInterval(handleScroll, 1000);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [checkIfAtBottom]);

  // Scroll to bottom on mount
  useEffect(() => {
    if (displayedLogs.length >= 0) {
      requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    }
  }, []); // Run once on mount

  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });

    // Update auto-scroll state
    shouldAutoScrollRef.current = true;

    // Delay hiding button to wait for scroll completion
    setTimeout(() => {
      setShowScrollButton(false);
    }, 300);
  }, []);

  return (
    <div
      className={`flex-1 bg-stone-950 relative min-h-[200px] md:min-h-[300px] ${className || ''}`}
    >
      {/* Top Gradient Header Mask */}
      <div className="absolute top-0 left-0 w-full h-8 md:h-12 bg-gradient-to-b from-stone-950 to-transparent pointer-events-none z-10" />

      {/* Scroll Container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-hide relative"
      >
        {displayedLogs.length === 0 ? (
          // Empty State
          <div className="h-full flex items-center justify-center p-6">
            <div className="text-center text-stone-500">
              <div className="text-4xl md:text-5xl mb-4 opacity-50">📜</div>
              <p className="text-sm md:text-base font-serif">Empty Manifest</p>
              <p className="text-xs md:text-sm mt-2 opacity-70">Wasteland events will appear here</p>
            </div>
          </div>
        ) : (
          <div className="p-3 md:p-6 space-y-2 md:space-y-4 pb-4">
            {displayedLogs.map((log) => (
              <LogItem key={log.id} log={log} />
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Bottom Gradient Footer Mask */}
      <div className="absolute bottom-0 left-0 w-full h-8 md:h-12 bg-gradient-to-t from-stone-950 to-transparent pointer-events-none z-10" />

      {/* Clear Logs Button - Fixed at bottom right of log window, left of chat button */}
      {onClearLogs && displayedLogs.length > 0 && (
        <button
          onClick={onClearLogs}
          className="absolute bottom-3 right-14 md:bottom-4 md:right-16 z-[100]
                     w-9 h-9 md:w-11 md:h-11
                     bg-stone-900/90 border border-stone-700 text-stone-400
                     hover:border-red-500/50 hover:text-red-500
                     rounded-full flex items-center justify-center
                     shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95
                     transition-all duration-200
                     cursor-pointer pointer-events-auto"
          title="Clear Logs"
          aria-label="Clear Logs"
        >
          <Trash2 size={18} strokeWidth={2.5} />
        </button>
      )}

      {/* Scroll to Bottom Button - Fixed at bottom right of log window, left of clear button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-3 right-[6.5rem] md:bottom-4 md:right-[7.5rem] z-[100]
                     w-9 h-9 md:w-11 md:h-11
                     bg-stone-900/90 border border-stone-700 text-stone-400
                     hover:border-amber-500/50 hover:text-amber-500
                     rounded-full flex items-center justify-center
                     shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95
                     transition-all duration-200
                     cursor-pointer pointer-events-auto"
          title="Scroll to Bottom"
          aria-label="Scroll to Bottom"
        >
          <ChevronsDown size={20} strokeWidth={2.5} />
        </button>
      )}

      {/* Global Chat Button */}
      <GlobalChat playerName={playerName} />
    </div>
  );
};

export default React.memo(LogPanel);
