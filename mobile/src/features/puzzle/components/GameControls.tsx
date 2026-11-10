import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface GameControlsProps {
  onUndo: () => void;
  onErase: () => void;
  onToggleNotes: () => void;
  isNotesMode: boolean;
  onRestart?: () => void;
  onPause?: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onUndo,
  onErase,
  onToggleNotes,
  isNotesMode,
  onRestart,
  onPause,
}) => {
  const controls = [
    { label: 'Undo', icon: '↩️', action: onUndo },
    { label: 'Erase', icon: '🧹', action: onErase },
    {
      label: isNotesMode ? 'Notes ON' : 'Notes',
      icon: '✏️',
      action: onToggleNotes,
      isActive: isNotesMode,
    },
    ...(onRestart ? [{ label: 'Restart', icon: '🔄', action: onRestart }] : []),
    ...(onPause ? [{ label: 'Pause', icon: '⏸️', action: onPause }] : []),
  ];

  return (
    <View style={styles.container}>
      {controls.map((btn, index) => (
        <TouchableOpacity
          key={index}
          activeOpacity={0.75}
          style={[styles.button, btn.isActive && styles.buttonActive]}
          onPress={btn.action}
        >
          <Text style={styles.icon}>{btn.icon}</Text>
          <Text style={[styles.label, btn.isActive && styles.labelActive]}>{btn.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    width: '100%',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8EF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EEDCC8',
    marginHorizontal: 4,
    minWidth: 58,
    shadowColor: '#C4A482',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonActive: {
    backgroundColor: '#FFEAA7',
    borderColor: '#F39C12',
    borderWidth: 2,
  },
  icon: {
    fontSize: 16,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6A4C93',
  },
  labelActive: {
    color: '#D35400',
  },
});
