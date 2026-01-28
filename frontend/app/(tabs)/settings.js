import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

export default function SettingsPage() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const loadSettings = async () => {
    try {
      const address = await AsyncStorage.getItem('wallet_address');
      setWalletAddress(address || '');
    } catch (error) {
      console.error('Load settings error:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const handleExportKey = () => {
    Alert.alert(
      '⚠️ Export Private Key',
      'Your private key gives FULL control of your wallet. Never share it!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Show Key', 
          style: 'destructive', 
          onPress: async () => {
            const pk = await AsyncStorage.getItem('wallet_private_key');
            Alert.alert('Private Key', pk || 'Not found', [
              { text: 'Copy', onPress: () => Clipboard.setStringAsync(pk || '') },
              { text: 'Done' }
            ]);
          }
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete your wallet and all local data. Make sure you have backed up your private key!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Data', 
          style: 'destructive', 
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/');
          }
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/auth');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a1a', '#0d1f3c', '#0a0a1a']} style={styles.gradient}>
        <ScrollView style={styles.scroll}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.title}>Settings</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Wallet Section */}
            <Text style={styles.sectionTitle}>Wallet</Text>
            <View style={styles.card}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="wallet" size={22} color="#00FFF0" />
                  <View>
                    <Text style={styles.settingLabel}>Wallet Address</Text>
                    <Text style={styles.settingValue}>
                      {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : 'Not set'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => Clipboard.setStringAsync(walletAddress)}>
                  <MaterialCommunityIcons name="content-copy" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.settingItem} onPress={handleExportKey}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="key" size={22} color="#FF9800" />
                  <Text style={styles.settingLabel}>Export Private Key</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Network Section */}
            <Text style={styles.sectionTitle}>Network</Text>
            <View style={styles.card}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="web" size={22} color="#00FFA3" />
                  <View>
                    <Text style={styles.settingLabel}>Network</Text>
                    <Text style={styles.settingValue}>Base Sepolia Testnet</Text>
                  </View>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Testnet</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="link-variant" size={22} color="#888" />
                  <View>
                    <Text style={styles.settingLabel}>RPC URL</Text>
                    <Text style={styles.settingValue}>https://sepolia.base.org</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="identifier" size={22} color="#888" />
                  <View>
                    <Text style={styles.settingLabel}>Chain ID</Text>
                    <Text style={styles.settingValue}>84532</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Preferences Section */}
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.card}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="bell" size={22} color="#00FFF0" />
                  <Text style={styles.settingLabel}>Notifications</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#333', true: 'rgba(0, 255, 240, 0.3)' }}
                  thumbColor={notificationsEnabled ? '#00FFF0' : '#666'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="fingerprint" size={22} color="#888" />
                  <Text style={styles.settingLabel}>Biometric Unlock</Text>
                </View>
                <Switch
                  value={biometricsEnabled}
                  onValueChange={setBiometricsEnabled}
                  trackColor={{ false: '#333', true: 'rgba(0, 255, 240, 0.3)' }}
                  thumbColor={biometricsEnabled ? '#00FFF0' : '#666'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="theme-light-dark" size={22} color="#888" />
                  <Text style={styles.settingLabel}>Dark Mode</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#333', true: 'rgba(0, 255, 240, 0.3)' }}
                  thumbColor={darkMode ? '#00FFF0' : '#666'}
                />
              </View>
            </View>

            {/* About Section */}
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.card}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="information" size={22} color="#888" />
                  <View>
                    <Text style={styles.settingLabel}>Version</Text>
                    <Text style={styles.settingValue}>1.0.0 (Beta)</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="file-document" size={22} color="#888" />
                  <Text style={styles.settingLabel}>Terms of Service</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="shield-check" size={22} color="#888" />
                  <Text style={styles.settingLabel}>Privacy Policy</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Danger Zone */}
            <Text style={[styles.sectionTitle, { color: '#FF4444' }]}>Danger Zone</Text>
            <View style={[styles.card, { borderColor: 'rgba(255, 68, 68, 0.3)' }]}>
              <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="delete" size={22} color="#FF4444" />
                  <Text style={[styles.settingLabel, { color: '#FF4444' }]}>Clear All Data</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="logout" size={22} color="#FF4444" />
                  <Text style={[styles.settingLabel, { color: '#FF4444' }]}>Logout</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Jaspr Wallet</Text>
              <Text style={styles.footerSubtext}>Self-Custodial • Decentralized</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 50, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  settingLabel: { fontSize: 16, color: '#FFF' },
  settingValue: { fontSize: 13, color: '#888', marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
  },
  badge: {
    backgroundColor: 'rgba(0, 255, 163, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontSize: 12, color: '#00FFA3', fontWeight: '600' },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
  },
  footerText: { fontSize: 16, fontWeight: '700', color: '#00FFF0' },
  footerSubtext: { fontSize: 12, color: '#666', marginTop: 4 },
});
