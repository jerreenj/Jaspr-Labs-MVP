import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usePrivy } from '@privy-io/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://jaspr-swap.preview.emergentagent.com';

export default function AuthPage() {
  const router = useRouter();
  const { isReady, authenticated, user, login, linkEmail } = usePrivy();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReady && authenticated && user) {
      createUserProfile();
    }
  }, [isReady, authenticated, user]);

  const createUserProfile = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/users/profile`, {
        privy_did: user?.id,
        email: user?.email?.address || '',
        username: user?.email?.address?.split('@')[0] || 'user'
      });
      
      if (response.data.success) {
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert('Error', 'Failed to create profile');
    }
  };

  const handleEmailLogin = async () => {
    try {
      setLoading(true);
      await login();
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await login();
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  if (!isReady || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a2e', '#0f3460', '#16213e']}
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
          <Text style={styles.subtitle}>Login to access your wallet</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={['#00d4ff', '#0099cc']}
              style={styles.buttonGradient}
            >
              <MaterialCommunityIcons name="email" size={24} color="#fff" />
              <Text style={styles.buttonText}>Continue with Email</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <View style={styles.googleButton}>
              <MaterialCommunityIcons name="google" size={24} color="#fff" />
              <Text style={styles.buttonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.safetyBanner}>
          <MaterialCommunityIcons name="shield-check" size={20} color="#00d4ff" />
          <Text style={styles.safetyText}>
            JASPR never asks for seed phrases or private keys
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
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
  buttonsContainer: {
    gap: 16,
  },
  loginButton: {
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginTop: 32,
    gap: 8,
  },
  safetyText: {
    flex: 1,
    color: '#00d4ff',
    fontSize: 14,
  },
});
