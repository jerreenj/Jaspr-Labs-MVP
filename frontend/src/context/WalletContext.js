import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_SEPOLIA_RPC, BASE_SEPOLIA_CHAIN_ID } from '../config/tokens';

const WalletContext = createContext(null);

// Base Sepolia real token addresses
const TOKEN_ADDRESSES = {
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

// ERC20 ABI for token interactions
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [balances, setBalances] = useState({
    ETH: '0',
    WETH: '0',
    USDC: '0',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeWallet();
  }, []);

  const initializeWallet = async () => {
    try {
      setIsLoading(true);
      
      // Create provider for Base Sepolia
      const rpcProvider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
      setProvider(rpcProvider);

      // Get stored private key
      const privateKey = await AsyncStorage.getItem('wallet_private_key');
      
      if (privateKey) {
        const userWallet = new ethers.Wallet(privateKey, rpcProvider);
        setWallet(userWallet);
        setSigner(userWallet);
        setAddress(userWallet.address);
        
        // Fetch balances
        await refreshBalances(userWallet, rpcProvider);
      }
    } catch (error) {
      console.error('[WalletContext] Init error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalances = async (userWallet = wallet, rpcProvider = provider) => {
    if (!userWallet || !rpcProvider) return;

    try {
      // Get ETH balance
      const ethBalance = await rpcProvider.getBalance(userWallet.address);
      
      // Get WETH balance
      const wethContract = new ethers.Contract(TOKEN_ADDRESSES.WETH, ERC20_ABI, rpcProvider);
      const wethBalance = await wethContract.balanceOf(userWallet.address);
      
      // Get USDC balance
      const usdcContract = new ethers.Contract(TOKEN_ADDRESSES.USDC, ERC20_ABI, rpcProvider);
      const usdcBalance = await usdcContract.balanceOf(userWallet.address);

      setBalances({
        ETH: ethers.formatEther(ethBalance),
        WETH: ethers.formatEther(wethBalance),
        USDC: ethers.formatUnits(usdcBalance, 6),
      });

      console.log('[WalletContext] Balances updated:', {
        ETH: ethers.formatEther(ethBalance),
        WETH: ethers.formatEther(wethBalance),
        USDC: ethers.formatUnits(usdcBalance, 6),
      });
    } catch (error) {
      console.error('[WalletContext] Balance fetch error:', error);
    }
  };

  const sendToken = async (tokenSymbol, toAddress, amount) => {
    if (!signer) throw new Error('Wallet not initialized');

    try {
      if (tokenSymbol === 'ETH') {
        const tx = await signer.sendTransaction({
          to: toAddress,
          value: ethers.parseEther(amount),
        });
        await tx.wait();
        return tx.hash;
      } else {
        const tokenAddress = tokenSymbol === 'USDC' ? TOKEN_ADDRESSES.USDC : TOKEN_ADDRESSES.WETH;
        const decimals = tokenSymbol === 'USDC' ? 6 : 18;
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
        
        const tx = await contract.transfer(
          toAddress,
          ethers.parseUnits(amount, decimals)
        );
        await tx.wait();
        return tx.hash;
      }
    } catch (error) {
      console.error('[WalletContext] Send error:', error);
      throw error;
    }
  };

  const value = {
    wallet,
    provider,
    signer,
    address,
    balances,
    isLoading,
    refreshBalances,
    sendToken,
    TOKEN_ADDRESSES,
    ERC20_ABI,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export default WalletContext;
