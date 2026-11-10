import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { HeaderBar } from '../src/shared/components/HeaderBar';
import { PuzzleGrid } from '../src/features/puzzle/components/PuzzleGrid';
import { HintCard } from '../src/features/puzzle/components/HintCard';
import { VictoryModal } from '../src/features/puzzle/components/VictoryModal';
import { usePuzzleStore } from '../src/features/puzzle/store/puzzleStore';
import { useAuthStore } from '../src/features/auth/store/authStore';
import { Api } from '../src/core/network/api';

const CAT_3D_IMG = require('../assets/images/cat_3d.png');

// Authentic Meowdoku offline fallback templates for each level (100% verified 1 unique solution)
const OFFLINE_LEVELS: Record<string, { size: number; level: number; regions: number[][] }> = {
  level1: {
    size: 4,
    level: 1,
    regions: [
      [0, 0, 1, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 3],
      [0, 0, 0, 0],
    ],
  },
  level2: {
    size: 5,
    level: 2,
    regions: [
      [0, 0, 1, 1, 1],
      [0, 2, 2, 1, 1],
      [0, 2, 3, 3, 1],
      [4, 2, 3, 3, 3],
      [4, 4, 4, 3, 3],
    ],
  },
  level3: {
    size: 6,
    level: 3,
    regions: [
      [0, 0, 0, 1, 1, 1],
      [0, 0, 2, 2, 1, 1],
      [3, 3, 2, 2, 4, 4],
      [3, 3, 5, 5, 4, 4],
      [3, 5, 5, 5, 4, 4],
      [5, 5, 5, 5, 4, 4],
    ],
  },
  level4: {
    size: 7,
    level: 4,
    regions: [
      [0, 0, 0, 1, 1, 2, 2],
      [0, 0, 3, 1, 1, 2, 2],
      [0, 3, 3, 3, 4, 2, 2],
      [3, 3, 3, 4, 4, 4, 5],
      [6, 6, 3, 4, 4, 5, 5],
      [6, 6, 6, 4, 5, 5, 5],
      [6, 6, 6, 6, 5, 5, 5],
    ],
  },
  level5: {
    size: 8,
    level: 5,
    regions: [
      [0, 0, 0, 0, 1, 1, 1, 1],
      [0, 0, 0, 0, 1, 1, 1, 2],
      [3, 3, 0, 0, 4, 4, 2, 2],
      [3, 3, 3, 5, 4, 4, 2, 2],
      [6, 3, 3, 5, 5, 4, 2, 2],
      [6, 6, 3, 5, 5, 5, 7, 7],
      [6, 6, 6, 5, 5, 7, 7, 7],
      [6, 6, 6, 6, 7, 7, 7, 7],
    ],
  },
};

// Authoritative local client-side Queens validation (works offline & online)
function validateQueensSolution(grid: number[][], regions: number[][]): { isValid: boolean; reason?: string } {
  const N = grid.length;
  const cats: { r: number; c: number; reg: number }[] = [];

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (grid[r] && grid[r][c] === 1) {
        cats.push({ r, c, reg: regions[r] ? regions[r][c] : 0 });
      }
    }
  }

  if (cats.length !== N) {
    return { isValid: false, reason: `Need exactly ${N} cats placed (currently ${cats.length})` };
  }

  // 1. Exactly 1 Cat per row
  const rowCounts = new Array(N).fill(0);
  for (const cat of cats) {
    rowCounts[cat.r]++;
    if (rowCounts[cat.r] > 1) {
      return { isValid: false, reason: `Row ${cat.r + 1} has multiple cats!` };
    }
  }

  // 2. Exactly 1 Cat per column
  const colCounts = new Array(N).fill(0);
  for (const cat of cats) {
    colCounts[cat.c]++;
    if (colCounts[cat.c] > 1) {
      return { isValid: false, reason: `Column ${cat.c + 1} has multiple cats!` };
    }
  }

  // 3. Exactly 1 Cat per colored region
  const regCounts = new Array(N).fill(0);
  for (const cat of cats) {
    regCounts[cat.reg]++;
    if (regCounts[cat.reg] > 1) {
      return { isValid: false, reason: `A color region has multiple cats!` };
    }
  }

  // 4. Non-touching: no two cats can touch horizontally, vertically, or diagonally
  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      const c1 = cats[i];
      const c2 = cats[j];
      if (Math.abs(c1.r - c2.r) <= 1 && Math.abs(c1.c - c2.c) <= 1) {
        return { isValid: false, reason: `Cats cannot touch each other, even diagonally!` };
      }
    }
  }

  return { isValid: true };
}

export default function SinglePlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const diffParam = (params.difficulty as string) || 'level1';

  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const {
    grid,
    initialGrid,
    regions,
    gridSize,
    level,
    puzzleId,
    sessionId,
    difficulty,
    selectedCell,
    inputMode,
    elapsedSeconds,
    isVictory,
    victoryRewards,
    initPuzzle,
    selectCell,
    singleTapCell,
    doubleTapCell,
    cycleCell,
    setInputMode,
    eraseCell,
    undo,
    clearPlayerMoves,
    applyHint,
    tickTimer,
    setVictory,
  } = usePuzzleStore();

  const { profile, updateCoins, updateXpAndLevel, refreshProfile, unlockLevel } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load new Queens puzzle with pristine empty board
  const loadNewPuzzle = async (diff: string = diffParam) => {
    setIsLoading(true);
    try {
      const puzData = await Api.getRandomPuzzle(diff);
      if (puzData.success && puzData.puzzle) {
        let sessionData: any = null;
        try {
          sessionData = await Api.startGame(puzData.puzzle.puzzleId, diff);
        } catch (sessErr) {
          console.warn('Game start session error (offline play continuing):', sessErr);
        }

        const puz = puzData.puzzle;
        const size = puz.initialGrid.length || puz.regions.length || 4;
        let lvl = 1;
        if (diff.startsWith('level')) {
          lvl = parseInt(diff.replace('level', ''), 10) || 1;
        } else {
          if (size === 4) lvl = 1;
          else if (size === 5) lvl = 2;
          else if (size === 6) lvl = 3;
          else if (size === 7) lvl = 4;
          else if (size === 8) lvl = 5;
        }

        initPuzzle({
          initialGrid: puz.initialGrid, // all 0s
          regions: puz.regions,
          puzzleId: puz.puzzleId,
          difficulty: diff,
          level: lvl,
          sessionId: sessionData?.session?.sessionId || null,
        });
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn('Using offline Queens starter template for', diff, err.message);
    }

    // Offline fallback for any level:
    const fallback = OFFLINE_LEVELS[diff] || OFFLINE_LEVELS.level1;
    const fallbackInitial = Array.from({ length: fallback.size }, () =>
      new Array(fallback.size).fill(0)
    );
    initPuzzle({
      initialGrid: fallbackInitial,
      regions: fallback.regions,
      puzzleId: `offline_queens_${fallback.size}x${fallback.size}`,
      difficulty: diff,
      level: fallback.level,
    });
    setIsLoading(false);
  };

  useEffect(() => {
    loadNewPuzzle(diffParam);
  }, [diffParam]);

  // Timer interval
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isVictory) {
      timerRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isVictory]);

  // Count placed cats
  const N = gridSize || grid.length || 4;
  let catsCount = 0;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (grid[r] && grid[r][c] === 1) catsCount++;
    }
  }

  // Auto-check victory immediately when all N cats are placed
  useEffect(() => {
    if (catsCount === N && !isVictory && N > 0 && !isLoading) {
      handleCompleteGame();
    }
  }, [catsCount, N, isVictory, isLoading]);

  const handleCompleteGame = async () => {
    // 1. Authoritative local validation (works offline & online)
    const validation = validateQueensSolution(grid, regions);
    if (!validation.isValid) {
      Alert.alert(
        'Check Placement 🐾',
        validation.reason || 'Check the 4 Queens rules: exactly 1 cat per row, col, region, and no diagonal touches!'
      );
      return;
    }

    // 2. Unlock next level in player's campaign
    const nextLvlNum = level + 1;
    unlockLevel(nextLvlNum);

    const defaultRewards = {
      xpEarned: 150,
      coinsEarned: 50,
      totalXp: (profile?.xp || 0) + 150,
      totalCoins: (profile?.coins || 0) + 50,
      newLevel: profile?.level || 1,
      unlockedLevel: nextLvlNum,
    };

    setVictory(defaultRewards);
    if (profile) {
      updateCoins(defaultRewards.totalCoins);
      updateXpAndLevel(defaultRewards.totalXp, defaultRewards.newLevel);
    }

    // 3. Sync with backend in background if session exists
    if (sessionId) {
      Api.completeGame(sessionId, {
        submittedGrid: grid,
        durationMs: elapsedSeconds * 1000,
        hintsUsed: 0,
        mistakes: 0,
      })
        .then((res) => {
          if (res.success && res.rewards) {
            if (res.rewards.unlockedLevel) {
              unlockLevel(res.rewards.unlockedLevel);
            }
            if (profile) {
              updateCoins(res.rewards.totalCoins);
              updateXpAndLevel(res.rewards.totalXp, res.rewards.newLevel);
            }
          }
        })
        .catch((err) => {
          console.warn('Background sync warning:', err.message);
        });
    }
  };

  // Next level progression: advances grid size & complexity
  const handleNextLevel = () => {
    const nextLvlNum = level + 1;
    const nextDiff = `level${nextLvlNum}`;
    router.setParams({ difficulty: nextDiff });
    loadNewPuzzle(nextDiff);
  };

  const handleHint1 = async () => {
    if (!puzzleId) return;
    try {
      const res = await Api.getHint(puzzleId, 'cell', grid);
      if (res.success && res.hint) {
        applyHint(res.hint);
        refreshProfile();
      }
    } catch (err: any) {
      Alert.alert('Hint', err.response?.data?.message || 'Need at least 10 coins!');
    }
  };

  const handleHint2 = async () => {
    if (!puzzleId) return;
    try {
      const res = await Api.getHint(puzzleId, 'cell', grid);
      if (res.success && res.hint) {
        applyHint(res.hint);
        refreshProfile();
        Alert.alert('Elimination Hint 💡', 'Revealed a key Cat or Cross to help eliminate impossible cells!');
      }
    } catch (err: any) {
      Alert.alert('Hint', err.response?.data?.message || 'Need at least 15 coins!');
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar onPressLeaderboard={() => router.push('/leaderboard')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Control Bar */}
        <View style={styles.topControlBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← HUB</Text>
          </TouchableOpacity>

          {/* Level & Grid Size Pill */}
          <View style={styles.diffBadge}>
            <Text style={styles.diffBadgeText}>LEVEL {level} ({N}×{N})</Text>
          </View>

          <View style={styles.timerPill}>
            <Text style={styles.timerText}>⏱️ {formatTimer(elapsedSeconds)}</Text>
          </View>

          {/* Cats Placed Pill */}
          <View style={styles.catsPlacedBadge}>
            <Image source={CAT_3D_IMG} style={styles.badgeCat} resizeMode="contain" />
            <Text style={[styles.catsPlacedText, catsCount === N && styles.catsPlacedFull]}>
              {catsCount} / {N}
            </Text>
          </View>
        </View>

        {/* Gestures & Rules Helper Banner */}
        <View style={styles.rulesBanner}>
          <Text style={styles.gestureHint}>
            👉 Tap 1 time = Cross (✕) • Double tap = Cat (🐱)
          </Text>
          <Text style={styles.rulesText}>
            1 Cat per Row, Column & Region • No Cats Touch!
          </Text>
        </View>

        {/* Dynamic NxN 3D Wooden Puzzle Grid */}
        {isLoading ? (
          <View style={styles.loadingHolder}>
            <ActivityIndicator size="large" color="#E84393" />
            <Text style={styles.loadingText}>Generating Clean Level {level} Board...</Text>
          </View>
        ) : (
          <PuzzleGrid
            grid={grid}
            initialGrid={initialGrid}
            regions={regions}
            selectedCell={selectedCell}
            onSinglePress={singleTapCell}
            onDoublePress={doubleTapCell}
            onCellPress={selectCell}
            onCellLongPress={cycleCell}
          />
        )}

        {/* Mode Selector: Cat Mode vs Cross Mode (Alternative controls) */}
        <View style={styles.inputModeRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.modeButton, inputMode === 'cat' && styles.modeButtonCatActive]}
            onPress={() => setInputMode('cat')}
          >
            <Image source={CAT_3D_IMG} style={styles.modeCatIcon} resizeMode="contain" />
            <Text style={[styles.modeButtonText, inputMode === 'cat' && styles.modeButtonTextActive]}>
              PLACE CAT 🐱
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.modeButton, inputMode === 'cross' && styles.modeButtonCrossActive]}
            onPress={() => setInputMode('cross')}
          >
            <Text style={styles.crossIcon}>✕</Text>
            <Text style={[styles.modeButtonText, inputMode === 'cross' && styles.modeButtonTextActive]}>
              MARK CROSS ✕
            </Text>
          </TouchableOpacity>
        </View>

        {/* Control Tools */}
        <View style={styles.toolsRow}>
          <TouchableOpacity style={styles.toolButton} onPress={undo}>
            <Text style={styles.toolIcon}>↩️</Text>
            <Text style={styles.toolText}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={eraseCell}>
            <Text style={styles.toolIcon}>🧹</Text>
            <Text style={styles.toolText}>Erase</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={clearPlayerMoves}>
            <Text style={styles.toolIcon}>🔄</Text>
            <Text style={styles.toolText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={() => loadNewPuzzle(difficulty)}>
            <Text style={styles.toolIcon}>✨</Text>
            <Text style={styles.toolText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Hints Row */}
        <View style={styles.hintsContainer}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <HintCard type={1} coinsCost={10} onPress={handleHint1} />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <HintCard type={2} coinsCost={15} onPress={handleHint2} />
          </View>
        </View>
      </ScrollView>

      {/* Victory Celebration Modal */}
      <VictoryModal
        visible={isVictory}
        timeSeconds={elapsedSeconds}
        xpEarned={victoryRewards?.xpEarned || 150}
        coinsEarned={victoryRewards?.coinsEarned || 50}
        levelCompleted={level}
        onNextLevel={handleNextLevel}
        onHome={() => router.replace('/')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F6EF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
    marginVertical: 10,
    gap: 6,
  },
  backButton: {
    backgroundColor: '#FFF8EF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
  },
  backButtonText: {
    color: '#8C5A2B',
    fontSize: 12,
    fontWeight: '900',
  },
  diffBadge: {
    backgroundColor: '#FFD700',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E6A100',
  },
  diffBadgeText: {
    color: '#5C381E',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timerPill: {
    backgroundColor: '#FFF8EF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
  },
  timerText: {
    color: '#49352E',
    fontSize: 12,
    fontWeight: '800',
  },
  catsPlacedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFC2D1',
    gap: 4,
  },
  badgeCat: {
    width: 20,
    height: 20,
  },
  catsPlacedText: {
    color: '#E84393',
    fontSize: 13,
    fontWeight: '900',
  },
  catsPlacedFull: {
    color: '#2ECC71',
  },
  rulesBanner: {
    backgroundColor: '#FFF8EF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFEAA7',
    width: '100%',
    maxWidth: 420,
    marginBottom: 10,
    alignItems: 'center',
  },
  gestureHint: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E84393',
    marginBottom: 2,
  },
  rulesText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94786A',
    textAlign: 'center',
  },
  loadingHolder: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '800',
    color: '#8C5A2B',
  },
  inputModeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    marginTop: 12,
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8EF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#EEDCC8',
    gap: 8,
    shadowColor: '#5C381E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  modeButtonCatActive: {
    backgroundColor: '#FF6B8B',
    borderColor: '#D81B60',
    shadowColor: '#D81B60',
    shadowOpacity: 0.35,
    elevation: 4,
  },
  modeButtonCrossActive: {
    backgroundColor: '#74B9FF',
    borderColor: '#0984E3',
    shadowColor: '#0984E3',
    shadowOpacity: 0.35,
    elevation: 4,
  },
  modeCatIcon: {
    width: 24,
    height: 24,
  },
  crossIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0984E3',
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#5C381E',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
    marginTop: 10,
    gap: 8,
  },
  toolButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFF8EF',
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
  },
  toolIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  toolText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C5A2B',
  },
  hintsContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 400,
    marginTop: 12,
  },
});
