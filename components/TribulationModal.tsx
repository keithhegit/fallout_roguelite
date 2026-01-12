import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Shield, Sword, Heart, Eye, Gauge, Skull, CheckCircle2, XCircle, Sparkles, Grid3X3, HelpCircle, Lightbulb } from 'lucide-react';
import { TribulationState, TribulationResult } from '../types';
import {
  formatAttributeBonus,
  formatEquipmentBonus,
} from '../utils/tribulationUtils';
import { generateGoldenCorePuzzle, generateNascentSoulPuzzle, generateSpiritSeveringPuzzle, generateLongevityPuzzle } from '../utils/cultivationUtils';
import { TRIBULATION_STAGES, HEAVEN_EARTH_ESSENCES, HEAVEN_EARTH_MARROWS } from '../constants/index';

interface TribulationModalProps {
  tribulationState: TribulationState;
  onTribulationComplete: (result: TribulationResult) => void;
  player: any; // PlayerStats - Use any to avoid circular imports
}

const TribulationModal: React.FC<TribulationModalProps> = ({
  tribulationState,
  onTribulationComplete,
  player,
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TribulationResult | null>(null);
  const hasStartedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Puzzle Game State
  const [puzzle, setPuzzle] = useState<any>(null);
  const [userInput, setUserInput] = useState<number[]>([]); // For numeric sequences
  const [currentSequence, setCurrentSequence] = useState<string[]>([]); // For rune sequences
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // For rune sequence selection
  const [attempts, setAttempts] = useState(0);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [revealedPositions, setRevealedPositions] = useState<number[]>([]);

  // Longevity Tribulation Five Trials State
  const [longevityChallenges, setLongevityChallenges] = useState<any>(null);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  // 2048 Game State
  const [game2048Grid, setGame2048Grid] = useState<number[][]>([]);
  const [game2048Score, setGame2048Score] = useState<number>(0);
  const [gameOverTriggered, setGameOverTriggered] = useState(false);

  // Init 2048 Game
  const init2048Game = useCallback(() => {
    setGameOverTriggered(false); // Reset game over flag
    const grid: number[][] = Array(4).fill(null).map(() => Array(4).fill(0));
    // Randomly add two initial tiles (2 or 4)
    const emptyCells: [number, number][] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        emptyCells.push([i, j]);
      }
    }
    // Randomly select two positions
    const pos1 = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    emptyCells.splice(emptyCells.indexOf(pos1), 1);
    const pos2 = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    grid[pos1[0]][pos1[1]] = Math.random() < 0.9 ? 2 : 4;
    grid[pos2[0]][pos2[1]] = Math.random() < 0.9 ? 2 : 4;
    setGame2048Grid(grid);
    setGame2048Score(0);
  }, []);

  // 2048 Game: Add new random tile
  const addRandomTile = useCallback((grid: number[][]): number[][] => {
    const emptyCells: [number, number][] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (grid[i][j] === 0) {
          emptyCells.push([i, j]);
        }
      }
    }
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      grid[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
    return grid.map(row => [...row]);
  }, []);

  // 2048 Game: Check if game over (no moves possible)
  const check2048GameOver = useCallback((grid: number[][]): boolean => {
    // Check for empty cells
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (grid[i][j] === 0) return false;
      }
    }

    // Check for mergeable adjacent tiles
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const current = grid[i][j];
        // Check right
        if (j < 3 && grid[i][j + 1] === current) return false;
        // Check down
        if (i < 3 && grid[i + 1][j] === current) return false;
      }
    }

    return true; // Game Over
  }, []);

  // 2048 Game: Handle Game Over
  const handle2048GameOver = useCallback(() => {
    // Prevent duplicate triggers
    if (gameOverTriggered) return;
    setGameOverTriggered(true);

    const puzzleData = puzzle?.data || puzzle;
    const targetScore = puzzleData?.targetScore || 2048;
    const isMet = game2048Score >= targetScore;

    if (!isMet) {
      // Target not met, failure
      const failMessage = tribulationState.tribulationLevel === 'Eternal Storm' && longevityChallenges
        ? `Phase ${currentChallengeIndex + 1} Failure! The Celestial Grid collapsed. Structural integrity lost...`
        : 'Celestial Grid Failure! System can no longer process moves. Radiation overload imminent...';

      const tribulationResult: TribulationResult = {
        success: false,
        deathProbability: 1.0,
        roll: Math.random(),
        description: failMessage,
      };
      setResult(tribulationResult);
      setIsProcessing(false);
      setShowPuzzle(false);
    }
  }, [puzzle, game2048Score, tribulationState.tribulationLevel, longevityChallenges, currentChallengeIndex]);

  // 2048 Game: Move Logic
  const move2048 = useCallback((direction: 'up' | 'down' | 'left' | 'right'): boolean => {
    setGame2048Grid(prevGrid => {
      const grid = prevGrid.map(row => [...row]);
      let moved = false;
      let newScore = 0;

      // Move and merge logic
      const moveRow = (row: number[]): { row: number[], score: number } => {
        const filtered = row.filter(val => val !== 0);
        const merged: number[] = [];
        let score = 0;

        for (let i = 0; i < filtered.length; i++) {
          if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
            merged.push(filtered[i] * 2);
            score += filtered[i] * 2;
            i++; // Skip next
          } else {
            merged.push(filtered[i]);
          }
        }

        while (merged.length < 4) {
          merged.push(0);
        }

        return { row: merged, score };
      };

      if (direction === 'left') {
        for (let i = 0; i < 4; i++) {
          const original = [...grid[i]];
          const result = moveRow(grid[i]);
          grid[i] = result.row;
          newScore += result.score;
          if (JSON.stringify(original) !== JSON.stringify(grid[i])) {
            moved = true;
          }
        }
      } else if (direction === 'right') {
        for (let i = 0; i < 4; i++) {
          const original = [...grid[i]];
          const result = moveRow([...grid[i]].reverse());
          grid[i] = result.row.reverse();
          newScore += result.score;
          if (JSON.stringify(original) !== JSON.stringify(grid[i])) {
            moved = true;
          }
        }
      } else if (direction === 'up') {
        for (let j = 0; j < 4; j++) {
          const col = grid.map(row => row[j]);
          const original = [...col];
          const result = moveRow(col);
          for (let i = 0; i < 4; i++) {
            grid[i][j] = result.row[i];
          }
          newScore += result.score;
          if (JSON.stringify(original) !== JSON.stringify(result.row)) {
            moved = true;
          }
        }
      } else if (direction === 'down') {
        for (let j = 0; j < 4; j++) {
          const col = grid.map(row => row[j]).reverse();
          const original = [...col];
          const result = moveRow(col);
          const reversed = result.row.reverse();
          for (let i = 0; i < 4; i++) {
            grid[i][j] = reversed[i];
          }
          newScore += result.score;
          if (JSON.stringify(original) !== JSON.stringify(result.row)) {
            moved = true;
          }
        }
      }

      if (moved) {
        setGame2048Score(prevScore => prevScore + newScore);
        const newGrid = addRandomTile(grid);
        // Check if game over (no moves possible)
        setTimeout(() => {
          if (check2048GameOver(newGrid)) {
            handle2048GameOver();
          }
        }, 300);
        return newGrid;
      }
      return prevGrid;
    });
    return true;
  }, [addRandomTile, check2048GameOver, handle2048GameOver]);

  // Init Puzzle Game (Golden Core, Nascent Soul, Spirit Severing)
  const initializePuzzle = useCallback(() => {
    if (tribulationState.tribulationLevel === 'Elite Storm') {
      // Golden Core: Numeric sequence deduction
      // Difficulty based on art count
      const artCount = player.cultivationArts?.length || 0;

      const puzzleData = generateGoldenCorePuzzle(artCount);
      setPuzzle(puzzleData);
      setUserInput([0]); // Numeric sequence requires one answer
      setAttempts(0);
      setShowPuzzle(true);
      setShowHint(false);
      setHintUsed(false);
      setRevealedPositions([]);
    } else if (tribulationState.tribulationLevel === 'Master Storm') {
      // Nascent Soul: 2048 Game (Difficulty based on Heaven Earth Essence quality and overall strength)
      const essenceQuality = player.heavenEarthEssence
        ? (HEAVEN_EARTH_ESSENCES[player.heavenEarthEssence]?.quality || 50)
        : 50;

      // Calculate player overall strength (combine art and essence quality)
      const artCount = player.cultivationArts?.length || 0;
      // Combined strength: Essence quality 70%, Art count 30%
      const combinedStrength = essenceQuality * 0.7 + artCount * 10 * 0.3;

      // Use 2048 game, difficulty based on combined strength
      const puzzleData = generateNascentSoulPuzzle(combinedStrength);
      setPuzzle(puzzleData);
      setUserInput([]);
      init2048Game(); // Init 2048 game
      setAttempts(0);
      setShowPuzzle(true);
      setShowHint(false);
      setHintUsed(false);
      setRevealedPositions([]);
    } else if (tribulationState.tribulationLevel === 'Grandmaster Storm') {
      // Spirit Severing: Rune Sequence (Difficulty based on Heaven Earth Marrow quality)
      const marrowQuality = player.heavenEarthMarrow
        ? (HEAVEN_EARTH_MARROWS[player.heavenEarthMarrow]?.quality || 50)
        : 50;

      const puzzleData = generateSpiritSeveringPuzzle(marrowQuality);
      setPuzzle(puzzleData);
      setCurrentSequence([...puzzleData.sequence]); // Init current sequence
      setSelectedIndex(null); // Reset selection
      setAttempts(0);
      setShowPuzzle(true);
      setShowHint(false);
      setHintUsed(false);
      setRevealedPositions([]);
    } else if (tribulationState.tribulationLevel === 'Eternal Storm') {
      // Longevity: Five Trials
      const ruleCount = player.longevityRules?.length || 0;
      const puzzleData = generateLongevityPuzzle(ruleCount);
      setLongevityChallenges(puzzleData);
      setCurrentChallengeIndex(0);
      const firstChallenge = puzzleData.challenges[0];
      // Set first trial, initialize state by type
      setPuzzle({ type: firstChallenge.type, data: firstChallenge.data });
      setUserInput([]);
      // If Rune Sequence, init from data
      if (firstChallenge.type === 'Rune Sequence') {
        const sequence = (firstChallenge.data as { sequence?: number[] } | null | undefined)
          ?.sequence;
        setCurrentSequence(Array.isArray(sequence) ? sequence.map(String) : []);
      } else {
        setCurrentSequence([]);
      }
      // If 2048 or Celestial Grid, init game
      if (firstChallenge.type === 'Celestial Grid') {
        init2048Game();
      }
      setAttempts(0);
      setShowPuzzle(true);
      setShowHint(false);
      setHintUsed(false);
      setRevealedPositions([]);
    }
  }, [tribulationState, player.cultivationArts, player.heavenEarthEssence, player.heavenEarthMarrow, player.longevityRules, init2048Game]);

  const continueTribulation = useCallback(() => {
    let stageIndex = 0;

    const playStage = () => {
      if (stageIndex < TRIBULATION_STAGES.length - 2) { // -2 to exclude success and failure states
        setCurrentStage(stageIndex);
        stageIndex++;
        const delay = TRIBULATION_STAGES[stageIndex - 1].delay;
        timeoutRef.current = setTimeout(playStage, delay);
      } else {
        // All stages complete, calculate result
        const tribulationResult: TribulationResult = {
          success: Math.random() > tribulationState.deathProbability,
          deathProbability: tribulationState.deathProbability,
          roll: Math.random(),
          hpLoss: Math.floor(tribulationState.totalStats.maxHp * (Math.random() * 0.3 + 0.1)),
          description: '',
        };

        if (tribulationResult.success) {
          // Success
          const hpLossPercent = Math.random() * 0.3 + 0.1; // 10%-40% HP loss
          tribulationResult.hpLoss = Math.floor(tribulationState.totalStats.maxHp * hpLossPercent);

          if (tribulationResult.deathProbability < 0.2) {
            tribulationResult.description = 'The radiation spike was negligible. Your systems held firm with zero structural compromise.';
          } else if (tribulationResult.deathProbability < 0.4) {
            tribulationResult.description = 'You gritted your teeth as the energy surged. Minor structural damage sustained, but the core remains intact.';
          } else if (tribulationResult.deathProbability < 0.6) {
            tribulationResult.description = 'Critical energy overflow! You barely managed to vent the excess heat before total meltdown.';
          } else {
            tribulationResult.description = 'Against all statistical odds, your battered frame survived the onslaught. A miracle of engineering!';
          }
        } else {
          // Failure
          if (tribulationResult.deathProbability < 0.3) {
            tribulationResult.description = 'The energy surge overwhelmed your capacitors. Total system failure initiated...';
          } else if (tribulationResult.deathProbability < 0.5) {
            tribulationResult.description = 'Structural integrity compromised beyond repair. Your journey ends in a flash of blinding light...';
          } else if (tribulationResult.deathProbability < 0.7) {
            tribulationResult.description = 'The wasteland claims another soul. Your components scatter across the glowing sea...';
          } else {
            tribulationResult.description = 'Catastrophic failure! You were never meant to withstand this level of radiation...';
          }
        }

        setIsProcessing(false);
        setResult(tribulationResult);
      }
    };

    playStage();
  }, [tribulationState]);

  const handlePuzzleSubmit = useCallback(() => {
    if (!puzzle) return;

    setAttempts(prev => prev + 1);

    let isCorrect = false;

    // Check answer based on game type
    if (puzzle.puzzleType === 'Numeric Sequence') {
      // Numeric Sequence: Check one answer
      isCorrect = userInput[0] === puzzle.solution;
    } else if (puzzle.puzzleType === 'Rune Sequence') {
      // Rune Sequence: Compare sequences
      isCorrect = currentSequence.length === puzzle.targetSequence.length &&
        currentSequence.every((val, idx) => val === puzzle.targetSequence[idx]);
    } else if (puzzle.puzzleType === '2048' || puzzle.puzzleType === 'Celestial Grid' || puzzle.type === '2048' || puzzle.type === 'Celestial Grid') {
      // 2048/Celestial Grid: Check target score
      const puzzleData = puzzle.data || puzzle;
      const targetScore = puzzleData.targetScore || 2048;
      isCorrect = game2048Score >= targetScore;
    } else if (tribulationState.tribulationLevel === 'Eternal Storm' && longevityChallenges) {
      // Longevity: Check trial answer
      const challenge = longevityChallenges.challenges[currentChallengeIndex];
      if (challenge.type === 'Octagram Array') {
        // Octagram Array uses Numeric Sequence logic
        isCorrect = userInput[0] === challenge.data.solution;
      } else if (challenge.type === '2048' || challenge.type === 'Celestial Grid') {
        // 2048/Celestial Grid (Longevity)
        const targetScore = challenge.data.targetScore || 2048;
        isCorrect = game2048Score >= targetScore;
      } else if (challenge.type === 'Rune Sequence') {
        // Rune Sequence
        isCorrect = currentSequence.length === challenge.data.targetSequence.length &&
          currentSequence.every((val, idx) => val === challenge.data.targetSequence[idx]);
      } else if (challenge.type === 'Inner Demon Trial' || challenge.type === 'System Inquiry') {
        // Inner Demon / System Inquiry: Always correct
        isCorrect = true;
      }
    }

    if (isCorrect) {
      // If Longevity Tribulation, check if there are more trials
      if (tribulationState.tribulationLevel === 'Eternal Storm' && longevityChallenges) {
        if (currentChallengeIndex < longevityChallenges.challenges.length - 1) {
          // Enter next trial
          const nextIndex = currentChallengeIndex + 1;
          setCurrentChallengeIndex(nextIndex);
          const nextChallenge = longevityChallenges.challenges[nextIndex];
          setPuzzle({ type: nextChallenge.type, data: nextChallenge.data });
          setUserInput([]);
          // If Rune Sequence, init from data
          if (nextChallenge.type === 'Rune Sequence' && nextChallenge.data?.sequence) {
            setCurrentSequence([...nextChallenge.data.sequence]);
          } else {
            setCurrentSequence([]);
          }
          // If 2048 or Celestial Grid, init game
          if (nextChallenge.type === '2048' || nextChallenge.type === 'Celestial Grid') {
            init2048Game();
          }
          setAttempts(0);
          setShowHint(false);
          setHintUsed(false);
        } else {
          // All trials complete, continue tribulation
          setShowPuzzle(false);
          continueTribulation();
        }
      } else {
        // Other tribulations: Puzzle solved, continue tribulation
        setShowPuzzle(false);
        continueTribulation();
      }
    } else if (attempts >= (puzzle.maxAttempts || puzzle.maxMoves || puzzle.maxSteps || 3) - 1) {
      // Failure
      let failMessage = 'Decryption Failed! The energy surge consumes you...';
      if (puzzle.puzzleType === 'Numeric Sequence') {
        failMessage = 'Sequence Deduction Failed! A sudden radiation spike bypasses your shields...';
      } else if (puzzle.puzzleType === 'Rune Sequence') {
        failMessage = 'Rune Deduction Failed! The energy surge consumes you...';
      } else if (puzzle.puzzleType === '2048' || puzzle.puzzleType === 'Celestial Grid') {
        failMessage = 'Celestial Grid Failed! Energy targets unmet. System meltdown initiated...';
      } else if (tribulationState.tribulationLevel === 'Eternal Storm') {
        failMessage = `Phase ${currentChallengeIndex + 1} Failure! Your journey ends here...`;
      }
      const tribulationResult: TribulationResult = {
        success: false,
        deathProbability: 1.0,
        roll: Math.random(),
        description: failMessage,
      };
      setResult(tribulationResult);
      setIsProcessing(false);
      setShowPuzzle(false);
    }
  }, [puzzle, userInput, currentSequence, game2048Score, attempts, continueTribulation, tribulationState, longevityChallenges, currentChallengeIndex]);

  const startTribulation = useCallback(() => {
    if (!tribulationState.isOpen || isProcessing) return;

    // Special handling for Golden Core, Nascent Soul, Spirit Severing, Longevity: Play puzzle first
    if (tribulationState.tribulationLevel === 'Elite Storm' ||
      tribulationState.tribulationLevel === 'Master Storm' ||
      tribulationState.tribulationLevel === 'Grandmaster Storm' ||
      tribulationState.tribulationLevel === 'Eternal Storm') {
      initializePuzzle();
      return;
    }

    // Normal flow for other realms
    continueTribulation();
  }, [tribulationState, isProcessing, initializePuzzle, continueTribulation]);

  useEffect(() => {
    // When modal opens, auto-start tribulation animation
    // Only if not processing, no result, and hasn't started before
    if (tribulationState.isOpen && !isProcessing && !result && !hasStartedRef.current) {
      hasStartedRef.current = true;
      setIsProcessing(true);
      startTribulation();
    }
    // When modal closes, reset state
    if (!tribulationState.isOpen) {
      hasStartedRef.current = false;
      setCurrentStage(0);
      setIsProcessing(false);
      setResult(null);
      setShowPuzzle(false);
      setPuzzle(null);
      setUserInput([]);
      setCurrentSequence([]);
      setGame2048Grid([]);
      setGame2048Score(0);
      setGameOverTriggered(false);
      setLongevityChallenges(null);
      setCurrentChallengeIndex(0);
      setAttempts(0);
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [tribulationState.isOpen, isProcessing, result, startTribulation]);

  // Handle 2048 game keyboard events and touch swipes
  useEffect(() => {
    if (!showPuzzle || !puzzle) return;
    const is2048 = puzzle.puzzleType === '2048' || puzzle.puzzleType === 'Celestial Grid' || puzzle.type === '2048' || puzzle.type === 'Celestial Grid';
    if (!is2048) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        move2048('up');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        move2048('down');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        move2048('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        move2048('right');
      }
    };

    // Touch swipe handling
    let touchStartX = 0;
    let touchStartY = 0;
    const minSwipeDistance = 30; // Minimum swipe distance

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!e.changedTouches || e.changedTouches.length === 0) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Trigger only if swipe distance exceeds minimum
      if (Math.max(absDeltaX, absDeltaY) < minSwipeDistance) return;

      // Determine swipe direction
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          move2048('right');
        } else {
          move2048('left');
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          move2048('down');
        } else {
          move2048('up');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showPuzzle, puzzle, move2048]);

  const handleClose = () => {
    if (result) {
      onTribulationComplete(result);
    }
  };

  if (!tribulationState.isOpen) return null;

  const riskColor = tribulationState.deathProbability < 0.3 ? 'text-green-400' :
    tribulationState.deathProbability < 0.5 ? 'text-yellow-400' :
      tribulationState.deathProbability < 0.7 ? 'text-orange-400' : 'text-red-400';

  const currentStageInfo = TRIBULATION_STAGES[currentStage];

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] p-2 sm:p-4 md:p-6 backdrop-blur-md">
      <div className="bg-gradient-to-b from-slate-900 to-stone-900 rounded-lg border-2 border-purple-500/50 shadow-2xl w-full max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
        <div className="p-4 sm:p-6 md:p-8">
          {/* Title */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-4">
              <Sparkles className="text-purple-400 w-6 h-6 sm:w-8 sm:h-8" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-purple-300">
                {tribulationState.tribulationLevel.replace('Storm', 'Spike')}
              </h2>
              <Sparkles className="text-purple-400 w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <p className="text-sm sm:text-base md:text-lg text-stone-300">
              Rank Evolution Imminent: Warning - Extreme Energy Surge!
            </p>
          </div>

          {/* Tribulation Animation Stage */}
          <div className="mb-4 sm:mb-6 md:mb-8 p-3 sm:p-4 md:p-6 bg-black/30 rounded-lg border border-purple-500/30">
            {/* Puzzle Game */}
            {showPuzzle && puzzle && (
              <div className="text-center">
                <Grid3X3 className="text-purple-400 mx-auto mb-4 sm:mb-6 w-8 h-8 sm:w-10 sm:h-10" />
                <h3 className="text-lg sm:text-xl md:text-2xl text-purple-300 font-serif mb-2 sm:mb-3">
                  {tribulationState.tribulationLevel === 'Eternal Storm' && longevityChallenges ? (
                    <>Phase {currentChallengeIndex + 1}: {puzzle.type}</>
                  ) : (
                    puzzle.puzzleType === 'Numeric Sequence' ? 'Data Sequence Deduction' :
                      puzzle.puzzleType === 'Rune Sequence' ? 'Rune Sequence Deduction' :
                        puzzle.puzzleType === '2048' ? 'Celestial Grid v1.0' :
                          puzzle.puzzleType === 'Celestial Grid' ? 'Celestial Grid v2.0' :
                            'Encryption Override'
                  )}
                </h3>
                {tribulationState.tribulationLevel === 'Eternal Storm' && longevityChallenges && (
                  <p className="text-sm text-yellow-400 mb-2">
                    Progress: {currentChallengeIndex + 1}/{longevityChallenges.challenges.length}
                  </p>
                )}
                <p className="text-xs sm:text-sm md:text-base text-stone-400 mb-4 sm:mb-6">
                  {tribulationState.tribulationLevel === 'Eternal Storm' && puzzle.data?.description ? puzzle.data.description : puzzle.description}
                </p>

                {/* Numeric Sequence Game */}
                {(puzzle.puzzleType === 'Numeric Sequence' || (tribulationState.tribulationLevel === 'Eternal Storm' && puzzle.type === 'Octagram Array')) && (
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 flex-wrap">
                      {(tribulationState.tribulationLevel === 'Eternal Storm' && puzzle.type === 'Octagram Array' ? puzzle.data?.sequence : puzzle.sequence)?.map((num: number, index: number) => (
                        <div
                          key={index}
                          className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-900/50 border-2 border-purple-500 rounded-lg flex items-center justify-center text-xl sm:text-2xl font-bold text-purple-200"
                        >
                          {num}
                        </div>
                      ))}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-stone-800 border-2 border-purple-500 rounded-lg flex items-center justify-center text-xl sm:text-2xl font-bold text-stone-400">
                        ?
                      </div>
                    </div>

                    {/* Input */}
                    <div className="mb-4">
                      <label className="block text-sm text-stone-400 mb-2">Enter the next digit:</label>
                      <input
                        type="number"
                        value={userInput[0] || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setUserInput([val]);
                        }}
                        className="w-24 h-12 sm:w-28 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-stone-800 border-2 border-purple-500 rounded-lg text-stone-200 focus:border-purple-400 focus:outline-none"
                        placeholder="?"
                        min="1"
                      />
                    </div>
                  </div>
                )}

                {/* 2048 Game */}
                {(puzzle.puzzleType === '2048' || puzzle.puzzleType === 'Celestial Grid' || puzzle.type === '2048' || puzzle.type === 'Celestial Grid') && (() => {
                  const puzzleData = puzzle.data || puzzle;
                  const targetScore = puzzleData.targetScore || 2048;

                  // Get tile color
                  const getTileColor = (num: number): string => {
                    if (num === 0) return 'bg-stone-800 text-stone-600';
                    const colors: { [key: number]: string } = {
                      2: 'bg-stone-700 text-stone-200',
                      4: 'bg-stone-600 text-stone-100',
                      8: 'bg-yellow-900/70 text-yellow-100',
                      16: 'bg-yellow-800/70 text-yellow-50',
                      32: 'bg-orange-900/70 text-orange-100',
                      64: 'bg-orange-800/70 text-orange-50',
                      128: 'bg-red-900/70 text-red-100',
                      256: 'bg-red-800/70 text-red-50',
                      512: 'bg-purple-900/70 text-purple-100',
                      1024: 'bg-purple-800/70 text-purple-50',
                      2048: 'bg-green-900/70 text-green-50',
                    };
                    return colors[num] || 'bg-blue-900/70 text-blue-50';
                  };

                  return (
                    <div className="mb-6">
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <p className="text-sm text-stone-400">Current Score: <span className="text-purple-300 font-bold">{game2048Score}</span></p>
                            <p className="text-sm text-stone-400">Target Score: <span className="text-yellow-300 font-bold">{targetScore}</span></p>
                          </div>
                          {game2048Score >= targetScore && (
                            <span className="text-green-400 font-bold text-sm">✓ TARGET MET!</span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-4 max-w-xs mx-auto">
                          {game2048Grid.map((row, i) =>
                            row.map((cell, j) => (
                              <div
                                key={`${i}-${j}`}
                                className={`w-16 h-16 sm:w-20 sm:h-20 border-2 border-purple-500/30 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold ${getTileColor(cell)}`}
                              >
                                {cell !== 0 ? cell : ''}
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-2 mb-4">
                          <button
                            onClick={() => move2048('up')}
                            className="w-12 h-10 bg-purple-700/50 hover:bg-purple-600/50 text-purple-200 rounded-lg transition-colors"
                          >
                            ↑
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => move2048('left')}
                              className="w-12 h-10 bg-purple-700/50 hover:bg-purple-600/50 text-purple-200 rounded-lg transition-colors"
                            >
                              ←
                            </button>
                            <button
                              onClick={() => move2048('right')}
                              className="w-12 h-10 bg-purple-700/50 hover:bg-purple-600/50 text-purple-200 rounded-lg transition-colors"
                            >
                              →
                            </button>
                          </div>
                          <button
                            onClick={() => move2048('down')}
                            className="w-12 h-10 bg-purple-700/50 hover:bg-purple-600/50 text-purple-200 rounded-lg transition-colors"
                          >
                            ↓
                          </button>
                        </div>
                        <p className="text-xs text-stone-500">Use arrow keys or click buttons to shift tiles</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Rune Sequence Game */}
                {(puzzle.puzzleType === 'Rune Sequence' || (tribulationState.tribulationLevel === 'Eternal Storm' && puzzle.type === 'Rune Sequence')) && (
                  <div className="mb-6">
                    <div className="mb-4">
                      <label className="block text-sm text-stone-400 mb-2">Target Sequence:</label>
                      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 flex-wrap">
                        {(tribulationState.tribulationLevel === 'Eternal Storm' && puzzle.type === 'Rune Sequence' ? puzzle.data?.targetSequence : puzzle.targetSequence)?.map((symbol: string, index: number) => (
                          <div
                            key={index}
                            className="w-12 h-12 sm:w-14 sm:h-14 bg-green-900/50 border-2 border-green-500 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold text-green-200"
                          >
                            {symbol}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm text-stone-400 mb-2">Current Sequence (Click two runes to swap):</label>
                      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 flex-wrap">
                        {currentSequence.map((symbol: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => {
                              if (selectedIndex === null) {
                                // First click: Select first rune
                                setSelectedIndex(index);
                              } else if (selectedIndex === index) {
                                // Click same rune: Deselect
                                setSelectedIndex(null);
                              } else {
                                // Second click: Swap two runes
                                const newSequence = [...currentSequence];
                                [newSequence[selectedIndex], newSequence[index]] = [newSequence[index], newSequence[selectedIndex]];
                                setCurrentSequence(newSequence);
                                setSelectedIndex(null);
                              }
                            }}
                            className={`w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold transition-colors cursor-pointer ${selectedIndex === index
                              ? 'bg-yellow-900/50 border-yellow-500 text-yellow-200'
                              : 'bg-purple-900/50 border-purple-500 text-purple-200 hover:bg-purple-800/50'
                              }`}
                          >
                            {symbol}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-stone-500 mt-2">
                        {selectedIndex === null
                          ? 'Hint: Click one rune, then click another to swap their positions.'
                          : `Rune ${selectedIndex + 1} selected. Click another to swap.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Hint Button and Rules */}
                {puzzle.puzzleType !== '2048' && puzzle.puzzleType !== 'Celestial Grid' && (puzzle.type !== '2048' && puzzle.type !== 'Celestial Grid' && puzzle.type !== 'Inner Demon Trial' && puzzle.type !== 'System Inquiry') && (
                  <div className="mb-4 space-y-2">
                    <button
                      onClick={() => {
                        if (!hintUsed) {
                          setHintUsed(true);
                        }
                        setShowHint(!showHint);
                      }}
                      className="px-3 py-1.5 bg-purple-800/50 hover:bg-purple-700/50 text-purple-200 text-xs rounded-lg transition-colors flex items-center gap-1.5 mx-auto"
                    >
                      <HelpCircle size={14} />
                      {showHint ? 'Hide Hint' : 'View Hint'}
                    </button>

                    {showHint && puzzle.pattern && (
                      <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3 text-left max-w-md mx-auto">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="text-yellow-400" size={16} />
                          <span className="text-sm font-bold text-yellow-300">Logic Hint</span>
                        </div>
                        <div className="text-xs text-stone-300 space-y-1.5">
                          <div><strong className="text-purple-300">Pattern Type:</strong> {puzzle.pattern || puzzle.data?.pattern}</div>
                          <div className="mt-2 pt-2 border-t border-purple-500/30">
                            <strong className="text-yellow-300">Common Patterns:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-0.5 text-stone-400">
                              <li>Arithmetic: Increased by a constant value (e.g., 2, 4, 6, 8...)</li>
                              <li>Geometric: Multiplied by a constant value (e.g., 2, 4, 8, 16...)</li>
                              <li>Incremental: Increase grows over time (e.g., 1, 3, 6, 10...)</li>
                              <li>Squares: Perfect square numbers (e.g., 1, 4, 9, 16...)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Special Display for Inner Demon Trial and System Inquiry */}
                {(puzzle.type === 'Inner Demon Trial' || puzzle.type === 'System Inquiry') && (
                  <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-stone-300 mb-4">{puzzle.data?.description}</p>
                    {puzzle.data?.questions?.map((q: string, idx: number) => (
                      <div key={idx} className="mb-3 text-sm text-stone-400">
                        {idx + 1}. {q}
                      </div>
                    ))}
                    <p className="text-xs text-yellow-400 mt-4">This is a test of your resolve. Maintain focus to prevail.</p>
                  </div>
                )}

                <div className="text-xs sm:text-sm text-stone-500 mb-4 sm:mb-6">
                  {puzzle.maxAttempts && (
                    <>Attempts Remaining: {puzzle.maxAttempts - attempts}</>
                  )}
                  {(puzzle.puzzleType === '2048' || puzzle.puzzleType === 'Celestial Grid' || puzzle.type === '2048' || puzzle.type === 'Celestial Grid') && (() => {
                    const puzzleData = puzzle.data || puzzle;
                    const targetScore = puzzleData.targetScore || 2048;
                    return (
                      <div>
                        Target: {targetScore} | Current: {game2048Score}
                        {game2048Score >= targetScore && <span className="text-green-400 ml-2">✓ TARGET MET</span>}
                      </div>
                    );
                  })()}
                  {puzzle.maxSteps && (
                    <>Steps Remaining: {puzzle.maxSteps - attempts}</>
                  )}
                  {hintUsed && <span className="text-yellow-400 ml-2">(Hint Used)</span>}
                </div>

                <button
                  onClick={handlePuzzleSubmit}
                  disabled={
                    (puzzle.puzzleType === 'Numeric Sequence' || puzzle.type === 'Octagram Array')
                      ? (!userInput[0] || userInput[0] === 0)
                      : (puzzle.puzzleType === '2048' || puzzle.puzzleType === 'Celestial Grid' || puzzle.type === '2048' || puzzle.type === 'Celestial Grid')
                        ? (() => {
                          const puzzleData = puzzle.data || puzzle;
                          const targetScore = puzzleData.targetScore || 2048;
                          return game2048Score < targetScore;
                        })()
                        : false
                  }
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-stone-700 disabled:text-stone-500 text-white font-bold rounded-lg transition-colors"
                >
                  {(puzzle.puzzleType === 'Numeric Sequence' || puzzle.type === 'Octagram Array') ? 'SUBMIT ANSWER' :
                    (puzzle.puzzleType === 'Rune Sequence' || puzzle.type === 'Rune Sequence') ? 'CONFIRM SEQUENCE' :
                      (puzzle.puzzleType === '2048' || puzzle.puzzleType === 'Celestial Grid' || puzzle.type === '2048' || puzzle.type === 'Celestial Grid') ? 'CONFIRM COMPLETION' :
                        (puzzle.type === 'Inner Demon Trial' || puzzle.type === 'System Inquiry') ? 'MAINTAIN RESOLVE' :
                          'CONFIRM'}
                </button>
              </div>
            )}

            {isProcessing && !showPuzzle && (
              <div className="text-center">
                <Zap className="text-yellow-400 mx-auto mb-2 sm:mb-3 animate-pulse w-10 h-10 sm:w-12 sm:h-12" />
                <p className="text-base sm:text-lg md:text-xl text-yellow-300 font-medium mb-1 sm:mb-2">
                  {currentStageInfo.stage}
                </p>
                <p className="text-xs sm:text-sm md:text-base text-stone-400">{currentStageInfo.description}</p>
              </div>
            )}

            {result && result.success && (
              <div className="text-center">
                <CheckCircle2 className="text-green-400 mx-auto mb-2 sm:mb-3 w-10 h-10 sm:w-12 sm:h-12" />
                <p className="text-base sm:text-lg md:text-xl text-green-300 font-medium mb-1 sm:mb-2">
                  EVOLUTION SUCCESS
                </p>
                <p className="text-xs sm:text-sm md:text-base text-stone-300 mb-2 sm:mb-3">{result.description}</p>
                <p className="text-xs sm:text-sm text-orange-300">
                  Structural Damage: {result.hpLoss} / {tribulationState.totalStats.maxHp} HP
                </p>
              </div>
            )}

            {result && !result.success && (
              <div className="text-center">
                <XCircle className="text-red-400 mx-auto mb-2 sm:mb-3 w-10 h-10 sm:w-12 sm:h-12" />
                <p className="text-base sm:text-lg md:text-xl text-red-300 font-medium mb-1 sm:mb-2">
                  EVOLUTION FAILURE
                </p>
                <p className="text-xs sm:text-sm md:text-base text-stone-300">{result.description}</p>
              </div>
            )}
          </div>

          {/* Tribulation Details */}
          {!result && (
            <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3 md:space-y-4">
              {/* Survival Probability */}
              <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-black/20 rounded-lg">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Skull className="text-red-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm md:text-base text-stone-300">Lethality Probability</span>
                </div>
                <span className={`text-lg sm:text-xl md:text-2xl font-bold ${riskColor}`}>
                  {(tribulationState.deathProbability * 100).toFixed(1)}%
                </span>
              </div>

              {/* Attribute Bonus */}
              <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-black/20 rounded-lg">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Shield className="text-blue-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm md:text-base text-stone-300">Stat Bonus</span>
                </div>
                <span className="text-xs sm:text-sm md:text-base text-green-400 font-medium">
                  {formatAttributeBonus(tribulationState.attributeBonus)}
                </span>
              </div>

              {/* Equipment Bonus */}
              <div className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-black/20 rounded-lg">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Sparkles className="text-purple-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm md:text-base text-stone-300">Gear Bonus</span>
                </div>
                <span className="text-xs sm:text-sm md:text-base text-green-400 font-medium">
                  {formatEquipmentBonus(tribulationState.equipmentBonus)}
                </span>
              </div>

              {/* Total Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Sword className="text-orange-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">FP</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.attack}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Shield className="text-blue-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">DR</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.defense}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Heart className="text-red-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">HP</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.maxHp}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Eye className="text-purple-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">PER</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.spirit}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Gauge className="text-green-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">END</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.physique}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-black/20 rounded-lg">
                  <Zap className="text-yellow-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <div className="text-center flex-1">
                    <div className="text-[10px] sm:text-xs text-stone-500">AGI</div>
                    <div className="text-xs sm:text-sm md:text-base text-stone-300">{tribulationState.totalStats.speed}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Button */}
          {result && (
            <button
              onClick={handleClose}
              className={`w-full py-2 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-bold rounded-lg border-2 transition-all ${result.success
                ? 'bg-green-700 hover:bg-green-600 text-green-100 border-green-500'
                : 'bg-red-700 hover:bg-red-600 text-red-100 border-red-500'
                }`}
            >
              {result.success ? 'EVOLUTION COMPLETE' : 'SYSTEM OFFLINE'}
            </button>
          )}

          {!result && (
            <div className="text-center text-stone-500 text-xs sm:text-sm mt-2 sm:mt-4">
              The surge is inevitable. Face it or fade away.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TribulationModal;
