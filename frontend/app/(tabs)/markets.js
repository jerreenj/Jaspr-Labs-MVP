import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { TOKENS } from '../../src/config/tokens';

export default function MarketsPage() {
  const [tokens, setTokens] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const loadPrices = async () => {
    try {
      const ids = TOKENS.map(t => t.coingeckoId).join(',');
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
      );
      
      const pricesData = TOKENS.map(token => ({
        ...token,
        price: response.data[token.coingeckoId]?.usd || 0,
        change24h: response.data[token.coingeckoId]?.usd_24h_change || 0,
        marketCap: response.data[token.coingeckoId]?.usd_market_cap || 0,
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

  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a3e', '#2d2d5f']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Markets</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="star" size={24} color="#00d4ff" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search tokens..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView 
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />
        }
      >
        {filteredTokens.map((token, index) => (
          <TokenItem key={index} token={token} />
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

function TokenItem({ token }) {
  const isPositive = token.change24h >= 0;
  
  return (
    <TouchableOpacity style={styles.tokenItem}>
      <View style={styles.tokenInfo}>
        <View style={styles.tokenIcon}>
          <Text style={styles.tokenIconText}>{token.symbol[0]}</Text>
        </View>
        <View>
          <Text style={styles.tokenName}>{token.symbol}</Text>
          <Text style={styles.tokenFullName}>{token.name}</Text>
        </View>
      </View>
      <View style={styles.tokenPrice}>
        <Text style={styles.price}>${token.price.toLocaleString()}</Text>
        <Text style={[styles.change, isPositive ? styles.changePositive : styles.changeNegative]}>
          {isPositive ? '+' : ''}{token.change24h.toFixed(2)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    color: '#fff',
    fontSize: 16,
  },
  scroll: { flex: 1 },
  tokenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  tokenInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: { fontSize: 18, fontWeight: 'bold', color: '#00d4ff' },
  tokenName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  tokenFullName: { fontSize: 12, color: '#888', marginTop: 2 },
  tokenPrice: { alignItems: 'flex-end' },
  price: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  change: { fontSize: 14, marginTop: 4 },
  changePositive: { color: '#00d4ff' },
  changeNegative: { color: '#ff4444' },
});