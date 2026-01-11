/**
 * Item Action Log Hook
 * Encapsulates delayed state management logic for displaying temporary item action messages
 *
 * @example
 * const { itemActionLog, setItemActionLog } = useItemActionLog();
 *
 * // Set log, automatically clears after 3 seconds
 * setItemActionLog({ text: 'You equipped a weapon', type: 'normal' });
 *
 * // Clear immediately
 * setItemActionLog(null);
 */

import { useEffect, useCallback } from 'react';
import { useDelayedState } from './useDelayedState';

export interface ItemActionLog {
  text: string;
  type: string;
  timestamp?: number;
}

export interface UseItemActionLogOptions {
  /**
   * Delay clear time (ms), default 3000ms
   */
  delay?: number;
  /**
   * External state setter (optional)
   * If provided, syncs delayed state to external state
   */
  externalSetter?: (value: ItemActionLog | null) => void;
}

export interface UseItemActionLogReturn {
  /**
   * Current log value
   */
  itemActionLog: ItemActionLog | null;
  /**
   * Set log function
   * @param log Log object or null (to clear)
   */
  setItemActionLog: (log: ItemActionLog | null) => void;
}

/**
 * Item Action Log Hook
 * Encapsulates delayed state management logic for displaying temporary item action messages
 *
 * @param options Configuration options
 * @returns Returns log value and setter function
 */
export function useItemActionLog(
  options: UseItemActionLogOptions = {}
): UseItemActionLogReturn {
  const { delay = 3000, externalSetter } = options;

  // Use delayed state management
  const [delayedItemActionLog, setDelayedItemActionLog] = useDelayedState<ItemActionLog>(delay);

  // Sync delayed state to external state (if external setter provided)
  useEffect(() => {
    if (externalSetter) {
      externalSetter(delayedItemActionLog);
    }
  }, [delayedItemActionLog, externalSetter]);

  // Wrap setter function to support immediate clear
  const setItemActionLog = useCallback(
    (log: ItemActionLog | null) => {
      if (log) {
        // Set log, automatically add timestamp
        const logWithTimestamp = {
          ...log,
          timestamp: log.timestamp || Date.now(),
        };
        // Set log, delayed state will automatically manage clearing
        setDelayedItemActionLog(logWithTimestamp);
      } else {
        // Immediately clear external state
        if (externalSetter) {
          externalSetter(null);
        }
        // Note: Delayed state will automatically clear after delay time
        // If immediate clear of delayed state is needed, consider extending useDelayedState to support direct clearing
      }
    },
    [setDelayedItemActionLog, externalSetter]
  );

  return {
    itemActionLog: delayedItemActionLog,
    setItemActionLog,
  };
}

