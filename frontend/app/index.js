import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LandingPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Brand - Centered */}
        <View style={styles.brandSection}>
          <Text style={styles.brand}>Jaspr Labs</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureRow}>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name="chart-line" size={28} color="#00C853" />
              </View>
              <Text style={styles.featureTitle}>Real-Time Trading</Text>
              <Text style={styles.featureDesc}>Live charts & instant execution</Text>
            </View>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name="shield-lock" size={28} color="#FFF" />
              </View>
              <Text style={styles.featureTitle}>Self-Custody</Text>
              <Text style={styles.featureDesc}>You control your private keys</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name="swap-horizontal" size={28} color="#FFF" />
              </View>
              <Text style={styles.featureTitle}>Instant Swaps</Text>
              <Text style={styles.featureDesc}>Trade 25+ tokens seamlessly</Text>
            </View>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <MaterialCommunityIcons name="cash-multiple" size={28} color="#FFD700" />
              </View>
              <Text style={styles.featureTitle}>Low Fees</Text>
              <Text style={styles.featureDesc}>0.3% per trade, no hidden costs</Text>
            </View>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/auth')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <MaterialCommunityIcons name="arrow-right" size={22} color="#000" />
        </TouchableOpacity>

        {/* Trust Badge */}
        <View style={styles.trustBadge}>
          <MaterialCommunityIcons name="check-decagram" size={18} color="#00C853" />
          <Text style={styles.trustText}>$10,000 Demo Balance • No Sign-up Required</Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Base Sepolia Testnet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  brand: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 2,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  features: {
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  feature: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  featureIcon: {
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  featureDesc: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  button: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  trustText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    color: '#333',
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 40,
    fontFamily: 'Inter_400Regular',
  },
});
