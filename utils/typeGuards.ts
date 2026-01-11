/**
 * Type Guard Utility Functions
 * Used for runtime type checking and type-safe casting
 */

import { DailyQuestType } from '../types';

/**
 * Type Guard: Check if string is valid DailyQuestType
 */
export function isValidDailyQuestType(type: string): type is DailyQuestType {
  const validTypes: DailyQuestType[] = [
    'meditate',
    'adventure',
    'breakthrough',
    'alchemy',
    'equip',
    'pet',
    'sect',
    'realm',
    'kill',
    'collect',
    'learn',
    'other',
  ];
  return validTypes.includes(type as DailyQuestType);
}

