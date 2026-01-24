import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LandingPage() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a3e', '#2d2d5f']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="wallet" size={80} color="#00d4ff" />
          <Text style={styles.logoText}>JASPR</Text>
          <Text style={styles.labsText}>LABS</Text>
          <Text style={styles.tagline}>Trade Crypto Like a Pro</Text>
          <Text style={styles.subtitle}>CEX Experience • DEX Freedom</Text>
        </View>

        <View style={styles.features}>
          <Feature icon="shield-check" text="Non-Custodial" />
          <Feature icon="swap-horizontal" text="Instant Swaps" />
          <Feature icon="chart-line" text="Live Markets" />
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/auth')}
        >
          <LinearGradient
            colors={['#00d4ff', '#0099cc']}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Launch Jaspr</Text>
            <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Base Sepolia Testnet • For Testing Only
        </Text>
      </View>
    </LinearGradient>
  );
}

function Feature({ icon, text }) {
  return (
    <View style={styles.feature}>
      <MaterialCommunityIcons name={icon} size={28} color="#00d4ff" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    letterSpacing: 4,
  },
  labsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#00d4ff',
    letterSpacing: 8,
    marginTop: -8,
  },
  tagline: {
    fontSize: 18,
    color: '#00d4ff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 48,
  },
  feature: {
    alignItems: 'center',
  },
  featureText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 12,
  },
  button: {
    width: '100%',
    marginBottom: 24,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  disclaimer: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
});