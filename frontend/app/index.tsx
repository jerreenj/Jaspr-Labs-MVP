import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LandingPage() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#1a1a2e', '#0f3460', '#16213e']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="wallet" size={80} color="#00d4ff" />
          <Text style={styles.logoText}>JASPR</Text>
          <Text style={styles.tagline}>Your Gateway to DeFi</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <FeatureItem icon="lock" text="Non-Custodial" />
          <FeatureItem icon="swap-horizontal" text="Instant Swaps" />
          <FeatureItem icon="shield-check" text="Secure" />
        </View>

        {/* CTA Button */}
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={() => router.push('/auth')}
        >
          <LinearGradient
            colors={['#00d4ff', '#0099cc']}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Launch App</Text>
            <MaterialCommunityIcons name="arrow-right" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Always secure. Never custodial.
        </Text>
      </View>
    </LinearGradient>
  );
}

function FeatureItem({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.featureItem}>
      <MaterialCommunityIcons name={icon} size={32} color="#00d4ff" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  tagline: {
    fontSize: 18,
    color: '#00d4ff',
    marginTop: 8,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 48,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 12,
  },
  ctaButton: {
    width: '100%',
    marginBottom: 24,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  disclaimer: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
});
