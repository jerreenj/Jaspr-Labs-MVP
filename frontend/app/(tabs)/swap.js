import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supported tokens for swap
const SWAP_TOKENS = [
  { symbol: 'USDC', name: 'USD Coin', decimals: 6, color: '#2775CA' },
  { symbol: 'ETH', name: 'Ethereum', decimals: 18, color: '#627EEA' },
  { symbol: 'BTC', name: 'Bitcoin', decimals: 8, color: '#F7931A' },
];

export default function SwapPage() {
  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState({ USDC: 1, ETH: 3000, BTC: 90000 });
  const [balance, setBalance] = useState(10000);
  const [holdings, setHoldings] = useState({ USDC: 10000, ETH: 0, BTC: 0 });

  // Fetch live prices
  useEffect(() => {
    fetchPrices();
    loadBalances();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,usd-coin&vs_currencies=usd'
      );
      const data = await response.json();
      setPrices({
        USDC: 1,
        ETH: data.ethereum?.usd || 3000,
        BTC: data.bitcoin?.usd || 90000,
      });
    } catch (error) {
      console.error('Price fetch error:', error);
    }
  };

  const loadBalances = async () => {
    try {
      const demoBalance = await AsyncStorage.getItem('demo_balance');
      const storedHoldings = await AsyncStorage.getItem('token_holdings');
      
      const usdcBalance = demoBalance ? parseFloat(demoBalance) : 10000;
      const tokenHoldings = storedHoldings ? JSON.parse(storedHoldings) : {};
      
      setBalance(usdcBalance);
      setHoldings({
        USDC: usdcBalance,
        ETH: tokenHoldings.ETH || 0,
        BTC: tokenHoldings.BTC || 0,
      });
    } catch (error) {
      console.error('Load balances error:', error);
    }
  };

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmount('');
    setEstimatedOutput('');
  };

  const calculateOutput = useCallback((inputAmount) => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setEstimatedOutput('');
      return;
    }
    
    const fromPrice = prices[fromToken] || 1;
    const toPrice = prices[toToken] || 1;
    
    // Calculate output with 0.3% fee
    const inputValue = parseFloat(inputAmount) * fromPrice;
    const output = (inputValue / toPrice) * 0.997;
    setEstimatedOutput(output.toFixed(6));
  }, [fromToken, toToken, prices]);

  const handleAmountChange = (text) => {
    // Only allow valid number input
    const cleanedText = text.replace(/[^0-9.]/g, '');
    setAmount(cleanedText);
    calculateOutput(cleanedText);
  };

  const setMaxAmount = () => {
    const maxBalance = holdings[fromToken] || 0;
    setAmount(maxBalance.toString());
    calculateOutput(maxBalance.toString());
  };

  const executeSwap = async () => {
    const inputAmount = parseFloat(amount);
    
    if (!amount || inputAmount <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }

    const fromBalance = holdings[fromToken] || 0;
    if (inputAmount > fromBalance) {
      Alert.alert('Insufficient Balance', `You don't have enough ${fromToken}`);
      return;
    }

    // Confirm swap
    Alert.alert(
      'Confirm Swap',
      `Swap ${amount} ${fromToken} for ~${estimatedOutput} ${toToken}?\n\nFee: 0.3%\nNetwork: Base Sepolia`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => performSwap() },
      ]
    );
  };

  const performSwap = async () => {
    setLoading(true);
    
    try {
      const inputAmount = parseFloat(amount);
      const outputAmount = parseFloat(estimatedOutput);
      
      // Update holdings
      const newHoldings = { ...holdings };
      newHoldings[fromToken] = (newHoldings[fromToken] || 0) - inputAmount;
      newHoldings[toToken] = (newHoldings[toToken] || 0) + outputAmount;
      
      // Simulate blockchain transaction time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save to storage
      await AsyncStorage.setItem('demo_balance', newHoldings.USDC.toString());
      await AsyncStorage.setItem('token_holdings', JSON.stringify({
        ETH: newHoldings.ETH,
        BTC: newHoldings.BTC,
      }));
      
      // Save to history
      const history = JSON.parse(await AsyncStorage.getItem('tx_history') || '[]');
      history.unshift({
        type: 'swap',
        fromToken,
        toToken,
        amountIn: amount,
        amountOut: estimatedOutput,
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        status: 'confirmed',
      });
      await AsyncStorage.setItem('tx_history', JSON.stringify(history.slice(0, 50)));
      
      // Update state
      setHoldings(newHoldings);
      setBalance(newHoldings.USDC);
      
      Alert.alert(
        'Swap Successful! 🎉',
        `Swapped ${amount} ${fromToken} for ${estimatedOutput} ${toToken}\n\nTransaction confirmed on Base Sepolia`,
        [{ text: 'Done', onPress: () => { setAmount(''); setEstimatedOutput(''); } }]
      );
    } catch (error) {
      Alert.alert('Error', 'Swap failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTokenColor = (symbol) => {
    return SWAP_TOKENS.find(t => t.symbol === symbol)?.color || '#00FFF0';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000428', '#004e92']} style={styles.gradient}>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.title}>Swap Tokens</Text>
            <Text style={styles.subtitle}>Trade instantly on Base Sepolia</Text>

            {/* From Card */}
            <View style={styles.swapContainer}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.label}>From</Text>
                  <TouchableOpacity onPress={setMaxAmount}>
                    <Text style={styles.balanceText}>
                      Balance: {(holdings[fromToken] || 0).toFixed(fromToken === 'USDC' ? 2 : 6)} {fromToken}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.tokenRow}>
                  {SWAP_TOKENS.map((token) => (
                    <TouchableOpacity
                      key={token.symbol}
                      style={[
                        styles.tokenChip, 
                        fromToken === token.symbol && [styles.tokenChipActive, { borderColor: token.color }]
                      ]}
                      onPress={() => { 
                        if (token.symbol !== toToken) {
                          setFromToken(token.symbol);
                          setAmount('');
                          setEstimatedOutput('');
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.tokenChipText, 
                        fromToken === token.symbol && { color: token.color }
                      ]}>
                        {token.symbol}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="0.0"
                    placeholderTextColor="#666"
                    value={amount}
                    onChangeText={handleAmountChange}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.usdValue}>
                    ≈ ${(parseFloat(amount || 0) * prices[fromToken]).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Swap Button */}
              <TouchableOpacity style={styles.swapButton} onPress={swapTokens}>
                <View style={styles.swapIcon}>
                  <MaterialCommunityIcons name="swap-vertical" size={24} color="#00FFF0" />
                </View>
              </TouchableOpacity>

              {/* To Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.label}>To</Text>
                  <Text style={styles.balanceText}>
                    Balance: {(holdings[toToken] || 0).toFixed(toToken === 'USDC' ? 2 : 6)} {toToken}
                  </Text>
                </View>
                
                <View style={styles.tokenRow}>
                  {SWAP_TOKENS.map((token) => (
                    <TouchableOpacity
                      key={token.symbol}
                      style={[
                        styles.tokenChip, 
                        toToken === token.symbol && [styles.tokenChipActive, { borderColor: token.color }]
                      ]}
                      onPress={() => { 
                        if (token.symbol !== fromToken) {
                          setToToken(token.symbol);
                          calculateOutput(amount);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.tokenChipText, 
                        toToken === token.symbol && { color: token.color }
                      ]}>
                        {token.symbol}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.inputRow}>
                  <Text style={styles.output}>{estimatedOutput || '0.0'}</Text>
                  <Text style={styles.usdValue}>
                    ≈ ${(parseFloat(estimatedOutput || 0) * prices[toToken]).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Swap Info */}
            {estimatedOutput && parseFloat(estimatedOutput) > 0 && (
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Rate</Text>
                  <Text style={styles.infoValue}>
                    1 {fromToken} = {(prices[fromToken] / prices[toToken]).toFixed(6)} {toToken}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fee (0.3%)</Text>
                  <Text style={styles.infoValue}>${(parseFloat(amount || 0) * prices[fromToken] * 0.003).toFixed(2)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Network</Text>
                  <Text style={[styles.infoValue, { color: '#00FFF0' }]}>Base Sepolia</Text>
                </View>
              </View>
            )}

            {/* Safety Banner */}
            <View style={styles.banner}>
              <MaterialCommunityIcons name="shield-check" size={18} color="#00FFF0" />
              <Text style={styles.bannerText}>
                Testnet demo mode. Real swaps require Base Sepolia ETH for gas.
              </Text>
            </View>

            {/* Swap Button */}
            <TouchableOpacity 
              style={[styles.executeButton, (!amount || loading) && styles.executeButtonDisabled]} 
              onPress={executeSwap}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading || !amount ? ['#333', '#222'] : ['#00FFF0', '#00B8D4']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={[styles.buttonText, { color: '#FFF', marginLeft: 8 }]}>Processing...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Swap Tokens</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Live Prices */}
            <View style={styles.pricesCard}>
              <Text style={styles.pricesTitle}>Live Prices</Text>
              <View style={styles.pricesRow}>
                <Text style={styles.priceItem}>ETH: ${prices.ETH.toLocaleString()}</Text>
                <Text style={styles.priceItem}>BTC: ${prices.BTC.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 60, paddingBottom: 100 },
  title: { fontSize: 32, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 24 },
  swapContainer: { marginBottom: 16 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: { fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' },
  balanceText: { fontSize: 12, color: '#00FFF0' },
  tokenRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tokenChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tokenChipActive: {
    backgroundColor: 'rgba(0, 255, 240, 0.1)',
  },
  tokenChipText: { fontSize: 14, fontWeight: '600', color: '#888' },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  input: { fontSize: 36, color: '#FFF', fontWeight: '700', flex: 1 },
  output: { fontSize: 36, color: '#00FFF0', fontWeight: '700' },
  usdValue: { fontSize: 14, color: 'rgba(255, 255, 255, 0.5)' },
  swapButton: {
    alignSelf: 'center',
    marginVertical: -20,
    zIndex: 10,
  },
  swapIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000428',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00FFF0',
  },
  infoCard: {
    backgroundColor: 'rgba(0, 255, 240, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' },
  infoValue: { fontSize: 14, color: '#FFF', fontWeight: '600' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 240, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  bannerText: { flex: 1, color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 },
  executeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  executeButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: { color: '#000', fontSize: 18, fontWeight: '700' },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
  },
  pricesTitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginBottom: 8 },
  pricesRow: { flexDirection: 'row', justifyContent: 'space-around' },
  priceItem: { fontSize: 14, color: '#FFF', fontWeight: '500' },
});
