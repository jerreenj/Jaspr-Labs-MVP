import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { usePrivy, useEmbeddedWallet } from '@privy-io/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://jaspr-swap.preview.emergentagent.com';

export default function SendScreen() {
  const router = useRouter();
  const { user } = usePrivy();
  const wallet = useEmbeddedWallet();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [loading, setLoading] = useState(false);
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);

  const validateAddress = (address: string) => {
    return address.startsWith('0x') && address.length === 42;
  };

  const handleSend = () => {
    // Validation
    if (!toAddress || !amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!validateAddress(toAddress)) {
      Alert.alert('Error', 'Invalid address format');
      return;
    }

    if (parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Amount must be greater than 0');
      return;
    }

    // Show safety check
    setShowSafetyCheck(true);
  };

  const confirmSend = async () => {
    try {
      setLoading(true);
      setShowSafetyCheck(false);

      // In a real app, you would sign and send the transaction using the wallet
      // For MVP, we'll just record it in the backend
      const response = await axios.post(`${BACKEND_URL}/api/transactions`, {
        from_address: wallet?.address || '',
        to_address: toAddress,
        amount: amount,
        token_symbol: selectedToken
      });

      if (response.data.success) {
        Alert.alert('Success', 'Transaction submitted successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Send error:', error);
      Alert.alert('Error', 'Failed to send transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#0f3460', '#16213e']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Send</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Token Selector */}
        <View style={styles.card}>
          <Text style={styles.label}>Select Token</Text>
          <View style={styles.tokenSelector}>
            <TokenButton 
              symbol="ETH" 
              icon="ethereum" 
              selected={selectedToken === 'ETH'}
              onPress={() => setSelectedToken('ETH')}
            />
            <TokenButton 
              symbol="USDC" 
              icon="currency-usd-circle" 
              selected={selectedToken === 'USDC'}
              onPress={() => setSelectedToken('USDC')}
            />
          </View>
        </View>

        {/* To Address */}
        <View style={styles.card}>
          <Text style={styles.label}>To Address</Text>
          <TextInput
            style={styles.input}
            placeholder="0x..."
            placeholderTextColor="#666"
            value={toAddress}
            onChangeText={setToAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Amount */}
        <View style={styles.card}>
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="0.0"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <Text style={styles.tokenLabel}>{selectedToken}</Text>
        </View>

        {/* Safety Banner */}
        <View style={styles.safetyBanner}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#ff9800" />
          <Text style={styles.safetyText}>
            ⚠️ Double check address and amount. Transactions cannot be reversed.
          </Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={handleSend}
          disabled={loading}
        >
          <LinearGradient
            colors={['#00d4ff', '#0099cc']}
            style={styles.buttonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={24} color="#fff" />
                <Text style={styles.buttonText}>Send</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Safety Check Modal */}
      {showSafetyCheck && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="shield-alert" size={48} color="#ff9800" />
            <Text style={styles.modalTitle}>Safety Check</Text>
            <Text style={styles.modalText}>
              You are about to send {amount} {selectedToken} to:
            </Text>
            <Text style={styles.modalAddress}>
              {toAddress.slice(0, 10)}...{toAddress.slice(-10)}
            </Text>
            <Text style={styles.modalWarning}>
              JASPR never asks for seed phrases. This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowSafetyCheck(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={confirmSend}
              >
                <LinearGradient
                  colors={['#00d4ff', '#0099cc']}
                  style={styles.confirmGradient}
                >
                  <Text style={styles.confirmText}>Confirm Send</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

function TokenButton({ symbol, icon, selected, onPress }: any) {
  return (
    <TouchableOpacity 
      style={[styles.tokenButton, selected && styles.tokenButtonSelected]}
      onPress={onPress}
    >
      <MaterialCommunityIcons name={icon} size={24} color={selected ? '#00d4ff' : '#888'} />
      <Text style={[styles.tokenButtonText, selected && styles.tokenButtonTextSelected]}>
        {symbol}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  tokenSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  tokenButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  tokenButtonSelected: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  tokenButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  tokenButtonTextSelected: {
    color: '#00d4ff',
  },
  input: {
    fontSize: 18,
    color: '#fff',
    paddingVertical: 8,
  },
  tokenLabel: {
    fontSize: 14,
    color: '#00d4ff',
    marginTop: 8,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  safetyText: {
    flex: 1,
    color: '#ff9800',
    fontSize: 14,
  },
  sendButton: {
    width: '100%',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalAddress: {
    fontSize: 14,
    color: '#00d4ff',
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  modalWarning: {
    fontSize: 14,
    color: '#ff9800',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
  },
  confirmGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
