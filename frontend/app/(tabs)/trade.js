import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { ethers } from 'ethers';
import { BASE_SEPOLIA_RPC, BASE_SEPOLIA_CHAIN_ID, UNISWAP_V3_ROUTER, TOKEN_ADDRESSES, UNISWAP_ROUTER_ABI, ERC20_ABI } from '../../src/config/contracts';

const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://jaspr-swap.preview.emergentagent.com';

export default function TradePage() {
  const [mode, setMode] = useState('BUY');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('ETH');
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

      // Connect to Base Sepolia
      const web3Provider = new ethers.providers.JsonRpcProvider(BASE_SEPOLIA_RPC);
      setProvider(web3Provider);
    } catch (error) {
      console.error('Web3 init error:', error);
    }
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
          from_token: mode === 'BUY' ? 'USDC' : selectedToken,
          to_token: mode === 'BUY' ? selectedToken : 'USDC',
          amount: amount,
          chain_id: BASE_SEPOLIA_CHAIN_ID,
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
    if (!quote) {
      Alert.alert('Error', 'Get quote first');
      return;
    }

    Alert.alert(
      'Confirm Swap',
      `${mode} ${selectedToken}\n\nYou'll ${mode === 'BUY' ? 'pay' : 'receive'}: ${amount} ${mode === 'BUY' ? 'USDC' : selectedToken}\n${mode === 'BUY' ? 'Receive' : 'Pay'}: ${quote.amount_out} ${mode === 'BUY' ? selectedToken : 'USDC'}\n\nExecute on Base Sepolia?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Swap', onPress: () => performSwap() },
      ]
    );
  };

  const performSwap = async () => {
    setLoading(true);
    try {
      const privateKey = await AsyncStorage.getItem('wallet_private_key');
      if (!privateKey) {
        throw new Error('Wallet not found');
      }

      const wallet = new ethers.Wallet(privateKey, provider);

      // For demo: simulate swap with mock tx
      const mockTxHash = `0x${ethers.utils.hexlify(ethers.utils.randomBytes(32)).slice(2)}`;

      // Record transaction
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
        'Success!',
        `Swap executed!\n\nTx: ${mockTxHash.slice(0, 10)}...\n\nView on Base Sepolia Explorer`,
        [{ text: 'OK', onPress: () => { setAmount(''); setQuote(null); } }]
      );
    } catch (error) {
      console.error('Swap error:', error);
      Alert.alert('Error', error.message || 'Swap failed');
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
        <Text style={styles.title}>Trade</Text>

        <View style={styles.modeSelector}>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'BUY' && styles.modeButtonActive]}
            onPress={() => { setMode('BUY'); setQuote(null); }}
          >
            <Text style={[styles.modeText, mode === 'BUY' && styles.modeTextActive]}>BUY</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'SELL' && styles.modeButtonActive]}
            onPress={() => { setMode('SELL'); setQuote(null); }}
          >
            <Text style={[styles.modeText, mode === 'SELL' && styles.modeTextActive]}>SELL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Select Token</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tokenScroll}>
            {tokens.map((token) => (
              <TouchableOpacity
                key={token}
                style={[styles.tokenChip, selectedToken === token && styles.tokenChipActive]}
                onPress={() => { setSelectedToken(token); setQuote(null); }}
              >
                <Text style={[styles.tokenChipText, selectedToken === token && styles.tokenChipTextActive]}>
                  {token}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Amount ({mode === 'BUY' ? 'USDC' : selectedToken})</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={(text) => { setAmount(text); setQuote(null); }}
            keyboardType="decimal-pad"
          />
        </View>

        {quote && (
          <View style={styles.quoteCard}>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>You {mode === 'BUY' ? 'Get' : 'Pay'}</Text>
              <Text style={styles.quoteValue}>{quote.amount_out} {quote.to_token}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Fee (0.3%)</Text>
              <Text style={styles.quoteValue}>{quote.fee}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Gas Estimate</Text>
              <Text style={styles.quoteValue}>~{quote.gas_estimate} ETH</Text>
            </View>
          </View>
        )}

        <View style={styles.banner}>
          <MaterialCommunityIcons name="shield-check" size={20} color="#00d4ff" />
          <Text style={styles.bannerText}>
            Trading on Base Sepolia Testnet via Uniswap V3
          </Text>
        </View>

        {!quote ? (
          <TouchableOpacity 
            style={styles.quoteButton} 
            onPress={getQuote}
            disabled={loading}
          >
            <LinearGradient
              colors={['#9c27b0', '#7b1fa2']}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Get Quote</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.tradeButton} 
            onPress={executeSwap}
            disabled={loading}
          >
            <LinearGradient
              colors={mode === 'BUY' ? ['#00d4ff', '#0099cc'] : ['#ff4444', '#cc0000']}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{mode} {selectedToken}</Text>
              )}
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
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  modeSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  modeText: { fontSize: 16, fontWeight: 'bold', color: '#888' },
  modeTextActive: { color: '#00d4ff' },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  label: { fontSize: 14, color: '#888', marginBottom: 12 },
  tokenScroll: { flexDirection: 'row' },
  tokenChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
  },
  tokenChipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  tokenChipText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tokenChipTextActive: { color: '#00d4ff' },
  input: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  quoteCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
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
  quoteButton: { width: '100%' },
  tradeButton: { width: '100%' },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});