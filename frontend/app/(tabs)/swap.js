import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SWAP_TOKENS = [
  { symbol: 'USDC', name: 'USD Coin', color: '#2775CA', coingeckoId: 'usd-coin' },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', coingeckoId: 'ethereum' },
  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', coingeckoId: 'bitcoin' },
  { symbol: 'SOL', name: 'Solana', color: '#00FFA3', coingeckoId: 'solana' },
];

export default function SwapPage() {
  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState({ USDC: 1, ETH: 3000, BTC: 90000, SOL: 130 });
  const [holdings, setHoldings] = useState({ USDC: 10000, ETH: 0, BTC: 0, SOL: 0 });
  const [swapCount, setSwapCount] = useState(0);
  const [slippage, setSlippage] = useState('0.5');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const demoBalance = await AsyncStorage.getItem('demo_balance');
      const storedHoldings = await AsyncStorage.getItem('token_holdings');
      const count = await AsyncStorage.getItem('swap_count');
      
      const usdcBalance = demoBalance ? parseFloat(demoBalance) : 10000;
      const tokenHoldings = storedHoldings ? JSON.parse(storedHoldings) : {};
      
      setHoldings({
        USDC: usdcBalance,
        ETH: tokenHoldings.ETH || 0,
        BTC: tokenHoldings.BTC || 0,
        SOL: tokenHoldings.SOL || 0,
      });
      setSwapCount(count ? parseInt(count) : 0);
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const fetchPrices = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana,usd-coin&vs_currencies=usd'
      );
      const data = await response.json();
      setPrices({
        USDC: 1,
        ETH: data.ethereum?.usd || 3000,
        BTC: data.bitcoin?.usd || 90000,
        SOL: data.solana?.usd || 130,
      });
    } catch (error) {
      console.error('Price fetch error:', error);
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
    const slippageFactor = 1 - (parseFloat(slippage) / 100);
    const fee = 0.003; // 0.3% fee
    
    const inputValue = parseFloat(inputAmount) * fromPrice;
    const output = (inputValue / toPrice) * (1 - fee) * slippageFactor;
    setEstimatedOutput(output.toFixed(8));
  }, [fromToken, toToken, prices, slippage]);

  useEffect(() => {
    calculateOutput(amount);
  }, [amount, fromToken, toToken, calculateOutput]);

  const executeSwap = async () => {
    const inputAmount = parseFloat(amount);
    
    if (!amount || !isFinite(inputAmount) || inputAmount <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }

    const fromBalance = holdings[fromToken] || 0;
    if (inputAmount > fromBalance) {
      Alert.alert('Insufficient Balance', `You don't have enough ${fromToken}`);
      return;
    }

    setLoading(true);
    
    try {
      const outputAmount = parseFloat(estimatedOutput);
      
      // Update holdings
      const newHoldings = { ...holdings };
      newHoldings[fromToken] = (newHoldings[fromToken] || 0) - inputAmount;
      newHoldings[toToken] = (newHoldings[toToken] || 0) + outputAmount;
      
      // Ensure valid numbers
      Object.keys(newHoldings).forEach(key => {
        if (!isFinite(newHoldings[key]) || newHoldings[key] < 0.00000001) {
          newHoldings[key] = 0;
        }
      });
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save to storage
      await AsyncStorage.setItem('demo_balance', newHoldings.USDC.toString());
      await AsyncStorage.setItem('token_holdings', JSON.stringify({
        ETH: newHoldings.ETH,
        BTC: newHoldings.BTC,
        SOL: newHoldings.SOL,
      }));
      
      // Update swap count and check for rewards
      const newSwapCount = swapCount + 1;
      await AsyncStorage.setItem('swap_count', newSwapCount.toString());
      
      // REWARD: Free USDC for first 10 swaps!
      let rewardMessage = '';
      if (newSwapCount <= 10) {
        const rewardAmount = 5;
        newHoldings.USDC += rewardAmount;
        await AsyncStorage.setItem('demo_balance', newHoldings.USDC.toString());
        rewardMessage = `\n\n🎁 Swap Reward: +$${rewardAmount} USDC! (${newSwapCount}/10)`;
      }
      
      // Save to history
      const history = JSON.parse(await AsyncStorage.getItem('tx_history') || '[]');
      history.unshift({
        type: 'swap',
        fromToken,
        toToken,
        amountIn: inputAmount,
        amountOut: outputAmount,
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        status: 'confirmed',
      });
      await AsyncStorage.setItem('tx_history', JSON.stringify(history.slice(0, 50)));
      
      // Update state
      setHoldings(newHoldings);
      setSwapCount(newSwapCount);
      
      Alert.alert(
        'Swap Successful! 🎉',
        `Swapped ${inputAmount.toFixed(fromToken === 'USDC' ? 2 : 8)} ${fromToken}\nfor ${outputAmount.toFixed(8)} ${toToken}${rewardMessage}`,
        [{ text: 'Done', onPress: () => { setAmount(''); setEstimatedOutput(''); } }]
      );
    } catch (error) {
      Alert.alert('Error', 'Swap failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFromBalance = () => holdings[fromToken] || 0;
  const getToBalance = () => holdings[toToken] || 0;
  const getTokenColor = (symbol) => SWAP_TOKENS.find(t => t.symbol === symbol)?.color || '#00FFF0';

  const inputUsdValue = amount ? (parseFloat(amount) * prices[fromToken]).toFixed(2) : '0.00';
  const outputUsdValue = estimatedOutput ? (parseFloat(estimatedOutput) * prices[toToken]).toFixed(2) : '0.00';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a1a', '#0d1f3c', '#0a0a1a']} style={styles.gradient}>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.title}>Swap</Text>
            <Text style={styles.subtitle}>Instant token exchange • 0.3% fee</Text>

            {/* Rewards Banner */}
            {swapCount < 10 && (
              <View style={styles.rewardBanner}>
                <MaterialCommunityIcons name="gift" size={20} color="#FFD700" />
                <Text style={styles.rewardText}>
                  🎁 Earn $5 per swap! ({swapCount}/10 swaps)
                </Text>
              </View>
            )}

            {/* Swap Interface */}
            <View style={styles.swapContainer}>
              {/* From Card */}
              <View style={styles.swapCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>From</Text>
                  <TouchableOpacity onPress={() => setAmount(getFromBalance().toString())}>
                    <Text style={styles.balanceText}>
                      Balance: {getFromBalance().toFixed(fromToken === 'USDC' ? 2 : 6)}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.tokenSelector}>
                  {SWAP_TOKENS.map((token) => (
                    <TouchableOpacity
                      key={token.symbol}
                      style={[
                        styles.tokenBtn, 
                        fromToken === token.symbol && { borderColor: token.color, backgroundColor: `${token.color}15` }
                      ]}
                      onPress={() => { 
                        if (token.symbol !== toToken) {
                          setFromToken(token.symbol);
                        }
                      }}
                    >
                      <Text style={[
                        styles.tokenBtnText, 
                        fromToken === token.symbol && { color: token.color }
                      ]}>
                        {token.symbol}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#444"
                    value={amount}
                    onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.usdValue}>≈ ${inputUsdValue}</Text>
                </View>
              </View>

              {/* Swap Button */}
              <TouchableOpacity style={styles.swapButton} onPress={swapTokens} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#1a2a4a', '#0d1f3c']}
                  style={styles.swapButtonInner}
                >
                  <MaterialCommunityIcons name="swap-vertical" size={24} color="#00FFF0" />
                </LinearGradient>
              </TouchableOpacity>

              {/* To Card */}
              <View style={styles.swapCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardLabel}>To</Text>
                  <Text style={styles.balanceText}>
                    Balance: {getToBalance().toFixed(toToken === 'USDC' ? 2 : 6)}
                  </Text>
                </View>
                
                <View style={styles.tokenSelector}>
                  {SWAP_TOKENS.map((token) => (
                    <TouchableOpacity
                      key={token.symbol}
                      style={[
                        styles.tokenBtn, 
                        toToken === token.symbol && { borderColor: token.color, backgroundColor: `${token.color}15` }
                      ]}
                      onPress={() => { 
                        if (token.symbol !== fromToken) {
                          setToToken(token.symbol);
                        }
                      }}
                    >
                      <Text style={[
                        styles.tokenBtnText, 
                        toToken === token.symbol && { color: token.color }
                      ]}>
                        {token.symbol}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.output}>{estimatedOutput || '0.00'}</Text>
                  <Text style={styles.usdValue}>≈ ${outputUsdValue}</Text>
                </View>
              </View>
            </View>

            {/* Swap Details */}
            {estimatedOutput && parseFloat(estimatedOutput) > 0 && (
              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rate</Text>
                  <Text style={styles.detailValue}>
                    1 {fromToken} = {(prices[fromToken] / prices[toToken]).toFixed(6)} {toToken}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fee (0.3%)</Text>
                  <Text style={styles.detailValue}>
                    ${(parseFloat(amount || 0) * prices[fromToken] * 0.003).toFixed(4)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Slippage</Text>
                  <Text style={styles.detailValue}>{slippage}%</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Network</Text>
                  <Text style={[styles.detailValue, { color: '#00FFA3' }]}>Base Sepolia</Text>
                </View>
              </View>
            )}

            {/* Slippage Settings */}
            <View style={styles.slippageRow}>
              <Text style={styles.slippageLabel}>Slippage Tolerance</Text>
              <View style={styles.slippageOptions}>
                {['0.5', '1.0', '2.0'].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.slippageBtn, slippage === val && styles.slippageBtnActive]}
                    onPress={() => setSlippage(val)}
                  >
                    <Text style={[styles.slippageBtnText, slippage === val && styles.slippageBtnTextActive]}>
                      {val}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.executeButtonGradient}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={[styles.executeButtonText, { color: '#FFF', marginLeft: 8 }]}>
                      Swapping...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.executeButtonText}>Swap Tokens</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Live Prices */}
            <View style={styles.pricesCard}>
              <Text style={styles.pricesTitle}>Live Prices</Text>
              <View style={styles.pricesGrid}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceSymbol}>ETH</Text>
                  <Text style={styles.priceValue}>${prices.ETH.toLocaleString()}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceSymbol}>BTC</Text>
                  <Text style={styles.priceValue}>${prices.BTC.toLocaleString()}</Text>
                </View>
                <View style={styles.priceItem}>
                  <Text style={styles.priceSymbol}>SOL</Text>
                  <Text style={styles.priceValue}>${prices.SOL.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <MaterialCommunityIcons name="shield-check" size={16} color="#00FFF0" />
              <Text style={styles.securityText}>
                Self-custodial • Decentralized swaps • Base Sepolia Testnet
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 50, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  rewardText: { flex: 1, fontSize: 14, color: '#FFD700', fontWeight: '600' },
  swapContainer: { marginBottom: 16 },
  swapCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardLabel: { fontSize: 14, color: '#888', fontWeight: '500' },
  balanceText: { fontSize: 13, color: '#00FFF0' },
  tokenSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tokenBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tokenBtnText: { fontSize: 14, fontWeight: '700', color: '#666' },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  input: { fontSize: 32, color: '#FFF', fontWeight: '700', flex: 1 },
  output: { fontSize: 32, color: '#00FFF0', fontWeight: '700' },
  usdValue: { fontSize: 14, color: '#888' },
  swapButton: {
    alignSelf: 'center',
    marginVertical: -18,
    zIndex: 10,
  },
  swapButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00FFF0',
  },
  detailsCard: {
    backgroundColor: 'rgba(0, 255, 240, 0.05)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 14, color: '#888' },
  detailValue: { fontSize: 14, color: '#FFF', fontWeight: '600' },
  slippageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  slippageLabel: { fontSize: 14, color: '#888' },
  slippageOptions: { flexDirection: 'row', gap: 8 },
  slippageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  slippageBtnActive: { backgroundColor: 'rgba(0, 255, 240, 0.2)' },
  slippageBtnText: { fontSize: 13, color: '#888', fontWeight: '600' },
  slippageBtnTextActive: { color: '#00FFF0' },
  executeButton: { borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  executeButtonDisabled: { opacity: 0.6 },
  executeButtonGradient: { paddingVertical: 18, alignItems: 'center' },
  executeButtonText: { color: '#000', fontSize: 18, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  pricesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  pricesTitle: { fontSize: 13, color: '#666', marginBottom: 12, textAlign: 'center' },
  pricesGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  priceItem: { alignItems: 'center' },
  priceSymbol: { fontSize: 13, color: '#888', marginBottom: 4 },
  priceValue: { fontSize: 15, color: '#FFF', fontWeight: '600' },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  securityText: { fontSize: 12, color: '#666' },
});
