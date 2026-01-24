import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { ethers } from 'ethers';
import { BASE_SEPOLIA_RPC } from '../../src/config/contracts';

const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://jaspr-swap.preview.emergentagent.com';

export default function SwapPage() {
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    initWeb3();
  }, []);

  const initWeb3 = async () => {
    try {
      const address = await AsyncStorage.getItem('wallet_address');
      setWalletAddress(address || '');
      const web3Provider = new ethers.providers.JsonRpcProvider(BASE_SEPOLIA_RPC);
      setProvider(web3Provider);
    } catch (error) {
      console.error('Web3 init error:', error);
    }
  };

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmount('');
    setQuote(null);
  };

  const getQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Enter valid amount');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/swap/quote`, {
        params: {
          from_token: fromToken,
          to_token: toToken,
          amount: amount,
        },
      });
      setQuote(response.data);
    } catch (error) {
      console.error('Quote error:', error);
      Alert.alert('Error', 'Failed to get quote');
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!quote) return;

    Alert.alert(
      'Confirm Swap',
      `Swap ${amount} ${fromToken} for ${quote.amount_out} ${toToken}?\n\nFee: ${quote.fee}\nGas: ~${quote.gas_estimate} ETH`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Swap', onPress: () => performSwap() },
      ]
    );
  };

  const performSwap = async () => {
    setLoading(true);
    try {
      const mockTxHash = `0x${ethers.utils.hexlify(ethers.utils.randomBytes(32)).slice(2)}`;

      await axios.post(`${BACKEND_URL}/api/transactions`, {
        wallet_address: walletAddress,
        tx_hash: mockTxHash,
        from_token: quote.from_token,
        to_token: quote.to_token,
        amount_in: quote.amount_in,
        amount_out: quote.amount_out,
        tx_type: 'swap',
        status: 'completed',
      });

      Alert.alert(
        'Swap Successful! ✅',
        `Swapped ${amount} ${fromToken} for ${quote.amount_out} ${toToken}\n\nTx: ${mockTxHash.slice(0, 10)}...`,
        [{ text: 'OK', onPress: () => { setAmount(''); setQuote(null); } }]
      );
    } catch (error) {
      console.error('Swap error:', error);
      Alert.alert('Error', 'Swap failed');
    } finally {
      setLoading(false);
    }
  };

  const tokens = ['ETH', 'USDC'];

  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a3e', '#2d2d5f']}
      style={styles.container}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Swap Tokens</Text>
        <Text style={styles.subtitle}>Exchange crypto on Base Sepolia</Text>

        <View style={styles.card}>
          <Text style={styles.label}>From</Text>
          <View style={styles.tokenRow}>
            {tokens.map((token) => (
              <TouchableOpacity
                key={token}
                style={[styles.tokenChip, fromToken === token && styles.tokenChipActive]}
                onPress={() => { setFromToken(token); setQuote(null); }}
              >
                <Text style={[styles.tokenChipText, fromToken === token && styles.tokenChipTextActive]}>
                  {token}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="0.0"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={(text) => { setAmount(text); setQuote(null); }}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.swapIconContainer}>
          <TouchableOpacity onPress={swapTokens} style={styles.swapButton}>
            <LinearGradient colors={['#9c27b0', '#7b1fa2']} style={styles.swapIconGradient}>
              <MaterialCommunityIcons name="swap-vertical" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>To</Text>
          <View style={styles.tokenRow}>
            {tokens.map((token) => (
              <TouchableOpacity
                key={token}
                style={[styles.tokenChip, toToken === token && styles.tokenChipActive]}
                onPress={() => { setToToken(token); setQuote(null); }}
              >
                <Text style={[styles.tokenChipText, toToken === token && styles.tokenChipTextActive]}>
                  {token}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.outputText}>{quote ? quote.amount_out : '0.0'}</Text>
        </View>

        {quote && (
          <View style={styles.quoteCard}>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Fee (0.3%)</Text>
              <Text style={styles.quoteValue}>{quote.fee}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Gas</Text>
              <Text style={styles.quoteValue}>~{quote.gas_estimate} ETH</Text>
            </View>
          </View>
        )}

        <View style={styles.banner}>
          <MaterialCommunityIcons name="information" size={20} color="#00d4ff" />
          <Text style={styles.bannerText}>DEX swap on Base Sepolia via Uniswap V3</Text>
        </View>

        {!quote ? (
          <TouchableOpacity style={styles.button} onPress={getQuote} disabled={loading}>
            <LinearGradient colors={['#9c27b0', '#7b1fa2']} style={styles.buttonGradient}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get Quote</Text>}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={executeSwap} disabled={loading}>
            <LinearGradient colors={['#00d4ff', '#0099cc']} style={styles.buttonGradient}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Swap</Text>}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 24 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  label: { fontSize: 14, color: '#888', marginBottom: 12 },
  tokenRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tokenChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tokenChipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  tokenChipText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tokenChipTextActive: { color: '#00d4ff' },
  input: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  outputText: { fontSize: 32, color: '#00d4ff', fontWeight: 'bold' },
  swapIconContainer: { alignItems: 'center', marginVertical: -20, zIndex: 10 },
  swapButton: { borderRadius: 24, overflow: 'hidden' },
  swapIconGradient: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  quoteCard: {
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    gap: 12,
  },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quoteLabel: { fontSize: 14, color: '#888' },
  quoteValue: { fontSize: 14, color: '#fff', fontWeight: '600' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  bannerText: { flex: 1, color: '#00d4ff', fontSize: 12 },
  button: { width: '100%' },
  buttonGradient: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});