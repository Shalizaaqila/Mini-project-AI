import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Highlight {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: readonly string[];
  category: string;
}

interface HighlightsCarouselProps {
  highlights: Highlight[];
  onHighlightPress?: (highlight: Highlight) => void;
}

export default function HighlightsCarousel({ highlights, onHighlightPress }: HighlightsCarouselProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsScroll}>
      {highlights.map((highlight) => (
        <TouchableOpacity key={highlight.id} activeOpacity={0.8} onPress={() => onHighlightPress?.(highlight)}>
          <LinearGradient colors={highlight.gradient as any} style={styles.highlightCard}>
            <Ionicons name={highlight.icon as keyof typeof Ionicons.glyphMap} size={22} color="#FFFFFF" />
            <Text style={styles.highlightTitle}>{highlight.title}</Text>
            <Text style={styles.highlightSubtitle}>{highlight.subtitle}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  highlightsScroll: {
    paddingBottom: 6,
  },
  highlightCard: {
    width: 200,
    borderRadius: 22,
    padding: 16,
    marginRight: 12,
  },
  highlightTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  highlightSubtitle: {
    color: '#F8FAFC',
    fontSize: 13,
    marginTop: 4,
  },
});
