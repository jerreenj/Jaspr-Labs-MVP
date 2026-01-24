import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter an email');
      return;
    }

    setLoading(true);
    try {
      // Create or load wallet
      let wallet;
      const savedWallet = await AsyncStorage.getItem('wallet_private_key');
      
      if (savedWallet) {
        wallet = new ethers.Wallet(savedWallet);
      } else {
        wallet = ethers.Wallet.createRandom();
        await AsyncStorage.setItem('wallet_private_key', wallet.privateKey);
        await AsyncStorage.setItem('wallet_address', wallet.address);
      }

      await AsyncStorage.setItem('user_email', email);
      await AsyncStorage.setItem('is_logged_in', 'true');

      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a3e', '#2d2d5f']}
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header}>
          <MaterialCommunityIcons name="wallet" size={60} color="#00d4ff" />
          <Text style={styles.title}>Welcome to JASPR</Text>
          <Text style={styles.subtitle}>Enter email to get started</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={['#00d4ff', '#0099cc']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Wallet...' : 'Continue'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.info}>
          <MaterialCommunityIcons name="information" size={20} color="#00d4ff" />
          <Text style={styles.infoText}>
            A secure wallet will be created for you automatically
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  loginButton: {
    width: '100%',
  },
  buttonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: '#00d4ff',
    fontSize: 14,
  },
});