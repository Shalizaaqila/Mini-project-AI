import { Colors, Gradients } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWeatherBatch } from '@/hooks/use-weather';
import { searchPlaces, formatSearchResult, type FormattedSearchResult } from '@/services/search';
import gtfsSnapshot from '@/data/gtfs-data.json';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type TransitStop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  routes: string[];
};

const transitData = gtfsSnapshot as { generatedAt?: string; stops?: TransitStop[] };

const featuredDestinations = [
  {
    id: '1',
    title: 'Kuala Lumpur',
    image: require('@/assets/images/kuala-lumpur.jpg'),
    description: 'The vibrant capital, home to the iconic Petronas Towers.',
    categories: ['city', 'culture'],
    tags: ['Iconic Skyline', 'Night Markets'],
    coordinates: { latitude: 3.139, longitude: 101.6869 },
  },
  {
    id: '2',
    title: 'Penang',
    image: require('@/assets/images/penang.jpg'),
    description: 'A cultural melting pot with a historic colonial core.',
    categories: ['culture', 'city'],
    tags: ['UNESCO Core', 'Street Food'],
    coordinates: { latitude: 5.4141, longitude: 100.3288 },
  },
  {
    id: '3',
    title: 'Kedah',
    image: require('@/assets/images/kedah.jpg'),
    description: 'The "Rice Bowl of Malaysia" with vast paddy fields.',
    categories: ['nature', 'culture'],
    tags: ['Paddy Fields', 'Heritage Villages'],
    coordinates: { latitude: 6.121, longitude: 100.369 },
  },
  {
    id: '4',
    title: 'Johor',
    image: require('@/assets/images/johor.jpg'),
    description: 'Southern gateway to Malaysia with theme parks and nature.',
    categories: ['city', 'adventure'],
    tags: ['Family Fun', 'Gateway to Singapore'],
    coordinates: { latitude: 1.4927, longitude: 103.7414 },
  },
  {
    id: '5',
    title: 'Kelantan',
    image: require('@/assets/images/kelantan.jpg'),
    description: 'The "Cradle of Malay Culture" with rich traditions.',
    categories: ['culture', 'nature'],
    tags: ['Traditional Arts', 'Cultural Heritage'],
    coordinates: { latitude: 6.1254, longitude: 102.2386 },
  },
  {
    id: '6',
    title: 'Labuan',
    image: require('@/assets/images/labuan.webp'),
    description: 'An offshore financial centre with duty-free shopping.',
    categories: ['island', 'city'],
    tags: ['Duty Free', 'Marine Life'],
    coordinates: { latitude: 5.2831, longitude: 115.2308 },
  },
  {
    id: '7',
    title: 'Malacca',
    image: require('@/assets/images/malacca.jpg'),
    description: 'A historic state with a blend of cultures.',
    categories: ['culture', 'city'],
    tags: ['UNESCO Street', 'Peranakan Eats'],
    coordinates: { latitude: 2.1896, longitude: 102.2501 },
  },
  {
    id: '8',
    title: 'Negeri Sembilan',
    image: require('@/assets/images/negeri-sembilan.webp'),
    description: 'Known for its Minangkabau culture and architecture.',
    categories: ['culture', 'nature'],
    tags: ['Minangkabau Roofs', 'Highland Escapes'],
    coordinates: { latitude: 2.7297, longitude: 101.9381 },
  },
  {
    id: '9',
    title: 'Pahang',
    image: require('@/assets/images/pahang.webp'),
    description: 'The largest state in Peninsular Malaysia with rainforests.',
    categories: ['nature', 'adventure'],
    tags: ['Taman Negara', 'Cool Highlands'],
    coordinates: { latitude: 3.8077, longitude: 103.326 },
  },
  {
    id: '10',
    title: 'Perak',
    image: require('@/assets/images/perak.jpg'),
    description: 'The "Land of Grace" with colonial architecture and caves.',
    categories: ['culture', 'nature'],
    tags: ['Heritage Towns', 'Limestone Caves'],
    coordinates: { latitude: 4.5975, longitude: 101.0901 },
  },
  {
    id: '11',
    title: 'Perlis',
    image: require('@/assets/images/perlis.jpg'),
    description: 'The smallest state in Malaysia with serene landscapes.',
    categories: ['nature', 'culture'],
    tags: ['Cave Temples', 'Border Town Charm'],
    coordinates: { latitude: 6.4402, longitude: 100.1986 },
  },
  {
    id: '12',
    title: 'Putrajaya',
    image: require('@/assets/images/putrajaya.jpg'),
    description: 'The federal administrative centre with modern architecture.',
    categories: ['city', 'culture'],
    tags: ['Modern Mosques', 'Lakeside Parks'],
    coordinates: { latitude: 2.9264, longitude: 101.6964 },
  },
  {
    id: '13',
    title: 'Sabah',
    image: require('@/assets/images/sabah.jpg'),
    description: 'Home to Mount Kinabalu and diverse marine life.',
    categories: ['adventure', 'nature'],
    tags: ['Mount Kinabalu', 'Island Hopping'],
    coordinates: { latitude: 5.9804, longitude: 116.0735 },
  },
  {
    id: '14',
    title: 'Sarawak',
    image: require('@/assets/images/Sarawak.jpg'),
    description: 'The largest state, known for its rainforests and indigenous cultures.',
    categories: ['nature', 'culture'],
    tags: ['Longhouses', 'Caves & Rivers'],
    coordinates: { latitude: 1.5533, longitude: 110.3592 },
  },
  {
    id: '15',
    title: 'Selangor',
    image: require('@/assets/images/selangor.webp'),
    description: 'The most developed state with modern attractions.',
    categories: ['city', 'culture'],
    tags: ['Batu Caves', 'Shopping Haven'],
    coordinates: { latitude: 3.0738, longitude: 101.5183 },
  },
  {
    id: '16',
    title: 'Terengganu',
    image: require('@/assets/images/terengganu.jpg'),
    description: 'Known for its beautiful islands and traditional crafts.',
    categories: ['island', 'culture'],
    tags: ['Crystal Mosque', 'Azure Islands'],
    coordinates: { latitude: 5.329, longitude: 103.1368 },
  },
];

const discoveryCategories = [
  { id: 'all', label: 'All', icon: 'flag-outline' },
  { id: 'city', label: 'City Lights', icon: 'business-outline' },
  { id: 'culture', label: 'Culture', icon: 'color-palette-outline' },
  { id: 'island', label: 'Islands', icon: 'sunny-outline' },
  { id: 'nature', label: 'Nature', icon: 'leaf-outline' },
  { id: 'adventure', label: 'Adventure', icon: 'compass-outline' },
];

const signatureCollections = [
  {
    title: 'UNESCO Heritage Trail',
    description: 'George Town • Melaka • Kuala Lumpur',
    gradient: Gradients.sunrise,
    icon: 'ribbon-outline',
  },
  {
    title: 'Island Dreaming',
    description: 'Langkawi • Redang • Sipadan',
    gradient: Gradients.ocean,
    icon: 'sunny-outline',
  },
];

function distanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const lon1Rad = toRad(lon1);
  const lon2Rad = toRad(lon2);
  const x = (lon2Rad - lon1Rad) * Math.cos((lat1Rad + lat2Rad) / 2);
  const y = lat2Rad - lat1Rad;
  return Math.sqrt(x * x + y * y) * R;
}

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FormattedSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  // Search functionality with stable keyboard
  useEffect(() => {
    if (searchQuery.length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchQuery.length < 2) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const rawResults = await searchPlaces(searchQuery);
        const formattedResults = rawResults.map(formatSearchResult);
        setSearchResults(formattedResults);
      } catch (error) {
        console.warn('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearchInputChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleSearchResultPress = useCallback((result: FormattedSearchResult) => {
    setSearchQuery('');
    setSearchResults([]);
    router.push({
      pathname: '/map',
      params: {
        lat: result.coordinates.latitude.toString(),
        lon: result.coordinates.longitude.toString(),
        placeName: result.name,
        placeAddress: result.address,
      },
    });
  }, [router]);

  const weatherRequests = useMemo(
    () =>
      featuredDestinations.map((destination) => ({
        id: destination.id,
        latitude: destination.coordinates.latitude,
        longitude: destination.coordinates.longitude,
      })),
    [],
  );

  const { weatherMap } = useWeatherBatch(weatherRequests, true);

  const nearestTransitMap = useMemo(() => {
    const stops = Array.isArray(transitData?.stops) ? (transitData?.stops as TransitStop[]) : [];
    return featuredDestinations.reduce<
      Record<string, { stop: TransitStop; distance: number }[]>
    >((acc, destination) => {
      const sortedStops = stops
        .map((stop) => ({
          stop,
          distance: distanceInKm(
            destination.coordinates.latitude,
            destination.coordinates.longitude,
            stop.lat,
            stop.lon,
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);
      if (sortedStops.length) {
        acc[destination.id] = sortedStops;
      }
      return acc;
    }, {});
  }, []);

  const handleTransitPress = useCallback(
    (stop: TransitStop) => {
      router.push({
        pathname: '/map',
        params: {
          stopId: stop.id,
          stopName: stop.name,
          lat: stop.lat.toString(),
          lon: stop.lon.toString(),
        },
      });
    },
    [router],
  );

  const renderDestination = useCallback(({ item }: { item: any }) => {
    const weather = weatherMap[item.id];
    const transitOptions = nearestTransitMap[item.id];

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.destinationItem, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
      >
        <ImageBackground
          source={item.image}
          style={styles.destinationImage}
          imageStyle={styles.destinationImageRadius}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.65)'] as const}
            style={styles.destinationImageOverlay}
          >
            <Text style={styles.destinationImageTitle}>{item.title}</Text>
          </LinearGradient>
        </ImageBackground>
        <View style={styles.destinationText}>
          <View style={styles.destinationTitleRow}>
            <Text style={[styles.destinationTitle, { color: theme.text }]}>{item.title}</Text>
            {weather && (
              <View style={styles.weatherPill}>
                <Ionicons name="sunny-outline" size={14} color="#FDE68A" />
                <Text style={styles.weatherPillText}>{`${Math.round(weather.temperature)}°C`}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.destinationDescription, { color: theme.mutedText }]}>{item.description}</Text>
          <View style={styles.tagRow}>
            {item.tags.map((tag: string) => (
              <View key={tag} style={[styles.tagChip, { backgroundColor: theme.glass, borderColor: theme.border }]}>
                <Text style={[styles.tagText, { color: theme.text }]}>{tag}</Text>
              </View>
            ))}
          </View>
          {transitOptions && (
            <View style={[styles.transitInfoContainer, { borderColor: theme.border }]}>
              <View style={styles.transitInfoHeader}>
                <View style={[styles.transitIconWrapper, { backgroundColor: theme.glass }]}>
                  <Ionicons name="train-outline" size={16} color={theme.tint} />
                </View>
                <Text style={[styles.transitInfoLabel, { color: theme.mutedText }]}>
                  GTFS Transit Hubs
                </Text>
              </View>
              <View style={styles.transitChipsRow}>
                {transitOptions.map(({ stop, distance }) => (
                  <TouchableOpacity
                    key={`${item.id}-${stop.id}`}
                    style={[styles.transitChip, { borderColor: theme.border, backgroundColor: theme.glass }]}
                    activeOpacity={0.85}
                    onPress={() => handleTransitPress(stop)}
                  >
                    <Text style={[styles.transitChipTitle, { color: theme.text }]} numberOfLines={1}>
                      {stop.name}
                    </Text>
                    <Text style={[styles.transitChipMeta, { color: theme.mutedText }]} numberOfLines={1}>
                      {`${stop.routes.length} routes · ${distance.toFixed(1)} km`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [weatherMap, theme, nearestTransitMap, handleTransitPress]);

  const visibleSearchResults = useMemo(() => {
    if (selectedCategory === 'all') {
      return searchResults;
    }
    return searchResults.filter((result) => result.categories.includes(selectedCategory));
  }, [searchResults, selectedCategory]);

  const listHeaderComponent = useMemo(() => (
    <>
      <View style={styles.heroWrapper}>
        <LinearGradient colors={Gradients.sunrise} style={styles.heroCard}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroEyebrow}>Malaysia Awaits</Text>
            <Text style={styles.heroTitle}>Discover new journeys</Text>
            <Text style={styles.heroSubtitle}>
              From UNESCO towns to emerald islands and rainforest retreats.
            </Text>
            <TouchableOpacity activeOpacity={0.85} style={styles.heroButton}>
              <LinearGradient colors={Gradients.dusk} style={styles.heroButtonGradient}>
                <Text style={styles.heroButtonText}>View Map</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Image source={require('@/assets/images/sabah.jpg')} style={styles.heroImage} />
        </LinearGradient>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Search Malaysia</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.mutedText }]}>Find inspiration by city, theme, or vibe</Text>
      </View>
      <View>
        <View style={[styles.searchBar, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
          <Ionicons name="search" size={18} color={theme.mutedText} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Where to next?"
            placeholderTextColor={theme.mutedText}
            value={searchQuery}
            onChangeText={handleSearchInputChange}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="search"
            showSoftInputOnFocus={true}
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {isSearching ? (
            <Ionicons name="reload" size={20} color={theme.tint} />
          ) : (
            <Ionicons name="options-outline" size={20} color={theme.tint} />
          )}
        </View>
        <View style={[styles.searchResultsContainer, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
          {visibleSearchResults.length === 0 ? (
            <View style={styles.emptySearchState}>
              <Ionicons name="information-circle-outline" size={16} color={theme.mutedText} />
              <Text style={[styles.emptySearchText, { color: theme.mutedText }]}>
                {searchQuery.length > 1
                  ? 'No matches for this filter yet'
                  : 'Start typing to explore destinations'}
              </Text>
            </View>
          ) : (
            visibleSearchResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.searchResultItem}
                onPress={() => handleSearchResultPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.searchResultLeft}>
                  <Ionicons name="location-outline" size={16} color={theme.tint} />
                  <View style={styles.searchResultText}>
                    <Text style={[styles.searchResultTitle, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.searchResultAddress, { color: theme.mutedText }]} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.mutedText} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
        {discoveryCategories.map((category) => {
          const isActive = selectedCategory === category.id;
          return (
            <TouchableOpacity key={category.id} onPress={() => setSelectedCategory(category.id)} activeOpacity={0.8}>
              <LinearGradient
                colors={isActive ? Gradients.rainforest : (['#E2E8F0', '#E2E8F0'] as const)}
                style={[styles.categoryChip, isActive ? styles.categoryChipActive : null]}
              >
                <Ionicons
                  name={category.icon as any}
                  size={16}
                  color={isActive ? '#FFFFFF' : '#475569'}
                />
                <Text style={[styles.categoryLabel, { color: isActive ? '#FFFFFF' : '#475569' }]}>{category.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Signature Collections</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.mutedText }]}>Curated sets for every kind of traveler</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionsScroll}>
        {signatureCollections.map((collection) => (
          <LinearGradient key={collection.title} colors={collection.gradient} style={styles.collectionCard}>
            <Ionicons name={collection.icon as any} size={22} color="#FFFFFF" />
            <Text style={styles.collectionTitle}>{collection.title}</Text>
            <Text style={styles.collectionSubtitle}>{collection.description}</Text>
          </LinearGradient>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Featured States & Territories</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.mutedText }]}>
          Handpicked highlights tailored to your mood
        </Text>
      </View>
    </>
  ), [theme, searchQuery, visibleSearchResults, isSearching, selectedCategory, handleSearchInputChange, handleSearchResultPress, setSelectedCategory]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <FlatList
        data={featuredDestinations}
        renderItem={renderDestination}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeaderComponent}
        ListFooterComponent={<View style={{ height: 60 }} />}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        removeClippedSubviews={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  heroWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  heroEyebrow: {
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 13,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 6,
  },
  heroSubtitle: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 15,
    opacity: 0.9,
  },
  heroButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  heroButtonGradient: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroImage: {
    width: 110,
    height: 130,
    borderRadius: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 10,
  },
  searchResultsContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchResultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchResultText: {
    marginLeft: 12,
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  searchResultAddress: {
    fontSize: 14,
  },
  emptySearchState: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    marginLeft: 8,
  },
  transitInfoContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginTop: 14,
    gap: 10,
  },
  transitInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transitIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transitInfoLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  transitChipsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  transitChip: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  transitChipTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  transitChipMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 999,
    marginRight: 10,
  },
  categoryChipActive: {
    shadowColor: '#00000025',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
  },
  categoryLabel: {
    marginLeft: 6,
    fontWeight: '600',
  },
  collectionsScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  collectionCard: {
    width: 220,
    padding: 18,
    marginRight: 12,
    borderRadius: 24,
  },
  collectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  collectionSubtitle: {
    color: '#F8FAFC',
    marginTop: 6,
    fontSize: 14,
  },
  destinationItem: {
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  destinationImage: {
    height: 200,
  },
  destinationImageRadius: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  destinationImageOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  destinationImageTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  destinationText: {
    padding: 16,
  },
  destinationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  destinationTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  destinationDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  weatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(253, 230, 138, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  weatherPillText: {
    color: '#FDE68A',
    fontWeight: '700',
    fontSize: 13,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
