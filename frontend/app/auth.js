import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import axios from 'axios';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';

const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://jaspr-swap.preview.emergentagent.com';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

WebBrowser.maybeCompleteAuthSession();

export default function AuthPage() {
  const router = useRouter();
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
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Supabase Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'jaspr://auth/callback',
        },
      });

      if (error) throw error;

      // Wait for OAuth redirect
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'jaspr://auth/callback'
      );

      if (result.type === 'success') {
        await handleAuthSuccess('google');
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'Google login failed. Try email login.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    // Simple wallet creation for demo
    setLoading(true);
    try {
      await handleAuthSuccess('email');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (provider) => {
    try {
      // Create or load wallet
      let wallet;
      const savedWallet = await AsyncStorage.getItem('wallet_private_key');
      
      if (savedWallet) {
        wallet = new ethers.Wallet(savedWallet);
      } else {
        wallet = ethers.Wallet.createRandom();
        await AsyncStorage.setItem('wallet_private_key', wallet.privateKey);
      }

      await AsyncStorage.setItem('wallet_address', wallet.address);
      const email = provider === 'google' ? 'user@google.com' : 'user@jaspr.app';
      await AsyncStorage.setItem('user_email', email);

      // Register user in backend
      await axios.post(`${BACKEND_URL}/api/auth/signup`, {
        email: email,
        wallet_address: wallet.address,
        provider: provider,
      });

      await AsyncStorage.setItem('is_logged_in', 'true');
      router.replace('/(tabs)/home');
    } catch (error) {
      throw error;
    }
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d4ff" />
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
          <Text style={styles.title}>Welcome to JASPR</Text>
          <Text style={styles.subtitle}>CEX Experience • DEX Freedom</Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <View style={styles.googleInner}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="google" size={24} color="#fff" />
                  <Text style={styles.buttonText}>Continue with Google</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.emailButton}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={['#00d4ff', '#0099cc']}
              style={styles.buttonGradient}
            >
              <MaterialCommunityIcons name="wallet" size={24} color="#fff" />
              <Text style={styles.buttonText}>Quick Start</Text>
            </LinearGradient>
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
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#00d4ff',
    marginTop: 8,
  },
  buttons: {
    gap: 16,
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
  emailButton: {
    width: '100%',
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
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: '#00d4ff',
    fontSize: 14,
  },
});