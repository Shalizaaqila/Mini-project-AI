
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

const featuredDestinations = [
  {
    id: '1',
    title: 'Kuala Lumpur',
    image: require('@/assets/images/kuala-lumpur.jpg'),
    description: 'The vibrant capital, home to the iconic Petronas Towers.'
  },
  {
    id: '2',
    title: 'Penang',
    image: require('@/assets/images/penang.jpg'),
    description: 'A cultural melting pot with a historic colonial core.'
  },
  {
    id: '3',
    title: 'Kedah',
    image: require('@/assets/images/kedah.jpg'),
    description: 'The "Rice Bowl of Malaysia" with vast paddy fields.'
  },
  {
    id: '4',
    title: 'Johor',
    image: require('@/assets/images/johor.jpg'),
    description: 'Southern gateway to Malaysia with theme parks and nature.'
  },
  {
    id: '5',
    title: 'Kelantan',
    image: require('@/assets/images/kelantan.jpg'),
    description: 'The "Cradle of Malay Culture" with rich traditions.'
  },
  {
    id: '6',
    title: 'Labuan',
    image: require('@/assets/images/labuan.webp'),
    description: 'An offshore financial centre with duty-free shopping.'
  },
  {
    id: '7',
    title: 'Malacca',
    image: require('@/assets/images/malacca.jpg'),
    description: 'A historic state with a blend of cultures.'
  },
  {
    id: '8',
    title: 'Negeri Sembilan',
    image: require('@/assets/images/negeri-sembilan.webp'),
    description: 'Known for its Minangkabau culture and architecture.'
  },
  {
    id: '9',
    title: 'Pahang',
    image: require('@/assets/images/pahang.webp'),
    description: 'The largest state in Peninsular Malaysia with rainforests.'
  },
  {
    id: '10',
    title: 'Perak',
    image: require('@/assets/images/perak.jpg'),
    description: 'The "Land of Grace" with colonial architecture and caves.'
  },
  {
    id: '11',
    title: 'Perlis',
    image: require('@/assets/images/perlis.jpg'),
    description: 'The smallest state in Malaysia with serene landscapes.'
  },
  {
    id: '12',
    title: 'Putrajaya',
    image: require('@/assets/images/putrajaya.jpg'),
    description: 'The federal administrative centre with modern architecture.'
  },
  {
    id: '13',
    title: 'Sabah',
    image: require('@/assets/images/sabah.jpg'),
    description: 'Home to Mount Kinabalu and diverse marine life.'
  },
  {
    id: '14',
    title: 'Sarawak',
    image: require('@/assets/images/Sarawak.jpg'),
    description: 'The largest state, known for its rainforests and indigenous cultures.'
  },
  {
    id: '15',
    title: 'Selangor',
    image: require('@/assets/images/selangor.webp'),
    description: 'The most developed state with modern attractions.'
  },
  {
    id: '16',
    title: 'Terengganu',
    image: require('@/assets/images/terengganu.jpg'),
    description: 'Known for its beautiful islands and traditional crafts.'
  },
];

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: '#520520' }]}>Discover Malaysia</Text>
      <Text style={[styles.subtitle, { color: '#520520' }]}>Find the best places to visit</Text>
      <TextInput
        style={[styles.searchBar, { backgroundColor: '#42011B', color: theme.text }]}
        placeholder="Search for a destination..."
        placeholderTextColor={'white'}
      />
      <Text style={[styles.featuredTitle, { color: '#520520' }]}>Featured Destinations</Text>
      <FlatList
        data={featuredDestinations}
        renderItem={({ item }) => (
          <View style={[styles.destinationItem, { backgroundColor: '#42011B' }]}>
            <Image source={item.image} style={styles.destinationImage} />
            <View style={styles.destinationText}>
              <Text style={[styles.destinationTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={{ color: theme.text }}>{item.description}</Text>
            </View>
          </View>
        )}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  searchBar: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  destinationItem: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  destinationImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  destinationText: {
    flex: 1,
    justifyContent: 'center',
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});