import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

// Real token logos from CoinGecko
const TOKENS = [
  { 
    symbol: 'BTC', 
    name: 'Bitcoin', 
    coingeckoId: 'bitcoin',
    logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
  },
  { 
    symbol: 'ETH', 
    name: 'Ethereum', 
    coingeckoId: 'ethereum',
    logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
  },
  { 
    symbol: 'SOL', 
    name: 'Solana', 
    coingeckoId: 'solana',
    logo: 'https://assets.coingecko.com/coins/images/4128/small/solana.png'
  },
  { 
    symbol: 'BNB', 
    name: 'BNB', 
    coingeckoId: 'binancecoin',
    logo: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png'
  },
  { 
    symbol: 'XRP', 
    name: 'XRP', 
    coingeckoId: 'ripple',
    logo: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png'
  },
  { 
    symbol: 'ADA', 
    name: 'Cardano', 
    coingeckoId: 'cardano',
    logo: 'https://assets.coingecko.com/coins/images/975/small/cardano.png'
  },
  { 
    symbol: 'DOGE', 
    name: 'Dogecoin', 
    coingeckoId: 'dogecoin',
    logo: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png'
  },
  { 
    symbol: 'AVAX', 
    name: 'Avalanche', 
    coingeckoId: 'avalanche-2',
    logo: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png'
  },
  { 
    symbol: 'TON', 
    name: 'Toncoin', 
    coingeckoId: 'the-open-network',
    logo: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png'
  },
  { 
    symbol: 'MATIC', 
    name: 'Polygon', 
    coingeckoId: 'matic-network',
    logo: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png'
  },
];

// Fallback prices
const FALLBACK_PRICES = {
  bitcoin: { usd: 89500, usd_24h_change: 2.5 },
  ethereum: { usd: 2950, usd_24h_change: 1.8 },
  solana: { usd: 128, usd_24h_change: 3.2 },
  binancecoin: { usd: 595, usd_24h_change: -0.5 },
  ripple: { usd: 0.52, usd_24h_change: 1.2 },
  cardano: { usd: 0.48, usd_24h_change: -1.1 },
  dogecoin: { usd: 0.082, usd_24h_change: 4.5 },
  'avalanche-2': { usd: 34.5, usd_24h_change: 2.1 },
  'the-open-network': { usd: 5.2, usd_24h_change: 0.8 },
  'matic-network': { usd: 0.45, usd_24h_change: -0.3 },
};

export default function MarketsPage() {
  const router = useRouter();
  const [tokens, setTokens] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPrices = async () => {
    try {
      setLoading(true);
      const ids = TOKENS.map(t => t.coingeckoId).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      if (!response.ok) throw new Error('API error');
      
      const data = await response.json();
      
      const pricesData = TOKENS.map(token => ({
        ...token,
        price: data[token.coingeckoId]?.usd || FALLBACK_PRICES[token.coingeckoId]?.usd || 0,
        change24h: data[token.coingeckoId]?.usd_24h_change || FALLBACK_PRICES[token.coingeckoId]?.usd_24h_change || 0,
      }));
      
      setTokens(pricesData);
    } catch (error) {
      console.error('Price error:', error);
      // Use fallback prices
      const fallbackData = TOKENS.map(token => ({
        ...token,
        price: FALLBACK_PRICES[token.coingeckoId]?.usd || 0,
        change24h: FALLBACK_PRICES[token.coingeckoId]?.usd_24h_change || 0,
      }));
      setTokens(fallbackData);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPrices();
  };

  const filteredTokens = tokens.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const handleTokenPress = (token) => {
    router.push({
      pathname: '/(tabs)/trade',
      params: { 
        coin: token.coingeckoId,
        symbol: token.symbol,
        name: token.name,
        logo: token.logo,
      }
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a1a', '#0d1f3c', '#0a0a1a']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.title}>Markets</Text>
          <Text style={styles.subtitle}>Tap any coin to trade</Text>
        </View>

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tokens..."
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView 
          style={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FFF0" />
          }
        >
          <View style={styles.tokenList}>
            {loading && tokens.length === 0 ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading prices...</Text>
              </View>
            ) : filteredTokens.length > 0 ? (
              filteredTokens.map((token, index) => (
                <TokenItem 
                  key={index} 
                  token={token} 
                  onPress={() => handleTokenPress(token)}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No tokens found</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

function TokenItem({ token, onPress }) {
  const isPositive = token.change24h >= 0;
  const [imageError, setImageError] = useState(false);
  
  return (
    <TouchableOpacity style={styles.tokenItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.tokenInfo}>
        <View style={styles.logoContainer}>
          {!imageError ? (
            <Image 
              source={{ uri: token.logo }} 
              style={styles.tokenLogo}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.fallbackLogo}>
              <Text style={styles.fallbackLogoText}>{token.symbol[0]}</Text>
            </View>
          )}
        </View>
        <View>
          <Text style={styles.tokenSymbol}>{token.symbol}</Text>
          <Text style={styles.tokenName}>{token.name}</Text>
        </View>
      </View>
      <View style={styles.tokenPrice}>
        <Text style={styles.price}>
          ${token.price < 1 ? token.price.toFixed(4) : token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <View style={[styles.changeBadge, isPositive ? styles.changePositive : styles.changeNegative]}>
          <MaterialCommunityIcons 
            name={isPositive ? 'trending-up' : 'trending-down'} 
            size={14} 
            color={isPositive ? '#00FFA3' : '#FF4444'} 
          />
          <Text style={[styles.changeText, isPositive ? styles.changeTextPositive : styles.changeTextNegative]}>
            {Math.abs(token.change24h).toFixed(2)}%
          </Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#444" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  gradient: { flex: 1 },
  header: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    padding: 14,
    color: '#FFF',
    fontSize: 16,
  },
  scroll: { flex: 1 },
  tokenList: { paddingHorizontal: 20, paddingBottom: 100 },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { color: '#888', fontSize: 16 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 16 },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tokenInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tokenLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  fallbackLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 255, 240, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackLogoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00FFF0',
  },
  tokenSymbol: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  tokenName: { fontSize: 13, color: '#888', marginTop: 2 },
  tokenPrice: { alignItems: 'flex-end', marginRight: 8 },
  price: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    gap: 4,
  },
  changePositive: { backgroundColor: 'rgba(0, 255, 163, 0.12)' },
  changeNegative: { backgroundColor: 'rgba(255, 68, 68, 0.12)' },
  changeText: { fontSize: 13, fontWeight: '600' },
  changeTextPositive: { color: '#00FFA3' },
  changeTextNegative: { color: '#FF4444' },
});
