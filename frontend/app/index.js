import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Hero - Jaspr Labs as main focus */}
      <View style={styles.header}>
        <Text style={styles.brand}>Jaspr Labs</Text>
        <Text style={styles.tagline}>Next-gen crypto trading</Text>
      </View>

      {/* Features - 3 cards that fill middle */}
      <View style={styles.featuresGrid}>
        <View style={styles.featureCard}>
          <MaterialCommunityIcons name="chart-line" size={28} color="#00C853" />
          <Text style={styles.featureTitle}>Real-Time Trading</Text>
          <Text style={styles.featureDesc}>Professional charts with live updates</Text>
        </View>
        
        <View style={styles.featureCard}>
          <MaterialCommunityIcons name="shield-lock" size={28} color="#FFF" />
          <Text style={styles.featureTitle}>Self-Custody</Text>
          <Text style={styles.featureDesc}>Your keys, your crypto, your control</Text>
        </View>
        
        <View style={styles.featureCard}>
          <MaterialCommunityIcons name="swap-horizontal" size={28} color="#FFF" />
          <Text style={styles.featureTitle}>Instant Swaps</Text>
          <Text style={styles.featureDesc}>Trade 25+ tokens with low fees</Text>
        </View>
      </View>

      {/* Bottom - Fixed at bottom */}
      <View style={styles.bottom}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/auth')}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#000" />
        </TouchableOpacity>

        <Text style={styles.bonus}>🎁 $10,000 Demo • No Sign-up</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brand: {
    fontSize: 52,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
  },
  featuresGrid: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
    justifyContent: 'center',
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
    color: '#666',
    marginTop: 6,
  },
  bottom: {},
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
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  bonus: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
