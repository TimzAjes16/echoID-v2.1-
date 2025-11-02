import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, useColorScheme, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../state/useStore';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors, type ThemeMode } from '../../lib/theme';
import { runCompleteExpoTokenTest } from '../../lib/testExpoToken';
import * as SQLite from 'expo-sqlite';

export default function SettingsScreen() {
  const router = useRouter();
  const { wallet, profile, themeMode, setThemeMode, loadThemeMode, blockedUsers, unblockUser, loadBlockedUsers } = useStore();
  const systemColorScheme = useColorScheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [testingExpoToken, setTestingExpoToken] = useState(false);
  
  const colors = getThemeColors(themeMode, systemColorScheme);
  const styles = createStyles(colors);

  useEffect(() => {
    loadThemeMode();
    loadBlockedUsers();
  }, []);

  const handleThemeChange = async (value: boolean) => {
    const newMode: ThemeMode = value ? 'dark' : 'light';
    await setThemeMode(newMode);
  };

  const isDarkMode = themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark');

  const handleUnblock = async (user: string) => {
    Alert.alert(
      'Unblock User',
      `Unblock ${user}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            await unblockUser(user);
            Alert.alert('Success', `${user} has been unblocked`);
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        
        <View style={styles.settingItem}>
          <Ionicons name={isDarkMode ? "moon" : "sunny-outline"} size={24} color={colors.text} />
          <Text style={styles.settingLabel}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={handleThemeChange}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isDarkMode ? colors.surface : colors.surface}
          />
        </View>

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={async () => {
            const modes: ThemeMode[] = ['light', 'dark', 'auto'];
            const currentIndex = modes.indexOf(themeMode);
            const nextMode = modes[(currentIndex + 1) % modes.length];
            await setThemeMode(nextMode);
          }}
        >
          <Ionicons name="color-palette-outline" size={24} color={colors.text} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Theme Mode</Text>
            <Text style={styles.settingValue}>
              {themeMode === 'auto' ? 'Automatic (System)' : themeMode === 'dark' ? 'Dark' : 'Light'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/profile')}>
          <Ionicons name="person-outline" size={24} color={colors.text} />
          <Text style={styles.settingLabel}>Profile</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <Ionicons name="wallet-outline" size={24} color={colors.text} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Wallet Address</Text>
            <Text style={styles.settingValue} selectable>
              {wallet.address || 'Not connected'}
            </Text>
          </View>
        </View>

        <View style={styles.settingItem}>
          <Ionicons name="link-outline" size={24} color={colors.text} />
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
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>

        <View style={styles.settingItem}>
          <Ionicons name="mail-outline" size={24} color={colors.text} />
          <Text style={styles.settingLabel}>Email Notifications</Text>
          <Switch
            value={false}
            onValueChange={() => {}}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={async () => {
            setTestingExpoToken(true);
            try {
              const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
              const results = await runCompleteExpoTokenTest(API_BASE_URL);
              
              const successCount = [
                results.pushTokenTest.success,
                results.backendConfigTest.success,
                results.sendNotificationTest.success,
              ].filter(Boolean).length;

              Alert.alert(
                'Expo Token Test Results',
                `Tests completed: ${successCount}/3 passed\n\n` +
                `Push Token: ${results.pushTokenTest.success ? '✅' : '❌'} ${results.pushTokenTest.error || results.pushTokenTest.token?.substring(0, 20) + '...'}\n` +
                `Backend Config: ${results.backendConfigTest.success ? '✅' : '❌'} ${results.backendConfigTest.error || 'OK'}\n` +
                `Send Notification: ${results.sendNotificationTest.success ? '✅' : '❌'} ${results.sendNotificationTest.error || 'Sent'}`,
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to run test');
            } finally {
              setTestingExpoToken(false);
            }
          }}
          disabled={testingExpoToken}
        >
          <Ionicons name="flash-outline" size={24} color={colors.text} />
          <Text style={styles.settingLabel}>Test Expo Token</Text>
          {testingExpoToken ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Data</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/privacy')}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.text} />
          <Text style={styles.settingLabel}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/data-rights')}>
          <Ionicons name="document-text-outline" size={24} color={colors.text} />
          <Text style={styles.settingLabel}>Your Data Rights (UK GDPR)</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <Ionicons name="analytics-outline" size={24} color={colors.text} />
          <Text style={styles.settingLabel}>Analytics & Tracking</Text>
          <Switch
            value={analyticsEnabled}
            onValueChange={setAnalyticsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/export-data')}>
          <Ionicons name="download-outline" size={24} color={colors.text} />
          <Text style={styles.settingLabel}>Export My Data</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/delete-account')}>
          <Ionicons name="trash-outline" size={24} color={colors.error} />
          <Text style={[styles.settingLabel, styles.dangerText]}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blocked Users</Text>
        
        {blockedUsers.length === 0 ? (
          <View style={styles.settingItem}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.textSecondary} />
            <Text style={[styles.settingLabel, { color: colors.textSecondary }]}>
              No blocked users
            </Text>
          </View>
        ) : (
          blockedUsers.map((user) => (
            <TouchableOpacity
              key={user}
              style={styles.settingItem}
              onPress={() => handleUnblock(user)}
            >
              <Ionicons name="ban" size={24} color={colors.error} />
              <Text style={styles.settingLabel}>{user.startsWith('0x') ? `${user.slice(0, 8)}...${user.slice(-6)}` : `@${user}`}</Text>
              <TouchableOpacity
                onPress={() => handleUnblock(user)}
                style={{ padding: 4 }}
              >
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/terms')}>
          <Ionicons name="document-outline" size={24} color={colors.text} />
          <Text style={styles.settingLabel}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/privacy')}>
          <Ionicons name="lock-closed-outline" size={24} color={colors.text} />
          <Text style={styles.settingLabel}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/cookies')}>
          <Ionicons name="cookie-outline" size={24} color={colors.text} />
          <Text style={styles.settingLabel}>Cookie Policy</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.settingItem}>
          <Ionicons name="information-circle-outline" size={24} color={colors.text} />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/(main)/help')}>
          <Ionicons name="help-circle-outline" size={24} color={colors.text} />
          <Text style={styles.settingLabel}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer</Text>
        
        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={async () => {
            Alert.alert(
              'Clear All Chat Data',
              'This will delete all chat messages from your local database. This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const db = await SQLite.openDatabaseAsync('echoid_chat.db');
                      await db.execAsync('DELETE FROM messages;');
                      Alert.alert('Success', 'All chat messages deleted');
                    } catch (error) {
                      console.error('Failed to clear chat:', error);
                      Alert.alert('Error', 'Failed to clear chat data');
                    }
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={24} color={colors.error} />
          <Text style={[styles.settingLabel, { color: colors.error }]}>Clear All Chat Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof getThemeColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      backgroundColor: colors.surface,
      marginTop: 16,
      paddingVertical: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      textTransform: 'uppercase',
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingContent: {
      flex: 1,
      marginLeft: 12,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
      flex: 1,
    },
    settingValue: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
      fontFamily: 'monospace',
    },
    dangerText: {
      color: colors.error,
    },
  });
}

