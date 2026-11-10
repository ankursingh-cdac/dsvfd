import { create } from 'zustand';

export interface Move {
  row: number;
  col: number;
  prevValue: number;
  newValue: number;
}

interface QueensPuzzleState {
  grid: number[][]; // NxN: 0 = empty, 1 = Cat, -1 = Cross '✕'
  initialGrid: number[][]; // NxN: all 0s initially
  regions: number[][]; // NxN: region IDs 0..N-1
  gridSize: number; // 4, 5, 6, 7, 8
  level: number; // 1 to 5
  puzzleId: string | null;
  sessionId: string | null;
  difficulty: string;
  selectedCell: { row: number; col: number } | null;
  inputMode: 'cat' | 'cross'; // Quick placement mode
  history: Move[];
  hintsUsed: number;
  elapsedSeconds: number;
  isPaused: boolean;
  isVictory: boolean;
  victoryRewards: any | null;

  // Actions
  initPuzzle: (puzzle: {
    initialGrid: number[][];
    regions: number[][];
    puzzleId: string;
    difficulty: any;
    level?: number;
    sessionId?: string;
  }) => void;
  selectCell: (row: number, col: number) => void;
  singleTapCell: (row: number, col: number) => void; // 1 tap: Mark Cross '✕' (or clear)
  doubleTapCell: (row: number, col: number) => void; // 2 taps: Place Cat '🐱' (or clear)
  cycleCell: (row: number, col: number) => void;
  setInputMode: (mode: 'cat' | 'cross') => void;
  eraseCell: () => void;
  undo: () => void;
  clearPlayerMoves: () => void;
  applyHint: (hint: { row: number; col: number; val: number }) => void;
  tickTimer: () => void;
  setPaused: (paused: boolean) => void;
  setVictory: (rewards: any) => void;
  reset: () => void;
}

export const usePuzzleStore = create<QueensPuzzleState>((set, get) => ({
  grid: Array.from({ length: 4 }, () => Array(4).fill(0)),
  initialGrid: Array.from({ length: 4 }, () => Array(4).fill(0)),
  regions: [
    [0, 0, 1, 1],
    [0, 0, 1, 1],
    [2, 2, 3, 3],
    [2, 2, 3, 3],
  ],
  gridSize: 4,
  level: 1,
  puzzleId: null,
  sessionId: null,
  difficulty: 'level1',
  selectedCell: null,
  inputMode: 'cat',
  history: [],
  hintsUsed: 0,
  elapsedSeconds: 0,
  isPaused: false,
  isVictory: false,
  victoryRewards: null,

  initPuzzle: ({ initialGrid, regions, puzzleId, difficulty, level, sessionId }) => {
    const size = initialGrid.length || regions.length || 6;
    let computedLevel = level || 1;
    if (!level) {
      if (size === 4) computedLevel = 1;
      else if (size === 5) computedLevel = 2;
      else if (size === 6) computedLevel = 3;
      else if (size === 7) computedLevel = 4;
      else if (size === 8) computedLevel = 5;
    }

    set({
      grid: initialGrid.map((row) => [...row]),
      initialGrid: initialGrid.map((row) => [...row]),
      regions: regions.map((row) => [...row]),
      gridSize: size,
      level: computedLevel,
      puzzleId,
      difficulty: String(difficulty),
      sessionId: sessionId || null,
      selectedCell: null,
      inputMode: 'cat',
      history: [],
      hintsUsed: 0,
      elapsedSeconds: 0,
      isPaused: false,
      isVictory: false,
      victoryRewards: null,
    });
  },

  selectCell: (row, col) => {
    const { grid, initialGrid, inputMode, history } = get();

    if (initialGrid[row] && initialGrid[row][col] !== 0) {
      set({ selectedCell: { row, col } });
      return;
    }

    const prevValue = grid[row][col];
    let newValue = prevValue;

    if (inputMode === 'cat') {
      newValue = prevValue === 1 ? 0 : 1;
    } else {
      newValue = prevValue === -1 ? 0 : -1;
    }

    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = newValue;

    set({
      grid: newGrid,
      selectedCell: { row, col },
      history: [...history, { row, col, prevValue, newValue }],
    });
  },

  // 1 Tap Gesture: Mark Cross '✕' (or clear if already marked)
  singleTapCell: (row, col) => {
    const { grid, initialGrid, history } = get();
    if (initialGrid[row] && initialGrid[row][col] !== 0) return;

    const prevValue = grid[row][col];
    // If empty -> cross (-1). If cross (-1) -> clear (0). If cat (1) -> clear (0).
    const newValue = prevValue === 0 ? -1 : 0;

    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = newValue;

    set({
      grid: newGrid,
      selectedCell: { row, col },
      history: [...history, { row, col, prevValue, newValue }],
    });
  },

  // 2 Taps (Double Tap) Gesture: Place Cat '🐱' (or clear if already Cat)
  doubleTapCell: (row, col) => {
    const { grid, initialGrid, history } = get();
    if (initialGrid[row] && initialGrid[row][col] !== 0) return;

    const prevValue = grid[row][col];
    // If empty or cross -> cat (1). If already cat -> clear (0).
    const newValue = prevValue === 1 ? 0 : 1;

    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = newValue;

    set({
      grid: newGrid,
      selectedCell: { row, col },
      history: [...history, { row, col, prevValue, newValue }],
    });
  },

  cycleCell: (row, col) => {
    const { grid, initialGrid, history } = get();
    if (initialGrid[row] && initialGrid[row][col] !== 0) return;

    const prevValue = grid[row][col];
    // Cycle: 0 (empty) -> -1 (cross) -> 1 (cat) -> 0 (empty)
    const newValue = prevValue === 0 ? -1 : prevValue === -1 ? 1 : 0;

    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = newValue;

    set({
      grid: newGrid,
      selectedCell: { row, col },
      history: [...history, { row, col, prevValue, newValue }],
    });
  },

  setInputMode: (mode) => set({ inputMode: mode }),

  eraseCell: () => {
    const { grid, initialGrid, selectedCell, history } = get();
    if (!selectedCell) return;
    const { row, col } = selectedCell;

    if (initialGrid[row] && initialGrid[row][col] !== 0) return;

    const prevValue = grid[row][col];
    if (prevValue === 0) return;

    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = 0;

    set({
      grid: newGrid,
      history: [...history, { row, col, prevValue, newValue: 0 }],
    });
  },

  undo: () => {
    const { history, grid } = get();
    if (history.length === 0) return;

    const lastMove = history[history.length - 1];
    const newGrid = grid.map((r) => [...r]);
    newGrid[lastMove.row][lastMove.col] = lastMove.prevValue;

    set({
      grid: newGrid,
      history: history.slice(0, -1),
      selectedCell: { row: lastMove.row, col: lastMove.col },
    });
  },

  clearPlayerMoves: () => {
    const { initialGrid } = get();
    set({
      grid: initialGrid.map((r) => [...r]),
      history: [],
      selectedCell: null,
    });
  },

  applyHint: (hint) => {
    const { grid, hintsUsed, history } = get();
    const prevValue = grid[hint.row][hint.col];
    const newGrid = grid.map((r) => [...r]);
    newGrid[hint.row][hint.col] = hint.val;

    set({
      grid: newGrid,
      hintsUsed: hintsUsed + 1,
      selectedCell: { row: hint.row, col: hint.col },
      history: [...history, { row: hint.row, col: hint.col, prevValue, newValue: hint.val }],
    });
  },

  tickTimer: () => {
    const { isPaused, isVictory } = get();
    if (!isPaused && !isVictory) {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
    }
  },

  setPaused: (paused) => set({ isPaused: paused }),
  setVictory: (rewards) => set({ isVictory: true, victoryRewards: rewards }),
  reset: () =>
    set({
      selectedCell: null,
      history: [],
      hintsUsed: 0,
      elapsedSeconds: 0,
      isPaused: false,
      isVictory: false,
      victoryRewards: null,
    }),
}));
