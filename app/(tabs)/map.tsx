
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MapScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  let region = {
    latitude: 4.2105,
    longitude: 101.9758,
    latitudeDelta: 10,
    longitudeDelta: 10,
  };

  if (location) {
    region = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
      >
        {location && (
          <Marker
            coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
            title="Your Location"
          />
        )}
      </MapView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity>
          <LinearGradient
            colors={['#FF69B4', '#FF1493']}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Suggested Food Place</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Suggested Attraction Place</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <View style={styles.agendaContainer}>
        <Text style={styles.agendaTitle}>Agenda</Text>
        <View style={styles.agendaItem}>
          <Ionicons name="fast-food-outline" size={24} color="#FF26B7" style={styles.agendaIcon} />
          <Text style={styles.agendaText}>Suggested Food Place</Text>
        </View>
        <View style={styles.agendaItem}>
          <Ionicons name="star-outline" size={24} color="#FFD700" style={styles.agendaIcon} />
          <Text style={styles.agendaText}>Suggested Attraction Place</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonContainer: {
    position: 'absolute',
    top: 60,
    left: 10,
    right: 10,
    flexDirection: 'column',
    alignItems: 'center',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    marginVertical: 5,
    width: 250,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  agendaContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 5,
  },
  agendaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  agendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  agendaIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
    textAlign: 'center',
  },
  agendaText: {
    fontSize: 16,
  },
});