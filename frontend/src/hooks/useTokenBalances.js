import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Token holdings with demo balances
const INITIAL_HOLDINGS = {
  USDC: 10000,
  ETH: 0,
  BTC: 0,
  SOL: 0,
};

export function useTokenBalances() {
  const [holdings, setHoldings] = useState(INITIAL_HOLDINGS);
  const [totalValue, setTotalValue] = useState(10000);
  const [isLoading, setIsLoading] = useState(true);

  // Load balances from storage
  const loadBalances = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get demo USDC balance
      const demoBalance = await AsyncStorage.getItem('demo_balance');
      const usdcBalance = demoBalance ? parseFloat(demoBalance) : 10000;
      
      // Get other token holdings
      const storedHoldings = await AsyncStorage.getItem('token_holdings');
      const tokenHoldings = storedHoldings ? JSON.parse(storedHoldings) : {};
      
      const newHoldings = {
        USDC: usdcBalance,
        ETH: tokenHoldings.ETH || 0,
        BTC: tokenHoldings.BTC || 0,
        SOL: tokenHoldings.SOL || 0,
      };
      
      setHoldings(newHoldings);
      
      // Calculate total value (fetch prices)
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd'
        );
        const prices = await response.json();
        
        const total = 
          newHoldings.USDC + 
          (newHoldings.ETH * (prices.ethereum?.usd || 3000)) +
          (newHoldings.BTC * (prices.bitcoin?.usd || 90000)) +
          (newHoldings.SOL * (prices.solana?.usd || 130));
        
        setTotalValue(total);
      } catch (e) {
        setTotalValue(newHoldings.USDC);
      }
    } catch (error) {
      console.error('[useTokenBalances] Load error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update a specific token balance
  const updateBalance = useCallback(async (token, amount) => {
    try {
      if (token === 'USDC') {
        await AsyncStorage.setItem('demo_balance', amount.toString());
      } else {
        const storedHoldings = await AsyncStorage.getItem('token_holdings');
        const tokenHoldings = storedHoldings ? JSON.parse(storedHoldings) : {};
        tokenHoldings[token] = amount;
        await AsyncStorage.setItem('token_holdings', JSON.stringify(tokenHoldings));
      }
      await loadBalances();
    } catch (error) {
      console.error('[useTokenBalances] Update error:', error);
    }
  }, [loadBalances]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  return {
    holdings,
    totalValue,
    isLoading,
    loadBalances,
    updateBalance,
  };
}

export default useTokenBalances;
