import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../../../core/theme/colors';
import {
  CatIcon,
  SheepIcon,
  PandaIcon,
  DogIcon,
  HorseIcon,
  CowIcon,
} from '../../../shared/assets/animals/AnimalIcons';

interface AnimalSelectorProps {
  selectedAnimal: number | null;
  onSelectAnimal: (animalId: number) => void;
  remainingCounts?: Record<number, number>;
}

export const AnimalSelector: React.FC<AnimalSelectorProps> = ({
  selectedAnimal,
  onSelectAnimal,
  remainingCounts,
}) => {
  const animals = [
    { id: 1, icon: CatIcon, bg: Colors.animals[1].color },
    { id: 2, icon: SheepIcon, bg: Colors.animals[2].color },
    { id: 3, icon: PandaIcon, bg: Colors.animals[3].color },
    { id: 4, icon: DogIcon, bg: Colors.animals[4].color },
    { id: 5, icon: HorseIcon, bg: Colors.animals[5].color },
    { id: 6, icon: CowIcon, bg: Colors.animals[6].color },
  ];

  return (
    <View style={styles.container}>
      {/* 6 Animal Tiles Tray */}
      <View style={styles.tray}>
        {animals.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedAnimal === item.id;
          const remaining = remainingCounts ? remainingCounts[item.id] : undefined;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              style={[
                styles.tile,
                { backgroundColor: item.bg },
                isSelected && styles.tileSelected,
              ]}
              onPress={() => onSelectAnimal(item.id)}
            >
              <Icon size={38} />
              {remaining !== undefined && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeText}>{remaining}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* "6 ANIMALS THEME" Playful Badge */}
      <View style={styles.themeBadge}>
        <View style={styles.themeBadgeInner}>
          <Text style={styles.sixText}>6</Text>
          <View style={styles.themeLabelStack}>
            <Text style={styles.themeLine1}>ANIMALS</Text>
            <Text style={styles.themeLine2}>THEME</Text>
          </View>
          <Text style={styles.pawIcon}>🐾</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  tray: {
    flexDirection: 'row',
    backgroundColor: '#FFF8EF',
    padding: 6,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#EEDCC8',
    shadowColor: '#C4A482',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tile: {
    width: 46,
    height: 46,
    borderRadius: 12,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  tileSelected: {
    borderColor: '#FF1493',
    borderWidth: 3,
    transform: [{ scale: 1.08 }],
    shadowColor: '#FF1493',
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#49352E',
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  themeBadge: {
    marginLeft: 8,
    backgroundColor: '#E84393',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#C2185B',
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  themeBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sixText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFD700',
    marginRight: 4,
    textShadowColor: '#C2185B',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  themeLabelStack: {
    flexDirection: 'column',
  },
  themeLine1: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    lineHeight: 11,
  },
  themeLine2: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFEAA7',
    letterSpacing: 0.5,
    lineHeight: 12,
  },
  pawIcon: {
    fontSize: 16,
    marginLeft: 4,
  },
});
