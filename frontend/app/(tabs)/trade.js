import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get('window');

export default function TradePage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [mode, setMode] = useState('BUY');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(10000);
  const [tokenHolding, setTokenHolding] = useState(0);
  const [price, setPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('24H');
  const [swapCount, setSwapCount] = useState(0);
  
  const coinId = params.coin || 'bitcoin';
  const symbol = params.symbol || 'BTC';
  const name = params.name || 'Bitcoin';

  useEffect(() => {
    loadData();
    loadChartData();
  }, [coinId, timeframe]);

  const loadData = async () => {
    try {
      // Load balance
      const demoBalance = await AsyncStorage.getItem('demo_balance');
      setBalance(demoBalance ? parseFloat(demoBalance) : 10000);
      
      // Load holdings
      const holdings = await AsyncStorage.getItem('token_holdings');
      const tokenHoldings = holdings ? JSON.parse(holdings) : {};
      const holding = tokenHoldings[symbol];
      setTokenHolding(holding && isFinite(holding) ? holding : 0);
      
      // Load swap count for rewards
      const count = await AsyncStorage.getItem('swap_count');
      setSwapCount(count ? parseInt(count) : 0);
      
      // Fetch price
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await response.json();
      setPrice(data[coinId]?.usd || 0);
      setPriceChange(data[coinId]?.usd_24h_change || 0);
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const loadChartData = async () => {
    setChartLoading(true);
    try {
      const days = timeframe === '24H' ? 1 : timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 365;
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
      );
      const data = await response.json();
      
      if (data.prices && data.prices.length > 0) {
        // Sample data points for smooth chart
        const step = Math.max(1, Math.floor(data.prices.length / 50));
        const chartPoints = data.prices
          .filter((_, i) => i % step === 0)
          .map(([timestamp, value]) => ({
            value: value,
            dataPointText: '',
          }));
        setChartData(chartPoints);
      }
    } catch (error) {
      console.error('Chart error:', error);
      // Generate mock data if API fails
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        value: price * (0.95 + Math.random() * 0.1),
      }));
      setChartData(mockData);
    } finally {
      setChartLoading(false);
    }
  };

  const getTokenColor = () => {
    const colors = {
      BTC: '#F7931A', ETH: '#627EEA', SOL: '#00FFA3', BNB: '#F3BA2F',
      XRP: '#23292F', ADA: '#0033AD', DOGE: '#C3A634', AVAX: '#E84142',
      TON: '#0098EA', MATIC: '#8247E5', USDC: '#2775CA',
    };
    return colors[symbol] || '#00FFF0';
  };

  const calculateTokenAmount = () => {
    if (!amount || !price || price === 0) return '0.00000000';
    const usdAmount = parseFloat(amount);
    if (!isFinite(usdAmount)) return '0.00000000';
    return (usdAmount / price).toFixed(8);
  };

  const calculateUsdValue = () => {
    if (!amount || !price) return '0.00';
    const tokenAmount = parseFloat(amount);
    if (!isFinite(tokenAmount)) return '0.00';
    return (tokenAmount * price).toFixed(2);
  };

  const executeTrade = async () => {
    const inputAmount = parseFloat(amount);
    if (!amount || !isFinite(inputAmount) || inputAmount <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }

    if (mode === 'BUY') {
      if (inputAmount > balance) {
        Alert.alert('Insufficient Balance', 'You don\'t have enough USDC');
        return;
      }
    } else {
      if (inputAmount > tokenHolding) {
        Alert.alert('Insufficient Balance', `You don't have enough ${symbol}`);
        return;
      }
    }

    setLoading(true);
    
    try {
      // Simulate blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const holdings = await AsyncStorage.getItem('token_holdings');
      const tokenHoldings = holdings ? JSON.parse(holdings) : {};
      
      let newBalance = balance;
      let newHolding = tokenHoldings[symbol] || 0;
      let tokensBought = 0;
      let usdValue = 0;
      
      if (mode === 'BUY') {
        tokensBought = inputAmount / price;
        newBalance = balance - inputAmount;
        newHolding = newHolding + tokensBought;
        usdValue = inputAmount;
      } else {
        usdValue = inputAmount * price;
        newBalance = balance + usdValue;
        newHolding = newHolding - inputAmount;
        tokensBought = inputAmount;
      }
      
      // Ensure valid numbers
      if (!isFinite(newHolding)) newHolding = 0;
      if (newHolding < 0.00000001) newHolding = 0;
      
      // Save balances
      await AsyncStorage.setItem('demo_balance', newBalance.toString());
      tokenHoldings[symbol] = newHolding;
      await AsyncStorage.setItem('token_holdings', JSON.stringify(tokenHoldings));
      
      // Update swap count and check for rewards
      const currentSwapCount = swapCount + 1;
      await AsyncStorage.setItem('swap_count', currentSwapCount.toString());
      setSwapCount(currentSwapCount);
      
      // REWARD: Free tokens for first 10 trades!
      let rewardMessage = '';
      if (currentSwapCount <= 10) {
        const rewardAmount = 5; // $5 bonus per trade
        const newBalanceWithReward = newBalance + rewardAmount;
        await AsyncStorage.setItem('demo_balance', newBalanceWithReward.toString());
        newBalance = newBalanceWithReward;
        rewardMessage = `\n\n🎁 Trade Reward: +$${rewardAmount} USDC (${currentSwapCount}/10 trades)`;
      }
      
      // Save to history
      const history = JSON.parse(await AsyncStorage.getItem('tx_history') || '[]');
      history.unshift({
        type: mode.toLowerCase(),
        symbol,
        tokenAmount: mode === 'BUY' ? tokensBought : inputAmount,
        usdAmount: mode === 'BUY' ? inputAmount : usdValue,
        price,
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
        status: 'confirmed',
      });
      await AsyncStorage.setItem('tx_history', JSON.stringify(history.slice(0, 50)));
      
      // Update local state
      setBalance(newBalance);
      setTokenHolding(newHolding);
      
      Alert.alert(
        `${mode} Successful! 🎉`,
        mode === 'BUY' 
          ? `Bought ${tokensBought.toFixed(8)} ${symbol} for $${inputAmount.toFixed(2)}${rewardMessage}`
          : `Sold ${inputAmount.toFixed(8)} ${symbol} for $${usdValue.toFixed(2)}${rewardMessage}`,
        [{ text: 'Done', onPress: () => setAmount('') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Trade failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isPositive = priceChange >= 0;
  const chartColor = isPositive ? '#00FFA3' : '#FF4444';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a1a', '#0d1f3c', '#0a0a1a']} style={styles.gradient}>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <View style={[styles.tokenIconLarge, { backgroundColor: `${getTokenColor()}30` }]}>
                  <Text style={[styles.tokenIconText, { color: getTokenColor() }]}>{symbol[0]}</Text>
                </View>
                <Text style={styles.headerTitle}>{symbol}/USDC</Text>
              </View>
              <TouchableOpacity style={styles.favoriteBtn}>
                <MaterialCommunityIcons name="star-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Price Display */}
            <View style={styles.priceSection}>
              <Text style={styles.currentPrice}>
                ${price < 1 ? price.toFixed(6) : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
              <View style={[styles.changeBadge, isPositive ? styles.changePositive : styles.changeNegative]}>
                <MaterialCommunityIcons 
                  name={isPositive ? 'trending-up' : 'trending-down'} 
                  size={16} 
                  color={isPositive ? '#00FFA3' : '#FF4444'} 
                />
                <Text style={[styles.changeText, { color: isPositive ? '#00FFA3' : '#FF4444' }]}>
                  {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                </Text>
              </View>
            </View>

            {/* Chart */}
            <View style={styles.chartContainer}>
              {chartLoading ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator color="#00FFF0" />
                </View>
              ) : chartData.length > 0 ? (
                <LineChart
                  data={chartData}
                  width={width - 48}
                  height={180}
                  color={chartColor}
                  thickness={2}
                  hideDataPoints
                  hideYAxisText
                  hideAxesAndRules
                  areaChart
                  startFillColor={chartColor}
                  endFillColor="transparent"
                  startOpacity={0.3}
                  endOpacity={0}
                  curved
                  adjustToWidth
                />
              ) : null}
              
              {/* Timeframe Selector */}
              <View style={styles.timeframeRow}>
                {['24H', '7D', '30D', '1Y'].map((tf) => (
                  <TouchableOpacity
                    key={tf}
                    style={[styles.timeframeBtn, timeframe === tf && styles.timeframeBtnActive]}
                    onPress={() => setTimeframe(tf)}
                  >
                    <Text style={[styles.timeframeText, timeframe === tf && styles.timeframeTextActive]}>
                      {tf}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Balance Cards */}
            <View style={styles.balanceRow}>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Available USDC</Text>
                <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>
              </View>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>{symbol} Holdings</Text>
                <Text style={styles.balanceValue}>
                  {tokenHolding > 0 ? tokenHolding.toFixed(8) : '0.00'}
                </Text>
                {tokenHolding > 0 && (
                  <Text style={styles.balanceUsd}>≈ ${(tokenHolding * price).toFixed(2)}</Text>
                )}
              </View>
            </View>

            {/* Trade Reward Banner */}
            {swapCount < 10 && (
              <View style={styles.rewardBanner}>
                <MaterialCommunityIcons name="gift" size={20} color="#FFD700" />
                <Text style={styles.rewardText}>
                  🎁 Trade Rewards: Get $5 USDC bonus per trade! ({swapCount}/10 trades)
                </Text>
              </View>
            )}

            {/* Buy/Sell Toggle */}
            <View style={styles.modeSelector}>
              <TouchableOpacity 
                style={[styles.modeButton, mode === 'BUY' && styles.modeBuyActive]}
                onPress={() => { setMode('BUY'); setAmount(''); }}
              >
                <MaterialCommunityIcons name="arrow-bottom-left" size={18} color={mode === 'BUY' ? '#00FFA3' : '#666'} />
                <Text style={[styles.modeText, mode === 'BUY' && styles.modeBuyText]}>BUY</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeButton, mode === 'SELL' && styles.modeSellActive]}
                onPress={() => { setMode('SELL'); setAmount(''); }}
              >
                <MaterialCommunityIcons name="arrow-top-right" size={18} color={mode === 'SELL' ? '#FF4444' : '#666'} />
                <Text style={[styles.modeText, mode === 'SELL' && styles.modeSellText]}>SELL</Text>
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>
                  {mode === 'BUY' ? 'Spend (USDC)' : `Sell (${symbol})`}
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    if (mode === 'BUY') {
                      setAmount(balance.toFixed(2));
                    } else {
                      setAmount(tokenHolding.toFixed(8));
                    }
                  }}
                >
                  <Text style={styles.maxBtn}>MAX</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputRow}>
                {mode === 'BUY' && <Text style={styles.inputPrefix}>$</Text>}
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#444"
                  value={amount}
                  onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputSuffix}>{mode === 'BUY' ? 'USDC' : symbol}</Text>
              </View>
              <View style={styles.conversionRow}>
                <MaterialCommunityIcons name="swap-vertical" size={16} color="#666" />
                <Text style={styles.conversionText}>
                  {mode === 'BUY' 
                    ? `≈ ${calculateTokenAmount()} ${symbol}`
                    : `≈ $${calculateUsdValue()} USDC`
                  }
                </Text>
              </View>
            </View>

            {/* Quick Amounts */}
            <View style={styles.quickAmounts}>
              {mode === 'BUY' ? (
                ['100', '250', '500', '1000'].map((val) => (
                  <TouchableOpacity 
                    key={val} 
                    style={[styles.quickBtn, amount === val && styles.quickBtnActive]}
                    onPress={() => setAmount(val)}
                  >
                    <Text style={[styles.quickBtnText, amount === val && styles.quickBtnTextActive]}>${val}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                ['25%', '50%', '75%', '100%'].map((val, i) => (
                  <TouchableOpacity 
                    key={val} 
                    style={styles.quickBtn}
                    onPress={() => {
                      const pct = [0.25, 0.5, 0.75, 1][i];
                      setAmount((tokenHolding * pct).toFixed(8));
                    }}
                  >
                    <Text style={styles.quickBtnText}>{val}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Order Summary */}
            {amount && parseFloat(amount) > 0 && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Price</Text>
                  <Text style={styles.summaryValue}>${price.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {mode === 'BUY' ? 'You receive' : 'You get'}
                  </Text>
                  <Text style={styles.summaryValue}>
                    {mode === 'BUY' 
                      ? `${calculateTokenAmount()} ${symbol}`
                      : `$${calculateUsdValue()} USDC`
                    }
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Fee</Text>
                  <Text style={styles.summaryValue}>$0.00 (Free)</Text>
                </View>
              </View>
            )}

            {/* Trade Button */}
            <TouchableOpacity 
              style={[styles.tradeButton, loading && styles.tradeButtonDisabled]} 
              onPress={executeTrade}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={mode === 'BUY' ? ['#00FFA3', '#00CC82'] : ['#FF4444', '#CC0000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tradeButtonGradient}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={styles.tradeButtonText}>  Processing...</Text>
                  </View>
                ) : (
                  <Text style={styles.tradeButtonText}>
                    {mode} {symbol}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <MaterialCommunityIcons name="shield-check" size={16} color="#00FFF0" />
              <Text style={styles.securityText}>
                Self-custodial • Your keys, your crypto • Base Sepolia Testnet
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tokenIconLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: { fontSize: 18, fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  favoriteBtn: { padding: 8 },
  priceSection: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  currentPrice: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  changePositive: { backgroundColor: 'rgba(0, 255, 163, 0.15)' },
  changeNegative: { backgroundColor: 'rgba(255, 68, 68, 0.15)' },
  changeText: { fontSize: 14, fontWeight: '600' },
  chartContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  chartLoading: { height: 180, justifyContent: 'center', alignItems: 'center' },
  timeframeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 },
  timeframeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  timeframeBtnActive: { backgroundColor: 'rgba(0, 255, 240, 0.2)' },
  timeframeText: { fontSize: 13, color: '#666', fontWeight: '600' },
  timeframeTextActive: { color: '#00FFF0' },
  balanceRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  balanceCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  balanceLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  balanceValue: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  balanceUsd: { fontSize: 12, color: '#00FFF0', marginTop: 4 },
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  rewardText: { flex: 1, fontSize: 13, color: '#FFD700', fontWeight: '500' },
  modeSelector: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  modeBuyActive: { backgroundColor: 'rgba(0, 255, 163, 0.15)', borderWidth: 1, borderColor: '#00FFA3' },
  modeSellActive: { backgroundColor: 'rgba(255, 68, 68, 0.15)', borderWidth: 1, borderColor: '#FF4444' },
  modeText: { fontSize: 16, fontWeight: '700', color: '#666' },
  modeBuyText: { color: '#00FFA3' },
  modeSellText: { color: '#FF4444' },
  inputCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  inputLabel: { fontSize: 14, color: '#888' },
  maxBtn: { fontSize: 14, color: '#00FFF0', fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputPrefix: { fontSize: 28, fontWeight: '700', color: '#00FFF0', marginRight: 4 },
  input: { flex: 1, fontSize: 28, fontWeight: '700', color: '#FFF' },
  inputSuffix: { fontSize: 16, color: '#666', fontWeight: '600' },
  conversionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  conversionText: { fontSize: 14, color: '#888' },
  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickBtnActive: { borderColor: '#00FFF0', backgroundColor: 'rgba(0, 255, 240, 0.1)' },
  quickBtnText: { fontSize: 14, color: '#888', fontWeight: '600' },
  quickBtnTextActive: { color: '#00FFF0' },
  summaryCard: {
    backgroundColor: 'rgba(0, 255, 240, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, color: '#888' },
  summaryValue: { fontSize: 14, color: '#FFF', fontWeight: '600' },
  tradeButton: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  tradeButtonDisabled: { opacity: 0.6 },
  tradeButtonGradient: { paddingVertical: 18, alignItems: 'center' },
  tradeButtonText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  securityText: { fontSize: 12, color: '#666' },
});
