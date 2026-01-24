import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

export default function HomePage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState('');
  const [email, setEmail] = useState('');
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
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  const copyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert('Copied!', 'Address copied to clipboard');
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000428', '#004e92']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FFF0" />
          }
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Welcome</Text>
                <Text style={styles.username}>{email.split('@')[0]}</Text>
              </View>
              <TouchableOpacity onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.walletCard}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="wallet" size={24} color="#00FFF0" />
                <Text style={styles.cardTitle}>Wallet Address</Text>
              </View>
              <TouchableOpacity onPress={copyAddress} style={styles.addressRow}>
                <Text style={styles.address} numberOfLines={1}>
                  {walletAddress ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-10)}` : 'Loading...'}
                </Text>
                <MaterialCommunityIcons name="content-copy" size={20} color="#00FFF0" />
              </TouchableOpacity>
              <View style={styles.networkBadge}>
                <View style={styles.dot} />
                <Text style={styles.networkText}>Base Sepolia</Text>
              </View>
            </View>

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balance}>$0.00</Text>
              <Text style={styles.balanceChange}>+0.00%</Text>
            </View>

            <View style={styles.quickActions}>
              <QuickAction icon="swap-horizontal" label="Swap" onPress={() => {}} />
              <QuickAction icon="currency-usd" label="Trade" onPress={() => {}} />
              <QuickAction icon="chart-line" label="Markets" onPress={() => {}} />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

function QuickAction({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={styles.actionIcon}>
        <MaterialCommunityIcons name={icon} size={24} color="#00FFF0" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' },
  username: { fontSize: 24, fontWeight: '700', color: '#FFF', marginTop: 4 },
  walletCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 240, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  address: { fontSize: 14, color: '#FFF', fontFamily: 'monospace', flex: 1 },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FFF0',
  },
  networkText: { fontSize: 13, color: '#00FFF0', fontWeight: '500' },
  balanceCard: {
    backgroundColor: 'rgba(0, 255, 240, 0.05)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 240, 0.2)',
  },
  balanceLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' },
  balance: { fontSize: 48, fontWeight: '700', color: '#FFF', marginTop: 8 },
  balanceChange: { fontSize: 16, color: '#00FFF0', marginTop: 4 },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 255, 240, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: { fontSize: 13, color: '#FFF', fontWeight: '500' },
});