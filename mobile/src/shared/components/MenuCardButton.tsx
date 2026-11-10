import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { Colors } from '../../core/theme/colors';

interface MenuCardButtonProps {
  title: string;
  type: 'spin' | 'shop' | 'theme' | 'multiplayer' | 'friends';
  onPress: () => void;
  badge?: string;
}

export const MenuCardButton: React.FC<MenuCardButtonProps> = ({ title, type, onPress, badge }) => {
  const renderIcon = () => {
    switch (type) {
      case 'spin':
        return (
          <Svg width={36} height={36} viewBox="0 0 40 40">
            {/* Spinning Wheel Icon */}
            <Circle cx="20" cy="20" r="18" fill="#F39C12" stroke="#D35400" strokeWidth="2" />
            <Path d="M20 20 L20 2 A18 18 0 0 1 36 29 Z" fill="#9B59B6" />
            <Path d="M20 20 L36 29 A18 18 0 0 1 4 29 Z" fill="#E74C3C" />
            <Path d="M20 20 L4 29 A18 18 0 0 1 20 2 Z" fill="#F1C40F" />
            <Circle cx="20" cy="20" r="5" fill="#FFFFFF" stroke="#333" strokeWidth="1.5" />
            <Circle cx="20" cy="20" r="2" fill="#E74C3C" />
          </Svg>
        );
      case 'shop':
        return (
          <Svg width={36} height={36} viewBox="0 0 40 40">
            {/* Gold Coins Stack */}
            <Circle cx="16" cy="24" r="11" fill="#F1C40F" stroke="#B7950B" strokeWidth="1.5" />
            <Circle cx="16" cy="24" r="8" fill="#F7DC6F" />
            <Circle cx="24" cy="18" r="11" fill="#F39C12" stroke="#B7950B" strokeWidth="1.5" />
            <Circle cx="24" cy="18" r="8" fill="#F1C40F" />
            <Text style={{ position: 'absolute', top: 10, left: 18, fontWeight: '900', color: '#7D6608', fontSize: 13 }}>$</Text>
          </Svg>
        );
      case 'theme':
        return (
          <Svg width={36} height={36} viewBox="0 0 40 40">
            {/* Paint Palette / Brush */}
            <Path
              d="M10 20 C10 10 30 10 30 20 C30 26 24 28 20 28 C18 28 16 32 12 30 C10 28 10 24 10 20 Z"
              fill="#FAD7A0"
              stroke="#D35400"
              strokeWidth="2"
            />
            <Circle cx="16" cy="18" r="2.5" fill="#E84393" />
            <Circle cx="24" cy="16" r="2.5" fill="#3498DB" />
            <Circle cx="25" cy="23" r="2.5" fill="#2ECC71" />
          </Svg>
        );
      case 'multiplayer':
        return (
          <Svg width={36} height={36} viewBox="0 0 40 40">
            {/* Dual Swords / Versus */}
            <Circle cx="20" cy="20" r="17" fill="#82C8ED" stroke="#5CA4EA" strokeWidth="2" />
            <Path d="M12 28 L28 12 M10 24 L16 30 M24 10 L30 16" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            <Path d="M28 28 L12 12 M30 24 L24 30 M16 10 L10 16" stroke="#FF7675" strokeWidth="3" strokeLinecap="round" />
          </Svg>
        );
      default:
        return (
          <Svg width={36} height={36} viewBox="0 0 40 40">
            <Circle cx="20" cy="20" r="17" fill="#A7D88A" stroke="#8FD4B9" strokeWidth="2" />
          </Svg>
        );
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>{renderIcon()}</View>
      <Text style={styles.title}>{title}</Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F3E5D8',
    marginBottom: 10,
    shadowColor: '#C4A482',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginRight: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6A4C93',
    letterSpacing: 0.4,
  },
  badge: {
    marginLeft: 'auto',
    backgroundColor: '#E84393',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
