import 'react-native-get-random-values';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

// Initialize Supabase client
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://waniaxzjdpngqfiyzarh.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate a simple wallet address (for demo purposes)
const generateWallet = async () => {
  // Generate random bytes for private key simulation
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const privateKeyHex = Array.from(new Uint8Array(randomBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Generate address from private key hash
  const addressHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    privateKeyHex
  );
  
  return {
    privateKey: '0x' + privateKeyHex,
    address: '0x' + addressHash.slice(0, 40),
  };
};

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleQuickStart = async () => {
    setLoading(true);
    console.log('[AUTH] Starting Quick Start login...');
    
    try {
      const wallet = await generateWallet();
      console.log('[AUTH] Wallet created:', wallet.address);
      
      await AsyncStorage.setItem('wallet_private_key', wallet.privateKey);
      await AsyncStorage.setItem('wallet_address', wallet.address);
      await AsyncStorage.setItem('username', 'User');
      await AsyncStorage.setItem('is_logged_in', 'true');
      await AsyncStorage.setItem('auth_provider', 'quickstart');
      await AsyncStorage.setItem('demo_balance', '10000');
      
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
      const redirectUrl = makeRedirectUri({
        scheme: 'jaspr',
        path: 'auth/callback',
      });
      
      console.log('[AUTH] Redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });
      
      if (error) {
        console.error('[AUTH] Supabase OAuth error:', error);
        throw error;
      }
      
      if (data?.url) {
        console.log('[AUTH] Opening browser for Google auth...');
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );
        
        console.log('[AUTH] Browser result:', result.type);
        
        if (result.type === 'success') {
          // Extract the access token from the URL
          const url = result.url;
          const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
          const accessToken = params.get('access_token');
          
          if (accessToken) {
            const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
            
            if (userData?.user) {
              // Create wallet for the user
              const wallet = await generateWallet();
              
              await AsyncStorage.setItem('wallet_private_key', wallet.privateKey);
              await AsyncStorage.setItem('wallet_address', wallet.address);
              await AsyncStorage.setItem('username', userData.user.user_metadata?.full_name || userData.user.email?.split('@')[0] || 'User');
              await AsyncStorage.setItem('user_email', userData.user.email || '');
              await AsyncStorage.setItem('user_picture', userData.user.user_metadata?.avatar_url || '');
              await AsyncStorage.setItem('is_logged_in', 'true');
              await AsyncStorage.setItem('auth_provider', 'google');
              await AsyncStorage.setItem('supabase_user_id', userData.user.id);
              await AsyncStorage.setItem('demo_balance', '10000');
              
              router.replace('/(tabs)/home');
              return;
            }
          }
        }
        
        // If we reach here, auth wasn't successful
        throw new Error('Authentication was cancelled or failed');
      }
    } catch (error) {
      console.error('[AUTH] Google login error:', error);
      Alert.alert(
        'Google Sign-In',
        error.message || 'Unable to sign in with Google. Please use Quick Start to continue.',
        [{ text: 'OK' }]
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.brand}>Jaspr Labs</Text>
        </View>

        <View style={styles.buttons}>
          {/* Quick Start Button */}
          <TouchableOpacity 
            style={styles.button}
            onPress={handleQuickStart}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <MaterialCommunityIcons name="flash" size={24} color="#000" />
                <Text style={styles.buttonText}>Quick Start</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.quickStartHint}>No sign-up required • Instant $10,000 demo</Text>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
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
            <MaterialCommunityIcons name="shield-check" size={20} color="#00C853" />
            <Text style={styles.featureText}>Self-custodial wallet</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="chart-line" size={20} color="#FFF" />
            <Text style={styles.featureText}>Real-time trading</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="swap-horizontal" size={20} color="#FFF" />
            <Text style={styles.featureText}>25+ tokens available</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
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
    marginBottom: 48,
  },
  brand: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 3,
    fontFamily: 'Inter_700Bold',
  },
  tagline: {
    fontSize: 18,
    color: '#888',
    marginTop: 8,
    fontFamily: 'Inter_500Medium',
  },
  buttons: {
    gap: 12,
  },
  button: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  quickStartHint: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#222',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
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
    fontFamily: 'Inter_600SemiBold',
  },
  features: {
    marginTop: 48,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  featureText: {
    color: '#888',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
});
