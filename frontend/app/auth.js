import 'react-native-get-random-values';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

// API base URL
const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || '';

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

// Sync account with backend
const syncAccountWithBackend = async (walletAddress, accountData = null) => {
  try {
    if (accountData) {
      // Sync local data to backend
      const response = await fetch(`${API_URL}/api/account/sync`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          balance: accountData.balance,
          holdings: accountData.holdings,
          purchase_info: accountData.purchaseInfo,
          swap_count: accountData.swapCount,
          tx_history: accountData.txHistory,
        }),
      });
      return await response.json();
    } else {
      // Create or get account
      const response = await fetch(`${API_URL}/api/account/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          provider: 'quickstart',
        }),
      });
      return await response.json();
    }
  } catch (error) {
    console.log('[AUTH] Backend sync error (offline mode):', error.message);
    return null;
  }
};

// Load account from backend
const loadAccountFromBackend = async (walletAddress) => {
  try {
    const response = await fetch(`${API_URL}/api/account/${walletAddress}`);
    if (response.ok) {
      const data = await response.json();
      return data.account;
    }
    return null;
  } catch (error) {
    console.log('[AUTH] Backend load error:', error.message);
    return null;
  }
};

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [existingAccount, setExistingAccount] = useState(null);
  const [checkingAccount, setCheckingAccount] = useState(true);

  // Check for existing account on mount
  useEffect(() => {
    checkExistingAccount();
  }, []);

  const checkExistingAccount = async () => {
    try {
      const savedAddress = await AsyncStorage.getItem('wallet_address');
      if (savedAddress) {
        // Try to load from backend
        const backendAccount = await loadAccountFromBackend(savedAddress);
        if (backendAccount) {
          setExistingAccount(backendAccount);
        }
      }
    } catch (error) {
      console.log('[AUTH] Check existing account error:', error);
    } finally {
      setCheckingAccount(false);
    }
  };

  const handleContinueExisting = async () => {
    if (!existingAccount) return;
    
    setLoading(true);
    try {
      // Restore account data to AsyncStorage
      await AsyncStorage.setItem('wallet_address', existingAccount.wallet_address);
      await AsyncStorage.setItem('is_logged_in', 'true');
      await AsyncStorage.setItem('auth_provider', existingAccount.provider || 'quickstart');
      await AsyncStorage.setItem('demo_balance', String(existingAccount.balance || 10000));
      await AsyncStorage.setItem('token_holdings', JSON.stringify(existingAccount.holdings || {}));
      await AsyncStorage.setItem('purchase_info', JSON.stringify(existingAccount.purchase_info || {}));
      await AsyncStorage.setItem('swap_count', String(existingAccount.swap_count || 0));
      await AsyncStorage.setItem('tx_history', JSON.stringify(existingAccount.tx_history || []));
      await AsyncStorage.setItem('username', existingAccount.username || 'User');
      
      console.log('[AUTH] Restored existing account:', existingAccount.wallet_address);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('[AUTH] Error restoring account:', error);
      Alert.alert('Error', 'Failed to restore account');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStart = async () => {
    setLoading(true);
    console.log('[AUTH] Starting Quick Start login...');
    
    try {
      const wallet = await generateWallet();
      console.log('[AUTH] Wallet created:', wallet.address);
      
      // Create account on backend first
      const backendResult = await syncAccountWithBackend(wallet.address);
      console.log('[AUTH] Backend result:', backendResult?.success ? 'synced' : 'offline mode');
      
      // If backend returned existing account with data, use that
      let initialBalance = 10000;
      let holdings = {};
      let purchaseInfo = {};
      let swapCount = 0;
      let txHistory = [];
      
      if (backendResult?.account && !backendResult.is_new) {
        // Existing account - restore data
        initialBalance = backendResult.account.balance || 10000;
        holdings = backendResult.account.holdings || {};
        purchaseInfo = backendResult.account.purchase_info || {};
        swapCount = backendResult.account.swap_count || 0;
        txHistory = backendResult.account.tx_history || [];
        console.log('[AUTH] Restored existing account data');
      }
      
      await AsyncStorage.setItem('wallet_private_key', wallet.privateKey);
      await AsyncStorage.setItem('wallet_address', wallet.address);
      await AsyncStorage.setItem('username', 'User');
      await AsyncStorage.setItem('is_logged_in', 'true');
      await AsyncStorage.setItem('auth_provider', 'quickstart');
      await AsyncStorage.setItem('demo_balance', String(initialBalance));
      await AsyncStorage.setItem('token_holdings', JSON.stringify(holdings));
      await AsyncStorage.setItem('purchase_info', JSON.stringify(purchaseInfo));
      await AsyncStorage.setItem('swap_count', String(swapCount));
      await AsyncStorage.setItem('tx_history', JSON.stringify(txHistory));
      
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
              
              // Try to sync with backend
              const backendResult = await syncAccountWithBackend(wallet.address);
              console.log('[AUTH] Backend sync result:', backendResult);
              
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
          <Text style={styles.brand}>Jaspr</Text>
        </View>

        <View style={styles.buttons}>
          {/* Show existing account option if available */}
          {existingAccount && !checkingAccount && (
            <>
              <TouchableOpacity 
                style={styles.existingAccountButton}
                onPress={handleContinueExisting}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="account-check" size={24} color="#FFF" />
                    <Text style={styles.existingAccountText}>
                      Continue as {existingAccount.username || 'User'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.existingAccountHint}>
                Wallet: {existingAccount.wallet_address?.slice(0, 6)}...{existingAccount.wallet_address?.slice(-4)}
              </Text>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or create new</Text>
                <View style={styles.dividerLine} />
              </View>
            </>
          )}

          {/* Quick Start Button */}
          <TouchableOpacity 
            style={styles.button}
            onPress={handleQuickStart}
            disabled={loading || checkingAccount}
            activeOpacity={0.8}
          >
            {(loading && !existingAccount) || checkingAccount ? (
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
            disabled={googleLoading || checkingAccount}
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
    alignItems: 'center',
  },
  brand: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 2,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
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
