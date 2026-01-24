import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomePage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [totalValue, setTotalValue] = useState(10000);
  const [holdings, setHoldings] = useState({});
  const [prices, setPrices] = useState({});
  const [swapCount, setSwapCount] = useState(0);
  const [recentTrades, setRecentTrades] = useState([]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = useCallback(async () => {
    try {
      // Load demo balance
      const demoBalance = await AsyncStorage.getItem('demo_balance');
      const usdcBalance = demoBalance ? parseFloat(demoBalance) : 10000;
      
      // Load token holdings
      const storedHoldings = await AsyncStorage.getItem('token_holdings');
      const tokenHoldings = storedHoldings ? JSON.parse(storedHoldings) : {};
      
      // Load swap count
      const count = await AsyncStorage.getItem('swap_count');
      setSwapCount(count ? parseInt(count) : 0);
      
      // Load recent trades
      const history = await AsyncStorage.getItem('tx_history');
      const txHistory = history ? JSON.parse(history) : [];
      setRecentTrades(txHistory.slice(0, 3));
      
      // Fetch live prices for all held tokens
      const tokenIds = ['ethereum', 'bitcoin', 'solana', 'binancecoin', 'ripple', 'cardano', 'dogecoin', 'avalanche-2'];
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
        );
        const priceData = await response.json();
        
        const priceMap = {
          ETH: priceData.ethereum?.usd || 3000,
          BTC: priceData.bitcoin?.usd || 90000,
          SOL: priceData.solana?.usd || 130,
          BNB: priceData.binancecoin?.usd || 600,
          XRP: priceData.ripple?.usd || 0.5,
          ADA: priceData.cardano?.usd || 0.5,
          DOGE: priceData.dogecoin?.usd || 0.08,
          AVAX: priceData['avalanche-2']?.usd || 35,
        };
        
        setPrices(priceMap);
        
        // Calculate total portfolio value
        let total = usdcBalance;
        Object.entries(tokenHoldings).forEach(([symbol, amount]) => {
          if (amount > 0 && priceMap[symbol]) {
            total += amount * priceMap[symbol];
          }
        });
        
        setTotalValue(total);
      } catch (e) {
        setTotalValue(usdcBalance);
      }
      
      // Build holdings with USDC
      const allHoldings = { USDC: usdcBalance, ...tokenHoldings };
      setHoldings(allHoldings);
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

  const getTokenColor = (symbol) => {
    const colors = {
      USDC: '#2775CA', BTC: '#F7931A', ETH: '#627EEA', SOL: '#00FFA3',
      BNB: '#F3BA2F', XRP: '#23292F', ADA: '#0033AD', DOGE: '#C3A634',
      AVAX: '#E84142', TON: '#0098EA', MATIC: '#8247E5',
    };
    return colors[symbol] || '#00FFF0';
  };

  const holdingsArray = Object.entries(holdings)
    .filter(([_, amount]) => amount > 0 && isFinite(amount))
    .map(([symbol, amount]) => ({
      symbol,
      amount,
      value: symbol === 'USDC' ? amount : amount * (prices[symbol] || 0),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a1a', '#0d1f3c', '#0a0a1a']} style={styles.gradient}>
        <ScrollView 
          style={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FFF0" />
          }
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Welcome</Text>
                <Text style={styles.subGreeting}>Your portfolio is ready</Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <MaterialCommunityIcons name="logout" size={22} color="#FF4444" />
              </TouchableOpacity>
            </View>

            {/* Portfolio Value Card */}
            <View style={styles.portfolioCard}>
              <LinearGradient
                colors={['rgba(0, 255, 240, 0.1)', 'rgba(0, 184, 212, 0.05)']}
                style={styles.portfolioGradient}
              >
                <Text style={styles.portfolioLabel}>Total Portfolio</Text>
                <Text style={styles.portfolioValue}>${formatValue(totalValue)}</Text>
                <View style={styles.networkRow}>
                  <View style={styles.networkDot} />
                  <Text style={styles.networkText}>Demo Account • Base Sepolia</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Trade Rewards Banner */}
            {swapCount < 10 && (
              <TouchableOpacity 
                style={styles.rewardCard}
                onPress={() => router.push('/(tabs)/markets')}
              >
                <View style={styles.rewardIcon}>
                  <MaterialCommunityIcons name="gift" size={24} color="#FFD700" />
                </View>
                <View style={styles.rewardContent}>
                  <Text style={styles.rewardTitle}>Trade Rewards Active!</Text>
                  <Text style={styles.rewardSubtitle}>
                    Get $5 bonus per trade • {10 - swapCount} trades remaining
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#FFD700" />
              </TouchableOpacity>
            )}

            {/* Holdings Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Portfolio</Text>
              <Text style={styles.sectionCount}>{holdingsArray.length} assets</Text>
            </View>
            
            {holdingsArray.length > 0 ? (
              <View style={styles.holdingsContainer}>
                {holdingsArray.map(({ symbol, amount, value }) => (
                  <TouchableOpacity 
                    key={symbol}
                    style={styles.holdingItem}
                    onPress={() => {
                      if (symbol !== 'USDC') {
                        const coinIds = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin' };
                        router.push({
                          pathname: '/(tabs)/trade',
                          params: { coin: coinIds[symbol] || symbol.toLowerCase(), symbol, name: symbol }
                        });
                      }
                    }}
                    activeOpacity={symbol === 'USDC' ? 1 : 0.7}
                  >
                    <View style={styles.holdingLeft}>
                      <View style={[styles.tokenIcon, { backgroundColor: `${getTokenColor(symbol)}25` }]}>
                        <Text style={[styles.tokenIconText, { color: getTokenColor(symbol) }]}>
                          {symbol[0]}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.holdingSymbol}>{symbol}</Text>
                        <Text style={styles.holdingAmount}>
                          {symbol === 'USDC' ? amount.toFixed(2) : amount.toFixed(8)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.holdingRight}>
                      <Text style={styles.holdingValue}>${value.toFixed(2)}</Text>
                      {symbol !== 'USDC' && (
                        <Text style={styles.holdingPrice}>
                          @${prices[symbol]?.toLocaleString() || '0'}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="chart-line-variant" size={56} color="#333" />
                <Text style={styles.emptyTitle}>Start Trading</Text>
                <Text style={styles.emptySubtitle}>
                  Go to Markets to buy your first crypto
                </Text>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => router.push('/(tabs)/markets')}
                >
                  <LinearGradient
                    colors={['#00FFF0', '#00B8D4']}
                    style={styles.emptyButtonGradient}
                  >
                    <Text style={styles.emptyButtonText}>Browse Markets</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Recent Activity */}
            {recentTrades.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Activity</Text>
                <View style={styles.activityContainer}>
                  {recentTrades.map((trade, index) => (
                    <View key={index} style={styles.activityItem}>
                      <View style={[
                        styles.activityIcon,
                        { backgroundColor: trade.type === 'buy' ? 'rgba(0,255,163,0.15)' : 'rgba(255,68,68,0.15)' }
                      ]}>
                        <MaterialCommunityIcons 
                          name={trade.type === 'buy' ? 'arrow-bottom-left' : 'arrow-top-right'} 
                          size={18} 
                          color={trade.type === 'buy' ? '#00FFA3' : '#FF4444'} 
                        />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>
                          {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.symbol}
                        </Text>
                        <Text style={styles.activityTime}>
                          {new Date(trade.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={[
                        styles.activityAmount,
                        { color: trade.type === 'buy' ? '#00FFA3' : '#FF4444' }
                      ]}>
                        {trade.type === 'buy' ? '-' : '+'}${trade.usdAmount?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="swap-horizontal" size={24} color="#00FFF0" />
                <Text style={styles.statValue}>{swapCount}</Text>
                <Text style={styles.statLabel}>Total Trades</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialCommunityIcons name="chart-areaspline" size={24} color="#00FFA3" />
                <Text style={styles.statValue}>{holdingsArray.length}</Text>
                <Text style={styles.statLabel}>Assets</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 50, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  subGreeting: { fontSize: 14, color: '#888', marginTop: 4 },
  logoutBtn: { padding: 8 },
  portfolioCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 240, 0.2)',
  },
  portfolioGradient: {
    padding: 28,
    alignItems: 'center',
  },
  portfolioLabel: { fontSize: 14, color: '#888' },
  portfolioValue: { fontSize: 40, fontWeight: '700', color: '#FFF', marginTop: 8 },
  networkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  networkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00FFA3' },
  networkText: { fontSize: 13, color: '#00FFF0' },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  rewardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rewardContent: { flex: 1 },
  rewardTitle: { fontSize: 15, fontWeight: '700', color: '#FFD700' },
  rewardSubtitle: { fontSize: 13, color: '#B8A000', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#FFF' },
  sectionCount: { fontSize: 14, color: '#666' },
  holdingsContainer: { gap: 10 },
  holdingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  holdingLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tokenIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: { fontSize: 20, fontWeight: '700' },
  holdingSymbol: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  holdingAmount: { fontSize: 13, color: '#888', marginTop: 2 },
  holdingRight: { alignItems: 'flex-end' },
  holdingValue: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  holdingPrice: { fontSize: 12, color: '#666', marginTop: 2 },
  emptyState: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 40,
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#666', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#444', marginTop: 8, textAlign: 'center' },
  emptyButton: { marginTop: 20, borderRadius: 12, overflow: 'hidden' },
  emptyButtonGradient: { paddingHorizontal: 28, paddingVertical: 14 },
  emptyButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },
  activityContainer: { gap: 8, marginTop: 12 },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 14,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  activityTime: { fontSize: 12, color: '#666', marginTop: 2 },
  activityAmount: { fontSize: 15, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#FFF', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
});
