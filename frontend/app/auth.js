import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://jaspr-swap.preview.emergentagent.com';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
      if (isLoggedIn === 'true') {
        router.replace('/(tabs)/home');
        return;
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleQuickStart = async () => {
    console.log('Quick Start clicked');
    setLoading(true);
    try {
      await handleAuthSuccess('quickstart@jaspr.app', 'quick');
    } catch (error) {
      console.error('Quick start error:', error);
      Alert.alert('Error', 'Failed to start: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    console.log('Email login clicked:', email);
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      await handleAuthSuccess(email, 'email');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log('Google login clicked');
    setLoading(true);
    try {
      await handleAuthSuccess('user@google.com', 'google');
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'Failed to login: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (userEmail, provider) => {
    try {
      console.log('Creating wallet for:', userEmail);
      
      // Create or load wallet
      let wallet;
      const savedWallet = await AsyncStorage.getItem('wallet_private_key');
      
      if (savedWallet) {
        console.log('Loading existing wallet');
        wallet = new ethers.Wallet(savedWallet);
      } else {
        console.log('Creating new wallet');
        wallet = ethers.Wallet.createRandom();
        await AsyncStorage.setItem('wallet_private_key', wallet.privateKey);
      }

      console.log('Wallet address:', wallet.address);
      await AsyncStorage.setItem('wallet_address', wallet.address);
      await AsyncStorage.setItem('user_email', userEmail);

      // Register user in backend
      try {
        console.log('Registering user in backend');
        await axios.post(`${BACKEND_URL}/api/auth/signup`, {
          email: userEmail,
          wallet_address: wallet.address,
          provider: provider,
        });
        console.log('User registered successfully');
      } catch (backendError) {
        console.log('Backend registration failed (continuing anyway):', backendError.message);
      }

      await AsyncStorage.setItem('is_logged_in', 'true');
      console.log('Login successful, navigating to home');
      
      Alert.alert(
        'Welcome to JASPR Labs! 🎉',
        `Your wallet has been created!\n\nAddress: ${wallet.address.slice(0, 10)}...\n\nYou can now trade crypto on Base Sepolia!`,
        [{ 
          text: 'Start Trading', 
          onPress: () => {
            console.log('Navigating to home');
            router.replace('/(tabs)/home');
          }
        }]
      );
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a3e', '#2d2d5f']}
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <MaterialCommunityIcons name="wallet" size={60} color="#00d4ff" />
          <Text style={styles.title}>JASPR</Text>
          <Text style={styles.labsText}>LABS</Text>
          <Text style={styles.subtitle}>CEX Experience • DEX Freedom</Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity 
            style={styles.quickButton}
            onPress={handleQuickStart}
            disabled={loading}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#00d4ff', '#0099cc']}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="flash" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Quick Start</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <TouchableOpacity 
            style={styles.emailButton}
            onPress={handleEmailLogin}
            disabled={loading || !email}
            activeOpacity={0.7}
          >
            <View style={[styles.emailInner, (!email || loading) && styles.buttonDisabled]}>
              <MaterialCommunityIcons name="email" size={24} color="#fff" />
              <Text style={styles.buttonText}>Continue with Email</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
            activeOpacity={0.7}
          >
            <View style={styles.googleInner}>
              <MaterialCommunityIcons name="google" size={24} color="#fff" />
              <Text style={styles.buttonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.info}>
          <MaterialCommunityIcons name="shield-check" size={20} color="#00d4ff" />
          <Text style={styles.infoText}>
            Secure wallet created automatically • Trade on Base Sepolia
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    letterSpacing: 4,
  },
  labsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d4ff',
    letterSpacing: 6,
    marginTop: -4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
  buttons: {
    gap: 16,
  },
  quickButton: {
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 16,
    fontSize: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  emailButton: {
    width: '100%',
  },
  emailInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    backgroundColor: '#6366f1',
  },
  googleButton: {
    width: '100%',
  },
  googleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    backgroundColor: '#4285f4',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: '#00d4ff',
    fontSize: 14,
  },
});