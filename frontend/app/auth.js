import 'react-native-get-random-values';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google OAuth configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '407408718192.apps.googleusercontent.com', // Demo client ID
    iosClientId: '407408718192.apps.googleusercontent.com',
    androidClientId: '407408718192.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    redirectUri: makeRedirectUri({
      scheme: 'jaspr',
      path: 'auth',
    }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSuccess(response.authentication);
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'Google sign-in failed. Please try Quick Start.');
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleSuccess = async (authentication) => {
    try {
      // Get user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        }
      );
      const userInfo = await userInfoResponse.json();
      
      // Create wallet for Google user
      const wallet = ethers.Wallet.createRandom();
      
      // Save to storage
      await AsyncStorage.setItem('wallet_private_key', wallet.privateKey);
      await AsyncStorage.setItem('wallet_address', wallet.address);
      await AsyncStorage.setItem('username', userInfo.name || userInfo.email?.split('@')[0] || 'User');
      await AsyncStorage.setItem('user_email', userInfo.email || '');
      await AsyncStorage.setItem('user_picture', userInfo.picture || '');
      await AsyncStorage.setItem('is_logged_in', 'true');
      await AsyncStorage.setItem('auth_provider', 'google');
      await AsyncStorage.setItem('demo_balance', '10000');
      
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Google auth error:', error);
      Alert.alert('Error', 'Failed to complete Google sign-in. Please try Quick Start.');
      setGoogleLoading(false);
    }
  };

  const handleQuickStart = async () => {
    setLoading(true);
    console.log('[AUTH] Starting Quick Start login...');
    
    try {
      // Create wallet
      console.log('[AUTH] Creating wallet...');
      const wallet = ethers.Wallet.createRandom();
      console.log('[AUTH] Wallet created:', wallet.address);
      
      // Save to storage
      await AsyncStorage.setItem('wallet_private_key', wallet.privateKey);
      await AsyncStorage.setItem('wallet_address', wallet.address);
      await AsyncStorage.setItem('username', 'User');
      await AsyncStorage.setItem('is_logged_in', 'true');
      await AsyncStorage.setItem('auth_provider', 'quickstart');
      
      // Initialize demo balance
      await AsyncStorage.setItem('demo_balance', '10000');
      
      console.log('[AUTH] Saved to storage');
      
      // Navigate immediately
      console.log('[AUTH] Navigating to home...');
      router.replace('/(tabs)/home');
      
    } catch (error) {
      console.error('[AUTH] Error:', error);
      Alert.alert('Error', 'Failed to create wallet: ' + error.message);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google prompt error:', error);
      // Fallback: Create wallet with Google-like experience
      Alert.alert(
        'Google Sign-In',
        'For this demo, we\'ll create a secure wallet for you. In production, this would use your Google account.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setGoogleLoading(false) },
          { 
            text: 'Continue', 
            onPress: async () => {
              try {
                const wallet = ethers.Wallet.createRandom();
                await AsyncStorage.setItem('wallet_private_key', wallet.privateKey);
                await AsyncStorage.setItem('wallet_address', wallet.address);
                await AsyncStorage.setItem('username', 'Google User');
                await AsyncStorage.setItem('is_logged_in', 'true');
                await AsyncStorage.setItem('auth_provider', 'google_demo');
                await AsyncStorage.setItem('demo_balance', '10000');
                router.replace('/(tabs)/home');
              } catch (e) {
                Alert.alert('Error', 'Failed to create wallet');
                setGoogleLoading(false);
              }
            }
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a1a', '#0d1f3c', '#0a0a1a']}
        style={styles.gradient}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="wallet" size={56} color="#00FFF0" />
            </View>
            <Text style={styles.title}>Jaspr</Text>
            <Text style={styles.tagline}>CEX Features & DEX Freedom</Text>
          </View>

          <View style={styles.buttons}>
            {/* Quick Start Button */}
            <TouchableOpacity 
              style={styles.button}
              onPress={handleQuickStart}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00FFF0', '#00B8D4']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="flash" size={24} color="#000" />
                    <Text style={styles.buttonTextPrimary}>Quick Start</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.quickStartHint}>No sign-up required • Instant access</Text>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity 
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Image 
                    source={{ uri: 'https://www.google.com/favicon.ico' }}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#00FFA3" />
              <Text style={styles.featureText}>Self-custodial wallet</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="gift" size={20} color="#FFD700" />
              <Text style={styles.featureText}>$10,000 demo balance</Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color="#00FFF0" />
              <Text style={styles.featureText}>Instant trading</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  gradient: { flex: 1 },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    backgroundColor: 'rgba(0, 255, 240, 0.1)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 240, 0.2)',
  },
  title: {
    fontSize: 44,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#00FFF0',
    marginTop: 8,
    fontWeight: '500',
  },
  buttons: {
    gap: 12,
  },
  button: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  buttonTextPrimary: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  quickStartHint: {
    textAlign: 'center',
    color: '#888',
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 16,
    fontSize: 13,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  features: {
    marginTop: 40,
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  featureText: {
    color: '#888',
    fontSize: 14,
  },
});
