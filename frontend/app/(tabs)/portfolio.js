import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PortfolioPage() {
  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a3e', '#2d2d5f']}
      style={styles.container}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Portfolio</Text>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Value</Text>
          <Text style={styles.totalValue}>$100.00</Text>
          <View style={styles.pnlRow}>
            <MaterialCommunityIcons name="trending-up" size={16} color="#00d4ff" />
            <Text style={styles.pnl}>+$0.00 (0%)</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Holdings</Text>

        <View style={styles.tokenCard}>
          <View style={styles.tokenRow}>
            <View style={styles.tokenInfo}>
              <View style={styles.tokenIcon}>
                <Text style={styles.tokenIconText}>U</Text>
              </View>
              <View>
                <Text style={styles.tokenName}>USDC</Text>
                <Text style={styles.tokenBalance}>100.00</Text>
              </View>
            </View>
            <View style={styles.tokenValue}>
              <Text style={styles.valueUsd}>$100.00</Text>
              <Text style={styles.valuePercent}>100%</Text>
            </View>
          </View>
        </View>

        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="chart-pie" size={48} color="#333" />
          <Text style={styles.emptyText}>Start trading to build your portfolio</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  totalCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  totalLabel: { fontSize: 14, color: '#888' },
  totalValue: { fontSize: 48, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  pnlRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  pnl: { fontSize: 16, color: '#00d4ff' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  tokenCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: { fontSize: 18, fontWeight: 'bold', color: '#00d4ff' },
  tokenName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  tokenBalance: { fontSize: 14, color: '#888', marginTop: 2 },
  tokenValue: { alignItems: 'flex-end' },
  valueUsd: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  valuePercent: { fontSize: 12, color: '#888', marginTop: 2 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: { color: '#888', fontSize: 14, marginTop: 16 },
});