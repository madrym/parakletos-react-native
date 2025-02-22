import { useOAuth, useSignUp, useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { View, StyleSheet, TextInput, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { useWarmUpBrowser } from '@/hooks/useWarmUpBrowser';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';

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
      <View style={styles.container}>
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

        <Text style={styles.orText}>or</Text>

        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter your email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Create a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.createAccountButton, loading && styles.disabledButton]}
          onPress={handleEmailSignUp}
          disabled={loading}
        >
          <Text style={styles.createAccountButtonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <Image 
          source={require('../../assets/images/boat.png')} 
          style={styles.boatImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (showLogin) {
    return (
      <View style={styles.container}>
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

        <Text style={styles.orText}>or</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleEmailSignIn}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing In...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.signUpText}>
          Didn't have an account? 
          <Text 
            style={styles.signUpLink}
            onPress={() => {
              setShowLogin(false);
              setShowSignUp(true);
            }}
          > Sign Up</Text>
        </Text>

        <Image 
          source={require('../../assets/images/boat.png')} 
          style={styles.boatImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>parakletos</Text>
      <Text style={styles.subtitle}>Your personal helper for sermon{'\n'}and bible study notes taking</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={() => setShowLogin(true)}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.signUpButton}
          onPress={() => setShowSignUp(true)}
        >
          <Text style={styles.buttonText}>Sign up</Text>
        </TouchableOpacity>
      </View>

      <Image 
        source={require('../../assets/images/boat.png')} 
        style={styles.boatImage}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    color: '#0B4619',
    fontWeight: 'bold',
    marginTop: 60,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#0B4619',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  loginButton: {
    backgroundColor: '#0B4619',
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  signUpButton: {
    backgroundColor: '#0B4619',
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#F5F5DC',
    fontSize: 18,
    fontWeight: '600',
  },
  boatImage: {
    width: '100%',
    height: 200,
    position: 'absolute',
    bottom: 0,
  },
  input: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    padding: 15,
    borderRadius: 25,
    marginBottom: 15,
    fontSize: 16,
    color: '#0B4619',
  },
  googleButton: {
    backgroundColor: '#0B4619',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
    width: '100%',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#F5F5DC',
    fontSize: 16,
    marginLeft: 10,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  orText: {
    color: '#0B4619',
    fontSize: 16,
    marginVertical: 20,
  },
  createAccountButton: {
    backgroundColor: '#666666',
    padding: 15,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  createAccountButtonText: {
    color: '#F5F5DC',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpText: {
    color: '#0B4619',
    marginTop: 20,
  },
  signUpLink: {
    color: '#0B4619',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default Page;