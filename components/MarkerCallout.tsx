import React from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Gradients } from '@/constants/theme';
import { Place } from '@/services/agent';

interface TransitStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  routes: string[];
}

interface MarkerCalloutProps {
  activeStop: TransitStop | undefined;
  activePlace?: Place;
  gtfsUpdatedLabel: string;
  distanceToActiveStop: number | null;
  distanceToActivePlace?: number | null;
  onClose: () => void;
  onLocate: () => void;
  onNavigate: () => void;
}

export default function MarkerCallout({
  activeStop,
  activePlace,
  gtfsUpdatedLabel,
  distanceToActiveStop,
  distanceToActivePlace,
  onClose,
  onLocate,
  onNavigate,
}: MarkerCalloutProps) {
  if (activePlace) {
    return (
      <View style={styles.overlay}>
        <LinearGradient colors={Gradients.dusk} style={styles.callout}>
          <View style={styles.header}>
            <View>
              <Text style={styles.label}>Suggestion Place</Text>
              <Text style={styles.title}>{activePlace.name}</Text>
              {distanceToActivePlace != null && (
                <Text style={styles.meta}>{distanceToActivePlace.toFixed(1)} km from you</Text>
              )}
              <Text style={styles.meta}>{activePlace.description}</Text>
            </View>
          </View>
          {activePlace.image_url ? (
            <Image source={{ uri: activePlace.image_url }} style={styles.placeImage} />
          ) : null}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => Linking.openURL(activePlace.maps_url)}>
              <Ionicons name="navigate" size={16} color="#111827" />
              <Text style={styles.primaryText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.closeRow}>
            <TouchableOpacity style={[styles.button, styles.closeButtonBottom]} onPress={onClose}>
              <Ionicons name="close" size={16} color="#FFFFFF" />
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }
  if (!activeStop) return null;

  return (
    <View style={styles.overlay}>
      <LinearGradient colors={Gradients.sunrise} style={styles.callout}>
        <View style={styles.header}>
          <View>
            <Text style={styles.label}>GTFS Updated {gtfsUpdatedLabel}</Text>
            <Text style={styles.title}>{activeStop.name}</Text>
            {distanceToActiveStop !== null && (
              <Text style={styles.meta}>{distanceToActiveStop.toFixed(1)} km from you</Text>
            )}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.routeRow}>
          {(activeStop.routes.length ? activeStop.routes : ['Explore more routes']).slice(0, 3).map((route) => (
            <View key={`${activeStop.id}-${route}`} style={styles.routeChip}>
              <Text style={styles.routeText}>{route}</Text>
            </View>
          ))}
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onLocate}>
            <Ionicons name="locate-outline" size={16} color="#FFFFFF" />
            <Text style={styles.secondaryText}>My location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onNavigate}>
            <Ionicons name="navigate" size={16} color="#111827" />
            <Text style={styles.primaryText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 120, // Below location card
    left: 20,
    right: 20,
    zIndex: 10,
  },
  callout: {
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#FDE68A',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  meta: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.85,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  routeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#FFFFFFAA',
    backgroundColor: 'transparent',
  },
  secondaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
  },
  primaryText: {
    color: '#111827',
    fontWeight: '700',
  },
  placeImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginVertical: 8,
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  closeButtonBottom: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFFAA',
    paddingHorizontal: 24,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
