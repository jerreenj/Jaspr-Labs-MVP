import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LandingPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>Jaspr</Text>
        <Text style={styles.brandSub}>Labs</Text>
      </View>

      {/* Features - 3 compact cards */}
      <View style={styles.featuresGrid}>
        <View style={styles.featureCard}>
          <MaterialCommunityIcons name="chart-line" size={24} color="#00C853" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Real-Time Trading</Text>
            <Text style={styles.featureDesc}>Live charts & instant execution</Text>
          </View>
        </View>
        
        <View style={styles.featureCard}>
          <MaterialCommunityIcons name="shield-lock" size={24} color="#FFF" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Self-Custody</Text>
            <Text style={styles.featureDesc}>Your keys, your crypto</Text>
          </View>
        </View>
        
        <View style={styles.featureCard}>
          <MaterialCommunityIcons name="swap-horizontal" size={24} color="#FFF" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Instant Swaps</Text>
            <Text style={styles.featureDesc}>25+ tokens, minimal fees</Text>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 40,
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
  },
  brandSub: {
    fontSize: 36,
    fontWeight: '300',
    color: '#666',
    marginLeft: 6,
  },
  featuresGrid: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
  },
  featureDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  bottom: {
    marginTop: 30,
  },
  button: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  bonus: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
  },
  network: {
    color: '#444',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
  },
});
