import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userEmail = await AsyncStorage.getItem('user_email');
    const walletAddress = await AsyncStorage.getItem('wallet_address');
    setEmail(userEmail || '');
    setAddress(walletAddress || '');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.setItem('is_logged_in', 'false');
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Data',
      'This will remove all local data. Your wallet will remain safe.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => Alert.alert('Success', 'Local data cleared'),
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#0f0f23', '#1a1a3e', '#2d2d5f']}
      style={styles.container}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="email" size={20} color="#888" />
              <Text style={styles.label}>Email</Text>
            </View>
            <Text style={styles.value}>{email}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="wallet" size={20} color="#888" />
              <Text style={styles.label}>Wallet</Text>
            </View>
            <Text style={styles.valueSmall} numberOfLines={1}>{address}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#00d4ff" />
              <Text style={styles.label}>Base Sepolia Testnet</Text>
            </View>
            <Text style={styles.networkStatus}>Locked</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleClearData}>
            <MaterialCommunityIcons name="delete" size={20} color="#888" />
            <Text style={styles.actionText}>Clear Local Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#ff4444" />
            <Text style={[styles.actionText, { color: '#ff4444' }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>JASPR v1.0.0</Text>
        <Text style={styles.disclaimer}>Base Sepolia Testnet • For Testing Only</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 32 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#888', marginBottom: 12 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.1)',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  label: { fontSize: 14, color: '#888' },
  value: { fontSize: 16, color: '#fff', fontWeight: '600' },
  valueSmall: { fontSize: 12, color: '#fff', fontFamily: 'monospace' },
  networkStatus: { fontSize: 12, color: '#00d4ff', marginTop: 4 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  actionText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  version: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 32 },
  disclaimer: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 8 },
});