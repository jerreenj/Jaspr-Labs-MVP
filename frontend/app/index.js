import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LandingPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <Text style={styles.brand}>Jaspr Labs</Text>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureRow}>
            <View style={styles.feature}>
              <MaterialCommunityIcons name="chart-line" size={22} color="#00C853" />
              <Text style={styles.featureTitle}>Real-Time Trading</Text>
              <Text style={styles.featureDesc}>Live charts & execution</Text>
            </View>
            <View style={styles.feature}>
              <MaterialCommunityIcons name="shield-lock" size={22} color="#FFF" />
              <Text style={styles.featureTitle}>Self-Custody</Text>
              <Text style={styles.featureDesc}>You control your keys</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.feature}>
              <MaterialCommunityIcons name="swap-horizontal" size={22} color="#FFF" />
              <Text style={styles.featureTitle}>Instant Swaps</Text>
              <Text style={styles.featureDesc}>25+ tokens available</Text>
            </View>
            <View style={styles.feature}>
              <MaterialCommunityIcons name="cash-multiple" size={22} color="#FFD700" />
              <Text style={styles.featureTitle}>Low Fees</Text>
              <Text style={styles.featureDesc}>0.3% per trade</Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/auth')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#000" />
        </TouchableOpacity>

        <View style={styles.trustBadge}>
          <MaterialCommunityIcons name="check-decagram" size={14} color="#00C853" />
          <Text style={styles.trustText}>$10,000 Demo • No Sign-up</Text>
        </View>

        <Text style={styles.footer}>Base Sepolia Testnet</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  brand: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
    marginBottom: 24,
  },
  features: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
  },
  feature: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 6,
    fontFamily: 'Inter_600SemiBold',
  },
  featureDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  trustText: {
    color: '#666',
    fontSize: 12,
  },
  footer: {
    color: '#333',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
});
