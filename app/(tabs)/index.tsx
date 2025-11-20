
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useState } from 'react';
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';


export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedContent, setSelectedContent] = useState({ title: '', description: '' });

  const handleImagePress = (title: string, description: string) => {
    setSelectedContent({ title, description });
    setModalVisible(true);
  };

  const sections = [
    {
      title: 'A Land of Diversity',
      image: require('@/assets/images/diversity.webp'),
      description:
        `Malaysia is a multicultural country with a rich tapestry of traditions, languages, and cuisines. Its population is a vibrant mix of Malays, Chinese, Indians, and indigenous groups, all living together in harmony. This diversity is reflected in the country's festivals, art, and daily life, making it a truly unique destination.`,
    },
    {
      title: 'A Journey Through History',
      image: require('@/assets/images/history.jpg'),
      description:
        `From the ancient kingdoms of the Malay Peninsula to the colonial era and the road to independence, Malaysia has a fascinating history. Explore the historic cities of Malacca and George Town, both UNESCO World Heritage Sites, to witness the influence of centuries of trade and cultural exchange.`,
    },
    {
      title: 'A Culinary Paradise',
      image: require('@/assets/images/food.jpg'),
      description:
        `Malaysian food is a delicious fusion of Malay, Chinese, and Indian flavors. From the spicy and aromatic Nasi Lemak to the savory and satisfying Char Kway Teow, there is something to tantalize every taste bud. Don't miss the chance to explore the bustling street food stalls and night markets for an authentic culinary experience.`,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Welcome to Malaysia</Text>
          </View>
        </View>
        <View style={styles.contentContainer}>
          {sections.map((section, index) => (
            <View
              key={index}
              style={[
                styles.section,
                { backgroundColor: theme.card, shadowColor: theme.shadow },
              ]}>
              <TouchableOpacity
                onPress={() => handleImagePress(section.title, section.description)}>
                <Image source={section.image} style={styles.sectionImage} />
              </TouchableOpacity>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View
            style={[
              styles.modalView,
              { backgroundColor: theme.card, shadowColor: theme.shadow },
            ]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {selectedContent.title}
            </Text>
            <Text style={[styles.modalText, { color: theme.text }]}>{selectedContent.description}</Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.tint }]}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={[styles.textStyle, { color: theme.background }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  header: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  titleContainer: {
    borderRadius: 12,
    padding: 16,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  sectionImage: {
    width: 300,
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  textStyle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
});