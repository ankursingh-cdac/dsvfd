import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { Colors } from '../src/core/theme/colors';
import { HeaderBar } from '../src/shared/components/HeaderBar';
import { Api } from '../src/core/network/api';
import { useAuthStore } from '../src/features/auth/store/authStore';

const SEGMENTS = [
  { id: 1, label: '50 Coins', color: '#FFD66B' },
  { id: 2, label: '100 Coins', color: '#F48FB1' },
  { id: 3, label: '200 Coins', color: '#82C8ED' },
  { id: 4, label: '75 XP', color: '#A7D88A' },
  { id: 5, label: '150 XP', color: '#F5A04B' },
  { id: 6, label: '300 Coins', color: '#B69AE8' },
  { id: 7, label: 'Double Spin', color: '#FF7675' },
  { id: 8, label: '500 Jackpot!', color: '#FDCB6E' },
];

export default function SpinWheelScreen() {
  const router = useRouter();
  const { profile, updateCoins, updateXpAndLevel, refreshProfile } = useAuthStore();

  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<any>(null);

  const spinAnim = useRef(new Animated.Value(0)).current;

  const handleSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);

    try {
      const res = await Api.spinWheel();
      if (!res.success) {
        Alert.alert('Spin Wheel', res.message || 'Cannot spin right now');
        setIsSpinning(false);
        return;
      }

      const targetPrizeIndex = res.prizeIndex;
      // Calculate target rotation: 5 full rotations + segment angle
      const segmentAngle = 360 / 8;
      const targetAngle = 360 * 5 + (8 - targetPrizeIndex) * segmentAngle;

      spinAnim.setValue(0);
      Animated.timing(spinAnim, {
        toValue: targetAngle,
        duration: 4000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsSpinning(false);
        setWonPrize(res.prize);
        updateCoins(res.totalCoins);
        updateXpAndLevel(res.totalXp, profile?.level || 1);
        refreshProfile();
      });
    } catch (err: any) {
      Alert.alert('Notice', err.response?.data?.message || 'Daily free spin used! Need 50 coins.');
      setIsSpinning(false);
    }
  };

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar />

      <View style={styles.content}>
        <Text style={styles.title}>LUCKY WHEEL</Text>
        <Text style={styles.subtitle}>Spin every day for coins, XP, and surprise jackpots!</Text>

        {/* Wheel Assembly */}
        <View style={styles.wheelContainer}>
          {/* Top Pointer Arrow */}
          <View style={styles.pointer}>
            <Text style={styles.pointerArrow}>▼</Text>
          </View>

          {/* Rotating Wheel */}
          <Animated.View style={[styles.wheel, { transform: [{ rotate: spinInterpolate }] }]}>
            <Svg width={280} height={280} viewBox="0 0 300 300">
              <Circle cx="150" cy="150" r="145" fill="#E8CAAC" stroke="#D4A373" strokeWidth="8" />
              {SEGMENTS.map((seg, i) => {
                const angle = (i * 360) / 8;
                return (
                  <G key={seg.id} transform={`rotate(${angle} 150 150)`}>
                    <Path
                      d="M150 150 L150 10 A140 140 0 0 1 249 51 Z"
                      fill={seg.color}
                      stroke="#FFF"
                      strokeWidth="2"
                    />
                  </G>
                );
              })}
              {/* Center Hub */}
              <Circle cx="150" cy="150" r="30" fill="#FFF8EF" stroke="#E84393" strokeWidth="4" />
              <Circle cx="150" cy="150" r="12" fill="#E84393" />
            </Svg>
          </Animated.View>
        </View>

        {/* Spin Action Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.spinButton, isSpinning && styles.spinButtonDisabled]}
          onPress={handleSpin}
          disabled={isSpinning}
        >
          <Text style={styles.spinButtonText}>
            {isSpinning ? 'SPINNING... 🐾' : 'SPIN THE WHEEL! 🎡'}
          </Text>
        </TouchableOpacity>

        {/* Won Prize Banner */}
        {wonPrize && (
          <View style={styles.wonBanner}>
            <Text style={styles.wonTitle}>🎉 YOU WON {wonPrize.label.toUpperCase()}! 🎉</Text>
          </View>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Return to Lobby</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#E84393',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: '#94786A',
    marginBottom: 20,
    textAlign: 'center',
  },
  wheelContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pointer: {
    position: 'absolute',
    top: -14,
    zIndex: 20,
  },
  pointerArrow: {
    fontSize: 34,
    color: '#E84393',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  wheel: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#D4AC0D',
    shadowColor: '#D4AC0D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  spinButtonDisabled: {
    backgroundColor: '#BDC3C7',
    borderColor: '#95A5A6',
  },
  spinButtonText: {
    color: '#49352E',
    fontSize: 16,
    fontWeight: '900',
  },
  wonBanner: {
    backgroundColor: '#FFF8EF',
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFEAA7',
  },
  wonTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#27AE60',
  },
  backButton: {
    marginTop: 16,
  },
  backButtonText: {
    color: '#94786A',
    fontSize: 14,
    fontWeight: '700',
  },
});
