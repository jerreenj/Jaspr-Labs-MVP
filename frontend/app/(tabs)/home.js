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
  const [balance, setBalance] = useState(10000);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const address = await AsyncStorage.getItem('wallet_address');
      const userEmail = await AsyncStorage.getItem('user_email');
      
      // Initialize demo balance if not set
      const savedBalance = await AsyncStorage.getItem('demo_balance');
      if (!savedBalance) {
        await AsyncStorage.setItem('demo_balance', '10000');
        setBalance(10000);
      } else {
        setBalance(parseFloat(savedBalance));
      }
      
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
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/');
          }
        }
      ]
    );
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
                <Text style={styles.greeting}>Welcome back</Text>
                <Text style={styles.username}>{email.split('@')[0]}</Text>
              </View>
              <TouchableOpacity onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Demo Balance</Text>
              <Text style={styles.balance}>${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={styles.balanceSubtext}>10,000 USDC available for trading</Text>
            </View>

            <View style={styles.walletCard}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="wallet" size={20} color="#00FFF0" />
                <Text style={styles.cardTitle}>Wallet Address</Text>
              </View>
              <TouchableOpacity onPress={copyAddress} style={styles.addressRow}>
                <Text style={styles.address} numberOfLines={1}>
                  {walletAddress ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-10)}` : 'Loading...'}
                </Text>
                <MaterialCommunityIcons name="content-copy" size={18} color="#00FFF0" />
              </TouchableOpacity>
              <View style={styles.networkBadge}>
                <View style={styles.dot} />
                <Text style={styles.networkText}>Base Sepolia Testnet</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <QuickAction 
                icon="chart-line" 
                label="Markets" 
                color="#00FFF0"
                onPress={() => router.push('/(tabs)/markets')} 
              />
              <QuickAction 
                icon="swap-horizontal" 
                label="Swap" 
                color="#00B8D4"
                onPress={() => router.push('/(tabs)/swap')} 
              />
              <QuickAction 
                icon="currency-usd" 
                label="Trade" 
                color="#0091EA"
                onPress={() => router.push('/(tabs)/trade')} 
              />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 60, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' },
  username: { fontSize: 28, fontWeight: '700', color: '#FFF', marginTop: 4 },
  balanceCard: {
    backgroundColor: 'rgba(0, 255, 240, 0.05)',
    borderRadius: 20,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 240, 0.2)',
  },
  balanceLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' },
  balance: { fontSize: 56, fontWeight: '700', color: '#FFF', marginTop: 8 },
  balanceSubtext: { fontSize: 14, color: '#00FFF0', marginTop: 8 },
  walletCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  address: { fontSize: 13, color: '#FFF', fontFamily: 'monospace', flex: 1 },
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
  networkText: { fontSize: 12, color: '#00FFF0', fontWeight: '500' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: { fontSize: 14, color: '#FFF', fontWeight: '600' },
});