import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Gradients } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface FloatingActionButtonProps {
  activeAction: string;
  onActionPress: (action: string) => void;
}

const actions = [
  { id: 'food', title: 'Food Trails', icon: 'fast-food-outline', gradient: Gradients.sunrise },
  { id: 'attractions', title: 'Attractions', icon: 'star-outline', gradient: Gradients.dusk },
  { id: 'nature', title: 'Nature Spots', icon: 'leaf-outline', gradient: Gradients.rainforest },
];

export default function FloatingActionButton({ activeAction, onActionPress }: FloatingActionButtonProps) {
  const [expanded, setExpanded] = useState(false);

  const handleMainPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  const handleActionPress = (actionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onActionPress(actionId);
    setExpanded(false);
  };

  return (
    <View style={styles.container}>
      {expanded && (
        <View style={styles.expandedContainer}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              onPress={() => handleActionPress(action.id)}
              activeOpacity={0.8}
              style={[styles.actionButton, { bottom: (index + 1) * 60 }]}
            >
              <LinearGradient colors={action.gradient as any} style={styles.actionGradient}>
                <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TouchableOpacity onPress={handleMainPress} activeOpacity={0.8} style={styles.mainButton}>
        <LinearGradient colors={Gradients.sunrise} style={styles.mainGradient}>
          <Ionicons name={expanded ? 'close' : 'options-outline'} size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'center',
  },
  expandedContainer: {
    alignItems: 'center',
  },
  actionButton: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionGradient: {
    flex: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mainGradient: {
    flex: 1,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});