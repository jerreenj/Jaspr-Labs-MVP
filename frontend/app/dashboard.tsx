import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usePrivy, useEmbeddedWallet } from '@privy-io/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://jaspr-swap.preview.emergentagent.com';

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = usePrivy();
  const wallet = useEmbeddedWallet();
  const [balances, setBalances] = useState({ ETH: '0.5', USDC: '1250.50' });
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    initializeWallet();
  }, [wallet]);

  const initializeWallet = async () => {
    try {
      setLoading(true);
      if (wallet) {
        const address = wallet.address || '';
        setWalletAddress(address);
        
        if (address) {
          // Register wallet in backend
          await axios.post(`${BACKEND_URL}/api/wallets`, {
            address,
            privy_did: user?.id,
            chain: 'base'
          });
          
          // Fetch balances
          const response = await axios.get(`${BACKEND_URL}/api/balances/${address}`);
          if (response.data.balances) {
            setBalances(response.data.balances);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async () => {
    if (walletAddress) {
      await Clipboard.setStringAsync(walletAddress);
      Alert.alert('Success', 'Address copied to clipboard!');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (loading || !wallet) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a2e', '#0f3460', '#16213e']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome</Text>
            <Text style={styles.username}>{user?.email?.address?.split('@')[0] || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialCommunityIcons name="logout" size={24} color="#ff4444" />
          </TouchableOpacity>
        </View>

        {/* Wallet Address Card */}
        <View style={styles.addressCard}>
          <Text style={styles.addressLabel}>Wallet Address</Text>
          <View style={styles.addressRow}>
            <Text style={styles.address} numberOfLines={1}>
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </Text>
            <TouchableOpacity onPress={copyAddress} style={styles.copyButton}>
              <MaterialCommunityIcons name="content-copy" size={20} color="#00d4ff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.chainLabel}>Base Network</Text>
        </View>

        {/* Balance Cards */}
        <View style={styles.balancesContainer}>
          <BalanceCard symbol="ETH" amount={balances.ETH} icon="ethereum" />
          <BalanceCard symbol="USDC" amount={balances.USDC} icon="currency-usd-circle" />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <ActionButton 
            icon="send" 
            label="Send" 
            onPress={() => router.push('/send')}
            colors={['#00d4ff', '#0099cc']}
          />
          <ActionButton 
            icon="swap-horizontal" 
            label="Swap" 
            onPress={() => router.push('/swap')}
            colors={['#9c27b0', '#7b1fa2']}
          />
          <ActionButton 
            icon="history" 
            label="History" 
            onPress={() => router.push('/history')}
            colors={['#ff9800', '#f57c00']}
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function BalanceCard({ symbol, amount, icon }: { symbol: string; amount: string; icon: any }) {
  return (
    <View style={styles.balanceCard}>
      <View style={styles.balanceHeader}>
        <MaterialCommunityIcons name={icon} size={32} color="#00d4ff" />
        <Text style={styles.balanceSymbol}>{symbol}</Text>
      </View>
      <Text style={styles.balanceAmount}>{amount}</Text>
    </View>
  );
}

function ActionButton({ icon, label, onPress, colors }: any) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <LinearGradient colors={colors} style={styles.actionGradient}>
        <MaterialCommunityIcons name={icon} size={32} color="#fff" />
        <Text style={styles.actionLabel}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 16,
    color: '#888',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  addressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  addressLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  address: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'monospace',
    flex: 1,
  },
  copyButton: {
    padding: 8,
  },
  chainLabel: {
    fontSize: 12,
    color: '#00d4ff',
    marginTop: 8,
  },
  balancesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  balanceSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  actionGradient: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 16,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
});
