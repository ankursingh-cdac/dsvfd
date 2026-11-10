import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { HeaderBar } from '../src/shared/components/HeaderBar';
import { PuzzleGrid } from '../src/features/puzzle/components/PuzzleGrid';
import { Api } from '../src/core/network/api';
import { useAuthStore } from '../src/features/auth/store/authStore';

const CAT_3D_IMG = require('../assets/images/cat_3d.png');

const DEFAULT_REGIONS = [
  [0, 0, 0, 1, 1, 1],
  [0, 0, 1, 1, 1, 2],
  [3, 0, 2, 2, 2, 2],
  [3, 3, 2, 4, 4, 2],
  [3, 3, 4, 4, 5, 5],
  [3, 5, 5, 5, 5, 5],
];

export default function DailyChallengeScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<any>(null);
  const [grid, setGrid] = useState<number[][]>([]);
  const [initialGrid, setInitialGrid] = useState<number[][]>([]);
  const [regions, setRegions] = useState<number[][]>(DEFAULT_REGIONS);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [inputMode, setInputMode] = useState<'cat' | 'cross'>('cat');
  const [history, setHistory] = useState<number[][][]>([]);
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [startTime] = useState(Date.now());

  const fetchDaily = async () => {
    setLoading(true);
    try {
      const res = await Api.getDailyChallenge();
      if (res.success && res.challenge) {
        setChallenge(res.challenge);
        setIsCompletedToday(res.challenge.isCompletedToday);
        const init = res.challenge.initialGrid || [];
        setInitialGrid(init);
        setGrid(init.map((row: number[]) => [...row]));
        if (res.challenge.regions && res.challenge.regions.length === 6) {
          setRegions(res.challenge.regions);
        }
      }
    } catch (err: any) {
      console.warn('Error fetching daily challenge:', err);
      // Fallback
      const fallbackInitial = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ];
      setInitialGrid(fallbackInitial);
      setGrid(fallbackInitial.map((row) => [...row]));
      setRegions(DEFAULT_REGIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaily();
  }, []);

  // 1 Tap Gesture: Mark Cross (✕)
  const handleSingleTap = (row: number, col: number) => {
    setSelectedCell({ row, col });
    if (initialGrid[row] && initialGrid[row][col] !== 0) return;

    const currentVal = grid[row][col];
    const nextVal = currentVal === 0 ? -1 : 0;

    setHistory((prev) => [...prev, grid.map((r) => [...r])]);
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = nextVal;
    setGrid(newGrid);
  };

  // 2 Taps (Double Tap) Gesture: Place Cat (🐱)
  const handleDoubleTap = (row: number, col: number) => {
    setSelectedCell({ row, col });
    if (initialGrid[row] && initialGrid[row][col] !== 0) return;

    const currentVal = grid[row][col];
    const nextVal = currentVal === 1 ? 0 : 1;

    setHistory((prev) => [...prev, grid.map((r) => [...r])]);
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = nextVal;
    setGrid(newGrid);
  };

  const handleCellPress = (row: number, col: number) => {
    setSelectedCell({ row, col });
    if (initialGrid[row] && initialGrid[row][col] !== 0) return;

    const currentVal = grid[row][col];
    const nextVal = inputMode === 'cat' ? (currentVal === 1 ? 0 : 1) : (currentVal === -1 ? 0 : -1);

    setHistory((prev) => [...prev, grid.map((r) => [...r])]);
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = nextVal;
    setGrid(newGrid);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setGrid(last);
  };

  const handleErase = () => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (initialGrid[row] && initialGrid[row][col] !== 0) return;

    if (grid[row][col] !== 0) {
      setHistory((prev) => [...prev, grid.map((r) => [...r])]);
      const newGrid = grid.map((r) => [...r]);
      newGrid[row][col] = 0;
      setGrid(newGrid);
    }
  };

  const handleReset = () => {
    Alert.alert('Reset Puzzle', 'Clear all your moves and restart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setGrid(initialGrid.map((r) => [...r]));
          setHistory([]);
          setSelectedCell(null);
        },
      },
    ]);
  };

  // Count placed cats
  let catsCount = 0;
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (grid[r] && grid[r][c] === 1) catsCount++;
    }
  }

  const handleSubmitDaily = async () => {
    if (catsCount !== 6) {
      Alert.alert(
        'Rules Check 🐾',
        `You must place exactly 6 cats (1 per row, col, and colored region). You currently have ${catsCount} cats placed!`
      );
      return;
    }

    try {
      const res = await Api.completeDailyChallenge({
        submittedGrid: grid,
        durationMs: Date.now() - startTime,
      });

      if (res.success) {
        Alert.alert(
          'Paw-some! 🎉',
          `Daily Challenge Completed!\nEarned: +${res.rewards?.coinsEarned || 120} Coins 🪙\nStreak: 🔥 ${res.rewards?.streakDays || (profile?.streakDays || 0) + 1} Days!`
        );
        setIsCompletedToday(true);
        refreshProfile();
      }
    } catch (err: any) {
      Alert.alert('Keep Trying 🐾', err.response?.data?.message || 'Some cats are touching or conflicting!');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>DAILY CHALLENGE 📅</Text>
        <Text style={styles.dateText}>{challenge?.dateString || 'Today’s Queens Puzzle'}</Text>

        {/* Streak & Rewards Banner */}
        <View style={styles.banner}>
          <Text style={styles.streakText}>
            🔥 Streak: {profile?.streakDays || 0} Days
          </Text>
          <Text style={styles.rewardText}>
            Reward: +120 Coins 🪙 & +180 XP ✨
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#E84393" style={{ marginTop: 40 }} />
        ) : isCompletedToday ? (
          <View style={styles.completedCard}>
            <Image source={CAT_3D_IMG} style={styles.completedCatImg} resizeMode="contain" />
            <Text style={styles.completedTitle}>Already Completed Today! 🎉</Text>
            <Text style={styles.completedSubtitle}>
              Come back tomorrow for a new daily Queens puzzle and keep your streak alive!
            </Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Return to Lobby</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.boardHolder, isWide && styles.boardHolderWide]}>
            {/* Cats Counter Pill */}
            <View style={styles.counterPill}>
              <Text style={styles.counterPillText}>
                🐾 {catsCount} / 6 Cats Placed
              </Text>
            </View>

            {/* Queens Rules Quick Pill */}
            <View style={styles.rulesPill}>
              <Text style={styles.rulesText}>
                1 Cat per Row, Column & Region • No Cats Touch!
              </Text>
            </View>

            {/* 6x6 3D Tactile Grid */}
            <PuzzleGrid
              grid={grid}
              initialGrid={initialGrid}
              regions={regions}
              selectedCell={selectedCell}
              onSinglePress={handleSingleTap}
              onDoublePress={handleDoubleTap}
              onCellPress={handleCellPress}
            />

            {/* 3D Action Controls */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, history.length === 0 && styles.disabledBtn]}
                onPress={handleUndo}
                disabled={history.length === 0}
              >
                <Text style={styles.actionBtnText}>↩ Undo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleErase}>
                <Text style={styles.actionBtnText}>🧹 Erase</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleReset}>
                <Text style={styles.actionBtnText}>🔄 Reset</Text>
              </TouchableOpacity>
            </View>

            {/* 3D Wooden Tray - Mode Toggle (Cat vs Cross) */}
            <View style={styles.woodenTray}>
              <TouchableOpacity
                style={[styles.trayOption, inputMode === 'cat' && styles.trayOptionSelected]}
                onPress={() => setInputMode('cat')}
              >
                <Image source={CAT_3D_IMG} style={styles.trayCatImg} resizeMode="contain" />
                <Text style={[styles.trayLabel, inputMode === 'cat' && styles.trayLabelSelected]}>
                  Place Cat
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.trayOption, inputMode === 'cross' && styles.trayOptionSelected]}
                onPress={() => setInputMode('cross')}
              >
                <View style={styles.crossCircle}>
                  <Text style={styles.trayCrossEmoji}>✕</Text>
                </View>
                <Text style={[styles.trayLabel, inputMode === 'cross' && styles.trayLabelSelected]}>
                  Mark Cross
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitDaily}>
              <Text style={styles.submitButtonText}>SUBMIT DAILY PUZZLE 🐾</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Return to Lobby</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF0E4',
  },
  content: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#E84393',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94786A',
    marginBottom: 8,
  },
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8EF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFEAA7',
    width: '100%',
    maxWidth: 400,
    marginBottom: 12,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#E67E22',
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#27AE60',
  },
  counterPill: {
    backgroundColor: '#FF6B8B',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 6,
    shadowColor: '#D81B60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  counterPillText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rulesPill: {
    backgroundColor: '#FFF8EF',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1DEC9',
    marginBottom: 12,
  },
  rulesText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94786A',
    textAlign: 'center',
  },
  completedCard: {
    backgroundColor: '#FFF8EF',
    padding: 24,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#EEDCC8',
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    marginTop: 20,
  },
  completedCatImg: {
    width: 90,
    height: 90,
    marginBottom: 12,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#27AE60',
    marginBottom: 6,
  },
  completedSubtitle: {
    fontSize: 12,
    color: '#94786A',
    textAlign: 'center',
    marginBottom: 16,
  },
  boardHolder: {
    alignItems: 'center',
    width: '100%',
  },
  boardHolderWide: {
    maxWidth: 440,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  actionBtn: {
    backgroundColor: '#FFF8EF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E6D5C3',
    shadowColor: '#C4A992',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledBtn: {
    opacity: 0.4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5C4033',
  },
  woodenTray: {
    flexDirection: 'row',
    backgroundColor: '#EAD7C5',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#CBB29C',
    gap: 10,
    marginBottom: 14,
  },
  trayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EF',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E3CDB8',
    gap: 8,
  },
  trayOptionSelected: {
    backgroundColor: '#FF6B8B',
    borderColor: '#D81B60',
    shadowColor: '#D81B60',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  trayCatImg: {
    width: 28,
    height: 28,
  },
  crossCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#94786A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trayCrossEmoji: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  trayLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#5C4033',
  },
  trayLabelSelected: {
    color: '#FFF',
  },
  submitButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#27AE60',
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
  backButton: {
    marginVertical: 14,
  },
  backButtonText: {
    color: '#94786A',
    fontSize: 14,
    fontWeight: '700',
  },
});
