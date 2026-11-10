import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';

const SHEEP_3D_IMG = require('../../../../assets/images/sheep_3d.png');
const CAT_3D_IMG = require('../../../../assets/images/cat_3d.png');

interface HintCardProps {
  type: 1 | 2;
  coinsCost: number;
  onPress: () => void;
  disabled?: boolean;
}

export const HintCard: React.FC<HintCardProps> = ({ type, coinsCost, onPress, disabled }) => {
  return (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        {type === 1 ? (
          <View style={styles.graphicHolder}>
            <Image source={SHEEP_3D_IMG} style={styles.sheepImage} resizeMode="contain" />
            <View style={styles.bulbBadge}>
              <Text style={{ fontSize: 20 }}>💡</Text>
            </View>
          </View>
        ) : (
          <View style={styles.miniGridGraphic}>
            <View style={styles.miniGridBorder}>
              <Image source={CAT_3D_IMG} style={styles.miniCat} resizeMode="contain" />
              <Text style={[styles.miniCross, { top: 2, left: 16 }]}>✕</Text>
              <Text style={[styles.miniCross, { bottom: 2, left: 16 }]}>✕</Text>
              <Text style={[styles.miniCross, { top: 14, left: 2 }]}>✕</Text>
              <Text style={[styles.miniCross, { top: 14, right: 2 }]}>✕</Text>
            </View>
          </View>
        )}

        <View style={styles.textColumn}>
          <Text style={styles.hintTitle}>HINT {type}</Text>
          <Text style={styles.hintSub}>
            {type === 1 ? 'Reveal 1 Cat / Cross' : 'Eliminate Impossible Cells'}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.coinButton, disabled && styles.coinButtonDisabled]}
            onPress={onPress}
            disabled={disabled}
          >
            <Text style={styles.coinCostText}>{coinsCost}</Text>
            <Text style={styles.coinSymbol}>🪙</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF8EF',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#EEDCC8',
    padding: 10,
    marginBottom: 10,
    shadowColor: '#C4A482',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  graphicHolder: {
    position: 'relative',
    marginRight: 10,
    alignItems: 'center',
  },
  sheepImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  bulbBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
  },
  miniGridGraphic: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniGridBorder: {
    width: 48,
    height: 48,
    backgroundColor: '#FFEAA7',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F39C12',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  miniCat: {
    width: 24,
    height: 24,
  },
  miniCross: {
    position: 'absolute',
    fontSize: 10,
    color: '#E74C3C',
    fontWeight: '900',
  },
  textColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  hintTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F5A04B',
    letterSpacing: 0.5,
  },
  hintSub: {
    fontSize: 9,
    color: '#94786A',
    fontWeight: '600',
    marginBottom: 4,
  },
  coinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ECC71',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#27AE60',
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  coinButtonDisabled: {
    backgroundColor: '#BDC3C7',
    borderColor: '#95A5A6',
  },
  coinCostText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    marginRight: 4,
  },
  coinSymbol: {
    fontSize: 13,
  },
});
