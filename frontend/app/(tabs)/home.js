import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomePage() {
  const router = useRouter();
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

  const formatValue = (value) => {
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const hasHoldings = holdings.USDC > 0 || holdings.ETH > 0 || holdings.BTC > 0;

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
              <Text style={styles.greeting}>Welcome</Text>
              <TouchableOpacity onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={24} color="#FF4444" />
              </TouchableOpacity>
            </View>

            {/* Total Portfolio Value */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Portfolio Value</Text>
              <Text style={styles.balance}>${formatValue(totalValue)}</Text>
              <Text style={styles.balanceSubtext}>Demo Account • Base Sepolia</Text>
            </View>

            {/* Portfolio Holdings */}
            <Text style={styles.sectionTitle}>Portfolio</Text>
            {hasHoldings ? (
              <View style={styles.holdingsContainer}>
                {holdings.USDC > 0 && (
                  <HoldingItem 
                    symbol="USDC" 
                    name="USD Coin" 
                    balance={holdings.USDC}
                    value={holdings.USDC}
                    color="#2775CA"
                    onPress={() => router.push('/(tabs)/markets')}
                  />
                )}
                {holdings.ETH > 0 && (
                  <HoldingItem 
                    symbol="ETH" 
                    name="Ethereum" 
                    balance={holdings.ETH}
                    value={holdings.ETH * prices.ETH}
                    price={prices.ETH}
                    change="+2.4%"
                    color="#627EEA"
                    onPress={() => router.push({ pathname: '/(tabs)/trade', params: { coin: 'ethereum' }})}
                  />
                )}
                {holdings.BTC > 0 && (
                  <HoldingItem 
                    symbol="BTC" 
                    name="Bitcoin" 
                    balance={holdings.BTC}
                    value={holdings.BTC * prices.BTC}
                    price={prices.BTC}
                    change="+1.2%"
                    color="#F7931A"
                    onPress={() => router.push({ pathname: '/(tabs)/trade', params: { coin: 'bitcoin' }})}
                  />
                )}
              </View>
            ) : (
              <View style={styles.emptyPortfolio}>
                <MaterialCommunityIcons name="chart-line" size={48} color="#333" />
                <Text style={styles.emptyTitle}>No tokens yet</Text>
                <Text style={styles.emptySubtext}>Go to Markets to start trading</Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => router.push('/(tabs)/markets')}
                >
                  <Text style={styles.emptyButtonText}>Browse Markets</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Assets</Text>
                <Text style={styles.statValue}>
                  {[holdings.USDC > 0, holdings.ETH > 0, holdings.BTC > 0].filter(Boolean).length}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Network</Text>
                <Text style={[styles.statValue, { color: '#00FFF0', fontSize: 14 }]}>Base Sepolia</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

function HoldingItem({ symbol, name, balance, value, price, change, color, onPress }) {
  return (
    <TouchableOpacity style={styles.holdingItem} onPress={onPress} activeOpacity={0.7}>
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
  greeting: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  balanceCard: {
    backgroundColor: 'rgba(0, 255, 240, 0.05)',
    borderRadius: 20,
    padding: 32,
    marginBottom: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 240, 0.2)',
  },
  balanceLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' },
  balance: { fontSize: 44, fontWeight: '700', color: '#FFF', marginTop: 8 },
  balanceSubtext: { fontSize: 14, color: '#00FFF0', marginTop: 8 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  holdingsContainer: {
    gap: 10,
    marginBottom: 24,
  },
  holdingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  holdingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tokenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: {
    fontSize: 20,
    fontWeight: '700',
  },
  holdingSymbol: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  holdingName: { fontSize: 13, color: 'rgba(255, 255, 255, 0.5)', marginTop: 2 },
  holdingRight: {
    alignItems: 'flex-end',
  },
  holdingBalance: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  holdingValue: { fontSize: 13, color: 'rgba(255, 255, 255, 0.5)', marginTop: 2 },
  emptyPortfolio: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 40,
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#666', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#444', marginTop: 8 },
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 255, 240, 0.1)',
    borderRadius: 8,
  },
  emptyButtonText: { color: '#00FFF0', fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#FFF' },
});
