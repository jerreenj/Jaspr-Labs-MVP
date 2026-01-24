import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://jaspr-swap.preview.emergentagent.com';

export default function HomePage() {
  const [walletAddress, setWalletAddress] = useState('');
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState({ usdc: 0, tokens: {} });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const address = await AsyncStorage.getItem('wallet_address');
      const userEmail = await AsyncStorage.getItem('user_email');
      setWalletAddress(address || '');
      setEmail(userEmail || '');

      if (address) {
        const response = await axios.get(`${BACKEND_URL}/api/users/${address}/balance`);
        setBalance({
          usdc: response.data.usdc_balance || 0,
          tokens: response.data.token_balances || {}
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const copyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert('Success', 'Address copied!');
  };

  if (loading) {
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
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <View style={styles.walletCard}>
          <Text style={styles.cardLabel}>Wallet Address</Text>
          <View style={styles.addressRow}>
            <Text style={styles.address} numberOfLines={1}>
              {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}` : 'Loading...'}
            </Text>
            <TouchableOpacity onPress={copyAddress}>
              <MaterialCommunityIcons name="content-copy" size={20} color="#00d4ff" />
            </TouchableOpacity>
          </View>
          <View style={styles.networkBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#00d4ff" />
            <Text style={styles.networkText}>JASPR Network</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>USDC Balance</Text>
          <Text style={styles.balance}>{balance.usdc.toFixed(2)}</Text>
          <Text style={styles.balanceUsd}>≈ ${balance.usdc.toFixed(2)}</Text>
        </View>

        <View style={styles.tokensSection}>
          <Text style={styles.sectionTitle}>Token Holdings</Text>
          {Object.keys(balance.tokens).length > 0 ? (
            Object.entries(balance.tokens).map(([token, amount]) => (
              <View key={token} style={styles.tokenRow}>
                <Text style={styles.tokenName}>{token}</Text>
                <Text style={styles.tokenAmount}>{amount.toFixed(6)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No tokens yet. Start trading!</Text>
          )}
        </View>
      </ScrollView>
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
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  header: { marginBottom: 32 },
  greeting: { fontSize: 16, color: '#888' },
  email: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  walletCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  cardLabel: { fontSize: 14, color: '#888', marginBottom: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  address: { fontSize: 16, color: '#fff', fontFamily: 'monospace', flex: 1 },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  networkText: { fontSize: 12, color: '#00d4ff' },
  balanceCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  balanceLabel: { fontSize: 14, color: '#888' },
  balance: { fontSize: 48, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  balanceUsd: { fontSize: 16, color: '#888', marginTop: 4 },
  tokensSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  tokenAmount: {
    fontSize: 16,
    color: '#00d4ff',
    fontFamily: 'monospace',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 16,
  },
});