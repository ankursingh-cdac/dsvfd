import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { PuzzleCell } from './PuzzleCell';

interface PuzzleGridProps {
  grid: number[][]; // NxN: 0 = empty, 1 = Cat, -1 = Cross '✕'
  initialGrid: number[][]; // NxN: fixed clues (mostly all 0)
  regions: number[][]; // NxN: region IDs 0..N-1
  selectedCell: { row: number; col: number } | null;
  onCellPress?: (row: number, col: number) => void;
  onSinglePress?: (row: number, col: number) => void;
  onDoublePress?: (row: number, col: number) => void;
  onCellLongPress?: (row: number, col: number) => void;
}

export const PuzzleGrid: React.FC<PuzzleGridProps> = ({
  grid,
  initialGrid,
  regions,
  selectedCell,
  onCellPress,
  onSinglePress,
  onDoublePress,
  onCellLongPress,
}) => {
  const { width } = useWindowDimensions();

  const N = (grid && grid.length) || 6;
  const maxBoardWidth = Math.min(width - 24, 400);
  const cellSize = Math.floor((maxBoardWidth - 28) / N);

  // Compute conflict set: any Cat violating Row, Column, Region, or Non-touching rules
  const conflictCells = new Set<string>();

  // Collect all Cats
  const cats: { r: number; c: number; reg: number }[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (grid[r] && grid[r][c] === 1) {
        cats.push({ r, c, reg: regions[r] ? regions[r][c] : 0 });
      }
    }
  }

  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      const c1 = cats[i];
      const c2 = cats[j];

      const sameRow = c1.r === c2.r;
      const sameCol = c1.c === c2.c;
      const sameRegion = c1.reg === c2.reg;
      const isTouching = Math.abs(c1.r - c2.r) <= 1 && Math.abs(c1.c - c2.c) <= 1;

      if (sameRow || sameCol || sameRegion || isTouching) {
        conflictCells.add(`${c1.r}_${c1.c}`);
        conflictCells.add(`${c2.r}_${c2.c}`);
      }
    }
  }

  return (
    <View style={[styles.meowdokuBoardCard, { width: maxBoardWidth }]}>
      <View style={styles.gridContainer}>
        {grid.map((row, r) => (
          <View key={`row_${r}`} style={styles.row}>
            {row.map((val, c) => {
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const isFixed = initialGrid[r] && initialGrid[r][c] !== 0;
              const regionId = regions[r] ? regions[r][c] : 0;
              const hasConflict = conflictCells.has(`${r}_${c}`);

              return (
                <PuzzleCell
                  key={`cell_${r}_${c}`}
                  row={r}
                  col={c}
                  value={val}
                  regionId={regionId}
                  isFixed={isFixed}
                  isSelected={isSelected}
                  hasConflict={hasConflict}
                  onPress={onCellPress || onSinglePress}
                  onSinglePress={onSinglePress || onCellPress}
                  onDoublePress={onDoublePress || onCellPress}
                  onLongPress={onCellLongPress}
                  size={cellSize}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  meowdokuBoardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#EADED8',
    alignSelf: 'center',
    shadowColor: '#4E4037',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  gridContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});
