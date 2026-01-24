import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';

export default function TradePage() {
  const [mode, setMode] = useState('BUY'); // BUY or SELL
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('BTC');

  const handleTrade = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    Alert.alert('Coming Soon', 'Trading will be available after contract deployment');
  };

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

        <View style={styles.tokenSelector}>
          <Text style={styles.label}>Token</Text>
          <TouchableOpacity style={styles.tokenButton}>
            <Text style={styles.tokenText}>{selectedToken}/USDC</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#888" />
          </TouchableOpacity>
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

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price</Text>
            <Text style={styles.infoValue}>$50,000</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fee (0.1%)</Text>
            <Text style={styles.infoValue}>~$0.05</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>You'll receive</Text>
            <Text style={styles.infoValue}>0.00 {mode === 'BUY' ? selectedToken : 'USDC'}</Text>
          </View>
        </View>

        <View style={styles.banner}>
          <MaterialCommunityIcons name="information" size={20} color="#00d4ff" />
          <Text style={styles.bannerText}>
            Testnet token: j{selectedToken}
          </Text>
        </View>

        <TouchableOpacity style={styles.tradeButton} onPress={handleTrade}>
          <LinearGradient
            colors={mode === 'BUY' ? ['#00d4ff', '#0099cc'] : ['#ff4444', '#cc0000']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>{mode} {selectedToken}</Text>
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
  tokenSelector: { marginBottom: 16 },
  label: { fontSize: 14, color: '#888', marginBottom: 8 },
  tokenButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
  },
  tokenText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  input: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: '#fff', fontWeight: '600' },
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