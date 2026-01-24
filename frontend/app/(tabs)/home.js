import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

export default function HomePage() {
  const [walletAddress, setWalletAddress] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const address = await AsyncStorage.getItem('wallet_address');
    const userEmail = await AsyncStorage.getItem('user_email');
    setWalletAddress(address || '');
    setEmail(userEmail || '');
  };

  const copyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert('Success', 'Address copied!');
  };

  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a3e', '#2d2d5f']}
      style={styles.container}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
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
            <Text style={styles.networkText}>Base Sepolia Testnet</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>USDC Balance</Text>
          <Text style={styles.balance}>100.00</Text>
          <Text style={styles.balanceUsd}>≈ $100.00</Text>
        </View>

        <View style={styles.actions}>
          <ActionButton icon="chart-line" label="Markets" colors={['#6366f1', '#4f46e5']} />
          <ActionButton icon="swap-horizontal" label="Trade" colors={['#00d4ff', '#0099cc']} />
          <ActionButton icon="send" label="Send" colors={['#ec4899', '#db2777']} />
        </View>

        <View style={styles.gasWidget}>
          <MaterialCommunityIcons name="gas-station" size={24} color="#ff9800" />
          <View style={styles.gasInfo}>
            <Text style={styles.gasTitle}>Need Gas?</Text>
            <Text style={styles.gasText}>Get Base Sepolia ETH from faucet</Text>
          </View>
          <TouchableOpacity>
            <MaterialCommunityIcons name="open-in-new" size={20} color="#00d4ff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function ActionButton({ icon, label, colors }) {
  return (
    <TouchableOpacity style={styles.actionButton}>
      <LinearGradient colors={colors} style={styles.actionGradient}>
        <MaterialCommunityIcons name={icon} size={32} color="#fff" />
        <Text style={styles.actionLabel}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: { flex: 1 },
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
  gasWidget: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.2)',
  },
  gasInfo: { flex: 1 },
  gasTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  gasText: { fontSize: 12, color: '#888', marginTop: 2 },
});