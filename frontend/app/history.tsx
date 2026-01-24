import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useEmbeddedWallet } from '@privy-io/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://jaspr-swap.preview.emergentagent.com';

interface Transaction {
  id: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  amount: string;
  token_symbol: string;
  tx_type: string;
  status: string;
  created_at: string;
}

export default function HistoryScreen() {
  const router = useRouter();
  const wallet = useEmbeddedWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [wallet]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      if (wallet?.address) {
        const response = await axios.get(`${BACKEND_URL}/api/transactions/${wallet.address}`);
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#0f3460', '#16213e']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Transaction History</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Transactions List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00d4ff" />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="history" size={64} color="#333" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
          </View>
        ) : (
          transactions.map((tx) => (
            <TransactionItem key={tx.id} transaction={tx} walletAddress={wallet?.address || ''} />
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function TransactionItem({ transaction, walletAddress }: { transaction: Transaction; walletAddress: string }) {
  const isSent = transaction.from_address.toLowerCase() === walletAddress.toLowerCase();
  const isSwap = transaction.tx_type === 'swap';
  
  const getIcon = () => {
    if (isSwap) return 'swap-horizontal';
    return isSent ? 'arrow-up' : 'arrow-down';
  };

  const getColor = () => {
    if (isSwap) return '#9c27b0';
    return isSent ? '#ff4444' : '#00d4ff';
  };

  const getLabel = () => {
    if (isSwap) return 'Swap';
    return isSent ? 'Sent' : 'Received';
  };

  return (
    <View style={styles.transactionCard}>
      <View style={[styles.iconContainer, { backgroundColor: `${getColor()}20` }]}>
        <MaterialCommunityIcons name={getIcon()} size={24} color={getColor()} />
      </View>
      
      <View style={styles.transactionInfo}>
        <View style={styles.transactionRow}>
          <Text style={styles.transactionLabel}>{getLabel()}</Text>
          <Text style={[styles.transactionAmount, { color: getColor() }]}>
            {isSent ? '-' : '+'}{transaction.amount} {transaction.token_symbol}
          </Text>
        </View>
        
        <View style={styles.transactionRow}>
          <Text style={styles.transactionAddress}>
            {isSent 
              ? `To: ${transaction.to_address.slice(0, 8)}...${transaction.to_address.slice(-6)}`
              : `From: ${transaction.from_address.slice(0, 8)}...${transaction.from_address.slice(-6)}`
            }
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}>
            <Text style={styles.statusText}>{transaction.status}</Text>
          </View>
        </View>
        
        <Text style={styles.transactionDate}>
          {new Date(transaction.created_at).toLocaleDateString()} {new Date(transaction.created_at).toLocaleTimeString()}
        </Text>
      </View>
    </View>
  );
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'rgba(0, 212, 255, 0.2)';
    case 'pending':
      return 'rgba(255, 152, 0, 0.2)';
    case 'failed':
      return 'rgba(255, 68, 68, 0.2)';
    default:
      return 'rgba(136, 136, 136, 0.2)';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  transactionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionAddress: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  transactionDate: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
});
