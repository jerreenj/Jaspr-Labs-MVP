import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { usePrivy, useEmbeddedWallet } from '@privy-io/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://jaspr-swap.preview.emergentagent.com';

export default function SwapScreen() {
  const router = useRouter();
  const wallet = useEmbeddedWallet();
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showSafetyCheck, setShowSafetyCheck] = useState(false);

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
    setToAmount('');
    setQuote(null);
  };

  const getQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${BACKEND_URL}/api/swap/quote`, {
        from_token: fromToken,
        to_token: toToken,
        amount: fromAmount,
        wallet_address: wallet?.address || ''
      });

      setQuote(response.data);
      setToAmount(response.data.to_amount);
    } catch (error) {
      console.error('Quote error:', error);
      Alert.alert('Error', 'Failed to get quote');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    if (!quote) {
      Alert.alert('Error', 'Please get a quote first');
      return;
    }
    setShowSafetyCheck(true);
  };

  const confirmSwap = async () => {
    try {
      setLoading(true);
      setShowSafetyCheck(false);

      // In a real app, execute the swap through the DEX
      // For MVP, we'll just show success
      Alert.alert('Success', 'Swap executed successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Swap error:', error);
      Alert.alert('Error', 'Failed to execute swap');
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
          <Text style={styles.title}>Swap</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* From Token */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.label}>From</Text>
            <TouchableOpacity onPress={() => setFromToken(fromToken === 'ETH' ? 'USDC' : 'ETH')}>
              <View style={styles.tokenPill}>
                <MaterialCommunityIcons 
                  name={fromToken === 'ETH' ? 'ethereum' : 'currency-usd-circle'} 
                  size={20} 
                  color="#00d4ff" 
                />
                <Text style={styles.tokenPillText}>{fromToken}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#888" />
              </View>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.amountInput}
            placeholder="0.0"
            placeholderTextColor="#666"
            value={fromAmount}
            onChangeText={setFromAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Swap Icon */}
        <View style={styles.swapIconContainer}>
          <TouchableOpacity onPress={swapTokens} style={styles.swapButton}>
            <LinearGradient
              colors={['#9c27b0', '#7b1fa2']}
              style={styles.swapIconGradient}
            >
              <MaterialCommunityIcons name="swap-vertical" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* To Token */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.label}>To</Text>
            <TouchableOpacity onPress={() => setToToken(toToken === 'ETH' ? 'USDC' : 'ETH')}>
              <View style={styles.tokenPill}>
                <MaterialCommunityIcons 
                  name={toToken === 'ETH' ? 'ethereum' : 'currency-usd-circle'} 
                  size={20} 
                  color="#00d4ff" 
                />
                <Text style={styles.tokenPillText}>{toToken}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#888" />
              </View>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.amountInput}
            placeholder="0.0"
            placeholderTextColor="#666"
            value={toAmount}
            editable={false}
          />
        </View>

        {/* Quote Info */}
        {quote && (
          <View style={styles.quoteCard}>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Rate</Text>
              <Text style={styles.quoteValue}>1 {fromToken} = {quote.price} {toToken}</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Gas Fee</Text>
              <Text style={styles.quoteValue}>~{quote.gas_estimate} ETH</Text>
            </View>
          </View>
        )}

        {/* Safety Banner */}
        <View style={styles.safetyBanner}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#ff9800" />
          <Text style={styles.safetyText}>
            ⚠️ Review swap details carefully. JASPR never asks for seed phrases.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          {!quote ? (
            <TouchableOpacity 
              style={styles.quoteButton}
              onPress={getQuote}
              disabled={loading}
            >
              <LinearGradient
                colors={['#9c27b0', '#7b1fa2']}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Get Quote</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.swapButtonMain}
              onPress={handleSwap}
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
                    <MaterialCommunityIcons name="swap-horizontal" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Swap</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Safety Check Modal */}
      {showSafetyCheck && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="shield-alert" size={48} color="#ff9800" />
            <Text style={styles.modalTitle}>Confirm Swap</Text>
            <Text style={styles.modalText}>
              You are about to swap {fromAmount} {fromToken} for approximately {toAmount} {toToken}
            </Text>
            <Text style={styles.modalWarning}>
              This action cannot be undone.
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
                onPress={confirmSwap}
              >
                <LinearGradient
                  colors={['#00d4ff', '#0099cc']}
                  style={styles.confirmGradient}
                >
                  <Text style={styles.confirmText}>Confirm Swap</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </LinearGradient>
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
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#888',
  },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  tokenPillText: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: '600',
  },
  amountInput: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  swapIconContainer: {
    alignItems: 'center',
    marginVertical: -20,
    zIndex: 10,
  },
  swapButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  swapIconGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteCard: {
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.2)',
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quoteLabel: {
    fontSize: 14,
    color: '#888',
  },
  quoteValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
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
  buttonsContainer: {
    width: '100%',
  },
  quoteButton: {
    width: '100%',
  },
  swapButtonMain: {
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
