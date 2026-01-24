import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SwapPage() {
  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const tokens = [
    { symbol: 'USDC', name: 'USD Coin', price: 1 },
    { symbol: 'ETH', name: 'Ethereum', price: 3000 },
    { symbol: 'BTC', name: 'Bitcoin', price: 50000 },
  ];

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmount('');
    setEstimatedOutput('');
  };

  const calculateOutput = (inputAmount) => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setEstimatedOutput('');
      return;
    }
    
    const fromPrice = tokens.find(t => t.symbol === fromToken)?.price || 1;
    const toPrice = tokens.find(t => t.symbol === toToken)?.price || 1;
    const output = (parseFloat(inputAmount) * fromPrice / toPrice) * 0.997; // 0.3% fee
    setEstimatedOutput(output.toFixed(6));
  };

  const handleAmountChange = (text) => {
    setAmount(text);
    calculateOutput(text);
  };

  const executeSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Enter valid amount');
      return;
    }

    const balance = await AsyncStorage.getItem('demo_balance');
    if (fromToken === 'USDC' && parseFloat(amount) > parseFloat(balance)) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough USDC');
      return;
    }

    setLoading(true);
    
    // Simulate swap
    setTimeout(async () => {
      try {
        if (fromToken === 'USDC') {
          const newBalance = parseFloat(balance) - parseFloat(amount);
          await AsyncStorage.setItem('demo_balance', newBalance.toString());
        } else if (toToken === 'USDC') {
          const newBalance = parseFloat(balance) + parseFloat(estimatedOutput);
          await AsyncStorage.setItem('demo_balance', newBalance.toString());
        }

        Alert.alert(
          'Swap Successful! 🎉',
          `Swapped ${amount} ${fromToken} for ${estimatedOutput} ${toToken}`,
          [{ text: 'Done', onPress: () => { setAmount(''); setEstimatedOutput(''); } }]
        );
      } catch (error) {
        Alert.alert('Error', 'Swap failed');
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000428', '#004e92']} style={styles.gradient}>
        <ScrollView style={styles.scroll}>
          <View style={styles.content}>
            <Text style={styles.title}>Swap Tokens</Text>
            <Text style={styles.subtitle}>Trade instantly on Base Sepolia</Text>

            <View style={styles.swapContainer}>
              <View style={styles.card}>
                <Text style={styles.label}>From</Text>
                <View style={styles.tokenRow}>
                  {tokens.map((token) => (
                    <TouchableOpacity
                      key={token.symbol}
                      style={[styles.tokenChip, fromToken === token.symbol && styles.tokenChipActive]}
                      onPress={() => { if (token.symbol !== toToken) setFromToken(token.symbol); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tokenChipText, fromToken === token.symbol && styles.tokenChipTextActive]}>
                        {token.symbol}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="0.0"
                  placeholderTextColor="#666"
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                />
              </View>

              <TouchableOpacity style={styles.swapButton} onPress={swapTokens}>
                <View style={styles.swapIcon}>
                  <MaterialCommunityIcons name="swap-vertical" size={24} color="#00FFF0" />
                </View>
              </TouchableOpacity>

              <View style={styles.card}>
                <Text style={styles.label}>To</Text>
                <View style={styles.tokenRow}>
                  {tokens.map((token) => (
                    <TouchableOpacity
                      key={token.symbol}
                      style={[styles.tokenChip, toToken === token.symbol && styles.tokenChipActive]}
                      onPress={() => { if (token.symbol !== fromToken) setToToken(token.symbol); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tokenChipText, toToken === token.symbol && styles.tokenChipTextActive]}>
                        {token.symbol}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.output}>{estimatedOutput || '0.0'}</Text>
              </View>
            </View>

            {estimatedOutput && (
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fee (0.3%)</Text>
                  <Text style={styles.infoValue}>${(parseFloat(amount) * 0.003).toFixed(2)}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={styles.executeButton} 
              onPress={executeSwap}
              disabled={loading || !amount}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00FFF0', '#00B8D4']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>Swap Tokens</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
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
  title: { fontSize: 32, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 32 },
  swapContainer: { marginBottom: 24 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  label: { fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 12, fontWeight: '500' },
  tokenRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tokenChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tokenChipActive: {
    backgroundColor: 'rgba(0, 255, 240, 0.2)',
  },
  tokenChipText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tokenChipTextActive: { color: '#00FFF0' },
  input: { fontSize: 36, color: '#FFF', fontWeight: '700' },
  output: { fontSize: 36, color: '#00FFF0', fontWeight: '700' },
  swapButton: {
    alignSelf: 'center',
    marginVertical: -24,
    zIndex: 10,
  },
  swapIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 255, 240, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#004e92',
  },
  infoCard: {
    backgroundColor: 'rgba(0, 255, 240, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' },
  infoValue: { fontSize: 14, color: '#FFF', fontWeight: '600' },
  executeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: { color: '#000', fontSize: 18, fontWeight: '700' },
});