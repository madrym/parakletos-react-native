import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export default function Profile() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(modals)/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        {user?.imageUrl ? (
          <Image source={{ uri: user.imageUrl }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder} />
        )}
        <Text style={styles.name}>{user?.fullName || 'User'}</Text>
        <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
      </View>

      <View style={styles.optionsSection}>
        <TouchableOpacity 
          style={[styles.option, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <Text style={[styles.optionText, styles.signOutText]}>Sign Out</Text>
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
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#0B4619',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0B4619',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B4619',
    marginBottom: 8,
    fontFamily: 'mon-b',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    fontFamily: 'mon',
  },
  optionsSection: {
    marginTop: 20,
  },
  option: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#0B4619',
  },
  optionText: {
    fontSize: 16,
    color: '#0B4619',
    fontFamily: 'mon-sb',
  },
  signOutButton: {
    backgroundColor: '#0B4619',
    marginTop: 20,
  },
  signOutText: {
    color: '#F5F5DC',
  },
});