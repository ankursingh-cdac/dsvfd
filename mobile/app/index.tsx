import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { HeaderBar } from '../src/shared/components/HeaderBar';
import { PawdokuLogo } from '../src/shared/components/PawdokuLogo';
import { useAuthStore } from '../src/features/auth/store/authStore';

const CAT_3D_IMG = require('../assets/images/cat_3d.png');
const SHEEP_3D_IMG = require('../assets/images/sheep_3d.png');

export default function GameHubScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { profile, unlockedLevel = 1 } = useAuthStore();
  const currentUnlocked = unlockedLevel || 1;
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(`level${currentUnlocked}`);

  useEffect(() => {
    // Keep selectedDifficulty valid within unlocked range
    const currentNum = parseInt(selectedDifficulty.replace('level', ''), 10) || 1;
    if (currentNum > currentUnlocked) {
      setSelectedDifficulty(`level${currentUnlocked}`);
    }
  }, [currentUnlocked]);

  const LEVELS = [
    { id: 'level1', lvlNum: 1, label: '4×4', sub: 'Lvl 1' },
    { id: 'level2', lvlNum: 2, label: '5×5', sub: 'Lvl 2' },
    { id: 'level3', lvlNum: 3, label: '6×6', sub: 'Lvl 3' },
    { id: 'level4', lvlNum: 4, label: '7×7', sub: 'Lvl 4' },
    { id: 'level5', lvlNum: 5, label: '8×8', sub: 'Lvl 5' },
  ];

  const selectedLvlInfo = LEVELS.find((l) => l.id === selectedDifficulty) || LEVELS[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar
        onPressLeaderboard={() => router.push('/leaderboard')}
        onPressSettings={() =>
          Alert.alert(
            '🐾 Pawdoku Rules',
            '1. Exactly 1 Cat per row.\n2. Exactly 1 Cat per column.\n3. Exactly 1 Cat per colored region.\n4. No two Cats can touch each other, even diagonally!\n\n💡 Gestures:\n• Tap 1 time = Cross (✕)\n• Double-tap = Cat (🐱)'
          )
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Logo with 3D Mascot */}
        <PawdokuLogo scale={1} />

        {/* Big 3D "PLAY NOW" Action Banner */}
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.playNowBanner}
          onPress={() => router.push(`/single-player?difficulty=${selectedDifficulty}`)}
        >
          <View style={styles.playNowGlow} />
          <View style={styles.playNowContent}>
            <View style={styles.playNowTextStack}>
              <Text style={styles.playNowSub}>SUDOKU + QUEENS LOGIC PUZZLE</Text>
              <Text style={styles.playNowTitle}>PLAY LEVEL {selectedLvlInfo.lvlNum}! 🐾</Text>
              <Text style={styles.playNowHint}>Clean board • Tap 1x for ✕ • 2x for 🐱</Text>
            </View>
            <Image source={CAT_3D_IMG} style={styles.playNowCat} resizeMode="contain" />
          </View>
        </TouchableOpacity>

        {/* Level / Grid Size Selection Pills with Lock Status */}
        <View style={styles.difficultyContainer}>
          <Text style={styles.diffLabel}>Select Grid Size & Level:</Text>
          <View style={styles.diffPillsRow}>
            {LEVELS.map((lvl) => {
              const isLocked = lvl.lvlNum > currentUnlocked;
              const isSelected = selectedDifficulty === lvl.id;

              return (
                <TouchableOpacity
                  key={lvl.id}
                  style={[
                    styles.diffPill,
                    isSelected && styles.diffPillActive,
                    isLocked && styles.diffPillLocked,
                  ]}
                  onPress={() => {
                    if (isLocked) {
                      Alert.alert(
                        '🔒 Level Locked',
                        `Complete Level ${lvl.lvlNum - 1} first to unlock Level ${lvl.lvlNum}!`
                      );
                      return;
                    }
                    setSelectedDifficulty(lvl.id);
                  }}
                >
                  <Text
                    style={[
                      styles.diffPillText,
                      isSelected && styles.diffPillTextActive,
                      isLocked && styles.diffPillTextLocked,
                    ]}
                  >
                    {isLocked ? `🔒 ${lvl.label}` : lvl.label}
                  </Text>
                  <Text
                    style={[
                      styles.diffPillSub,
                      isSelected && styles.diffPillSubActive,
                      isLocked && styles.diffPillSubLocked,
                    ]}
                  >
                    {isLocked ? 'Locked' : lvl.sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4 Gorgeous 3D-Styled Game Mode Cards */}
        <View style={styles.modesContainer}>
          {/* Mode 1: Classic Queens Puzzle */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.modeCard, { borderColor: '#F5CD79', backgroundColor: '#FFFDF5' }]}
            onPress={() => router.push(`/single-player?difficulty=${selectedDifficulty}`)}
          >
            <View style={[styles.modeIconCircle, { backgroundColor: '#FFEAA7' }]}>
              <Text style={{ fontSize: 28 }}>👑</Text>
            </View>
            <View style={styles.modeTextStack}>
              <Text style={styles.modeTitle}>Classic Puzzle</Text>
              <Text style={styles.modeDesc}>Single-player Queens logic with hints & undo</Text>
            </View>
            <View style={styles.playChevron}>
              <Text style={styles.chevronText}>▶</Text>
            </View>
          </TouchableOpacity>

          {/* Mode 2: 1v1 Real-Time Multiplayer Battle */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.modeCard, { borderColor: '#FF8ED4', backgroundColor: '#FFF5F9' }]}
            onPress={() => router.push('/multiplayer')}
          >
            <View style={[styles.modeIconCircle, { backgroundColor: '#FFD1DC' }]}>
              <Text style={{ fontSize: 28 }}>⚔️</Text>
            </View>
            <View style={styles.modeTextStack}>
              <View style={styles.modeTitleRow}>
                <Text style={styles.modeTitle}>1v1 Battle</Text>
                <View style={styles.hotBadge}>
                  <Text style={styles.hotBadgeText}>LIVE</Text>
                </View>
              </View>
              <Text style={styles.modeDesc}>Race an opponent on the exact same puzzle in real-time!</Text>
            </View>
            <View style={styles.playChevron}>
              <Text style={styles.chevronText}>▶</Text>
            </View>
          </TouchableOpacity>

          {/* Mode 3: Play With Friends (Private Rooms) */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.modeCard, { borderColor: '#82C8ED', backgroundColor: '#F0F9FF' }]}
            onPress={() => router.push('/room')}
          >
            <View style={[styles.modeIconCircle, { backgroundColor: '#BFE7FC' }]}>
              <Text style={{ fontSize: 28 }}>👥</Text>
            </View>
            <View style={styles.modeTextStack}>
              <Text style={styles.modeTitle}>Play With Friends</Text>
              <Text style={styles.modeDesc}>Create a private room with 6-letter invite code</Text>
            </View>
            <View style={styles.playChevron}>
              <Text style={styles.chevronText}>▶</Text>
            </View>
          </TouchableOpacity>

          {/* Mode 4: Daily Challenge */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.modeCard, { borderColor: '#A7D88A', backgroundColor: '#F6FFF2' }]}
            onPress={() => router.push('/daily-challenge')}
          >
            <View style={[styles.modeIconCircle, { backgroundColor: '#D8F3C7' }]}>
              <Text style={{ fontSize: 28 }}>📅</Text>
            </View>
            <View style={styles.modeTextStack}>
              <View style={styles.modeTitleRow}>
                <Text style={styles.modeTitle}>Daily Challenge</Text>
                <View style={[styles.hotBadge, { backgroundColor: '#E67E22' }]}>
                  <Text style={styles.hotBadgeText}>+120 🪙</Text>
                </View>
              </View>
              <Text style={styles.modeDesc}>Streak: 🔥 {profile?.streakDays || 0} Days • Daily rewards!</Text>
            </View>
            <View style={styles.playChevron}>
              <Text style={styles.chevronText}>▶</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Quick Feature Cards */}
        <View style={styles.quickAccessRow}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/spin-wheel')}
          >
            <Text style={styles.quickEmoji}>🎡</Text>
            <Text style={styles.quickLabel}>SPIN WHEEL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/shop')}
          >
            <Text style={styles.quickEmoji}>🛍️</Text>
            <Text style={styles.quickLabel}>SHOP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/leaderboard')}
          >
            <Text style={styles.quickEmoji}>🏆</Text>
            <Text style={styles.quickLabel}>RANKINGS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  playNowBanner: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#E84393',
    borderRadius: 26,
    padding: 16,
    borderWidth: 3,
    borderColor: '#C2185B',
    marginVertical: 10,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  playNowGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  playNowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playNowTextStack: {
    flex: 1,
    paddingRight: 10,
  },
  playNowSub: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFEAA7',
    letterSpacing: 0.8,
  },
  playNowTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginVertical: 2,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  playNowHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFEAA7',
  },
  playNowCat: {
    width: 76,
    height: 76,
  },
  difficultyContainer: {
    width: '100%',
    maxWidth: 440,
    marginVertical: 6,
    alignItems: 'center',
  },
  diffLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94786A',
    marginBottom: 6,
  },
  diffPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  diffPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFF8EF',
    borderWidth: 2,
    borderColor: '#EEDCC8',
    marginHorizontal: 4,
  },
  diffPillActive: {
    backgroundColor: '#FFD700',
    borderColor: '#D4AC0D',
  },
  diffPillLocked: {
    backgroundColor: '#EAE5DE',
    borderColor: '#D5CDC4',
    opacity: 0.65,
  },
  diffPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94786A',
    textAlign: 'center',
  },
  diffPillTextActive: {
    color: '#49352E',
    fontWeight: '900',
  },
  diffPillTextLocked: {
    color: '#8A8078',
  },
  diffPillSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A99285',
    textAlign: 'center',
  },
  diffPillSubActive: {
    color: '#5C381E',
  },
  diffPillSubLocked: {
    color: '#9E948C',
  },
  modesContainer: {
    width: '100%',
    maxWidth: 440,
    marginTop: 10,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 22,
    borderWidth: 2.5,
    marginBottom: 12,
    shadowColor: '#C4A482',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  modeIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  modeTextStack: {
    flex: 1,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#49352E',
  },
  hotBadge: {
    backgroundColor: '#FF3366',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 6,
  },
  hotBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  modeDesc: {
    fontSize: 11,
    color: '#94786A',
    fontWeight: '600',
    marginTop: 2,
  },
  playChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF8EF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
    marginLeft: 8,
  },
  chevronText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E84393',
  },
  quickAccessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 440,
    marginTop: 8,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFF8EF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#EEDCC8',
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#C4A482',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  quickEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  quickLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#6A4C93',
    letterSpacing: 0.4,
  },
});
