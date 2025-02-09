import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const { user } = useUser();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hi {user?.firstName}</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes"
          placeholderTextColor="#666"
        />
      </View>

      {/* Add New Note Card */}
      <TouchableOpacity 
        style={styles.addNoteCard}
        onPress={() => router.push('/note/new')}
      >
        <View style={styles.addNoteContent}>
          <Text style={styles.addNoteText}>Add new{'\n'}note</Text>
          <Image 
            source={require('../../assets/images/bible.png')} 
            style={styles.addNoteImage}
          />
        </View>
      </TouchableOpacity>

      {/* Folders Grid */}
      <View style={styles.foldersGrid}>
        <TouchableOpacity style={styles.folderCard}>
          <Ionicons name="home-outline" size={24} color="#0B4619" />
          <Text style={styles.folderTitle}>Sermons</Text>
          <Text style={styles.folderSubtitle}>Folder</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.folderCard}>
          <Ionicons name="book-outline" size={24} color="#0B4619" />
          <Text style={styles.folderTitle}>Devotions</Text>
          <Text style={styles.folderSubtitle}>Folder</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.folderCard}>
          <Ionicons name="glasses-outline" size={24} color="#0B4619" />
          <Text style={styles.folderTitle}>Bible study</Text>
          <Text style={styles.folderSubtitle}>Folder</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.folderCard, styles.addFolderCard]}>
          <Ionicons name="add" size={24} color="#666" />
          <Text style={styles.addFolderText}>Add new{'\n'}folder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
    padding: 20,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0B4619',
    marginBottom: 20,
    fontFamily: 'mon-b',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0B4619',
    fontFamily: 'mon',
  },
  addNoteCard: {
    backgroundColor: '#0B4619',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    height: 160,
  },
  addNoteContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addNoteText: {
    fontSize: 28,
    color: '#F5F5DC',
    fontFamily: 'mon-b',
  },
  addNoteImage: {
    width: 120,
    height: 120,
  },
  foldersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  folderCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0B4619',
  },
  folderTitle: {
    fontSize: 18,
    color: '#0B4619',
    marginTop: 12,
    fontFamily: 'mon-sb',
  },
  folderSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'mon',
  },
  addFolderCard: {
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  addFolderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'mon',
  },
});
