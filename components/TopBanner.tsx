import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TopBanner() {
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleProfilePress = () => {
    if (isSignedIn) {
      // Show profile options
      router.push('/profile');
    } else {
      router.push('/(modals)/login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>parakletos</Text>
      <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
        {isSignedIn && user?.imageUrl ? (
          <Image 
            source={{ uri: user.imageUrl }} 
            style={styles.profileImage} 
          />
        ) : (
          <Ionicons name="person-circle-outline" size={32} color="#0B4619" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5DC',
    borderBottomWidth: 1,
    borderBottomColor: '#0B4619',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B4619',
    fontFamily: 'mon-sb',
  },
  profileButton: {
    padding: 4,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0B4619',
  },
}); 