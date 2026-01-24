import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

export default function WalletPage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState('');
  const [holdings, setHoldings] = useState({ USDC: 10000, ETH: 0, BTC: 0 });
  const [prices, setPrices] = useState({ ETH: 3000, BTC: 90000 });

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const address = await AsyncStorage.getItem('wallet_address');
      const demoBalance = await AsyncStorage.getItem('demo_balance');
      const storedHoldings = await AsyncStorage.getItem('token_holdings');
      
      setWalletAddress(address || '');
      
      const usdcBalance = demoBalance ? parseFloat(demoBalance) : 10000;
      const tokenHoldings = storedHoldings ? JSON.parse(storedHoldings) : {};
      
      setHoldings({
        USDC: usdcBalance,
        ETH: tokenHoldings.ETH || 0,
        BTC: tokenHoldings.BTC || 0,
      });

      // Fetch live prices
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd'
        );
        const data = await response.json();
        setPrices({
          ETH: data.ethereum?.usd || 3000,
          BTC: data.bitcoin?.usd || 90000,
        });
      } catch (e) {}
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const copyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
    Alert.alert('Copied!', 'Wallet address copied to clipboard');
  };

  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw',
      'Enter recipient address and amount to withdraw tokens from your wallet.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => {
          Alert.alert('Demo Mode', 'Withdrawals require real Base Sepolia ETH for gas fees. This is a testnet demo.');
        }},
      ]
    );
  };

  const handleDeposit = () => {
    Alert.alert(
      'Deposit',
      `Send tokens to your wallet address:\n\n${walletAddress}\n\nNetwork: Base Sepolia Testnet`,
      [{ text: 'Copy Address', onPress: copyAddress }, { text: 'OK' }]
    );
  };

  const handleExportKey = () => {
    Alert.alert(
      'Export Private Key',
      'Your private key gives full control of your wallet. Never share it with anyone!',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Show Key', style: 'destructive', onPress: async () => {
          const privateKey = await AsyncStorage.getItem('wallet_private_key');
          Alert.alert('Private Key', privateKey || 'Not found', [{ text: 'Copy', onPress: async () => {
            await Clipboard.setStringAsync(privateKey || '');
          }}, { text: 'Done' }]);
        }},
      ]
    );
  };

  const totalValue = holdings.USDC + (holdings.ETH * prices.ETH) + (holdings.BTC * prices.BTC);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000428', '#004e92']} style={styles.gradient}>
        <ScrollView style={styles.scroll}>
          <View style={styles.content}>
            <Text style={styles.title}>Wallet</Text>
            <Text style={styles.subtitle}>Self-Custodial • Base Sepolia</Text>

            {/* Total Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balance}>${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <View style={styles.networkBadge}>
                <View style={styles.dot} />
                <Text style={styles.networkText}>Connected to Base Sepolia</Text>
              </View>
            </View>

            {/* Wallet Address */}
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <MaterialCommunityIcons name="wallet" size={20} color="#00FFF0" />
                <Text style={styles.addressTitle}>Wallet Address</Text>
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
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(0, 255, 240, 0.15)' }]}>
                  <MaterialCommunityIcons name="arrow-down" size={24} color="#00FFF0" />
                </View>
                <Text style={styles.actionText}>Deposit</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleWithdraw}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(255, 152, 0, 0.15)' }]}>
                  <MaterialCommunityIcons name="arrow-up" size={24} color="#FF9800" />
                </View>
                <Text style={styles.actionText}>Withdraw</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/swap')}>
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(0, 184, 212, 0.15)' }]}>
                  <MaterialCommunityIcons name="swap-horizontal" size={24} color="#00B8D4" />
                </View>
                <Text style={styles.actionText}>Swap</Text>
              </TouchableOpacity>
            </View>

            {/* Assets */}
            <Text style={styles.sectionTitle}>Assets</Text>
            <View style={styles.assetsList}>
              {holdings.USDC > 0 && (
                <AssetItem 
                  symbol="USDC" 
                  name="USD Coin" 
                  balance={holdings.USDC} 
                  value={holdings.USDC}
                  color="#2775CA"
                />
              )}
              {holdings.ETH > 0 && (
                <AssetItem 
                  symbol="ETH" 
                  name="Ethereum" 
                  balance={holdings.ETH} 
                  value={holdings.ETH * prices.ETH}
                  color="#627EEA"
                />
              )}
              {holdings.BTC > 0 && (
                <AssetItem 
                  symbol="BTC" 
                  name="Bitcoin" 
                  balance={holdings.BTC} 
                  value={holdings.BTC * prices.BTC}
                  color="#F7931A"
                />
              )}
              {holdings.USDC === 0 && holdings.ETH === 0 && holdings.BTC === 0 && (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="wallet-outline" size={48} color="#444" />
                  <Text style={styles.emptyText}>No assets yet</Text>
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
                Self-custodial wallet. You control your private keys. Never share them with anyone.
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

function AssetItem({ symbol, name, balance, value, color }) {
  return (
    <View style={styles.assetItem}>
      <View style={styles.assetLeft}>
        <View style={[styles.assetIcon, { backgroundColor: `${color}30` }]}>
          <Text style={[styles.assetIconText, { color }]}>{symbol[0]}</Text>
        </View>
        <View>
          <Text style={styles.assetSymbol}>{symbol}</Text>
          <Text style={styles.assetName}>{name}</Text>
        </View>
      </View>
      <View style={styles.assetRight}>
        <Text style={styles.assetBalance}>{balance.toFixed(symbol === 'USDC' ? 2 : 6)}</Text>
        <Text style={styles.assetValue}>${value.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 60, paddingBottom: 100 },
  title: { fontSize: 32, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.5)', marginBottom: 24 },
  balanceCard: {
    backgroundColor: 'rgba(0, 255, 240, 0.05)',
    borderRadius: 20,
    padding: 28,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 240, 0.2)',
  },
  balanceLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' },
  balance: { fontSize: 40, fontWeight: '700', color: '#FFF', marginVertical: 8 },
  networkBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00FFF0' },
  networkText: { fontSize: 12, color: '#00FFF0' },
  addressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  addressTitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.6)' },
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
  assetsList: { gap: 8, marginBottom: 28 },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  assetLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assetIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  assetIconText: { fontSize: 18, fontWeight: '700' },
  assetSymbol: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  assetName: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginTop: 2 },
  assetRight: { alignItems: 'flex-end' },
  assetBalance: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  assetValue: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginTop: 2 },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 14, color: '#666', marginTop: 12 },
  securityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
});
