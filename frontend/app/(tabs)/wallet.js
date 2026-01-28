import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { ethers } from 'ethers';

const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
const BASE_SEPOLIA_EXPLORER = 'https://sepolia.basescan.org';

// Token logos from CoinGecko
const TOKEN_LOGOS = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  TON: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/small/polygon.png',
  DOT: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  UNI: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-logo.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
  SHIB: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
  TRX: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
  APT: 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
  PEPE: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
  ARB: 'https://assets.coingecko.com/coins/images/16547/small/arb.jpg',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  DAI: 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
};

export default function WalletPage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [walletHoldings, setWalletHoldings] = useState({}); // Self-custodial wallet (starts empty)
  const [tradingBalance, setTradingBalance] = useState({ USDC: 10000, ETH: 0, BTC: 0, SOL: 0 }); // Trading account
  const [prices, setPrices] = useState({ ETH: 3000, BTC: 90000, SOL: 130 });
  const [onChainBalance, setOnChainBalance] = useState('0');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [withdrawToken, setWithdrawToken] = useState('USDC');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sending, setSending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadWalletData();
    }, [])
  );

  const loadWalletData = async () => {
    try {
      const address = await AsyncStorage.getItem('wallet_address');
      const pk = await AsyncStorage.getItem('wallet_private_key');
      const demoBalance = await AsyncStorage.getItem('demo_balance');
      const storedHoldings = await AsyncStorage.getItem('token_holdings');
      
      setWalletAddress(address || '');
      setPrivateKey(pk || '');
      
      const usdcBalance = demoBalance ? parseFloat(demoBalance) : 10000;
      const tokenHoldings = storedHoldings ? JSON.parse(storedHoldings) : {};
      
      // Trading balance (for trading functionality)
      setTradingBalance({
        USDC: usdcBalance,
        ETH: tokenHoldings.ETH || 0,
        BTC: tokenHoldings.BTC || 0,
        SOL: tokenHoldings.SOL || 0,
      });
      
      // Self-custodial wallet holdings (stored separately, starts empty)
      const custodialHoldings = await AsyncStorage.getItem('wallet_holdings');
      setWalletHoldings(custodialHoldings ? JSON.parse(custodialHoldings) : {});

      // Fetch on-chain ETH balance
      if (address) {
        try {
          const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
          const balance = await provider.getBalance(address);
          setOnChainBalance(ethers.formatEther(balance));
        } catch (e) {
          console.log('Could not fetch on-chain balance');
        }
      }

      // Fetch live prices
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd'
        );
        const data = await response.json();
        setPrices({
          ETH: data.ethereum?.usd || 3000,
          BTC: data.bitcoin?.usd || 90000,
          SOL: data.solana?.usd || 130,
        });
      } catch (e) {
        // Use fallback prices
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const copyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert('Copied!', 'Wallet address copied to clipboard');
  };

  const handleDeposit = () => {
    setShowDepositModal(true);
  };

  const openMetaMask = () => {
    // Deep link to MetaMask (placeholder - would need real integration)
    const metamaskDeepLink = 'https://metamask.app.link/';
    Linking.openURL(metamaskDeepLink).catch(() => {
      Alert.alert(
        'MetaMask Not Found',
        'Please install MetaMask to deposit funds from your exchange wallet.',
        [{ text: 'OK' }]
      );
    });
  };

  const handleWithdraw = (token) => {
    setWithdrawToken(token);
    setWithdrawAmount('');
    setRecipientAddress('');
    setShowWithdrawModal(true);
  };

  const executeWithdraw = async () => {
    if (!recipientAddress || !withdrawAmount) {
      Alert.alert('Error', 'Please enter recipient address and amount');
      return;
    }

    if (!ethers.isAddress(recipientAddress)) {
      Alert.alert('Error', 'Invalid wallet address');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0 || amount > tradingBalance[withdrawToken]) {
      Alert.alert('Error', 'Invalid amount or insufficient balance');
      return;
    }

    setSending(true);

    try {
      // For demo tokens, simulate the withdrawal
      if (withdrawToken !== 'ETH') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update balances
        const newTradingBalance = { ...tradingBalance };
        newTradingBalance[withdrawToken] -= amount;
        
        if (withdrawToken === 'USDC') {
          await AsyncStorage.setItem('demo_balance', newTradingBalance.USDC.toString());
        } else {
          const tokenHoldings = {
            ETH: newTradingBalance.ETH,
            BTC: newTradingBalance.BTC,
            SOL: newTradingBalance.SOL,
          };
          await AsyncStorage.setItem('token_holdings', JSON.stringify(tokenHoldings));
        }
        
        // Save to history
        const history = JSON.parse(await AsyncStorage.getItem('tx_history') || '[]');
        history.unshift({
          type: 'send',
          symbol: withdrawToken,
          amount: amount,
          to: recipientAddress,
          timestamp: Date.now(),
          txHash: `0x${Math.random().toString(16).slice(2, 66)}`,
          status: 'confirmed',
        });
        await AsyncStorage.setItem('tx_history', JSON.stringify(history.slice(0, 50)));
        
        setTradingBalance(newTradingBalance);
        setShowWithdrawModal(false);
        
        Alert.alert(
          'Withdrawal Successful! 🎉',
          `Sent ${amount} ${withdrawToken} to\n${recipientAddress.slice(0, 10)}...${recipientAddress.slice(-8)}`,
          [{ text: 'View History', onPress: () => router.push('/(tabs)/history') }, { text: 'Done' }]
        );
      } else {
        // Real ETH withdrawal
        if (parseFloat(onChainBalance) < amount) {
          Alert.alert('Error', 'Insufficient on-chain ETH balance');
          setSending(false);
          return;
        }

        const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
        const wallet = new ethers.Wallet(privateKey, provider);
        
        const tx = await wallet.sendTransaction({
          to: recipientAddress,
          value: ethers.parseEther(withdrawAmount),
        });
        
        Alert.alert('Transaction Sent!', `TX Hash: ${tx.hash.slice(0, 20)}...\n\nWaiting for confirmation...`);
        
        await tx.wait();
        
        // Save to history
        const history = JSON.parse(await AsyncStorage.getItem('tx_history') || '[]');
        history.unshift({
          type: 'send',
          symbol: 'ETH',
          amount: amount,
          to: recipientAddress,
          timestamp: Date.now(),
          txHash: tx.hash,
          status: 'confirmed',
        });
        await AsyncStorage.setItem('tx_history', JSON.stringify(history.slice(0, 50)));
        
        setShowWithdrawModal(false);
        loadWalletData();
        
        Alert.alert('Success! 🎉', `Sent ${amount} ETH\nTX: ${tx.hash.slice(0, 20)}...`);
      }
    } catch (error) {
      console.error('Withdraw error:', error);
      Alert.alert('Error', 'Transaction failed: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleExportKey = () => {
    Alert.alert(
      '⚠️ Export Private Key',
      'Your private key gives FULL control of your wallet. Never share it with anyone!\n\nAnyone with your key can steal your funds.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'I Understand, Show Key', 
          style: 'destructive', 
          onPress: () => {
            Alert.alert(
              'Private Key',
              privateKey,
              [
                { text: 'Copy', onPress: () => Clipboard.setStringAsync(privateKey) },
                { text: 'Done' }
              ]
            );
          }
        },
      ]
    );
  };

  // Self-custodial wallet value (starts empty, only has deposited funds)
  const walletValue = Object.entries(walletHoldings).reduce((sum, [symbol, amount]) => {
    if (symbol === 'USDC') return sum + amount;
    return sum + (amount * (prices[symbol] || 0));
  }, 0);
  
  // On-chain ETH value
  const onChainValue = parseFloat(onChainBalance) * prices.ETH;

  const getTokenColor = (symbol) => {
    const colors = { USDC: '#2775CA', ETH: '#627EEA', BTC: '#F7931A', SOL: '#00FFA3', USDT: '#50AF95', DAI: '#F5AC37' };
    return colors[symbol] || '#00FFF0';
  };

  // Wallet holdings (self-custodial - only shows deposited funds)
  const walletHoldingsArray = Object.entries(walletHoldings)
    .filter(([_, amount]) => amount > 0 && isFinite(amount))
    .map(([symbol, amount]) => ({
      symbol,
      amount,
      value: symbol === 'USDC' ? amount : amount * (prices[symbol] || 0),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a1a', '#0d1f3c', '#0a0a1a']} style={styles.gradient}>
        <ScrollView style={styles.scroll}>
          <View style={styles.content}>
            <Text style={styles.title}>Wallet</Text>
            <Text style={styles.subtitle}>Self-Custodial • Linked to MetaMask</Text>

            {/* Self-Custodial Wallet Balance Card */}
            <View style={styles.balanceCard}>
              <LinearGradient
                colors={['rgba(0, 255, 240, 0.1)', 'rgba(0, 184, 212, 0.05)']}
                style={styles.balanceGradient}
              >
                <Text style={styles.balanceLabel}>Wallet Balance</Text>
                <Text style={styles.balance}>
                  ${(walletValue + onChainValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <View style={styles.networkBadge}>
                  <View style={styles.dot} />
                  <Text style={styles.networkText}>Base Sepolia • Self-Custodial</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Info Banner - Explain self-custodial */}
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#00B8D4" />
              <Text style={styles.infoText}>
                This is your self-custodial wallet. Deposit funds from your exchange to keep them safe. Only you control these assets.
              </Text>
            </View>

            {/* On-Chain Balance */}
            {parseFloat(onChainBalance) > 0 && (
              <View style={styles.onChainCard}>
                <Image source={{ uri: TOKEN_LOGOS.ETH }} style={styles.onChainLogo} />
                <Text style={styles.onChainLabel}>On-Chain ETH:</Text>
                <Text style={styles.onChainValue}>{parseFloat(onChainBalance).toFixed(6)} ETH</Text>
              </View>
            )}

            {/* Wallet Address */}
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <MaterialCommunityIcons name="wallet" size={20} color="#00FFF0" />
                <Text style={styles.addressTitle}>Your Wallet Address</Text>
              </View>
              <TouchableOpacity onPress={copyAddress} style={styles.addressBox}>
                <Text style={styles.addressText} numberOfLines={1}>
                  {walletAddress ? `${walletAddress.slice(0, 14)}...${walletAddress.slice(-14)}` : 'Loading...'}
                </Text>
                <MaterialCommunityIcons name="content-copy" size={18} color="#00FFF0" />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleDeposit}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(0, 255, 163, 0.15)' }]}>
                  <MaterialCommunityIcons name="bank-transfer-in" size={24} color="#00FFA3" />
                </View>
                <Text style={styles.actionText}>Deposit</Text>
                <Text style={styles.actionSubtext}>from Exchange</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => handleWithdraw('USDC')}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
                  <MaterialCommunityIcons name="arrow-up" size={24} color="#FF9800" />
                </View>
                <Text style={styles.actionText}>Withdraw</Text>
                <Text style={styles.actionSubtext}>to Address</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/history')}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(0, 255, 240, 0.15)' }]}>
                  <MaterialCommunityIcons name="history" size={24} color="#00FFF0" />
                </View>
                <Text style={styles.actionText}>History</Text>
                <Text style={styles.actionSubtext}>View All</Text>
              </TouchableOpacity>
            </View>

            {/* Wallet Assets (Self-Custodial) */}
            <Text style={styles.sectionTitle}>Wallet Assets</Text>
            <View style={styles.assetsList}>
              {walletHoldingsArray.length > 0 || parseFloat(onChainBalance) > 0 ? (
                <>
                  {parseFloat(onChainBalance) > 0 && (
                    <AssetItem 
                      symbol="ETH" 
                      amount={parseFloat(onChainBalance)} 
                      value={onChainValue}
                      onPress={() => handleWithdraw('ETH')}
                    />
                  )}
                  {walletHoldingsArray.map(({ symbol, amount, value }) => (
                    <AssetItem 
                      key={symbol}
                      symbol={symbol} 
                      amount={amount} 
                      value={value}
                      onPress={() => handleWithdraw(symbol)}
                    />
                  ))}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="wallet-outline" size={48} color="#444" />
                  <Text style={styles.emptyTitle}>Wallet is Empty</Text>
                  <Text style={styles.emptyText}>Deposit funds from your exchange to keep them safe in your self-custodial wallet</Text>
                  <TouchableOpacity style={styles.emptyButton} onPress={handleDeposit}>
                    <LinearGradient colors={['#00FFA3', '#00B8D4']} style={styles.emptyButtonGradient}>
                      <MaterialCommunityIcons name="bank-transfer-in" size={18} color="#000" />
                      <Text style={styles.emptyButtonText}>Deposit from Exchange</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Security Section */}
            <Text style={styles.sectionTitle}>Security</Text>
            <TouchableOpacity style={styles.securityItem} onPress={handleExportKey}>
              <View style={styles.securityLeft}>
                <MaterialCommunityIcons name="key" size={20} color="#FF9800" />
                <Text style={styles.securityText}>Export Private Key</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>

            <View style={styles.warningCard}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#00FFF0" />
              <Text style={styles.warningText}>
                Self-custodial wallet linked to MetaMask. You control your private keys. Never share them.
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Deposit from Exchange Modal */}
      <Modal visible={showDepositModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deposit from Exchange</Text>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* MetaMask Integration */}
            <View style={styles.metamaskSection}>
              <Image 
                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg' }} 
                style={styles.metamaskLogo}
              />
              <Text style={styles.metamaskTitle}>Connect with MetaMask</Text>
              <Text style={styles.metamaskSubtitle}>
                Transfer funds from your exchange or external wallet to your JASPR self-custodial wallet
              </Text>
            </View>

            <TouchableOpacity style={styles.metamaskBtn} onPress={openMetaMask}>
              <LinearGradient colors={['#F6851B', '#E2761B']} style={styles.metamaskBtnGradient}>
                <MaterialCommunityIcons name="fox" size={24} color="#FFF" />
                <Text style={styles.metamaskBtnText}>Open MetaMask</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.depositDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Manual Deposit Address */}
            <Text style={styles.depositLabel}>Send to this address:</Text>
            <TouchableOpacity onPress={copyAddress} style={styles.depositAddressBox}>
              <Text style={styles.depositAddressText} numberOfLines={2}>{walletAddress}</Text>
              <MaterialCommunityIcons name="content-copy" size={20} color="#00FFF0" />
            </TouchableOpacity>

            <View style={styles.depositInfo}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#FF9800" />
              <Text style={styles.depositInfoText}>
                Network: Base Sepolia Testnet{'\n'}Only send test tokens to this address
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.faucetBtn}
              onPress={() => Linking.openURL('https://www.alchemy.com/faucets/base-sepolia')}
            >
              <Text style={styles.faucetBtnText}>Get Free Test ETH →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal visible={showWithdrawModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw {withdrawToken}</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Available: {tradingBalance[withdrawToken]?.toFixed(withdrawToken === 'USDC' ? 2 : 6)} {withdrawToken}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recipient Address</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0x..."
                placeholderTextColor="#666"
                value={recipientAddress}
                onChangeText={setRecipientAddress}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount</Text>
              <View style={styles.amountRow}>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity 
                  style={styles.maxBtn}
                  onPress={() => setWithdrawAmount(tradingBalance[withdrawToken]?.toString() || '0')}
                >
                  <Text style={styles.maxBtnText}>MAX</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.feeInfo}>
              <Text style={styles.feeLabel}>Network Fee</Text>
              <Text style={styles.feeValue}>~0.0001 ETH</Text>
            </View>

            <TouchableOpacity 
              style={[styles.withdrawBtn, sending && styles.withdrawBtnDisabled]}
              onPress={executeWithdraw}
              disabled={sending}
            >
              <LinearGradient
                colors={sending ? ['#333', '#222'] : ['#FF9800', '#F57C00']}
                style={styles.withdrawBtnGradient}
              >
                <Text style={styles.withdrawBtnText}>
                  {sending ? 'Sending...' : `Withdraw ${withdrawToken}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.modalWarning}>
              ⚠️ Make sure the address is correct. Transactions cannot be reversed.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// AssetItem component with real token logos
function AssetItem({ symbol, amount, value, onPress }) {
  const [imageError, setImageError] = useState(false);
  const logo = TOKEN_LOGOS[symbol];
  
  const getTokenColor = (sym) => {
    const colors = { USDC: '#2775CA', ETH: '#627EEA', BTC: '#F7931A', SOL: '#00FFA3', USDT: '#50AF95', DAI: '#F5AC37' };
    return colors[sym] || '#00FFF0';
  };
  
  return (
    <TouchableOpacity style={styles.assetItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.assetLeft}>
        <View style={styles.assetLogoContainer}>
          {logo && !imageError ? (
            <Image 
              source={{ uri: logo }} 
              style={styles.assetLogo}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.assetIconFallback, { backgroundColor: `${getTokenColor(symbol)}25` }]}>
              <Text style={[styles.assetIconText, { color: getTokenColor(symbol) }]}>{symbol[0]}</Text>
            </View>
          )}
        </View>
        <View>
          <Text style={styles.assetSymbol}>{symbol}</Text>
          <Text style={styles.assetName}>Tap to withdraw</Text>
        </View>
      </View>
      <View style={styles.assetRight}>
        <Text style={styles.assetBalance}>{amount.toFixed(symbol === 'USDC' ? 2 : 6)}</Text>
        <Text style={styles.assetValue}>${value.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gradient: { flex: 1 },
  scroll: { flex: 1, backgroundColor: '#000' },
  content: { padding: 20, paddingTop: 50, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  balanceCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#222', backgroundColor: '#111' },
  balanceGradient: { padding: 28, alignItems: 'center' },
  balanceLabel: { fontSize: 14, color: '#888' },
  balance: { fontSize: 36, fontWeight: '700', color: '#FFF', marginVertical: 8 },
  networkBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C853' },
  networkText: { fontSize: 13, color: '#888' },
  onChainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  onChainLabel: { fontSize: 14, color: '#888' },
  onChainValue: { fontSize: 14, color: '#FFF', fontWeight: '600', marginLeft: 'auto' },
  addressCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  addressTitle: { fontSize: 13, color: '#888' },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 12,
    borderRadius: 8,
  },
  addressText: { fontSize: 13, color: '#FFF', fontFamily: 'monospace', flex: 1 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  actionBtn: { flex: 1, alignItems: 'center' },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: { fontSize: 13, color: '#FFF', fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#FFF', marginBottom: 16 },
  assetsList: { gap: 10, marginBottom: 28 },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  assetLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assetIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  assetIconText: { fontSize: 18, fontWeight: '700' },
  assetSymbol: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  assetName: { fontSize: 12, color: '#888', marginTop: 2 },
  assetRight: { alignItems: 'flex-end' },
  assetBalance: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  assetValue: { fontSize: 12, color: '#888', marginTop: 2 },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#888', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center', lineHeight: 20 },
  emptyButton: { marginTop: 20, borderRadius: 12, overflow: 'hidden' },
  emptyButtonGradient: { paddingHorizontal: 24, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  emptyButtonText: { fontSize: 16, fontWeight: '700', color: '#000' },
  // Info card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 184, 212, 0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 212, 0.2)',
  },
  infoText: { flex: 1, fontSize: 13, color: '#00B8D4', lineHeight: 18 },
  // On-chain logo
  onChainLogo: { width: 24, height: 24, borderRadius: 12 },
  // Asset logo styles
  assetLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  assetLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  assetIconFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Action button subtext
  actionSubtext: { fontSize: 10, color: '#666', marginTop: 2 },
  securityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  securityLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  securityText: { fontSize: 15, color: '#FFF' },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 240, 0.05)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  warningText: { flex: 1, fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 18 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0d1f3c',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  modalLabel: { fontSize: 14, color: '#888', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, color: '#888', marginBottom: 8 },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  amountRow: { flexDirection: 'row', gap: 10 },
  maxBtn: {
    backgroundColor: 'rgba(0, 255, 240, 0.15)',
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  maxBtnText: { color: '#00FFF0', fontWeight: '700' },
  feeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  feeLabel: { fontSize: 14, color: '#888' },
  feeValue: { fontSize: 14, color: '#FFF' },
  withdrawBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  withdrawBtnDisabled: { opacity: 0.6 },
  withdrawBtnGradient: { paddingVertical: 18, alignItems: 'center' },
  withdrawBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  modalWarning: { fontSize: 12, color: '#FF9800', textAlign: 'center' },
  // MetaMask/Deposit modal styles
  metamaskSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  metamaskLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 16,
  },
  metamaskTitle: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  metamaskSubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  metamaskBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  metamaskBtnGradient: { 
    paddingVertical: 16, 
    alignItems: 'center', 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 10 
  },
  metamaskBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  depositDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  dividerText: { paddingHorizontal: 16, color: '#666', fontSize: 14 },
  depositLabel: { fontSize: 14, color: '#888', marginBottom: 10 },
  depositAddressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  depositAddressText: { flex: 1, fontSize: 12, color: '#FFF', fontFamily: 'monospace' },
  depositInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 16,
  },
  depositInfoText: { flex: 1, fontSize: 12, color: '#FF9800', lineHeight: 18 },
  faucetBtn: {
    alignItems: 'center',
    padding: 12,
  },
  faucetBtnText: { color: '#00FFF0', fontSize: 14, fontWeight: '600' },
});
