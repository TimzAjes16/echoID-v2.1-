import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../state/useStore';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const { wallet, profile } = useStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/profile')}>
          <Ionicons name="person-outline" size={24} color="#333" />
          <Text style={styles.settingLabel}>Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <Ionicons name="wallet-outline" size={24} color="#333" />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Wallet Address</Text>
            <Text style={styles.settingValue} selectable>
              {wallet.address || 'Not connected'}
            </Text>
          </View>
        </View>

        <View style={styles.settingItem}>
          <Ionicons name="link-outline" size={24} color="#333" />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Chain</Text>
            <Text style={styles.settingValue}>
              {wallet.chainId === 8453 ? 'Base' : wallet.chainId === 420 ? 'Base Nova' : wallet.chainId || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingItem}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>

        <View style={styles.settingItem}>
          <Ionicons name="mail-outline" size={24} color="#333" />
          <Text style={styles.settingLabel}>Email Notifications</Text>
          <Switch
            value={false}
            onValueChange={() => {}}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Data</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/privacy')}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#333" />
          <Text style={styles.settingLabel}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/data-rights')}>
          <Ionicons name="document-text-outline" size={24} color="#333" />
          <Text style={styles.settingLabel}>Your Data Rights (UK GDPR)</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <Ionicons name="analytics-outline" size={24} color="#333" />
          <Text style={styles.settingLabel}>Analytics & Tracking</Text>
          <Switch
            value={analyticsEnabled}
            onValueChange={setAnalyticsEnabled}
          />
        </View>

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/export-data')}>
          <Ionicons name="download-outline" size={24} color="#333" />
          <Text style={styles.settingLabel}>Export My Data</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/delete-account')}>
          <Ionicons name="trash-outline" size={24} color="#F44336" />
          <Text style={[styles.settingLabel, styles.dangerText]}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/terms')}>
          <Ionicons name="document-outline" size={24} color="#333" />
          <Text style={styles.settingLabel}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/privacy')}>
          <Ionicons name="lock-closed-outline" size={24} color="#333" />
          <Text style={styles.settingLabel}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/cookies')}>
          <Ionicons name="cookie-outline" size={24} color="#333" />
          <Text style={styles.settingLabel}>Cookie Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.settingItem}>
          <Ionicons name="information-circle-outline" size={24} color="#333" />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/help')}>
          <Ionicons name="help-circle-outline" size={24} color="#333" />
          <Text style={styles.settingLabel}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  dangerText: {
    color: '#F44336',
  },
});

