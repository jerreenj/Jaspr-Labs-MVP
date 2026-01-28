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

      {/* Features - 3 cards */}
      <View style={styles.featuresGrid}>
        <View style={styles.featureCard}>
          <MaterialCommunityIcons name="chart-line" size={36} color="#00C853" />
          <Text style={styles.featureTitle}>Real-Time Trading</Text>
          <Text style={styles.featureDesc}>Professional charts with live price updates and instant order execution</Text>
        </View>
        
        <View style={styles.featureCard}>
          <MaterialCommunityIcons name="shield-lock" size={36} color="#FFF" />
          <Text style={styles.featureTitle}>Self-Custody</Text>
          <Text style={styles.featureDesc}>Your keys, your crypto. Full control over your digital assets</Text>
        </View>
        
        <View style={styles.featureCard}>
          <MaterialCommunityIcons name="swap-horizontal" size={36} color="#FFF" />
          <Text style={styles.featureTitle}>Instant Swaps</Text>
          <Text style={styles.featureDesc}>Trade between 25+ tokens with minimal fees and zero slippage</Text>
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
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 30,
  },
  brand: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
  },
  brandSub: {
    fontSize: 42,
    fontWeight: '300',
    color: '#666',
    fontFamily: 'Inter_400Regular',
    marginLeft: 8,
  },
  featuresGrid: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  featureCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  featureDesc: {
    fontSize: 15,
    color: '#888',
    marginTop: 8,
    lineHeight: 22,
  },
  bottom: {
    marginTop: 24,
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
