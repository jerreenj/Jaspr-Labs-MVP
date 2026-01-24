import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TradePage() {
  const [mode, setMode] = useState('BUY'); // BUY or SELL
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card'); // card, bank, crypto
  const [loading, setLoading] = useState(false);

  const handleTrade = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Enter valid amount');
      return;
    }

    Alert.alert(
      `${mode} Crypto`,
      `${mode} $${amount} worth of ETH\n\nPayment: ${paymentMethod === 'card' ? 'Credit Card' : paymentMethod === 'bank' ? 'Bank Transfer' : 'Crypto'}\n\nProceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => executeTrade() },
      ]
    );
  };

  const executeTrade = async () => {
    setLoading(true);
    try {
      // Simulate on/off ramp
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Trade Successful! 🎉',
        `${mode === 'BUY' ? 'Purchased' : 'Sold'} $${amount} worth of ETH\n\nThis is a demo. Real on/off ramp requires KYC.`,
        [{ text: 'OK', onPress: () => setAmount('') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a3e', '#2d2d5f']}
      style={styles.container}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>On/Off Ramp</Text>
        <Text style={styles.subtitle}>Buy or sell crypto with fiat</Text>

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
          <Text style={styles.label}>Amount (USD)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#666"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="information" size={16} color="#888" />
            <Text style={styles.infoText}>≈ {amount ? (parseFloat(amount) / 3000).toFixed(6) : '0.00'} ETH</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.methodRow}>
            <TouchableOpacity
              style={[styles.methodButton, paymentMethod === 'card' && styles.methodButtonActive]}
              onPress={() => setPaymentMethod('card')}
            >
              <MaterialCommunityIcons name="credit-card" size={24} color={paymentMethod === 'card' ? '#00d4ff' : '#888'} />
              <Text style={[styles.methodText, paymentMethod === 'card' && styles.methodTextActive]}>Card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodButton, paymentMethod === 'bank' && styles.methodButtonActive]}
              onPress={() => setPaymentMethod('bank')}
            >
              <MaterialCommunityIcons name="bank" size={24} color={paymentMethod === 'bank' ? '#00d4ff' : '#888'} />
              <Text style={[styles.methodText, paymentMethod === 'bank' && styles.methodTextActive]}>Bank</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodButton, paymentMethod === 'crypto' && styles.methodButtonActive]}
              onPress={() => setPaymentMethod('crypto')}
            >
              <MaterialCommunityIcons name="bitcoin" size={24} color={paymentMethod === 'crypto' ? '#00d4ff' : '#888'} />
              <Text style={[styles.methodText, paymentMethod === 'crypto' && styles.methodTextActive]}>Crypto</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.feeCard}>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Network Fee</Text>
            <Text style={styles.feeValue}>$0.50</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Processing Fee (1%)</Text>
            <Text style={styles.feeValue}>${amount ? (parseFloat(amount) * 0.01).toFixed(2) : '0.00'}</Text>
          </View>
          <View style={[styles.feeRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${amount ? (parseFloat(amount) + parseFloat(amount) * 0.01 + 0.50).toFixed(2) : '0.00'}</Text>
          </View>
        </View>

        <View style={styles.banner}>
          <MaterialCommunityIcons name="shield-alert" size={20} color="#ff9800" />
          <Text style={styles.bannerText}>
            Demo only. Real on/off ramp requires KYC verification.
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
              <Text style={styles.buttonText}>{mode} Crypto</Text>
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
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 24 },
  modeSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
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
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { fontSize: 32, color: '#00d4ff', fontWeight: 'bold', marginRight: 8 },
  input: { flex: 1, fontSize: 32, color: '#fff', fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  infoText: { fontSize: 14, color: '#888' },
  methodRow: { flexDirection: 'row', gap: 12 },
  methodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  methodButtonActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  methodText: { fontSize: 12, color: '#888', marginTop: 8 },
  methodTextActive: { color: '#00d4ff' },
  feeCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feeLabel: { fontSize: 14, color: '#888' },
  feeValue: { fontSize: 14, color: '#fff' },
  totalRow: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#00d4ff' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  bannerText: { flex: 1, color: '#ff9800', fontSize: 12 },
  tradeButton: { width: '100%' },
  buttonGradient: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});