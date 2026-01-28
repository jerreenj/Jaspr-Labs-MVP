import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, Image, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// All 25 tokens for swapping
const ALL_TOKENS = [
  { symbol: 'USDC', name: 'USD Coin', coingeckoId: 'usd-coin', logo: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
  { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin', logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum', logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { symbol: 'USDT', name: 'Tether', coingeckoId: 'tether', logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
  { symbol: 'BNB', name: 'BNB', coingeckoId: 'binancecoin', logo: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana', logo: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { symbol: 'XRP', name: 'XRP', coingeckoId: 'ripple', logo: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
  { symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin', logo: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
  { symbol: 'ADA', name: 'Cardano', coingeckoId: 'cardano', logo: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
  { symbol: 'AVAX', name: 'Avalanche', coingeckoId: 'avalanche-2', logo: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
  { symbol: 'TRX', name: 'TRON', coingeckoId: 'tron', logo: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png' },
  { symbol: 'TON', name: 'Toncoin', coingeckoId: 'the-open-network', logo: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png' },
  { symbol: 'DOT', name: 'Polkadot', coingeckoId: 'polkadot', logo: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png' },
  { symbol: 'MATIC', name: 'Polygon', coingeckoId: 'matic-network', logo: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png' },
  { symbol: 'LINK', name: 'Chainlink', coingeckoId: 'chainlink', logo: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
  { symbol: 'SHIB', name: 'Shiba Inu', coingeckoId: 'shiba-inu', logo: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png' },
  { symbol: 'WBTC', name: 'Wrapped BTC', coingeckoId: 'wrapped-bitcoin', logo: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png' },
  { symbol: 'LTC', name: 'Litecoin', coingeckoId: 'litecoin', logo: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png' },
  { symbol: 'UNI', name: 'Uniswap', coingeckoId: 'uniswap', logo: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-logo.png' },
  { symbol: 'DAI', name: 'Dai', coingeckoId: 'dai', logo: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png' },
  { symbol: 'ICP', name: 'Internet Computer', coingeckoId: 'internet-computer', logo: 'https://assets.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png' },
  { symbol: 'NEAR', name: 'NEAR Protocol', coingeckoId: 'near', logo: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg' },
  { symbol: 'APT', name: 'Aptos', coingeckoId: 'aptos', logo: 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png' },
  { symbol: 'PEPE', name: 'Pepe', coingeckoId: 'pepe', logo: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg' },
  { symbol: 'ARB', name: 'Arbitrum', coingeckoId: 'arbitrum', logo: 'https://assets.coingecko.com/coins/images/16547/small/arb.jpg' },
];

// Default prices fallback
const DEFAULT_PRICES = {
  USDC: 1, USDT: 1, DAI: 1, BTC: 96500, ETH: 3650, BNB: 695, SOL: 185, XRP: 2.35,
  DOGE: 0.38, ADA: 0.98, AVAX: 38.5, TRX: 0.25, TON: 5.8, DOT: 7.2, MATIC: 0.52,
  LINK: 14.5, SHIB: 0.000022, WBTC: 96400, LTC: 108, UNI: 12.8, ICP: 11.5,
  NEAR: 5.2, APT: 9.8, PEPE: 0.000018, ARB: 0.92,
};

export default function SwapPage() {
  const [fromToken, setFromToken] = useState(ALL_TOKENS[0]); // USDC
  const [toToken, setToToken] = useState(ALL_TOKENS[2]); // ETH
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [holdings, setHoldings] = useState({});
  const [swapCount, setSwapCount] = useState(0);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);

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
        ...tokenHoldings,
      });
      setSwapCount(count ? parseInt(count) : 0);
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const fetchPrices = async () => {
    setPriceLoading(true);
    try {
      const ids = ALL_TOKENS.map(t => t.coingeckoId).join(',');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      const newPrices = { ...DEFAULT_PRICES };
      ALL_TOKENS.forEach(token => {
        if (data[token.coingeckoId]?.usd) {
          newPrices[token.symbol] = data[token.coingeckoId].usd;
        }
      });
      setPrices(newPrices);
    } catch (error) {
      console.log('Using fallback prices');
    } finally {
      setPriceLoading(false);
    }
  };

  const getBalance = (symbol) => {
    return holdings[symbol] || 0;
  };

  const calculateOutput = () => {
    if (!amount || parseFloat(amount) <= 0) return '0';
    const inputAmount = parseFloat(amount);
    const fromPrice = prices[fromToken.symbol] || 1;
    const toPrice = prices[toToken.symbol] || 1;
    const usdValue = inputAmount * fromPrice;
    const outputAmount = usdValue / toPrice;
    // Apply 0.3% swap fee
    const outputAfterFee = outputAmount * 0.997;
    return outputAfterFee;
  };

  const getOutputDisplay = () => {
    const output = calculateOutput();
    if (output === '0' || output === 0) return '0.00';
    if (output < 0.00000001) return output.toExponential(4);
    if (output < 0.0001) return output.toFixed(8);
    if (output < 1) return output.toFixed(6);
    return output.toFixed(4);
  };

  const getUsdValue = () => {
    if (!amount || parseFloat(amount) <= 0) return '$0.00';
    const inputAmount = parseFloat(amount);
    const fromPrice = prices[fromToken.symbol] || 1;
    return `$${(inputAmount * fromPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getRate = () => {
    const fromPrice = prices[fromToken.symbol] || 1;
    const toPrice = prices[toToken.symbol] || 1;
    const rate = fromPrice / toPrice;
    if (rate < 0.0001) return rate.toExponential(4);
    if (rate < 1) return rate.toFixed(6);
    return rate.toFixed(4);
  };

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmount('');
  };

  const executeSwap = async () => {
    const inputAmount = parseFloat(amount);
    if (!amount || !isFinite(inputAmount) || inputAmount <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }

    const fromBalance = getBalance(fromToken.symbol);
    if (inputAmount > fromBalance) {
      Alert.alert('Insufficient Balance', `You don't have enough ${fromToken.symbol}`);
      return;
    }

    if (fromToken.symbol === toToken.symbol) {
      Alert.alert('Error', 'Cannot swap to the same token');
      return;
    }

    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const outputAmount = calculateOutput();
      
      // Update balances
      const storedHoldings = await AsyncStorage.getItem('token_holdings');
      const tokenHoldings = storedHoldings ? JSON.parse(storedHoldings) : {};
      
      let newFromBalance, newToBalance;
      
      if (fromToken.symbol === 'USDC') {
        // Swapping from USDC
        const currentUSDC = await AsyncStorage.getItem('demo_balance');
        newFromBalance = parseFloat(currentUSDC || '10000') - inputAmount;
        await AsyncStorage.setItem('demo_balance', newFromBalance.toString());
        
        newToBalance = (tokenHoldings[toToken.symbol] || 0) + outputAmount;
        tokenHoldings[toToken.symbol] = newToBalance;
      } else if (toToken.symbol === 'USDC') {
        // Swapping to USDC
        newFromBalance = (tokenHoldings[fromToken.symbol] || 0) - inputAmount;
        tokenHoldings[fromToken.symbol] = newFromBalance > 0.00000001 ? newFromBalance : 0;
        
        const currentUSDC = await AsyncStorage.getItem('demo_balance');
        newToBalance = parseFloat(currentUSDC || '10000') + outputAmount;
        await AsyncStorage.setItem('demo_balance', newToBalance.toString());
      } else {
        // Cross-token swap
        newFromBalance = (tokenHoldings[fromToken.symbol] || 0) - inputAmount;
        tokenHoldings[fromToken.symbol] = newFromBalance > 0.00000001 ? newFromBalance : 0;
        
        newToBalance = (tokenHoldings[toToken.symbol] || 0) + outputAmount;
        tokenHoldings[toToken.symbol] = newToBalance;
      }
      
      await AsyncStorage.setItem('token_holdings', JSON.stringify(tokenHoldings));
      
      // Trade rewards (first 10 trades get $5 bonus)
      let bonusText = '';
      if (swapCount < 10) {
        let usdcBalance = parseFloat(await AsyncStorage.getItem('demo_balance') || '10000');
        usdcBalance += 5;
        await AsyncStorage.setItem('demo_balance', usdcBalance.toString());
        await AsyncStorage.setItem('swap_count', (swapCount + 1).toString());
        setSwapCount(swapCount + 1);
        bonusText = '\n\n🎁 +$5 Trade Reward!';
      }
      
      // Save to history
      const history = JSON.parse(await AsyncStorage.getItem('tx_history') || '[]');
      history.unshift({
        type: 'swap',
        fromSymbol: fromToken.symbol,
        toSymbol: toToken.symbol,
        fromAmount: inputAmount,
        toAmount: outputAmount,
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
      });
      await AsyncStorage.setItem('tx_history', JSON.stringify(history.slice(0, 50)));
      
      await loadData();
      setAmount('');
      
      Alert.alert(
        '✅ Swap Complete',
        `Swapped ${inputAmount} ${fromToken.symbol}\n→ ${getOutputDisplay()} ${toToken.symbol}${bonusText}`,
        [{ text: 'Done' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Swap failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const TokenSelector = ({ visible, onClose, onSelect, excludeSymbol }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.tokenPickerModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Token</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={ALL_TOKENS.filter(t => t.symbol !== excludeSymbol)}
            keyExtractor={(item) => item.symbol}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.tokenOption}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Image source={{ uri: item.logo }} style={styles.tokenOptionLogo} />
                <View style={styles.tokenOptionInfo}>
                  <Text style={styles.tokenOptionSymbol}>{item.symbol}</Text>
                  <Text style={styles.tokenOptionName}>{item.name}</Text>
                </View>
                <View style={styles.tokenOptionRight}>
                  <Text style={styles.tokenOptionBalance}>{(holdings[item.symbol] || 0).toFixed(item.symbol === 'USDC' || item.symbol === 'USDT' ? 2 : 6)}</Text>
                  <Text style={styles.tokenOptionPrice}>${prices[item.symbol]?.toLocaleString() || '0'}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Swap</Text>
          <Text style={styles.subtitle}>Trade any token instantly</Text>

          {/* From Token */}
          <View style={styles.swapCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>From</Text>
              <Text style={styles.cardBalance}>Balance: {getBalance(fromToken.symbol).toFixed(fromToken.symbol === 'USDC' ? 2 : 6)}</Text>
            </View>
            <View style={styles.cardContent}>
              <TouchableOpacity style={styles.tokenSelector} onPress={() => setShowFromPicker(true)}>
                <Image source={{ uri: fromToken.logo }} style={styles.tokenLogo} />
                <Text style={styles.tokenSymbol}>{fromToken.symbol}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#888" />
              </TouchableOpacity>
              <View style={styles.inputSection}>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#444"
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity onPress={() => setAmount(getBalance(fromToken.symbol).toString())}>
                  <Text style={styles.maxBtn}>MAX</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.usdValue}>{getUsdValue()}</Text>
          </View>

          {/* Swap Button */}
          <TouchableOpacity style={styles.swapIconBtn} onPress={swapTokens}>
            <MaterialCommunityIcons name="swap-vertical" size={24} color="#FFF" />
          </TouchableOpacity>

          {/* To Token */}
          <View style={styles.swapCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>To</Text>
              <Text style={styles.cardBalance}>Balance: {getBalance(toToken.symbol).toFixed(toToken.symbol === 'USDC' ? 2 : 6)}</Text>
            </View>
            <View style={styles.cardContent}>
              <TouchableOpacity style={styles.tokenSelector} onPress={() => setShowToPicker(true)}>
                <Image source={{ uri: toToken.logo }} style={styles.tokenLogo} />
                <Text style={styles.tokenSymbol}>{toToken.symbol}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#888" />
              </TouchableOpacity>
              <View style={styles.inputSection}>
                <Text style={styles.outputAmount}>{getOutputDisplay()}</Text>
              </View>
            </View>
          </View>

          {/* Swap Details */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rate</Text>
              <Text style={styles.detailValue}>1 {fromToken.symbol} = {getRate()} {toToken.symbol}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fee</Text>
              <Text style={styles.detailValue}>0.3%</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Network</Text>
              <View style={styles.networkBadge}>
                <View style={styles.networkDot} />
                <Text style={styles.networkText}>Base Sepolia</Text>
              </View>
            </View>
          </View>

          {/* Swap Button */}
          <TouchableOpacity
            style={[styles.swapBtn, loading && styles.swapBtnDisabled]}
            onPress={executeSwap}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.swapBtnText}>Swap {fromToken.symbol} → {toToken.symbol}</Text>
            )}
          </TouchableOpacity>

          {/* Trade Rewards */}
          {swapCount < 10 && (
            <View style={styles.rewardBanner}>
              <MaterialCommunityIcons name="gift" size={18} color="#FFD700" />
              <Text style={styles.rewardText}>{10 - swapCount} trades left for $5 bonus each!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Token Pickers */}
      <TokenSelector
        visible={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        onSelect={setFromToken}
        excludeSymbol={toToken.symbol}
      />
      <TokenSelector
        visible={showToPicker}
        onClose={() => setShowToPicker(false)}
        onSelect={setToToken}
        excludeSymbol={fromToken.symbol}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 50, paddingBottom: 100 },
  title: { fontSize: 32, fontWeight: '700', color: '#FFF', fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4, marginBottom: 24 },
  swapCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardLabel: { fontSize: 14, color: '#888' },
  cardBalance: { fontSize: 13, color: '#666' },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  tokenLogo: { width: 28, height: 28, borderRadius: 14 },
  tokenSymbol: { fontSize: 18, fontWeight: '700', color: '#FFF', fontFamily: 'Inter_700Bold' },
  inputSection: { flex: 1, alignItems: 'flex-end' },
  amountInput: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'right',
    fontFamily: 'Inter_600SemiBold',
  },
  outputAmount: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
  },
  maxBtn: { fontSize: 13, fontWeight: '700', color: '#888', marginTop: 4 },
  usdValue: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'right' },
  swapIconBtn: {
    alignSelf: 'center',
    backgroundColor: '#222',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: -12,
    zIndex: 10,
    borderWidth: 4,
    borderColor: '#000',
  },
  detailsCard: {
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: { fontSize: 14, color: '#888' },
  detailValue: { fontSize: 14, color: '#FFF', fontWeight: '500' },
  networkBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  networkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C853' },
  networkText: { fontSize: 14, color: '#FFF' },
  swapBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  swapBtnDisabled: { backgroundColor: '#333' },
  swapBtnText: { fontSize: 18, fontWeight: '700', color: '#000', fontFamily: 'Inter_700Bold' },
  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    marginTop: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
  },
  rewardText: { fontSize: 14, color: '#FFD700' },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  tokenPickerModal: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', fontFamily: 'Inter_700Bold' },
  tokenOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  tokenOptionLogo: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  tokenOptionInfo: { flex: 1 },
  tokenOptionSymbol: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  tokenOptionName: { fontSize: 13, color: '#888', marginTop: 2 },
  tokenOptionRight: { alignItems: 'flex-end' },
  tokenOptionBalance: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  tokenOptionPrice: { fontSize: 12, color: '#888', marginTop: 2 },
});
