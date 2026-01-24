import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

export default function HomePage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState('');
  const [username, setUsername] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [totalValue, setTotalValue] = useState(10000);
  const [holdings, setHoldings] = useState({
    USDC: 10000,
    ETH: 0,
    BTC: 0,
  });
  const [prices, setPrices] = useState({
    ETH: 3000,
    BTC: 90000,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const address = await AsyncStorage.getItem('wallet_address');
      const savedUsername = await AsyncStorage.getItem('username');
      
      // Load demo balance
      const demoBalance = await AsyncStorage.getItem('demo_balance');
      const usdcBalance = demoBalance ? parseFloat(demoBalance) : 10000;
      
      // Load token holdings
      const storedHoldings = await AsyncStorage.getItem('token_holdings');
      const tokenHoldings = storedHoldings ? JSON.parse(storedHoldings) : {};
      
      // Fetch live prices
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd'
        );
        const priceData = await response.json();
        setPrices({
          ETH: priceData.ethereum?.usd || 3000,
          BTC: priceData.bitcoin?.usd || 90000,
        });
        
        // Calculate total portfolio value
        const ethValue = (tokenHoldings.ETH || 0) * (priceData.ethereum?.usd || 3000);
        const btcValue = (tokenHoldings.BTC || 0) * (priceData.bitcoin?.usd || 90000);
        setTotalValue(usdcBalance + ethValue + btcValue);
      } catch (e) {
        setTotalValue(usdcBalance);
      }
      
      setHoldings({
        USDC: usdcBalance,
        ETH: tokenHoldings.ETH || 0,
        BTC: tokenHoldings.BTC || 0,
      });
      
      setWalletAddress(address || '');
      setUsername(savedUsername || 'User');
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

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

  // Format large numbers with commas
  const formatValue = (value) => {
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
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
                <Text style={styles.username}>{username}</Text>
              </View>
              <TouchableOpacity onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>

            {/* Total Portfolio Value */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Total Portfolio Value</Text>
              <Text style={styles.balance}>${formatValue(totalValue)}</Text>
              <Text style={styles.balanceSubtext}>Base Sepolia Testnet</Text>
            </View>

            {/* Token Holdings */}
            <Text style={styles.sectionTitle}>Holdings</Text>
            <View style={styles.holdingsContainer}>
              <HoldingItem 
                symbol="USDC" 
                name="USD Coin" 
                balance={holdings.USDC}
                value={holdings.USDC}
                color="#2775CA"
              />
              {holdings.ETH > 0 && (
                <HoldingItem 
                  symbol="ETH" 
                  name="Ethereum" 
                  balance={holdings.ETH}
                  value={holdings.ETH * prices.ETH}
                  price={prices.ETH}
                  color="#627EEA"
                />
              )}
              {holdings.BTC > 0 && (
                <HoldingItem 
                  symbol="BTC" 
                  name="Bitcoin" 
                  balance={holdings.BTC}
                  value={holdings.BTC * prices.BTC}
                  price={prices.BTC}
                  color="#F7931A"
                />
              )}
            </View>

            {/* Wallet Card */}
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

            {/* Quick Actions */}
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

function HoldingItem({ symbol, name, balance, value, price, color }) {
  return (
    <View style={styles.holdingItem}>
      <View style={styles.holdingLeft}>
        <View style={[styles.tokenIcon, { backgroundColor: `${color}30` }]}>
          <Text style={[styles.tokenIconText, { color }]}>{symbol[0]}</Text>
        </View>
        <View>
          <Text style={styles.holdingSymbol}>{symbol}</Text>
          <Text style={styles.holdingName}>{name}</Text>
        </View>
      </View>
      <View style={styles.holdingRight}>
        <Text style={styles.holdingBalance}>
          {balance.toFixed(symbol === 'USDC' ? 2 : 6)}
        </Text>
        <Text style={styles.holdingValue}>${value.toFixed(2)}</Text>
      </View>
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
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 240, 0.2)',
  },
  balanceLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' },
  balance: { fontSize: 48, fontWeight: '700', color: '#FFF', marginTop: 8 },
  balanceSubtext: { fontSize: 14, color: '#00FFF0', marginTop: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  holdingsContainer: {
    gap: 8,
    marginBottom: 24,
  },
  holdingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  holdingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  holdingSymbol: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  holdingName: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginTop: 2 },
  holdingRight: {
    alignItems: 'flex-end',
  },
  holdingBalance: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  holdingValue: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginTop: 2 },
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
