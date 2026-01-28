import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LandingPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name="wallet" size={64} color="#FFF" />
          </View>
          <Text style={styles.logoText}>Jaspr</Text>
          <Text style={styles.tagline}>CEX Features & DEX Freedom</Text>
        </View>

        <View style={styles.features}>
          <Feature icon="lock-outline" text="Secure" />
          <Feature icon="flash" text="Fast" />
          <Feature icon="trending-up" text="Profitable" />
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/auth')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Launch App</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#000" />
        </TouchableOpacity>

        <Text style={styles.disclaimer}>Base Sepolia Testnet</Text>
      </View>
    </View>
  );
}

function Feature({ icon, text }) {
  return (
    <View style={styles.feature}>
      <MaterialCommunityIcons name={icon} size={24} color="#FFF" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#000',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 64,
  },
  iconWrapper: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  logoText: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 64,
  },
  feature: {
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  disclaimer: {
    color: '#444',
    fontSize: 12,
    marginTop: 32,
  },
});
