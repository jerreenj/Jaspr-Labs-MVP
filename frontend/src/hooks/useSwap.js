import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Live prices from CoinGecko (will be fetched)
const DEFAULT_PRICES = {
  ETH: 3000,
  USDC: 1,
  BTC: 90000,
};

export function useSwap() {
  const { address, balances, refreshBalances } = useWallet();
  const [isSwapping, setIsSwapping] = useState(false);
  const [prices, setPrices] = useState(DEFAULT_PRICES);

  // Fetch live prices from CoinGecko
  const fetchPrices = useCallback(async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin,bitcoin&vs_currencies=usd'
      );
      const data = await response.json();
      setPrices({
        ETH: data.ethereum?.usd || DEFAULT_PRICES.ETH,
        USDC: data['usd-coin']?.usd || DEFAULT_PRICES.USDC,
        BTC: data.bitcoin?.usd || DEFAULT_PRICES.BTC,
      });
    } catch (error) {
      console.error('[useSwap] Price fetch error:', error);
    }
  }, []);

  // Calculate output amount based on current prices
  const getQuote = useCallback((fromToken, toToken, amountIn) => {
    if (!amountIn || parseFloat(amountIn) <= 0) return '0';
    
    const fromPrice = prices[fromToken] || 1;
    const toPrice = prices[toToken] || 1;
    
    // Calculate output with 0.3% fee
    const inputValue = parseFloat(amountIn) * fromPrice;
    const outputAmount = (inputValue / toPrice) * 0.997;
    
    return outputAmount.toFixed(6);
  }, [prices]);

  // Execute swap (demo mode - updates local balance)
  const executeSwap = useCallback(async (fromToken, toToken, amountIn, amountOut) => {
    setIsSwapping(true);
    
    try {
      // Get current demo balance
      const demoBalance = await AsyncStorage.getItem('demo_balance');
      let currentBalance = parseFloat(demoBalance) || 10000;
      
      // Calculate value changes
      const fromPrice = prices[fromToken] || 1;
      const toPrice = prices[toToken] || 1;
      const inputValue = parseFloat(amountIn) * fromPrice;
      
      // For demo: adjust USDC balance
      if (fromToken === 'USDC') {
        currentBalance -= parseFloat(amountIn);
      } else if (toToken === 'USDC') {
        currentBalance += parseFloat(amountOut);
      }
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Save new balance
      await AsyncStorage.setItem('demo_balance', currentBalance.toString());
      
      // Save transaction to history
      const history = JSON.parse(await AsyncStorage.getItem('tx_history') || '[]');
      history.unshift({
        type: 'swap',
        fromToken,
        toToken,
        amountIn,
        amountOut,
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).slice(2, 66)}`, // Mock tx hash
      });
      await AsyncStorage.setItem('tx_history', JSON.stringify(history.slice(0, 50)));
      
      // Refresh balances
      await refreshBalances();
      
      return {
        success: true,
        txHash: history[0].txHash,
        amountOut,
      };
    } catch (error) {
      console.error('[useSwap] Swap error:', error);
      throw error;
    } finally {
      setIsSwapping(false);
    }
  }, [prices, refreshBalances]);

  return {
    prices,
    fetchPrices,
    getQuote,
    executeSwap,
    isSwapping,
  };
}

export default useSwap;
