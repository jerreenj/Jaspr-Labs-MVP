import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, buy, sell, swap

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('tx_history');
      const txHistory = history ? JSON.parse(history) : [];
      setTransactions(txHistory);
    } catch (error) {
      console.error('Load history error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const filteredTxs = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'buy': return 'arrow-bottom-left';
      case 'sell': return 'arrow-top-right';
      case 'swap': return 'swap-horizontal';
      case 'send': return 'send';
      case 'receive': return 'download';
      default: return 'circle';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'buy': return '#00FFA3';
      case 'sell': return '#FF4444';
      case 'swap': return '#00FFF0';
      case 'send': return '#FF9800';
      case 'receive': return '#00FFA3';
      default: return '#888';
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const shortenHash = (hash) => {
    if (!hash) return '';
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a1a', '#0d1f3c', '#0a0a1a']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>{transactions.length} transactions</Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {['all', 'buy', 'sell', 'swap'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FFF0" />
          }
        >
          {filteredTxs.length > 0 ? (
            <View style={styles.txList}>
              {filteredTxs.map((tx, index) => (
                <View key={index} style={styles.txItem}>
                  <View style={[styles.txIcon, { backgroundColor: `${getColor(tx.type)}15` }]}>
                    <MaterialCommunityIcons name={getIcon(tx.type)} size={22} color={getColor(tx.type)} />
                  </View>
                  
                  <View style={styles.txContent}>
                    <View style={styles.txHeader}>
                      <Text style={styles.txType}>
                        {tx.type === 'swap' 
                          ? `Swap ${tx.fromToken} → ${tx.toToken}`
                          : tx.type === 'buy'
                            ? `Buy ${tx.symbol}`
                            : tx.type === 'sell'
                              ? `Sell ${tx.symbol}`
                              : tx.type === 'send'
                                ? `Send ${tx.symbol}`
                                : tx.type
                        }
                      </Text>
                      <Text style={[styles.txAmount, { color: getColor(tx.type) }]}>
                        {tx.type === 'swap'
                          ? `${parseFloat(tx.amountOut).toFixed(6)}`
                          : tx.type === 'buy'
                            ? `+${parseFloat(tx.tokenAmount || tx.amount).toFixed(6)}`
                            : tx.type === 'sell'
                              ? `-${parseFloat(tx.tokenAmount || tx.amount).toFixed(6)}`
                              : parseFloat(tx.amount || 0).toFixed(6)
                        }
                      </Text>
                    </View>
                    
                    <View style={styles.txDetails}>
                      <Text style={styles.txTime}>{formatDate(tx.timestamp)}</Text>
                      {tx.usdAmount && (
                        <Text style={styles.txUsd}>${parseFloat(tx.usdAmount).toFixed(2)}</Text>
                      )}
                    </View>
                    
                    {tx.txHash && (
                      <View style={styles.txHashRow}>
                        <MaterialCommunityIcons name="link-variant" size={12} color="#666" />
                        <Text style={styles.txHash}>{shortenHash(tx.txHash)}</Text>
                        <View style={styles.statusBadge}>
                          <View style={styles.statusDot} />
                          <Text style={styles.statusText}>Confirmed</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="history" size={64} color="#333" />
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>Your trading history will appear here</Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  gradient: { flex: 1 },
  header: { padding: 20, paddingTop: 50 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(0, 255, 240, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 240, 0.3)',
  },
  filterText: { fontSize: 14, color: '#888', fontWeight: '600' },
  filterTextActive: { color: '#00FFF0' },
  scroll: { flex: 1 },
  txList: { paddingHorizontal: 20, paddingBottom: 100 },
  txItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  txContent: { flex: 1 },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txType: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  txAmount: { fontSize: 16, fontWeight: '700' },
  txDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  txTime: { fontSize: 13, color: '#888' },
  txUsd: { fontSize: 13, color: '#888' },
  txHashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  txHash: { fontSize: 12, color: '#666', fontFamily: 'monospace' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 163, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 'auto',
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00FFA3' },
  statusText: { fontSize: 11, color: '#00FFA3', fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#666', marginTop: 20 },
  emptySubtitle: { fontSize: 14, color: '#444', marginTop: 8, textAlign: 'center' },
});
