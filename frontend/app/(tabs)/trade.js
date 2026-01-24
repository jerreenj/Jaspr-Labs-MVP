import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TradePage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [mode, setMode] = useState('BUY');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(10000);
  const [tokenHolding, setTokenHolding] = useState(0);
  const [price, setPrice] = useState(0);
  
  const coinId = params.coin || 'bitcoin';
  const symbol = params.symbol || 'BTC';
  const name = params.name || 'Bitcoin';

  useEffect(() => {
    loadData();
  }, [coinId]);

  const loadData = async () => {
    try {
      // Load balance
      const demoBalance = await AsyncStorage.getItem('demo_balance');
      setBalance(demoBalance ? parseFloat(demoBalance) : 10000);
      
      // Load holdings
      const holdings = await AsyncStorage.getItem('token_holdings');
      const tokenHoldings = holdings ? JSON.parse(holdings) : {};
      setTokenHolding(tokenHoldings[symbol] || 0);
      
      // Fetch price
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await response.json();
      setPrice(data[coinId]?.usd || 0);
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const getTokenColor = () => {
    const colors = {
      BTC: '#F7931A',
      ETH: '#627EEA',
      SOL: '#00FFA3',
      BNB: '#F3BA2F',
      XRP: '#23292F',
      ADA: '#0033AD',
      DOGE: '#C3A634',
      AVAX: '#E84142',
    };
    return colors[symbol] || '#00FFF0';
  };

  const calculateTokenAmount = () => {
    if (!amount || !price) return '0';
    const usdAmount = parseFloat(amount);
    return (usdAmount / price).toFixed(8);
  };

  const calculateUsdValue = () => {
    if (!amount || !price) return '0';
    const tokenAmount = parseFloat(amount);
    return (tokenAmount * price).toFixed(2);
  };

  const executeTrade = async () => {
    const inputAmount = parseFloat(amount);
    if (!amount || inputAmount <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }

    if (mode === 'BUY') {
      if (inputAmount > balance) {
        Alert.alert('Insufficient Balance', 'You don\'t have enough USDC');
        return;
      }
    } else {
      const sellAmount = inputAmount;
      if (sellAmount > tokenHolding) {
        Alert.alert('Insufficient Balance', `You don't have enough ${symbol}`);
        return;
      }
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const holdings = await AsyncStorage.getItem('token_holdings');
      const tokenHoldings = holdings ? JSON.parse(holdings) : {};
      
      let newBalance = balance;
      let newHolding = tokenHoldings[symbol] || 0;
      
      if (mode === 'BUY') {
        const tokenAmount = inputAmount / price;
        newBalance = balance - inputAmount;
        newHolding = (tokenHoldings[symbol] || 0) + tokenAmount;
      } else {
        const usdValue = inputAmount * price;
        newBalance = balance + usdValue;
        newHolding = (tokenHoldings[symbol] || 0) - inputAmount;
      }
      
      // Save
      await AsyncStorage.setItem('demo_balance', newBalance.toString());
      tokenHoldings[symbol] = newHolding;
      await AsyncStorage.setItem('token_holdings', JSON.stringify(tokenHoldings));
      
      // Save to history
      const history = JSON.parse(await AsyncStorage.getItem('tx_history') || '[]');
      history.unshift({
        type: mode.toLowerCase(),
        symbol,
        amount: amount,
        price,
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
      });
      await AsyncStorage.setItem('tx_history', JSON.stringify(history.slice(0, 50)));
      
      setBalance(newBalance);
      setTokenHolding(newHolding);
      
      Alert.alert(
        `${mode} Successful! 🎉`,
        mode === 'BUY' 
          ? `Bought ${calculateTokenAmount()} ${symbol} for $${amount}`
          : `Sold ${amount} ${symbol} for $${calculateUsdValue()}`,
        [{ text: 'Done', onPress: () => setAmount('') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000428', '#004e92']} style={styles.gradient}>
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
                <Text style={styles.headerTitle}>{name}</Text>
                <Text style={styles.headerSymbol}>{symbol}</Text>
              </View>
              <View style={{ width: 40 }} />
            </View>

            {/* Price Card */}
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Current Price</Text>
              <Text style={styles.priceValue}>
                ${price < 1 ? price.toFixed(4) : price.toLocaleString()}
              </Text>
            </View>

            {/* Balance Info */}
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>USDC Balance</Text>
                <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>{symbol} Holding</Text>
                <Text style={styles.balanceValue}>{tokenHolding.toFixed(6)}</Text>
              </View>
            </View>

            {/* Buy/Sell Toggle */}
            <View style={styles.modeSelector}>
              <TouchableOpacity 
                style={[styles.modeButton, mode === 'BUY' && styles.modeBuyActive]}
                onPress={() => setMode('BUY')}
              >
                <Text style={[styles.modeText, mode === 'BUY' && styles.modeTextActive]}>BUY</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeButton, mode === 'SELL' && styles.modeSellActive]}
                onPress={() => setMode('SELL')}
              >
                <Text style={[styles.modeText, mode === 'SELL' && styles.modeTextActive]}>SELL</Text>
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>
                {mode === 'BUY' ? 'Amount (USD)' : `Amount (${symbol})`}
              </Text>
              <View style={styles.inputRow}>
                {mode === 'BUY' && <Text style={styles.inputPrefix}>$</Text>}
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              <Text style={styles.inputHint}>
                {mode === 'BUY' 
                  ? `≈ ${calculateTokenAmount()} ${symbol}`
                  : `≈ $${calculateUsdValue()}`
                }
              </Text>
            </View>

            {/* Quick Amounts */}
            <View style={styles.quickAmounts}>
              {mode === 'BUY' ? (
                ['100', '500', '1000', '2500'].map((val) => (
                  <TouchableOpacity 
                    key={val} 
                    style={styles.quickBtn}
                    onPress={() => setAmount(val)}
                  >
                    <Text style={styles.quickBtnText}>${val}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                ['25%', '50%', '75%', 'MAX'].map((val, i) => (
                  <TouchableOpacity 
                    key={val} 
                    style={styles.quickBtn}
                    onPress={() => {
                      const pct = [0.25, 0.5, 0.75, 1][i];
                      setAmount((tokenHolding * pct).toFixed(6));
                    }}
                  >
                    <Text style={styles.quickBtnText}>{val}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Trade Button */}
            <TouchableOpacity 
              style={[styles.tradeButton, loading && styles.tradeButtonDisabled]} 
              onPress={executeTrade}
              disabled={loading || !amount}
            >
              <LinearGradient
                colors={mode === 'BUY' ? ['#00FFA3', '#00CC82'] : ['#FF4444', '#CC0000']}
                style={styles.tradeButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.tradeButtonText}>
                    {mode} {symbol}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <MaterialCommunityIcons name="information" size={18} color="#00FFF0" />
              <Text style={styles.infoBannerText}>
                Demo trading on Base Sepolia testnet. No real funds.
              </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: { padding: 8 },
  headerCenter: { alignItems: 'center' },
  tokenIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenIconText: { fontSize: 24, fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSymbol: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  priceCard: {
    backgroundColor: 'rgba(0, 255, 240, 0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 240, 0.2)',
  },
  priceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  priceValue: { fontSize: 36, fontWeight: '700', color: '#FFF', marginTop: 4 },
  balanceRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  balanceItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  balanceValue: { fontSize: 16, fontWeight: '600', color: '#FFF', marginTop: 4 },
  modeSelector: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  modeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  modeBuyActive: { backgroundColor: 'rgba(0, 255, 163, 0.2)', borderWidth: 1, borderColor: '#00FFA3' },
  modeSellActive: { backgroundColor: 'rgba(255, 68, 68, 0.2)', borderWidth: 1, borderColor: '#FF4444' },
  modeText: { fontSize: 16, fontWeight: '700', color: '#888' },
  modeTextActive: { color: '#FFF' },
  inputCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  inputPrefix: { fontSize: 32, fontWeight: '700', color: '#00FFF0', marginRight: 4 },
  input: { flex: 1, fontSize: 32, fontWeight: '700', color: '#FFF' },
  inputHint: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 12 },
  quickAmounts: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  quickBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    alignItems: 'center',
  },
  quickBtnText: { fontSize: 14, color: '#00FFF0', fontWeight: '600' },
  tradeButton: { borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  tradeButtonDisabled: { opacity: 0.6 },
  tradeButtonGradient: { paddingVertical: 18, alignItems: 'center' },
  tradeButtonText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 240, 0.05)',
    padding: 14,
    borderRadius: 10,
    gap: 10,
  },
  infoBannerText: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
});
