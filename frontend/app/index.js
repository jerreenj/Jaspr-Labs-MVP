import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LandingPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000428', '#004e92']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="wallet" size={64} color="#00FFF0" />
            </View>
            <Text style={styles.logoText}>Jaspr</Text>
            <Text style={styles.labsText}>Labs</Text>
            <Text style={styles.tagline}>Professional Crypto Trading</Text>
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
            <LinearGradient
              colors={['#00FFF0', '#00B8D4']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Launch App</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#000" />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>Base Sepolia Testnet</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function Feature({ icon, text }) {
  return (
    <View style={styles.feature}>
      <MaterialCommunityIcons name={icon} size={24} color="#00FFF0" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gradient: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 64,
  },
  iconWrapper: {
    backgroundColor: 'rgba(0, 255, 240, 0.1)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 1,
  },
  labsText: {
    fontSize: 18,
    fontWeight: '300',
    color: '#00FFF0',
    letterSpacing: 6,
    marginTop: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
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
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#00FFF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
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
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 32,
  },
});