import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';

const CAT_3D_IMG = require('../../../../assets/images/cat_3d.png');

interface VictoryModalProps {
  visible: boolean;
  timeSeconds: number;
  xpEarned: number;
  coinsEarned: number;
  levelCompleted?: number;
  onNextLevel: () => void;
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  visible,
  timeSeconds,
  xpEarned,
  coinsEarned,
  levelCompleted = 1,
  onNextLevel,
  onHome,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const nextLvl = levelCompleted + 1;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Peeking Mascot Celebration */}
          <View style={styles.mascotHolder}>
            <Image source={CAT_3D_IMG} style={styles.catImage3D} resizeMode="contain" />
            <Text style={styles.confetti}>🎉 ✨ 🌟 ✨ 🎉</Text>
          </View>

          <Text style={styles.victoryTitle}>LEVEL {levelCompleted} SOLVED!</Text>
          <Text style={styles.victorySubtitle}>Level {nextLvl} is now unlocked! 🐾</Text>

          {/* Stats Box */}
          <View style={styles.statsBox}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>TIME</Text>
              <Text style={styles.statValue}>{formatTime(timeSeconds)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>XP</Text>
              <Text style={styles.statValue}>+{xpEarned}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>COINS</Text>
              <Text style={styles.statValue}>+{coinsEarned} 🪙</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity activeOpacity={0.85} style={styles.nextButton} onPress={onNextLevel}>
            <Text style={styles.nextButtonText}>PLAY LEVEL {nextLvl} ▶</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} style={styles.homeButton} onPress={onHome}>
            <Text style={styles.homeButtonText}>Return to Lobby</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(73, 53, 46, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: '#FFF8EF',
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#E8CAAC',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  mascotHolder: {
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 8,
  },
  catImage3D: {
    width: 86,
    height: 86,
  },
  confetti: {
    fontSize: 16,
    marginTop: 6,
  },
  victoryTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#E84393',
    letterSpacing: 1,
    textShadowColor: '#FFEAA7',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  victorySubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94786A',
    marginBottom: 16,
  },
  statsBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF0E4',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    justifyContent: 'space-around',
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  divider: {
    width: 1.5,
    backgroundColor: '#EEDCC8',
    height: '80%',
    alignSelf: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94786A',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#49352E',
  },
  nextButton: {
    width: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#27AE60',
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 10,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  homeButton: {
    paddingVertical: 8,
  },
  homeButtonText: {
    color: '#94786A',
    fontSize: 14,
    fontWeight: '700',
  },
});
