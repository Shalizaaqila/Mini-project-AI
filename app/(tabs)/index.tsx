import { Colors, Gradients, GradientStops } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWeatherBatch } from '@/hooks/use-weather';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type IconName = keyof typeof Ionicons.glyphMap;

type Story = {
  id: string;
  title: string;
  image: any;
  description: string;
  tagline: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

type QuickEscape = {
  title: string;
  description: string;
  icon: IconName;
  gradient: GradientStops;
};

type JourneyCard = {
  title: string;
  description: string;
  icon: IconName;
  highlights: string[];
};

const HERO_DESTINATION = {
  id: 'hero-kl',
  latitude: 3.139,
  longitude: 101.6869,
};

const heroStats: { label: string; value: string; icon: IconName }[] = [
  { label: 'States & Territories', value: '16', icon: 'navigate-outline' },
  { label: 'Tropical Islands', value: '800+', icon: 'planet-outline' },
  { label: 'Flavors to Taste', value: '∞', icon: 'restaurant-outline' },
];

const stories: Story[] = [
  {
    id: 'diversity',
    title: 'A Land of Diversity',
    image: require('@/assets/images/diversity.webp'),
    description:
      `Malaysia is a multicultural country with a rich tapestry of traditions, languages, and cuisines. Its population is a vibrant mix of Malays, Chinese, Indians, and indigenous groups, all living together in harmony. This diversity is reflected in the country's festivals, art, and daily life, making it a truly unique destination.`,
    tagline: 'Festivals, heritage quarters, vibrant street life.',
    coordinates: { latitude: 3.139, longitude: 101.6869 },
  },
  {
    id: 'history',
    title: 'A Journey Through History',
    image: require('@/assets/images/history.jpg'),
    description:
      `From the ancient kingdoms of the Malay Peninsula to the colonial era and the road to independence, Malaysia has a fascinating history. Explore the historic cities of Malacca and George Town, both UNESCO World Heritage Sites, to witness the influence of centuries of trade and cultural exchange.`,
    tagline: 'Wander UNESCO streets & storied forts.',
    coordinates: { latitude: 2.1896, longitude: 102.2501 },
  },
  {
    id: 'culinary',
    title: 'A Culinary Paradise',
    image: require('@/assets/images/food.jpg'),
    description:
      `Malaysian food is a delicious fusion of Malay, Chinese, and Indian flavors. From the spicy and aromatic Nasi Lemak to the sweet mooncake and buttery roti canai, there is something to tantalize every taste bud. Don't miss the chance to explore the bustling street food stalls and night markets for an authentic culinary experience.`,
    tagline: 'Night markets, kopi breaks, and hawker feasts.',
    coordinates: { latitude: 5.4141, longitude: 100.3288 },
  },
];

const quickEscapes: QuickEscape[] = [
  {
    title: 'Island Hopping',
    description: 'Langkawi • Redang • Tioman',
    icon: 'water-outline',
    gradient: Gradients.ocean,
  },
  {
    title: 'Rainforest Retreats',
    description: 'Borneo • Taman Negara',
    icon: 'leaf-outline',
    gradient: Gradients.rainforest,
  },
  {
    title: 'City Weekends',
    description: 'KL • Penang • Johor',
    icon: 'business-outline',
    gradient: Gradients.dusk,
  },
];

const curatedJourneys: JourneyCard[] = [
  {
    title: 'Cultural Capitals',
    description: 'Heritage walks, art murals, and Baba-Nyonya bites.',
    icon: 'color-palette-outline',
    highlights: ['George Town', 'Melaka'],
  },
  {
    title: 'Marine Wonders',
    description: 'Dive with turtles amidst turquoise water.',
    icon: 'compass-outline',
    highlights: ['Sipadan', 'Perhentian'],
  },
  {
    title: 'Mountain Escapes',
    description: 'Tea valleys and sunrise summits.',
    icon: 'walk-outline',
    highlights: ['Cameron Highlands', 'Kinabalu'],
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedContent, setSelectedContent] = useState({ title: '', description: '' });
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string>('Your Location');

  const handleImagePress = (title: string, description: string) => {
    setSelectedContent({ title, description });
    setModalVisible(true);
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }

      try {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);

        // Get city name from coordinates
        const geocode = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        if (geocode.length > 0) {
          const address = geocode[0];
          const city = address.city || address.region || address.country || 'Your Location';
          setCityName(city);
        }
      } catch (error) {
        setLocationError('Unable to fetch location');
        setCityName('Your Location');
      }
    })();
  }, []);

  const currentLocationRequest = useMemo(() => {
    if (!location) return HERO_DESTINATION; // Fallback to KL if no location
    return {
      id: 'current-location',
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }, [location]);

  const weatherRequests = useMemo(
    () => [
      currentLocationRequest,
      ...stories.map((story) => ({ id: story.id, ...story.coordinates })),
    ],
    [currentLocationRequest],
  );
  const { weatherMap } = useWeatherBatch(weatherRequests, true);
  const heroWeather = weatherMap[currentLocationRequest.id];

  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.heroWrapper}>
          <LinearGradient colors={Gradients.sunrise} style={styles.heroCard}>
            <View style={styles.heroText}>
              <Text style={styles.heroEyebrow}>Visit Malaysia 2025</Text>
              <Text style={styles.heroTitle}>Experience Malaysia</Text>
              <Text style={styles.heroSubtitle}>
                Coastal sunsets, rainforest adventures, and vibrant cities await.
              </Text>
              <TouchableOpacity
                style={styles.heroButton}
                activeOpacity={0.85}
                onPress={() => router.push('/itinerary')}
              >
                <LinearGradient colors={Gradients.rainforest} style={styles.heroButtonGradient}>
                  <Text style={styles.heroButtonText}>Plan Your Journey</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={styles.heroWeatherRow}>
                <Ionicons name="sunny-outline" size={16} color="#FFFFFF" />
                <Text style={styles.heroWeatherText}>
                  {heroWeather
                    ? `${Math.round(heroWeather.temperature)}°C • ${cityName}`
                    : `Fetching ${cityName} weather...`}
                </Text>
              </View>
            </View>
            <Image source={require('@/assets/images/kuala-lumpur.jpg')} style={styles.heroImage} />
          </LinearGradient>
          <View style={styles.statRow}>
            {heroStats.map((stat) => (
              <View
                key={stat.label}
                style={[styles.statCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
              >
                <Ionicons name={stat.icon} size={20} color={theme.tint} />
                <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.mutedText }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Escapes</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.mutedText }]}>Tap to unlock curated inspiration</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
          {quickEscapes.map((escape) => (
            <TouchableOpacity key={escape.title} activeOpacity={0.85}>
              <LinearGradient colors={escape.gradient} style={styles.quickCard}>
                <Ionicons name={escape.icon} size={26} color="#FFFFFF" />
                <Text style={styles.quickCardTitle}>{escape.title}</Text>
                <Text style={styles.quickCardText}>{escape.description}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Cultural Stories</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.mutedText }]}>Tap a card to read more</Text>
        </View>
        <View style={styles.contentContainer}>
          {stories.map((section) => (
            <TouchableOpacity
              key={section.id}
              activeOpacity={0.9}
              onPress={() => handleImagePress(section.title, section.description)}
              style={[styles.section, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
            >
              <ImageBackground
                source={section.image}
                style={styles.sectionImage}
                imageStyle={styles.sectionImageRadius}
              >
                <LinearGradient
                  colors={['rgba(15,23,42,0.1)', 'rgba(15,23,42,0.8)'] as const}
                  style={styles.sectionOverlay}
                >
                  <Text style={styles.sectionImageTagline}>{section.tagline}</Text>
                  <Text style={styles.sectionImageTitle}>{section.title}</Text>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Curated Journeys</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.mutedText }]}>Blend culture, cuisine, and nature</Text>
        </View>
        <View style={styles.curatedGrid}>
          {curatedJourneys.map((journey) => (
            <View
              key={journey.title}
              style={[styles.curatedCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
            >
              <Ionicons name={journey.icon} size={22} color={theme.tint} />
              <Text style={[styles.curatedTitle, { color: theme.text }]}>{journey.title}</Text>
              <Text style={[styles.curatedDescription, { color: theme.mutedText }]}>
                {journey.description}
              </Text>
              <View style={styles.chipRow}>
              {journey.highlights.map((highlight) => (
                <View
                  key={highlight}
                  style={[styles.chip, { backgroundColor: theme.glass, borderColor: theme.border }]}
                  >
                    <Text style={[styles.chipText, { color: theme.text }]}>{highlight}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={styles.centeredView}>
          <View
            style={[
              styles.modalView,
              { backgroundColor: theme.glass, borderColor: theme.border, shadowColor: theme.shadow },
            ]}
          >
            <LinearGradient colors={Gradients.dusk} style={styles.modalGradient}>
              <Text style={styles.modalTitle}>{selectedContent.title}</Text>
            </LinearGradient>
            <Text style={[styles.modalText, { color: theme.text }]}>{selectedContent.description}</Text>
            <TouchableOpacity style={styles.button} onPress={() => setModalVisible(!modalVisible)}>
              <LinearGradient colors={Gradients.ocean} style={styles.modalButtonGradient}>
                <Text style={styles.textStyle}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  heroWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
    marginRight: 16,
  },
  heroEyebrow: {
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
    opacity: 0.9,
  },
  heroButton: {
    marginTop: 18,
    alignSelf: 'flex-start',
  },
  heroButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroWeatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  heroWeatherText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  heroImage: {
    width: 120,
    height: 140,
    borderRadius: 24,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    marginHorizontal: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  quickScroll: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  quickCard: {
    width: 180,
    padding: 18,
    marginRight: 12,
    borderRadius: 24,
    shadowColor: '#00000030',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  quickCardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  quickCardText: {
    color: '#F8FAFC',
    marginTop: 4,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionImage: {
    height: 200,
  },
  sectionImageRadius: {
    borderRadius: 20,
  },
  sectionOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
    borderRadius: 20,
  },
  sectionImageTagline: {
    color: '#E2E8F0',
    fontSize: 13,
    marginBottom: 4,
  },
  sectionWeatherText: {
    color: '#E2E8F0',
    fontSize: 12,
    marginBottom: 6,
  },
  sectionImageTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  curatedGrid: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 20,
  },
  curatedCard: {
    borderRadius: 20,
    padding: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  curatedTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  curatedDescription: {
    fontSize: 14,
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    borderRadius: 28,
    padding: 0,
    alignItems: 'stretch',
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 7,
  },
  modalGradient: {
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalText: {
    textAlign: 'left',
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  button: {
    borderRadius: 24,
    margin: 20,
  },
  modalButtonGradient: {
    paddingVertical: 12,
    borderRadius: 24,
  },
  textStyle: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF',
  },
});