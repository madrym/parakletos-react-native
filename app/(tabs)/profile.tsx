import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

  const navigateToHome = () => {
    router.push('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={navigateToHome} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#0B4619" />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={50} color="#FFF" />
              </View>
            )}
            <Text style={styles.name}>{user?.fullName || 'User'}</Text>
            <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Account</Text>
            
            <View style={styles.optionsSection}>
              <TouchableOpacity style={styles.option}>
                <View style={styles.optionIconContainer}>
                  <Ionicons name="person-outline" size={22} color="#0B4619" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>Edit Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.option}>
                <View style={styles.optionIconContainer}>
                  <Ionicons name="notifications-outline" size={22} color="#0B4619" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>Notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.option}>
                <View style={styles.optionIconContainer}>
                  <Ionicons name="lock-closed-outline" size={22} color="#0B4619" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>Privacy & Security</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Support</Text>
            
            <View style={styles.optionsSection}>
              <TouchableOpacity style={styles.option}>
                <View style={styles.optionIconContainer}>
                  <Ionicons name="help-circle-outline" size={22} color="#0B4619" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>Help Center</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.option}>
                <View style={styles.optionIconContainer}>
                  <Ionicons name="document-text-outline" size={22} color="#0B4619" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionText}>Terms & Policies</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11, 70, 25, 0.1)',
    backgroundColor: '#F5F5DC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0B4619',
    letterSpacing: 0.3,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#0B4619',
    marginLeft: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#0B4619',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0B4619',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B4619',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  email: {
    fontSize: 16,
    color: '#666',
    opacity: 0.8,
  },
  sectionContainer: {
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0B4619',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  optionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 70, 25, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  signOutButton: {
    backgroundColor: '#0B4619',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signOutText: {
    color: '#F5F5DC',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});