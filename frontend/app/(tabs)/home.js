import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal, Pressable, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Token logos from CoinGecko
const TOKEN_LOGOS = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  TON: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  DOT: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  UNI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-logo.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
  SHIB: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
  TRX: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
  APT: 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
  PEPE: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
  ARB: 'https://assets.coingecko.com/coins/images/16547/small/arb.jpg',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  DAI: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
  WBTC: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
  ICP: 'https://assets.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png',
};

export default function HomePage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [totalValue, setTotalValue] = useState(10000);
  const [holdings, setHoldings] = useState({});
  const [prices, setPrices] = useState({});
  const [purchaseInfo, setPurchaseInfo] = useState({});
  const [swapCount, setSwapCount] = useState(0);
  const [recentTrades, setRecentTrades] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = useCallback(async () => {
    try {
      const demoBalance = await AsyncStorage.getItem('demo_balance');
      const usdcBalance = demoBalance ? parseFloat(demoBalance) : 10000;
      
      const storedHoldings = await AsyncStorage.getItem('token_holdings');
      const tokenHoldings = storedHoldings ? JSON.parse(storedHoldings) : {};
      
      // Load purchase info
      const storedPurchaseInfo = await AsyncStorage.getItem('purchase_info');
      const purchaseData = storedPurchaseInfo ? JSON.parse(storedPurchaseInfo) : {};
      setPurchaseInfo(purchaseData);
      
      const count = await AsyncStorage.getItem('swap_count');
      setSwapCount(count ? parseInt(count) : 0);
      
      const history = await AsyncStorage.getItem('tx_history');
      const txHistory = history ? JSON.parse(history) : [];
      setRecentTrades(txHistory.slice(0, 3));
      
      const tokenIds = ['ethereum', 'bitcoin', 'solana', 'binancecoin', 'ripple', 'cardano', 'dogecoin', 'avalanche-2'];
      
      // Fallback prices
      const FALLBACK_PRICES = {
        ETH: 3650, BTC: 96500, SOL: 185, BNB: 695, XRP: 2.35, ADA: 0.98, DOGE: 0.38, AVAX: 38.5,
        MATIC: 0.52, DOT: 7.2, LINK: 14.5, UNI: 12.8, LTC: 108, SHIB: 0.000022, TRX: 0.25,
        TON: 5.8, NEAR: 5.2, APT: 9.8, PEPE: 0.000018, ARB: 0.92, USDT: 1, DAI: 1, WBTC: 96400, ICP: 11.5,
      };
      
      let priceMap = { ...FALLBACK_PRICES };
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const priceData = await response.json();
          priceMap = {
            ...FALLBACK_PRICES,
            ETH: priceData.ethereum?.usd || FALLBACK_PRICES.ETH,
            BTC: priceData.bitcoin?.usd || FALLBACK_PRICES.BTC,
            SOL: priceData.solana?.usd || FALLBACK_PRICES.SOL,
            BNB: priceData.binancecoin?.usd || FALLBACK_PRICES.BNB,
            XRP: priceData.ripple?.usd || FALLBACK_PRICES.XRP,
            ADA: priceData.cardano?.usd || FALLBACK_PRICES.ADA,
            DOGE: priceData.dogecoin?.usd || FALLBACK_PRICES.DOGE,
            AVAX: priceData['avalanche-2']?.usd || FALLBACK_PRICES.AVAX,
          };
        }
      } catch (e) {
        // Use fallback prices silently
      }
      
      setPrices(priceMap);
      
      let total = usdcBalance;
      Object.entries(tokenHoldings).forEach(([symbol, amount]) => {
        if (amount > 0 && priceMap[symbol]) {
          total += amount * priceMap[symbol];
        }
      });
      
      setTotalValue(total);
      
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
    setShowMenu(false);
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
            router.replace('/auth');
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
      <ScrollView 
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
        }
      >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Welcome</Text>
                <Text style={styles.subGreeting}>Your portfolio is ready</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuBtn}>
                <MaterialCommunityIcons name="menu" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Portfolio Value Card */}
            <View style={styles.portfolioCard}>
              <View style={styles.portfolioGradient}>
                <Text style={styles.portfolioLabel}>Total Portfolio</Text>
                <Text style={styles.portfolioValue}>${formatValue(totalValue)}</Text>
                <View style={styles.networkRow}>
                  <View style={styles.networkDot} />
                  <Text style={styles.networkText}>Demo Account • Base Sepolia</Text>
                </View>
              </View>
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
                  <HoldingItem 
                    key={symbol}
                    symbol={symbol}
                    amount={amount}
                    value={value}
                    price={prices[symbol]}
                    purchaseCost={purchaseInfo[symbol]?.totalCost}
                    onPress={() => {
                      if (symbol !== 'USDC') {
                        const coinIds = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin', XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', AVAX: 'avalanche-2', TON: 'the-open-network', DOT: 'polkadot', LINK: 'chainlink', MATIC: 'matic-network', UNI: 'uniswap', LTC: 'litecoin', SHIB: 'shiba-inu', TRX: 'tron', NEAR: 'near', APT: 'aptos', PEPE: 'pepe', ARB: 'arbitrum' };
                        router.push({
                          pathname: '/(tabs)/trade',
                          params: { coin: coinIds[symbol] || symbol.toLowerCase(), symbol, name: symbol, logo: TOKEN_LOGOS[symbol] }
                        });
                      }
                    }}
                  />
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
                  <Text style={styles.emptyButtonText}>Browse Markets</Text>
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
                        { backgroundColor: trade.type === 'buy' ? 'rgba(0,255,163,0.15)' : trade.type === 'sell' ? 'rgba(255,68,68,0.15)' : 'rgba(0,255,240,0.15)' }
                      ]}>
                        <MaterialCommunityIcons 
                          name={trade.type === 'buy' ? 'arrow-bottom-left' : trade.type === 'sell' ? 'arrow-top-right' : 'swap-horizontal'} 
                          size={18} 
                          color={trade.type === 'buy' ? '#00FFA3' : trade.type === 'sell' ? '#FF4444' : '#00FFF0'} 
                        />
                      </View>
                      <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>
                          {trade.type === 'buy' ? 'Bought' : trade.type === 'sell' ? 'Sold' : 'Swapped'} {trade.symbol || trade.toToken}
                        </Text>
                        <Text style={styles.activityTime}>
                          {new Date(trade.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={[
                        styles.activityAmount,
                        { color: trade.type === 'buy' ? '#00FFA3' : trade.type === 'sell' ? '#FF4444' : '#00FFF0' }
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

      {/* Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuContainer}>
            <View style={styles.menuCard}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  router.push('/(tabs)/history');
                }}
              >
                <MaterialCommunityIcons name="history" size={24} color="#FFF" />
                <Text style={styles.menuItemText}>Transaction History</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  router.push('/(tabs)/settings');
                }}
              >
                <MaterialCommunityIcons name="cog" size={24} color="#888" />
                <Text style={styles.menuItemText}>Settings</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleLogout}
              >
                <MaterialCommunityIcons name="logout" size={24} color="#FF4444" />
                <Text style={[styles.menuItemText, { color: '#FF4444' }]}>Logout</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// HoldingItem component with real token logos
function HoldingItem({ symbol, amount, value, price, purchaseCost, onPress }) {
  const [imageError, setImageError] = useState(false);
  const logo = TOKEN_LOGOS[symbol];
  
  const getTokenColor = (sym) => {
    const colors = {
      USDC: '#2775CA', BTC: '#F7931A', ETH: '#627EEA', SOL: '#00FFA3',
      BNB: '#F3BA2F', XRP: '#23292F', ADA: '#0033AD', DOGE: '#C3A634',
      AVAX: '#E84142', TON: '#0098EA', MATIC: '#8247E5', DOT: '#E6007A',
      LINK: '#2A5ADA', UNI: '#FF007A', LTC: '#345D9D', SHIB: '#FFA409',
      TRX: '#FF0013', NEAR: '#00EC97', APT: '#4CC2A4', PEPE: '#3B7A57',
      ARB: '#28A0F0', USDT: '#50AF95', DAI: '#F5AC37', WBTC: '#F7931A',
      ICP: '#292A2E',
    };
    return colors[sym] || '#FFF';
  };
  
  // Calculate profit/loss - only if we have valid current value and purchase cost
  const hasValidPrice = price && price > 0 && value > 0;
  const hasPurchaseInfo = purchaseCost && purchaseCost > 0;
  const pnl = (hasValidPrice && hasPurchaseInfo) ? value - purchaseCost : 0;
  const pnlPercent = (hasValidPrice && hasPurchaseInfo) ? ((value - purchaseCost) / purchaseCost) * 100 : 0;
  const showPnl = hasValidPrice && hasPurchaseInfo;
  
  return (
    <TouchableOpacity 
      style={styles.holdingItem}
      onPress={onPress}
      activeOpacity={symbol === 'USDC' ? 1 : 0.7}
    >
      <View style={styles.holdingLeft}>
        <View style={styles.tokenLogoContainer}>
          {logo && !imageError ? (
            <Image 
              source={{ uri: logo }} 
              style={styles.tokenLogo}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.tokenIconFallback, { backgroundColor: `${getTokenColor(symbol)}25` }]}>
              <Text style={[styles.tokenIconText, { color: getTokenColor(symbol) }]}>
                {symbol[0]}
              </Text>
            </View>
          )}
        </View>
        <View>
          <Text style={styles.holdingSymbol}>{symbol}</Text>
          <Text style={styles.holdingAmount}>
            {symbol === 'USDC' ? amount.toFixed(2) : amount.toFixed(6)}
          </Text>
        </View>
      </View>
      <View style={styles.holdingRight}>
        <Text style={styles.holdingValue}>${value.toFixed(2)}</Text>
        {symbol !== 'USDC' && showPnl && (
          <View style={styles.pnlRow}>
            <Text style={[styles.holdingPnl, pnl >= 0 ? styles.pnlPositive : styles.pnlNegative]}>
              {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
            </Text>
            <Text style={styles.holdingCost}>
              Cost: ${purchaseCost.toFixed(2)}
            </Text>
          </View>
        )}
        {symbol !== 'USDC' && !showPnl && hasPurchaseInfo && (
          <Text style={styles.holdingPrice}>Loading...</Text>
        )}
        {symbol !== 'USDC' && !hasPurchaseInfo && (
          <Text style={styles.holdingPrice}>
            @${price?.toLocaleString() || '0'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 50, paddingBottom: 20, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: { fontSize: 28, fontWeight: '700', color: '#FFF', fontFamily: 'Inter_700Bold' },
  subGreeting: { fontSize: 14, color: '#888', marginTop: 4 },
  menuBtn: { 
    padding: 8, 
    backgroundColor: '#111',
    borderRadius: 12,
  },
  portfolioCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
    backgroundColor: '#111',
  },
  portfolioGradient: {
    padding: 28,
    alignItems: 'center',
  },
  portfolioLabel: { fontSize: 14, color: '#888' },
  portfolioValue: { fontSize: 40, fontWeight: '700', color: '#FFF', marginTop: 8, fontFamily: 'Inter_700Bold' },
  networkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  networkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C853' },
  networkText: { fontSize: 13, color: '#888' },
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
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  holdingLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tokenLogoContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  tokenLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  tokenIconFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  pnlRow: { alignItems: 'flex-end', marginTop: 2 },
  holdingPnl: { fontSize: 12, fontWeight: '600' },
  pnlPositive: { color: '#00C853' },
  pnlNegative: { color: '#FF3B30' },
  holdingCost: { fontSize: 10, color: '#666', marginTop: 1 },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 40,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#666', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#444', marginTop: 8, textAlign: 'center' },
  emptyButton: { marginTop: 20, borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFF' },
  emptyButtonGradient: { paddingHorizontal: 28, paddingVertical: 14 },
  emptyButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },
  activityContainer: { gap: 8, marginTop: 12 },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
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
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#FFF', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  // Menu Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  menuContainer: {},
  menuCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 8,
    minWidth: 220,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  menuItemText: { flex: 1, fontSize: 16, color: '#FFF', fontWeight: '500' },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
});
