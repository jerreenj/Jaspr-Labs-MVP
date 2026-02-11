import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

// Top 25 tokens with real logos from CoinGecko
const TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin', logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum', logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { symbol: 'USDT', name: 'Tether', coingeckoId: 'tether', logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
  { symbol: 'BNB', name: 'BNB', coingeckoId: 'binancecoin', logo: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana', logo: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { symbol: 'USDC', name: 'USD Coin', coingeckoId: 'usd-coin', logo: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
  { symbol: 'XRP', name: 'XRP', coingeckoId: 'ripple', logo: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
  { symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin', logo: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
  { symbol: 'TON', name: 'Toncoin', coingeckoId: 'the-open-network', logo: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png' },
  { symbol: 'ADA', name: 'Cardano', coingeckoId: 'cardano', logo: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
  { symbol: 'AVAX', name: 'Avalanche', coingeckoId: 'avalanche-2', logo: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
  { symbol: 'SHIB', name: 'Shiba Inu', coingeckoId: 'shiba-inu', logo: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png' },
  { symbol: 'TRX', name: 'TRON', coingeckoId: 'tron', logo: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png' },
  { symbol: 'DOT', name: 'Polkadot', coingeckoId: 'polkadot', logo: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png' },
  { symbol: 'LINK', name: 'Chainlink', coingeckoId: 'chainlink', logo: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
  { symbol: 'MATIC', name: 'Polygon', coingeckoId: 'matic-network', logo: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png' },
  { symbol: 'WBTC', name: 'Wrapped BTC', coingeckoId: 'wrapped-bitcoin', logo: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png' },
  { symbol: 'ICP', name: 'Internet Computer', coingeckoId: 'internet-computer', logo: 'https://assets.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png' },
  { symbol: 'UNI', name: 'Uniswap', coingeckoId: 'uniswap', logo: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-logo.png' },
  { symbol: 'LTC', name: 'Litecoin', coingeckoId: 'litecoin', logo: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png' },
  { symbol: 'DAI', name: 'Dai', coingeckoId: 'dai', logo: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png' },
  { symbol: 'NEAR', name: 'NEAR Protocol', coingeckoId: 'near', logo: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg' },
  { symbol: 'APT', name: 'Aptos', coingeckoId: 'aptos', logo: 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png' },
  { symbol: 'PEPE', name: 'Pepe', coingeckoId: 'pepe', logo: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg' },
  { symbol: 'ARB', name: 'Arbitrum', coingeckoId: 'arbitrum', logo: 'https://assets.coingecko.com/coins/images/16547/small/arb.jpg' },
];

// Fallback prices - updated realistic values
const FALLBACK_PRICES = {
  bitcoin: { usd: 96500, usd_24h_change: 2.5 },
  ethereum: { usd: 3650, usd_24h_change: 1.8 },
  tether: { usd: 1.00, usd_24h_change: 0.01 },
  binancecoin: { usd: 695, usd_24h_change: -0.5 },
  solana: { usd: 185, usd_24h_change: 3.2 },
  'usd-coin': { usd: 1.00, usd_24h_change: 0 },
  ripple: { usd: 2.35, usd_24h_change: 1.2 },
  dogecoin: { usd: 0.38, usd_24h_change: 4.5 },
  'the-open-network': { usd: 5.80, usd_24h_change: 0.8 },
  cardano: { usd: 0.98, usd_24h_change: -1.1 },
  'avalanche-2': { usd: 38.50, usd_24h_change: 2.1 },
  'shiba-inu': { usd: 0.000022, usd_24h_change: 5.2 },
  tron: { usd: 0.25, usd_24h_change: 1.5 },
  polkadot: { usd: 7.20, usd_24h_change: -0.8 },
  chainlink: { usd: 14.50, usd_24h_change: 2.3 },
  'matic-network': { usd: 0.52, usd_24h_change: -0.3 },
  'wrapped-bitcoin': { usd: 96400, usd_24h_change: 2.4 },
  'internet-computer': { usd: 11.50, usd_24h_change: 3.1 },
  uniswap: { usd: 12.80, usd_24h_change: 1.9 },
  litecoin: { usd: 108, usd_24h_change: 0.7 },
  dai: { usd: 1.00, usd_24h_change: 0 },
  near: { usd: 5.20, usd_24h_change: 2.8 },
  aptos: { usd: 9.80, usd_24h_change: 4.2 },
  pepe: { usd: 0.000018, usd_24h_change: 8.5 },
  arbitrum: { usd: 0.92, usd_24h_change: 1.2 },
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
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
        { 
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('API error');
      
      const data = await response.json();
      
      const pricesData = TOKENS.map((token, index) => ({
        ...token,
        rank: index + 1,
        price: data[token.coingeckoId]?.usd || FALLBACK_PRICES[token.coingeckoId]?.usd || 0,
        change24h: data[token.coingeckoId]?.usd_24h_change || FALLBACK_PRICES[token.coingeckoId]?.usd_24h_change || 0,
        marketCap: data[token.coingeckoId]?.usd_market_cap || 0,
        isLive: true,
      }));
      
      setTokens(pricesData);
    } catch (error) {
      console.log('Using stable fallback prices');
      // Use stable fallback prices without random variations
      const fallbackData = TOKENS.map((token, index) => {
        return {
          ...token,
          rank: index + 1,
          price: FALLBACK_PRICES[token.coingeckoId]?.usd || 1,
          change24h: FALLBACK_PRICES[token.coingeckoId]?.usd_24h_change || 0,
          isLive: false,
        };
      });
      setTokens(fallbackData);
    } finally {
      setLoading(false);
    }
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
      <View style={styles.header}>
        <Text style={styles.title}>Trade</Text>
        <Text style={styles.subtitle}>Top 25 cryptocurrencies • Tap to trade</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tokens..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />
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
              <MaterialCommunityIcons name="magnify" size={48} color="#444" />
              <Text style={styles.emptyText}>No tokens found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function TokenItem({ token, onPress }) {
  const isPositive = token.change24h >= 0;
  const [imageError, setImageError] = useState(false);
  
  const formatPrice = (price) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 0.0001) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
  };
  
  return (
    <TouchableOpacity style={styles.tokenItem} onPress={onPress} activeOpacity={0.7}>
      {/* Rank */}
      <Text style={styles.tokenRank}>{token.rank}</Text>
      
      {/* Logo */}
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
      
      {/* Info */}
      <View style={styles.tokenInfo}>
        <Text style={styles.tokenSymbol}>{token.symbol}</Text>
        <Text style={styles.tokenName} numberOfLines={1}>{token.name}</Text>
      </View>
      
      {/* Price */}
      <View style={styles.tokenPrice}>
        <Text style={styles.price}>{formatPrice(token.price)}</Text>
        <View style={[styles.changeBadge, isPositive ? styles.changePositive : styles.changeNegative]}>
          <MaterialCommunityIcons 
            name={isPositive ? 'trending-up' : 'trending-down'} 
            size={12} 
            color={isPositive ? '#00FFA3' : '#FF4444'} 
          />
          <Text style={[styles.changeText, isPositive ? styles.changeTextPositive : styles.changeTextNegative]}>
            {Math.abs(token.change24h).toFixed(2)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#000',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF', fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 15,
  },
  scroll: { flex: 1, backgroundColor: '#000' },
  tokenList: { paddingHorizontal: 20, paddingBottom: 100 },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { color: '#888', fontSize: 16 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 16, marginTop: 12 },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222',
  },
  tokenRank: {
    width: 24,
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    marginRight: 12,
  },
  tokenLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  fallbackLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackLogoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  tokenInfo: { flex: 1 },
  tokenSymbol: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  tokenName: { fontSize: 12, color: '#888', marginTop: 2 },
  tokenPrice: { alignItems: 'flex-end' },
  price: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    marginTop: 4,
    gap: 3,
  },
  changePositive: { backgroundColor: 'rgba(0, 200, 83, 0.15)' },
  changeNegative: { backgroundColor: 'rgba(255, 59, 48, 0.15)' },
  changeText: { fontSize: 12, fontWeight: '600' },
  changeTextPositive: { color: '#00C853' },
  changeTextNegative: { color: '#FF3B30' },
});
