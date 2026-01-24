import 'react-native-get-random-values';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleQuickStart = async () => {
    setLoading(true);
    console.log('[AUTH] Starting Quick Start login...');
    
    try {
      // Create wallet
      console.log('[AUTH] Creating wallet...');
      const wallet = ethers.Wallet.createRandom();
      console.log('[AUTH] Wallet created:', wallet.address);
      
      // Save to storage
      await AsyncStorage.setItem('wallet_private_key', wallet.privateKey);
      await AsyncStorage.setItem('wallet_address', wallet.address);
      await AsyncStorage.setItem('username', 'User');
      await AsyncStorage.setItem('is_logged_in', 'true');
      
      // Initialize demo balance
      await AsyncStorage.setItem('demo_balance', '10000');
      
      console.log('[AUTH] Saved to storage');
      
      // Navigate immediately
      console.log('[AUTH] Navigating to home...');
      router.replace('/(tabs)/home');
      
    } catch (error) {
      console.error('[AUTH] Error:', error);
      Alert.alert('Error', 'Failed to create wallet: ' + error.message);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    // For now, show that Google OAuth needs to be configured
    Alert.alert(
      'Google OAuth',
      'Google OAuth requires configuration in your Supabase dashboard. For now, please use Quick Start.',
      [{ text: 'OK', onPress: () => setGoogleLoading(false) }]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000428', '#004e92']}
        style={styles.gradient}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="wallet" size={48} color="#00FFF0" />
            </View>
            <Text style={styles.title}>Jaspr</Text>
            <Text style={styles.subtitle}>Choose how to connect</Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity 
              style={styles.button}
              onPress={handleQuickStart}
              disabled={loading}
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
                  <>
                    <MaterialCommunityIcons name="flash" size={24} color="#000" />
                    <Text style={styles.buttonTextPrimary}>Quick Start</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.buttonSecondary}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="google" size={24} color="#FFF" />
                  <Text style={styles.buttonTextSecondary}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.info}>
            <MaterialCommunityIcons name="shield-check" size={18} color="#00FFF0" />
            <Text style={styles.infoText}>Secure wallet • $10,000 demo balance</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gradient: { flex: 1 },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconWrapper: {
    backgroundColor: 'rgba(0, 255, 240, 0.1)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 16,
  },
  buttons: {
    gap: 16,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  buttonTextPrimary: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 16,
    fontSize: 13,
  },
  buttonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  buttonTextSecondary: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
});
