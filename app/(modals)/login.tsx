import { useOAuth, useSignUp, useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  Image, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  StatusBar 
} from 'react-native';
import { useWarmUpBrowser } from '@/hooks/useWarmUpBrowser';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

enum Strategy {
  Google = 'oauth_google',
}

const Page = () => {
  useWarmUpBrowser();
  const router = useRouter();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { signUp, setActive: setSignUpActive } = useSignUp();
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { user } = useUser();
  const createOrUpdateUser = useMutation(api.mutations.createOrUpdateUser);
  
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUserCreation = async () => {
    if (!user) return;
    try {
      await createOrUpdateUser({
        tokenIdentifier: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.emailAddresses[0].emailAddress,
      });
    } catch (error) {
      console.error('Error creating user in Convex:', error);
    }
  };

  const onSelectAuth = async () => {
    try {
      setLoading(true);
      const { createdSessionId, signIn, signUp } = await startOAuthFlow();
      
      if (createdSessionId) {
        // If we have a session, activate it
        if (signUp && setSignUpActive) {
          await setSignUpActive({ session: createdSessionId });
        } else if (signIn && setSignInActive) {
          await setSignInActive({ session: createdSessionId });
        }
        await handleUserCreation();
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Error', 'Failed to complete authentication');
      }
    } catch (err) {
      console.error('OAuth error:', err);
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      if (!signUp || !setSignUpActive) {
        Alert.alert('Error', 'Sign up is not initialized');
        return;
      }

      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      if (signUp.status === 'complete') {
        await setSignUpActive({ session: signUp.createdSessionId });
        await handleUserCreation();
        router.replace('/(tabs)/home');
      } else {
        Alert.alert(
          'Verification Required',
          'Please check your email for a verification code.',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    try {
      setLoading(true);

      if (!signIn || !setSignInActive) {
        Alert.alert('Error', 'Sign in is not initialized');
        return;
      }

      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setSignInActive({ session: signInAttempt.createdSessionId });
        await handleUserCreation();
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Error', 'Unable to complete sign in');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      Alert.alert('Error', err.errors?.[0]?.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  if (showSignUp) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.container}>
            <View style={styles.formContainer}>
              <Text style={styles.title}>parakletos</Text>
              <Text style={styles.subtitle}>Create an account</Text>
              
              <TouchableOpacity 
                style={[styles.googleButton, loading && styles.disabledButton]}
                onPress={onSelectAuth}
                disabled={loading}
              >
                <Image 
                  source={require('../../assets/images/google-icon.png')} 
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputRow}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <TextInput
                      style={styles.input}
                      placeholder="First Name"
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Last Name"
                      value={lastName}
                      onChangeText={setLastName}
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.actionButton, loading && styles.disabledButton]}
                onPress={handleEmailSignUp}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => {
                  setShowSignUp(false);
                  setShowLogin(true);
                }}
                style={styles.switchActionContainer}
              >
                <Text style={styles.switchActionText}>
                  Already have an account? <Text style={styles.switchActionLink}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        <View style={styles.boatContainer}>
          <Image 
            source={require('../../assets/images/boat.png')} 
            style={styles.boatImage}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (showLogin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.container}>
            <View style={styles.formContainer}>
              <Text style={styles.title}>parakletos</Text>
              <Text style={styles.subtitle}>Welcome back</Text>
              
              <TouchableOpacity 
                style={[styles.googleButton, loading && styles.disabledButton]}
                onPress={onSelectAuth}
                disabled={loading}
              >
                <Image 
                  source={require('../../assets/images/google-icon.png')} 
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!loading}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.actionButton, loading && styles.disabledButton]}
                onPress={handleEmailSignIn}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => {
                  setShowLogin(false);
                  setShowSignUp(true);
                }}
                style={styles.switchActionContainer}
              >
                <Text style={styles.switchActionText}>
                  Don't have an account? <Text style={styles.switchActionLink}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        <View style={styles.boatContainer}>
          <Image 
            source={require('../../assets/images/boat.png')} 
            style={styles.boatImage}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>parakletos</Text>
          <Text style={styles.subtitle}>Your personal helper for sermon{'\n'}and bible study notes taking</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => setShowLogin(true)}
            >
              <Text style={styles.actionButtonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setShowSignUp(true)}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.boatContainer}>
        <Image 
          source={require('../../assets/images/boat.png')} 
          style={styles.boatImage}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 34,
    color: '#0B4619',
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#0B4619',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.8,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#0B4619',
    opacity: 0.2,
  },
  actionButton: {
    backgroundColor: '#0B4619',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#F5F5DC',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0B4619',
  },
  secondaryButtonText: {
    color: '#0B4619',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  googleButton: {
    backgroundColor: '#0B4619',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonText: {
    color: '#F5F5DC',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  orText: {
    color: '#0B4619',
    fontSize: 14,
    marginHorizontal: 12,
    opacity: 0.7,
  },
  inputGroup: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  halfWidth: {
    flex: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  switchActionContainer: {
    marginTop: 24,
  },
  switchActionText: {
    fontSize: 15,
    color: '#666',
  },
  switchActionLink: {
    color: '#0B4619',
    fontWeight: 'bold',
  },
  boatContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '30%',
    justifyContent: 'flex-end',
    zIndex: -1,
  },
  boatImage: {
    width: '100%',
    height: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default Page;