import 'react-native-get-random-values';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

// Initialize Supabase client
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://waniaxzjdpngqfiyzarh.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleQuickStart = async () => {
    setLoading(true);
    console.log('[AUTH] Starting Quick Start login...');
    
    try {
      const wallet = ethers.Wallet.createRandom();
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
              const wallet = ethers.Wallet.createRandom();
              
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
        'Unable to sign in with Google. Please use Quick Start to continue.',
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
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name="wallet" size={56} color="#FFF" />
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
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <MaterialCommunityIcons name="flash" size={24} color="#000" />
                <Text style={styles.buttonText}>Quick Start</Text>
              </>
            )}
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
            <MaterialCommunityIcons name="shield-check" size={20} color="#00C853" />
            <Text style={styles.featureText}>Self-custodial wallet</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="gift" size={20} color="#FFD700" />
            <Text style={styles.featureText}>$10,000 demo balance</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFF" />
            <Text style={styles.featureText}>Instant trading</Text>
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
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  title: {
    fontSize: 44,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#888',
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
  },
  quickStartHint: {
    textAlign: 'center',
    color: '#666',
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
    backgroundColor: '#222',
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
