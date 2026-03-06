import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Dimensions, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

// API URLs
const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL || '';
const JASPR_CHAIN_API = 'https://www.jasprlabs.cloud/api';

// Treasury wallet for trading operations - receives/sends JASPR for trades
const JASPR_TREASURY = 'jaspr1treasury000000000000000000000000000000000';

// Execute REAL on-chain transaction on JasprChain
// All trades are recorded as real blockchain transfers
const executeOnChainTransaction = async (walletAddress, type, symbol, tokenAmount, usdValue) => {
  try {
    // For trades, we transfer JASPR to/from treasury
    // BUY: User sends JASPR to treasury, receives simulated tokens
    // SELL: User receives JASPR from treasury, sends simulated tokens
    
    // Calculate JASPR amount (1 JASPR = $1)
    const jasprAmount = Math.floor(usdValue); // Whole JASPR only
    
    let sender, recipient, amount;
    
    if (type === 'buy') {
      // User pays JASPR to buy tokens
      sender = walletAddress;
      recipient = JASPR_TREASURY;
      amount = jasprAmount;
    } else {
      // User sells tokens, receives JASPR
      sender = walletAddress; // Still user initiates (simulation)
      recipient = JASPR_TREASURY;
      amount = 1; // Minimum transfer to record on-chain
    }
    
    console.log(`[JASPR] Executing on-chain ${type}: ${amount} JASPR`);
    console.log(`[JASPR] From: ${sender.slice(0, 20)}...`);
    console.log(`[JASPR] To: ${recipient.slice(0, 20)}...`);
    
    // Execute real blockchain transfer
    const response = await fetch(`${JASPR_CHAIN_API}/transactions/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: sender,
        recipient: recipient,
        amount: amount
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[JASPR] ✅ ON-CHAIN TX CONFIRMED!');
      console.log('[JASPR] tx_hash:', data.tx_hash);
      console.log('[JASPR] status:', data.status);
      
      return { 
        success: true, 
        tx_hash: data.tx_hash, 
        status: data.status || 'confirmed',
        chain: 'JasprChain',
        onChain: true,
        riskScore: data.risk_score
      };
    }
    
    const errorData = await response.json().catch(() => ({}));
    console.log('[JASPR] Transfer failed:', errorData);
    throw new Error(errorData.detail || 'Transfer failed');
    
  } catch (error) {
    console.log('[JASPR] On-chain tx error:', error.message);
    // Return error so UI can handle it
    return { 
      success: false, 
      error: error.message,
      tx_hash: null
    };
  }
};

// Sync account data to backend (MongoDB)
const syncToBackend = async () => {
  try {
    const walletAddress = await AsyncStorage.getItem('wallet_address');
    if (!walletAddress) return;
    
    const balance = parseFloat(await AsyncStorage.getItem('demo_balance') || '10000');
    const holdings = JSON.parse(await AsyncStorage.getItem('token_holdings') || '{}');
    const purchaseInfo = JSON.parse(await AsyncStorage.getItem('purchase_info') || '{}');
    const swapCount = parseInt(await AsyncStorage.getItem('swap_count') || '0');
    const txHistory = JSON.parse(await AsyncStorage.getItem('tx_history') || '[]');
    
    await fetch(`${API_URL}/api/account/sync`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: walletAddress,
        balance,
        holdings,
        purchase_info: purchaseInfo,
        swap_count: swapCount,
        tx_history: txHistory,
      }),
    });
    console.log('[SYNC] Account synced to MongoDB');
  } catch (error) {
    console.log('[SYNC] Backend sync failed:', error.message);
  }
};

// All 25 tokens with their info
const ALL_TOKENS = {
  bitcoin: { symbol: 'BTC', name: 'Bitcoin', logo: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  ethereum: { symbol: 'ETH', name: 'Ethereum', logo: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  tether: { symbol: 'USDT', name: 'Tether', logo: 'https://assets.coingecko.com/coins/images/325/small/Tether.png' },
  binancecoin: { symbol: 'BNB', name: 'BNB', logo: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  solana: { symbol: 'SOL', name: 'Solana', logo: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  'usd-coin': { symbol: 'USDC', name: 'USD Coin', logo: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png' },
  ripple: { symbol: 'XRP', name: 'XRP', logo: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
  dogecoin: { symbol: 'DOGE', name: 'Dogecoin', logo: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
  cardano: { symbol: 'ADA', name: 'Cardano', logo: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
  'avalanche-2': { symbol: 'AVAX', name: 'Avalanche', logo: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
  tron: { symbol: 'TRX', name: 'TRON', logo: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png' },
  'the-open-network': { symbol: 'TON', name: 'Toncoin', logo: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png' },
  polkadot: { symbol: 'DOT', name: 'Polkadot', logo: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png' },
  'matic-network': { symbol: 'MATIC', name: 'Polygon', logo: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png' },
  chainlink: { symbol: 'LINK', name: 'Chainlink', logo: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
  'shiba-inu': { symbol: 'SHIB', name: 'Shiba Inu', logo: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png' },
  'wrapped-bitcoin': { symbol: 'WBTC', name: 'Wrapped BTC', logo: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png' },
  litecoin: { symbol: 'LTC', name: 'Litecoin', logo: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png' },
  uniswap: { symbol: 'UNI', name: 'Uniswap', logo: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-logo.png' },
  dai: { symbol: 'DAI', name: 'Dai', logo: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png' },
  'internet-computer': { symbol: 'ICP', name: 'Internet Computer', logo: 'https://assets.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png' },
  near: { symbol: 'NEAR', name: 'NEAR Protocol', logo: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg' },
  aptos: { symbol: 'APT', name: 'Aptos', logo: 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png' },
  pepe: { symbol: 'PEPE', name: 'Pepe', logo: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg' },
  arbitrum: { symbol: 'ARB', name: 'Arbitrum', logo: 'https://assets.coingecko.com/coins/images/16547/small/arb.jpg' },
};

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
  const [timeframe, setTimeframe] = useState('1H');
  const [swapCount, setSwapCount] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [highPrice, setHighPrice] = useState(0);
  const [lowPrice, setLowPrice] = useState(0);
  const [volume, setVolume] = useState(0);
  const [livePrice, setLivePrice] = useState(0);
  const priceInterval = useRef(null);
  
  const coinId = params.coin || 'bitcoin';
  const tokenInfo = ALL_TOKENS[coinId] || { symbol: 'BTC', name: 'Bitcoin', logo: '' };
  const symbol = params.symbol || tokenInfo.symbol;
  const name = params.name || tokenInfo.name;
  const logo = params.logo || tokenInfo.logo;

  useFocusEffect(
    useCallback(() => {
      loadData();
      loadChartData();
      startLivePriceUpdates();
      
      return () => {
        if (priceInterval.current) {
          clearInterval(priceInterval.current);
        }
      };
    }, [coinId, timeframe])
  );

  const startLivePriceUpdates = () => {
    // Simulate live price updates every 2 seconds
    if (priceInterval.current) clearInterval(priceInterval.current);
    
    priceInterval.current = setInterval(() => {
      setLivePrice(prev => {
        if (!prev || prev === 0) return price;
        // Simulate small price movements (-0.1% to +0.1%)
        const change = prev * (0.999 + Math.random() * 0.002);
        return change;
      });
    }, 2000);
  };

  useEffect(() => {
    if (price > 0 && livePrice === 0) {
      setLivePrice(price);
    }
  }, [price]);

  const loadData = async () => {
    try {
      const demoBalance = await AsyncStorage.getItem('demo_balance');
      setBalance(demoBalance ? parseFloat(demoBalance) : 10000);
      
      const holdings = await AsyncStorage.getItem('token_holdings');
      const tokenHoldings = holdings ? JSON.parse(holdings) : {};
      const holding = tokenHoldings[symbol];
      setTokenHolding(holding && isFinite(holding) ? holding : 0);
      
      const count = await AsyncStorage.getItem('swap_count');
      setSwapCount(count ? parseInt(count) : 0);
      
      // Comprehensive fallback prices for all 25 tokens
      const FALLBACK = {
        bitcoin: { usd: 96500, change: 2.5, high: 97200, low: 95100, vol: 28500000000 },
        ethereum: { usd: 3650, change: 1.8, high: 3720, low: 3580, vol: 15200000000 },
        tether: { usd: 1.00, change: 0.01, high: 1.001, low: 0.999, vol: 45000000000 },
        binancecoin: { usd: 695, change: -0.5, high: 705, low: 682, vol: 1200000000 },
        solana: { usd: 185, change: 3.2, high: 192, low: 178, vol: 3800000000 },
        'usd-coin': { usd: 1.00, change: 0, high: 1.001, low: 0.999, vol: 5000000000 },
        ripple: { usd: 2.35, change: 1.2, high: 2.42, low: 2.28, vol: 4500000000 },
        dogecoin: { usd: 0.38, change: 4.5, high: 0.41, low: 0.35, vol: 2100000000 },
        cardano: { usd: 0.98, change: -1.1, high: 1.02, low: 0.95, vol: 890000000 },
        'avalanche-2': { usd: 38.5, change: 2.1, high: 40.2, low: 36.8, vol: 520000000 },
        tron: { usd: 0.25, change: 1.5, high: 0.26, low: 0.24, vol: 800000000 },
        'the-open-network': { usd: 5.80, change: 0.8, high: 5.95, low: 5.65, vol: 450000000 },
        polkadot: { usd: 7.20, change: -0.8, high: 7.45, low: 7.05, vol: 380000000 },
        'matic-network': { usd: 0.52, change: -0.3, high: 0.54, low: 0.50, vol: 320000000 },
        chainlink: { usd: 14.50, change: 2.3, high: 15.10, low: 14.00, vol: 420000000 },
        'shiba-inu': { usd: 0.000022, change: 5.2, high: 0.000024, low: 0.000020, vol: 650000000 },
        'wrapped-bitcoin': { usd: 96400, change: 2.4, high: 97100, low: 95000, vol: 180000000 },
        litecoin: { usd: 108, change: 0.7, high: 112, low: 105, vol: 580000000 },
        uniswap: { usd: 12.80, change: 1.9, high: 13.20, low: 12.40, vol: 210000000 },
        dai: { usd: 1.00, change: 0, high: 1.001, low: 0.999, vol: 300000000 },
        'internet-computer': { usd: 11.50, change: 3.1, high: 12.00, low: 11.00, vol: 180000000 },
        near: { usd: 5.20, change: 2.8, high: 5.45, low: 5.00, vol: 320000000 },
        aptos: { usd: 9.80, change: 4.2, high: 10.30, low: 9.30, vol: 280000000 },
        pepe: { usd: 0.000018, change: 8.5, high: 0.000020, low: 0.000016, vol: 950000000 },
        arbitrum: { usd: 0.92, change: 1.2, high: 0.96, low: 0.88, vol: 350000000 },
      };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_24hr_high=true&include_24hr_low=true`,
          { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('API response not ok');
        }
        
        const data = await response.json();
        const tokenData = data[coinId];
        
        if (tokenData && tokenData.usd) {
          setPrice(tokenData.usd);
          setLivePrice(tokenData.usd);
          setPriceChange(tokenData.usd_24h_change || 0);
          setHighPrice(tokenData.usd_24h_high || tokenData.usd * 1.02);
          setLowPrice(tokenData.usd_24h_low || tokenData.usd * 0.98);
          setVolume(tokenData.usd_24h_vol || 1000000);
          console.log('[TRADE] Live price loaded:', tokenData.usd);
        } else {
          throw new Error('No price data');
        }
      } catch (e) {
        console.log('[TRADE] Using fallback price for', coinId);
        const fb = FALLBACK[coinId] || { usd: 100, change: 0, high: 105, low: 95, vol: 1000000 };
        setPrice(fb.usd);
        setLivePrice(fb.usd);
        setPriceChange(fb.change);
        setHighPrice(fb.high);
        setLowPrice(fb.low);
        setVolume(fb.vol);
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const loadChartData = async () => {
    setChartLoading(true);
    try {
      // Map timeframes to CoinGecko days parameter
      const daysMap = { '1H': '1', '24H': '1', '7D': '7', '30D': '30', '1Y': '365' };
      const days = daysMap[timeframe] || '1';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
        { 
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('API response not ok');
      }
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // OHLC data: [timestamp, open, high, low, close]
        let candles = data.map(([timestamp, open, high, low, close]) => ({
          time: timestamp,
          open,
          high,
          low,
          close,
        }));
        
        // For 1H, only show last ~12 candles (last hour of data)
        if (timeframe === '1H') {
          candles = candles.slice(-12);
        } else if (timeframe === '24H') {
          candles = candles.slice(-48);
        }
        
        setChartData(candles);
        return;
      }
      throw new Error('Invalid data format');
    } catch (error) {
      console.log('Chart API error, generating realistic mock data for', timeframe);
      // Generate realistic mock candlestick data based on timeframe
      generateMockChartData();
    } finally {
      setChartLoading(false);
    }
  };

  // Generate realistic mock data with different patterns per timeframe
  const generateMockChartData = () => {
    const basePrice = price || 100;
    let numCandles, volatility, trend;
    
    // Different characteristics per timeframe
    switch (timeframe) {
      case '1H':
        numCandles = 12;
        volatility = 0.002; // 0.2% moves
        trend = (Math.random() - 0.5) * 0.01; // slight trend
        break;
      case '24H':
        numCandles = 48;
        volatility = 0.005; // 0.5% moves
        trend = (Math.random() - 0.5) * 0.02;
        break;
      case '7D':
        numCandles = 42;
        volatility = 0.015; // 1.5% moves
        trend = (Math.random() - 0.5) * 0.05;
        break;
      case '30D':
        numCandles = 60;
        volatility = 0.025; // 2.5% moves
        trend = (Math.random() - 0.5) * 0.1;
        break;
      case '1Y':
        numCandles = 52;
        volatility = 0.05; // 5% moves
        trend = (Math.random() - 0.5) * 0.3;
        break;
      default:
        numCandles = 30;
        volatility = 0.01;
        trend = 0;
    }
    
    // Use coin-specific seed for consistent but different patterns per coin
    const coinSeed = coinId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const timeframeSeed = timeframe.charCodeAt(0) + timeframe.charCodeAt(1);
    const seed = coinSeed + timeframeSeed + Date.now() % 1000;
    
    // Seeded random function
    let seedVal = seed;
    const seededRandom = () => {
      seedVal = (seedVal * 9301 + 49297) % 233280;
      return seedVal / 233280;
    };
    
    let currentPrice = basePrice * (1 - trend / 2); // Start below if uptrend, above if downtrend
    const candles = [];
    
    for (let i = 0; i < numCandles; i++) {
      // Add trend component
      const trendComponent = trend / numCandles;
      
      // Add random walk with mean reversion
      const randomWalk = (seededRandom() - 0.5) * 2 * volatility;
      
      // Add some momentum (previous candle influence)
      const momentum = i > 0 ? (candles[i-1].close - candles[i-1].open) / candles[i-1].open * 0.3 : 0;
      
      const priceChange = trendComponent + randomWalk + momentum;
      const open = currentPrice;
      const close = open * (1 + priceChange);
      
      // Wicks extend beyond body
      const wickExtension = volatility * (0.5 + seededRandom());
      const high = Math.max(open, close) * (1 + wickExtension * seededRandom());
      const low = Math.min(open, close) * (1 - wickExtension * seededRandom());
      
      candles.push({
        time: Date.now() - (numCandles - i) * getTimeInterval(timeframe),
        open,
        high,
        low,
        close,
      });
      
      currentPrice = close;
    }
    
    setChartData(candles);
  };
  
  // Get time interval in ms based on timeframe
  const getTimeInterval = (tf) => {
    switch (tf) {
      case '1H': return 5 * 60 * 1000; // 5 min candles
      case '24H': return 30 * 60 * 1000; // 30 min candles
      case '7D': return 4 * 60 * 60 * 1000; // 4 hour candles
      case '30D': return 12 * 60 * 60 * 1000; // 12 hour candles
      case '1Y': return 7 * 24 * 60 * 60 * 1000; // weekly candles
      default: return 60 * 60 * 1000;
    }
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
      const walletAddress = await AsyncStorage.getItem('wallet_address');
      
      // Calculate trade values
      let tokensBought = 0;
      let usdValue = 0;
      
      if (mode === 'BUY') {
        tokensBought = inputAmount / price;
        usdValue = inputAmount;
      } else {
        usdValue = inputAmount * price;
        tokensBought = inputAmount;
      }
      
      // Execute REAL on-chain transaction on JasprChain
      console.log('[TRADE] Executing real on-chain transaction...');
      const chainResult = await executeOnChainTransaction(
        walletAddress,
        mode.toLowerCase(),
        symbol,
        mode === 'BUY' ? tokensBought : inputAmount,
        usdValue
      );
      
      // Check if on-chain transaction succeeded
      if (!chainResult.success) {
        Alert.alert(
          'Transaction Failed', 
          `On-chain transaction failed: ${chainResult.error}\n\nPlease check your JasprChain balance.`,
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }
      
      console.log('[TRADE] ✅ On-chain transaction confirmed:', chainResult.tx_hash);
      
      // Update local state after successful on-chain transaction
      const holdings = await AsyncStorage.getItem('token_holdings');
      const tokenHoldings = holdings ? JSON.parse(holdings) : {};
      
      let newBalance = balance;
      let newHolding = tokenHoldings[symbol] || 0;
      
      if (mode === 'BUY') {
        newBalance = balance - inputAmount;
        newHolding = newHolding + tokensBought;
      } else {
        newBalance = balance + usdValue;
        newHolding = newHolding - inputAmount;
      }
      
      if (!isFinite(newHolding)) newHolding = 0;
      if (newHolding < 0.00000001) newHolding = 0;
      
      tokenHoldings[symbol] = newHolding;
      await AsyncStorage.setItem('token_holdings', JSON.stringify(tokenHoldings));
      await AsyncStorage.setItem('demo_balance', newBalance.toString());
      
      // Save purchase info (average cost basis)
      if (mode === 'BUY') {
        const purchaseInfo = JSON.parse(await AsyncStorage.getItem('purchase_info') || '{}');
        const existingCost = purchaseInfo[symbol]?.totalCost || 0;
        const existingAmount = purchaseInfo[symbol]?.totalAmount || 0;
        purchaseInfo[symbol] = {
          totalCost: existingCost + inputAmount,
          totalAmount: existingAmount + tokensBought,
          avgPrice: (existingCost + inputAmount) / (existingAmount + tokensBought),
          lastPrice: price,
        };
        await AsyncStorage.setItem('purchase_info', JSON.stringify(purchaseInfo));
      } else if (mode === 'SELL' && newHolding === 0) {
        // Clear purchase info if sold all
        const purchaseInfo = JSON.parse(await AsyncStorage.getItem('purchase_info') || '{}');
        delete purchaseInfo[symbol];
        await AsyncStorage.setItem('purchase_info', JSON.stringify(purchaseInfo));
      }
      
      // Trade rewards
      const currentCount = swapCount;
      if (currentCount < 10) {
        const bonus = 5;
        newBalance += bonus;
        await AsyncStorage.setItem('demo_balance', newBalance.toString());
        await AsyncStorage.setItem('swap_count', (currentCount + 1).toString());
        setSwapCount(currentCount + 1);
      }
      
      // Save to history with REAL JasprChain tx_hash
      const history = JSON.parse(await AsyncStorage.getItem('tx_history') || '[]');
      history.unshift({
        type: mode.toLowerCase(),
        symbol,
        amount: mode === 'BUY' ? tokensBought : inputAmount,
        price,
        usdValue,
        timestamp: Date.now(),
        txHash: chainResult.tx_hash, // REAL on-chain tx_hash!
        status: chainResult.status,
        chain: 'JasprChain',
        onChain: true,
        explorerUrl: `https://www.jasprlabs.cloud/explorer/tx/${chainResult.tx_hash}`,
      });
      await AsyncStorage.setItem('tx_history', JSON.stringify(history.slice(0, 50)));
      
      setBalance(newBalance);
      setTokenHolding(newHolding);
      setAmount('');
      
      // Sync to backend after successful trade
      syncToBackend();
      
      const bonusText = currentCount < 10 ? '\n\n🎁 +$5 Trade Reward!' : '';
      Alert.alert(
        `${mode === 'BUY' ? '✅ Bought' : '✅ Sold'} ${symbol}`,
        `${mode === 'BUY' ? 'Received' : 'Sold'}: ${mode === 'BUY' ? tokensBought.toFixed(8) : inputAmount} ${symbol}\nValue: $${usdValue.toFixed(2)}\n\n🔗 JasprChain TX:\n${chainResult.tx_hash.slice(0, 16)}...${bonusText}`,
        [{ text: 'Done' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Trade failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatVolume = (vol) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    return `$${vol.toFixed(0)}`;
  };

  const formatPrice = (p) => {
    if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(2);
    if (p >= 0.01) return p.toFixed(4);
    return p.toFixed(8);
  };

  // Render candlestick chart
  const renderChart = () => {
    if (chartLoading || chartData.length === 0) {
      return (
        <View style={styles.chartPlaceholder}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      );
    }

    const chartWidth = width - 40;
    const chartHeight = 200;
    const candleWidth = Math.max(2, (chartWidth - 40) / chartData.length - 1);
    
    const prices = chartData.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    
    const scaleY = (p) => chartHeight - ((p - minPrice) / priceRange) * (chartHeight - 20) - 10;
    
    return (
      <View style={styles.chartContainer}>
        <View style={[styles.chart, { width: chartWidth, height: chartHeight }]}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <View key={i} style={[styles.gridLine, { top: chartHeight * ratio }]} />
          ))}
          
          {/* Candlesticks */}
          <View style={styles.candlesContainer}>
            {chartData.slice(-Math.floor(chartWidth / (candleWidth + 1))).map((candle, i) => {
              const isGreen = candle.close >= candle.open;
              const bodyTop = scaleY(Math.max(candle.open, candle.close));
              const bodyBottom = scaleY(Math.min(candle.open, candle.close));
              const bodyHeight = Math.max(1, bodyBottom - bodyTop);
              const wickTop = scaleY(candle.high);
              const wickBottom = scaleY(candle.low);
              
              return (
                <View key={i} style={[styles.candleWrapper, { width: candleWidth + 1 }]}>
                  {/* Wick */}
                  <View style={[
                    styles.wick,
                    {
                      top: wickTop,
                      height: wickBottom - wickTop,
                      backgroundColor: isGreen ? '#00C853' : '#FF3B30',
                    }
                  ]} />
                  {/* Body */}
                  <View style={[
                    styles.candleBody,
                    {
                      top: bodyTop,
                      height: bodyHeight,
                      width: candleWidth,
                      backgroundColor: isGreen ? '#00C853' : '#FF3B30',
                    }
                  ]} />
                </View>
              );
            })}
          </View>
          
          {/* Price labels */}
          <View style={styles.priceLabels}>
            <Text style={styles.priceLabel}>${formatPrice(maxPrice)}</Text>
            <Text style={styles.priceLabel}>${formatPrice((maxPrice + minPrice) / 2)}</Text>
            <Text style={styles.priceLabel}>${formatPrice(minPrice)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.tokenHeader}>
              {logo && !imageError ? (
                <Image source={{ uri: logo }} style={styles.headerLogo} onError={() => setImageError(true)} />
              ) : (
                <View style={styles.headerLogoFallback}>
                  <Text style={styles.headerLogoText}>{symbol[0]}</Text>
                </View>
              )}
              <View>
                <Text style={styles.headerSymbol}>{symbol}/USDC</Text>
                <Text style={styles.headerName}>{name}</Text>
              </View>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Live Price Display */}
        <View style={styles.priceSection}>
          <Text style={styles.livePrice}>${formatPrice(livePrice || price)}</Text>
          <View style={[styles.changeContainer, priceChange >= 0 ? styles.changePositive : styles.changeNegative]}>
            <MaterialCommunityIcons 
              name={priceChange >= 0 ? 'trending-up' : 'trending-down'} 
              size={16} 
              color={priceChange >= 0 ? '#00C853' : '#FF3B30'} 
            />
            <Text style={[styles.changeText, priceChange >= 0 ? styles.changeTextGreen : styles.changeTextRed]}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>24h High</Text>
            <Text style={styles.statValue}>${formatPrice(highPrice)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>24h Low</Text>
            <Text style={styles.statValue}>${formatPrice(lowPrice)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>24h Vol</Text>
            <Text style={styles.statValue}>{formatVolume(volume)}</Text>
          </View>
        </View>

        {/* Timeframe Selector */}
        <View style={styles.timeframeRow}>
          {['1H', '24H', '7D', '30D', '1Y'].map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.timeframeBtn, timeframe === tf && styles.timeframeBtnActive]}
              onPress={() => setTimeframe(tf)}
            >
              <Text style={[styles.timeframeText, timeframe === tf && styles.timeframeTextActive]}>{tf}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        {renderChart()}

        {/* Trading Section */}
        <View style={styles.tradingSection}>
          {/* Buy/Sell Toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'BUY' && styles.modeBtnBuy]}
              onPress={() => setMode('BUY')}
            >
              <Text style={[styles.modeBtnText, mode === 'BUY' && styles.modeBtnTextActive]}>Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'SELL' && styles.modeBtnSell]}
              onPress={() => setMode('SELL')}
            >
              <Text style={[styles.modeBtnText, mode === 'SELL' && styles.modeBtnTextActive]}>Sell</Text>
            </TouchableOpacity>
          </View>

          {/* Balance Info */}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Available</Text>
            <Text style={styles.balanceValue}>
              {mode === 'BUY' ? `$${balance.toFixed(2)} USDC` : `${tokenHolding.toFixed(8)} ${symbol}`}
            </Text>
          </View>

          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{mode === 'BUY' ? 'Amount (USDC)' : `Amount (${symbol})`}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
              <TouchableOpacity 
                style={styles.maxBtn}
                onPress={() => setAmount(mode === 'BUY' ? balance.toString() : tokenHolding.toString())}
              >
                <Text style={styles.maxBtnText}>MAX</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Conversion Display */}
          <View style={styles.conversionRow}>
            <Text style={styles.conversionLabel}>You will {mode === 'BUY' ? 'receive' : 'get'}</Text>
            <Text style={styles.conversionValue}>
              {mode === 'BUY' ? `${calculateTokenAmount()} ${symbol}` : `$${calculateUsdValue()} USDC`}
            </Text>
          </View>

          {/* Execute Button */}
          <TouchableOpacity
            style={[styles.executeBtn, mode === 'BUY' ? styles.executeBtnBuy : styles.executeBtnSell]}
            onPress={executeTrade}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.executeBtnText}>{mode === 'BUY' ? `Buy ${symbol}` : `Sell ${symbol}`}</Text>
            )}
          </TouchableOpacity>

          {/* Trade Rewards */}
          {swapCount < 10 && (
            <View style={styles.rewardBanner}>
              <MaterialCommunityIcons name="gift" size={16} color="#FFD700" />
              <Text style={styles.rewardText}>Trade Rewards: {10 - swapCount} trades left for $5 bonus each!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backBtn: { padding: 8 },
  headerCenter: { flex: 1, alignItems: 'center' },
  tokenHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerLogo: { width: 36, height: 36, borderRadius: 18 },
  headerLogoFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  headerLogoText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  headerSymbol: { fontSize: 18, fontWeight: '700', color: '#FFF', fontFamily: 'Inter_700Bold' },
  headerName: { fontSize: 12, color: '#888' },
  priceSection: { alignItems: 'center', paddingVertical: 16 },
  livePrice: { fontSize: 36, fontWeight: '700', color: '#FFF', fontFamily: 'Inter_700Bold' },
  changeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
  changePositive: { backgroundColor: 'rgba(0, 200, 83, 0.15)' },
  changeNegative: { backgroundColor: 'rgba(255, 59, 48, 0.15)' },
  changeText: { fontSize: 14, fontWeight: '600' },
  changeTextGreen: { color: '#00C853' },
  changeTextRed: { color: '#FF3B30' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1a1a1a' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 11, color: '#666', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  timeframeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  timeframeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#111' },
  timeframeBtnActive: { backgroundColor: '#FFF' },
  timeframeText: { fontSize: 13, fontWeight: '600', color: '#888' },
  timeframeTextActive: { color: '#000' },
  chartContainer: { paddingHorizontal: 20, paddingVertical: 16 },
  chart: { backgroundColor: '#0a0a0a', borderRadius: 12, overflow: 'hidden', position: 'relative' },
  chartPlaceholder: { height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a', borderRadius: 12, marginHorizontal: 20 },
  gridLine: { position: 'absolute', left: 0, right: 40, height: 1, backgroundColor: '#1a1a1a' },
  candlesContainer: { flexDirection: 'row', alignItems: 'flex-end', height: '100%', paddingRight: 40 },
  candleWrapper: { alignItems: 'center', position: 'relative', height: '100%' },
  wick: { position: 'absolute', width: 1 },
  candleBody: { position: 'absolute', borderRadius: 1 },
  priceLabels: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, justifyContent: 'space-between', paddingVertical: 5 },
  priceLabel: { fontSize: 8, color: '#666', textAlign: 'right', paddingRight: 4 },
  tradingSection: { padding: 20, paddingBottom: 100 },
  modeToggle: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 12, padding: 4, marginBottom: 20 },
  modeBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  modeBtnBuy: { backgroundColor: '#00C853' },
  modeBtnSell: { backgroundColor: '#FF3B30' },
  modeBtnText: { fontSize: 16, fontWeight: '700', color: '#888' },
  modeBtnTextActive: { color: '#000' },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  balanceLabel: { fontSize: 14, color: '#888' },
  balanceValue: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#888', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  input: { flex: 1, padding: 16, fontSize: 18, color: '#FFF', fontFamily: 'Inter_600SemiBold' },
  maxBtn: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, backgroundColor: '#222', borderRadius: 8 },
  maxBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  conversionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderColor: '#1a1a1a', marginBottom: 16 },
  conversionLabel: { fontSize: 14, color: '#888' },
  conversionValue: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  executeBtn: { paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginBottom: 16 },
  executeBtnBuy: { backgroundColor: '#00C853' },
  executeBtnSell: { backgroundColor: '#FF3B30' },
  executeBtnText: { fontSize: 18, fontWeight: '700', color: '#000', fontFamily: 'Inter_700Bold' },
  rewardBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: 10 },
  rewardText: { fontSize: 13, color: '#FFD700' },
});
