import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>Jaspr Labs</Text>
        <Text style={styles.tagline}>Your Crypto, Your Control</Text>
      </View>

      {/* Features Grid - Takes up most space */}
      <View style={styles.featuresGrid}>
        <View style={styles.featureCard}>
          <MaterialCommunityIcons name="chart-line" size={32} color="#00C853" />
          <Text style={styles.featureTitle}>Real-Time Trading</Text>
          <Text style={styles.featureDesc}>Professional charts with live price updates and instant order execution</Text>
        </View>
        
        <View style={styles.featureCard}>
          <MaterialCommunityIcons name="shield-lock" size={32} color="#FFF" />
          <Text style={styles.featureTitle}>Self-Custody</Text>
          <Text style={styles.featureDesc}>Your keys, your crypto. Full control over your digital assets</Text>
        </View>
        
        <View style={styles.featureCard}>
          <MaterialCommunityIcons name="swap-horizontal" size={32} color="#FFF" />
          <Text style={styles.featureTitle}>Instant Swaps</Text>
          <Text style={styles.featureDesc}>Trade between 25+ tokens with minimal fees and zero slippage</Text>
        </View>
        
        <View style={styles.featureCard}>
          <MaterialCommunityIcons name="wallet" size={32} color="#FFD700" />
          <Text style={styles.featureTitle}>MetaMask Ready</Text>
          <Text style={styles.featureDesc}>Connect your existing wallet or create a new one instantly</Text>
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottom}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/auth')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#000" />
        </TouchableOpacity>

        <Text style={styles.bonus}>🎁 $10,000 Demo Balance • No Sign-up Required</Text>
        <Text style={styles.network}>Base Sepolia Testnet</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brand: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
  },
  tagline: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  featuresGrid: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  featureDesc: {
    fontSize: 14,
    color: '#888',
    marginTop: 6,
    lineHeight: 20,
  },
  bottom: {
    marginTop: 20,
  },
  button: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  bonus: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 14,
  },
  network: {
    color: '#444',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
});
