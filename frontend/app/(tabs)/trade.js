import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://jaspr-swap.preview.emergentagent.com';

export default function TradePage() {
  const [mode, setMode] = useState('BUY');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('BTC');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    const address = await AsyncStorage.getItem('wallet_address');
    setWalletAddress(address || '');
  };

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/swap`, {
        wallet_address: walletAddress,
        type: 'swap',
        from_token: mode === 'BUY' ? 'USDC' : selectedToken,
        to_token: mode === 'BUY' ? selectedToken : 'USDC',
        amount: amount,
      });

      Alert.alert(
        'Success!',
        `${mode === 'BUY' ? 'Bought' : 'Sold'} ${selectedToken}\nTx: ${response.data.tx_hash.slice(0, 10)}...`,
        [{ text: 'OK', onPress: () => setAmount('') }]
      );
    } catch (error) {
      console.error('Trade error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  const tokens = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'TON', 'MATIC'];

  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a3e', '#2d2d5f']}
      style={styles.container}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Trade</Text>

        <View style={styles.modeSelector}>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'BUY' && styles.modeButtonActive]}
            onPress={() => setMode('BUY')}
          >
            <Text style={[styles.modeText, mode === 'BUY' && styles.modeTextActive]}>BUY</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'SELL' && styles.modeButtonActive]}
            onPress={() => setMode('SELL')}
          >
            <Text style={[styles.modeText, mode === 'SELL' && styles.modeTextActive]}>SELL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Select Token</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tokenScroll}>
            {tokens.map((token) => (
              <TouchableOpacity
                key={token}
                style={[styles.tokenChip, selectedToken === token && styles.tokenChipActive]}
                onPress={() => setSelectedToken(token)}
              >
                <Text style={[styles.tokenChipText, selectedToken === token && styles.tokenChipTextActive]}>
                  {token}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Amount (USDC)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.banner}>
          <MaterialCommunityIcons name="information" size={20} color="#00d4ff" />
          <Text style={styles.bannerText}>
            Mock trading - Instant execution
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.tradeButton} 
          onPress={handleTrade}
          disabled={loading}
        >
          <LinearGradient
            colors={mode === 'BUY' ? ['#00d4ff', '#0099cc'] : ['#ff4444', '#cc0000']}
            style={styles.buttonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{mode} {selectedToken}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  modeText: { fontSize: 16, fontWeight: 'bold', color: '#888' },
  modeTextActive: { color: '#00d4ff' },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  label: { fontSize: 14, color: '#888', marginBottom: 12 },
  tokenScroll: {
    flexDirection: 'row',
  },
  tokenChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
  },
  tokenChipActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  tokenChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  tokenChipTextActive: {
    color: '#00d4ff',
  },
  input: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  bannerText: { flex: 1, color: '#00d4ff', fontSize: 12 },
  tradeButton: { width: '100%' },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});