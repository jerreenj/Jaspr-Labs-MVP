import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { TOKENS } from '../../src/config/tokens';

export default function MarketsPage() {
  const router = useRouter();
  const [tokens, setTokens] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadPrices = async () => {
    try {
      const ids = TOKENS.map(t => t.coingeckoId).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
      );
      const data = await response.json();
      
      const pricesData = TOKENS.map(token => ({
        ...token,
        price: data[token.coingeckoId]?.usd || 0,
        change24h: data[token.coingeckoId]?.usd_24h_change || 0,
        marketCap: data[token.coingeckoId]?.usd_market_cap || 0,
      }));
      
      setTokens(pricesData);
    } catch (error) {
      console.error('Error loading prices:', error);
    } finally {
      setRefreshing(false);
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
        price: token.price,
        change: token.change24h,
      }
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000428', '#004e92']} style={styles.gradient}>
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
            {filteredTokens.map((token, index) => (
              <TokenItem 
                key={index} 
                token={token} 
                onPress={() => handleTokenPress(token)}
              />
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

function TokenItem({ token, onPress }) {
  const isPositive = token.change24h >= 0;
  
  const getTokenColor = (symbol) => {
    const colors = {
      BTC: '#F7931A',
      ETH: '#627EEA',
      SOL: '#00FFA3',
      BNB: '#F3BA2F',
      XRP: '#23292F',
      ADA: '#0033AD',
      DOGE: '#C3A634',
      AVAX: '#E84142',
      TON: '#0098EA',
      MATIC: '#8247E5',
      USDC: '#2775CA',
    };
    return colors[symbol] || '#00FFF0';
  };

  return (
    <TouchableOpacity style={styles.tokenItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.tokenInfo}>
        <View style={[styles.tokenIcon, { backgroundColor: `${getTokenColor(token.symbol)}30` }]}>
          <Text style={[styles.tokenIconText, { color: getTokenColor(token.symbol) }]}>
            {token.symbol[0]}
          </Text>
        </View>
        <View>
          <Text style={styles.tokenName}>{token.symbol}</Text>
          <Text style={styles.tokenFullName}>{token.name}</Text>
        </View>
      </View>
      <View style={styles.tokenPrice}>
        <Text style={styles.price}>
          ${token.price < 1 ? token.price.toFixed(4) : token.price.toLocaleString()}
        </Text>
        <View style={[styles.changeBadge, isPositive ? styles.changePositive : styles.changeNegative]}>
          <MaterialCommunityIcons 
            name={isPositive ? 'arrow-up' : 'arrow-down'} 
            size={12} 
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
  container: { flex: 1, backgroundColor: '#000' },
  gradient: { flex: 1 },
  header: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.5)', marginTop: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 240, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    padding: 14,
    color: '#FFF',
    fontSize: 16,
  },
  scroll: { flex: 1 },
  tokenList: { paddingHorizontal: 24, paddingBottom: 100 },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tokenInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
  tokenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: { fontSize: 18, fontWeight: '700' },
  tokenName: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  tokenFullName: { fontSize: 13, color: 'rgba(255, 255, 255, 0.5)', marginTop: 2 },
  tokenPrice: { alignItems: 'flex-end', marginRight: 8 },
  price: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    gap: 2,
  },
  changePositive: { backgroundColor: 'rgba(0, 255, 163, 0.1)' },
  changeNegative: { backgroundColor: 'rgba(255, 68, 68, 0.1)' },
  changeText: { fontSize: 13, fontWeight: '600' },
  changeTextPositive: { color: '#00FFA3' },
  changeTextNegative: { color: '#FF4444' },
});
