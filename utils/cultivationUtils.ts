import { PlayerStats } from '../types';
import { FOUNDATION_TREASURES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS, LONGEVITY_RULES, GOLDEN_CORE_METHOD_CONFIG, CULTIVATION_ARTS } from '../constants/index';

/**
 * Get Foundation Treasure Effects
 */
export function getFoundationTreasureEffects(treasureId?: string) {
  if (!treasureId) return {};
  const treasure = FOUNDATION_TREASURES[treasureId];
  return treasure ? treasure.effects : {};
}

/**
 * Get Heaven Earth Essence Effects
 */
export function getHeavenEarthEssenceEffects(essenceId?: string) {
  if (!essenceId) return {};
  const essence = HEAVEN_EARTH_ESSENCES[essenceId];
  return essence ? essence.effects : {};
}

/**
 * Get Heaven Earth Marrow Effects
 */
export function getHeavenEarthMarrowEffects(marrowId?: string) {
  if (!marrowId) return {};
  const marrow = HEAVEN_EARTH_MARROWS[marrowId];
  return marrow ? marrow.effects : {};
}

/**
 * Get Longevity Rule Effects
 */
export function getLongevityRuleEffects(ruleIds: string[] = []) {
  const effects = {
    hpPercent: 0,
    attackPercent: 0,
    defensePercent: 0,
    spiritPercent: 0,
    physiquePercent: 0,
    speedPercent: 0,
    specialEffect: ''
  };

  ruleIds.forEach(ruleId => {
    const rule = LONGEVITY_RULES[ruleId];
    if (rule) {
      Object.keys(rule.effects).forEach(key => {
        if (key === 'specialEffect') {
          effects.specialEffect += rule.effects.specialEffect + '; ';
        } else if (key in effects && key in rule.effects) {
          // Use type-safe key access, handle number types explicitly
          const effectKey = key as keyof typeof effects;
          const ruleEffectKey = key as keyof typeof rule.effects;

          // Ensure only number types are processed
          if (effectKey !== 'specialEffect') {
            const effectValue = effects[effectKey] as number;
            const ruleValue = (rule.effects[ruleEffectKey] || 0) as number;
            (effects[effectKey] as number) = effectValue + ruleValue;
          }
        }
      });
    }
  });

  return effects;
}

// Removed numberToChinese as we now use simple Arabic numerals for mutant paths.

/**
 * Calculate Golden Core Method Count (Only count Grade B and above)
 */
export function calculateGoldenCoreMethodCount(player: PlayerStats): number {
  // Only count Grade B and above (B, A, S)
  // Compatibility with old saves: if cultivationArts does not exist or is empty, return 0
  if (!player.cultivationArts || player.cultivationArts.length === 0) {
    return 0;
  }

  let count = 0;
  player.cultivationArts.forEach((artId) => {
    const art = CULTIVATION_ARTS.find((a) => a.id === artId);
    if (art && (art.grade === 'B' || art.grade === 'A' || art.grade === 'S')) {
      count++;
    }
  });

  return count; // No limit
}

export function getGoldenCoreMethodTitle(methodCount: number): string {
  if (methodCount <= 0) return 'None';
  return `Path ${methodCount} Mutant`;
}

/**
 * Calculate Golden Core Tribulation Difficulty Multiplier (Supports any method count)
 */
export function getGoldenCoreTribulationDifficulty(methodCount: number): number {
  if (methodCount <= 0) return 1.0;

  // If config exists, use it directly
  if (methodCount <= 9 && GOLDEN_CORE_METHOD_CONFIG.methodDifficultyMultiplier[methodCount]) {
    return GOLDEN_CORE_METHOD_CONFIG.methodDifficultyMultiplier[methodCount];
  }

  // For >9 methods, use formula: Base Difficulty + (Count - 9) * 0.5
  // 9 methods is 5.0, 10 methods starts at 5.0 + (10-9) * 0.5 = 5.5, and so on
  if (methodCount > 9) {
    const base9Difficulty = GOLDEN_CORE_METHOD_CONFIG.methodDifficultyMultiplier[9] || 5.0;
    return base9Difficulty + (methodCount - 9) * 0.5;
  }

  return 1.0;
}

/**
 * Calculate Golden Core Attribute Bonus Multiplier (Supports any method count)
 */
export function getGoldenCoreBonusMultiplier(methodCount: number): number {
  if (methodCount <= 0) return 1.0;

  // If config exists, use it directly
  if (methodCount <= 9 && GOLDEN_CORE_METHOD_CONFIG.methodBonusMultiplier[methodCount]) {
    return GOLDEN_CORE_METHOD_CONFIG.methodBonusMultiplier[methodCount];
  }

  // For >9 methods, use formula: 9 methods is 4.6, 10 methods starts at 4.6 + (10-9) * 0.1 = 4.7, but growth rate decreases
  // Use logarithmic growth pattern to slow down bonus growth
  if (methodCount > 9) {
    const base9Multiplier = GOLDEN_CORE_METHOD_CONFIG.methodBonusMultiplier[9] || 4.6;
    // After 9 methods, increment decreases for each additional method: 10th +0.1, 11th +0.09, 12th +0.08...
    const extraMethods = methodCount - 9;
    let additionalBonus = 0;
    for (let i = 1; i <= extraMethods; i++) {
      additionalBonus += Math.max(0.05, 0.1 - (i - 1) * 0.01); // Minimum increment 0.05
    }
    return base9Multiplier + additionalBonus;
  }

  return 1.0;
}

/**
 * Check Breakthrough Conditions
 */
export function checkBreakthroughConditions(player: PlayerStats, targetRealm: string): {
  canBreakthrough: boolean;
  message: string;
} {
  // Wastelander (Foundation) check
  if (targetRealm === 'Wastelander' && !player.foundationTreasure) {
    return {
      canBreakthrough: false,
      message: 'Transition requires Wasteland Gear! You haven\'t acquired any essential gear to survive the next tier.'
    };
  }

  // Mutant (Golden Core) check: Needs at least 1 Advanced/Super/Basic art
  if (targetRealm === 'Mutant') {
    if (player.cultivationArts.length === 0) {
      return {
        canBreakthrough: false,
        message: 'Evolution requires genetic data! You haven\'t processed any neural mods yet.'
      };
    }

    // Check for Grade B (Basic) or higher
    const hasHighGradeArt = player.cultivationArts.some(artId => {
      const art = CULTIVATION_ARTS.find(a => a.id === artId);
      return art && (art.grade === 'S' || art.grade === 'A' || art.grade === 'B');
    });

    if (!hasHighGradeArt) {
      return {
        canBreakthrough: false,
        message: 'Evolution requires Grade B or higher mods! Your current neural mods are insufficient for mutant transformation.'
      };
    }
  }

  // Evolved (Nascent Soul) check
  if (targetRealm === 'Evolved' && !player.heavenEarthEssence) {
    return {
      canBreakthrough: false,
      message: 'Evolution requires Core Essence! You haven\'t acquired the required biological essence.'
    };
  }

  // Apex (Spirit Severing) check
  if (targetRealm === 'Apex' && !player.heavenEarthMarrow) {
    return {
      canBreakthrough: false,
      message: 'Transformation requires Apex Marrow! You haven\'t acquired the required neural marrow.'
    };
  }

  // Apex (Spirit Severing) check refining progress
  if (targetRealm === 'Apex' && player.heavenEarthMarrow && player.marrowRefiningProgress !== 100) {
    return {
      canBreakthrough: false,
      message: `Neural marrow refining not complete! Current progress: ${player.marrowRefiningProgress || 0}%`
    };
  }

  // Transcendent (Dao Combining) check
  if (targetRealm === 'Transcendent' && !player.daoCombiningChallenged) {
    return {
      canBreakthrough: false,
      message: 'Ascension requires defeating a Legend! You haven\'t proven your strength in the wasteland ruins.'
    };
  }

  // Immortal (Longevity) check
  if (targetRealm === 'Immortal' && (!player.longevityRules || player.longevityRules.length === 0)) {
    return {
      canBreakthrough: false,
      message: 'True Legend status requires Rule Knowledge! You haven\'t mastered the laws of the wasteland.'
    };
  }

  return { canBreakthrough: true, message: '' };
}

/**
 * Generate Golden Core Tribulation Puzzle (Numeric Sequence Pattern)
 */
export function generateGoldenCorePuzzle(methodCount: number): {
  puzzleType: 'Numeric Sequence';
  difficulty: number;
  description: string;
  sequence: number[]; // Sequence to display (last one is ?)
  solution: number; // Correct answer
  pattern: string; // Pattern description
  maxAttempts: number;
} {
  const difficulty = getGoldenCoreTribulationDifficulty(methodCount);

  // Generate sequences of varying complexity based on difficulty
  let sequence: number[] = [];
  let solution: number;
  let pattern: string;

  // Difficulty tiers: 1 Simple, 2-3 Medium, 4+ Hard (Slightly increased)
  const difficultyLevel = Math.min(Math.floor(difficulty), 6);

  if (difficultyLevel <= 1) {
    // Simple: Arithmetic progression (Increase length to 5, make pattern obvious but requires observation)
    const start = Math.floor(Math.random() * 15) + 1;
    const step = Math.floor(Math.random() * 6) + 2; // Step 2-7
    sequence = [start, start + step, start + step * 2, start + step * 3, start + step * 4];
    solution = start + step * 5;
    pattern = `Arithmetic sequence, add ${step} each time`;
  } else if (difficultyLevel <= 3) {
    // Medium: Geometric, Incremental Step, or Mixed
    const type = Math.floor(Math.random() * 3);
    if (type === 0) {
      // Geometric progression
      const start = Math.floor(Math.random() * 5) + 2;
      const ratio = Math.floor(Math.random() * 3) + 2; // Ratio 2-4
      sequence = [start, start * ratio, start * ratio * ratio, start * ratio * ratio * ratio, start * ratio * ratio * ratio * ratio];
      solution = start * ratio * ratio * ratio * ratio * ratio;
      pattern = `Geometric sequence, multiply by ${ratio} each time`;
    } else if (type === 1) {
      // Incremental Step
      const start = Math.floor(Math.random() * 10) + 1;
      sequence = [start, start + 2, start + 5, start + 9, start + 14]; // +2, +3, +4, +5
      solution = start + 20; // +6
      pattern = `Incremental step: +2, +3, +4, +5, +6...`;
    } else {
      // Decreasing then Increasing (New type)
      const start = Math.floor(Math.random() * 30) + 20;
      sequence = [start, start - 3, start - 5, start - 6, start - 6]; // -3, -2, -1, 0
      solution = start - 5; // +1 (Start increasing)
      pattern = `Decreasing then increasing pattern`;
    }
  } else {
    // Hard: Complex patterns
    const type = Math.floor(Math.random() * 5);
    if (type === 0) {
      // Square sequence
      const base = Math.floor(Math.random() * 5) + 2;
      sequence = [base * base, (base + 1) * (base + 1), (base + 2) * (base + 2), (base + 3) * (base + 3), (base + 4) * (base + 4)];
      solution = (base + 5) * (base + 5);
      pattern = `Square sequence: ${base}², ${base + 1}², ${base + 2}²...`;
    } else if (type === 1) {
      // Fibonacci Variant
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      sequence = [a, b, a + b, a + b * 2, a * 2 + b * 3];
      solution = a * 3 + b * 5;
      pattern = `Fibonacci variant: Each number is sum of previous two`;
    } else if (type === 2) {
      // Alternating Pattern
      const start = Math.floor(Math.random() * 10) + 1;
      sequence = [start, start * 2, start * 2 + 3, (start * 2 + 3) * 2, (start * 2 + 3) * 2 + 3];
      solution = ((start * 2 + 3) * 2 + 3) * 2;
      pattern = `Alternating: *2 then +3`;
    } else if (type === 3) {
      // Prime Sequence
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
      const startIdx = Math.floor(Math.random() * 4);
      sequence = primes.slice(startIdx, startIdx + 5);
      solution = primes[startIdx + 5];
      pattern = `Prime number sequence`;
    } else {
      // Cube Sequence
      const base = Math.floor(Math.random() * 4) + 2;
      sequence = [base * base * base, (base + 1) ** 3, (base + 2) ** 3, (base + 3) ** 3, (base + 4) ** 3];
      solution = (base + 5) ** 3;
      pattern = `Cube sequence: ${base}³, ${base + 1}³, ${base + 2}³...`;
    }
  }

  return {
    puzzleType: 'Numeric Sequence',
    difficulty,
    description: `Observe the sequence pattern and find the next number.`,
    sequence,
    solution,
    pattern,
    maxAttempts: Math.max(3, 9 - Math.floor(difficulty)) // Slightly reduce attempts
  };
}

/**
 * Generate Nascent Soul Tribulation Puzzle (2048)
 */
export function generateNascentSoulPuzzle(essenceQuality: number): {
  puzzleType: 'Celestial Grid';
  difficulty: number;
  description: string;
  targetScore: number;
} {
  const difficulty = essenceQuality / 100;

  // Fixed target score 1000 (Nascent Soul Tribulation)
  const targetScore = 1000;

  return {
    puzzleType: 'Celestial Grid',
    difficulty,
    description: `Merge blocks to reach the target score ${targetScore} to bypass the firewall. Use arrow keys or buttons.`,
    targetScore
  };
}

/**
 * Generate Spirit Severing Tribulation Puzzle (Rune Sequence)
 */
export function generateSpiritSeveringPuzzle(marrowQuality: number): {
  puzzleType: 'Rune Sequence';
  difficulty: number;
  description: string;
  sequence: string[];
  targetSequence: string[];
  maxSteps: number;
} {
  const difficulty = marrowQuality / 100;
  const sequenceLength = Math.min(4 + Math.floor(difficulty * 2), 8);

  // Generate rune sequence
  const symbols = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
  const targetSequence = Array.from({ length: sequenceLength }, () =>
    symbols[Math.floor(Math.random() * symbols.length)]
  );

  // Generate initial sequence (slightly shuffled)
  const initialSequence = [...targetSequence];
  // Shuffle a few positions
  for (let i = 0; i < Math.floor(difficulty); i++) {
    const pos1 = Math.floor(Math.random() * sequenceLength);
    const pos2 = Math.floor(Math.random() * sequenceLength);
    [initialSequence[pos1], initialSequence[pos2]] = [initialSequence[pos2], initialSequence[pos1]];
  }

  return {
    puzzleType: 'Rune Sequence',
    difficulty,
    description: 'Arrange the runes in the correct order. Click to swap adjacent runes.',
    sequence: initialSequence,
    targetSequence,
    maxSteps: Math.max(5, 15 - Math.floor(difficulty * 3))
  };
}

/**
 * Generate Longevity Tribulation Puzzle (Five Trials)
 */
export function generateLongevityPuzzle(ruleCount: number): {
  puzzleType: 'Five Trials';
  description: string;
  challenges: Array<{
    type: 'Octagram Array' | 'Celestial Grid' | 'Rune Sequence' | 'Inner Demon Trial' | 'System Inquiry';
    difficulty: number;
    data: any;
  }>;
} {
  const challenges: Array<{
    type: 'Octagram Array' | 'Celestial Grid' | 'Rune Sequence' | 'Inner Demon Trial' | 'System Inquiry';
    difficulty: number;
    data: any;
  }> = [
      {
        type: 'Octagram Array' as const,
        difficulty: 0.8 + ruleCount * 0.1,
        data: generateGoldenCorePuzzle(Math.min(ruleCount + 3, 9))
      },
      {
        type: 'Celestial Grid' as const,
        difficulty: 0.9 + ruleCount * 0.1,
        data: {
          ...generateNascentSoulPuzzle(80 + ruleCount * 10),
          targetScore: 2000  // Target score for Longevity Tribulation
        }
      },
      {
        type: 'Rune Sequence' as const,
        difficulty: 1.0 + ruleCount * 0.1,
        data: generateSpiritSeveringPuzzle(90 + ruleCount * 10)
      },
      {
        type: 'Inner Demon Trial' as const,
        difficulty: 1.2 + ruleCount * 0.1,
        data: {
          description: 'Face your deepest fears and desires. Maintain your resolve.',
          questions: [
            'What is the truth of Immortality?',
            'What price will you pay for eternity?',
            'The Wasteland is cruel. Where does humanity lie?'
          ]
        }
      },
      {
        type: 'System Inquiry' as const,
        difficulty: 1.5 + ruleCount * 0.1,
        data: {
          description: 'Answer the ultimate questions of the System. Prove you can defy the protocol.',
          questions: [
            'Why does the world exist?',
            'Why do you seek survival?',
            'Why do you break the rules?'
          ]
        }
      }
    ];

  return {
    puzzleType: 'Five Trials',
    description: 'The Longevity Tribulation consists of five trials. Pass all to prove your worth.',
    challenges
  };
}