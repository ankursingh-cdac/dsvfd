import React, { useRef } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Image } from 'react-native';

// 3D Rendered Cat Image Asset (100% transparent RGBA PNG)
const CAT_3D_IMG = require('../../../../assets/images/cat_3d.png');

// Authentic Meowdoku Color Palette
export const REGION_COLORS = [
  '#67C5BF', // Region 0: Seafoam Teal
  '#DD84CB', // Region 1: Pastel Orchid Pink
  '#6CB6DC', // Region 2: Cornflower Sky Blue
  '#E8C94F', // Region 3: Warm Amber Yellow
  '#D896B3', // Region 4: Soft Mauve Rose
  '#A9D893', // Region 5: Pastel Spring Green
  '#9E6746', // Region 6: Warm Mocha Brown
  '#7E6ECE', // Region 7: Pastel Lavender Purple
  '#227B49', // Region 8: Forest Green
  '#EA8948', // Region 9: Vibrant Coral Orange
];

interface PuzzleCellProps {
  row: number;
  col: number;
  value: number; // 0 = empty, 1 = Cat, -1 = Cross '✕'
  regionId: number; // 0..N-1
  isFixed?: boolean;
  isSelected: boolean;
  isHighlighted?: boolean;
  hasConflict?: boolean;
  onPress?: (row: number, col: number) => void;
  onSinglePress?: (row: number, col: number) => void;
  onDoublePress?: (row: number, col: number) => void;
  onLongPress?: (row: number, col: number) => void;
  size: number;
}

export const PuzzleCell: React.FC<PuzzleCellProps> = ({
  row,
  col,
  value,
  regionId,
  isFixed,
  isSelected,
  hasConflict,
  onPress,
  onSinglePress,
  onDoublePress,
  onLongPress,
  size,
}) => {
  const lastTapTimeRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  // Box ALWAYS keeps its exact region color - never changed by selection or cats!
  const bgColor = REGION_COLORS[regionId % REGION_COLORS.length];

  const handlePress = () => {
    if (isFixed) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 260; // ms

    if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
      // Double Tap -> Place Cat 🐱
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      lastTapTimeRef.current = 0;

      if (onDoublePress) {
        onDoublePress(row, col);
      } else if (onPress) {
        onPress(row, col);
      }
    } else {
      // Single Tap -> Mark Cross ✕
      lastTapTimeRef.current = now;
      timerRef.current = setTimeout(() => {
        if (onSinglePress) {
          onSinglePress(row, col);
        } else if (onPress) {
          onPress(row, col);
        }
        timerRef.current = null;
        lastTapTimeRef.current = 0;
      }, DOUBLE_TAP_DELAY);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[
        styles.cellBox,
        {
          width: size,
          height: size,
          backgroundColor: bgColor,
        },
        hasConflict && styles.conflictRing,
      ]}
      onPress={handlePress}
      onLongPress={() => onLongPress && onLongPress(row, col)}
    >
      {value === 1 ? (
        // 🐱 3D Rendered Cat Mascot (100% transparent PNG floating directly on the cell)
        <View style={styles.catImageHolder}>
          <Image
            source={CAT_3D_IMG}
            style={{ width: size * 0.82, height: size * 0.82 }}
            resizeMode="contain"
          />
        </View>
      ) : value === -1 ? (
        // ✕ Crisp, Bold White Cross Mark exactly like Meowdoku
        <View style={styles.crossContainer}>
          <Text style={[styles.crossText, { fontSize: size * 0.48 }]}>✕</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cellBox: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    overflow: 'hidden',
    position: 'relative',
    // Strictly ZERO border on boxes at all times
    borderWidth: 0,
  },
  conflictRing: {
    borderWidth: 2,
    borderColor: '#FF4757',
  },
  catImageHolder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossText: {
    color: '#FFFFFF',
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
