import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../features/auth/store/authStore';
import { CatIcon } from '../assets/animals/AnimalIcons';

interface HeaderBarProps {
  onPressProfile?: () => void;
  onPressLeaderboard?: () => void;
  onPressSettings?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onPressProfile,
  onPressLeaderboard,
  onPressSettings,
}) => {
  const { profile, user } = useAuthStore();

  const level = profile?.level || 1;
  const coins = profile?.coins || 200;
  const mmr = profile?.mmr || 1000;
  const username = user?.username || profile?.username || 'Guest';

  return (
    <View style={styles.container}>
      {/* Left: Player Profile Pill */}
      <TouchableOpacity activeOpacity={0.8} style={styles.profilePill} onPress={onPressProfile}>
        <View style={styles.avatarCircle}>
          <CatIcon size={30} />
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{level}</Text>
          </View>
        </View>
        <Text style={styles.username} numberOfLines={1}>
          {username}
        </Text>
      </TouchableOpacity>

      {/* Center/Right: Coins Counter Pill */}
      <View style={styles.coinsPill}>
        <Text style={styles.coinIcon}>🪙</Text>
        <Text style={styles.coinsText}>{coins}</Text>
      </View>

      {/* Rating / Trophy Pill */}
      <TouchableOpacity activeOpacity={0.8} style={styles.trophyPill} onPress={onPressLeaderboard}>
        <Text style={styles.trophyIcon}>🏆</Text>
        <Text style={styles.trophyText}>{mmr}</Text>
      </TouchableOpacity>

      {/* Settings / Info Gear */}
      {onPressSettings && (
        <TouchableOpacity activeOpacity={0.8} style={styles.settingsButton} onPress={onPressSettings}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
  },
  profilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EEDCC8',
    maxWidth: 150,
    shadowColor: '#C4A482',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD1DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    position: 'relative',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#FF3366',
    borderRadius: 7,
    paddingHorizontal: 4,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  username: {
    fontSize: 13,
    fontWeight: '800',
    color: '#49352E',
  },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#F5CD79',
    shadowColor: '#C4A482',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  coinIcon: {
    fontSize: 15,
    marginRight: 4,
  },
  coinsText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#B7791F',
  },
  trophyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#82C8ED',
    shadowColor: '#C4A482',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  trophyIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  trophyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B6CB0',
  },
  settingsButton: {
    backgroundColor: '#FFF8EF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EEDCC8',
  },
  settingsIcon: {
    fontSize: 15,
  },
});
