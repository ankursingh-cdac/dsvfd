export const Colors = {
  // Main Canvas
  background: '#FFF0E4',
  cardBackground: '#FFF8EF',
  cardBorder: '#EEDCC8',
  white: '#FFFFFF',

  // Wooden Puzzle Frame
  woodOuter: '#E8CAAC',
  woodInner: '#FDF6EE',
  woodDivider: '#E5C4A3',

  // 6x6 Subgrid Pastel Block Colors (2 rows x 3 cols each)
  blocks: [
    '#F8A5C2', // Block 0: Top-Left (Rose Pink)
    '#74B9FF', // Block 1: Top-Right (Sky Blue)
    '#F5CD79', // Block 2: Mid-Left (Peach Orange)
    '#81ECEC', // Block 3: Mid-Right (Soft Aqua)
    '#FFEAA7', // Block 4: Bottom-Left (Soft Yellow)
    '#55E6C1', // Block 5: Bottom-Right (Pastel Green)
  ],

  // Animal Tile Colors
  animals: {
    1: { id: 1, key: 'cat', name: 'Cat', color: '#F8A5C2', borderColor: '#E887A8' },
    2: { id: 2, key: 'sheep', name: 'Sheep', color: '#FFEAA7', borderColor: '#E5D08C' },
    3: { id: 3, key: 'panda', name: 'Panda', color: '#74B9FF', borderColor: '#5CA4EA' },
    4: { id: 4, key: 'dog', name: 'Dog', color: '#F5A04B', borderColor: '#DE8B38' },
    5: { id: 5, key: 'horse', name: 'Horse', color: '#A8E6CF', borderColor: '#8FD4B9' },
    6: { id: 6, key: 'cow', name: 'Cow', color: '#81ECEC', borderColor: '#68D6D6' },
  },

  // Typography
  textPrimary: '#49352E',
  textSecondary: '#94786A',
  textLight: '#B8A498',

  // Accents & Badges
  pinkRibbon: '#E84393',
  pinkBadge: '#FF477E',
  greenSuccess: '#2ECC71',
  yellowGold: '#F1C40F',
  redError: '#FF6B6B',
  purpleAccent: '#9B59B6',

  // Cell states
  selectedCell: '#FF8ED4',
  highlightRowCol: 'rgba(255, 230, 200, 0.45)',
  matchingAnimalHighlight: '#FFD700',
  errorCell: '#FF7675',
  emptyMark: '#FFFFFF',
};
