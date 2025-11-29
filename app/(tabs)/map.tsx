import { Colors, Gradients } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import gtfsSnapshot from '@/data/gtfs-data.json';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HighlightsCarousel from '@/components/HighlightsCarousel';
import FloatingActionButton from '@/components/FloatingActionButton';
import MarkerCallout from '@/components/MarkerCallout';
import { Place, fetchNearbyPlaces } from '@/services/agent';

type TransitStop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  routes: string[];
};

type TransitDataset = {
  generatedAt: string;
  stops: TransitStop[];
};

const transitData = gtfsSnapshot as TransitDataset;

const quickActions = [
  { id: 'food', title: 'Food Trails', icon: 'fast-food-outline', gradient: Gradients.sunrise },
  { id: 'attractions', title: 'Attractions', icon: 'star-outline', gradient: Gradients.dusk },
  { id: 'nature', title: 'Nature Spots', icon: 'leaf-outline', gradient: Gradients.rainforest },
];

const suggestionHighlights = [
  {
    id: '1',
    title: 'Jalan Alor Street Food',
    subtitle: 'Kuala Lumpur • 1.2 km',
    icon: 'restaurant-outline',
    gradient: Gradients.sunrise,
    category: 'food',
  },
  {
    id: '2',
    title: 'Batu Caves Morning Hike',
    subtitle: 'Selangor • 9 km',
    icon: 'flashlight-outline',
    gradient: Gradients.dusk,
    category: 'nature',
  },
  {
    id: '3',
    title: 'KLCC Park Sunset',
    subtitle: 'Kuala Lumpur • 0.8 km',
    icon: 'partly-sunny-outline',
    gradient: Gradients.ocean,
    category: 'attractions',
  },
];

export default function MapScreen() {
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState('food');
  const params = useLocalSearchParams<{
    stopId?: string;
    stopName?: string;
    lat?: string;
    lon?: string;
    placeName?: string;
    placeAddress?: string;
  }>();
  const [selectedStopId, setSelectedStopId] = useState<string | null>(
    typeof params.stopId === 'string' ? params.stopId : null,
  );
  const [manualRegion, setManualRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const insets = useSafeAreaInsets();
  const [paramStopCleared, setParamStopCleared] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [preloadedPlaces, setPreloadedPlaces] = useState<Record<string, Place[] | null>>({});

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  const gtfsUpdatedLabel = useMemo(() => {
    const parsedDate = Date.parse(transitData.generatedAt);
    if (Number.isNaN(parsedDate)) {
      return 'live GTFS feed';
    }
    return new Intl.DateTimeFormat('en-MY', { month: 'short', day: 'numeric' }).format(parsedDate);
  }, []);

  const stopsIndex = useMemo(() => {
    const map = new Map<string, TransitStop>();
    transitData.stops.forEach((stop) => map.set(stop.id, stop));
    return map;
  }, []);

  const priorityStops = useMemo(() => {
    return [...transitData.stops]
      .sort((a, b) => b.routes.length - a.routes.length)
      .slice(0, 80);
  }, []);

  const paramLat = typeof params.lat === 'string' ? Number(params.lat) : undefined;
  const paramLon = typeof params.lon === 'string' ? Number(params.lon) : undefined;
  const paramPlaceName = typeof params.placeName === 'string' ? params.placeName : undefined;
  const paramPlaceAddress = typeof params.placeAddress === 'string' ? params.placeAddress : undefined;
  const hasPlaceParams = paramLat !== undefined && paramLon !== undefined && !!paramPlaceName;
  const selectedStop = selectedStopId ? stopsIndex.get(selectedStopId) : undefined;
  const fallbackFocus =
    paramLat !== undefined && paramLon !== undefined && !paramStopCleared && !hasPlaceParams
      ? {
          id: typeof params.stopId === 'string' ? params.stopId : 'focused-stop',
          name:
            typeof params.stopName === 'string' ? params.stopName : 'Highlighted stop from Explore',
          lat: paramLat,
          lon: paramLon,
          routes: [],
        }
      : undefined;
  const activeStop = selectedStop ?? fallbackFocus;

  const markerStops = useMemo(() => {
    const map = new Map<string, TransitStop>();
    priorityStops.forEach((stop) => map.set(stop.id, stop));
    if (activeStop && !map.has(activeStop.id)) {
      map.set(activeStop.id, activeStop);
    }
    return Array.from(map.values());
  }, [priorityStops, activeStop]);

  const region = useMemo<Region>(() => {
    if (manualRegion) {
      return manualRegion;
    }
    if (activeStop) {
      return {
        latitude: activeStop.lat,
        longitude: activeStop.lon,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
    }
    if (location) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.04,
      };
    }
    return {
      latitude: 4.2105,
      longitude: 101.9758,
      latitudeDelta: 10,
      longitudeDelta: 10,
    };
  }, [manualRegion, activeStop, location]);

  const distanceToActiveStop = useMemo(() => {
    if (!activeStop || !location) return null;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(activeStop.lat - location.coords.latitude);
    const dLon = toRad(activeStop.lon - location.coords.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(location.coords.latitude)) *
        Math.cos(toRad(activeStop.lat)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [activeStop, location]);

  const distanceToActivePlace = useMemo(() => {
    if (!selectedPlace || !location) return null;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(selectedPlace.lat - location.coords.latitude);
    const dLon = toRad(selectedPlace.lng - location.coords.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(location.coords.latitude)) *
        Math.cos(toRad(selectedPlace.lat)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [selectedPlace, location]);

  const filteredHighlights = useMemo(() => {
    return suggestionHighlights.filter(highlight => highlight.category === activeAction);
  }, [activeAction]);

  const getPlaceIcon = (category: string) => {
    switch (category) {
      case 'food': return 'restaurant-outline';
      case 'attractions': return 'star-outline';
      case 'nature': return 'leaf-outline';
      default: return 'location-outline';
    }
  };

  const getPlaceMarkerStyle = (category: string, is_verified: boolean) => {
    let color = '';
    switch (category) {
      case 'food': color = '#FF6B6B'; break;
      case 'attractions': color = '#4ECDC4'; break;
      case 'nature': color = '#45B7D1'; break;
      default: color = '#FFA07A'; break;
    }
    // If unverified, make it gray
    if (!is_verified) {
      color = '#A0A0A0'; // Gray for unverified
    }
    return { backgroundColor: color };
  };

  const placesHighlights = places.map((place, index) => ({
    id: `place-${index}`,
    title: place.name,
    subtitle: place.description,
    icon: getPlaceIcon(activeAction),
    gradient: quickActions.find(a => a.id === activeAction)?.gradient || Gradients.sunrise,
    category: activeAction,
  }));

  const onHighlightPress = (highlight: { id: string }) => {
    const parts = highlight.id.split('-');
    if (parts[0] === 'place') {
      const index = Number(parts[1]);
      if (places[index]) {
        setSelectedPlace(places[index]);
        setSelectedStopId(null);
        const region = {
          latitude: places[index].lat,
          longitude: places[index].lng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        };
        setManualRegion(region);
        mapRef.current?.animateToRegion(region, 400);
      }
    }
  };

  useEffect(() => {
    if (typeof params.stopId === 'string') {
      setParamStopCleared(false);
      setSelectedStopId(params.stopId);
      if (paramLat !== undefined && paramLon !== undefined) {
        setManualRegion({
          latitude: paramLat,
          longitude: paramLon,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        });
      }
    }
  }, [params.stopId, paramLat, paramLon]);

  useEffect(() => {
    if (!hasPlaceParams || paramLat === undefined || paramLon === undefined || !paramPlaceName) {
      return;
    }
    const customPlace: Place = {
      name: paramPlaceName,
      description: paramPlaceAddress ?? 'Selected destination',
      lat: paramLat,
      lng: paramLon,
      image_url: '',
      maps_url: `https://www.google.com/maps/search/?api=1&query=${paramLat},${paramLon}`,
      is_verified: true,
    };
    setSelectedPlace(customPlace);
    setSelectedStopId(null);
    const nextRegion = {
      latitude: paramLat,
      longitude: paramLon,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    };
    setManualRegion(nextRegion);
    mapRef.current?.animateToRegion(nextRegion, 400);
  }, [hasPlaceParams, paramLat, paramLon, paramPlaceName, paramPlaceAddress]);

  const preloadNext = async () => {
    if (!location) return;
    const order = ['food', 'attractions', 'nature'];
    const currentIndex = order.indexOf(activeAction);
    const nextIndex = currentIndex + 1;
    if (nextIndex <= 2 && !preloadedPlaces[order[nextIndex]]) {
      try {
        const preloaded = await fetchNearbyPlaces(order[nextIndex], location.coords.latitude, location.coords.longitude);
        setPreloadedPlaces(prev => ({...prev, [order[nextIndex]]: preloaded}));
      } catch (error) {
        // Optionally set to empty array or ignore
      }
    }
  };

  useEffect(() => {
    if (!location) return;

    // Check if already preloaded
    if (preloadedPlaces[activeAction]) {
      setPlaces(preloadedPlaces[activeAction]);
      setPlacesLoading(false);
      setPlacesError(null);
      preloadNext();
      return;
    }

    const fetchPlaces = async () => {
      setPlacesLoading(true);
      setPlacesError(null);
      try {
        const fetchedPlaces = await fetchNearbyPlaces(activeAction, location.coords.latitude, location.coords.longitude);
        setPlaces(fetchedPlaces);
        setPreloadedPlaces(prev => ({...prev, [activeAction]: fetchedPlaces}));
      } catch (err) {
        setPlacesError('Failed to fetch places');
        setPlaces([]);
      } finally {
        setPlacesLoading(false);
      }
    };
    fetchPlaces().then(() => {
      preloadNext();
    });
  }, [activeAction, location]);



  const handleLocate = async () => {
    try {
      const currentLocation = location ?? (await Location.getCurrentPositionAsync({}));
      if (!location) {
        setLocation(currentLocation);
      }
      const targetRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.04,
      };
      setManualRegion(targetRegion);
      mapRef.current?.animateToRegion(targetRegion, 400);
      setSelectedStopId(null);
      setSelectedPlace(null);
    } catch (err) {
      console.warn('Unable to center on location', err);
      setErrorMsg('Unable to fetch your current location.');
    }
  };

  const handleNavigateExternally = () => {
    if (!activeStop) return;
    const label = encodeURIComponent(activeStop.name);
    const lat = activeStop.lat;
    const lon = activeStop.lon;
    const appleUrl = `http://maps.apple.com/?daddr=${lat},${lon}&q=${label}`;
    const androidUrl = `geo:0,0?q=${lat},${lon}(${label})`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${label}`;
    const url = Platform.select({ ios: appleUrl, android: androidUrl, default: webUrl });
    if (url) {
      Linking.openURL(url).catch(() => Linking.openURL(webUrl));
    }
  };

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        region={region}
        showsUserLocation
      >
        {markerStops.map((stop) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.lat, longitude: stop.lon }}
            title={stop.name}
            tracksViewChanges={false}
            onPress={() => {
              if (selectedStopId === stop.id) {
                setSelectedStopId(null);
                if (location) {
                  const locRegion = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.08,
                    longitudeDelta: 0.04,
                  };
                  setManualRegion(locRegion);
                  mapRef.current?.animateToRegion(locRegion, 300);
                }
                return;
              }
              setSelectedStopId(stop.id);
              const nextRegion = {
                latitude: stop.lat,
                longitude: stop.lon,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              };
              setManualRegion(nextRegion);
              mapRef.current?.animateToRegion(nextRegion, 400);
            }}
          >
            <View
              style={[
                styles.busMarker,
                activeStop?.id === stop.id ? styles.busMarkerActive : styles.busMarkerInactive,
              ]}
            >
              <Ionicons
                name="bus"
                size={14}
                color={activeStop?.id === stop.id ? '#FFFFFF' : theme.tint}
              />
            </View>
          </Marker>
        ))}
        {places.map((place) => (
          <Marker
            key={`place-${place.name}-${place.lat}-${place.lng}`}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            onPress={() => {
              setSelectedPlace(place);
              setSelectedStopId(null);
              const region = {
                latitude: place.lat,
                longitude: place.lng,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              };
              setManualRegion(region);
              mapRef.current?.animateToRegion(region, 400);
            }}
          >
            <View
              style={[
                styles.placeMarker,
                getPlaceMarkerStyle(activeAction, place.is_verified),
              ]}
            >
              <Ionicons
                name={getPlaceIcon(activeAction)}
                size={16}
                color="#FFFFFF"
              />
            </View>
          </Marker>
        ))}
        {selectedPlace && !places.some((place) => place.lat === selectedPlace.lat && place.lng === selectedPlace.lng && place.name === selectedPlace.name) && (
          <Marker
            key="custom-selected-place"
            coordinate={{ latitude: selectedPlace.lat, longitude: selectedPlace.lng }}
            onPress={() => {
              const region = {
                latitude: selectedPlace.lat,
                longitude: selectedPlace.lng,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              };
              setManualRegion(region);
              mapRef.current?.animateToRegion(region, 400);
            }}
          >
            <View style={[styles.placeMarker, styles.customPlaceMarker]}>
              <Ionicons name="location-outline" size={16} color="#FFFFFF" />
            </View>
          </Marker>
        )}
      </MapView>

      <View style={[styles.overlayContainer, { paddingTop: insets.top + 12 }]} pointerEvents="box-none">
        <View style={[styles.locationCard, { backgroundColor: theme.glass, borderColor: theme.border }]}>
          <View style={styles.locationTextBlock}>
            <Text style={[styles.locationLabel, { color: theme.mutedText }]}>Currently exploring</Text>
            <Text style={[styles.locationTitle, { color: theme.text }]}>
              {location ? 'Live GPS' : 'Peninsular & Borneo' }
            </Text>
            <Text style={[styles.locationSubtitle, { color: theme.mutedText }]}>
              {location ? 'Showing Malaysia highlights' : 'Showing Malaysia highlights while we find you'}
            </Text>
            {placesLoading && <Text style={[styles.locationSubtitle, { color: theme.mutedText }]}>Loading places...</Text>}
            {placesError && <Text style={[styles.locationSubtitle, { color: 'red' }]}>{placesError}</Text>}
          </View>
          <TouchableOpacity style={styles.locateButton} activeOpacity={0.8} onPress={handleLocate}>
            <Ionicons name="locate-outline" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
        <HighlightsCarousel highlights={placesHighlights} onHighlightPress={onHighlightPress} />
      </View>

      <MarkerCallout
        activeStop={activeStop}
        activePlace={selectedPlace ?? undefined}
        gtfsUpdatedLabel={gtfsUpdatedLabel}
        distanceToActiveStop={distanceToActiveStop}
        distanceToActivePlace={distanceToActivePlace}
        onClose={() => { setSelectedStopId(null); setSelectedPlace(null); setParamStopCleared(true); }}
        onLocate={handleLocate}
        onNavigate={handleNavigateExternally}
      />

      <FloatingActionButton activeAction={activeAction} onActionPress={setActiveAction} />

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    gap: 12,
  },
  locationCard: {
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 0,
    shadowColor: '#00000010',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  locationTextBlock: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  locationSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  locateButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionWrapper: {
    flexGrow: 1,
    minWidth: 100,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 18,
    paddingVertical: 8,
  },
  quickActionActive: {
    shadowColor: '#00000020',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    maxHeight: '72%',
  },
  sheetContent: {
    paddingBottom: 24,
    gap: 16,
  },
  placeholderCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.1)',
    padding: 18,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  placeholderSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  sheetHandleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetHandle: {
    width: 50,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sheetSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  highlightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hideHighlightsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.12)',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  highlightsScroll: {
    paddingBottom: 6,
  },
  busMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  busMarkerActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  busMarkerInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  placeMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  customPlaceMarker: {
    backgroundColor: '#2563EB',
  },
  activeStopGradient: {
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  activeStopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  activeStopLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#FDE68A',
  },
  activeStopTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    color: '#FFFFFF',
  },
  activeStopMeta: {
    fontSize: 13,
    marginTop: 4,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  clearSelectionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  routeChipRow: {
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
  routeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sheetActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  navigateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  navigateButtonText: {
    color: '#111827',
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  infoSubtitle: {
    fontSize: 13,
  },
  errorText: {
    marginTop: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
});
