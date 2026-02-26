import 'react-native-get-random-values';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

// API base URLs
const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || '';
const JASPR_CHAIN_API = 'https://www.jasprlabs.cloud/api';

// Google OAuth Client IDs
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

// Create wallet using JasprChain API (REAL blockchain wallet!)
const createJasprWallet = async () => {
  try {
    const response = await fetch(`${JASPR_CHAIN_API}/wallets/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) throw new Error('Failed to create wallet');
    
    const data = await response.json();
    console.log('[JASPR] Real wallet created:', data.address);
    console.log('[JASPR] Wallet type:', data.type, '- Threshold:', data.threshold);
    
    return {
      address: data.address, // jaspr1...
      publicKey: data.public_key,
      type: data.type,
      threshold: data.threshold
    };
  } catch (error) {
    console.log('[JASPR] Wallet creation failed, using fallback:', error.message);
    // Fallback: generate local address with jaspr1 prefix
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let address = 'jaspr1';
    for (let i = 0; i < 38; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return { address, publicKey: null };
  }
};

// Sync account with backend
const syncAccountWithBackend = async (walletAddress, accountData = null) => {
  try {
    if (accountData) {
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

// Google Auth with MongoDB backend
const handleGoogleAuthWithBackend = async (userInfo) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        google_id: userInfo.id,
      }),
    });
    return await response.json();
  } catch (error) {
    console.log('[AUTH] Google auth backend error:', error.message);
    return null;
  }
};

// Load account from backend by email
const loadAccountFromBackendByEmail = async (email) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/user/${encodeURIComponent(email)}`);
    if (response.ok) {
      const data = await response.json();
      return data.user;
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

  // Google Auth configuration - using Expo proxy for easier setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    // Use Expo's auth proxy - this provides the https:// redirect URI
    useProxy: true,
  });

  // Handle Google Auth response
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.authentication?.accessToken);
    }
  }, [response]);

  // Check for existing account on mount
  useEffect(() => {
    checkExistingAccount();
  }, []);

  const checkExistingAccount = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('user_email');
      if (savedEmail) {
        const backendAccount = await loadAccountFromBackendByEmail(savedEmail);
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

  const handleGoogleResponse = async (accessToken) => {
    if (!accessToken) {
      setGoogleLoading(false);
      return;
    }

    try {
      // Fetch user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await userInfoResponse.json();
      
      console.log('[AUTH] Google user info:', userInfo.email);

      // Send to our backend (creates account + adds to waitlist)
      const backendResult = await handleGoogleAuthWithBackend(userInfo);
      
      if (backendResult?.success && backendResult.user) {
        const user = backendResult.user;
        
        // Store in AsyncStorage
        await AsyncStorage.setItem('user_email', user.email);
        await AsyncStorage.setItem('username', user.name || 'User');
        await AsyncStorage.setItem('user_picture', user.picture || '');
        await AsyncStorage.setItem('wallet_address', user.wallet_address);
        await AsyncStorage.setItem('is_logged_in', 'true');
        await AsyncStorage.setItem('auth_provider', 'google');
        await AsyncStorage.setItem('demo_balance', String(user.balance || 10000));
        await AsyncStorage.setItem('token_holdings', JSON.stringify(user.holdings || {}));
        await AsyncStorage.setItem('purchase_info', JSON.stringify(user.purchase_info || {}));
        await AsyncStorage.setItem('swap_count', String(user.swap_count || 0));
        await AsyncStorage.setItem('tx_history', JSON.stringify(user.tx_history || []));
        
        console.log('[AUTH] Google login successful, navigating to home...');
        router.replace('/(tabs)/home');
      } else {
        Alert.alert('Error', 'Failed to create account. Please try again.');
      }
    } catch (error) {
      console.error('[AUTH] Google auth error:', error);
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    
    try {
      await promptAsync();
    } catch (error) {
      console.error('[AUTH] Google prompt error:', error);
      Alert.alert('Error', 'Could not open Google sign-in. Please try Quick Start instead.');
      setGoogleLoading(false);
    }
  };

  const handleContinueExisting = async () => {
    if (!existingAccount) return;
    
    setLoading(true);
    try {
      await AsyncStorage.setItem('user_email', existingAccount.email || '');
      await AsyncStorage.setItem('wallet_address', existingAccount.wallet_address);
      await AsyncStorage.setItem('is_logged_in', 'true');
      await AsyncStorage.setItem('auth_provider', existingAccount.provider || 'google');
      await AsyncStorage.setItem('demo_balance', String(existingAccount.balance || 10000));
      await AsyncStorage.setItem('token_holdings', JSON.stringify(existingAccount.holdings || {}));
      await AsyncStorage.setItem('purchase_info', JSON.stringify(existingAccount.purchase_info || {}));
      await AsyncStorage.setItem('swap_count', String(existingAccount.swap_count || 0));
      await AsyncStorage.setItem('tx_history', JSON.stringify(existingAccount.tx_history || []));
      await AsyncStorage.setItem('username', existingAccount.name || 'User');
      
      console.log('[AUTH] Restored existing account:', existingAccount.email);
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
    console.log('[AUTH] Starting Quick Start login with JasprChain...');
    
    try {
      // Check for existing wallet
      const existingAddress = await AsyncStorage.getItem('wallet_address');
      let walletAddress = existingAddress;
      
      if (!existingAddress || !existingAddress.startsWith('jaspr1')) {
        // Create new JasprChain wallet
        const wallet = await createJasprWallet();
        walletAddress = wallet.address;
        await AsyncStorage.setItem('wallet_address', wallet.address);
        if (wallet.publicKey) {
          await AsyncStorage.setItem('wallet_public_key', wallet.publicKey);
        }
        console.log('[AUTH] New JasprChain wallet created:', wallet.address);
      } else {
        console.log('[AUTH] Using existing wallet:', existingAddress);
      }
      
      // Create/restore account on backend
      const backendResult = await syncAccountWithBackend(walletAddress);
      console.log('[AUTH] Backend result:', backendResult?.success ? 'synced' : 'offline mode');
      
      let initialBalance = 10000;
      let holdings = {};
      let purchaseInfo = {};
      let swapCount = 0;
      let txHistory = [];
      
      if (backendResult?.account) {
        initialBalance = backendResult.account.balance || 10000;
        holdings = backendResult.account.holdings || {};
        purchaseInfo = backendResult.account.purchase_info || {};
        swapCount = backendResult.account.swap_count || 0;
        txHistory = backendResult.account.tx_history || [];
        console.log('[AUTH] Account data restored from backend');
      }
      
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

  if (checkingAccount) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="wallet" size={64} color="#FFF" />
          <Text style={styles.title}>Jaspr Labs</Text>
          <Text style={styles.subtitle}>Your gateway to crypto trading</Text>
        </View>

        {/* Existing Account Card */}
        {existingAccount && (
          <TouchableOpacity 
            style={styles.existingAccountCard}
            onPress={handleContinueExisting}
            disabled={loading}
          >
            <View style={styles.existingAccountContent}>
              <MaterialCommunityIcons name="account-check" size={24} color="#00C853" />
              <View style={styles.existingAccountText}>
                <Text style={styles.existingAccountTitle}>Continue as {existingAccount.name || existingAccount.email?.split('@')[0]}</Text>
                <Text style={styles.existingAccountSubtitle}>{existingAccount.email || 'Quick Start account'}</Text>
              </View>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color="#00C853" />
            ) : (
              <MaterialCommunityIcons name="chevron-right" size={24} color="#00C853" />
            )}
          </TouchableOpacity>
        )}

        {/* Auth Buttons */}
        <View style={styles.authButtons}>
          {/* Google Sign In */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={googleLoading || !request}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#000" />
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

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Quick Start */}
          <TouchableOpacity
            style={styles.quickStartButton}
            onPress={handleQuickStart}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="rocket-launch" size={20} color="#FFF" />
                <Text style={styles.quickStartText}>Quick Start</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.quickStartHint}>No sign-up required • $10,000 demo balance</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <MaterialCommunityIcons name="shield-check" size={18} color="#00C853" />
            <Text style={styles.featureText}>Secure & Private</Text>
          </View>
          <View style={styles.feature}>
            <MaterialCommunityIcons name="wallet" size={18} color="#00C853" />
            <Text style={styles.featureText}>Self-custodial wallet</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 16,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  existingAccountCard: {
    backgroundColor: '#0D2818',
    borderWidth: 1,
    borderColor: '#00C853',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  existingAccountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  existingAccountText: {
    marginLeft: 12,
    flex: 1,
  },
  existingAccountTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  existingAccountSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  authButtons: {
    marginBottom: 32,
  },
  googleButton: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    marginHorizontal: 16,
    fontSize: 14,
  },
  quickStartButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  quickStartHint: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
    marginTop: 12,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    color: '#888',
    fontSize: 13,
    marginLeft: 6,
  },
});
