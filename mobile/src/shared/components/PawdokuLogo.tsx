import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const CAT_3D_IMG = require('../../../assets/images/cat_3d.png');

interface PawdokuLogoProps {
  scale?: number;
}

export const PawdokuLogo: React.FC<PawdokuLogoProps> = ({ scale = 1 }) => {
  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      {/* Decorative Floating Hearts & Paws */}
      <View style={styles.heartsRow}>
        <Text style={styles.pawDeco}>🐾</Text>
        <Text style={styles.heartDeco}>💖</Text>
        <View style={styles.mascotHolder}>
          <Image source={CAT_3D_IMG} style={styles.catImage3D} resizeMode="contain" />
        </View>
        <Text style={styles.heartDeco}>💖</Text>
        <Text style={styles.pawDeco}>🐾</Text>
      </View>

      {/* Main "Pawdoku" 3D Puffy Title */}
      <View style={styles.titleWrapper}>
        <Text style={styles.titleShadow}>Pawdoku</Text>
        <Text style={styles.title}>Pawdoku</Text>
      </View>

      {/* "Cat Sudoku" Subtitle with Side Paws */}
      <View style={styles.subtitleRow}>
        <Text style={styles.sidePaw}>🐾</Text>
        <Text style={styles.subtitleShadow}>Cat Sudoku</Text>
        <Text style={styles.subtitle}>Cat Sudoku</Text>
        <Text style={styles.sidePaw}>🐾</Text>
      </View>

      {/* "Brain Puzzle" Hot Pink Ribbon */}
      <View style={styles.ribbon}>
        <Text style={styles.ribbonText}>Brain Puzzle</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -10,
    zIndex: 10,
  },
  pawDeco: {
    fontSize: 16,
    color: '#FF69B4',
    marginHorizontal: 4,
  },
  heartDeco: {
    fontSize: 14,
    color: '#FF69B4',
    marginHorizontal: 3,
  },
  mascotHolder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  catImage3D: {
    width: 84,
    height: 84,
    shadowColor: '#49352E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  pawsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 60,
    marginTop: -10,
  },
  catPaw: {
    width: 16,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#49352E',
  },
  titleWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleShadow: {
    position: 'absolute',
    top: 3,
    fontSize: 34,
    fontWeight: '900',
    color: '#6A3B18',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFB800',
    letterSpacing: 0.5,
    textShadowColor: '#FFEAA7',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -4,
  },
  sidePaw: {
    fontSize: 14,
    color: '#FF69B4',
    marginHorizontal: 4,
  },
  subtitleShadow: {
    position: 'absolute',
    top: 2,
    fontSize: 20,
    fontWeight: '800',
    color: '#3B2314',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: '#49352E',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  ribbon: {
    backgroundColor: '#E84393',
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 14,
    marginTop: 3,
    borderWidth: 1.5,
    borderColor: '#C2185B',
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  ribbonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFEAA7',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
